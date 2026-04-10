/*
  # Create company data table

  1. New Tables
    - `company_data`
      - `id` (uuid, primary key)
      - `company_no` (text, unique)
      - `company_name` (text)
      - Various financial columns for paid capital and NAV by quarter
      - Timestamps for record keeping

  2. Security
    - Enable RLS
    - Add policies for admin management
    - Add policies for LP viewing
*/

-- Create company data table
CREATE TABLE IF NOT EXISTS company_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_no text UNIQUE NOT NULL,
  company_name text NOT NULL,
  total_commitment numeric(20,2) NOT NULL DEFAULT 0,
  -- Paid Capital columns
  paid_capital_q1_2021 numeric(20,2) DEFAULT 0,
  paid_capital_q2_2021 numeric(20,2) DEFAULT 0,
  paid_capital_q3_2021 numeric(20,2) DEFAULT 0,
  paid_capital_q4_2021 numeric(20,2) DEFAULT 0,
  paid_capital_q1_2022 numeric(20,2) DEFAULT 0,
  paid_capital_q2_2022 numeric(20,2) DEFAULT 0,
  paid_capital_q3_2022 numeric(20,2) DEFAULT 0,
  paid_capital_q4_2022 numeric(20,2) DEFAULT 0,
  paid_capital_q1_2023 numeric(20,2) DEFAULT 0,
  paid_capital_q2_2023 numeric(20,2) DEFAULT 0,
  paid_capital_q3_2023 numeric(20,2) DEFAULT 0,
  paid_capital_q4_2023 numeric(20,2) DEFAULT 0,
  paid_capital_q1_2024 numeric(20,2) DEFAULT 0,
  paid_capital_q2_2024 numeric(20,2) DEFAULT 0,
  paid_capital_q3_2024 numeric(20,2) DEFAULT 0,
  paid_capital_q4_2024 numeric(20,2) DEFAULT 0,
  -- NAV columns
  nav_q1_2021 numeric(20,2) DEFAULT 0,
  nav_q2_2021 numeric(20,2) DEFAULT 0,
  nav_q3_2021 numeric(20,2) DEFAULT 0,
  nav_q4_2021 numeric(20,2) DEFAULT 0,
  nav_q1_2022 numeric(20,2) DEFAULT 0,
  nav_q2_2022 numeric(20,2) DEFAULT 0,
  nav_q3_2022 numeric(20,2) DEFAULT 0,
  nav_q4_2022 numeric(20,2) DEFAULT 0,
  nav_q1_2023 numeric(20,2) DEFAULT 0,
  nav_q2_2023 numeric(20,2) DEFAULT 0,
  nav_q3_2023 numeric(20,2) DEFAULT 0,
  nav_q4_2023 numeric(20,2) DEFAULT 0,
  nav_q1_2024 numeric(20,2) DEFAULT 0,
  nav_q2_2024 numeric(20,2) DEFAULT 0,
  nav_q3_2024 numeric(20,2) DEFAULT 0,
  nav_q4_2024 numeric(20,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage company data"
  ON company_data
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_approved = true
    )
  );

CREATE POLICY "LPs can view assigned company data"
  ON company_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lp_account_assignments laa
      JOIN profiles p ON p.id = laa.profile_id
      WHERE p.id = auth.uid()
      AND p.role = 'lp'
      AND p.is_approved = true
    )
  );