/** WhatsApp Cloud API (Meta) — template após compra aprovada. */

import { sendWhatsAppTextMessage } from '../_shared/whatsappCloud.ts'

export { sendWhatsAppTextMessage }

/** ID do número de envio (Cloud API). Conta WABA de referência: 886941007585095. */
const WHATSAPP_PHONE_NUMBER_ID = '938370552696935'

const TEMPLATE_NAME = 'configuracao_de_conta_v1'
const HEADER_IMAGE_URL =
  'https://cdn.prod.website-files.com/69723312d021399fbcaaa7c2/69833e8f9fad29ac0cf0cc7f_Frame%201.png'

/** Corresponde a {{2}} no corpo do template (ex.: "Verifique {{2}} para concluir…"). */
const DEFAULT_BODY_PARAM_2 = 'seu número para liberar seu acesso e'

const GRAPH_API_VERSION = Deno.env.get('WHATSAPP_GRAPH_VERSION')?.trim() || 'v21.0'

/** Após compra: aguarda antes do envio do template (a resposta HTTP do webhook só volta depois). */
const WHATSAPP_AFTER_PURCHASE_DELAY_MS = 35_000

function graphUrl(): string {
  return `https://graph.facebook.com/${GRAPH_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`
}

function intEnv(key: string, defaultVal: number): number {
  const v = Deno.env.get(key)?.trim()
  if (!v) return defaultVal
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : defaultVal
}

/** Quantos parâmetros o HEADER do template tem na Meta (0 = imagem fixa no painel; 1 = imagem por URL na API). */
function templateHeaderParamCount(): number {
  return intEnv('WHATSAPP_TEMPLATE_HEADER_PARAM_COUNT', 1)
}

/** Quantos parâmetros de texto o BODY tem ({{1}}, {{2}}, …). */
function templateBodyParamCount(): number {
  return intEnv('WHATSAPP_TEMPLATE_BODY_PARAM_COUNT', 2)
}

/** `to` na API: só dígitos, com código do país (sem +). */
export function normalizeWhatsAppTo(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return null
  return digits
}

export function firstNameFromBuyer(name: string | null | undefined): string {
  const t = (name ?? '').trim()
  if (!t) return 'Cliente'
  const first = t.split(/\s+/)[0] ?? t
  return first.slice(0, 60) || 'Cliente'
}

function templateLanguageCode(): string {
  return Deno.env.get('WHATSAPP_TEMPLATE_LANGUAGE')?.trim() || 'pt_BR'
}

/**
 * Monta `components` conforme o template aprovado na Meta (#132000 = contagem errada).
 * - HEADER com 0 params: não enviar bloco `header` (imagem fixa no modelo).
 * - HEADER com 1 param: enviar `image.link` (modelo com mídia variável no header).
 * - BODY: {{1}} = primeiro nome; {{2}} = `WHATSAPP_TEMPLATE_BODY_PARAM_2` ou default fixo do produto.
 */
function buildTemplateComponents(firstName: string): Array<Record<string, unknown>> {
  const components: Array<Record<string, unknown>> = []

  const h = templateHeaderParamCount()
  if (h === 1) {
    components.push({
      type: 'header',
      parameters: [
        {
          type: 'image',
          image: { link: HEADER_IMAGE_URL },
        },
      ],
    })
  } else if (h > 1) {
    throw new Error(
      `WHATSAPP_TEMPLATE_HEADER_PARAM_COUNT=${h} não suportado (só 0 ou 1). Ajusta o secret ou o código.`,
    )
  }

  const b = templateBodyParamCount()
  if (b > 0) {
    const params: Array<{ type: string; text: string }> = []
    params.push({ type: 'text', text: firstName })
    for (let i = 1; i < b; i++) {
      const idx = i + 1
      const fromEnv = Deno.env.get(`WHATSAPP_TEMPLATE_BODY_PARAM_${idx}`)?.trim()
      const raw =
        fromEnv !== undefined && fromEnv !== ''
          ? fromEnv
          : idx === 2
            ? DEFAULT_BODY_PARAM_2
            : ''
      params.push({ type: 'text', text: raw.slice(0, 1024) })
    }
    components.push({
      type: 'body',
      parameters: params,
    })
  }

  return components
}

/**
 * Envia template `configuracao_de_conta_v1`.
 * Secrets: `WHATSAPP_ACCESS_TOKEN` (obrigatório).
 * Opcionais: `WHATSAPP_TEMPLATE_HEADER_PARAM_COUNT` (default **1**; use **0** se a imagem for só fixa no Meta),
 * `WHATSAPP_TEMPLATE_BODY_PARAM_COUNT` (default **2**), `WHATSAPP_TEMPLATE_BODY_PARAM_2` (sobrescreve o texto de {{2}}).
 * Espera **35s** após validar envio (antes da chamada à Meta); a resposta do webhook LastLink só ocorre depois desse tempo.
 */
export async function sendConfiguracaoContaTemplate(
  buyerPhone: string | null | undefined,
  buyerName: string | null | undefined,
): Promise<void> {
  const token = Deno.env.get('WHATSAPP_ACCESS_TOKEN')?.trim()
  if (!token) {
    console.warn('WHATSAPP_ACCESS_TOKEN não configurada — skip WhatsApp')
    return
  }

  const to = normalizeWhatsAppTo(buyerPhone)
  if (!to) {
    console.warn('Buyer sem PhoneNumber válido — skip WhatsApp')
    return
  }

  const first = firstNameFromBuyer(buyerName)
  const components = buildTemplateComponents(first)

  if (components.length === 0) {
    console.warn(
      'WhatsApp: HEADER_PARAM_COUNT=0 e BODY_PARAM_COUNT=0 — nada a enviar; verifica o template na Meta',
    )
    return
  }

  await new Promise<void>((resolve) => setTimeout(resolve, WHATSAPP_AFTER_PURCHASE_DELAY_MS))

  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: TEMPLATE_NAME,
      language: { code: templateLanguageCode() },
      components,
    },
  }

  const res = await fetch(graphUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    let detail = await res.text()
    try {
      const j = JSON.parse(detail) as { error?: { message?: string } }
      detail = j.error?.message ?? detail
    } catch {
      /* keep text */
    }
    throw new Error(`WhatsApp API ${res.status}: ${detail}`)
  }
}
