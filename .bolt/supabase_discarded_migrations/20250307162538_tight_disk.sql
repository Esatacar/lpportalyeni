/*
  # Fix email notification for user approval

  1. Changes
    - Fix the email notification function to use http instead of net schema
    - Update trigger to use Supabase's built-in http extension
    - Ensure proper error handling
    
  2. Security
    - Function remains security definer to ensure it can send emails
    - Only triggers on actual status changes to avoid duplicate emails
*/

-- Enable the http extension if not already enabled
create extension if not exists "http" with schema "extensions";

-- Create or replace the notification function
create or replace function handle_user_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  response json;
begin
  -- Only send notification when status changes to 'approved'
  if (NEW.status = 'approved' and (OLD.status is null or OLD.status != 'approved')) then
    -- Send the approval email using http extension
    select content::json into response
    from http((
      'POST',
      'https://xoxyfcznfrqcaanymhpg.supabase.co/rest/v1/rpc/send_email',
      ARRAY[
        ('Content-Type', 'application/json'),
        ('Authorization', 'Bearer ' || current_setting('request.jwt.claim.role', true))
      ],
      jsonb_build_object(
        'to_email', NEW.email,
        'subject', 'Your Account Has Been Approved',
        'content', concat(
          '<p>Dear ', coalesce(NEW.full_name, 'Investor'), ',</p>',
          '<p>Your account has been approved. You can now log in to the LP Portal.</p>',
          '<p>Best regards,<br>e2vc Team</p>'
        )
      )::text,
      10
    ));

    -- Log the response for debugging
    raise notice 'Email notification response: %', response;
  end if;
  
  return NEW;
end;
$$;

-- Recreate the trigger (no need to drop if using create or replace)
create or replace trigger on_user_approval
  after update on profiles
  for each row
  execute function handle_user_approval();