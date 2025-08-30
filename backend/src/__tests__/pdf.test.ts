import request from "supertest";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { join } from "node:path";

jest.mock("puppeteer", () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(Buffer.from("PDF")),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

import createServer from "../server";

jest.mock("nanoid", () => ({ customAlphabet: () => () => "id" }));
jest.mock("jsonwebtoken", () => ({ sign: jest.fn(() => "tok"), verify: jest.fn((t: any, s: any, cb: any) => cb(null, {})) }));
jest.mock("bcrypt", () => ({ hash: jest.fn(async () => "h"), compare: jest.fn(async () => true) }));

describe("PDF export", () => {
  let db: Database.Database;
  let app: ReturnType<typeof createServer>;

  beforeEach(() => {
    db = new Database(":memory:");
    const schema = readFileSync(join(process.cwd(), "src", "schema.sql"), "utf8");
    db.exec(schema);
    process.env.JWT_SECRET = "test-secret";
    app = createServer(db);
  });

  afterEach(() => {
    db.close();
  });

  test("should return a PDF file", async () => {
    const res = await request(app)
      .post("/api/export/pdf")
      .send({ html: "<p>test</p>", title: "sample" });
    expect(res.status).toBe(200);
    expect(res.header["content-type"]).toBe("application/pdf");
    expect(res.body.length).toBeGreaterThan(0);
  });
});

