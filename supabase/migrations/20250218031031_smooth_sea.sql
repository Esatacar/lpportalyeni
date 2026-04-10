-- Drop email-related triggers and functions
DROP TRIGGER IF EXISTS trigger_notify_user_approval ON profiles;
DROP FUNCTION IF EXISTS notify_user_approval();

-- Drop email templates table
DROP TABLE IF EXISTS email_templates CASCADE;