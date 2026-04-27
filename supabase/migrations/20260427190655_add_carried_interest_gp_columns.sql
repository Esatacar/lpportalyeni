/*
  # Add "Allocation of Carried Interest to General Partner" columns

  1. New Columns
    - `carried_interest_gp_q{1-4}_{2021-2026}` on `company_data` table
      - 24 new numeric columns (4 quarters x 6 years)
      - Each defaults to 0
    - These track the allocation of carried interest to the General Partner
      for each LP/company per quarter

  2. Updated Functions
    - `add_quarter_columns` now includes `carried_interest_gp` when creating
      columns for new quarters (total: 20 columns per quarter across 3 tables)
*/

-- Add carried_interest_gp columns for all existing quarters (2021-2026)
DO $$
DECLARE
  y int;
  q int;
  suffix text;
BEGIN
  FOR y IN 2021..2026 LOOP
    FOR q IN 1..4 LOOP
      suffix := 'q' || q || '_' || y;
      EXECUTE format('ALTER TABLE company_data ADD COLUMN IF NOT EXISTS carried_interest_gp_%s numeric DEFAULT 0', suffix);
    END LOOP;
  END LOOP;
END $$;

-- Update the add_quarter_columns function to include the new metric
CREATE OR REPLACE FUNCTION add_quarter_columns(p_quarter integer, p_year integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suffix text;
BEGIN
  IF p_quarter NOT IN (1,2,3,4) THEN
    RAISE EXCEPTION 'Invalid quarter: %. Must be 1-4.', p_quarter;
  END IF;
  IF p_year < 2021 OR p_year > 2099 THEN
    RAISE EXCEPTION 'Invalid year: %. Must be 2021-2099.', p_year;
  END IF;

  suffix := 'q' || p_quarter || '_' || p_year;

  -- fund_level columns (10)
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

  -- company_data columns (8)
  EXECUTE format('ALTER TABLE company_data ADD COLUMN IF NOT EXISTS paid_capital_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE company_data ADD COLUMN IF NOT EXISTS nav_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE company_data ADD COLUMN IF NOT EXISTS distributions_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE company_data ADD COLUMN IF NOT EXISTS management_fee_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE company_data ADD COLUMN IF NOT EXISTS opex_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE company_data ADD COLUMN IF NOT EXISTS unrealized_gains_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE company_data ADD COLUMN IF NOT EXISTS realized_gains_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE company_data ADD COLUMN IF NOT EXISTS carried_interest_gp_%s numeric DEFAULT 0', suffix);

  -- portfolio_data columns (2)
  EXECUTE format('ALTER TABLE portfolio_data ADD COLUMN IF NOT EXISTS total_investment_%s numeric DEFAULT 0', suffix);
  EXECUTE format('ALTER TABLE portfolio_data ADD COLUMN IF NOT EXISTS total_value_%s numeric DEFAULT 0', suffix);

  RETURN 'Q' || p_quarter || ' ' || p_year || ' columns added successfully (20 columns across 3 tables)';
END;
$$;
