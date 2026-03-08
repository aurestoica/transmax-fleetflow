
-- Create a function that sends push notification on new message via pg_net
CREATE OR REPLACE FUNCTION public.on_message_push_notify()
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
  _target_user_id UUID;
  _push_title TEXT;
  _push_body TEXT;
  _supabase_url TEXT;
  _service_role_key TEXT;
BEGIN
  -- Skip deleted messages
  IF NEW.content IS NULL AND NEW.attachment_url IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO _sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
  _sender_is_admin := public.is_admin(NEW.sender_id);
  SELECT trip_number INTO _trip_number FROM public.trips WHERE id = NEW.trip_id;

  IF _sender_is_admin THEN
    -- Admin sent message -> notify driver
    SELECT d.user_id INTO _driver_user_id 
    FROM public.trips t 
    JOIN public.drivers d ON t.driver_id = d.id 
    WHERE t.id = NEW.trip_id;
    
    _target_user_id := _driver_user_id;
    _push_title := 'Mesaj nou de la dispecerat';
    _push_body := COALESCE(_sender_name, 'Dispecer') || ': ' || LEFT(COALESCE(NEW.content, 'Fișier atașat'), 100);
  ELSE
    -- Driver sent message -> notify all admins via individual push
    -- We'll notify each admin separately
    _push_title := 'Mesaj de la ' || COALESCE(_sender_name, 'șofer');
    _push_body := 'Cursa ' || COALESCE(_trip_number, '') || ': ' || LEFT(COALESCE(NEW.content, 'Fișier atașat'), 100);
  END IF;

  _supabase_url := current_setting('app.settings.supabase_url', true);
  _service_role_key := current_setting('app.settings.service_role_key', true);

  IF _sender_is_admin AND _target_user_id IS NOT NULL THEN
    -- Send push to driver
    PERFORM net.http_post(
      url := _supabase_url || '/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _service_role_key
      ),
      body := jsonb_build_object(
        'user_id', _target_user_id,
        'title', _push_title,
        'body', _push_body,
        'data', jsonb_build_object('type', 'chat', 'trip_id', NEW.trip_id)
      )
    );
  ELSIF NOT _sender_is_admin THEN
    -- Send push to each admin
    PERFORM net.http_post(
      url := _supabase_url || '/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _service_role_key
      ),
      body := jsonb_build_object(
        'user_id', ur.user_id,
        'title', _push_title,
        'body', _push_body,
        'data', jsonb_build_object('type', 'chat', 'trip_id', NEW.trip_id)
      )
    )
    FROM public.user_roles ur
    WHERE ur.role IN ('owner', 'dispatcher');
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on messages table
CREATE TRIGGER on_message_push_notify_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.on_message_push_notify();
