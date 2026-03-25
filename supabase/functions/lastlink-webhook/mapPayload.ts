/** Mapeia o JSON da LastLink para colunas da tabela `lastlink_purchases`. */

export type LastlinkRoot = {
  Id?: string
  IsTest?: boolean
  Event?: string
  CreatedAt?: string
  Data?: LastlinkData
}

export type LastlinkData = {
  Products?: Array<{ Id?: string; Name?: string; Price?: number }>
  Buyer?: {
    Id?: string
    Email?: string
    Name?: string
    PhoneNumber?: string
    Document?: string
    Address?: {
      ZipCode?: string
      Street?: string
      StreetNumber?: string
      Complement?: string
      District?: string
      City?: string
      State?: string
    }
  }
  Seller?: { Id?: string; Email?: string }
  Commissions?: Array<{ Value?: number; Source?: string }>
  Purchase?: {
    PaymentId?: string
    Recurrency?: number
    PaymentDate?: string
    NextBilling?: string
    ChargebackDate?: string
    OriginalPrice?: { Value?: number }
    Price?: { Value?: number }
    Payment?: {
      NumberOfInstallments?: number
      PaymentMethod?: string
      InterestRateAmount?: number
    }
    Affiliate?: { Id?: string; Email?: string }
  }
  Subscriptions?: Array<{
    Id?: string
    ProductId?: string
    CanceledDate?: string
    CancellationReason?: string
    ExpiredDate?: string
  }>
  Offer?: { Id?: string; Name?: string; Url?: string }
  Utm?: {
    UtmId?: string
    UtmSource?: string
    UtmMedium?: string
    UtmCampaign?: string
    UtmTerm?: string
    UtmContent?: string
  }
  DeviceInfo?: { UserAgent?: string; ip?: string }
}

export function unwrapWebhookBody(raw: unknown): LastlinkRoot {
  if (raw && typeof raw === 'object' && raw !== null) {
    const o = raw as Record<string, unknown>
    if (o.body && typeof o.body === 'object' && o.body !== null) {
      const inner = o.body as Record<string, unknown>
      if ('Id' in inner || 'Event' in inner || 'Data' in inner) {
        return inner as LastlinkRoot
      }
    }
  }
  return raw as LastlinkRoot
}

