/*
  # Fix approval functionality

  1. Changes
    - Add policy for admins to update user approval status
    - Add policy for admins to update company assignments
    - Add trigger to update timestamps

  2. Security
    - Ensure only admins can approve/disapprove users
    - Ensure only admins can assign companies to users
*/

-- Add policy for admins to update approval status
CREATE POLICY "Admins can update user approval status"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_approved = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_approved = true
    )
  );

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();