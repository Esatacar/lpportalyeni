-- =====================================================
-- Fix: Restore admin-controlled column updates on profiles
--
-- The previous security migration narrowed the column-level UPDATE
-- grant to only (full_name, company_name). This blocked admins from
-- updating assigned_company_id, is_approved, status, and updated_at
-- on other users' profiles — even though the RLS policy and trigger
-- already authorize admin-only updates of those columns.
--
-- This migration adds the admin-controlled columns back to the
-- column-level grant. Security is still enforced by:
--   1. RLS: "Admins can manage all profiles" allows admin updates
--      on any row; "Users can update own non-privileged fields"
--      allows self-updates only.
--   2. Trigger (prevent_role_escalation): blocks non-admin
--      self-updates of role, is_approved, status, assigned_company_id,
--      and email.
-- =====================================================

GRANT UPDATE (full_name, company_name, assigned_company_id, is_approved, status, updated_at) ON public.profiles TO authenticated;
