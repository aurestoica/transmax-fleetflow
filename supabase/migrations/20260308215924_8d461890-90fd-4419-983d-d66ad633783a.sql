
-- Fix audit_log_trigger to skip when no real user
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _action TEXT; _details JSONB; _entity_id UUID; _user_id UUID;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  IF TG_OP = 'INSERT' THEN _action := 'create'; _entity_id := NEW.id; _details := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN _action := 'update'; _entity_id := NEW.id; _details := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN _action := 'delete'; _entity_id := OLD.id; _details := to_jsonb(OLD);
  END IF;
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details) VALUES (_user_id, _action, TG_TABLE_NAME, _entity_id, _details);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END; $function$;

-- Now do the data updates and schema changes
-- Companies table (may already exist from partial migration)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, cif TEXT, address TEXT,
  contact_email TEXT, contact_phone TEXT, is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.trailers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

CREATE OR REPLACE FUNCTION public.is_platform_owner(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'platform_owner'); $$;

CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT company_id FROM public.profiles WHERE user_id = _user_id LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('owner', 'dispatcher', 'platform_owner')); $$;

INSERT INTO public.companies (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'TRANS MAX SIB') ON CONFLICT (id) DO NOTHING;
UPDATE public.profiles SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.drivers SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.vehicles SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.trailers SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.trips SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.clients SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;

INSERT INTO public.user_roles (user_id, role) VALUES ('cddf8772-0839-4514-adce-d1a836507f5b', 'platform_owner') ON CONFLICT (user_id, role) DO NOTHING;

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
CREATE POLICY "Platform owners manage companies" ON public.companies FOR ALL USING (is_platform_owner(auth.uid())) WITH CHECK (is_platform_owner(auth.uid()));
CREATE POLICY "Users view own company" ON public.companies FOR SELECT USING (id = get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage drivers" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can view own record" ON public.drivers;
CREATE POLICY "Platform owners manage all drivers" ON public.drivers FOR ALL USING (is_platform_owner(auth.uid())) WITH CHECK (is_platform_owner(auth.uid()));
CREATE POLICY "Company admins manage drivers" ON public.drivers FOR ALL USING (is_admin(auth.uid()) AND company_id = get_user_company_id(auth.uid())) WITH CHECK (is_admin(auth.uid()) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Drivers view own record" ON public.drivers FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Drivers can view vehicles" ON public.vehicles;
CREATE POLICY "Platform owners manage all vehicles" ON public.vehicles FOR ALL USING (is_platform_owner(auth.uid())) WITH CHECK (is_platform_owner(auth.uid()));
CREATE POLICY "Company admins manage vehicles" ON public.vehicles FOR ALL USING (is_admin(auth.uid()) AND company_id = get_user_company_id(auth.uid())) WITH CHECK (is_admin(auth.uid()) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Drivers view company vehicles" ON public.vehicles FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage trailers" ON public.trailers;
DROP POLICY IF EXISTS "Drivers can view trailers" ON public.trailers;
CREATE POLICY "Platform owners manage all trailers" ON public.trailers FOR ALL USING (is_platform_owner(auth.uid())) WITH CHECK (is_platform_owner(auth.uid()));
CREATE POLICY "Company admins manage trailers" ON public.trailers FOR ALL USING (is_admin(auth.uid()) AND company_id = get_user_company_id(auth.uid())) WITH CHECK (is_admin(auth.uid()) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Drivers view company trailers" ON public.trailers FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage trips" ON public.trips;
DROP POLICY IF EXISTS "Drivers can view assigned trips" ON public.trips;
DROP POLICY IF EXISTS "Drivers can update assigned trips" ON public.trips;
CREATE POLICY "Platform owners manage all trips" ON public.trips FOR ALL USING (is_platform_owner(auth.uid())) WITH CHECK (is_platform_owner(auth.uid()));
CREATE POLICY "Company admins manage trips" ON public.trips FOR ALL USING (is_admin(auth.uid()) AND company_id = get_user_company_id(auth.uid())) WITH CHECK (is_admin(auth.uid()) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Drivers view assigned trips" ON public.trips FOR SELECT USING (EXISTS (SELECT 1 FROM public.drivers d WHERE d.user_id = auth.uid() AND d.id = trips.driver_id));
CREATE POLICY "Drivers update assigned trips" ON public.trips FOR UPDATE USING (EXISTS (SELECT 1 FROM public.drivers d WHERE d.user_id = auth.uid() AND d.id = trips.driver_id));

DROP POLICY IF EXISTS "Admins can manage clients" ON public.clients;
CREATE POLICY "Platform owners manage all clients" ON public.clients FOR ALL USING (is_platform_owner(auth.uid())) WITH CHECK (is_platform_owner(auth.uid()));
CREATE POLICY "Company admins manage clients" ON public.clients FOR ALL USING (is_admin(auth.uid()) AND company_id = get_user_company_id(auth.uid())) WITH CHECK (is_admin(auth.uid()) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Platform owners manage all profiles" ON public.profiles FOR ALL USING (is_platform_owner(auth.uid())) WITH CHECK (is_platform_owner(auth.uid()));
