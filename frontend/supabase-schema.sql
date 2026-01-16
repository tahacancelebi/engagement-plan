-- =====================================================
-- SUPABASE SQL SCHEMA FOR ENGAGEMENT PLAN APP
-- Run these commands in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. DESKS TABLE - Core table for desk management
-- =====================================================
CREATE TABLE IF NOT EXISTS desks (
    id SERIAL PRIMARY KEY,
    desk_no INTEGER UNIQUE NOT NULL,
    name VARCHAR(100),  -- Optional custom name like "VIP Table"
    capacity INTEGER DEFAULT 10,
    x NUMERIC NOT NULL DEFAULT 100,
    y NUMERIC NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. GUESTS TABLE - Links to desks via desk_no
-- =====================================================
CREATE TABLE IF NOT EXISTS guests (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    person_count INTEGER DEFAULT 1,
    desk_no INTEGER NOT NULL REFERENCES desks(desk_no) ON DELETE SET NULL,
    gift_count INTEGER DEFAULT 0,
    description TEXT,
    is_attended BOOLEAN DEFAULT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If guests table already exists without reference, use this instead:
-- ALTER TABLE guests ADD CONSTRAINT fk_guests_desk FOREIGN KEY (desk_no) REFERENCES desks(desk_no) ON DELETE SET NULL;

-- =====================================================
-- 3. FIXED OBJECTS (rectangles, triangles on floor plan)
-- =====================================================
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

-- =====================================================
-- 4. APP SETTINGS
-- =====================================================
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
ALTER TABLE desks ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (to avoid conflicts on re-run)
DROP POLICY IF EXISTS "public_read_desks" ON desks;
DROP POLICY IF EXISTS "public_insert_desks" ON desks;
DROP POLICY IF EXISTS "public_update_desks" ON desks;
DROP POLICY IF EXISTS "public_delete_desks" ON desks;

DROP POLICY IF EXISTS "public_read_guests" ON guests;
DROP POLICY IF EXISTS "public_insert_guests" ON guests;
DROP POLICY IF EXISTS "public_update_guests" ON guests;
DROP POLICY IF EXISTS "public_delete_guests" ON guests;

DROP POLICY IF EXISTS "public_read_fixed_objects" ON fixed_objects;
DROP POLICY IF EXISTS "public_insert_fixed_objects" ON fixed_objects;
DROP POLICY IF EXISTS "public_update_fixed_objects" ON fixed_objects;
DROP POLICY IF EXISTS "public_delete_fixed_objects" ON fixed_objects;

DROP POLICY IF EXISTS "public_read_app_settings" ON app_settings;
DROP POLICY IF EXISTS "public_insert_app_settings" ON app_settings;
DROP POLICY IF EXISTS "public_update_app_settings" ON app_settings;

-- Create policies for DESKS
CREATE POLICY "public_read_desks" ON desks FOR SELECT USING (true);
CREATE POLICY "public_insert_desks" ON desks FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_desks" ON desks FOR UPDATE USING (true);
CREATE POLICY "public_delete_desks" ON desks FOR DELETE USING (true);

-- Create policies for GUESTS
CREATE POLICY "public_read_guests" ON guests FOR SELECT USING (true);
CREATE POLICY "public_insert_guests" ON guests FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_guests" ON guests FOR UPDATE USING (true);
CREATE POLICY "public_delete_guests" ON guests FOR DELETE USING (true);

-- Create policies for FIXED_OBJECTS
CREATE POLICY "public_read_fixed_objects" ON fixed_objects FOR SELECT USING (true);
CREATE POLICY "public_insert_fixed_objects" ON fixed_objects FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_fixed_objects" ON fixed_objects FOR UPDATE USING (true);
CREATE POLICY "public_delete_fixed_objects" ON fixed_objects FOR DELETE USING (true);

-- Create policies for APP_SETTINGS
CREATE POLICY "public_read_app_settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "public_insert_app_settings" ON app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_app_settings" ON app_settings FOR UPDATE USING (true);

-- =====================================================
-- INDEXES for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_guests_desk_no ON guests(desk_no);
CREATE INDEX IF NOT EXISTS idx_guests_is_attended ON guests(is_attended);
CREATE INDEX IF NOT EXISTS idx_guests_display_order ON guests(display_order);
CREATE INDEX IF NOT EXISTS idx_fixed_objects_type ON fixed_objects(type);
CREATE INDEX IF NOT EXISTS idx_desks_desk_no ON desks(desk_no);

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

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_desks_updated_at ON desks;
DROP TRIGGER IF EXISTS update_guests_updated_at ON guests;
DROP TRIGGER IF EXISTS update_fixed_objects_updated_at ON fixed_objects;
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;

-- Create triggers
CREATE TRIGGER update_desks_updated_at BEFORE UPDATE ON desks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fixed_objects_updated_at BEFORE UPDATE ON fixed_objects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA: Create initial desks (1-20)
-- =====================================================
INSERT INTO desks (desk_no, x, y) VALUES
    (1, 150, 150),
    (2, 350, 150),
    (3, 550, 150),
    (4, 150, 350),
    (5, 350, 350),
    (6, 550, 350),
    (7, 150, 550),
    (8, 350, 550),
    (9, 550, 550),
    (10, 750, 150),
    (11, 750, 350),
    (12, 750, 550),
    (13, 950, 150),
    (14, 950, 350),
    (15, 950, 550),
    (16, 1150, 150),
    (17, 1150, 350),
    (18, 1150, 550)
ON CONFLICT (desk_no) DO NOTHING;

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get all desks with guest counts:
-- SELECT d.*, COUNT(g.id) as guest_count, SUM(g.person_count) as total_people
-- FROM desks d
-- LEFT JOIN guests g ON d.desk_no = g.desk_no
-- GROUP BY d.id
-- ORDER BY d.desk_no;

-- Get all guests for a specific desk:
-- SELECT * FROM guests WHERE desk_no = 1 ORDER BY display_order;

-- Add a new desk:
-- INSERT INTO desks (desk_no, x, y) VALUES (11, 200, 200);

-- Delete an empty desk:
-- DELETE FROM desks WHERE desk_no = 11 AND NOT EXISTS (SELECT 1 FROM guests WHERE desk_no = 11);
