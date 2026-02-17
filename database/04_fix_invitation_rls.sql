-- Fix RLS policy for employee invitations
-- Allow anonymous users to verify invitation tokens during signup

-- Drop existing policy
DROP POLICY IF EXISTS "Employers manage invitations" ON employee_invitations;

-- Allow employers to manage their invitations
CREATE POLICY "Employers manage invitations"
  ON employee_invitations FOR ALL
  USING (employer_id = auth.uid());

-- Allow anonymous users to read invitations by token (for signup verification)
CREATE POLICY "Anyone can verify invitation tokens"
  ON employee_invitations FOR SELECT
  USING (true);
