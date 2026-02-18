
-- Trigger pentru actualizarea automata a statusului soferilor si vehiculelor
CREATE OR REPLACE FUNCTION public.update_fleet_status()
RETURNS TRIGGER LANGUAGE plpgsql 
SET search_path = public
AS $$
BEGIN
  -- La INSERT sau la schimbarea driver_id
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.driver_id IS DISTINCT FROM OLD.driver_id)) THEN
    -- Noul sofer devine on_trip daca cursa nu e finalizata/anulata
    IF NEW.driver_id IS NOT NULL AND NEW.status NOT IN ('completed', 'cancelled') THEN
      UPDATE public.drivers SET status = 'on_trip' WHERE id = NEW.driver_id;
    END IF;
    -- Vechiul sofer revine la available
    IF TG_OP = 'UPDATE' AND OLD.driver_id IS NOT NULL AND OLD.driver_id IS DISTINCT FROM NEW.driver_id THEN
      -- Verificam ca soferul nu e asignat la alta cursa activa
      IF NOT EXISTS (
        SELECT 1 FROM public.trips 
        WHERE driver_id = OLD.driver_id 
          AND id != NEW.id 
          AND status NOT IN ('completed', 'cancelled')
      ) THEN
        UPDATE public.drivers SET status = 'available' WHERE id = OLD.driver_id;
      END IF;
    END IF;
  END IF;

  -- La INSERT sau la schimbarea vehicle_id
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.vehicle_id IS DISTINCT FROM OLD.vehicle_id)) THEN
    IF NEW.vehicle_id IS NOT NULL AND NEW.status NOT IN ('completed', 'cancelled') THEN
      UPDATE public.vehicles SET status = 'on_trip' WHERE id = NEW.vehicle_id;
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.vehicle_id IS NOT NULL AND OLD.vehicle_id IS DISTINCT FROM NEW.vehicle_id THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.trips 
        WHERE vehicle_id = OLD.vehicle_id 
          AND id != NEW.id 
          AND status NOT IN ('completed', 'cancelled')
      ) THEN
        UPDATE public.vehicles SET status = 'available' WHERE id = OLD.vehicle_id;
      END IF;
    END IF;
  END IF;

  -- Cand statusul cursei devine completed sau cancelled, eliberam soferul si vehiculul
  IF TG_OP = 'UPDATE' AND NEW.status IN ('completed', 'cancelled') 
     AND OLD.status NOT IN ('completed', 'cancelled') THEN
    IF NEW.driver_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.trips 
        WHERE driver_id = NEW.driver_id 
          AND id != NEW.id 
          AND status NOT IN ('completed', 'cancelled')
      ) THEN
        UPDATE public.drivers SET status = 'available' WHERE id = NEW.driver_id;
      END IF;
    END IF;
    IF NEW.vehicle_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.trips 
        WHERE vehicle_id = NEW.vehicle_id 
          AND id != NEW.id 
          AND status NOT IN ('completed', 'cancelled')
      ) THEN
        UPDATE public.vehicles SET status = 'available' WHERE id = NEW.vehicle_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER update_fleet_on_trip_change
  AFTER INSERT OR UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_fleet_status();
