-- Drop the existing policy
DROP POLICY IF EXISTS "Students and alumni can create channels" ON public.lounge_channels;

-- Create updated policy that includes faculty
CREATE POLICY "Students, alumni, and faculty can create channels" 
ON public.lounge_channels 
FOR INSERT 
WITH CHECK (
  (auth.uid() = created_by) AND 
  (EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = ANY (ARRAY['student'::app_role, 'alumni'::app_role, 'faculty'::app_role])
  ))
);