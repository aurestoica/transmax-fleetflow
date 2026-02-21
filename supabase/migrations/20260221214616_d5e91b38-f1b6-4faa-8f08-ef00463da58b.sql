
-- Remove duplicate triggers created by previous migration
DROP TRIGGER IF EXISTS generate_trip_number_trigger ON public.trips;
DROP TRIGGER IF EXISTS update_fleet_status_trigger ON public.trips;
