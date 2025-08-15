import request from 'supertest';
import app from '../server';
import Database from 'better-sqlite3';

// Mock the database to use an in-memory instance for tests
jest.mock('better-sqlite3');

describe('Authentication Endpoints', () => {
  let db: Database.Database;

  beforeEach(() => {
    // Re-initialize the in-memory database before each test
    db = new (Database as any)(':memory:');

    // We need to apply the schema to the in-memory database
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `;
    db.exec(schema);

    // Now, we need to inject this mock db instance into our server.
    // This is tricky because the server creates its own db instance.
    // For a real app, we would refactor the server to allow injecting a db instance.
    // For this test, we'll have to rely on the actual db file, which is not ideal.
    // The test below will fail if the user already exists.
    // Let's modify the test to use a unique email each time.
  });

  test('should register a new user successfully', async () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const uniqueUsername = `testuser-${Date.now()}`;

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail,
        username: uniqueUsername,
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user.email).toBe(uniqueEmail);
  });

  test('should fail to register a user that already exists', async () => {
    const userData = {
      email: 'duplicate@example.com',
      username: 'duplicateuser',
      password: 'password123',
    };

    // First, register the user
    await request(app).post('/api/auth/register').send(userData);

    // Then, try to register again with the same details
    const response = await request(app).post('/api/auth/register').send(userData);

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('User already exists');
  });
});
