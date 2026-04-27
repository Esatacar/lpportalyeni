/*
  # Add bulk update functions for portfolio_data and fund_level

  1. New Functions
    - `bulk_update_portfolio_metric` - Batch updates portfolio_data rows for a given column
    - `bulk_update_fund_metric` - Batch updates fund_level columns in a single call
  
  2. Security
    - Both functions validate caller is an approved admin
    - Column names are validated against regex patterns to prevent SQL injection
    - Column existence is verified before updating

  3. Important Notes
    - These functions run as SECURITY DEFINER to bypass RLS
    - Admin check is done inside the function body
    - Reduces dozens of individual RLS-checked requests to a single function call
*/

-- Bulk update for portfolio_data (similar to bulk_update_company_metric)
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
  updated_count integer := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND is_approved = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_column_key NOT IN ('latest_ownership', 'latest_valuation') 
     AND p_column_key !~ '^[a-z_]+_q[1-4]_\d{4}$' THEN
    RAISE EXCEPTION 'Invalid column name: %', p_column_key;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'portfolio_data'
    AND column_name = p_column_key
  ) THEN
    RAISE EXCEPTION 'Column does not exist: %', p_column_key;
  END IF;

  FOR update_record IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    row_id := (update_record->>'id')::uuid;
    row_value := COALESCE((update_record->>'value')::numeric, 0);

    EXECUTE format(
      'UPDATE portfolio_data SET %I = $1, updated_at = now() WHERE id = $2',
      p_column_key
    ) USING row_value, row_id;

    updated_count := updated_count + 1;
  END LOOP;

  RETURN updated_count || ' rows updated';
END;
$$;

-- Bulk update for fund_level (accepts a column->value map for a single row)
CREATE OR REPLACE FUNCTION bulk_update_fund_metrics(
  p_fund_id uuid,
  p_updates jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  col_key text;
  col_value numeric;
  set_clauses text[] := '{}';
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND is_approved = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  FOR col_key, col_value IN SELECT * FROM jsonb_each_text(p_updates)
  LOOP
    IF col_key !~ '^[a-z_]+_q[1-4]_\d{4}$' THEN
      RAISE EXCEPTION 'Invalid column name: %', col_key;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'fund_level'
      AND column_name = col_key
    ) THEN
      RAISE EXCEPTION 'Column does not exist: %', col_key;
    END IF;

    set_clauses := set_clauses || format('%I = %L::numeric', col_key, col_value);
  END LOOP;

  IF array_length(set_clauses, 1) IS NULL THEN
    RETURN '0 columns updated';
  END IF;

  EXECUTE format(
    'UPDATE fund_level SET %s, updated_at = now() WHERE id = $1',
    array_to_string(set_clauses, ', ')
  ) USING p_fund_id;

  RETURN array_length(set_clauses, 1) || ' columns updated';
END;
$$;
