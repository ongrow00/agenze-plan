-- LastLink webhook: uma linha por evento de compra (colunas achatadas + slots para arrays)

CREATE TABLE IF NOT EXISTS lastlink_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  lastlink_event_id TEXT NOT NULL,
  is_test BOOLEAN,
  event TEXT,
  event_created_at TIMESTAMPTZ,

  buyer_id TEXT,
  buyer_email TEXT,
  buyer_name TEXT,
  buyer_phone TEXT,
  buyer_document TEXT,
  buyer_address_zip_code TEXT,
  buyer_address_street TEXT,
  buyer_address_street_number TEXT,
  buyer_address_district TEXT,
  buyer_address_city TEXT,
  buyer_address_state TEXT,

  seller_id TEXT,
  seller_email TEXT,

  payment_id TEXT,
  purchase_recurrency INTEGER,
  purchase_payment_date TIMESTAMPTZ,
  purchase_next_billing TIMESTAMPTZ,
  purchase_original_price_value NUMERIC(14, 2),
  purchase_price_value NUMERIC(14, 2),
  purchase_payment_number_of_installments INTEGER,
  purchase_payment_method TEXT,
  purchase_payment_interest_rate_amount NUMERIC(14, 2),

  offer_id TEXT,
  offer_name TEXT,

  utm_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,

  device_user_agent TEXT,
  device_ip TEXT,

  product_1_id TEXT,
  product_1_name TEXT,
  product_1_price NUMERIC(14, 2),
  product_2_id TEXT,
  product_2_name TEXT,
  product_2_price NUMERIC(14, 2),
  product_3_id TEXT,
  product_3_name TEXT,
  product_3_price NUMERIC(14, 2),

  commission_1_source TEXT,
  commission_1_value NUMERIC(14, 2),
  commission_2_source TEXT,
  commission_2_value NUMERIC(14, 2),
  commission_3_source TEXT,
  commission_3_value NUMERIC(14, 2),
  commission_4_source TEXT,
  commission_4_value NUMERIC(14, 2),
  commission_5_source TEXT,
  commission_5_value NUMERIC(14, 2),

  subscription_1_id TEXT,
  subscription_1_product_id TEXT,
  subscription_2_id TEXT,
  subscription_2_product_id TEXT,

  plan_tier TEXT,
  circle_status TEXT,
  circle_error TEXT,
  circle_synced_at TIMESTAMPTZ,

  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS lastlink_purchases_event_id_key ON lastlink_purchases (lastlink_event_id);

CREATE UNIQUE INDEX IF NOT EXISTS lastlink_purchases_payment_id_key
  ON lastlink_purchases (payment_id)
  WHERE payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS lastlink_purchases_buyer_email_idx ON lastlink_purchases (buyer_email);

ALTER TABLE lastlink_purchases ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION lastlink_purchases_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lastlink_purchases_updated_at ON lastlink_purchases;
CREATE TRIGGER lastlink_purchases_updated_at
  BEFORE UPDATE ON lastlink_purchases
  FOR EACH ROW
  EXECUTE PROCEDURE lastlink_purchases_set_updated_at();
