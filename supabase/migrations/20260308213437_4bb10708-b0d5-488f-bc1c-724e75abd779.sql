
-- Trigger to notify admins when a driver submits a profile change request
CREATE OR REPLACE FUNCTION public.on_profile_change_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _driver_name TEXT;
  _changes_desc TEXT := '';
  _key TEXT;
BEGIN
  SELECT full_name INTO _driver_name FROM public.drivers WHERE id = NEW.driver_id;
  
  FOR _key IN SELECT jsonb_object_keys(NEW.changes) LOOP
    IF _changes_desc != '' THEN _changes_desc := _changes_desc || ', '; END IF;
    CASE _key
      WHEN 'full_name' THEN _changes_desc := _changes_desc || 'Nume';
      WHEN 'phone' THEN _changes_desc := _changes_desc || 'Telefon';
      WHEN 'avatar_url' THEN _changes_desc := _changes_desc || 'Poză profil';
      ELSE _changes_desc := _changes_desc || _key;
    END CASE;
  END LOOP;

  PERFORM public.notify_admins(
    'Cerere modificare profil',
    COALESCE(_driver_name, 'Șofer') || ' solicită modificarea: ' || _changes_desc,
    'driver',
    NEW.driver_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_change_request_trigger
  AFTER INSERT ON public.profile_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.on_profile_change_request();
