/*
  # Add approval notification webhook trigger

  1. New Function
    - `notify_approval_webhook()` - Fires when a profile's is_approved changes to true
    - Sends the new and old record to the notify-approval edge function via pg_net
  
  2. New Trigger
    - `on_profile_approved_notify` - Fires AFTER UPDATE on profiles
    - Only triggers when is_approved changes from false to true

  3. Important Notes
    - Uses pg_net for async HTTP calls so it won't block the admin's update
    - Passes both old and new record so the edge function can verify the change
*/

CREATE OR REPLACE FUNCTION notify_approval_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
  request_id bigint;
BEGIN
  -- Only proceed if is_approved changed from false to true
  IF NEW.is_approved = true AND (OLD.is_approved = false OR OLD.is_approved IS NULL) THEN
    payload := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'full_name', NEW.full_name,
        'company_name', NEW.company_name,
        'is_approved', NEW.is_approved,
        'status', NEW.status
      ),
      'old_record', jsonb_build_object(
        'id', OLD.id,
        'email', OLD.email,
        'full_name', OLD.full_name,
        'is_approved', OLD.is_approved,
        'status', OLD.status
      )
    );

    SELECT net.http_post(
      url := 'https://xoxyfcznfrqcaanymhpg.supabase.co/functions/v1/notify-approval',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhveHlmY3puZnJxY2FhbnltaHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzMzQ1MjcsImV4cCI6MjA1NDkxMDUyN30.4LDLXQIAMiZD9hstY6EZdXBuOKO0vju0ER5QWpx816g'
      ),
      body := payload
    ) INTO request_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_approved_notify ON profiles;

CREATE TRIGGER on_profile_approved_notify
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_approval_webhook();
