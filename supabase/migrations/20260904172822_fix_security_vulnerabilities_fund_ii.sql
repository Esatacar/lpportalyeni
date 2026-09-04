-- =====================================================
-- Security Fix 1: Revoke anon access to all public tables
-- anon role should never have direct table access
-- =====================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Ensure authenticated still has access
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- =====================================================
-- Security Fix 2: Lock down profile privilege columns
-- The prevent_role_escalation trigger only blocks role + is_approved.
-- Extend it to also block status, email, and assigned_company_id changes
-- by non-admins.
-- =====================================================

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  caller_id uuid;
  caller_is_admin boolean;
BEGIN
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  caller_id := auth.uid();

  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = caller_id
    AND role = 'admin'
    AND is_approved = true
  ) INTO caller_is_admin;

  -- Admins updating other users' rows: allow
  IF caller_is_admin AND OLD.id <> caller_id THEN
    RETURN NEW;
  END IF;

  -- Self-updates: block all privilege columns
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Cannot change your own role';
    END IF;
    IF NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
      RAISE EXCEPTION 'Cannot change your own approval status';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Cannot change your own status';
    END IF;
    IF NEW.assigned_company_id IS DISTINCT FROM OLD.assigned_company_id THEN
      RAISE EXCEPTION 'Cannot change your own company assignment';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Cannot change profile email';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- =====================================================
-- Security Fix 3: Revoke EXECUTE on SECURITY DEFINER functions
-- from authenticated role. These functions (bulk_update_*)
-- should only be called via the bulk-update edge function which
-- does its own admin check, not directly via REST API.
-- =====================================================
REVOKE EXECUTE ON FUNCTION public.bulk_update_company_metric(text, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.bulk_update_company_metric(text, jsonb) FROM anon;

REVOKE EXECUTE ON FUNCTION public.bulk_update_fund_metrics(uuid, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.bulk_update_fund_metrics(uuid, jsonb) FROM anon;

REVOKE EXECUTE ON FUNCTION public.bulk_update_portfolio_metric(text, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.bulk_update_portfolio_metric(text, jsonb) FROM anon;

-- Keep service_role and postgres able to call them
GRANT EXECUTE ON FUNCTION public.bulk_update_company_metric(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.bulk_update_fund_metrics(uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.bulk_update_portfolio_metric(text, jsonb) TO service_role;

-- =====================================================
-- Security Fix 4: Narrow column-level UPDATE on profiles
-- Users should only be able to update non-privileged columns.
-- Privileged columns (role, is_approved, status, assigned_company_id, email)
-- are protected by the trigger above AND by column-level grants.
-- =====================================================
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, company_name) ON public.profiles TO authenticated;
