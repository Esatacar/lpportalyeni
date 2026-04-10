/*
  # User Approval Notification Trigger

  1. Changes
    - Creates a trigger function to send email notifications when users are approved
    - Adds trigger on profiles table that fires on update
    - Sends email notification when user status changes to 'approved'
    - Uses supabase_functions schema for email sending

  2. Email Template
    - Uses Supabase's built-in email functionality
    - Sends a welcome email to newly approved users
*/

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_user_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if status changed to approved
  IF (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved')) THEN
    -- Send welcome email to the user using supabase_functions
    PERFORM supabase_functions.http_request(
      'https://xoxyfcznfrqcaanymhpg.supabase.co/functions/v1/send-email',
      'POST',
      jsonb_build_object(
        'to', NEW.email,
        'subject', 'Welcome to e2vc LP Portal - Your Account is Approved',
        'html', format(
          '<p>Dear %s,</p>
           <p>Your account has been approved. You can now log in to the e2vc LP Portal.</p>
           <p>Please click the button below to access your dashboard:</p>
           <p><a href="%s" style="padding: 10px 20px; background-color: #0a2547; color: white; text-decoration: none; border-radius: 5px;">Access Dashboard</a></p>
           <p>Best regards,<br>e2vc Team</p>',
          NEW.full_name,
          current_setting('app.frontend_url', true)
        )
      ),
      jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.auth.anon_key', true)
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_user_approval ON public.profiles;
CREATE TRIGGER on_user_approval
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_approval();

-- Set necessary configuration
DO $$
BEGIN
  -- Set the frontend URL (update this to match your actual frontend URL)
  IF NOT EXISTS (
    SELECT 1 FROM pg_settings WHERE name = 'e2vc LP Portal'
  ) THEN
    PERFORM set_config('e2vc LP Portal', 'https://lpportal.e2.vc', false);
  END IF;
END $$;