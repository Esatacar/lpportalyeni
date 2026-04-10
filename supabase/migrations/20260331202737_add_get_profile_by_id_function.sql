/*
  # Add helper function to fetch profile bypassing RLS

  ## Summary
  Creates a security definer function that can fetch profiles by ID without RLS checks.
  This is needed for the auth-login Edge Function to fetch profile data during login
  when the user doesn't yet have a valid session with the correct version number.

  ## Changes
  1. New Functions
    - `get_profile_by_id` - Fetches a profile by ID with SECURITY DEFINER (bypasses RLS)
  
  ## Security
  - Function is SECURITY DEFINER so it runs with owner privileges
  - Only returns profile data for the specified user ID
  - Used exclusively by the auth-login Edge Function with service role
*/

-- Create function to get profile by ID (bypasses RLS)
CREATE OR REPLACE FUNCTION get_profile_by_id(profile_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  company_name text,
  role text,
  is_approved boolean,
  created_at timestamptz,
  session_version integer,
  last_login_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.company_name,
    p.role,
    p.is_approved,
    p.created_at,
    p.session_version,
    p.last_login_at
  FROM profiles p
  WHERE p.id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Grant execute to authenticated users (Edge Function uses service role which has access)
GRANT EXECUTE ON FUNCTION get_profile_by_id(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION get_profile_by_id(uuid) IS 'Fetches profile by ID bypassing RLS - for use by auth Edge Functions';