function parseTs(s: string | undefined | null): string | null {
  if (!s || typeof s !== 'string') return null
  const normalized = s.includes('T') ? s : s.replace(' ', 'T')
  const withZ = /[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}Z`
  const d = new Date(withZ)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function num(n: number | undefined | null): number | null {
  if (n === undefined || n === null || Number.isNaN(Number(n))) return null
  return Number(n)
}

function slotProduct(
  products: LastlinkData['Products'],
  index: number,
): { id: string | null; name: string | null; price: number | null } {
  const p = products?.[index]
  if (!p) return { id: null, name: null, price: null }
  return {
    id: p.Id ?? null,
    name: p.Name ?? null,
    price: num(p.Price),
  }
}

function slotCommission(
  commissions: LastlinkData['Commissions'],
  index: number,
): { source: string | null; value: number | null } {
  const c = commissions?.[index]
  if (!c) return { source: null, value: null }
  return {
    source: c.Source ?? null,
    value: num(c.Value),
  }
}

function slotSubscription(
  subs: LastlinkData['Subscriptions'],
  index: number,
): { id: string | null; productId: string | null } {
  const s = subs?.[index]
  if (!s) return { id: null, productId: null }
  return {
    id: s.Id ?? null,
    productId: s.ProductId ?? null,
  }
}

export function mapLastlinkToRow(root: LastlinkRoot): Record<string, unknown> {
  const d = root.Data ?? {}
  const buyer = d.Buyer ?? {}
  const addr = buyer.Address ?? {}
  const seller = d.Seller ?? {}
  const purchase = d.Purchase ?? {}
  const pay = purchase.Payment ?? {}
  const offer = d.Offer ?? {}
  const utm = d.Utm ?? {}
  const dev = d.DeviceInfo ?? {}
  const products = d.Products ?? []
  const commissions = d.Commissions ?? []
  const subs = d.Subscriptions ?? []

  const p1 = slotProduct(products, 0)
  const p2 = slotProduct(products, 1)
  const p3 = slotProduct(products, 2)

  const c1 = slotCommission(commissions, 0)
  const c2 = slotCommission(commissions, 1)
  const c3 = slotCommission(commissions, 2)
  const c4 = slotCommission(commissions, 3)
  const c5 = slotCommission(commissions, 4)

  const s1 = slotSubscription(subs, 0)
  const s2 = slotSubscription(subs, 1)

  return {
    lastlink_event_id: root.Id ?? null,
    is_test: root.IsTest ?? null,
    event: root.Event ?? null,
    event_created_at: parseTs(root.CreatedAt),

    buyer_id: buyer.Id ?? null,
    buyer_email: buyer.Email ?? null,
    buyer_name: buyer.Name ?? null,
    buyer_phone: buyer.PhoneNumber ?? null,
    buyer_document: buyer.Document ?? null,
    buyer_address_zip_code: addr.ZipCode ?? null,
    buyer_address_street: addr.Street ?? null,
    buyer_address_street_number: addr.StreetNumber ?? null,
    buyer_address_complement: addr.Complement ?? null,
    buyer_address_district: addr.District ?? null,
    buyer_address_city: addr.City ?? null,
    buyer_address_state: addr.State ?? null,

    seller_id: seller.Id ?? null,
    seller_email: seller.Email ?? null,

    payment_id: purchase.PaymentId ?? null,
    purchase_recurrency: purchase.Recurrency ?? null,
    purchase_payment_date: parseTs(purchase.PaymentDate),
    purchase_next_billing: parseTs(purchase.NextBilling),
    purchase_chargeback_date: parseTs(purchase.ChargebackDate),
    purchase_original_price_value: num(purchase.OriginalPrice?.Value),
    purchase_price_value: num(purchase.Price?.Value),
    purchase_payment_number_of_installments: pay.NumberOfInstallments ?? null,
    purchase_payment_method: pay.PaymentMethod ?? null,
    purchase_payment_interest_rate_amount: num(pay.InterestRateAmount),

    offer_id: offer.Id ?? null,
    offer_name: offer.Name ?? null,
    offer_url: offer.Url ?? null,

    affiliate_id: purchase.Affiliate?.Id ?? null,
    affiliate_email: purchase.Affiliate?.Email ?? null,

    utm_id: utm.UtmId ?? null,
    utm_source: utm.UtmSource ?? null,
    utm_medium: utm.UtmMedium ?? null,
    utm_campaign: utm.UtmCampaign ?? null,
    utm_term: utm.UtmTerm ?? null,
    utm_content: utm.UtmContent ?? null,

    device_user_agent: dev.UserAgent ?? null,
    device_ip: dev.ip ?? null,

    product_1_id: p1.id,
    product_1_name: p1.name,
    product_1_price: p1.price,
    product_2_id: p2.id,
    product_2_name: p2.name,
    product_2_price: p2.price,
    product_3_id: p3.id,
    product_3_name: p3.name,
    product_3_price: p3.price,

    commission_1_source: c1.source,
    commission_1_value: c1.value,
    commission_2_source: c2.source,
    commission_2_value: c2.value,
    commission_3_source: c3.source,
    commission_3_value: c3.value,
    commission_4_source: c4.source,
    commission_4_value: c4.value,
    commission_5_source: c5.source,
    commission_5_value: c5.value,

    subscription_1_id: s1.id,
    subscription_1_product_id: s1.productId,
    subscription_2_id: s2.id,
    subscription_2_product_id: s2.productId,

    circle_status: 'pending',
    circle_error: null,
    circle_synced_at: null,
  }
}
