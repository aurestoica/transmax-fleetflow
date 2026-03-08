
CREATE TABLE public.dashboard_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  layout jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own layout" ON public.dashboard_layouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own layout" ON public.dashboard_layouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own layout" ON public.dashboard_layouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own layout" ON public.dashboard_layouts FOR DELETE USING (auth.uid() = user_id);
