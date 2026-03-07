
CREATE TABLE public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email_enabled boolean NOT NULL DEFAULT false,
  email_trip_status boolean NOT NULL DEFAULT true,
  email_trip_assigned boolean NOT NULL DEFAULT true,
  email_new_message boolean NOT NULL DEFAULT true,
  email_document_uploaded boolean NOT NULL DEFAULT false,
  email_expiry_alert boolean NOT NULL DEFAULT true,
  email_location_update boolean NOT NULL DEFAULT false,
  email_driver_status boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.notification_settings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.notification_settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.notification_settings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
