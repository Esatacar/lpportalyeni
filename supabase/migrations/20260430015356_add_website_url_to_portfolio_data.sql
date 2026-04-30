/*
  # Add website URL to portfolio data

  1. Modified Tables
    - `portfolio_data`
      - Added `website_url` (text, nullable) - stores the company website URL

  2. Notes
    - Column is nullable since not all companies may have a website
    - No default value needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portfolio_data' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE portfolio_data ADD COLUMN website_url text;
  END IF;
END $$;