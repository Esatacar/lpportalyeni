/*
  # Remove companies table and related policies

  1. Changes
    - Drop companies table and all its policies
*/

-- Drop policies first
DROP POLICY IF EXISTS "Authenticated users can view companies" ON companies;
DROP POLICY IF EXISTS "Admins can manage companies" ON companies;

-- Drop the table
DROP TABLE IF EXISTS companies;