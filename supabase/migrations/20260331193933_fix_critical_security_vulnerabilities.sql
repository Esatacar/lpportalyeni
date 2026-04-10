/*
  # Fix Critical Security Vulnerabilities

  ## Summary
  This migration addresses a critical security vulnerability where the profiles table
  was publicly accessible to anyone, including unauthenticated users. A friendly hacker
  was able to capture the API key and directly query the profiles table.

  ## Changes Made

  ### 1. Profiles Table Security
  - **REMOVED**: Dangerous "Public profiles are viewable by everyone" policy
  - **REMOVED**: Overly permissive "Users can update own profile" policy for public role
  - **ADDED**: Secure policy for admins to view all profiles (authenticated only)
  - **ADDED**: Secure policy for users to view only their own profile (authenticated only)
  - **ADDED**: Secure policy for users to update only their own profile (authenticated only)

  ### 2. User Preferences Table Security
  - **REMOVED**: Overly permissive policies using `USING (true)` and `WITH CHECK (true)`
  - **ADDED**: Secure policies that restrict to authenticated admin users only

  ### 3. Useful Links Table Security
  - **UPDATED**: Changed from allowing all authenticated users to view links to only approved users

  ## Security Notes
  - All policies now require authentication via `auth.uid()`
  - No data is accessible to unauthenticated users
  - Users can only access their own data unless they are approved admins
  - The `USING (true)` anti-pattern has been eliminated
*/

-- =====================================================
-- PROFILES TABLE: Remove dangerous public access
-- =====================================================

-- Drop the critically insecure policy that allows public access
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Drop the overly permissive update policy for public role
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Add secure policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_approved = true
    )
  );

-- Add secure policy for users to view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Add secure policy for users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- USER PREFERENCES TABLE: Fix insecure policies
-- =====================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can manage global preferences" ON user_preferences;
DROP POLICY IF EXISTS "Authenticated users can view preferences" ON user_preferences;

-- Add secure policy for admins to view preferences
CREATE POLICY "Admins can view preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_approved = true
    )
  );

-- Add secure policy for admins to insert preferences
CREATE POLICY "Admins can insert preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_approved = true
    )
  );

-- Add secure policy for admins to update preferences
CREATE POLICY "Admins can update preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_approved = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_approved = true
    )
  );

-- Add secure policy for admins to delete preferences
CREATE POLICY "Admins can delete preferences"
  ON user_preferences
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_approved = true
    )
  );

-- =====================================================
-- USEFUL LINKS TABLE: Require approval for viewing
-- =====================================================

-- Drop the existing overly permissive view policy
DROP POLICY IF EXISTS "Authenticated users can view useful links" ON useful_links;

-- Add secure policy requiring user approval
CREATE POLICY "Approved users can view useful links"
  ON useful_links
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_approved = true
    )
  );
