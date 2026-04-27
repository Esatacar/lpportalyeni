/*
  # Fix profile update policy for approved users

  1. Security Changes
    - Replace the overly restrictive update policy with one that allows approved users to update their profile
    - Add a trigger to prevent users from escalating their own role or approval status
    - The trigger blocks changes to role and is_approved fields unless done by an admin (service role)

  2. Important Notes
    - Regular users can update their own name, company name, etc.
    - They cannot change their own role from 'lp' to 'admin'
    - They cannot self-approve their account
    - Admin role changes must go through the admin panel (which uses service role)
*/

-- Drop the overly restrictive update policy
DROP POLICY IF EXISTS "Users can update own non-admin fields" ON profiles;

-- Recreate a reasonable update policy for regular users
CREATE POLICY "Users can update own profile safely"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    is_authenticated_user()
    AND auth.uid() = id
  )
  WITH CHECK (
    is_authenticated_user()
    AND auth.uid() = id
    AND role = 'lp'
  );

-- Create a trigger function to prevent role/approval escalation
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If the current session is the service role, allow all changes
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Prevent non-admin users from changing role
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  -- Prevent non-admin users from changing is_approved
  IF NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
    RAISE EXCEPTION 'Cannot change your own approval status';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS enforce_role_escalation ON profiles;

-- Create the trigger
CREATE TRIGGER enforce_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();
