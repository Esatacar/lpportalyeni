/*
# Lock down admin assignment function execution

1. Purpose
- Remove the default PUBLIC execution grant from `admin_assign_company`.

2. Security
- Anonymous users and the PUBLIC role cannot invoke the function.
- Only authenticated callers can reach it.
- The function's internal approved-admin check remains the final authorization control.
*/

REVOKE EXECUTE ON FUNCTION public.admin_assign_company(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_assign_company(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_assign_company(uuid, uuid) TO authenticated;
