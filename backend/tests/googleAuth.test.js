require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');

// Mock google-auth-library before any imports that use it
jest.mock('google-auth-library', () => {
    const mockGetPayload = jest.fn();
    const mockVerifyIdToken = jest.fn().mockResolvedValue({ getPayload: mockGetPayload });
    const MockOAuth2Client = jest.fn().mockImplementation(() => ({ verifyIdToken: mockVerifyIdToken }));
    return { OAuth2Client: MockOAuth2Client, _mockGetPayload: mockGetPayload };
});

const { _mockGetPayload } = require('google-auth-library');

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mern_ecom_test');
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

beforeEach(async () => {
    await User.deleteMany({});
    _mockGetPayload.mockReturnValue({
        name: 'Test User',
        email: 'testuser@gmail.com',
        sub: 'google-uid-123',
    });
});

describe('POST /api/users/auth/google', () => {
    it('creates a new user and returns JWT when email does not exist', async () => {
        const res = await request(app)
            .post('/api/users/auth/google')
            .send({ credential: 'valid-fake-token' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
            name: 'Test User',
            email: 'testuser@gmail.com',
            isAdmin: false,
        });
        expect(res.body._id).toBeDefined();
        expect(res.body.token).toBeDefined();

        const user = await User.findOne({ email: 'testuser@gmail.com' });
        expect(user).not.toBeNull();
        expect(user.googleId).toBe('google-uid-123');
        expect(user.password).toBeUndefined();
    });

    it('links googleId to existing email/password account and returns JWT', async () => {
        await User.create({
            name: 'Existing User',
            email: 'testuser@gmail.com',
            password: 'hashedpassword',
        });

        const res = await request(app)
            .post('/api/users/auth/google')
            .send({ credential: 'valid-fake-token' });

        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();

        const user = await User.findOne({ email: 'testuser@gmail.com' });
        expect(user.googleId).toBe('google-uid-123');
    });

    it('logs in existing Google user without modifying their record', async () => {
        await User.create({
            name: 'Google User',
            email: 'testuser@gmail.com',
            googleId: 'google-uid-123',
        });

        const res = await request(app)
            .post('/api/users/auth/google')
            .send({ credential: 'valid-fake-token' });

        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    it('returns 401 when credential is missing', async () => {
        const res = await request(app)
            .post('/api/users/auth/google')
            .send({});

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('Invalid Google token');
    });
});
