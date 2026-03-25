import { createClient } from 'npm:@supabase/supabase-js@2'

export function firstNameFromBuyer(name: string | null | undefined): string {
  const t = (name ?? '').trim()
  if (!t) return 'Cliente'
  const first = t.split(/\s+/)[0] ?? t
  return first.slice(0, 60) || 'Cliente'
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '')
}

/** Compara telefone do WhatsApp (`from`) com `buyer_phone` da LastLink (variações BR / sem país). */
export function phonesMatchWhatsAppAndLastlink(waFromDigits: string, buyerPhone: string | null): boolean {
  if (!buyerPhone?.trim()) return false
  const w = digitsOnly(waFromDigits)
  const b = digitsOnly(buyerPhone)
  if (!w || !b) return false
  if (w === b) return true
  const w55 = w.startsWith('55') ? w : `55${w}`
  const b55 = b.startsWith('55') ? b : `55${b}`
  if (w55 === b55) return true
  if (w.endsWith(b) || b.endsWith(w)) return true
  const tail = 11
  if (w.length >= tail && b.length >= tail) {
    if (w.slice(-tail) === b.slice(-tail)) return true
    if (w55.slice(-tail) === b55.slice(-tail)) return true
  }
  return false
}

export type BuyerRow = { buyer_name: string | null; buyer_email: string | null; buyer_phone: string | null; event: string | null }

/** Última compra conhecida para o telefone (preferindo linha de compra confirmada). */
export async function lookupBuyerByWaPhone(waFromDigits: string): Promise<BuyerRow | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    console.warn('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes — nome/e-mail só do perfil WhatsApp')
    return null
  }

  const sb = createClient(supabaseUrl, serviceKey)
  const { data: rows, error } = await sb
    .from('lastlink_purchases')
    .select('buyer_name, buyer_email, buyer_phone, event')
    .not('buyer_phone', 'is', null)
    .order('received_at', { ascending: false })
    .limit(250)

  if (error) {
    console.error('lookupBuyerByWaPhone:', error.message)
    return null
  }

  const list = (rows ?? []) as BuyerRow[]
  const matches = list.filter((r) => phonesMatchWhatsAppAndLastlink(waFromDigits, r.buyer_phone))
  if (matches.length === 0) return null

  const purchase = matches.find((r) => /purchase_order_confirmed/i.test(r.event ?? ''))
  return purchase ?? matches[0]!
}
