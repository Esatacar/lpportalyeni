/*
  # Add email templates and functions for user notifications
  
  1. New Tables
    - `email_templates`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `subject` (text)
      - `content` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Functions
    - `notify_user_approval` function to send approval emails
    
  3. Security
    - Enable RLS on email_templates
    - Add policies for admin access
*/

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage email templates"
  ON email_templates
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.is_approved = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.is_approved = true
    )
  );

-- Add trigger for updating timestamps
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default email templates
INSERT INTO email_templates (name, subject, content)
VALUES (
  'user_approval',
  'Your Account Has Been Approved',
  'Dear {{full_name}},

We are pleased to inform you that your account has been approved. You can now access the LP Dashboard with your registered email address.

Best regards,
The Admin Team'
);

-- Create function to send approval email
CREATE OR REPLACE FUNCTION notify_user_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.is_approved = true AND (OLD.is_approved = false OR OLD.is_approved IS NULL)) THEN
    -- Send email using Supabase's built-in email function
    PERFORM net.http_post(
      url := net.http_build_url(
        'https://api.supabase.com/v1/auth/email',
        ARRAY[
          ROW('apikey', current_setting('request.header.apikey'))::net.param
        ]
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.header.authorization')
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'template', 'user_approval',
        'data', jsonb_build_object(
          'full_name', NEW.full_name
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;