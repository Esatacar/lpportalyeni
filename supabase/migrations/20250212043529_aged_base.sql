/*
  # Fix profile creation policy

  1. Changes
    - Add policy to allow users to insert their own profile during signup
    
  2. Security
    - Users can only create their own profile
    - Profile ID must match their auth.uid()
*/

-- Add policy for profile creation
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);