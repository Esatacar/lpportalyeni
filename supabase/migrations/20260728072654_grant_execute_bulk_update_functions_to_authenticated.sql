-- Grant EXECUTE on bulk update functions to authenticated role
-- so they can be called via the edge function using the user's JWT.
-- The functions are SECURITY DEFINER and validate admin status internally via auth.uid().
GRANT EXECUTE ON FUNCTION bulk_update_fund_metrics(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_company_metric(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_portfolio_metric(text, jsonb) TO authenticated;
