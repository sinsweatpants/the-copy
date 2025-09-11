import request from 'supertest';
import app from '../server';
import jwt from 'jsonwebtoken';

// Mock the jsonwebtoken library
jest.mock('jsonwebtoken');

// Mock the global fetch function
global.fetch = jest.fn();

describe('POST /api/gemini-proxy', () => {
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
      .post('/api/gemini-proxy')
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
      .post('/api/gemini-proxy')
      .set('Authorization', 'Bearer fake-token')
      .send(requestBody);

    // Assert
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Gemini API error');
  });

  test('should return 401 if no auth token is provided', async () => {
    // Act
    const response = await request(app)
      .post('/api/gemini-proxy')
      .send({});

    // Assert
    expect(response.status).toBe(401);
  });
});
