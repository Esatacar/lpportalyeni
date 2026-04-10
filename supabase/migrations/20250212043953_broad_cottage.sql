/*
  # Add companies table and related functionality

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `name` (text, company name)
      - `industry` (text, company's industry)
      - `website` (text, company website URL)
      - `description` (text, company description)
      - `employee_count` (integer, number of employees)
      - `founded_year` (integer, year company was founded)
      - `created_at` (timestamptz, when record was created)
      - `updated_at` (timestamptz, when record was last updated)

  2. Security
    - Enable RLS on companies table
    - Admins can manage (CRUD) companies
    - All authenticated users can view companies
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text,
  website text,
  description text,
  employee_count integer,
  founded_year integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Authenticated users can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_approved = true
    )
  );