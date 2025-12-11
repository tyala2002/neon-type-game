-- Enable Row Level Security on scores table
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access" ON scores;
DROP POLICY IF EXISTS "Deny direct insert" ON scores;
DROP POLICY IF EXISTS "Deny direct update" ON scores;
DROP POLICY IF EXISTS "Deny direct delete" ON scores;

-- Allow public read access (for leaderboard)
CREATE POLICY "Allow public read access"
ON scores FOR SELECT
TO public
USING (true);

-- Deny direct insert from clients
CREATE POLICY "Deny direct insert"
ON scores FOR INSERT
TO public
WITH CHECK (false);

-- Deny direct update from clients
CREATE POLICY "Deny direct update"
ON scores FOR UPDATE
TO public
USING (false);

-- Deny direct delete from clients
CREATE POLICY "Deny direct delete"
ON scores FOR DELETE
TO public
USING (false);

-- Note: Edge Functions use the service role key, which bypasses RLS
-- This ensures only the Edge Function can insert/update/delete scores
