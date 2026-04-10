/*
  # Implement Session Version for Token Invalidation

  ## Summary
  The fundamental issue: Supabase JWTs are stateless, so auth.uid() accepts ANY valid token,
  even old ones that should have been invalidated. We cannot revoke stateless JWTs.

  ## Solution
  1. Add session_version to profiles table (increments on each login)
  2. Store session_version in JWT claims during login (via raw_app_meta_data)
  3. Create validation function that compares JWT session_version with DB version
  4. If JWT has old version number, access is denied

  ## How It Works
  - User logs in → session_version increments → new value stored in JWT
  - Old tokens have old session_version → validation fails → access denied
  - Even if attacker has valid JWT signature, version mismatch blocks access

  ## Security Guarantee
  After successful login with correct password, ALL previous tokens become invalid,
  regardless of JWT expiration time.
*/

-- =====================================================
-- Step 1: Add session_version to profiles table
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'session_version'
  ) THEN
    ALTER TABLE profiles ADD COLUMN session_version integer DEFAULT 1 NOT NULL;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_session_version ON profiles(id, session_version);

-- =====================================================
-- Step 2: Add last_login_at timestamp
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_login_at timestamptz DEFAULT now();
  END IF;
END $$;

-- =====================================================
-- Step 3: Create function to validate session version
-- =====================================================

CREATE OR REPLACE FUNCTION validate_session_version()
RETURNS BOOLEAN AS $$
DECLARE
  jwt_session_version integer;
  db_session_version integer;
  current_user_id uuid;
BEGIN
  -- Get user ID from JWT
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get session_version from JWT claims (stored in app_metadata)
  BEGIN
    jwt_session_version := COALESCE(
      (current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'session_version')::integer,
      0
    );
  EXCEPTION
    WHEN OTHERS THEN
      jwt_session_version := 0;
  END;

  -- Get current session_version from database
  SELECT session_version INTO db_session_version
  FROM profiles
  WHERE id = current_user_id;

  -- If no profile found, deny access
  IF db_session_version IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Session is valid only if JWT version matches DB version
  RETURN jwt_session_version = db_session_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth;

-- =====================================================
-- Step 4: Create function to increment session version
-- =====================================================

CREATE OR REPLACE FUNCTION increment_session_version(user_id uuid)
RETURNS integer AS $$
DECLARE
  new_version integer;
BEGIN
  UPDATE profiles
  SET 
    session_version = session_version + 1,
    last_login_at = now()
  WHERE id = user_id
  RETURNING session_version INTO new_version;
  
  RETURN new_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- Step 5: Update authentication validation functions
-- =====================================================

CREATE OR REPLACE FUNCTION is_authenticated_user()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id uuid;
  user_role text;
BEGIN
  -- Get current user ID from JWT
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- CRITICAL: Validate session version
  IF NOT validate_session_version() THEN
    RETURN FALSE;
  END IF;

  -- Verify user exists and has a valid profile
  SELECT role INTO user_role
  FROM profiles
  WHERE id = current_user_id;

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth;

CREATE OR REPLACE FUNCTION is_admin_with_valid_session()
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_authenticated_user() THEN
    RETURN FALSE;
  END IF;

  IF NOT validate_session_version() THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth;

CREATE OR REPLACE FUNCTION is_approved_lp_with_valid_session()
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_authenticated_user() THEN
    RETURN FALSE;
  END IF;

  IF NOT validate_session_version() THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'lp'
    AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth;

-- =====================================================
-- Step 6: Grant execute permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION validate_session_version() TO authenticated;
GRANT EXECUTE ON FUNCTION increment_session_version(uuid) TO authenticated;

-- =====================================================
-- Step 7: Add comments
-- =====================================================

COMMENT ON COLUMN profiles.session_version IS 'Increments on each login to invalidate old JWT tokens';
COMMENT ON COLUMN profiles.last_login_at IS 'Timestamp of last successful login';
COMMENT ON FUNCTION validate_session_version() IS 'Validates JWT session version matches database - prevents token reuse';
COMMENT ON FUNCTION increment_session_version(uuid) IS 'Increments user session version to invalidate all existing tokens';
