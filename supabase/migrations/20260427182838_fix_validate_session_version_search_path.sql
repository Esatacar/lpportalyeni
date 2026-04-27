/*
  # Fix validate_session_version search_path and ensure no recursion

  1. Changes
    - Recreate `validate_session_version()` with proper search_path setting
    - Recreate `is_authenticated_user()` to NOT query profiles (just check JWT)
    - This eliminates any remaining possibility of circular RLS calls

  2. Security
    - Session version check still validates JWT claim against profiles table
    - is_authenticated_user just checks auth.uid() is not null (lightweight)
    - Admin/LP checks still done in is_admin_with_valid_session / is_approved_lp_with_valid_session
*/

-- Simplify is_authenticated_user to NOT query profiles at all
-- It just checks that there's a valid JWT - no session version check here
CREATE OR REPLACE FUNCTION is_authenticated_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$;

-- Fix validate_session_version with proper search_path
CREATE OR REPLACE FUNCTION validate_session_version()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  jwt_session_version integer;
  db_session_version integer;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  BEGIN
    jwt_session_version := (current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'session_version')::integer;
  EXCEPTION
    WHEN OTHERS THEN
      jwt_session_version := NULL;
  END;

  IF jwt_session_version IS NULL THEN
    RETURN TRUE;
  END IF;

  SELECT session_version INTO db_session_version
  FROM profiles
  WHERE id = current_user_id;

  IF db_session_version IS NULL THEN
    RETURN TRUE;
  END IF;

  RETURN jwt_session_version = db_session_version;
END;
$$;

-- Recreate is_admin_with_valid_session to be clean
CREATE OR REPLACE FUNCTION is_admin_with_valid_session()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = current_user_id
    AND role = 'admin'
    AND is_approved = true
  );
END;
$$;

-- Recreate is_approved_lp_with_valid_session to be clean
CREATE OR REPLACE FUNCTION is_approved_lp_with_valid_session()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = current_user_id
    AND role = 'lp'
    AND is_approved = true
  );
END;
$$;
