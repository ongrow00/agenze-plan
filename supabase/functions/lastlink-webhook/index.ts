import { createClient } from 'npm:@supabase/supabase-js@2'
import { revokeCircleAccess, syncCircleAccess } from './circle.ts'
import { mapLastlinkToRow, unwrapWebhookBody, type LastlinkRoot } from './mapPayload.ts'
import { resolvePlanTier } from './resolveTier.ts'
import { sendConfiguracaoContaTemplate } from './whatsapp.ts'

/**
 * Eventos LastLink que cancelam acesso no Circle vêm no campo `Event` do JSON
 * (ex.: Payment_Refund, Payment_Chargeback), não no nome do produto.
 * @see https://support.lastlink.com/pt-BR/articles/12587805-documentacao-de-webhook-da-lastlink
 */
const REVOKE_ACCESS_EVENTS = new Set(['payment_refund', 'payment_chargeback'])

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-lastlink-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

function eventKey(raw: string | undefined): string {
  return (raw ?? '').trim().toLowerCase()
}

/** Um ou mais tokens: vírgula em `LASTLINK_WEBHOOK_TOKEN` e/ou secret opcional `LASTLINK_WEBHOOK_TOKEN_2`. */
async function tryWhatsappPurchaseConfirmed(
  phone: string | null | undefined,
  name: string | null | undefined,
): Promise<void> {
  try {
    await sendConfiguracaoContaTemplate(phone, name)
  } catch (e) {
    console.error('WhatsApp compra:', e instanceof Error ? e.message : e)
  }
}

