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
  FOR ALL USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY characters_owner_policy ON characters
  FOR ALL USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY dialogues_owner_policy ON dialogues
  FOR ALL USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY sprints_owner_policy ON sprints
  FOR ALL USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY stash_owner_policy ON stash
  FOR ALL USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY screenplay_content_owner_policy ON screenplay_content
  FOR ALL USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());
