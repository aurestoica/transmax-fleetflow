-- Allow company owners to update their own company profile
CREATE POLICY "Company owners can update own company"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'owner') AND id = get_user_company_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'owner') AND id = get_user_company_id(auth.uid())
);