/*
  # Fix Profile and LP Account Policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Recreate policies with proper permissions
    - Simplify admin access checks
  
  2. Security
    - Maintain RLS on all tables
    - Public read access for profiles
    - Admin management capabilities
    - LP-specific view permissions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage LP accounts" ON lp_accounts;
DROP POLICY IF EXISTS "LPs can view assigned accounts" ON lp_accounts;
DROP POLICY IF EXISTS "Admins can manage assignments" ON lp_account_assignments;
DROP POLICY IF EXISTS "LPs can view their assignments" ON lp_account_assignments;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate policies with proper permissions
-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- LP accounts policies
CREATE POLICY "Admin LP account management"
  ON lp_accounts
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    AND (SELECT is_approved FROM profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "LP account viewing"
  ON lp_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lp_account_assignments
      WHERE lp_account_id = lp_accounts.id
      AND profile_id = auth.uid()
    )
  );

-- LP account assignments policies
CREATE POLICY "Admin assignment management"
  ON lp_account_assignments
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    AND (SELECT is_approved FROM profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "LP assignment viewing"
  ON lp_account_assignments FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());