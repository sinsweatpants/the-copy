import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

jest.mock('pg', () => {
  const mPool = { query: jest.fn() } as any;
  return { Pool: jest.fn(() => mPool) };
});

const mockedPool = new Pool() as any;

jest.mock('jsonwebtoken');

let app: any;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgres://user:password@localhost:5432/test';
  process.env.JWT_SECRET = 'test_jwt_secret_test_jwt_secret';
  process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret_test_jwt_secret';
  process.env.GEMINI_API_KEY = 'test_key';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.FRONTEND_ORIGIN = 'http://localhost:5173';
  app = (await import('../server')).default;
});

describe('RLS and auth enforcement', () => {
  const mockedJwt = jwt as jest.Mocked<typeof jwt>;

  beforeEach(() => {
    mockedPool.query.mockReset();
    mockedJwt.verify.mockReset();
  });

  test('lists only authenticated user screenplays', async () => {
    mockedJwt.verify.mockImplementation((token, secret, cb: any) => cb(null, { userId: 'user1' }));
    mockedPool.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] });
    await request(app)
      .get('/api/screenplays')
      .set('Authorization', 'Bearer token');
    expect(mockedPool.query).toHaveBeenCalledWith(
      expect.stringContaining('owner_user_id=$1'),
      expect.arrayContaining(['user1'])
    );
  });

  test('forbids accessing another user stash', async () => {
    mockedJwt.verify.mockImplementation((token, secret, cb: any) => cb(null, { userId: 'user1' }));
    const res = await request(app)
      .get('/api/users/other/stash')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(403);
  });
});
