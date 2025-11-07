-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('student', 'alumni', 'faculty');

-- Create enum for idea stages
CREATE TYPE public.idea_stage AS ENUM ('idea', 'poc', 'mvp');

-- Create enum for priority levels
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high');

-- Create enum for task status
CREATE TYPE public.task_status AS ENUM ('backlog', 'doing', 'done');

-- Create enum for mentor request status
CREATE TYPE public.request_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Create profiles table with role-specific fields
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  
  -- Student fields
  skills TEXT[],
  interests TEXT[],
  domain_preferences TEXT[],
  
  -- Alumni fields
  startup_name TEXT,
  startup_domain TEXT,
  tech_stack TEXT[],
  traction TEXT,
  team_size INTEGER,
  help_areas TEXT[], -- Tech, Product, Fundraising, GTM, Hiring
  mentorship_availability BOOLEAN DEFAULT false,
  preferred_idea_stages idea_stage[],
  
  -- Faculty fields
  expertise TEXT[],
  preferred_startup_stages idea_stage[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create startup_ideas table
CREATE TABLE public.startup_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  problem TEXT NOT NULL,
  solution TEXT NOT NULL,
  target_user TEXT NOT NULL,
  tech_stack TEXT[],
  tags TEXT[],
  stage idea_stage NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create idea_validations table
CREATE TABLE public.idea_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.startup_ideas(id) ON DELETE CASCADE NOT NULL,
  problem_clarity_score INTEGER CHECK (problem_clarity_score >= 0 AND problem_clarity_score <= 100),
  market_need_score INTEGER CHECK (market_need_score >= 0 AND market_need_score <= 100),
  solution_feasibility_score INTEGER CHECK (solution_feasibility_score >= 0 AND solution_feasibility_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  risk_notes TEXT,
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create roadmaps table
CREATE TABLE public.roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.startup_ideas(id) ON DELETE CASCADE NOT NULL,
  total_weeks INTEGER NOT NULL DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create roadmap_items table
CREATE TABLE public.roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  projects TEXT[],
  kpis TEXT[],
  required_skills TEXT[],
  milestones TEXT[],
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mentor_matches table
CREATE TABLE public.mentor_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  idea_id UUID REFERENCES public.startup_ideas(id) ON DELETE CASCADE NOT NULL,
  domain_match_score INTEGER CHECK (domain_match_score >= 0 AND domain_match_score <= 100),
  tech_match_score INTEGER CHECK (tech_match_score >= 0 AND tech_match_score <= 100),
  stage_match_score INTEGER CHECK (stage_match_score >= 0 AND stage_match_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  match_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mentor_requests table
CREATE TABLE public.mentor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.mentor_matches(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  idea_id UUID REFERENCES public.startup_ideas(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status request_status DEFAULT 'pending',
  mentor_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create kanban_tasks table
CREATE TABLE public.kanban_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.startup_ideas(id) ON DELETE CASCADE NOT NULL,
  roadmap_item_id UUID REFERENCES public.roadmap_items(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'backlog',
  priority priority_level DEFAULT 'medium',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  attachments TEXT[],
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create progress_updates table
CREATE TABLE public.progress_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.startup_ideas(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL,
  update_text TEXT NOT NULL,
  mentor_feedback TEXT,
  ai_summary TEXT,
  risks_identified TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pitch_decks table
CREATE TABLE public.pitch_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.startup_ideas(id) ON DELETE CASCADE NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_decks ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for startup_ideas
CREATE POLICY "Users can view all startup ideas"
  ON public.startup_ideas FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own ideas"
  ON public.startup_ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ideas"
  ON public.startup_ideas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ideas"
  ON public.startup_ideas FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for idea_validations
CREATE POLICY "Users can view validations for ideas they can see"
  ON public.idea_validations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.startup_ideas
      WHERE id = idea_id
    )
  );

CREATE POLICY "Users can create validations for their ideas"
  ON public.idea_validations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.startup_ideas
      WHERE id = idea_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for roadmaps
CREATE POLICY "Users can view roadmaps for ideas they can see"
  ON public.roadmaps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.startup_ideas
      WHERE id = idea_id
    )
  );

CREATE POLICY "Users can create roadmaps for their ideas"
  ON public.roadmaps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.startup_ideas
      WHERE id = idea_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update roadmaps for their ideas"
  ON public.roadmaps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.startup_ideas
      WHERE id = idea_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for roadmap_items
CREATE POLICY "Users can view roadmap items"
  ON public.roadmap_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.roadmaps r
      JOIN public.startup_ideas si ON r.idea_id = si.id
      WHERE r.id = roadmap_id
    )
  );

CREATE POLICY "Students can modify their roadmap items"
  ON public.roadmap_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.roadmaps r
      JOIN public.startup_ideas si ON r.idea_id = si.id
      WHERE r.id = roadmap_id AND si.user_id = auth.uid()
    )
  );

