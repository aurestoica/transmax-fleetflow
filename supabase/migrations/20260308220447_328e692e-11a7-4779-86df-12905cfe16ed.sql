
-- Allow platform_owner to manage user_roles
DROP POLICY IF EXISTS "Platform owners manage all roles" ON public.user_roles;
CREATE POLICY "Platform owners manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (is_platform_owner(auth.uid()))
WITH CHECK (is_platform_owner(auth.uid()));

-- Allow platform_owner to view all profiles (already exists but ensure)
-- Already covered by "Platform owners manage all profiles" policy
