/*
  # Lock down admin registration - Security fix

  1. Security Changes
    - Update "Users can insert own profile" RLS policy to enforce role='lp' and is_approved=false
    - This prevents any user from self-registering as an admin through the profiles table
    - Only the service role (used by edge functions) can bypass RLS to create admin profiles
    - Update "Users can update own profile" to prevent users from escalating their own role

  2. Important Notes
    - The old policy allowed any authenticated user to insert a profile with any role
    - The new policy ensures self-registered users can only be non-approved LP users
    - Admin accounts can only be created/promoted by existing admins through the admin panel
*/

-- Drop the old permissive insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a restrictive insert policy that enforces lp role and unapproved status
CREATE POLICY "Users can insert own profile as lp only"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND role = 'lp'
    AND is_approved = false
  );

-- Drop and recreate the user update policy to prevent role/approval self-escalation
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own non-admin fields"
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
    AND is_approved = false
  );
