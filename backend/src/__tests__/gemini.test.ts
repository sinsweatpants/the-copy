import request from 'supertest';
import jwt from 'jsonwebtoken';

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


// Mock the jsonwebtoken library
jest.mock('jsonwebtoken');

// Mock the global fetch function
global.fetch = jest.fn();

describe('POST /api/llm/generate', () => {
  const mockedJwt = jwt as jest.Mocked<typeof jwt>;

  beforeEach(() => {
    // Reset mocks before each test
    (fetch as jest.Mock).mockClear();
    mockedJwt.verify.mockClear();
  });

  test('should proxy the request to Gemini API and return data on success', async () => {
    // Arrange
    const fakeUser = { userId: '123', email: 'test@test.com' };
    const requestBody = { contents: [{ role: 'user', parts: [{ text: 'Hello' }] }] };
    const geminiResponse = { candidates: [{ content: { parts: [{ text: 'Hi there!' }] } }] };

    // Mock a valid JWT
    mockedJwt.verify.mockImplementation((token, secret, callback: any) => {
      callback(null, fakeUser);
    });

    // Mock a successful fetch response from Gemini
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(geminiResponse),
    });

    // Act
    const response = await request(app)
      .post('/api/llm/generate')
      .set('Authorization', 'Bearer fake-token')
      .send(requestBody);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(geminiResponse);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('should return an error if the Gemini API call fails', async () => {
    // Arrange
    const fakeUser = { userId: '123', email: 'test@test.com' };
    const requestBody = { contents: [{ role: 'user', parts: [{ text: 'Hello' }] }] };

    // Mock a valid JWT
    mockedJwt.verify.mockImplementation((token, secret, callback: any) => {
      callback(null, fakeUser);
    });

    // Mock a failed fetch response from Gemini
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    // Act
    const response = await request(app)
      .post('/api/llm/generate')
      .set('Authorization', 'Bearer fake-token')
      .send(requestBody);

    // Assert
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('An unexpected error occurred. Please try again later.');
  });

  test('should return 401 if no auth token is provided', async () => {
    // Act
    const response = await request(app)
      .post('/api/llm/generate')
      .send({});

    // Assert
    expect(response.status).toBe(401);
  });
});
