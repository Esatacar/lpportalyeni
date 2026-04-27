/*
  # Add missing Q4 2025 columns

  All three data tables (fund_level, company_data, portfolio_data) were missing
  Q4 2025 columns. Only Q1-Q3 2025 existed. This adds the missing Q4 columns.

  1. Modified Tables
    - `fund_level` - Add Q4 2025 for all 10 fund metrics
    - `company_data` - Add Q4 2025 for all 7 LP metrics
    - `portfolio_data` - Add Q4 2025 for both portfolio metrics

  2. Notes
    - All new columns default to 0
    - Uses IF NOT EXISTS checks for safety
*/

-- fund_level: 10 Q4 2025 columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='fund_size_q4_2025') THEN ALTER TABLE fund_level ADD COLUMN fund_size_q4_2025 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='lp_count_q4_2025') THEN ALTER TABLE fund_level ADD COLUMN lp_count_q4_2025 integer DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='called_capital_q4_2025') THEN ALTER TABLE fund_level ADD COLUMN called_capital_q4_2025 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='investment_cost_q4_2025') THEN ALTER TABLE fund_level ADD COLUMN investment_cost_q4_2025 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='investment_value_q4_2025') THEN ALTER TABLE fund_level ADD COLUMN investment_value_q4_2025 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='tvpi_q4_2025') THEN ALTER TABLE fund_level ADD COLUMN tvpi_q4_2025 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='moic_q4_2025') THEN ALTER TABLE fund_level ADD COLUMN moic_q4_2025 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='irr_q4_2025') THEN ALTER TABLE fund_level ADD COLUMN irr_q4_2025 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='management_fee_q4_2025') THEN ALTER TABLE fund_level ADD COLUMN management_fee_q4_2025 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fund_level' AND column_name='opex_q4_2025') THEN ALTER TABLE fund_level ADD COLUMN opex_q4_2025 numeric DEFAULT 0; END IF;
END $$;

-- company_data: 7 Q4 2025 columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='paid_capital_q4_2025') THEN ALTER TABLE company_data ADD COLUMN paid_capital_q4_2025 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='nav_q4_2025') THEN ALTER TABLE company_data ADD COLUMN nav_q4_2025 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='distributions_q4_2025') THEN ALTER TABLE company_data ADD COLUMN distributions_q4_2025 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='management_fee_q4_2025') THEN ALTER TABLE company_data ADD COLUMN management_fee_q4_2025 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='opex_q4_2025') THEN ALTER TABLE company_data ADD COLUMN opex_q4_2025 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='unrealized_gains_q4_2025') THEN ALTER TABLE company_data ADD COLUMN unrealized_gains_q4_2025 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_data' AND column_name='realized_gains_q4_2025') THEN ALTER TABLE company_data ADD COLUMN realized_gains_q4_2025 numeric DEFAULT 0; END IF;
END $$;

-- portfolio_data: 2 Q4 2025 columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_data' AND column_name='total_investment_q4_2025') THEN ALTER TABLE portfolio_data ADD COLUMN total_investment_q4_2025 numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_data' AND column_name='total_value_q4_2025') THEN ALTER TABLE portfolio_data ADD COLUMN total_value_q4_2025 numeric DEFAULT 0; END IF;
END $$;