-- RLS Policies for mentor_matches
CREATE POLICY "Users can view matches involving them"
  ON public.mentor_matches FOR SELECT
  USING (auth.uid() IN (student_id, mentor_id));

CREATE POLICY "Students can create matches"
  ON public.mentor_matches FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- RLS Policies for mentor_requests
CREATE POLICY "Users can view requests involving them"
  ON public.mentor_requests FOR SELECT
  USING (auth.uid() IN (student_id, mentor_id));

CREATE POLICY "Students can create requests"
  ON public.mentor_requests FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Mentors can update requests to them"
  ON public.mentor_requests FOR UPDATE
  USING (auth.uid() = mentor_id);

-- RLS Policies for kanban_tasks
CREATE POLICY "Users can view tasks for ideas they're involved with"
  ON public.kanban_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.startup_ideas si
      WHERE si.id = idea_id AND si.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.mentor_requests mr
      WHERE mr.idea_id = kanban_tasks.idea_id 
      AND mr.mentor_id = auth.uid() 
      AND mr.status = 'accepted'
    )
  );

CREATE POLICY "Students and accepted mentors can create tasks"
  ON public.kanban_tasks FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND (
      EXISTS (
        SELECT 1 FROM public.startup_ideas
        WHERE id = idea_id AND user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.mentor_requests
        WHERE idea_id = kanban_tasks.idea_id 
        AND mentor_id = auth.uid() 
        AND status = 'accepted'
      )
    )
  );

CREATE POLICY "Students can update their tasks"
  ON public.kanban_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.startup_ideas
      WHERE id = idea_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for progress_updates
CREATE POLICY "Users can view progress for ideas they're involved with"
  ON public.progress_updates FOR SELECT
  USING (
    auth.uid() = student_id
    OR
    EXISTS (
      SELECT 1 FROM public.mentor_requests
      WHERE idea_id = progress_updates.idea_id 
      AND mentor_id = auth.uid() 
      AND status = 'accepted'
    )
  );

CREATE POLICY "Students can create their own progress updates"
  ON public.progress_updates FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Mentors can update progress feedback"
  ON public.progress_updates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.mentor_requests
      WHERE idea_id = progress_updates.idea_id 
      AND mentor_id = auth.uid() 
      AND status = 'accepted'
    )
  );

-- RLS Policies for pitch_decks
CREATE POLICY "Users can view pitch decks for their ideas"
  ON public.pitch_decks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.startup_ideas
      WHERE id = idea_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create pitch decks for their ideas"
  ON public.pitch_decks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.startup_ideas
      WHERE id = idea_id AND user_id = auth.uid()
    )
  );

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_startup_ideas
  BEFORE UPDATE ON public.startup_ideas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_roadmaps
  BEFORE UPDATE ON public.roadmaps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_roadmap_items
  BEFORE UPDATE ON public.roadmap_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_mentor_requests
  BEFORE UPDATE ON public.mentor_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_kanban_tasks
  BEFORE UPDATE ON public.kanban_tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_pitch_decks
  BEFORE UPDATE ON public.pitch_decks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();