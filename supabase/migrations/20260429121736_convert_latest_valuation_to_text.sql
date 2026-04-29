/*
  # Convert latest_valuation from numeric to text

  1. Modified Tables
    - `portfolio_data`
      - `latest_valuation` changed from `numeric` to `text` to allow free-text entry (e.g. "Pre-revenue", "$50M - $75M", "N/A")
      - Existing numeric values are preserved as text strings

  2. Function Updates
    - `bulk_update_portfolio_metric` updated to handle `latest_valuation` as text instead of numeric

  3. Important Notes
    - No data is lost; existing numeric values are cast to text
    - The bulk update function now branches: for `latest_valuation` it stores the raw text value; for all other columns it continues to cast as numeric
*/

-- Add a new text column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portfolio_data' AND column_name = 'latest_valuation_text'
  ) THEN
    ALTER TABLE portfolio_data ADD COLUMN latest_valuation_text text DEFAULT '';
  END IF;
END $$;

-- Copy existing numeric values into the text column
UPDATE portfolio_data
SET latest_valuation_text = CASE
  WHEN latest_valuation IS NOT NULL AND latest_valuation != 0
    THEN latest_valuation::text
  ELSE ''
END
WHERE latest_valuation_text IS NULL OR latest_valuation_text = '';

-- Replace the bulk_update_portfolio_metric function to handle text for latest_valuation
CREATE OR REPLACE FUNCTION bulk_update_portfolio_metric(
  p_column_key text,
  p_updates jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  update_record jsonb;
  row_id uuid;
  row_value numeric;
  row_text_value text;
  updated_count integer := 0;
  actual_column text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND is_approved = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Map latest_valuation to the new text column
  IF p_column_key = 'latest_valuation' THEN
    actual_column := 'latest_valuation_text';
  ELSE
    actual_column := p_column_key;
  END IF;

  IF actual_column NOT IN ('latest_ownership', 'latest_valuation_text')
    AND actual_column !~ '^[a-z_]+_q[1-4]_\d{4}$' THEN
    RAISE EXCEPTION 'Invalid column name: %', p_column_key;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'portfolio_data'
    AND column_name = actual_column
  ) THEN
    RAISE EXCEPTION 'Column does not exist: %', actual_column;
  END IF;

  FOR update_record IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    row_id := (update_record->>'id')::uuid;

    IF actual_column = 'latest_valuation_text' THEN
      row_text_value := COALESCE(update_record->>'value', '');
      EXECUTE format(
        'UPDATE portfolio_data SET %I = $1, updated_at = now() WHERE id = $2',
        actual_column
      ) USING row_text_value, row_id;
    ELSE
      row_value := COALESCE((update_record->>'value')::numeric, 0);
      EXECUTE format(
        'UPDATE portfolio_data SET %I = $1, updated_at = now() WHERE id = $2',
        actual_column
      ) USING row_value, row_id;
    END IF;

    updated_count := updated_count + 1;
  END LOOP;

  RETURN updated_count || ' rows updated';
END;
$$;
