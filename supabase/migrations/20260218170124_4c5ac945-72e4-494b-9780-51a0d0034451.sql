
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('owner', 'dispatcher', 'driver');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'ro',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user is admin (owner or dispatcher)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('owner', 'dispatcher')
  )
$$;

-- Drivers
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'on_trip', 'leave', 'inactive')),
  license_number TEXT,
  license_expiry DATE,
  tachograph_card TEXT,
  tachograph_expiry DATE,
  notes TEXT,
  rating NUMERIC(2,1) DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT NOT NULL UNIQUE,
  vin TEXT,
  model TEXT,
  year INTEGER,
  avg_consumption NUMERIC(5,2),
  capacity_tons NUMERIC(5,2),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'on_trip', 'maintenance', 'inactive')),
  itp_expiry DATE,
  rca_expiry DATE,
  insurance_expiry DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trailers
CREATE TABLE public.trailers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT NOT NULL UNIQUE,
  type TEXT,
  capacity_tons NUMERIC(5,2),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'on_trip', 'maintenance', 'inactive')),
  itp_expiry DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  cif TEXT,
  address TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  rate_per_km NUMERIC(8,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trips
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_number TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id),
  driver_id UUID REFERENCES public.drivers(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  trailer_id UUID REFERENCES public.trailers(id),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'loading', 'in_transit', 'unloading', 'completed', 'cancelled', 'delayed')),
  pickup_address TEXT NOT NULL,
  pickup_date TIMESTAMPTZ,
  delivery_address TEXT NOT NULL,
  delivery_date TIMESTAMPTZ,
  cargo_type TEXT,
  weight_tons NUMERIC(5,2),
  distance_km NUMERIC(8,2),
  observations TEXT,
  revenue NUMERIC(10,2) DEFAULT 0,
  fuel_cost NUMERIC(10,2) DEFAULT 0,
  road_taxes NUMERIC(10,2) DEFAULT 0,
  other_expenses NUMERIC(10,2) DEFAULT 0,
  driver_advance NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trip events (timeline)
CREATE TABLE public.trip_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  doc_category TEXT DEFAULT 'other',
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id),
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Messages (chat)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Locations (tracking)
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: users see own, admins see all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles: only owner can manage, all authenticated can read own
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Owner can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'owner'));

-- Drivers: admins full access, drivers see own
CREATE POLICY "Admins can manage drivers" ON public.drivers FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Drivers can view own record" ON public.drivers FOR SELECT USING (user_id = auth.uid());

-- Vehicles, Trailers, Clients: admins full access
CREATE POLICY "Admins can manage vehicles" ON public.vehicles FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Drivers can view vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage trailers" ON public.trailers FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Drivers can view trailers" ON public.trailers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage clients" ON public.clients FOR ALL USING (public.is_admin(auth.uid()));

-- Trips: admins full, drivers see assigned
CREATE POLICY "Admins can manage trips" ON public.trips FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Drivers can view assigned trips" ON public.trips FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.drivers d WHERE d.user_id = auth.uid() AND d.id = driver_id)
);
CREATE POLICY "Drivers can update assigned trips" ON public.trips FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.drivers d WHERE d.user_id = auth.uid() AND d.id = driver_id)
);

-- Trip events: admins full, drivers on their trips
CREATE POLICY "Admins can manage trip events" ON public.trip_events FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Drivers can view trip events" ON public.trip_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.trips t JOIN public.drivers d ON t.driver_id = d.id WHERE t.id = trip_id AND d.user_id = auth.uid())
);
CREATE POLICY "Drivers can insert trip events" ON public.trip_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Documents: admins full, drivers on their trips
CREATE POLICY "Admins can manage documents" ON public.documents FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Drivers can view own documents" ON public.documents FOR SELECT USING (
  uploaded_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.trips t JOIN public.drivers d ON t.driver_id = d.id WHERE t.id = trip_id AND d.user_id = auth.uid())
);
CREATE POLICY "Drivers can upload documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Messages: participants can see/send
CREATE POLICY "Trip participants can view messages" ON public.messages FOR SELECT USING (
  public.is_admin(auth.uid()) OR
  EXISTS (SELECT 1 FROM public.trips t JOIN public.drivers d ON t.driver_id = d.id WHERE t.id = trip_id AND d.user_id = auth.uid())
);
CREATE POLICY "Authenticated can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Locations
CREATE POLICY "Admins can view locations" ON public.locations FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Drivers can insert locations" ON public.locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Drivers can view own locations" ON public.locations FOR SELECT USING (user_id = auth.uid());

-- Audit logs: only admins
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications: users see own
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Enable realtime for messages and locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trailers_updated_at BEFORE UPDATE ON public.trailers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trip number sequence function
CREATE OR REPLACE FUNCTION public.generate_trip_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.trip_number := 'TMS-' || TO_CHAR(now(), 'YYMM') || '-' || LPAD(nextval('trip_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE SEQUENCE IF NOT EXISTS trip_number_seq START 1;

CREATE TRIGGER set_trip_number
  BEFORE INSERT ON public.trips
  FOR EACH ROW
  WHEN (NEW.trip_number IS NULL OR NEW.trip_number = '')
  EXECUTE FUNCTION public.generate_trip_number();
