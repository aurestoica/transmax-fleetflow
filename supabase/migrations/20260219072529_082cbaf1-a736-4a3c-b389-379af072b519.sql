
-- Drop existing restrictive policies on documents
DROP POLICY IF EXISTS "Admins can manage documents" ON public.documents;
DROP POLICY IF EXISTS "Drivers can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Drivers can view own documents" ON public.documents;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can manage documents"
ON public.documents
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Drivers can upload documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Drivers can view own documents"
ON public.documents
FOR SELECT
TO authenticated
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM trips t
    JOIN drivers d ON t.driver_id = d.id
    WHERE t.id = documents.trip_id AND d.user_id = auth.uid()
  )
);
