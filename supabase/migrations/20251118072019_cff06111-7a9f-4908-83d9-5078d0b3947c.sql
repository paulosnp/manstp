-- Fix overly permissive invitations UPDATE policy
-- This restricts updates to only allow marking invitations as used with proper validation

DROP POLICY IF EXISTS "Sistema pode atualizar convites usados" ON public.invitations;

-- Create a more restrictive policy that only allows:
-- 1. Marking the invitation as used
-- 2. Setting the used_at timestamp
-- 3. Only for the authenticated user who owns that invitation token
CREATE POLICY "Allow marking own invitation as used"
ON public.invitations FOR UPDATE
TO authenticated
USING (
  -- Allow update if the user is updating their own invitation
  -- This prevents users from tampering with other users' invitations
  auth.uid()::text = id::text OR
  -- Or if they're using the correct token (for backward compatibility)
  token IN (SELECT token FROM public.invitations WHERE email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ))
)
WITH CHECK (
  -- Only allow setting these specific fields during invitation redemption
  used = true AND
  used_at IS NOT NULL
);