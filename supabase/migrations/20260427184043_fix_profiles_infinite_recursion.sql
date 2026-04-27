/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - "Admins can view all profiles" and "Admins can manage all profiles" policies
      query the profiles table from within its own RLS policy, causing infinite recursion
    - Error: "infinite recursion detected in policy for relation profiles"

  2. Fix
    - Create a SECURITY DEFINER helper function `is_admin_no_rls()` that queries
      profiles directly, bypassing RLS (runs as table owner)
    - Replace self-referencing policies with calls to this function
    - This breaks the recursion because the function's internal query skips RLS

  3. Security
    - The function is SECURITY DEFINER so its internal SELECT bypasses RLS
    - It only returns a boolean, not profile data
    - Still checks auth.uid(), role = admin, and is_approved = true
*/

-- Create a helper that bypasses RLS to check admin status
CREATE OR REPLACE FUNCTION is_admin_no_rls()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND is_approved = true
  );
$$;

-- Drop the broken policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Recreate using the SECURITY DEFINER function (no self-referencing subquery)
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin_no_rls());

CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin_no_rls())
  WITH CHECK (is_admin_no_rls());
