/**
 * Webhook Cloud API (Meta) — recebe eventos `messages` (ex.: toque em resposta rápida).
 *
 * **Botão “Visitar site” (URL)** não gera evento aqui: só abre o browser. Para disparar esta
 * sequência, o template precisa de botão do tipo **Resposta rápida** com título “Verificar Conta”
 * (ou o ID/título configurado nos secrets).
 *
 * Configuração Meta: App → WhatsApp → Configuration → Webhook: assinar o campo `messages`.
 * URL: `https://<ref>.supabase.co/functions/v1/whatsapp-webhook`
 *
 * Secrets: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (GET challenge),
 * `WHATSAPP_APP_SECRET` (validação `X-Hub-Signature-256` em POST — tem de ser a **chave secreta do aplicativo**
 * em developers.facebook.com → **Seu app** → Configurações → **Básico**, não o token do WhatsApp).
 * Só depuração: `WHATSAPP_SKIP_SIGNATURE_VERIFY=true` ignora a assinatura (inseguro — remova depois).
 * Se o host não repassar `X-Hub-Signature-256`: `WHATSAPP_ALLOW_MISSING_SIGNATURE=true` (inseguro — último recurso).
 * **Se o 403 no POST continua:** na URL do webhook use `?wh_secret=...` igual a **`WHATSAPP_WEBHOOK_POST_SECRET`**
 * **ou** ao **`WHATSAPP_WEBHOOK_VERIFY_TOKEN`** (o mesmo do GET de verificação — assim um único secret basta).
 * Opcional para `{nome}` / e-mail na sequência: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (consulta `lastlink_purchases` pelo telefone).
 *
 * Qualquer outra mensagem recebida (texto, mídia, etc.) recebe uma resposta em **texto** com orientação de suporte
 * (`inboundNotice.ts`), exceto o toque em “Verificar Conta”, que dispara só a sequência de onboarding.
 */
import { sendWhatsAppTextMessage } from '../_shared/whatsappCloud.ts'
import { INBOUND_NOTICE_MESSAGE } from './inboundNotice.ts'
import { firstNameFromBuyer, lookupBuyerByWaPhone } from './lookupBuyer.ts'
import { BETWEEN_SEQUENCE_MS, buildVerifySequenceMessages } from './verifySequence.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-hub-signature-256',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function verifyTokenExpected(): string {
  return Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN')?.trim() ?? ''
}

function intEnv(key: string, defaultVal: number): number {
  const v = Deno.env.get(key)?.trim()
  if (!v) return defaultVal
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : defaultVal
}

