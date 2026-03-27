-- ============================================
-- CHURCH DASHBOARD - Additional tables
-- (churches, guardians, children, checkins, classrooms, volunteers, services already exist)
-- ============================================

-- Members (adults - separate from guardians who are kids-ministry specific)
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  address TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'visitor', -- visitor, regular, member, leader
  joined_date DATE,
  baptism_date DATE,
  notes TEXT,
  guardian_id UUID REFERENCES guardians(id), -- link to kids check-in if applicable
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Donations (simple - no categories, no ranking)
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id),
  donor_name TEXT, -- for non-member donations
  amount DECIMAL(10,2) NOT NULL,
  donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  service_id UUID REFERENCES services(id),
  method TEXT DEFAULT 'transfer', -- transfer, cash, check, pix, card
  reference TEXT, -- transaction ID or check number
  notes TEXT,
  recorded_by TEXT, -- who entered it
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Service attendance (headcount per service)
CREATE TABLE IF NOT EXISTS service_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  headcount INTEGER NOT NULL DEFAULT 0,
  visitors INTEGER DEFAULT 0,
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(church_id, service_id, service_date)
);

-- Groups / Cells
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES members(id),
  meeting_day INTEGER, -- 0=Sunday, etc
  meeting_time TIME,
  location TEXT,
  group_type TEXT DEFAULT 'cell', -- cell, study, ministry, class
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Group members
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- member, leader, co-leader
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, member_id)
);

-- Group attendance
CREATE TABLE IF NOT EXISTS group_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id),
  meeting_date DATE NOT NULL,
  present BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Volunteer areas
CREATE TABLE IF NOT EXISTS volunteer_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Kids, Worship, Reception, Media, Sound, etc
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Volunteer assignments (who serves where and when)
CREATE TABLE IF NOT EXISTS volunteer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_area_id UUID NOT NULL REFERENCES volunteer_areas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  service_id UUID REFERENCES services(id),
  status TEXT DEFAULT 'scheduled', -- scheduled, confirmed, completed, absent
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admin users (who can access the dashboard)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin', -- admin, pastor, secretary
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email)
);

-- INDEXES
CREATE INDEX idx_members_church ON members(church_id);
CREATE INDEX idx_members_name ON members(church_id, full_name);
CREATE INDEX idx_members_status ON members(church_id, status);
CREATE INDEX idx_donations_church_date ON donations(church_id, donation_date);
CREATE INDEX idx_donations_member ON donations(member_id);
CREATE INDEX idx_service_attendance_date ON service_attendance(church_id, service_date);
CREATE INDEX idx_groups_church ON groups(church_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_attendance_date ON group_attendance(group_id, meeting_date);
CREATE INDEX idx_volunteer_assignments_date ON volunteer_assignments(service_date);

-- RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for members" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for donations" ON donations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_attendance" ON service_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for groups" ON groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for group_members" ON group_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for group_attendance" ON group_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for volunteer_areas" ON volunteer_areas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for volunteer_assignments" ON volunteer_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for admin_users" ON admin_users FOR ALL USING (true) WITH CHECK (true);

-- SEED: admin user (password: admin123 - change in production!)
INSERT INTO admin_users (church_id, email, password_hash, full_name, role) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin@igreja.com', 'admin123', 'Administrador', 'pastor');

-- SEED: some members
INSERT INTO members (church_id, full_name, email, phone, status) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ana Silva', 'ana@email.com', '(11) 99999-0001', 'member'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Carlos Santos', 'carlos@email.com', '(11) 99999-0002', 'member'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Juliana Oliveira', 'juliana@email.com', '(11) 99999-0003', 'regular'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Roberto Lima', 'roberto@email.com', '(11) 99999-0004', 'visitor'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Maria Voluntária', 'maria@email.com', '(11) 99999-0005', 'leader');

-- SEED: volunteer areas
INSERT INTO volunteer_areas (church_id, name) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Kids Ministry'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Worship'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Reception'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Media/Sound'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Parking');
