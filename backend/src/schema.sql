PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS screenplays (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  screenplayId TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  FOREIGN KEY(screenplayId) REFERENCES screenplays(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dialogues (
  id TEXT PRIMARY KEY,
  characterId TEXT NOT NULL,
  screenplayId TEXT NOT NULL,
  text TEXT NOT NULL,
  sceneNumber TEXT,
  page INTEGER,
  FOREIGN KEY(characterId) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY(screenplayId) REFERENCES screenplays(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sprints (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  isActive INTEGER NOT NULL CHECK (isActive IN (0,1)),
  startedAt TEXT NOT NULL,
  endedAt TEXT,
  durationSec INTEGER
);

CREATE TABLE IF NOT EXISTS stash (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  text TEXT NOT NULL,
  type TEXT NOT NULL,
  wordCount INTEGER NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS screenplay_content (
  screenplayId TEXT PRIMARY KEY,
  html TEXT NOT NULL DEFAULT '',
  updatedAt TEXT NOT NULL,
  FOREIGN KEY(screenplayId) REFERENCES screenplays(id) ON DELETE CASCADE
);