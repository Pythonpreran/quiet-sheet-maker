-- Channel invitations table
CREATE TABLE public.channel_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.lounge_channels(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(channel_id, invited_user_id)
);

ALTER TABLE public.channel_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their invitations"
  ON public.channel_invitations FOR SELECT
  TO authenticated
  USING (auth.uid() = invited_user_id OR auth.uid() = invited_by);

CREATE POLICY "Students and alumni can create invitations"
  ON public.channel_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = invited_by AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('student', 'alumni')
    )
  );

CREATE POLICY "Invited users can update their invitations"
  ON public.channel_invitations FOR UPDATE
  TO authenticated
  USING (auth.uid() = invited_user_id);

-- Channel members table to track who has access
CREATE TABLE public.channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.lounge_channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view channel members"
  ON public.channel_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('student', 'alumni')
    )
  );

CREATE POLICY "System can manage channel members"
  ON public.channel_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update channels policy to include members
DROP POLICY IF EXISTS "Students and alumni can view channels" ON public.lounge_channels;

CREATE POLICY "Students and alumni can view channels"
  ON public.lounge_channels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('student', 'alumni')
    ) AND (
      -- Can see if they created it
      auth.uid() = created_by OR
      -- Or if they are a member
      EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = lounge_channels.id AND user_id = auth.uid()
      )
    )
  );

-- Update messages policy to include members
DROP POLICY IF EXISTS "Students and alumni can view messages" ON public.lounge_messages;

CREATE POLICY "Students and alumni can view messages"
  ON public.lounge_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('student', 'alumni')
    ) AND (
      -- Can see messages in channels they created
      EXISTS (
        SELECT 1 FROM public.lounge_channels
        WHERE id = lounge_messages.channel_id AND created_by = auth.uid()
      ) OR
      -- Or channels they are members of
      EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = lounge_messages.channel_id AND user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Students and alumni can create messages" ON public.lounge_messages;

CREATE POLICY "Students and alumni can create messages"
  ON public.lounge_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('student', 'alumni')
    ) AND (
      -- Can post in channels they created
      EXISTS (
        SELECT 1 FROM public.lounge_channels
        WHERE id = lounge_messages.channel_id AND created_by = auth.uid()
      ) OR
      -- Or channels they are members of
      EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = lounge_messages.channel_id AND user_id = auth.uid()
      )
    )
  );

-- Function to auto-add creator as member when channel is created
CREATE OR REPLACE FUNCTION add_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.channel_members (channel_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_channel_created
  AFTER INSERT ON public.lounge_channels
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_member();

-- Enable realtime for invitations
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_invitations;

-- Update trigger
CREATE TRIGGER update_channel_invitations_updated_at
  BEFORE UPDATE ON public.channel_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();