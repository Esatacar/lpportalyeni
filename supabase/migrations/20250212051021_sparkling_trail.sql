/*
  # Fix company data policies and relationships

  1. Changes
    - Add policy for LPs to view their assigned company data
    - Add policy for admins to manage company assignments
    - Ensure proper foreign key relationship between profiles and company_data

  2. Security
    - Enable RLS for all affected tables
    - Add policies for proper data access control
*/

-- Ensure RLS is enabled
ALTER TABLE company_data ENABLE ROW LEVEL SECURITY;

-- Add policy for LPs to view their assigned company
CREATE POLICY "Users can view their assigned company"
  ON company_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.assigned_company_id = company_data.id
      AND profiles.is_approved = true
    )
  );

-- Add policy for admins to view and manage all companies
CREATE POLICY "Admins can manage all companies"
  ON company_data
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

-- Update profiles policies to allow company assignment
CREATE POLICY "Admins can assign companies to users"
  ON profiles
  FOR UPDATE
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