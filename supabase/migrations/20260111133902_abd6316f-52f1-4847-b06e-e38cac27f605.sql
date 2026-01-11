-- 1. Make business-assets bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'business-assets';

-- 2. Improve has_role function with defensive checks to prevent potential privilege escalation
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Safety check: if checking another user's roles, verify caller has admin privileges
  -- This prevents potential abuse of the SECURITY DEFINER privilege
  IF _user_id != auth.uid() THEN
    -- Only allow admins to check other users' roles
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Return whether the user has the requested role
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- 3. Create a separate function for checking current user's admin status
-- This breaks the circular dependency in admin policy
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- 4. Add audit logging for role changes (defense in depth)
CREATE TABLE IF NOT EXISTS public.user_role_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  action TEXT NOT NULL,
  changed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.user_role_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view role audit logs"
ON public.user_role_audit
FOR SELECT
USING (public.is_current_user_admin());

-- Create trigger to audit role changes
CREATE OR REPLACE FUNCTION public.audit_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_role_audit (user_id, role, action, changed_by)
    VALUES (NEW.user_id, NEW.role, 'INSERT', auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.user_role_audit (user_id, role, action, changed_by)
    VALUES (OLD.user_id, OLD.role, 'DELETE', auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.user_role_audit (user_id, role, action, changed_by)
    VALUES (NEW.user_id, NEW.role, 'UPDATE', auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_audit_role_change ON public.user_roles;
CREATE TRIGGER trigger_audit_role_change
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_role_change();