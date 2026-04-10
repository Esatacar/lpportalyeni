/*
  # Initialize user preferences table
  
  1. Changes
    - Create user_preferences table with proper constraints
    - Add RLS policies for authenticated users
    - Initialize default global view settings
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users to view and manage preferences
*/

-- Drop existing table and policies if they exist
DROP TABLE IF EXISTS user_preferences CASCADE;

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_preferences_key_unique UNIQUE (key)
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

-- Insert default global view settings
DO $$ 
DECLARE
  current_year integer;
  current_quarter integer;
  latest_quarters text[];
BEGIN
  -- Calculate current year and quarter
  current_year := LEAST(GREATEST(EXTRACT(YEAR FROM CURRENT_DATE)::integer, 2021), 2024);
  current_quarter := LEAST(CEIL(EXTRACT(MONTH FROM CURRENT_DATE)/3)::integer, 4);
  
  -- Calculate latest 4 quarters
  latest_quarters := ARRAY[]::text[];
  FOR i IN 0..3 LOOP
    latest_quarters := latest_quarters || format('%s-%s', 
      CASE 
        WHEN current_quarter - i < 1 THEN current_year - 1 
        ELSE current_year 
      END,
      CASE 
        WHEN current_quarter - i < 1 THEN current_quarter - i + 4 
        ELSE current_quarter - i 
      END
    );
  END LOOP;

  -- Insert new settings
  INSERT INTO user_preferences (key, value)
  VALUES (
    'global_view_settings',
    json_build_object(
      'portfolioQuarter', json_build_object(
        'year', current_year,
        'quarter', current_quarter
      ),
      'accountQuarters', latest_quarters
    )
  );
END $$;