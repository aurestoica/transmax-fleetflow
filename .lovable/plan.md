
# Audit Complet - Platformă TRANS MAX SIB

## Ce functioneaza corect

- Autentificarea (login/logout) pentru admin si sofer
- Rutarea bazata pe rol (admin vede panoul admin, soferul vede portalul sau)
- Dashboard cu statistici
- Crearea curselor, clientilor, vehiculelor, remorcilor, soferilor
- Upload documente sofer (CMR, poza marfa, POD etc.)
- Upload documente vehicule (talon, RCA, ITP etc.)
- Pagina globala documente cu filtrare si previzualizare
- Chat in timp real intre dispecer si sofer per cursa
- Trimitere locatie GPS de catre sofer
- Crearea utilizatorilor noi prin edge function (cu rol sofer sau dispecer)
- Sectiunea financiara cu profit/marje
- Multilingv (RO/EN/ES)
- RLS policies corecte pe toate tabelele

---

## Probleme identificate care trebuie remediate

### 1. CRITIC - Editarea si stergerea lipsesc complet
Nicio pagina nu are functionalitate de **editare** sau **stergere**:
- Soferi: nu poti edita informatii (permis, telefon, status) sau sterge un sofer
- Vehicule: nu poti edita datele sau sterge un vehicul
- Remorci: nu poti edita sau sterge
- Clienti: nu poti edita sau sterge
- Curse: nu poti edita o cursa existenta (distanta, cheltuieli etc.)

### 2. CRITIC - Statusul vehiculelor si soferilor nu se actualizeaza
Cand o cursa e creata cu un sofer si un vehicul, statusul lor ramane "available" in loc sa devina "on_trip". Cand cursa se finalizeaza/anuleaza, nu revine la "available". Astfel Dashboard-ul arata "Soferi Disponibili: 2" chiar daca sunt in cursa.

### 3. PROBLEMA - DriverTripsPage arata "Nu ai curse active" daca soferul are multiple curse
Soferul vede doar cursele cu statusuri active, dar daca are curse completate nu le poate vedea. Ar trebui un tab "Curse completate" sau sa poata vedea istoricul.

### 4. PROBLEMA - Portarul soferului arata pagina goala daca nu are cursa activa
In `DriverDocumentsPage`, daca soferul nu are cursa activa, nu poate incarca documente. Dar pagina nu ii explica clar de ce.

### 5. PROBLEMA - Curse - trip_number trimis ca string gol la creare
In `TripsPage.tsx` linia 70, `trip_number: ''` este trimis explicit, dar trigger-ul de baza de date seteaza automat numarul. Trimiterea unui string gol poate cauza conflicte ocazionale daca trigger-ul verifica `NEW.trip_number IS NULL OR NEW.trip_number = ''`. In prezent functioneaza, dar e o practica gresita.

### 6. PROBLEMA - Notificarile nu sunt implementate in UI
Tabela `notifications` exista in baza de date si are policies RLS, dar nu exista nicio interfata pentru a vedea sau gestiona notificarile in panoul admin.

### 7. PROBLEMA - Nu exista confirmare la stergere
Orice buton de stergere (cand va fi adaugat) trebuie sa aiba o confirmare pentru a preveni stergerea accidentala.

### 8. PROBLEMA - Sectiunea de locatii din Admin lipseste
Adminul poate vedea locatiile in baza de date dar nu exista nicio pagina/componenta care sa afiseze locatiile GPS trimise de soferi.

### 9. PROBLEMA MINORA - Portarul soferului nu arata daca are mai multe curse active simultan
Daca soferul e asignat la 2 curse active, chat-ul si documentele vor folosi mereu prima cursa.

---

## Plan de implementare

### Prioritate 1 - Editare si stergere pentru toate entitatile

