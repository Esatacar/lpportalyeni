/*
# Add secure admin company assignment action

1. Purpose
- Move company assignment out of a direct browser update on the protected `profiles` table.
- Give the admin dashboard one server-checked action for changing an LP's company assignment.

2. Security
- `admin_assign_company` runs with definer privileges and uses a fixed `search_path`.
- The caller is taken from `auth.uid()` and must be an approved admin.
- Anonymous callers cannot execute the function.
- The target profile must exist and the selected company must exist.
- Existing profile triggers remain active and continue protecting privilege columns.
*/

CREATE OR REPLACE FUNCTION public.admin_assign_company(
  p_user_id uuid,
  p_company_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_approved = true
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_user_id AND role = 'lp'
  ) THEN
    RAISE EXCEPTION 'LP profile not found';
  END IF;

  IF p_company_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM company_data WHERE id = p_company_id
  ) THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  UPDATE profiles
  SET assigned_company_id = p_company_id,
      updated_at = now()
  WHERE id = p_user_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_assign_company(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_assign_company(uuid, uuid) TO authenticated;
