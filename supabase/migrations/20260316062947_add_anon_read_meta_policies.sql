
/*
  # Allow anon role to read meta_policies

  The existing SELECT policy only grants access to the `authenticated` role,
  but the frontend uses the anon key (no user login), so policies are invisible.
  This migration adds a SELECT policy for the `anon` role so unauthenticated
  clients can read meta policies.
*/

CREATE POLICY "Allow anon to read meta_policies"
  ON meta_policies
  FOR SELECT
  TO anon
  USING (true);
