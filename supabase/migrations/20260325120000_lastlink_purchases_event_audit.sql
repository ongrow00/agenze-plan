-- Reembolso/estorno pode repetir o mesmo PaymentId da compra original; o Id do evento (lastlink_event_id) é que é único.
DROP INDEX IF EXISTS lastlink_purchases_payment_id_key;

CREATE INDEX IF NOT EXISTS lastlink_purchases_payment_id_idx ON lastlink_purchases (payment_id)
  WHERE payment_id IS NOT NULL;

-- Campos frequentes na LastLink não cobertos na primeira migration
ALTER TABLE lastlink_purchases
  ADD COLUMN IF NOT EXISTS offer_url TEXT,
  ADD COLUMN IF NOT EXISTS buyer_address_complement TEXT,
  ADD COLUMN IF NOT EXISTS purchase_chargeback_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS affiliate_id TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_email TEXT;
