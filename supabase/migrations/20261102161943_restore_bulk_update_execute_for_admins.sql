/*
# Restore execute permission on bulk update functions

1. Problem
- Saving Fund Level, LP, and Portfolio quarterly data showed "Failed to save".
- The bulk-update edge function runs these functions as the signed-in admin.
- A previous security migration removed EXECUTE from the `authenticated` role, so the database rejected every call.

2. Changes
- Grants EXECUTE on `bulk_update_fund_metrics`, `bulk_update_company_metric`, and `bulk_update_portfolio_metric` back to `authenticated`.

3. Security
- Each function already raises an error unless `auth.uid()` belongs to an approved admin, so non-admin callers are still rejected.
- `anon` remains without EXECUTE permission.

4. Notes
- Safe to re-run; GRANT is idempotent.
*/

GRANT EXECUTE ON FUNCTION public.bulk_update_fund_metrics(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_update_company_metric(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_update_portfolio_metric(text, jsonb) TO authenticated;
