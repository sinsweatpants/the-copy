import request from "supertest";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import createServer from "../server";

jest.mock("nanoid", () => ({ customAlphabet: () => () => "id" }));
jest.mock("jsonwebtoken", () => ({ sign: jest.fn(() => "tok"), verify: jest.fn((t: any, s: any, cb: any) => cb(null, {})) }));
jest.mock("bcrypt", () => ({ hash: jest.fn(async () => "h"), compare: jest.fn(async () => true) }));

describe("Screenplay CRUD", () => {
  let db: Database.Database;
  let app: ReturnType<typeof createServer>;
  let token: string;
  let userId: string;

  beforeEach(async () => {
    process.env.JWT_SECRET = "test-secret";
    db = new Database(":memory:");
    const schema = readFileSync(join(process.cwd(), "src", "schema.sql"), "utf8");
    db.exec(schema);
    app = createServer(db);

    const res = await request(app).post("/api/auth/register").send({
      email: "crud@example.com",
      username: "cruduser",
      password: "password123",
    });
    token = res.body.token;
    userId = res.body.user.id;
  });

  afterEach(() => {
    db.close();
  });

  test("create, read, update and delete screenplay", async () => {
    const createRes = await request(app)
      .post("/api/screenplays")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId, title: "Test" });
    expect(createRes.status).toBe(200);
    const screenplayId = createRes.body.data.id;

    const getRes = await request(app)
      .get(`/api/screenplays/${screenplayId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.title).toBe("Test");

    const updateRes = await request(app)
      .put(`/api/screenplays/${screenplayId}/content`)
      .set("Authorization", `Bearer ${token}`)
      .send({ html: "<p>Hello</p>" });
    expect(updateRes.status).toBe(200);

    const contentRes = await request(app)
      .get(`/api/screenplays/${screenplayId}/content`)
      .set("Authorization", `Bearer ${token}`);
    expect(contentRes.status).toBe(200);
    expect(contentRes.body.data.html).toContain("Hello");

    const deleteRes = await request(app)
      .delete(`/api/screenplays/${screenplayId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    const missing = await request(app)
      .get(`/api/screenplays/${screenplayId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(missing.status).toBe(404);
  });
});

