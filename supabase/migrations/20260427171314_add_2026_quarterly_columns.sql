/*
  # Add 2026 quarterly columns

  1. Modified Tables
    - `fund_level` - Add Q1-Q4 2026 columns for all 10 fund metrics
      (fund_size, lp_count, called_capital, investment_cost, investment_value, tvpi, moic, irr, management_fee, opex)
    - `company_data` - Add Q1-Q4 2026 columns for all 7 LP metrics
      (paid_capital, nav, distributions, management_fee, opex, unrealized_gains, realized_gains)
    - `portfolio_data` - Add Q1-Q4 2026 columns for both portfolio metrics
      (total_investment, total_value)

  2. Notes
    - All new columns default to 0
    - Uses IF NOT EXISTS checks to prevent errors on re-run
*/

-- fund_level: 10 metrics x 4 quarters = 40 columns
DO $$
BEGIN
  -- fund_size
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='fund_size_q1_2026') THEN ALTER TABLE fund_level ADD COLUMN fund_size_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='fund_size_q2_2026') THEN ALTER TABLE fund_level ADD COLUMN fund_size_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='fund_size_q3_2026') THEN ALTER TABLE fund_level ADD COLUMN fund_size_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='fund_size_q4_2026') THEN ALTER TABLE fund_level ADD COLUMN fund_size_q4_2026 numeric DEFAULT 0; END IF;

  -- lp_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='lp_count_q1_2026') THEN ALTER TABLE fund_level ADD COLUMN lp_count_q1_2026 integer DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='lp_count_q2_2026') THEN ALTER TABLE fund_level ADD COLUMN lp_count_q2_2026 integer DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='lp_count_q3_2026') THEN ALTER TABLE fund_level ADD COLUMN lp_count_q3_2026 integer DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='lp_count_q4_2026') THEN ALTER TABLE fund_level ADD COLUMN lp_count_q4_2026 integer DEFAULT 0; END IF;

  -- called_capital
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='called_capital_q1_2026') THEN ALTER TABLE fund_level ADD COLUMN called_capital_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='called_capital_q2_2026') THEN ALTER TABLE fund_level ADD COLUMN called_capital_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='called_capital_q3_2026') THEN ALTER TABLE fund_level ADD COLUMN called_capital_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='called_capital_q4_2026') THEN ALTER TABLE fund_level ADD COLUMN called_capital_q4_2026 numeric DEFAULT 0; END IF;

  -- investment_cost
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='investment_cost_q1_2026') THEN ALTER TABLE fund_level ADD COLUMN investment_cost_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='investment_cost_q2_2026') THEN ALTER TABLE fund_level ADD COLUMN investment_cost_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='investment_cost_q3_2026') THEN ALTER TABLE fund_level ADD COLUMN investment_cost_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='investment_cost_q4_2026') THEN ALTER TABLE fund_level ADD COLUMN investment_cost_q4_2026 numeric DEFAULT 0; END IF;

  -- investment_value
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='investment_value_q1_2026') THEN ALTER TABLE fund_level ADD COLUMN investment_value_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='investment_value_q2_2026') THEN ALTER TABLE fund_level ADD COLUMN investment_value_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='investment_value_q3_2026') THEN ALTER TABLE fund_level ADD COLUMN investment_value_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='investment_value_q4_2026') THEN ALTER TABLE fund_level ADD COLUMN investment_value_q4_2026 numeric DEFAULT 0; END IF;

  -- tvpi
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='tvpi_q1_2026') THEN ALTER TABLE fund_level ADD COLUMN tvpi_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='tvpi_q2_2026') THEN ALTER TABLE fund_level ADD COLUMN tvpi_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='tvpi_q3_2026') THEN ALTER TABLE fund_level ADD COLUMN tvpi_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='tvpi_q4_2026') THEN ALTER TABLE fund_level ADD COLUMN tvpi_q4_2026 numeric DEFAULT 0; END IF;

  -- moic
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='moic_q1_2026') THEN ALTER TABLE fund_level ADD COLUMN moic_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='moic_q2_2026') THEN ALTER TABLE fund_level ADD COLUMN moic_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='moic_q3_2026') THEN ALTER TABLE fund_level ADD COLUMN moic_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='moic_q4_2026') THEN ALTER TABLE fund_level ADD COLUMN moic_q4_2026 numeric DEFAULT 0; END IF;

  -- irr
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='irr_q1_2026') THEN ALTER TABLE fund_level ADD COLUMN irr_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='irr_q2_2026') THEN ALTER TABLE fund_level ADD COLUMN irr_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='irr_q3_2026') THEN ALTER TABLE fund_level ADD COLUMN irr_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='irr_q4_2026') THEN ALTER TABLE fund_level ADD COLUMN irr_q4_2026 numeric DEFAULT 0; END IF;

  -- management_fee
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='management_fee_q1_2026') THEN ALTER TABLE fund_level ADD COLUMN management_fee_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='management_fee_q2_2026') THEN ALTER TABLE fund_level ADD COLUMN management_fee_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='management_fee_q3_2026') THEN ALTER TABLE fund_level ADD COLUMN management_fee_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='management_fee_q4_2026') THEN ALTER TABLE fund_level ADD COLUMN management_fee_q4_2026 numeric DEFAULT 0; END IF;

  -- opex
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='opex_q1_2026') THEN ALTER TABLE fund_level ADD COLUMN opex_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='opex_q2_2026') THEN ALTER TABLE fund_level ADD COLUMN opex_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='opex_q3_2026') THEN ALTER TABLE fund_level ADD COLUMN opex_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='opex_q4_2026') THEN ALTER TABLE fund_level ADD COLUMN opex_q4_2026 numeric DEFAULT 0; END IF;
END $$;

