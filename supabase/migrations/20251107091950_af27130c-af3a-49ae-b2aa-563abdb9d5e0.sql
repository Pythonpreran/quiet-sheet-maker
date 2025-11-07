-- Create webhook trigger for auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_webhook()
RETURNS trigger AS $$
BEGIN
  -- Call the edge function via pg_net (if available) or handle directly
  -- For now, we'll handle admin assignment directly in the trigger
  IF NEW.email = 'vvce@admin2' THEN
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Insert profile
    INSERT INTO public.profiles (id, email, full_name, role_type)
    VALUES (NEW.id, NEW.email, 'Admin', 'admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_webhook();