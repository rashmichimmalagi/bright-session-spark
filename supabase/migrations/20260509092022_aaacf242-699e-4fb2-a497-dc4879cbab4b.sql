
-- Enums
CREATE TYPE public.app_role AS ENUM ('student', 'admin');
CREATE TYPE public.student_status AS ENUM ('pending', 'approved', 'rejected');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  usn TEXT UNIQUE,
  admin_id TEXT UNIQUE,
  department TEXT,
  status public.student_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Profiles policies
CREATE POLICY "profiles_self_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_admin_select" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- user_roles policies
CREATE POLICY "user_roles_self_select" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_roles_admin_select" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
  _status public.student_status;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student');
  _status := CASE WHEN _role = 'admin' THEN 'approved'::public.student_status ELSE 'pending'::public.student_status END;

  INSERT INTO public.profiles (id, name, email, usn, admin_id, department, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'usn', ''),
    NULLIF(NEW.raw_user_meta_data->>'admin_id', ''),
    NULLIF(NEW.raw_user_meta_data->>'department', ''),
    _status
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
