-- =====================================================
-- SUPABASE SQL SCHEMA FOR ENGAGEMENT PLAN APP
-- Run these commands in your Supabase SQL Editor
-- =====================================================

-- 1. GUESTS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS guests (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    person_count INTEGER DEFAULT 1,
    desk_no INTEGER NOT NULL,
    gift_count INTEGER DEFAULT 0,
    description TEXT,
    is_attended BOOLEAN DEFAULT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLE POSITIONS (for floor plan)
CREATE TABLE IF NOT EXISTS table_positions (
    desk_no INTEGER PRIMARY KEY,
    x NUMERIC NOT NULL DEFAULT 100,
    y NUMERIC NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FIXED OBJECTS (rectangles, triangles on floor plan)
CREATE TABLE IF NOT EXISTS fixed_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('rectangle', 'triangle')),
    x NUMERIC NOT NULL DEFAULT 100,
    y NUMERIC NOT NULL DEFAULT 100,
    width NUMERIC NOT NULL DEFAULT 100,
    height NUMERIC NOT NULL DEFAULT 60,
    rotation INTEGER NOT NULL DEFAULT 0 CHECK (rotation IN (0, 90, 180, 270)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. APP SETTINGS (for logo, background, etc.)
CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Enable public access
-- =====================================================

-- Enable RLS
ALTER TABLE guests DISABLE ROW LEVEL SECURITY;
ALTER TABLE table_positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
-- GUESTS
CREATE POLICY "Allow public read access on guests" ON guests FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on guests" ON guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on guests" ON guests FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on guests" ON guests FOR DELETE USING (true);

-- TABLE POSITIONS
CREATE POLICY "Allow public read access on table_positions" ON table_positions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on table_positions" ON table_positions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on table_positions" ON table_positions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on table_positions" ON table_positions FOR DELETE USING (true);

-- FIXED OBJECTS
CREATE POLICY "Allow public read access on fixed_objects" ON fixed_objects FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on fixed_objects" ON fixed_objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on fixed_objects" ON fixed_objects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on fixed_objects" ON fixed_objects FOR DELETE USING (true);

-- APP SETTINGS
CREATE POLICY "Allow public read access on app_settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on app_settings" ON app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on app_settings" ON app_settings FOR UPDATE USING (true);

-- =====================================================
-- INDEXES for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_guests_desk_no ON guests(desk_no);
CREATE INDEX IF NOT EXISTS idx_guests_is_attended ON guests(is_attended);
CREATE INDEX IF NOT EXISTS idx_fixed_objects_type ON fixed_objects(type);

-- =====================================================
-- Add display_order column to existing guests table
-- (Run this if you already have a guests table)
-- =====================================================
-- ALTER TABLE guests ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- =====================================================
-- UPDATE TRIGGER for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_positions_updated_at BEFORE UPDATE ON table_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fixed_objects_updated_at BEFORE UPDATE ON fixed_objects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
