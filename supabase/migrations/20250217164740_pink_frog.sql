/*
  # Create fund level table

  1. New Tables
    - `fund_level`
      - Quarterly columns for 2021-2024:
        - Fund size (numeric)
        - Number of LPs (integer)
        - Total Called Capital (numeric)
        - Total Investment Cost (numeric)
        - Total Investment Value (numeric)
        - TVPI (numeric)
        - MoIC (numeric)
        - IRR (numeric)
        - Management Fee (numeric)
        - OPEX (numeric)
      - Standard timestamps
      - Primary key and indexes

  2. Security
    - Enable RLS
    - Add policies for admin access
*/

-- Create fund level table
CREATE TABLE IF NOT EXISTS fund_level (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Fund Size
  fund_size_q1_2021 numeric(20,2) DEFAULT 0,
  fund_size_q2_2021 numeric(20,2) DEFAULT 0,
  fund_size_q3_2021 numeric(20,2) DEFAULT 0,
  fund_size_q4_2021 numeric(20,2) DEFAULT 0,
  fund_size_q1_2022 numeric(20,2) DEFAULT 0,
  fund_size_q2_2022 numeric(20,2) DEFAULT 0,
  fund_size_q3_2022 numeric(20,2) DEFAULT 0,
  fund_size_q4_2022 numeric(20,2) DEFAULT 0,
  fund_size_q1_2023 numeric(20,2) DEFAULT 0,
  fund_size_q2_2023 numeric(20,2) DEFAULT 0,
  fund_size_q3_2023 numeric(20,2) DEFAULT 0,
  fund_size_q4_2023 numeric(20,2) DEFAULT 0,
  fund_size_q1_2024 numeric(20,2) DEFAULT 0,
  fund_size_q2_2024 numeric(20,2) DEFAULT 0,
  fund_size_q3_2024 numeric(20,2) DEFAULT 0,
  fund_size_q4_2024 numeric(20,2) DEFAULT 0,

  -- Number of LPs
  lp_count_q1_2021 integer DEFAULT 0,
  lp_count_q2_2021 integer DEFAULT 0,
  lp_count_q3_2021 integer DEFAULT 0,
  lp_count_q4_2021 integer DEFAULT 0,
  lp_count_q1_2022 integer DEFAULT 0,
  lp_count_q2_2022 integer DEFAULT 0,
  lp_count_q3_2022 integer DEFAULT 0,
  lp_count_q4_2022 integer DEFAULT 0,
  lp_count_q1_2023 integer DEFAULT 0,
  lp_count_q2_2023 integer DEFAULT 0,
  lp_count_q3_2023 integer DEFAULT 0,
  lp_count_q4_2023 integer DEFAULT 0,
  lp_count_q1_2024 integer DEFAULT 0,
  lp_count_q2_2024 integer DEFAULT 0,
  lp_count_q3_2024 integer DEFAULT 0,
  lp_count_q4_2024 integer DEFAULT 0,

  -- Total Called Capital
  called_capital_q1_2021 numeric(20,2) DEFAULT 0,
  called_capital_q2_2021 numeric(20,2) DEFAULT 0,
  called_capital_q3_2021 numeric(20,2) DEFAULT 0,
  called_capital_q4_2021 numeric(20,2) DEFAULT 0,
  called_capital_q1_2022 numeric(20,2) DEFAULT 0,
  called_capital_q2_2022 numeric(20,2) DEFAULT 0,
  called_capital_q3_2022 numeric(20,2) DEFAULT 0,
  called_capital_q4_2022 numeric(20,2) DEFAULT 0,
  called_capital_q1_2023 numeric(20,2) DEFAULT 0,
  called_capital_q2_2023 numeric(20,2) DEFAULT 0,
  called_capital_q3_2023 numeric(20,2) DEFAULT 0,
  called_capital_q4_2023 numeric(20,2) DEFAULT 0,
  called_capital_q1_2024 numeric(20,2) DEFAULT 0,
  called_capital_q2_2024 numeric(20,2) DEFAULT 0,
  called_capital_q3_2024 numeric(20,2) DEFAULT 0,
  called_capital_q4_2024 numeric(20,2) DEFAULT 0,

  -- Total Investment Cost
  investment_cost_q1_2021 numeric(20,2) DEFAULT 0,
  investment_cost_q2_2021 numeric(20,2) DEFAULT 0,
  investment_cost_q3_2021 numeric(20,2) DEFAULT 0,
  investment_cost_q4_2021 numeric(20,2) DEFAULT 0,
  investment_cost_q1_2022 numeric(20,2) DEFAULT 0,
  investment_cost_q2_2022 numeric(20,2) DEFAULT 0,
  investment_cost_q3_2022 numeric(20,2) DEFAULT 0,
  investment_cost_q4_2022 numeric(20,2) DEFAULT 0,
  investment_cost_q1_2023 numeric(20,2) DEFAULT 0,
  investment_cost_q2_2023 numeric(20,2) DEFAULT 0,
  investment_cost_q3_2023 numeric(20,2) DEFAULT 0,
  investment_cost_q4_2023 numeric(20,2) DEFAULT 0,
  investment_cost_q1_2024 numeric(20,2) DEFAULT 0,
  investment_cost_q2_2024 numeric(20,2) DEFAULT 0,
  investment_cost_q3_2024 numeric(20,2) DEFAULT 0,
  investment_cost_q4_2024 numeric(20,2) DEFAULT 0,

  -- Total Investment Value
  investment_value_q1_2021 numeric(20,2) DEFAULT 0,
  investment_value_q2_2021 numeric(20,2) DEFAULT 0,
  investment_value_q3_2021 numeric(20,2) DEFAULT 0,
  investment_value_q4_2021 numeric(20,2) DEFAULT 0,
  investment_value_q1_2022 numeric(20,2) DEFAULT 0,
  investment_value_q2_2022 numeric(20,2) DEFAULT 0,
  investment_value_q3_2022 numeric(20,2) DEFAULT 0,
  investment_value_q4_2022 numeric(20,2) DEFAULT 0,
  investment_value_q1_2023 numeric(20,2) DEFAULT 0,
  investment_value_q2_2023 numeric(20,2) DEFAULT 0,
  investment_value_q3_2023 numeric(20,2) DEFAULT 0,
  investment_value_q4_2023 numeric(20,2) DEFAULT 0,
  investment_value_q1_2024 numeric(20,2) DEFAULT 0,
  investment_value_q2_2024 numeric(20,2) DEFAULT 0,
  investment_value_q3_2024 numeric(20,2) DEFAULT 0,
  investment_value_q4_2024 numeric(20,2) DEFAULT 0,

  -- TVPI
  tvpi_q1_2021 numeric(10,4) DEFAULT 0,
  tvpi_q2_2021 numeric(10,4) DEFAULT 0,
  tvpi_q3_2021 numeric(10,4) DEFAULT 0,
  tvpi_q4_2021 numeric(10,4) DEFAULT 0,
  tvpi_q1_2022 numeric(10,4) DEFAULT 0,
  tvpi_q2_2022 numeric(10,4) DEFAULT 0,
  tvpi_q3_2022 numeric(10,4) DEFAULT 0,
  tvpi_q4_2022 numeric(10,4) DEFAULT 0,
  tvpi_q1_2023 numeric(10,4) DEFAULT 0,
  tvpi_q2_2023 numeric(10,4) DEFAULT 0,
  tvpi_q3_2023 numeric(10,4) DEFAULT 0,
  tvpi_q4_2023 numeric(10,4) DEFAULT 0,
  tvpi_q1_2024 numeric(10,4) DEFAULT 0,
  tvpi_q2_2024 numeric(10,4) DEFAULT 0,
  tvpi_q3_2024 numeric(10,4) DEFAULT 0,
  tvpi_q4_2024 numeric(10,4) DEFAULT 0,

  -- MoIC
  moic_q1_2021 numeric(10,4) DEFAULT 0,
  moic_q2_2021 numeric(10,4) DEFAULT 0,
  moic_q3_2021 numeric(10,4) DEFAULT 0,
  moic_q4_2021 numeric(10,4) DEFAULT 0,
  moic_q1_2022 numeric(10,4) DEFAULT 0,
  moic_q2_2022 numeric(10,4) DEFAULT 0,
  moic_q3_2022 numeric(10,4) DEFAULT 0,
  moic_q4_2022 numeric(10,4) DEFAULT 0,
  moic_q1_2023 numeric(10,4) DEFAULT 0,
  moic_q2_2023 numeric(10,4) DEFAULT 0,
  moic_q3_2023 numeric(10,4) DEFAULT 0,
  moic_q4_2023 numeric(10,4) DEFAULT 0,
  moic_q1_2024 numeric(10,4) DEFAULT 0,
  moic_q2_2024 numeric(10,4) DEFAULT 0,
  moic_q3_2024 numeric(10,4) DEFAULT 0,
  moic_q4_2024 numeric(10,4) DEFAULT 0,

  -- IRR
  irr_q1_2021 numeric(10,4) DEFAULT 0,
  irr_q2_2021 numeric(10,4) DEFAULT 0,
  irr_q3_2021 numeric(10,4) DEFAULT 0,
  irr_q4_2021 numeric(10,4) DEFAULT 0,
  irr_q1_2022 numeric(10,4) DEFAULT 0,
  irr_q2_2022 numeric(10,4) DEFAULT 0,
  irr_q3_2022 numeric(10,4) DEFAULT 0,
  irr_q4_2022 numeric(10,4) DEFAULT 0,
  irr_q1_2023 numeric(10,4) DEFAULT 0,
  irr_q2_2023 numeric(10,4) DEFAULT 0,
  irr_q3_2023 numeric(10,4) DEFAULT 0,
  irr_q4_2023 numeric(10,4) DEFAULT 0,
  irr_q1_2024 numeric(10,4) DEFAULT 0,
  irr_q2_2024 numeric(10,4) DEFAULT 0,
  irr_q3_2024 numeric(10,4) DEFAULT 0,
  irr_q4_2024 numeric(10,4) DEFAULT 0,

  -- Management Fee
  management_fee_q1_2021 numeric(20,2) DEFAULT 0,
  management_fee_q2_2021 numeric(20,2) DEFAULT 0,
  management_fee_q3_2021 numeric(20,2) DEFAULT 0,
  management_fee_q4_2021 numeric(20,2) DEFAULT 0,
  management_fee_q1_2022 numeric(20,2) DEFAULT 0,
  management_fee_q2_2022 numeric(20,2) DEFAULT 0,
  management_fee_q3_2022 numeric(20,2) DEFAULT 0,
  management_fee_q4_2022 numeric(20,2) DEFAULT 0,
  management_fee_q1_2023 numeric(20,2) DEFAULT 0,
  management_fee_q2_2023 numeric(20,2) DEFAULT 0,
  management_fee_q3_2023 numeric(20,2) DEFAULT 0,
  management_fee_q4_2023 numeric(20,2) DEFAULT 0,
  management_fee_q1_2024 numeric(20,2) DEFAULT 0,
  management_fee_q2_2024 numeric(20,2) DEFAULT 0,
  management_fee_q3_2024 numeric(20,2) DEFAULT 0,
  management_fee_q4_2024 numeric(20,2) DEFAULT 0,

  -- OPEX
  opex_q1_2021 numeric(20,2) DEFAULT 0,
  opex_q2_2021 numeric(20,2) DEFAULT 0,
  opex_q3_2021 numeric(20,2) DEFAULT 0,
  opex_q4_2021 numeric(20,2) DEFAULT 0,
  opex_q1_2022 numeric(20,2) DEFAULT 0,
  opex_q2_2022 numeric(20,2) DEFAULT 0,
  opex_q3_2022 numeric(20,2) DEFAULT 0,
  opex_q4_2022 numeric(20,2) DEFAULT 0,
  opex_q1_2023 numeric(20,2) DEFAULT 0,
  opex_q2_2023 numeric(20,2) DEFAULT 0,
  opex_q3_2023 numeric(20,2) DEFAULT 0,
  opex_q4_2023 numeric(20,2) DEFAULT 0,
  opex_q1_2024 numeric(20,2) DEFAULT 0,
  opex_q2_2024 numeric(20,2) DEFAULT 0,
  opex_q3_2024 numeric(20,2) DEFAULT 0,
  opex_q4_2024 numeric(20,2) DEFAULT 0,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fund_level ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage fund level data"
  ON fund_level
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.is_approved = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.is_approved = true
    )
  );

-- Create policy for LPs to view fund level data
CREATE POLICY "LPs can view fund level data"
  ON fund_level FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lp'
      AND profiles.is_approved = true
    )
  );

-- Add trigger for updating timestamps
CREATE TRIGGER update_fund_level_updated_at
  BEFORE UPDATE ON fund_level
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();