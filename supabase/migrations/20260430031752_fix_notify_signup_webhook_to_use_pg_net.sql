/*
  # Fix notify_signup_webhook to use pg_net correctly

  1. Changes
    - Replaces the broken `extensions.http_post()` call (from missing http extension)
      with the correct `net.http_post()` from the pg_net extension
    - pg_net sends HTTP requests asynchronously, so it won't block the INSERT

  2. Notes
    - The previous trigger was calling `extensions.http_post()` which requires the
      `http` extension that is not installed, causing all profile inserts to fail
    - pg_net's `net.http_post()` is non-blocking and won't cause insert failures
      even if the webhook endpoint is unreachable
*/

CREATE OR REPLACE FUNCTION public.notify_signup_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
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

  PERFORM net.http_post(
    url := edge_function_url,
    body := payload::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json')
  );

  RETURN NEW;
END;
$$;
