/** Chamadas comuns à Cloud API (envio de mensagens). */

const WHATSAPP_PHONE_NUMBER_ID = '938370552696935'
const GRAPH_API_VERSION = Deno.env.get('WHATSAPP_GRAPH_VERSION')?.trim() || 'v21.0'

function messagesUrl(): string {
  return `https://graph.facebook.com/${GRAPH_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`
}

/**
 * Mensagem de sessão (texto). Use após o usuário interagir (ex.: resposta rápida).
 * `toDigits`: E.164 sem + (campo `from` do webhook).
 */
export async function sendWhatsAppTextMessage(toDigits: string, textBody: string): Promise<void> {
  const token = Deno.env.get('WHATSAPP_ACCESS_TOKEN')?.trim()
  if (!token) {
    throw new Error('WHATSAPP_ACCESS_TOKEN não configurada')
  }

  const body = {
    messaging_product: 'whatsapp',
    to: toDigits,
    type: 'text',
    text: { preview_url: false, body: textBody.slice(0, 4096) },
  }

  const res = await fetch(messagesUrl(), {
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
