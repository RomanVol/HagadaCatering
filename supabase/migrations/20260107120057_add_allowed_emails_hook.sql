-- Create allowed_emails table to store pre-approved emails
CREATE TABLE IF NOT EXISTS public.allowed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view (for admin purposes)
CREATE POLICY "Authenticated users can view allowed emails"
  ON public.allowed_emails
  FOR SELECT
  TO authenticated
  USING (true);

-- Create the auth hook function that checks if email is allowed
CREATE OR REPLACE FUNCTION public.check_allowed_email(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  is_allowed BOOLEAN;
BEGIN
  -- Extract email from the event
  user_email := event->'user'->>'email';

  -- Check if email exists in allowed_emails table
  SELECT EXISTS (
    SELECT 1 FROM public.allowed_emails
    WHERE LOWER(email) = LOWER(user_email)
  ) INTO is_allowed;

  -- If not allowed, return error decision
  IF NOT is_allowed THEN
    RETURN jsonb_build_object(
      'decision', 'reject',
      'message', 'Email not authorized. Please contact administrator.'
    );
  END IF;

  -- Allow the user to be created
  RETURN event;
END;
$$;

-- Grant execute permission to supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.check_allowed_email(jsonb) TO supabase_auth_admin;

-- Revoke from public for security
REVOKE EXECUTE ON FUNCTION public.check_allowed_email(jsonb) FROM PUBLIC;

-- Insert your existing allowed emails (from your current users)
INSERT INTO public.allowed_emails (email, name) VALUES
  ('romavolman@gmail.com', 'Roma Volman'),
  ('dbelshin@gmail.com', 'Dima Belshin'),
  ('osheryuma@gmail.com', 'Osher Yuma')
ON CONFLICT (email) DO NOTHING;
