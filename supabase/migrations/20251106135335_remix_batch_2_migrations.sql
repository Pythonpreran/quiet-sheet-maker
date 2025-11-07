
-- Migration: 20251106115650

-- Migration: 20251106104543

-- Migration: 20251106102218

-- Migration: 20251106100649
-- Create role enum
CREATE TYPE public.user_role AS ENUM ('student', 'faculty');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = check_user_id;
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create proofs table
CREATE TABLE public.proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  document_data TEXT NOT NULL, -- base64 image data
  ai_analysis TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason TEXT,
  faculty_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;

-- RLS policies for proofs
CREATE POLICY "Students can view their own proofs"
  ON public.proofs FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own proofs"
  ON public.proofs FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Faculty can view all proofs"
  ON public.proofs FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'faculty');

CREATE POLICY "Faculty can update proofs"
  ON public.proofs FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'faculty');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proofs_updated_at
  BEFORE UPDATE ON public.proofs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-assign student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Migration: 20251106100702
-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- Migration: 20251106102336
-- Add recipient column to proofs table
ALTER TABLE public.proofs ADD COLUMN IF NOT EXISTS recipient TEXT NOT NULL DEFAULT 'HOD AIML';

-- Add comment for clarity
COMMENT ON COLUMN public.proofs.recipient IS 'The faculty/department this proof is sent to (e.g., HOD AIML, HOD CSE)';


-- Migration: 20251106105054
-- Update the handle_new_user function to automatically assign faculty role to HOD emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if email contains 'hod' or matches specific pattern
  IF NEW.email LIKE '%hod%@vvce%' OR NEW.email = 'hodaiml@vvce' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'faculty');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Migration: 20251106112115
-- Add USN field to proofs table
ALTER TABLE public.proofs
ADD COLUMN usn text;


-- Migration: 20251106120354
-- Trigger types regeneration by adding a comment
COMMENT ON TABLE public.proofs IS 'Student document proofs for verification and approval';
COMMENT ON TABLE public.user_roles IS 'User role assignments for access control';

-- Ensure both tables have proper structure
ALTER TABLE public.proofs ALTER COLUMN student_id SET NOT NULL;
ALTER TABLE public.user_roles ALTER COLUMN user_id SET NOT NULL;
