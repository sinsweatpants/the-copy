import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 12);

const db = new Database(join(process.cwd(), "data.sqlite"));
const schema = readFileSync(join(process.cwd(), "src", "schema.sql"), "utf8");
db.exec(schema);

const now = new Date().toISOString();
const spId = nanoid();
db.prepare(`INSERT INTO screenplays (id, title, createdAt, updatedAt) VALUES (?,?,?,?)`)
  .run(spId, "مشروعي الأول", now, now);

// Add screenplay content
db.prepare(`INSERT INTO screenplay_content (screenplayId, html, updatedAt) VALUES (?,?,?)`)
  .run(spId, '', now);

const c1 = nanoid();
db.prepare(`INSERT INTO characters (id, screenplayId, name, role) VALUES (?,?,?,?)`)
  .run(c1, spId, "سيد", "بطل");

const d1 = nanoid();
db.prepare(`INSERT INTO dialogues (id, characterId, screenplayId, text, sceneNumber, page) VALUES (?,?,?,?,?,?)`)
  .run(d1, c1, spId, "مرحبا، هذا أول سطر حوار.", "مشهد 1", 1);

console.log("Seeded. Screenplay ID:", spId);
db.close();