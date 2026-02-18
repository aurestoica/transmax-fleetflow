
-- Fix ALL RLS policies to be PERMISSIVE instead of RESTRICTIVE

-- === DRIVERS ===
DROP POLICY IF EXISTS "Admins can manage drivers" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can view own record" ON public.drivers;

CREATE POLICY "Admins can manage drivers" ON public.drivers FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Drivers can view own record" ON public.drivers FOR SELECT TO authenticated USING (user_id = auth.uid());

-- === TRIPS ===
DROP POLICY IF EXISTS "Admins can manage trips" ON public.trips;
DROP POLICY IF EXISTS "Drivers can view assigned trips" ON public.trips;
DROP POLICY IF EXISTS "Drivers can update assigned trips" ON public.trips;

CREATE POLICY "Admins can manage trips" ON public.trips FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Drivers can view assigned trips" ON public.trips FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = auth.uid() AND d.id = trips.driver_id));
CREATE POLICY "Drivers can update assigned trips" ON public.trips FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = auth.uid() AND d.id = trips.driver_id));

-- === TRIP_EVENTS ===
DROP POLICY IF EXISTS "Admins can manage trip events" ON public.trip_events;
DROP POLICY IF EXISTS "Drivers can insert trip events" ON public.trip_events;
DROP POLICY IF EXISTS "Drivers can view trip events" ON public.trip_events;

CREATE POLICY "Admins can manage trip events" ON public.trip_events FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Drivers can insert trip events" ON public.trip_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Drivers can view trip events" ON public.trip_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM trips t JOIN drivers d ON t.driver_id = d.id WHERE t.id = trip_events.trip_id AND d.user_id = auth.uid()));

-- === DOCUMENTS ===
DROP POLICY IF EXISTS "Admins can manage documents" ON public.documents;
DROP POLICY IF EXISTS "Drivers can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Drivers can view own documents" ON public.documents;

CREATE POLICY "Admins can manage documents" ON public.documents FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Drivers can upload documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Drivers can view own documents" ON public.documents FOR SELECT TO authenticated USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM trips t JOIN drivers d ON t.driver_id = d.id WHERE t.id = documents.trip_id AND d.user_id = auth.uid()));

-- === LOCATIONS ===
DROP POLICY IF EXISTS "Admins can view locations" ON public.locations;
DROP POLICY IF EXISTS "Drivers can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Drivers can view own locations" ON public.locations;

CREATE POLICY "Admins can view locations" ON public.locations FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Drivers can insert locations" ON public.locations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Drivers can view own locations" ON public.locations FOR SELECT TO authenticated USING (user_id = auth.uid());

-- === MESSAGES ===
DROP POLICY IF EXISTS "Authenticated can send messages" ON public.messages;
DROP POLICY IF EXISTS "Trip participants can view messages" ON public.messages;

CREATE POLICY "Authenticated can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Trip participants can view messages" ON public.messages FOR SELECT TO authenticated USING (is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM trips t JOIN drivers d ON t.driver_id = d.id WHERE t.id = messages.trip_id AND d.user_id = auth.uid()));

-- === VEHICLES ===
DROP POLICY IF EXISTS "Admins can manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Drivers can view vehicles" ON public.vehicles;

CREATE POLICY "Admins can manage vehicles" ON public.vehicles FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Drivers can view vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);

-- === TRAILERS ===
DROP POLICY IF EXISTS "Admins can manage trailers" ON public.trailers;
DROP POLICY IF EXISTS "Drivers can view trailers" ON public.trailers;

CREATE POLICY "Admins can manage trailers" ON public.trailers FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Drivers can view trailers" ON public.trailers FOR SELECT TO authenticated USING (true);

-- === CLIENTS ===
DROP POLICY IF EXISTS "Admins can manage clients" ON public.clients;

CREATE POLICY "Admins can manage clients" ON public.clients FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- === PROFILES ===
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- === USER_ROLES ===
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owner can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Owner can manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'owner')) WITH CHECK (has_role(auth.uid(), 'owner'));
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- === AUDIT_LOGS ===
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- === NOTIFICATIONS ===
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
