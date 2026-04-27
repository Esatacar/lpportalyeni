/*
  # Fix role escalation trigger to allow admin operations

  1. Problem
    - The prevent_role_escalation trigger only allows service_role to change role/is_approved
    - Admins using the dashboard use a regular JWT, not service_role
    - This blocks admins from approving users or changing roles

  2. Fix
    - Allow changes if the calling user is an approved admin (and not changing their own record)
    - Still block regular users from escalating themselves

  3. Security
    - Regular users still cannot change their own role or approval status
    - Admins can manage other users' roles and approval
    - Admins cannot escalate themselves (self-change still blocked unless service_role)
*/

CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_id uuid;
  caller_is_admin boolean;
BEGIN
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  caller_id := auth.uid();

  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = caller_id
    AND role = 'admin'
    AND is_approved = true
  ) INTO caller_is_admin;

  IF caller_is_admin AND OLD.id <> caller_id THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  IF NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
    RAISE EXCEPTION 'Cannot change your own approval status';
  END IF;

  RETURN NEW;
END;
$$;
