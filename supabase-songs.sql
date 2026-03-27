-- ============================================
-- WORSHIP SONGS MODULE
-- ============================================

-- Song library (banco de músicas da igreja)
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  original_key TEXT, -- C, D, E, F, G, A, B (with #/b)
  bpm INTEGER,
  time_signature TEXT DEFAULT '4/4',
  lyrics TEXT, -- full lyrics
  chords TEXT, -- chord chart (cifra)
  notes TEXT, -- leader notes
  audio_url TEXT, -- reference audio link (youtube, spotify, etc)
  source TEXT DEFAULT 'manual', -- manual, worship_leader_db
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Service set list (ordem das músicas no culto)
CREATE TABLE service_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  service_date DATE NOT NULL,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  song_order INTEGER NOT NULL DEFAULT 0, -- order in set list
  song_key TEXT, -- key for this specific service (may differ from original)
  notes TEXT, -- notes for this performance
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Song roles (quem canta/toca o quê em cada música do culto)
CREATE TABLE song_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_song_id UUID NOT NULL REFERENCES service_songs(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- minister, soprano, tenor, alto, bass, guitar, keys, drums, bass_guitar
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_songs_church ON songs(church_id);
CREATE INDEX idx_songs_title ON songs(church_id, title);
CREATE INDEX idx_service_songs_date ON service_songs(church_id, service_date);
CREATE INDEX idx_service_songs_service ON service_songs(service_id);
CREATE INDEX idx_song_roles_service_song ON song_roles(service_song_id);

-- RLS
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for songs" ON songs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_songs" ON service_songs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for song_roles" ON song_roles FOR ALL USING (true) WITH CHECK (true);

-- Seed: some popular worship songs
INSERT INTO songs (church_id, title, artist, original_key, bpm) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Goodness of God', 'Bethel Music', 'A', 68),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Way Maker', 'Sinach', 'E', 68),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Build My Life', 'Housefires', 'G', 68),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'What A Beautiful Name', 'Hillsong Worship', 'D', 68),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ninguém Explica Deus', 'Preto no Branco', 'G', 75),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lugar Secreto', 'Gabriela Rocha', 'E', 70),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Reckless Love', 'Cory Asbury', 'C', 88),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Oceanos', 'Hillsong (Ana Nóbrega)', 'D', 66);
