/*
  # Remove unused LP account tables

  1. Changes
    - Drop lp_account_assignments table
    - Drop lp_accounts table
    - Remove unused tables that were replaced by direct company assignment in profiles table

  2. Notes
    - Tables are dropped with CASCADE to handle any potential dependencies
    - These tables are no longer used as the application uses direct company assignment through profiles.assigned_company_id
*/

-- Drop tables with CASCADE to handle any dependencies
DROP TABLE IF EXISTS lp_account_assignments CASCADE;
DROP TABLE IF EXISTS lp_accounts CASCADE;