/*
  # Fix Infinite Recursion Using Security Definer Function

  ## Summary
  The recursion occurs because RLS policies on profiles check the profiles table.
  Solution: Create a SECURITY DEFINER function that bypasses RLS to check admin status.

  ## Changes Made

  ### 1. Created Security Definer Function
  - `is_admin()` - Checks if current user is an approved admin
  - Runs with SECURITY DEFINER to bypass RLS
  - Only checks the requesting user's own record

  ### 2. Updated Profiles Policies
  - Replaced recursive policy with one using the security definer function
  - No more infinite recursion

  ## Security Notes
  - Security definer function only checks auth.uid(), can't be abused
  - Users can view their own profile
  - Admins can view all profiles
  - No recursion possible
*/

-- =====================================================
-- Create security definer function to check admin status
-- =====================================================

-- Drop existing policy first
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create a security definer function that bypasses RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policy using the security definer function
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- User can view their own profile
    auth.uid() = id
    OR
    -- Or user is an admin (uses security definer function)
    is_admin()
  );
