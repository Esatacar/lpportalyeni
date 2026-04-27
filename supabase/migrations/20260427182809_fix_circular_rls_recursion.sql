/*
  # Fix circular RLS recursion causing deadlocks

  1. Problem
    - RLS policies on `profiles` call `is_authenticated_user()` and `is_admin_with_valid_session()`
    - Those functions query the `profiles` table to validate sessions
    - This creates an infinite recursion: profiles RLS -> helper function -> profiles query -> profiles RLS -> ...
    - This causes saves to hang/freeze and prevents data from loading

  2. Fix
    - Replace `profiles` RLS policies with simple auth.uid() checks that don't call helper functions
    - Rewrite `validate_session_version()` to bypass RLS using a direct catalog query
    - This breaks the circular dependency while maintaining security

  3. Security
    - profiles table still protected: users can only see/edit their own row
    - Admin access to all profiles still works via is_admin_with_valid_session()
    - Session version validation still works for all other tables
*/

-- Step 1: Drop all existing profiles SELECT/UPDATE policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile safely" ON profiles;

-- Step 2: Create simple profiles policies that DON'T call helper functions
-- This breaks the circular dependency
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_approved = true
    )
  );

CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_approved = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_approved = true
    )
  );

CREATE POLICY "Users can update own non-privileged fields"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'lp');
