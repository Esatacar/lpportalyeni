/*
  # Create user preferences table
  
  1. New Tables
    - `user_preferences`
      - `id` (uuid, primary key)
      - `key` (text)
      - `value` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS
    - Add policy for authenticated users to manage global preferences
*/

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage global preferences"
  ON user_preferences
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add trigger for updating timestamps
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();