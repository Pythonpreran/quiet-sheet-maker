-- Allow the AURA bot (special system user) to insert messages
CREATE POLICY "AURA bot can create messages"
ON public.lounge_messages
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = '00000000-0000-0000-0000-000000000000' 
  OR (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('student', 'alumni')
    )
    AND (
      EXISTS (
        SELECT 1 FROM lounge_channels
        WHERE id = channel_id AND created_by = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM channel_members
        WHERE channel_id = lounge_messages.channel_id AND user_id = auth.uid()
      )
    )
  )
);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Students and alumni can create messages" ON public.lounge_messages;

-- Allow AURA bot to update its own messages
CREATE POLICY "AURA bot can update its messages"
ON public.lounge_messages
FOR UPDATE
TO authenticated
USING (user_id = '00000000-0000-0000-0000-000000000000');

-- Update existing "Users can update their own messages" policy to exclude AURA
DROP POLICY IF EXISTS "Users can update their own messages" ON public.lounge_messages;

CREATE POLICY "Users can update their own messages"
ON public.lounge_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND user_id != '00000000-0000-0000-0000-000000000000');