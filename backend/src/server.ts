import express from "express";
import cors from "cors";
import morgan from "morgan";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { customAlphabet } from "nanoid";
import puppeteer from "puppeteer";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 12);
const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

const dbPath = join(process.cwd(), "data.sqlite");
const db = new Database(dbPath);
const schemaPath = join(process.cwd(), "src", "schema.sql");
const schema = readFileSync(schemaPath, "utf8");
db.exec(schema);

// --- Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};


// --- Helpers
function ok(res: any, data: unknown) {
  res.json({ ok: true, data });
}
function notFound(res: any) {
  res.status(404).json({ ok: false, error: "Not found" });
}

// --- API
// Apply auth middleware
app.use('/api/screenplays', authenticateToken);
app.use('/api/users/:userId', authenticateToken);


// Screenplay metadata
app.get("/api/screenplays/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM screenplays WHERE id=?").get(req.params.id);
  if (!row) return notFound(res);
  ok(res, row);
});

// Screenplay content
app.get("/api/screenplays/:id/content", (req, res) => {
  const row = db.prepare("SELECT html, updatedAt FROM screenplay_content WHERE screenplayId=?")
    .get(req.params.id);
  ok(res, row ?? { html: "", updatedAt: null });
});

app.put("/api/screenplays/:id/content", (req, res) => {
  const { html } = req.body ?? { html: "" };
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO screenplay_content (screenplayId, html, updatedAt)
    VALUES (?, ?, ?)
    ON CONFLICT(screenplayId) DO UPDATE SET html=excluded.html, updatedAt=excluded.updatedAt
  `);
  stmt.run(req.params.id, html ?? "", now);
  ok(res, { updatedAt: now });
});

// Characters
app.get("/api/screenplays/:id/characters", (req, res) => {
  const rows = db.prepare("SELECT * FROM characters WHERE screenplayId=?").all(req.params.id);
  ok(res, rows);
});

app.post("/api/screenplays/:id/characters", (req, res) => {
  const id = nanoid();
  const { name, role } = req.body ?? {};
  db.prepare(`INSERT INTO characters (id, screenplayId, name, role) VALUES (?,?,?,?)`)
    .run(id, req.params.id, name ?? "بدون اسم", role ?? "");
  ok(res, { id, name, role });
});

// Dialogues
app.get("/api/characters/:id/dialogues", (req, res) => {
  const rows = db.prepare("SELECT * FROM dialogues WHERE characterId=?").all(req.params.id);
  ok(res, rows);
});

app.put("/api/dialogues/:dialogueId", (req, res) => {
  const { text } = req.body ?? {};
  db.prepare("UPDATE dialogues SET text=? WHERE id=?").run(text ?? "", req.params.dialogueId);
  ok(res, { id: req.params.dialogueId, text });
});

// Sprints
app.get("/api/users/:userId/sprints/active", (req, res) => {
  const row = db.prepare("SELECT * FROM sprints WHERE userId=? AND isActive=1 ORDER BY startedAt DESC LIMIT 1").get(req.params.userId);
  ok(res, row ?? null);
});

app.post("/api/users/:userId/sprints", (req, res) => {
  const id = nanoid();
  const startedAt = new Date().toISOString();
  db.prepare(`INSERT INTO sprints (id, userId, isActive, startedAt) VALUES (?,?,1,?)`)
    .run(id, req.params.userId, startedAt);
  ok(res, { id, startedAt, isActive: 1 });
});

app.put("/api/users/:userId/sprints/:sprintId", (req, res) => {
  const { action, durationSec } = req.body ?? {};
  if (action === "end") {
    db.prepare(`UPDATE sprints SET isActive=0, endedAt=?, durationSec=? WHERE id=? AND userId=?`)
      .run(new Date().toISOString(), durationSec ?? null, req.params.sprintId, req.params.userId);
  } else if (action === "pause") {
    db.prepare(`UPDATE sprints SET isActive=0 WHERE id=? AND userId=?`)
      .run(req.params.sprintId, req.params.userId);
  }
  ok(res, { id: req.params.sprintId, action });
});

// Stash
app.get("/api/users/:userId/stash", (req, res) => {
  const rows = db.prepare("SELECT * FROM stash WHERE userId=? ORDER BY createdAt DESC").all(req.params.userId);
  ok(res, rows);
});

app.post("/api/users/:userId/stash", (req, res) => {
  const id = nanoid();
  const { text, type } = req.body ?? {};
  const wordCount = (text ?? "").trim().split(/\s+/).filter(Boolean).length;
  db.prepare(`INSERT INTO stash (id, userId, text, type, wordCount, createdAt) VALUES (?,?,?,?,?,?)`)
    .run(id, req.params.userId, text ?? "", type ?? "snippet", wordCount, new Date().toISOString());
  ok(res, { id });
});

app.delete("/api/users/:userId/stash/:itemId", (req, res) => {
  db.prepare("DELETE FROM stash WHERE id=? AND userId=?").run(req.params.itemId, req.params.userId);
  ok(res, true);
});

// Export PDF
app.post("/api/export/pdf", async (req, res) => {
  try {
    const { html, title = "screenplay" } = req.body ?? {};
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    const style = `
      <style>
        @page { size: A4; margin: 1in 1in 1in 1.5in; }
        html, body { font-family: system-ui, sans-serif; }
        body { direction: rtl; }
        .screenplay-page { padding: 0; }
        .action { margin: 0.08in 0; text-align: right; }
        .dialogue { margin-right: 1.5in; margin-left: 1.5in; text-align: center; margin-top: 0.06in; margin-bottom: 0.06in; }
        .character { font-weight: 700; text-align: center; }
        .parenthetical { text-align: center; font-style: italic; }
        .transition { text-align: center; margin: 0.12in 0; }
        .scene-header-line1 { display: flex; justify-content: space-between; margin: 0.2in 0 0 0; font-weight: bold; }
        .scene-header-location { text-align: center; margin-top: 0.05in; font-weight: bold; text-decoration: underline; }
        .basmala { text-align: left; margin: 0.2in 0; font-weight: bold; }
      </style>
    `;

    await page.setContent(`
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head><meta charset="utf-8"/>${style}</head>
        <body>
          <div class="screenplay-page">
            ${html}
          </div>
        </body>
      </html>
    `, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      margin: { top: "1in", bottom: "1in", left: "1in", right: "1.5in" },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:8px; width:100%; padding:0 1in; text-align:center; direction:rtl;"></div>`,
      footerTemplate: `
        <div style="font-size:10px; width:100%; padding:0 1in; direction:rtl;">
          <div style="text-align:center; width:100%;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        </div>`,
    });

    await browser.close();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${title}.pdf"`);
    res.send(Buffer.from(pdf));
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ ok: false, error: e?.message ?? "PDF error" });
  }
});

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
  console.log("API on http://localhost:" + PORT);
});