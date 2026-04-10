-- Create useful links table
CREATE TABLE IF NOT EXISTS useful_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE useful_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage useful links"
  ON useful_links
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

CREATE POLICY "Authenticated users can view useful links"
  ON useful_links FOR SELECT
  TO authenticated
  USING (true);

-- Add trigger for updating timestamps
CREATE TRIGGER update_useful_links_updated_at
  BEFORE UPDATE ON useful_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();