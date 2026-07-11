-- Stripe customers, payment provider fields, share-token revoke, richer email delivery states

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_stripe_customer_id
  ON customers (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_charge_id text,
  ADD COLUMN IF NOT EXISTS stripe_refund_id text,
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_event_id text,
  ADD COLUMN IF NOT EXISTS failure_code text,
  ADD COLUMN IF NOT EXISTS failure_message text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_event_id
  ON payments (provider_event_id)
  WHERE provider_event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id
  ON payments (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  livemode boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE estimates
  ADD COLUMN IF NOT EXISTS share_token_revoked_at timestamptz;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS share_token_revoked_at timestamptz;

-- Expand notification delivery statuses (queued → provider_accepted → delivered / failed / bounced)
ALTER TABLE notification_events
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_message_id text,
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS bounced_at timestamptz;

-- Allow richer status values (existing check may not exist; add soft constraint via app)
COMMENT ON COLUMN notification_events.status IS
  'queued|pending|sending|provider_accepted|delivered|failed|bounced|skipped|sent|resent';

CREATE TABLE IF NOT EXISTS email_delivery_log (
  id text PRIMARY KEY,
  notification_event_id text REFERENCES notification_events(id) ON DELETE SET NULL,
  company_id text,
  provider text NOT NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL,
  provider_message_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_delivery_log_event
  ON email_delivery_log (notification_event_id);
