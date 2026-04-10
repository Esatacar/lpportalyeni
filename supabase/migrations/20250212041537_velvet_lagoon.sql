/*
  # Initial Setup for LP Dashboard

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - matches auth.users id
      - `email` (text)
      - `full_name` (text)
      - `company_name` (text, nullable)
      - `role` (text) - 'admin' or 'lp'
      - `is_approved` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `lp_accounts`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `lp_account_assignments`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, references profiles)
      - `lp_account_id` (uuid, references lp_accounts)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text,
  company_name text,
  role text NOT NULL CHECK (role IN ('admin', 'lp')),
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create LP accounts table
CREATE TABLE IF NOT EXISTS lp_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create LP account assignments table
CREATE TABLE IF NOT EXISTS lp_account_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  lp_account_id uuid REFERENCES lp_accounts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, lp_account_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_account_assignments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_approved = true
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_approved = true
    )
  );

-- LP accounts policies
CREATE POLICY "Admins can manage LP accounts"
  ON lp_accounts
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_approved = true
    )
  );

CREATE POLICY "LPs can view assigned accounts"
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
CREATE POLICY "Admins can manage assignments"
  ON lp_account_assignments
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_approved = true
    )
  );

CREATE POLICY "LPs can view their assignments"
  ON lp_account_assignments FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());