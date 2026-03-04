-- Table to track which expiry notifications have been sent
CREATE TABLE public.expiry_notifications_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,  -- e.g. vehicle_rca, vehicle_itp, vehicle_insurance, trailer_itp, driver_license, driver_tachograph, document
  entity_id uuid NOT NULL,
  expiry_date date NOT NULL,  -- the actual expiry date being tracked
  days_before integer NOT NULL, -- 30, 15, 7, or 0 for daily
  notified_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id, expiry_date, days_before)
);

ALTER TABLE public.expiry_notifications_sent ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage these records
CREATE POLICY "Admins can manage expiry notifications"
  ON public.expiry_notifications_sent
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;