/*
  # User Approval Notification Trigger

  1. Changes
    - Creates a trigger function to handle user approval notifications
    - Uses pg_notify to send notifications through Supabase's system
    - Adds trigger on profiles table that fires on update
    - Sends notification when user status changes to 'approved'

  2. Notification
    - Sends event through Supabase's notification system
    - Contains user email and approval status
*/

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_user_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if status changed to approved
  IF (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved')) THEN
    -- Send notification through Supabase's system
    PERFORM pg_notify(
      'user_approved',
      json_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'full_name', NEW.full_name,
        'status', NEW.status,
        'approved_at', NEW.updated_at
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS on_user_approval ON public.profiles;
CREATE TRIGGER on_user_approval
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_approval();