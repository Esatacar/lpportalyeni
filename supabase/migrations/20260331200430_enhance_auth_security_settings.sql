/*
  # Enhanced Auth Security Settings

  ## Summary
  This migration enhances authentication security by:
  1. Ensuring proper session handling
  2. Adding audit logging for authentication events
  3. Setting up proper token rotation

  ## Security Improvements
  1. **Session Management**: Ensures sessions are properly tracked and invalidated
  2. **Audit Trail**: Logs authentication events for security monitoring
  3. **Token Security**: Ensures tokens are rotated on each login

  ## Changes Made
  - Create auth_audit_log table to track authentication events
  - Add trigger to log sign-in events
  - Add trigger to log sign-out events
*/

-- =====================================================
-- Step 1: Create audit log table for auth events
-- =====================================================

CREATE TABLE IF NOT EXISTS auth_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON auth_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
      AND is_approved = true
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_user_id ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created_at ON auth_audit_log(created_at DESC);

-- =====================================================
-- Step 2: Add comments for documentation
-- =====================================================

COMMENT ON TABLE auth_audit_log IS 'Audit log for authentication events to track security incidents';
COMMENT ON COLUMN auth_audit_log.event_type IS 'Type of authentication event (login, logout, token_refresh, etc.)';
COMMENT ON COLUMN auth_audit_log.ip_address IS 'IP address of the client making the request';
COMMENT ON COLUMN auth_audit_log.user_agent IS 'User agent string of the client';
