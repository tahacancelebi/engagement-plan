-- Table Positions Storage for Floor Plan
-- Run this in Supabase SQL Editor

-- Create the table_positions table
CREATE TABLE IF NOT EXISTS table_positions (
  id SERIAL PRIMARY KEY,
  desk_no INTEGER NOT NULL UNIQUE,
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on desk_no for faster lookups
CREATE INDEX IF NOT EXISTS idx_table_positions_desk_no ON table_positions(desk_no);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE table_positions DISABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for anonymous users
-- (since this is a simple app without auth)
CREATE POLICY "Allow all operations for anon" ON table_positions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Upsert function to update or insert positions
-- This allows saving multiple positions at once
CREATE OR REPLACE FUNCTION upsert_table_position(
  p_desk_no INTEGER,
  p_x NUMERIC,
  p_y NUMERIC
)
RETURNS void AS $$
BEGIN
  INSERT INTO table_positions (desk_no, x, y, updated_at)
  VALUES (p_desk_no, p_x, p_y, NOW())
  ON CONFLICT (desk_no)
  DO UPDATE SET
    x = EXCLUDED.x,
    y = EXCLUDED.y,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
