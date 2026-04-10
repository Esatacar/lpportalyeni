/*
  # Add read policy for metrics

  1. Security
    - Add policy to allow all authenticated users to read metrics
*/

CREATE POLICY "Authenticated users can view metrics"
  ON metrics FOR SELECT
  TO authenticated
  USING (true);