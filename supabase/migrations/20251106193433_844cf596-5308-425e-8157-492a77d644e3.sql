-- Allow users to update their own messages in lounge
CREATE POLICY "Users can update their own messages"
ON public.lounge_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);