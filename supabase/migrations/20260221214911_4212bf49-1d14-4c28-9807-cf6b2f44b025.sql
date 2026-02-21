
-- Helper: notify all admins (owner + dispatcher)
CREATE OR REPLACE FUNCTION public.notify_admins(
  _title TEXT,
  _message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message)
  SELECT ur.user_id, _title, _message
  FROM public.user_roles ur
  WHERE ur.role IN ('owner', 'dispatcher');
END;
$$;

-- Helper: notify a specific user
CREATE OR REPLACE FUNCTION public.notify_user(
  _user_id UUID,
  _title TEXT,
  _message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message)
  VALUES (_user_id, _title, _message);
END;
$$;

-- 1. Trigger: when a document is uploaded, notify admins
CREATE OR REPLACE FUNCTION public.on_document_uploaded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uploader_name TEXT;
  _trip_number TEXT;
  _category TEXT;
BEGIN
  -- Only notify if uploaded by a driver (not an admin)
  IF public.is_admin(NEW.uploaded_by) THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO _uploader_name FROM public.profiles WHERE user_id = NEW.uploaded_by;
  
  IF NEW.trip_id IS NOT NULL THEN
    SELECT trip_number INTO _trip_number FROM public.trips WHERE id = NEW.trip_id;
  END IF;

  _category := COALESCE(NEW.doc_category, 'document');

  PERFORM public.notify_admins(
    '📄 Document nou: ' || _category,
    COALESCE(_uploader_name, 'Șofer') || ' a încărcat ' || _category || 
    CASE WHEN _trip_number IS NOT NULL THEN ' pe cursa ' || _trip_number ELSE '' END
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_document_uploaded_trigger
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.on_document_uploaded();

-- 2. Trigger: when trip status changes, notify the other party
CREATE OR REPLACE FUNCTION public.on_trip_status_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _driver_user_id UUID;
  _driver_name TEXT;
  _changer_name TEXT;
  _changer_is_admin BOOLEAN;
BEGIN
  -- Only on actual status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get driver info
  IF NEW.driver_id IS NOT NULL THEN
    SELECT d.user_id, d.full_name INTO _driver_user_id, _driver_name
    FROM public.drivers d WHERE d.id = NEW.driver_id;
  END IF;

  -- Determine who likely changed it (check most recent trip_event)
  -- We use a heuristic: if the session user is admin, notify driver; else notify admins
  _changer_is_admin := public.is_admin(auth.uid());

  IF _changer_is_admin THEN
    -- Admin changed status → notify driver
    IF _driver_user_id IS NOT NULL THEN
      SELECT full_name INTO _changer_name FROM public.profiles WHERE user_id = auth.uid();
      PERFORM public.notify_user(
        _driver_user_id,
        '🚛 Status cursă: ' || NEW.status,
        'Cursa ' || NEW.trip_number || ' a fost actualizată la "' || NEW.status || '" de ' || COALESCE(_changer_name, 'dispecer')
      );
    END IF;
  ELSE
    -- Driver changed status → notify admins
    PERFORM public.notify_admins(
      '🚛 Status cursă: ' || NEW.status,
      COALESCE(_driver_name, 'Șofer') || ' a actualizat cursa ' || NEW.trip_number || ' la "' || NEW.status || '"'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_trip_status_changed_trigger
  AFTER UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.on_trip_status_changed();

-- 3. Trigger: when driver is assigned to a trip, notify them
CREATE OR REPLACE FUNCTION public.on_driver_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _driver_user_id UUID;
BEGIN
  -- Only when driver_id changes (new assignment)
  IF NEW.driver_id IS NOT NULL AND (OLD.driver_id IS NULL OR OLD.driver_id != NEW.driver_id) THEN
    SELECT user_id INTO _driver_user_id FROM public.drivers WHERE id = NEW.driver_id;
    
    IF _driver_user_id IS NOT NULL THEN
      PERFORM public.notify_user(
        _driver_user_id,
        '📋 Cursă nouă atribuită',
        'Ți-a fost atribuită cursa ' || NEW.trip_number || ': ' || NEW.pickup_address || ' → ' || NEW.delivery_address
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_driver_assigned_trigger
  AFTER INSERT OR UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.on_driver_assigned();

-- 4. Trigger: when driver sends location, notify admins
CREATE OR REPLACE FUNCTION public.on_location_sent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _driver_name TEXT;
  _trip_number TEXT;
BEGIN
  -- Only if sent by a non-admin
  IF public.is_admin(NEW.user_id) THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO _driver_name FROM public.profiles WHERE user_id = NEW.user_id;
  SELECT trip_number INTO _trip_number FROM public.trips WHERE id = NEW.trip_id;

  PERFORM public.notify_admins(
    '📍 Locație actualizată',
    COALESCE(_driver_name, 'Șofer') || ' a trimis locația pe cursa ' || COALESCE(_trip_number, 'necunoscută')
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_location_sent_trigger
  AFTER INSERT ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.on_location_sent();

-- 5. Trigger: when a chat message is sent, notify the other party
CREATE OR REPLACE FUNCTION public.on_message_sent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _sender_name TEXT;
  _sender_is_admin BOOLEAN;
  _driver_user_id UUID;
  _trip_number TEXT;
BEGIN
  SELECT full_name INTO _sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
  _sender_is_admin := public.is_admin(NEW.sender_id);
  SELECT trip_number INTO _trip_number FROM public.trips WHERE id = NEW.trip_id;

  IF _sender_is_admin THEN
    -- Admin sent message → notify assigned driver
    SELECT d.user_id INTO _driver_user_id 
    FROM public.trips t 
    JOIN public.drivers d ON t.driver_id = d.id 
    WHERE t.id = NEW.trip_id;
    
    IF _driver_user_id IS NOT NULL THEN
      PERFORM public.notify_user(
        _driver_user_id,
        '💬 Mesaj nou de la dispecerat',
        COALESCE(_sender_name, 'Dispecer') || ' pe cursa ' || COALESCE(_trip_number, '') || ': ' || LEFT(COALESCE(NEW.content, ''), 100)
      );
    END IF;
  ELSE
    -- Driver sent message → notify admins
    PERFORM public.notify_admins(
      '💬 Mesaj de la ' || COALESCE(_sender_name, 'șofer'),
      'Pe cursa ' || COALESCE(_trip_number, '') || ': ' || LEFT(COALESCE(NEW.content, ''), 100)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_sent_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.on_message_sent();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
