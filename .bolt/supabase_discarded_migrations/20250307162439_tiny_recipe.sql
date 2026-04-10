/*
  # Add email notification for user approval

  1. Changes
    - Create a new function to send approval notification emails
    - Add trigger to automatically send email when user is approved
    
  2. Security
    - Function is security definer to ensure it can send emails
    - Only triggers on actual status changes to avoid duplicate emails
*/

-- Create the notification function
create or replace function handle_user_approval()
returns trigger
language plpgsql
security definer
as $$
declare
  template_id text;
begin
  -- Only send notification when status changes to 'approved'
  if (NEW.status = 'approved' and OLD.status != 'approved') then
    -- Send the approval email
    select net.http_post(
      url := 'https://xoxyfcznfrqcaanymhpg.supabase.co/functions/v1/send-email',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claim.role') || '"}',
      body := json_build_object(
        'to', NEW.email,
        'subject', 'Your Account Has Been Approved',
        'html_content', concat(
          '<p>Dear ', coalesce(NEW.full_name, 'Investor'), ',</p>',
          '<p>Your account has been approved. You can now log in to the LP Portal.</p>',
          '<p>Best regards,<br>e2vc Team</p>'
        )
      )::text
    ) into template_id;
  end if;
  
  return NEW;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists on_user_approval on profiles;

-- Create the trigger
create trigger on_user_approval
  after update on profiles
  for each row
  execute function handle_user_approval();