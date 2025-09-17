PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS screenplays (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  screenplay_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  FOREIGN KEY(screenplay_id) REFERENCES screenplays(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dialogues (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  screenplay_id TEXT NOT NULL,
  text TEXT NOT NULL,
  scene_number TEXT,
  page INTEGER,
  FOREIGN KEY(character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY(screenplay_id) REFERENCES screenplays(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sprints (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  is_active INTEGER NOT NULL CHECK (is_active IN (0,1)),
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_sec INTEGER
);

CREATE TABLE IF NOT EXISTS stash (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  type TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS screenplay_content (
  screenplay_id TEXT PRIMARY KEY,
  html TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  FOREIGN KEY(screenplay_id) REFERENCES screenplays(id) ON DELETE CASCADE
);
