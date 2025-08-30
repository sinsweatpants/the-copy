import request from "supertest";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import createServer from "../server";

jest.mock("nanoid", () => ({ customAlphabet: () => () => "id" }));
jest.mock("jsonwebtoken", () => ({ sign: jest.fn(() => "tok"), verify: jest.fn((t: any, s: any, cb: any) => cb(null, {})) }));
jest.mock("bcrypt", () => ({ hash: jest.fn(async () => "h"), compare: jest.fn(async () => false) }));

describe("Authentication failures", () => {
  let db: Database.Database;
  let app: ReturnType<typeof createServer>;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
    db = new Database(":memory:");
    const schema = readFileSync(join(process.cwd(), "src", "schema.sql"), "utf8");
    db.exec(schema);
    app = createServer(db);
  });

  afterEach(() => {
    db.close();
  });

  test("login with incorrect password should fail", async () => {
    const user = { email: "user@example.com", username: "user", password: "password123" };
    await request(app).post("/api/auth/register").send(user);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "wrongpass" });
    expect(res.status).toBe(401);
  });

  test("request without token should be unauthorized", async () => {
    const res = await request(app).get("/api/screenplays/xyz");
    expect(res.status).toBe(401);
  });
});

