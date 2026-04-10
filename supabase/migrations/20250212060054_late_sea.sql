/*
  # Add status column to profiles table

  1. Changes
    - Add `status` column to profiles table with type `text`
    - Set default value to 'pending'
    - Add check constraint to ensure valid status values
    - Backfill existing records with appropriate status values
*/

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));

    -- Update existing records based on is_approved flag
    UPDATE profiles 
    SET status = CASE 
      WHEN is_approved = true THEN 'approved'
      ELSE 'pending'
    END;
  END IF;
END $$;