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

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id              TEXT        PRIMARY KEY,
    calorie_target       INTEGER     DEFAULT 2000,
    protein_target_g     INTEGER     DEFAULT 120,
    carbs_target_g       INTEGER     DEFAULT 250,
    fat_target_g         INTEGER     DEFAULT 70,
    dietary_restrictions TEXT[]      DEFAULT '{}',
    allergies            TEXT[]      DEFAULT '{}',
    goals                TEXT[]      DEFAULT '{}',
    age                  INTEGER,
    sex                  TEXT        CHECK (sex IN ('male','female','other','prefer_not_to_say')),
    height_cm            NUMERIC,
    weight_kg            NUMERIC,
    activity_level       TEXT        CHECK (activity_level IN ('sedentary','light','moderate','active','very_active')),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_plans (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     TEXT        NOT NULL,
    plan_date   DATE        NOT NULL,
    meal_type   TEXT        NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
    meal_name   TEXT        NOT NULL,
    ingredients JSONB       DEFAULT '[]',
    nutrients   JSONB       DEFAULT '{}',
    is_ai       BOOLEAN     DEFAULT true,
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shopping_items (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     TEXT        NOT NULL,
    item_name   TEXT        NOT NULL,
    quantity    FLOAT       DEFAULT 1,
    unit        TEXT        DEFAULT 'piece',
    checked     BOOLEAN     DEFAULT false,
    week_start  DATE        NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (configure policies in the Supabase dashboard
-- once you add proper authentication).
ALTER TABLE inventory      ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Permissive dev policy — remove before production.
CREATE POLICY "allow_all_dev" ON inventory      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_dev" ON meal_logs      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_dev" ON user_profiles  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_dev" ON meal_plans     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_dev" ON shopping_items FOR ALL USING (true) WITH CHECK (true);
