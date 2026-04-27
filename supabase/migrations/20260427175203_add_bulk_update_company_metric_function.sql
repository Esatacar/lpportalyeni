/*
  # Add bulk update function for company metric data

  1. New Functions
    - `bulk_update_company_metric(p_column_key text, p_updates jsonb)` - Updates a single
      metric column across multiple company rows in one transaction. Accepts a JSONB array
      of objects with `id` (company UUID) and `value` (numeric value).

  2. Security
    - Uses SECURITY DEFINER to run with elevated privileges
    - Validates the caller is an authenticated admin before proceeding
    - Validates column name matches expected pattern to prevent SQL injection

  3. Notes
    - Replaces 97 individual HTTP requests with a single RPC call
    - Validates column name format: must match `word_q[1-4]_[year]` pattern
    - Updates `updated_at` timestamp for all affected rows
*/

CREATE OR REPLACE FUNCTION bulk_update_company_metric(
  p_column_key text,
  p_updates jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  update_record jsonb;
  row_id uuid;
  row_value numeric;
  updated_count integer := 0;
BEGIN
  -- Validate caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND is_approved = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Validate column name to prevent injection (must match metric_q[1-4]_[year] pattern)
  IF p_column_key !~ '^[a-z_]+_q[1-4]_\d{4}$' THEN
    RAISE EXCEPTION 'Invalid column name: %', p_column_key;
  END IF;

  -- Verify column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'company_data'
    AND column_name = p_column_key
  ) THEN
    RAISE EXCEPTION 'Column does not exist: %', p_column_key;
  END IF;

  -- Process each update
  FOR update_record IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    row_id := (update_record->>'id')::uuid;
    row_value := COALESCE((update_record->>'value')::numeric, 0);

    EXECUTE format(
      'UPDATE company_data SET %I = $1, updated_at = now() WHERE id = $2',
      p_column_key
    ) USING row_value, row_id;

    updated_count := updated_count + 1;
  END LOOP;

  RETURN updated_count || ' rows updated';
END;
$$;
