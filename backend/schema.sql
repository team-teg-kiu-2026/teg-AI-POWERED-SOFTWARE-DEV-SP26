-- Run this in the Supabase SQL editor to set up the NutriSmart schema.

CREATE TABLE IF NOT EXISTS inventory (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     TEXT        NOT NULL,
    item_name   TEXT        NOT NULL,
    quantity    FLOAT       NOT NULL DEFAULT 1,
    unit        TEXT        NOT NULL DEFAULT 'piece',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_logs (
    id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id          TEXT        NOT NULL,
    meal_description TEXT        NOT NULL,
    nutrients        JSONB       NOT NULL DEFAULT '{}',
    imbalances       JSONB       NOT NULL DEFAULT '[]',
    suggestions      JSONB       NOT NULL DEFAULT '[]',
    confidence       TEXT        DEFAULT 'medium',
    items_detected   JSONB       DEFAULT '[]',
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (configure policies in the Supabase dashboard
-- once you add proper authentication).
ALTER TABLE inventory  ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs  ENABLE ROW LEVEL SECURITY;

-- Permissive dev policy — remove before production.
CREATE POLICY "allow_all_dev" ON inventory  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_dev" ON meal_logs  FOR ALL USING (true) WITH CHECK (true);
