import { createClient } from 'npm:@supabase/supabase-js@2'
import { GoogleGenAI } from 'npm:@google/genai'
import { COURSES } from './courses.ts'
import { buildPrompt, type ScorePayload } from './prompt.ts'
import { electiveBounds, electiveCatalog, enrichPlan } from './planEnrich.ts'
import {
  buildAllowedLinkSet,
  buildLessonKeyToCanonicalMap,
  normalizePlanLinks,
  validateAiPlan,
  validateEnrichedPlan,
} from './validate.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// deno-lint-ignore no-explicit-any
function parsePlan(raw: string): any {
  const cleaned = raw
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim()
  if (!cleaned) {
    throw new Error('Resposta vazia do modelo de IA')
  }

  try {
    return JSON.parse(cleaned)
  } catch {
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const maybeJson = cleaned.slice(firstBrace, lastBrace + 1)
      return JSON.parse(maybeJson)
    }
    throw new Error('Resposta da IA não está em JSON válido')
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { contact, score, planId, answersSummary } = body as {
      contact?: { name?: string; email?: string; phone?: string }
      score?: ScorePayload
      planId?: string
      answersSummary?: string
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('VITE_GEMINI_API_KEY')
    if (!supabaseUrl) throw new Error('SUPABASE_URL não configurada na Edge Function')
    if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada na Edge Function')
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY (ou VITE_GEMINI_API_KEY) não configurada na Edge Function')
    }
    if (!contact?.name || !contact?.email) throw new Error('Dados de contato inválidos')
    if (!score?.profileId || !score?.profileName) throw new Error('Score inválido para geração do plano')
    if (!planId) throw new Error('planId ausente na requisição')

    const sb = createClient(supabaseUrl, serviceRoleKey)
    const ai = new GoogleGenAI({ apiKey: geminiKey })

    const { data: leadData, error: leadError } = await sb
      .from('leads')
      .insert({
        name: contact.name,
        email: contact.email,
        phone: contact.phone || null,
        profile_id: score.profileId,
        score: score.dimensions,
        answers: body.answers ?? {},
        objetivo: score.objetivo,
        nicho: score.nicho,
      })
      .select('id')
      .single()

    if (leadError) throw new Error(`lead: ${leadError.message}`)

    const summaryText = typeof answersSummary === 'string' ? answersSummary : ''
    let prompt = buildPrompt(score, contact.name, summaryText)

    const electives = electiveCatalog(score, COURSES)
    const allowedElectiveLinks = buildAllowedLinkSet(electives.map((c) => c.link))
    const { min: electiveMin, max: electiveMax } = electiveBounds(COURSES)
    const lessonKeyToCanonical = buildLessonKeyToCanonicalMap(COURSES)

    const runPipeline = (raw: string) => {
      const p = parsePlan(raw)
      normalizePlanLinks(p, lessonKeyToCanonical)
      const vAi = validateAiPlan(p, allowedElectiveLinks, electiveMin, electiveMax)
      if (!vAi.ok) return { plan: null as unknown, errors: vAi.errors }
      enrichPlan(p, score, COURSES)
      normalizePlanLinks(p, lessonKeyToCanonical)
      const vEn = validateEnrichedPlan(p, COURSES)
      if (!vEn.ok) return { plan: null as unknown, errors: vEn.errors }
      return { plan: p, errors: [] as string[] }
    }

    let response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.65, maxOutputTokens: 32768 },
    })

    let out = runPipeline(response.text ?? '')
    if (!out.plan) {
      console.warn('generate-plan: validação falhou, tentando correção', out.errors)
      const fixPrompt =
        prompt +
        `\n\n## CORREÇÃO OBRIGATÓRIA\nA resposta anterior tinha problemas:\n${out.errors.map((e) => `- ${e}`).join('\n')}\n\nGere NOVAMENTE o JSON completo e válido. Use **apenas** links do catálogo eletivo. Quantidade de aulas **eletivas** entre ${electiveMin} e ${electiveMax} (o sistema acrescenta depois as obrigatórias e o onboarding "Comece por aqui").`
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fixPrompt,
        config: { temperature: 0.32, maxOutputTokens: 32768 },
      })
      out = runPipeline(response.text ?? '')
      if (!out.plan) {
        throw new Error(`Plano rejeitado: ${out.errors.join(' | ')}`)
      }
    }

    const plan = out.plan

    const { error: planError } = await sb
      .from('plans')
      .insert({
        id: planId,
        lead_id: leadData.id,
        profile_id: score.profileId,
        content: plan,
        aula_count: plan.aulaCount ?? 0,
      })

    if (planError) throw new Error(`plan: ${planError.message}`)

    await sb.from('plan_progress').insert({
      plan_id: planId,
      lead_id: leadData.id,
      checked_aulas: {},
      checked_impls: {},
    })

    return new Response(JSON.stringify({ plan, planId, leadId: leadData.id }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('generate-plan error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
