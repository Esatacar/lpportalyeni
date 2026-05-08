/*
  # Fix SECURITY DEFINER Function Permissions

  1. Security Changes
    - Fix mutable search_path on `bulk_update_company_metric`
    - Revoke EXECUTE from `anon` and `public` roles on ALL security definer functions
    - Grant EXECUTE to `authenticated` role only on bulk update functions (called from admin frontend)
    - Grant EXECUTE to `authenticated` on RLS helper functions (needed during query evaluation)
    - Edge-function-only functions (increment_session_version, get_profile_by_id, add_quarter_columns) 
      only accessible via service_role
    - Trigger functions (prevent_role_escalation, notify_*) not callable via REST API
    - Maintenance functions (cleanup_expired_sessions) only accessible via service_role

  2. Notes
    - RLS policy helper functions (is_admin_with_valid_session, etc.) must remain executable 
      by authenticated role because they are evaluated in the context of the user's query
    - The service_role used by edge functions bypasses these restrictions
*/

-- Fix mutable search_path on bulk_update_company_metric
ALTER FUNCTION public.bulk_update_company_metric(p_column_key text, p_updates jsonb)
  SET search_path = public;

-- Revoke all public/anon EXECUTE permissions on all security definer functions
REVOKE EXECUTE ON FUNCTION public.bulk_update_company_metric(text, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.bulk_update_fund_metrics(uuid, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.bulk_update_portfolio_metric(text, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.add_quarter_columns(integer, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_sessions() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_profile_by_id(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.increment_session_version(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin_no_rls() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin_with_valid_session() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_approved_lp_with_valid_session() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_authenticated_user() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_valid_session() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_approval_webhook() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_signup_webhook() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.prevent_role_escalation() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.validate_session_version() FROM anon, public;

-- Also revoke from authenticated where not needed (edge-function-only and trigger functions)
REVOKE EXECUTE ON FUNCTION public.add_quarter_columns(integer, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_sessions() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_profile_by_id(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_session_version(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_approval_webhook() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_signup_webhook() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_role_escalation() FROM authenticated;

-- Grant EXECUTE to authenticated for functions called from the admin frontend
GRANT EXECUTE ON FUNCTION public.bulk_update_company_metric(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_update_fund_metrics(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_update_portfolio_metric(text, jsonb) TO authenticated;

-- Grant EXECUTE to authenticated for RLS helper functions (evaluated during queries)
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_no_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_with_valid_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved_lp_with_valid_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_authenticated_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_session_version() TO authenticated;
