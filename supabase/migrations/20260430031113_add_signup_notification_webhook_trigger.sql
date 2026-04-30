/*
  # Add signup notification webhook trigger

  1. New Functions
    - `notify_signup_webhook()` - Trigger function that calls the notify-signup Edge Function
      whenever a new profile is inserted

  2. New Triggers
    - `on_new_profile_notify_signup` - AFTER INSERT trigger on profiles table

  3. Notes
    - Uses pg_net extension to make HTTP POST to the Edge Function
    - Sends the new profile record as JSON payload
    - JWT verification is disabled on the Edge Function so the trigger can call it directly
*/

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_signup_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload jsonb;
  edge_function_url text;
BEGIN
  payload := jsonb_build_object(
    'record', jsonb_build_object(
      'id', NEW.id,
      'email', NEW.email,
      'full_name', NEW.full_name,
      'created_at', NEW.created_at
    )
  );

  edge_function_url := 'https://xoxyfcznfrqcaanymhpg.supabase.co/functions/v1/notify-signup';

  PERFORM extensions.http_post(
    edge_function_url,
    payload::text,
    'application/json'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_profile_notify_signup ON public.profiles;

CREATE TRIGGER on_new_profile_notify_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_signup_webhook();
