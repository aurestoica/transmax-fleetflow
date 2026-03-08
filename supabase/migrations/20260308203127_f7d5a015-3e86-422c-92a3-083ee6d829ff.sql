
-- Function to log audit events from triggers
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _action TEXT;
  _details JSONB;
  _entity_id UUID;
  _user_id UUID;
BEGIN
  _user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
  
  IF TG_OP = 'INSERT' THEN
    _action := 'create';
    _entity_id := NEW.id;
    _details := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'update';
    _entity_id := NEW.id;
    -- Only store changed fields
    _details := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'delete';
    _entity_id := OLD.id;
    _details := to_jsonb(OLD);
  END IF;
  
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (_user_id, _action, TG_TABLE_NAME, _entity_id, _details);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Trips audit
CREATE TRIGGER audit_trips
AFTER INSERT OR UPDATE OR DELETE ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Drivers audit
CREATE TRIGGER audit_drivers
AFTER INSERT OR UPDATE OR DELETE ON public.drivers
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Vehicles audit
CREATE TRIGGER audit_vehicles
AFTER INSERT OR UPDATE OR DELETE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Trailers audit
CREATE TRIGGER audit_trailers
AFTER INSERT OR UPDATE OR DELETE ON public.trailers
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Clients audit
CREATE TRIGGER audit_clients
AFTER INSERT OR UPDATE OR DELETE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Documents audit
CREATE TRIGGER audit_documents
AFTER INSERT OR UPDATE OR DELETE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Messages audit (insert only — no update/delete allowed)
CREATE TRIGGER audit_messages
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- User roles audit
CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Locations audit (insert only)
CREATE TRIGGER audit_locations
AFTER INSERT ON public.locations
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
