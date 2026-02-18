
-- Fix overly permissive notification insert policy
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
