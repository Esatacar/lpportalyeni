/*
  # Add company assignment to profiles

  1. Changes
    - Add `assigned_company_id` column to profiles table
    - Add foreign key constraint to company_data table
    - Add index for better query performance

  2. Security
    - No changes to RLS policies needed as existing profile policies cover the new column
*/

-- Add assigned_company_id column with foreign key constraint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'assigned_company_id'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN assigned_company_id uuid REFERENCES company_data(id);

    -- Add index for better query performance
    CREATE INDEX IF NOT EXISTS idx_profiles_assigned_company_id 
    ON profiles(assigned_company_id);
  END IF;
END $$;