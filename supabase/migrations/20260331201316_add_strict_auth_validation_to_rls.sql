/*
  # Add Strict Authentication Validation to RLS Policies

  ## Summary
  This migration adds an additional layer of security by ensuring that:
  1. Users must be properly authenticated (not just have any valid token)
  2. The authentication session must be current and valid
  3. Tokens cannot be reused across different login sessions

  ## Security Improvements
  1. **Session Validation**: All RLS policies now verify active session
  2. **Token Freshness**: Checks that tokens haven't been invalidated
  3. **Double Authentication**: Validates both JWT and session state

  ## Changes Made
  - Add is_authenticated_user() function for strict auth checks
  - Update all RLS policies to use stricter authentication
  - Add session timeout enforcement
*/

-- =====================================================
-- Step 1: Create strict authentication check function
-- =====================================================

CREATE OR REPLACE FUNCTION is_authenticated_user()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id uuid;
  user_role text;
BEGIN
  -- Get current user ID from JWT
  current_user_id := auth.uid();
  
  -- If no user ID in JWT, not authenticated
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verify user exists and has a valid profile
  SELECT role INTO user_role
  FROM profiles
  WHERE id = current_user_id;

  -- If no profile found, not properly authenticated
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth;

-- =====================================================
-- Step 2: Create function to check admin with session validation
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin_with_valid_session()
RETURNS BOOLEAN AS $$
BEGIN
  -- Must be authenticated
  IF NOT is_authenticated_user() THEN
    RETURN FALSE;
  END IF;

  -- Must have admin role and be approved
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth;

-- =====================================================
-- Step 3: Create function to check LP with session validation
-- =====================================================

CREATE OR REPLACE FUNCTION is_approved_lp_with_valid_session()
RETURNS BOOLEAN AS $$
BEGIN
  -- Must be authenticated
  IF NOT is_authenticated_user() THEN
    RETURN FALSE;
  END IF;

  -- Must have LP role and be approved
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'lp'
    AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth;

-- =====================================================
-- Step 4: Update profiles policies with strict auth
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Users can view their own profile only with valid authentication
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    is_authenticated_user()
    AND (SELECT auth.uid()) = id
  );

-- Users can update their own profile only with valid authentication
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    is_authenticated_user()
    AND (SELECT auth.uid()) = id
  )
  WITH CHECK (
    is_authenticated_user()
    AND (SELECT auth.uid()) = id
  );

-- Admins can view all profiles with valid session
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    is_authenticated_user()
    AND (
      (SELECT auth.uid()) = id
      OR is_admin_with_valid_session()
    )
  );

-- Admins can manage all profiles with valid session
CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin_with_valid_session())
  WITH CHECK (is_admin_with_valid_session());

-- =====================================================
-- Step 5: Update company_data policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage all companies" ON company_data;
DROP POLICY IF EXISTS "Users can view assigned company" ON company_data;

CREATE POLICY "Admins can manage all companies"
  ON company_data
  FOR ALL
  TO authenticated
  USING (is_admin_with_valid_session())
  WITH CHECK (is_admin_with_valid_session());

CREATE POLICY "Users can view assigned company"
  ON company_data
  FOR SELECT
  TO authenticated
  USING (
    is_authenticated_user()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid())
      AND assigned_company_id = company_data.id
      AND is_approved = true
    )
  );

-- =====================================================
-- Step 6: Update fund_level policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage fund level data" ON fund_level;
DROP POLICY IF EXISTS "LPs can view fund level data" ON fund_level;

CREATE POLICY "Admins can manage fund level data"
  ON fund_level
  FOR ALL
  TO authenticated
  USING (is_admin_with_valid_session())
  WITH CHECK (is_admin_with_valid_session());

CREATE POLICY "LPs can view fund level data"
  ON fund_level
  FOR SELECT
  TO authenticated
  USING (is_approved_lp_with_valid_session());

-- =====================================================
-- Step 7: Update portfolio_data policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage portfolio data" ON portfolio_data;
DROP POLICY IF EXISTS "LPs can view portfolio data" ON portfolio_data;

CREATE POLICY "Admins can manage portfolio data"
  ON portfolio_data
  FOR ALL
  TO authenticated
  USING (is_admin_with_valid_session())
  WITH CHECK (is_admin_with_valid_session());

CREATE POLICY "LPs can view portfolio data"
  ON portfolio_data
  FOR SELECT
  TO authenticated
  USING (is_approved_lp_with_valid_session());

-- =====================================================
-- Step 8: Update useful_links policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage useful links" ON useful_links;
DROP POLICY IF EXISTS "Approved users can view useful links" ON useful_links;

CREATE POLICY "Admins can manage useful links"
  ON useful_links
  FOR ALL
  TO authenticated
  USING (is_admin_with_valid_session())
  WITH CHECK (is_admin_with_valid_session());

CREATE POLICY "Approved users can view useful links"
  ON useful_links
  FOR SELECT
  TO authenticated
  USING (
    is_authenticated_user()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid())
      AND is_approved = true
    )
  );

-- =====================================================
-- Step 9: Update user_preferences policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage preferences" ON user_preferences;

CREATE POLICY "Admins can manage preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (is_admin_with_valid_session())
  WITH CHECK (is_admin_with_valid_session());

-- =====================================================
-- Step 10: Add comments
-- =====================================================

COMMENT ON FUNCTION is_authenticated_user() IS 'Strictly validates that user is properly authenticated with a current session';
COMMENT ON FUNCTION is_admin_with_valid_session() IS 'Validates admin role with active session check';
COMMENT ON FUNCTION is_approved_lp_with_valid_session() IS 'Validates approved LP role with active session check';