function truthyEnv(key: string): boolean {
  const v = Deno.env.get(key)?.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

/** Alguns proxies alteram o corpo; a Meta assina os bytes brutos do POST. */
function getHubSignature256Header(req: Request): string | null {
  const direct =
    req.headers.get('X-Hub-Signature-256') ??
    req.headers.get('x-hub-signature-256')
  if (direct?.trim()) return direct.trim()
  for (const [k, v] of req.headers.entries()) {
    if (k.toLowerCase() === 'x-hub-signature-256' && v?.trim()) return v.trim()
  }
  return null
}

function extractSha256Candidates(signatureHeader: string): string[] {
  const out: string[] = []
  for (const part of signatureHeader.split(',')) {
    const p = part.trim()
    const lower = p.toLowerCase()
    if (lower.startsWith('sha256=')) {
      out.push(p.slice('sha256='.length).trim())
    }
  }
  return out
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const al = a.toLowerCase()
  const bl = b.toLowerCase()
  if (al.length !== bl.length) return false
  let diff = 0
  for (let i = 0; i < al.length; i++) {
    diff |= al.charCodeAt(i) ^ bl.charCodeAt(i)
  }
  return diff === 0
}

function timingSafeEqualUtf8(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/** Lê `wh_secret` da query (alguns hosts repassam `req.url` sem search — tenta só `req.url`). */
function whSecretFromRequestUrl(req: Request): string | null {
  try {
    const u = new URL(req.url)
    const w = u.searchParams.get('wh_secret')?.trim()
    return w || null
  } catch {
    return null
  }
}

/**
 * POST autenticado por `?wh_secret=` igual a `WHATSAPP_WEBHOOK_POST_SECRET` **ou**, se esse não existir,
 * igual a `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (mesmo valor do GET `hub.verify_token`). Assim o 403 some
 * quando você já usa o mesmo token na Meta (ex.: `wh_secret=agenze2026` + verify token `agenze2026`).
 */
function verifyPostUrlSecret(req: Request): boolean {
  const got = whSecretFromRequestUrl(req)
  if (!got) {
    console.warn(
      'whatsapp-webhook: query wh_secret ausente em req.url — confira se o deploy repassa a URL completa. req.url=',
      req.url?.slice(0, 180) ?? '',
    )
    return false
  }

  const postSecret = Deno.env.get('WHATSAPP_WEBHOOK_POST_SECRET')?.trim()
  if (postSecret && timingSafeEqualUtf8(postSecret, got)) return true

  const verifyTok = verifyTokenExpected()
  if (verifyTok && timingSafeEqualUtf8(verifyTok, got)) return true

  console.warn(
    'whatsapp-webhook: wh_secret na URL não confere com WHATSAPP_WEBHOOK_POST_SECRET nem WHATSAPP_WEBHOOK_VERIFY_TOKEN',
  )
  return false
}

async function verifyMetaSignature(bodyBytes: Uint8Array, signatureHeader: string | null): Promise<boolean> {
  if (truthyEnv('WHATSAPP_SKIP_SIGNATURE_VERIFY')) {
    console.error(
      'whatsapp-webhook: WHATSAPP_SKIP_SIGNATURE_VERIFY ativo — webhook inseguro; remova após testes',
    )
    return true
  }

  const secret = Deno.env.get('WHATSAPP_APP_SECRET')?.trim()
  if (!secret) {
    console.warn('WHATSAPP_APP_SECRET ausente — assinatura não validada (não use em produção)')
    return true
  }

  if (!signatureHeader) {
    if (truthyEnv('WHATSAPP_ALLOW_MISSING_SIGNATURE')) {
      console.error(
        'whatsapp-webhook: X-Hub-Signature-256 ausente — aceito por WHATSAPP_ALLOW_MISSING_SIGNATURE (inseguro)',
      )
      return true
    }
    console.error('whatsapp-webhook: cabeçalho X-Hub-Signature-256 ausente')
    return false
  }

  const candidates = extractSha256Candidates(signatureHeader)
  if (candidates.length === 0) {
    console.error('whatsapp-webhook: X-Hub-Signature-256 sem prefixo sha256=:', signatureHeader.slice(0, 80))
    return false
  }

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, bodyBytes as BufferSource)
  const expectedHex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')

  for (const recv of candidates) {
    if (timingSafeEqualHex(recv, expectedHex)) return true
  }

  console.error(
    'whatsapp-webhook: HMAC não confere — use o App Secret do **mesmo** app Meta em que o webhook WhatsApp está configurado (developers.facebook.com → App → Configurações → Básico). Não use token do WhatsApp. Se o secret foi regenerado, atualize no Supabase. Bytes do body:',
    bodyBytes.byteLength,
  )
  return false
}

type InboundMsg = {
  from?: string
  id?: string
  type?: string
  /** Formato legado em alguns eventos de resposta rápida. */
  button?: { text?: string; payload?: string }
  interactive?: {
    type?: string
    button_reply?: { id?: string; title?: string }
  }
}

function normalizeButtonLabel(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
}

/** Texto exibido no toque (resposta rápida), conforme vier na payload. */
function quickReplyLabel(m: InboundMsg): string | null {
  if (m.type === 'interactive' && m.interactive?.type === 'button_reply') {
    const t = m.interactive.button_reply?.title
    return t != null && String(t).trim() ? String(t).trim() : null
  }
  if (m.type === 'button' && m.button?.text?.trim()) {
    return m.button.text.trim()
  }
  return null
}

function quickReplyPayloadId(m: InboundMsg): string {
  if (m.type === 'interactive' && m.interactive?.type === 'button_reply') {
    return (m.interactive.button_reply?.id ?? '').trim()
  }
  if (m.type === 'button') {
    return (m.button?.payload ?? '').trim()
  }
  return ''
}

function isVerifyButtonClick(m: InboundMsg): boolean {
  const label = quickReplyLabel(m)
  const id = quickReplyPayloadId(m)

  const wantId = Deno.env.get('WHATSAPP_VERIFY_BUTTON_ID')?.trim()
  if (wantId && id === wantId) return true

  if (!label) return false

  const defaultTitle = 'Verificar Conta'
  const envTitle = Deno.env.get('WHATSAPP_VERIFY_BUTTON_TITLE')?.trim() || defaultTitle
  if (normalizeButtonLabel(label) === normalizeButtonLabel(envTitle)) return true

  const n = normalizeButtonLabel(label)
  if (n.includes('verificar') && n.includes('conta')) return true

  return false
}

function logUnmatchedQuickReply(m: InboundMsg): void {
  const label = quickReplyLabel(m)
  const id = quickReplyPayloadId(m)
  if (label || id) {
    console.warn(
      'whatsapp-webhook: resposta rápida não bate com “Verificar Conta”. ' +
        `title="${label ?? ''}" id="${id}". ` +
        'Ajuste o template (resposta rápida, não URL) ou defina WHATSAPP_VERIFY_BUTTON_ID / WHATSAPP_VERIFY_BUTTON_TITLE.',
    )
  }
}

/** Tipos que não são “mensagem” de conversa para aviso de suporte (evita ruído). */
const SKIP_INBOUND_NOTICE_TYPES = new Set(['reaction', 'system', 'unknown'])

function shouldSendInboundNotice(m: InboundMsg): boolean {
  if (!m.from) return false
  if (isVerifyButtonClick(m)) return false
  const t = m.type ?? ''
  if (SKIP_INBOUND_NOTICE_TYPES.has(t)) return false
  return true
}

function contactProfileName(
  value: { contacts?: Array<{ wa_id?: string; profile?: { name?: string } }> },
  from: string,
): string | null {
  const fd = from.replace(/\D/g, '')
  for (const c of value.contacts ?? []) {
    const wid = (c.wa_id ?? '').replace(/\D/g, '')
    if (c.wa_id && (c.wa_id === from || wid === fd)) {
      return c.profile?.name?.trim() || null
    }
  }
  return null
}

async function runVerifySequence(
  toDigits: string,
  ctx: { nome: string; email: string | null },
): Promise<void> {
  const msgs = buildVerifySequenceMessages(ctx).filter((s) => s.trim().length > 0)
  if (msgs.length === 0) {
    console.warn('Sequência de verificação vazia — nada a enviar')
    return
  }
  const gap = Math.max(0, intEnv('WHATSAPP_SEQUENCE_GAP_MS', BETWEEN_SEQUENCE_MS))
  for (let i = 0; i < msgs.length; i++) {
    if (i > 0 && gap > 0) {
      await new Promise<void>((r) => setTimeout(r, gap))
    }
    await sendWhatsAppTextMessage(toDigits, msgs[i]!)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const verifyTok = verifyTokenExpected()
  if (!verifyTok) {
    console.error('WHATSAPP_WEBHOOK_VERIFY_TOKEN não configurada')
    return new Response('Server misconfiguration', { status: 500, headers: corsHeaders })
  }

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    if (mode === 'subscribe' && token === verifyTok && challenge) {
      return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } })
    }
    return new Response('Forbidden', { status: 403, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const buf = await req.arrayBuffer()
  const bodyBytes = new Uint8Array(buf)
  const rawBody = new TextDecoder('utf-8').decode(bodyBytes)
  const sigHeader = getHubSignature256Header(req)
  const urlSecretOk = verifyPostUrlSecret(req)
  const sigOk = urlSecretOk || (await verifyMetaSignature(bodyBytes, sigHeader))
  if (!sigOk) {
    console.error(
      'whatsapp-webhook: falha na autenticação (HMAC e ?wh_secret=). Headers:',
      [...req.headers.keys()].map((k) => k.toLowerCase()).sort().join(', '),
    )
    return new Response('Invalid signature', { status: 403, headers: corsHeaders })
  }
  if (urlSecretOk) {
    console.log('whatsapp-webhook: POST aceito via wh_secret na URL (WHATSAPP_WEBHOOK_POST_SECRET)')
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response('Bad JSON', { status: 400, headers: corsHeaders })
  }

  const root = payload as {
    object?: string
    entry?: Array<{
      changes?: Array<{
        field?: string
        value?: {
          messages?: InboundMsg[]
          contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>
        }
      }>
    }>
  }

  if (root.object !== 'whatsapp_business_account') {
    console.warn('whatsapp-webhook: object ignorado:', root.object ?? '(vazio)')
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  for (const entry of root.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field && change.field !== 'messages') {
        console.log('whatsapp-webhook: change.field ignorado:', change.field)
        continue
      }
      const value = change.value
      const messages = value?.messages
      if (!messages?.length) continue

      for (const m of messages) {
        if (!m.from) continue

        console.log('whatsapp-webhook: mensagem', {
          type: m.type,
          interactiveType: m.interactive?.type,
          quickReplyTitle: quickReplyLabel(m),
          quickReplyId: quickReplyPayloadId(m) || undefined,
          wamid: m.id,
        })

        if (isVerifyButtonClick(m)) {
          console.log('whatsapp-webhook: reconhecido Verificar Conta — iniciando sequência')
          try {
            const row = await lookupBuyerByWaPhone(m.from)
            const profile = value ? contactProfileName(value, m.from) : null
            const nome = firstNameFromBuyer(row?.buyer_name ?? profile ?? undefined)
            const email = row?.buyer_email?.trim() || null
            await runVerifySequence(m.from, { nome, email })
            console.log('whatsapp-webhook: sequência de verificação concluída')
          } catch (e) {
            console.error('WhatsApp sequência verificação:', e instanceof Error ? e.message : e)
          }
          continue
        }

        if (m.type === 'interactive' || m.type === 'button') {
          logUnmatchedQuickReply(m)
        }

        if (shouldSendInboundNotice(m)) {
          try {
            await sendWhatsAppTextMessage(m.from, INBOUND_NOTICE_MESSAGE)
          } catch (e) {
            console.error('WhatsApp aviso inbound:', e instanceof Error ? e.message : e)
          }
        }
      }
    }
  }

  return new Response('ok', { status: 200, headers: corsHeaders })
})
