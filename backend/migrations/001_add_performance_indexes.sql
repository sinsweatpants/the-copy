CREATE INDEX IF NOT EXISTS idx_screenplays_user_id ON screenplays(user_id);
CREATE INDEX IF NOT EXISTS idx_screenplays_created_at ON screenplays(created_at);

CREATE INDEX IF NOT EXISTS idx_characters_screenplay_id ON characters(screenplay_id);
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name);

CREATE INDEX IF NOT EXISTS idx_dialogues_screenplay_id ON dialogues(screenplay_id);
CREATE INDEX IF NOT EXISTS idx_dialogues_character_id ON dialogues(character_id);

CREATE INDEX IF NOT EXISTS idx_sprints_user_id ON sprints(user_id);
CREATE INDEX IF NOT EXISTS idx_sprints_is_active ON sprints(is_active);

CREATE INDEX IF NOT EXISTS idx_stash_user_id ON stash(user_id);
CREATE INDEX IF NOT EXISTS idx_stash_created_at ON stash(created_at);
