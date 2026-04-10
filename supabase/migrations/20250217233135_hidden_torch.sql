/*
  # Create Portfolio Data Table

  1. New Tables
    - `portfolio_data`
      - `id` (uuid, primary key)
      - `portfolio_company_name` (text)
      - `latest_ownership` (numeric)
      - `latest_valuation` (numeric)
      - Quarterly investment and value columns for 2021-2024
      - Timestamps for record keeping

  2. Security
    - Enable RLS on `portfolio_data` table
    - Add policies for:
      - Admins to manage all data
      - LPs to view data
*/

-- Create portfolio data table
CREATE TABLE IF NOT EXISTS portfolio_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_company_name text NOT NULL,
  latest_ownership numeric(10,4) DEFAULT 0,
  latest_valuation numeric(20,2) DEFAULT 0,
  
  -- Total Investment columns
  total_investment_q1_2021 numeric(20,2) DEFAULT 0,
  total_investment_q2_2021 numeric(20,2) DEFAULT 0,
  total_investment_q3_2021 numeric(20,2) DEFAULT 0,
  total_investment_q4_2021 numeric(20,2) DEFAULT 0,
  total_investment_q1_2022 numeric(20,2) DEFAULT 0,
  total_investment_q2_2022 numeric(20,2) DEFAULT 0,
  total_investment_q3_2022 numeric(20,2) DEFAULT 0,
  total_investment_q4_2022 numeric(20,2) DEFAULT 0,
  total_investment_q1_2023 numeric(20,2) DEFAULT 0,
  total_investment_q2_2023 numeric(20,2) DEFAULT 0,
  total_investment_q3_2023 numeric(20,2) DEFAULT 0,
  total_investment_q4_2023 numeric(20,2) DEFAULT 0,
  total_investment_q1_2024 numeric(20,2) DEFAULT 0,
  total_investment_q2_2024 numeric(20,2) DEFAULT 0,
  total_investment_q3_2024 numeric(20,2) DEFAULT 0,
  total_investment_q4_2024 numeric(20,2) DEFAULT 0,
  
  -- Total Value columns
  total_value_q1_2021 numeric(20,2) DEFAULT 0,
  total_value_q2_2021 numeric(20,2) DEFAULT 0,
  total_value_q3_2021 numeric(20,2) DEFAULT 0,
  total_value_q4_2021 numeric(20,2) DEFAULT 0,
  total_value_q1_2022 numeric(20,2) DEFAULT 0,
  total_value_q2_2022 numeric(20,2) DEFAULT 0,
  total_value_q3_2022 numeric(20,2) DEFAULT 0,
  total_value_q4_2022 numeric(20,2) DEFAULT 0,
  total_value_q1_2023 numeric(20,2) DEFAULT 0,
  total_value_q2_2023 numeric(20,2) DEFAULT 0,
  total_value_q3_2023 numeric(20,2) DEFAULT 0,
  total_value_q4_2023 numeric(20,2) DEFAULT 0,
  total_value_q1_2024 numeric(20,2) DEFAULT 0,
  total_value_q2_2024 numeric(20,2) DEFAULT 0,
  total_value_q3_2024 numeric(20,2) DEFAULT 0,
  total_value_q4_2024 numeric(20,2) DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE portfolio_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage portfolio data"
  ON portfolio_data
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

-- Create policy for LPs to view portfolio data
CREATE POLICY "LPs can view portfolio data"
  ON portfolio_data FOR SELECT
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
CREATE TRIGGER update_portfolio_data_updated_at
  BEFORE UPDATE ON portfolio_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();