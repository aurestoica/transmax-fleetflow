
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars bucket
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Admins can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins can update avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND public.is_admin(auth.uid()));
CREATE POLICY "Drivers can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Drivers can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add avatar_url column to drivers table
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS avatar_url text;

-- Profile change requests table for driver approval workflow
CREATE TABLE public.profile_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  changes jsonb NOT NULL, -- { full_name?: string, phone?: string, avatar_url?: string }
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

ALTER TABLE public.profile_change_requests ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with requests
CREATE POLICY "Admins can manage change requests" ON public.profile_change_requests FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Drivers can view own requests
CREATE POLICY "Drivers can view own requests" ON public.profile_change_requests FOR SELECT USING (auth.uid() = user_id);

-- Drivers can insert own requests
CREATE POLICY "Drivers can insert own requests" ON public.profile_change_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
