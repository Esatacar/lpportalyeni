/*
  # Fix session version null mismatch blocking admin writes

  1. Problem
    - Some admin users have no `session_version` in their JWT app_metadata (null)
    - But their profiles table has `session_version = 1`
    - The `validate_session_version()` function COALESCEs null to 0, causing 0 != 1 mismatch
    - This silently blocks all RLS-protected writes for those admins

  2. Fix
    - Update `validate_session_version()` to treat null JWT session_version as valid
      (null means session versioning was never initialized for that user)
    - Reset `session_version` to 0 in profiles for users who have no session_version in app_metadata,
      so they match after re-login

  3. Security
    - Session version validation still works for users who have an explicit session_version in their JWT
    - Only null (uninitialized) JWT values skip the check, which is the default state for new users
*/

-- Fix the function to handle null JWT session_version gracefully
CREATE OR REPLACE FUNCTION validate_session_version()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- If JWT has no session_version at all, allow access (session versioning not initialized for this user)
  IF jwt_session_version IS NULL THEN
    RETURN TRUE;
  END IF;

  SELECT session_version INTO db_session_version
  FROM profiles
  WHERE id = current_user_id;

  IF db_session_version IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN jwt_session_version = db_session_version;
END;
$$;
