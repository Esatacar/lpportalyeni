/*
  # Revoke anon access from private schema

  1. Security Changes
    - Revoke USAGE on private schema from anon
    - Revoke EXECUTE on all private functions from anon
    - Only authenticated and service_role can use private schema functions

  2. Notes
    - PostgREST doesn't expose the private schema anyway, but this adds defense in depth
*/

REVOKE USAGE ON SCHEMA private FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM anon;
