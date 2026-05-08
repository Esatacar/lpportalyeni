/*
  # Move Security Functions to Private Schema

  1. Changes
    - Create `private` schema (not exposed by PostgREST)
    - Recreate all RLS helper functions in `private` schema
    - Update all RLS policies to reference `private.function_name()`
    - Drop public versions of RLS helper functions
    - Revoke EXECUTE on bulk_update functions from `authenticated`

  2. Security
    - RLS helper functions no longer callable via REST API `/rpc/` endpoint
    - Bulk update functions no longer callable directly by any client role
    - All functions still work internally (policies, triggers, service_role)

  3. Notes
    - The `private` schema is not in PostgREST's `schemas` config, so functions
      there are never exposed via the REST API
    - RLS policies can still call `private.fn()` because policy evaluation
      runs with the function owner's privileges (SECURITY DEFINER)
    - Bulk update operations will be proxied through an edge function
*/

-- Create private schema for internal functions
CREATE SCHEMA IF NOT EXISTS private;

-- Grant usage on private schema to authenticated (needed for RLS policy evaluation)
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

-- Recreate RLS helper functions in private schema

CREATE OR REPLACE FUNCTION private.is_admin()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path TO 'public', 'auth'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND is_approved = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.is_admin_no_rls()
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND is_approved = true
  );
$$;

CREATE OR REPLACE FUNCTION private.is_admin_with_valid_session()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path TO 'public', 'auth'
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

CREATE OR REPLACE FUNCTION private.is_approved_lp_with_valid_session()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path TO 'public', 'auth'
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

CREATE OR REPLACE FUNCTION private.is_authenticated_user()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path TO 'public', 'auth'
AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.is_valid_session()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path TO 'public', 'auth'
AS $$
DECLARE
  current_user_id uuid;
  token_exp bigint;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  token_exp := COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'exp')::bigint,
    0
  );

  IF token_exp > 0 AND token_exp < EXTRACT(EPOCH FROM now()) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_session_version()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path TO 'public', 'auth'
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

-- Grant EXECUTE on private functions to authenticated (needed for RLS evaluation)
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin_no_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin_with_valid_session() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_approved_lp_with_valid_session() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_authenticated_user() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_valid_session() TO authenticated;
GRANT EXECUTE ON FUNCTION private.validate_session_version() TO authenticated;

-- Now update all RLS policies to use private schema functions

-- company_data policies
DROP POLICY IF EXISTS "Admins can manage all companies" ON company_data;
CREATE POLICY "Admins can manage all companies" ON company_data
  FOR ALL TO authenticated
  USING (private.is_admin_with_valid_session())
  WITH CHECK (private.is_admin_with_valid_session());

DROP POLICY IF EXISTS "Users can view assigned company" ON company_data;
CREATE POLICY "Users can view assigned company" ON company_data
  FOR SELECT TO authenticated
  USING (
    private.is_authenticated_user() AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.assigned_company_id = company_data.id
      AND profiles.is_approved = true
    )
  );

-- fund_level policies
DROP POLICY IF EXISTS "Admins can manage fund level data" ON fund_level;
CREATE POLICY "Admins can manage fund level data" ON fund_level
  FOR ALL TO authenticated
  USING (private.is_admin_with_valid_session())
  WITH CHECK (private.is_admin_with_valid_session());

DROP POLICY IF EXISTS "LPs can view fund level data" ON fund_level;
CREATE POLICY "LPs can view fund level data" ON fund_level
  FOR SELECT TO authenticated
  USING (private.is_approved_lp_with_valid_session());

-- portfolio_data policies
DROP POLICY IF EXISTS "Admins can manage portfolio data" ON portfolio_data;
CREATE POLICY "Admins can manage portfolio data" ON portfolio_data
  FOR ALL TO authenticated
  USING (private.is_admin_with_valid_session())
  WITH CHECK (private.is_admin_with_valid_session());

DROP POLICY IF EXISTS "LPs can view portfolio data" ON portfolio_data;
CREATE POLICY "LPs can view portfolio data" ON portfolio_data
  FOR SELECT TO authenticated
  USING (private.is_approved_lp_with_valid_session());

-- useful_links policies
DROP POLICY IF EXISTS "Admins can manage useful links" ON useful_links;
CREATE POLICY "Admins can manage useful links" ON useful_links
  FOR ALL TO authenticated
  USING (private.is_admin_with_valid_session())
  WITH CHECK (private.is_admin_with_valid_session());

DROP POLICY IF EXISTS "Approved users can view useful links" ON useful_links;
CREATE POLICY "Approved users can view useful links" ON useful_links
  FOR SELECT TO authenticated
  USING (
    private.is_authenticated_user() AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_approved = true
    )
  );

-- user_preferences policies
DROP POLICY IF EXISTS "Admins can manage preferences" ON user_preferences;
CREATE POLICY "Admins can manage preferences" ON user_preferences
  FOR ALL TO authenticated
  USING (private.is_admin_with_valid_session())
  WITH CHECK (private.is_admin_with_valid_session());

-- profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (private.is_admin_no_rls());

DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL TO authenticated
  USING (private.is_admin_no_rls())
  WITH CHECK (private.is_admin_no_rls());

-- Now drop the public versions of RLS helper functions
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_admin_no_rls();
DROP FUNCTION IF EXISTS public.is_admin_with_valid_session();
DROP FUNCTION IF EXISTS public.is_approved_lp_with_valid_session();
DROP FUNCTION IF EXISTS public.is_authenticated_user();
DROP FUNCTION IF EXISTS public.is_valid_session();
DROP FUNCTION IF EXISTS public.validate_session_version();

-- Revoke EXECUTE on bulk_update functions from authenticated (will be proxied via edge function)
REVOKE EXECUTE ON FUNCTION public.bulk_update_company_metric(text, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.bulk_update_fund_metrics(uuid, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.bulk_update_portfolio_metric(text, jsonb) FROM authenticated;
