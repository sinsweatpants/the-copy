-- Drop existing policies if they exist
DROP POLICY IF EXISTS screenplays_owner_policy ON screenplays;
DROP POLICY IF EXISTS characters_owner_policy ON characters;
DROP POLICY IF EXISTS dialogues_owner_policy ON dialogues;
DROP POLICY IF EXISTS sprints_owner_policy ON sprints;
DROP POLICY IF EXISTS stash_owner_policy ON stash;
DROP POLICY IF EXISTS screenplay_content_owner_policy ON screenplay_content;

-- Create new policies using current_user_id()
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