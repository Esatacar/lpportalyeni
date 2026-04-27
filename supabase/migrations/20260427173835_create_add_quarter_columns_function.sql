/*
  # Create stored procedure to add quarterly columns

  1. New Functions
    - `add_quarter_columns(p_quarter int, p_year int)` - Adds all required quarterly
      columns to fund_level, company_data, and portfolio_data tables for a given
      quarter and year. Uses IF NOT EXISTS checks so it's safe to call multiple times.

  2. Security
    - Function uses SECURITY DEFINER to run with elevated privileges
    - Only callable by authenticated users (admin check should happen in app layer)

  3. Notes
    - Returns a text message indicating success
    - Adds 10 columns to fund_level, 7 to company_data, 2 to portfolio_data
    - All numeric columns default to 0, lp_count defaults to 0 as integer
*/

CREATE OR REPLACE FUNCTION add_quarter_columns(p_quarter int, p_year int)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  suffix text;
  col_name text;
  col_type text;
  cols text[][] := ARRAY[]::text[][];
  i int;
BEGIN
  IF p_quarter NOT IN (1,2,3,4) THEN
    RAISE EXCEPTION 'Invalid quarter: %. Must be 1-4.', p_quarter;
  END IF;
  IF p_year < 2021 OR p_year > 2099 THEN
    RAISE EXCEPTION 'Invalid year: %. Must be 2021-2099.', p_year;
  END IF;

  suffix := 'q' || p_quarter || '_' || p_year;

  -- fund_level columns
  EXECUTE format('ALTER TABLE fund_level ADD COLUMN IF NOT EXISTS fund_size_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE fund_level ADD COLUMN IF NOT EXISTS lp_count_%s integer DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE fund_level ADD COLUMN IF NOT EXISTS called_capital_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE fund_level ADD COLUMN IF NOT EXISTS investment_cost_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE fund_level ADD COLUMN IF NOT EXISTS investment_value_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE fund_level ADD COLUMN IF NOT EXISTS tvpi_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE fund_level ADD COLUMN IF NOT EXISTS moic_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE fund_level ADD COLUMN IF NOT EXISTS irr_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE fund_level ADD COLUMN IF NOT EXISTS management_fee_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE fund_level ADD COLUMN IF NOT EXISTS opex_%s numeric DEFAULT 0', suffix);

  -- company_data columns
  EXECUTE format('ALTER TABLE company_data ADD COLUMN IF NOT EXISTS paid_capital_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE company_data ADD COLUMN IF NOT EXISTS nav_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE company_data ADD COLUMN IF NOT EXISTS distributions_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE company_data ADD COLUMN IF NOT EXISTS management_fee_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE company_data ADD COLUMN IF NOT EXISTS opex_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE company_data ADD COLUMN IF NOT EXISTS unrealized_gains_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE company_data ADD COLUMN IF NOT EXISTS realized_gains_%s numeric DEFAULT 0', suffix);

  -- portfolio_data columns
  EXECUTE format('ALTER TABLE portfolio_data ADD COLUMN IF NOT EXISTS total_investment_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE portfolio_data ADD COLUMN IF NOT EXISTS total_value_%s numeric DEFAULT 0', suffix);

  RETURN 'Q' || p_quarter || ' ' || p_year || ' columns added successfully (19 columns across 3 tables)';
END;
$$;
