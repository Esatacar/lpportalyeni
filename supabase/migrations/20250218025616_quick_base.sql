-- Drop the old function and trigger
DROP TRIGGER IF EXISTS trigger_notify_user_approval ON profiles;
DROP FUNCTION IF EXISTS notify_user_approval();

-- Create a more reliable notification function
CREATE OR REPLACE FUNCTION notify_user_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the user is being approved
  IF (NEW.is_approved = true AND (OLD.is_approved = false OR OLD.is_approved IS NULL)) THEN
    -- Insert a notification record
    INSERT INTO email_templates (
      name,
      subject,
      content
    ) VALUES (
      'user_approval_' || NEW.id,
      'Your Account Has Been Approved',
      format(
        'Dear %s,

We are pleased to inform you that your account has been approved. You can now access the LP Dashboard with your registered email address (%s).

Best regards,
The Admin Team',
        NEW.full_name,
        NEW.email
      )
    )
    ON CONFLICT (name) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER trigger_notify_user_approval
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_approval();