-- company_data: 7 metrics x 4 quarters = 28 columns
DO $$
BEGIN
  -- paid_capital
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='paid_capital_q1_2026') THEN ALTER TABLE company_data ADD COLUMN paid_capital_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='paid_capital_q2_2026') THEN ALTER TABLE company_data ADD COLUMN paid_capital_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='paid_capital_q3_2026') THEN ALTER TABLE company_data ADD COLUMN paid_capital_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='paid_capital_q4_2026') THEN ALTER TABLE company_data ADD COLUMN paid_capital_q4_2026 numeric DEFAULT 0; END IF;

  -- nav
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='nav_q1_2026') THEN ALTER TABLE company_data ADD COLUMN nav_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='nav_q2_2026') THEN ALTER TABLE company_data ADD COLUMN nav_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='nav_q3_2026') THEN ALTER TABLE company_data ADD COLUMN nav_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='nav_q4_2026') THEN ALTER TABLE company_data ADD COLUMN nav_q4_2026 numeric DEFAULT 0; END IF;

  -- distributions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='distributions_q1_2026') THEN ALTER TABLE company_data ADD COLUMN distributions_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='distributions_q2_2026') THEN ALTER TABLE company_data ADD COLUMN distributions_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='distributions_q3_2026') THEN ALTER TABLE company_data ADD COLUMN distributions_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='distributions_q4_2026') THEN ALTER TABLE company_data ADD COLUMN distributions_q4_2026 numeric DEFAULT 0; END IF;

  -- management_fee
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='management_fee_q1_2026') THEN ALTER TABLE company_data ADD COLUMN management_fee_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='management_fee_q2_2026') THEN ALTER TABLE company_data ADD COLUMN management_fee_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='management_fee_q3_2026') THEN ALTER TABLE company_data ADD COLUMN management_fee_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='management_fee_q4_2026') THEN ALTER TABLE company_data ADD COLUMN management_fee_q4_2026 numeric DEFAULT 0; END IF;

  -- opex
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='opex_q1_2026') THEN ALTER TABLE company_data ADD COLUMN opex_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='opex_q2_2026') THEN ALTER TABLE company_data ADD COLUMN opex_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='opex_q3_2026') THEN ALTER TABLE company_data ADD COLUMN opex_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='opex_q4_2026') THEN ALTER TABLE company_data ADD COLUMN opex_q4_2026 numeric DEFAULT 0; END IF;

  -- unrealized_gains
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='unrealized_gains_q1_2026') THEN ALTER TABLE company_data ADD COLUMN unrealized_gains_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='unrealized_gains_q2_2026') THEN ALTER TABLE company_data ADD COLUMN unrealized_gains_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='unrealized_gains_q3_2026') THEN ALTER TABLE company_data ADD COLUMN unrealized_gains_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='unrealized_gains_q4_2026') THEN ALTER TABLE company_data ADD COLUMN unrealized_gains_q4_2026 numeric DEFAULT 0; END IF;

  -- realized_gains
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='realized_gains_q1_2026') THEN ALTER TABLE company_data ADD COLUMN realized_gains_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='realized_gains_q2_2026') THEN ALTER TABLE company_data ADD COLUMN realized_gains_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='realized_gains_q3_2026') THEN ALTER TABLE company_data ADD COLUMN realized_gains_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='realized_gains_q4_2026') THEN ALTER TABLE company_data ADD COLUMN realized_gains_q4_2026 numeric DEFAULT 0; END IF;
END $$;

-- portfolio_data: 2 metrics x 4 quarters = 8 columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_data' AND column_name='total_investment_q1_2026') THEN ALTER TABLE portfolio_data ADD COLUMN total_investment_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_data' AND column_name='total_investment_q2_2026') THEN ALTER TABLE portfolio_data ADD COLUMN total_investment_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_data' AND column_name='total_investment_q3_2026') THEN ALTER TABLE portfolio_data ADD COLUMN total_investment_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_data' AND column_name='total_investment_q4_2026') THEN ALTER TABLE portfolio_data ADD COLUMN total_investment_q4_2026 numeric DEFAULT 0; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_data' AND column_name='total_value_q1_2026') THEN ALTER TABLE portfolio_data ADD COLUMN total_value_q1_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_data' AND column_name='total_value_q2_2026') THEN ALTER TABLE portfolio_data ADD COLUMN total_value_q2_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_data' AND column_name='total_value_q3_2026') THEN ALTER TABLE portfolio_data ADD COLUMN total_value_q3_2026 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_data' AND column_name='total_value_q4_2026') THEN ALTER TABLE portfolio_data ADD COLUMN total_value_q4_2026 numeric DEFAULT 0; END IF;
END $$;