**DriversPage.tsx**
- Adaugare buton Edit (creion) pe fiecare card sofer - deschide dialog pre-completat
- Adaugare buton Delete (cos) cu dialog de confirmare (AlertDialog)
- Functii `handleEdit` si `handleDelete`

**VehiclesPage.tsx**
- Buton Edit pe fiecare card vehicul - dialog pre-completat
- Buton Delete cu confirmare

**TrailersPage.tsx**
- Buton Edit si Delete cu confirmare

**ClientsPage.tsx**
- Buton Edit si Delete cu confirmare

**TripsPage.tsx**
- Stergerea trip-ului (cu confirmare) direct din lista
- Editarea detaliilor financiare din TripDetailPage (Revenue, combustibil, taxe etc.)

### Prioritate 2 - Actualizare automata status sofer/vehicul

**Migrare SQL** - Trigger care:
- La INSERT pe trips cu driver_id/vehicle_id: seteaza status `on_trip`
- La UPDATE pe trips cu status = 'completed' sau 'cancelled': seteaza driver/vehicle inapoi la `available`

Cod SQL:
```sql
CREATE OR REPLACE FUNCTION public.update_fleet_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- When trip gets a driver/vehicle assigned (or created with one)
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.driver_id IS DISTINCT FROM OLD.driver_id)) THEN
    IF NEW.driver_id IS NOT NULL AND NEW.status NOT IN ('completed', 'cancelled') THEN
      UPDATE public.drivers SET status = 'on_trip' WHERE id = NEW.driver_id;
    END IF;
    IF OLD.driver_id IS NOT NULL AND OLD.driver_id IS DISTINCT FROM NEW.driver_id THEN
      UPDATE public.drivers SET status = 'available' WHERE id = OLD.driver_id;
    END IF;
  END IF;
  
  -- Same for vehicle
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.vehicle_id IS DISTINCT FROM OLD.vehicle_id)) THEN
    IF NEW.vehicle_id IS NOT NULL AND NEW.status NOT IN ('completed', 'cancelled') THEN
      UPDATE public.vehicles SET status = 'on_trip' WHERE id = NEW.vehicle_id;
    END IF;
    IF OLD.vehicle_id IS NOT NULL AND OLD.vehicle_id IS DISTINCT FROM NEW.vehicle_id THEN
      UPDATE public.vehicles SET status = 'available' WHERE id = OLD.vehicle_id;
    END IF;
  END IF;
  
  -- When trip status changes to completed/cancelled, release fleet
  IF TG_OP = 'UPDATE' AND NEW.status IN ('completed', 'cancelled') 
     AND OLD.status NOT IN ('completed', 'cancelled') THEN
    IF NEW.driver_id IS NOT NULL THEN
      UPDATE public.drivers SET status = 'available' WHERE id = NEW.driver_id;
    END IF;
    IF NEW.vehicle_id IS NOT NULL THEN
      UPDATE public.vehicles SET status = 'available' WHERE id = NEW.vehicle_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_fleet_on_trip_change
  AFTER INSERT OR UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_fleet_status();
```

### Prioritate 3 - Editare financiara in TripDetailPage

Adaugam un buton "Editare" in sectiunea Financiar care permite modificarea:
- Venit, combustibil, taxe drum, alte cheltuieli, avans sofer, distanta

### Prioritate 4 - Fix trip_number la creare

Eliminam `trip_number: ''` din payload-ul de insert in `TripsPage.tsx`. Trigger-ul DB se ocupa automat.

---

## Fisiere de modificat

1. `supabase/migrations/` - migrare noua pentru trigger-ul de status flota
2. `src/pages/DriversPage.tsx` - edit + delete
3. `src/pages/VehiclesPage.tsx` - edit + delete  
4. `src/pages/TrailersPage.tsx` - edit + delete
5. `src/pages/ClientsPage.tsx` - edit + delete
6. `src/pages/TripsPage.tsx` - delete + fix trip_number
7. `src/pages/TripDetailPage.tsx` - editare financiara inline
