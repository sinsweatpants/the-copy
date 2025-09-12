CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
DECLARE
    user_id_claim TEXT;
BEGIN
    user_id_claim := current_setting('request.jwt.claims', true);
    IF user_id_claim IS NULL OR jsonb_typeof(user_id_claim::jsonb) = 'null' THEN
        RETURN NULL;
    ELSE
        RETURN (user_id_claim::jsonb->>'user_id')::UUID;
    END IF;
EXCEPTION
    WHEN others THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing policies that depend on owner_user_id
DROP POLICY IF EXISTS screenplays_owner_policy ON screenplays;
DROP POLICY IF EXISTS characters_owner_policy ON characters;
DROP POLICY IF EXISTS dialogues_owner_policy ON dialogues;
DROP POLICY IF EXISTS sprints_owner_policy ON sprints;
DROP POLICY IF EXISTS stash_owner_policy ON stash;
DROP POLICY IF EXISTS screenplay_content_owner_policy ON screenplay_content;

-- Drop existing owner_user_id columns if they exist
ALTER TABLE screenplays DROP COLUMN IF EXISTS owner_user_id;
ALTER TABLE characters DROP COLUMN IF EXISTS owner_user_id;
ALTER TABLE dialogues DROP COLUMN IF EXISTS owner_user_id;
ALTER TABLE sprints DROP COLUMN IF EXISTS owner_user_id;
ALTER TABLE stash DROP COLUMN IF EXISTS owner_user_id;
ALTER TABLE screenplay_content DROP COLUMN IF EXISTS owner_user_id;

-- Add owner_user_id columns
ALTER TABLE screenplays ADD COLUMN owner_user_id uuid REFERENCES users(id);
UPDATE screenplays SET owner_user_id = user_id;
ALTER TABLE screenplays ALTER COLUMN owner_user_id SET NOT NULL;

ALTER TABLE characters ADD COLUMN owner_user_id uuid REFERENCES users(id);
UPDATE characters c SET owner_user_id = s.user_id FROM screenplays s WHERE c.screenplay_id = s.id;
ALTER TABLE characters ALTER COLUMN owner_user_id SET NOT NULL;

ALTER TABLE dialogues ADD COLUMN owner_user_id uuid REFERENCES users(id);
UPDATE dialogues d SET owner_user_id = s.user_id FROM screenplays s WHERE d.screenplay_id = s.id;
ALTER TABLE dialogues ALTER COLUMN owner_user_id SET NOT NULL;

ALTER TABLE sprints ADD COLUMN owner_user_id uuid REFERENCES users(id);
UPDATE sprints SET owner_user_id = user_id;
ALTER TABLE sprints ALTER COLUMN owner_user_id SET NOT NULL;

ALTER TABLE stash ADD COLUMN owner_user_id uuid REFERENCES users(id);
UPDATE stash SET owner_user_id = user_id;
ALTER TABLE stash ALTER COLUMN owner_user_id SET NOT NULL;

ALTER TABLE screenplay_content ADD COLUMN owner_user_id uuid REFERENCES users(id);
UPDATE screenplay_content sc SET owner_user_id = s.user_id FROM screenplays s WHERE sc.screenplay_id = s.id;
ALTER TABLE screenplay_content ALTER COLUMN owner_user_id SET NOT NULL;

-- Enable Row Level Security
ALTER TABLE screenplays ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE stash ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenplay_content ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY screenplays_owner_policy ON screenplays
  FOR ALL USING (owner_user_id = current_user_id())
  WITH CHECK (owner_user_id = current_user_id());

CREATE POLICY characters_owner_policy ON characters
  FOR ALL USING (owner_user_id = current_user_id())
  WITH CHECK (owner_user_id = current_user_id());

CREATE POLICY dialogues_owner_policy ON dialogues
  FOR ALL USING (owner_user_id = current_user_id())
  WITH CHECK (owner_user_id = current_user_id());

CREATE POLICY sprints_owner_policy ON sprints
  FOR ALL USING (owner_user_id = current_user_id())
  WITH CHECK (owner_user_id = current_user_id());

CREATE POLICY stash_owner_policy ON stash
  FOR ALL USING (owner_user_id = current_user_id())
  WITH CHECK (owner_user_id = current_user_id());

CREATE POLICY screenplay_content_owner_policy ON screenplay_content
  FOR ALL USING (owner_user_id = current_user_id())
  WITH CHECK (owner_user_id = current_user_id());