function getAllowedLastlinkTokens(): string[] {
  const a = Deno.env.get('LASTLINK_WEBHOOK_TOKEN') ?? ''
  const b = Deno.env.get('LASTLINK_WEBHOOK_TOKEN_2') ?? ''
  const parts = [...a.split(','), ...b.split(',')]
    .map((t) => t.trim())
    .filter(Boolean)
  return [...new Set(parts)]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const allowed = getAllowedLastlinkTokens()
  if (allowed.length === 0) {
    console.error('LASTLINK_WEBHOOK_TOKEN (ou _2) não configurada')
    return json({ error: 'Server misconfiguration' }, 500)
  }

  const token = req.headers.get('x-lastlink-token')?.trim()
  if (!token || !allowed.includes(token)) {
    return json({ error: 'Unauthorized' }, 401)
  }

  let root: LastlinkRoot
  try {
    const raw = await req.json()
    root = unwrapWebhookBody(raw)
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const ev = eventKey(root.Event)

  if (ev !== 'purchase_order_confirmed' && !REVOKE_ACCESS_EVENTS.has(ev)) {
    return json({ ok: true, ignored: true, event: root.Event ?? null })
  }

  if (!root.Id?.trim()) {
    return json({ error: 'Missing Id' }, 400)
  }

  const data = root.Data
  const email = data?.Buyer?.Email?.trim()
  if (!email) {
    return json({ error: 'Missing Buyer.Email' }, 400)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Supabase env missing' }, 500)
  }

  const sb = createClient(supabaseUrl, serviceKey)

  if (REVOKE_ACCESS_EVENTS.has(ev)) {
    const row = mapLastlinkToRow(root)
    row.plan_tier = null
    row.buyer_email = email
    row.circle_status = 'pending'

    const { data: inserted, error: insErr } = await sb
      .from('lastlink_purchases')
      .insert(row)
      .select('id')
      .maybeSingle()

    if (insErr) {
      if (insErr.code === '23505') {
        return json({ ok: true, duplicate: true, kind: 'revoke_access', event: root.Event })
      }
      console.error('lastlink refund insert:', insErr.message)
      return json({ error: insErr.message }, 500)
    }

    if (!inserted?.id) {
      return json({ error: 'Insert returned no id' }, 500)
    }

    const id = inserted.id as string

    if (!Deno.env.get('CIRCLE_API_TOKEN')?.trim()) {
      await sb
        .from('lastlink_purchases')
        .update({
          circle_status: 'skipped_no_token',
          circle_error: 'CIRCLE_API_TOKEN não configurada',
          circle_synced_at: new Date().toISOString(),
        })
        .eq('id', id)
      return json({ ok: true, id, circle: 'skipped_no_token', kind: 'revoke_access', event: root.Event })
    }

    try {
      await revokeCircleAccess(email)
      await sb
        .from('lastlink_purchases')
        .update({
          circle_status: 'revoked',
          circle_error: null,
          circle_synced_at: new Date().toISOString(),
        })
        .eq('id', id)
      return json({ ok: true, id, circle: 'revoked', kind: 'revoke_access', event: root.Event })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('Circle refund error:', msg)
      await sb
        .from('lastlink_purchases')
        .update({
          circle_status: 'revoke_error',
          circle_error: msg.slice(0, 2000),
          circle_synced_at: new Date().toISOString(),
        })
        .eq('id', id)
      return json({ ok: false, id, circle: 'revoke_error', error: msg, kind: 'revoke_access', event: root.Event }, 200)
    }
  }

  // purchase_order_confirmed
  const tier = resolvePlanTier(data)
  const row = mapLastlinkToRow(root)
  row.plan_tier = tier
  row.buyer_email = email

  const { data: inserted, error: insErr } = await sb
    .from('lastlink_purchases')
    .insert(row)
    .select('id')
    .maybeSingle()

  if (insErr) {
    if (insErr.code === '23505') {
      return json({ ok: true, duplicate: true })
    }
    console.error('lastlink insert:', insErr.message)
    return json({ error: insErr.message }, 500)
  }

  if (!inserted?.id) {
    return json({ error: 'Insert returned no id' }, 500)
  }

  const id = inserted.id as string

  if (tier === 'unknown') {
    await sb
      .from('lastlink_purchases')
      .update({
        circle_status: 'skipped_no_tier',
        circle_error: 'Payload sem Products[]: não é possível classificar o plano',
        circle_synced_at: new Date().toISOString(),
      })
      .eq('id', id)

    await tryWhatsappPurchaseConfirmed(data?.Buyer?.PhoneNumber, data?.Buyer?.Name)
    return json({ ok: true, id, plan_tier: tier, circle: 'skipped_no_tier' })
  }

  const circleConfigured = Boolean(Deno.env.get('CIRCLE_API_TOKEN')?.trim())
  if (!circleConfigured) {
    await sb
      .from('lastlink_purchases')
      .update({
        circle_status: 'skipped_no_token',
        circle_error: 'CIRCLE_API_TOKEN não configurada',
        circle_synced_at: new Date().toISOString(),
      })
      .eq('id', id)

    await tryWhatsappPurchaseConfirmed(data?.Buyer?.PhoneNumber, data?.Buyer?.Name)
    return json({ ok: true, id, plan_tier: tier, circle: 'skipped_no_token' })
  }

  try {
    await syncCircleAccess(email, data?.Buyer?.Name ?? null, tier)
    await sb
      .from('lastlink_purchases')
      .update({
        circle_status: 'ok',
        circle_error: null,
        circle_synced_at: new Date().toISOString(),
      })
      .eq('id', id)

    await tryWhatsappPurchaseConfirmed(data?.Buyer?.PhoneNumber, data?.Buyer?.Name)
    return json({ ok: true, id, plan_tier: tier, circle: 'ok' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Circle error:', msg)
    await sb
      .from('lastlink_purchases')
      .update({
        circle_status: 'error',
        circle_error: msg.slice(0, 2000),
        circle_synced_at: new Date().toISOString(),
      })
      .eq('id', id)

    await tryWhatsappPurchaseConfirmed(data?.Buyer?.PhoneNumber, data?.Buyer?.Name)
    return json({ ok: false, id, plan_tier: tier, circle: 'error', error: msg }, 200)
  }
})
