# Google OAuth Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google Sign-In to the login page using frontend-driven OAuth — Google ID token verified on the backend, same JWT issued as normal login.

**Architecture:** The frontend uses `@react-oauth/google` to show Google's sign-in button. On success, the credential (ID token) is POSTed to a new public endpoint `POST /api/users/auth/google`. The backend verifies it locally with `google-auth-library`, resolves or creates the user, and returns the existing JWT response shape. No sessions, no redirects, no changes to existing auth flow.

**Tech Stack:** `google-auth-library` (backend verification), `@react-oauth/google` (frontend button + provider), Jest + Supertest (backend tests), existing JWT + Mongoose stack.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `backend/src/models/User.js` | Modify | Make password optional, add googleId field |
| `backend/src/controllers/userController.js` | Modify | Add `authGoogle` function |
| `backend/src/routes/userRoutes.js` | Modify | Register `POST /auth/google` route |
| `backend/.env` | Modify | Add `GOOGLE_CLIENT_ID` |
| `backend/tests/googleAuth.test.js` | Create | Tests for the Google auth endpoint |
| `frontend/src/main.tsx` | Modify | Wrap app with `GoogleOAuthProvider` |
| `frontend/src/pages/Login.tsx` | Modify | Add `GoogleLogin` button with handlers |

---

### Task 1: Install Dependencies

**Files:**
- Run in: `backend/`
- Run in: `frontend/`

- [ ] **Step 1: Install backend dependency**

```bash
cd backend
npm install google-auth-library
```

Expected: `google-auth-library` added to `backend/package.json` dependencies.

- [ ] **Step 2: Install frontend dependency**

```bash
cd frontend
npm install @react-oauth/google
```

Expected: `@react-oauth/google` added to `frontend/package.json` dependencies.

- [ ] **Step 3: Commit**

```bash
git add backend/package.json backend/package-lock.json frontend/package.json frontend/package-lock.json
git commit -m "chore: install google-auth-library and @react-oauth/google"
```

---

### Task 2: Update User Model

**Files:**
- Modify: `backend/src/models/User.js`

- [ ] **Step 1: Make password optional and add googleId field**

Open `backend/src/models/User.js`. Replace the `password` field definition and add `googleId` after `isAdmin`:

Current `password` field:
```js
password: {
    type: String,
    required: true,
},
```

Change to:
```js
password: {
    type: String,
},
googleId: {
    type: String,
    sparse: true,
    unique: true,
},
```

The `sparse: true` on `googleId` allows multiple documents to have `null`/`undefined` without violating the unique constraint. Existing users with passwords are unaffected — the `pre('save')` hook already only hashes when `isModified('password')`.

Full updated schema:
```js
const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
        },
        googleId: {
            type: String,
            sparse: true,
            unique: true,
        },
        isAdmin: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/models/User.js
git commit -m "feat: make User password optional and add googleId field"
```

---

### Task 3: Add Backend Environment Variable

**Files:**
- Modify: `backend/.env`

- [ ] **Step 1: Add GOOGLE_CLIENT_ID to backend .env**

Append to `backend/.env`:
```
GOOGLE_CLIENT_ID=748390660765-3hvk72cu80a0td21hlrh6inlkgq71vr7.apps.googleusercontent.com
```

This is the same value as `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`. The backend uses it to verify that incoming tokens were issued for this specific Google client.

- [ ] **Step 2: Commit**

```bash
git add backend/.env
git commit -m "chore: add GOOGLE_CLIENT_ID to backend env"
```

---

### Task 4: Write Failing Tests for Google Auth Endpoint

**Files:**
- Create: `backend/tests/googleAuth.test.js`

- [ ] **Step 1: Create the test file**

```js
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend
npm test -- --testPathPattern=googleAuth --verbose
```

Expected: 4 failing tests — `authGoogle` and the route don't exist yet.

---

### Task 5: Implement authGoogle Controller

**Files:**
- Modify: `backend/src/controllers/userController.js`

- [ ] **Step 1: Add the authGoogle function**

At the top of `backend/src/controllers/userController.js`, add the import after the existing requires:

```js
const { OAuth2Client } = require('google-auth-library');
```

Then add the `authGoogle` function before the `module.exports` block:

```js
// @desc    Auth user via Google OAuth
// @route   POST /api/users/auth/google
// @access  Public
const authGoogle = async (req, res, next) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            res.status(401);
            throw new Error('Invalid Google token');
        }

        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { name, email, sub: googleId } = payload;

        let user = await User.findOne({ email });

        if (user) {
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            user = await User.create({ name, email, googleId });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user._id),
        });
    } catch (error) {
        if (!res.statusCode || res.statusCode === 200) {
            res.status(500);
        }
        next(error);
    }
};
```

Add `authGoogle` to the `module.exports` at the bottom:

```js
module.exports = {
    authUser,
    registerUser,
    authGoogle,
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
};
```

- [ ] **Step 2: Run tests — expect them to still fail (route not wired yet)**

```bash
cd backend
npm test -- --testPathPattern=googleAuth --verbose
```

Expected: Tests fail with `Cannot POST /api/users/auth/google` — route not registered yet.

---

### Task 6: Register the Route

**Files:**
- Modify: `backend/src/routes/userRoutes.js`

- [ ] **Step 1: Import authGoogle and add the route**

Add `authGoogle` to the destructured import at the top:

```js
const {
    authUser,
    registerUser,
    authGoogle,
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
} = require('../controllers/userController');
```

Add the new route after the existing `router.post('/login', authUser)` line:

```js
router.post('/login', authUser);
router.post('/auth/google', authGoogle);
```

- [ ] **Step 2: Run tests — all 4 should pass**

```bash
cd backend
npm test -- --testPathPattern=googleAuth --verbose
```

Expected output:
```
PASS tests/googleAuth.test.js
  POST /api/users/auth/google
    ✓ creates a new user and returns JWT when email does not exist
    ✓ links googleId to existing email/password account and returns JWT
    ✓ logs in existing Google user without modifying their record
    ✓ returns 401 when credential is missing
```

- [ ] **Step 3: Run full test suite to check for regressions**

```bash
cd backend
npm test -- --verbose
```

Expected: All tests pass including existing `app.test.js`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/userController.js backend/src/routes/userRoutes.js backend/tests/googleAuth.test.js
git commit -m "feat: add Google OAuth endpoint POST /api/users/auth/google"
```

---

### Task 7: Wrap Frontend with GoogleOAuthProvider

**Files:**
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Add GoogleOAuthProvider**

Replace the contents of `frontend/src/main.tsx` with:

```tsx
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </GoogleOAuthProvider>
);
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/main.tsx
git commit -m "feat: wrap app with GoogleOAuthProvider"
```

---

### Task 8: Add Google Login Button to Login Page

**Files:**
- Modify: `frontend/src/pages/Login.tsx`

- [ ] **Step 1: Add the import**

Add at the top of `frontend/src/pages/Login.tsx` with the other imports:

```tsx
import { GoogleLogin } from "@react-oauth/google";
```

- [ ] **Step 2: Add the Google sign-in handler**

Inside the `Login` component, add this function after the `onSubmit` function:

```tsx
const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
        setIsLoading(true);
        const { data } = await api.post('/users/auth/google', {
            credential: credentialResponse.credential,
        });
        localStorage.setItem('userInfo', JSON.stringify(data));
        toast({
            title: "Logged in!",
            description: "Welcome back.",
        });
        navigate(redirect);
        window.location.reload();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Login failed",
            description: error.response?.data?.message || "Google sign-in failed",
        });
    } finally {
        setIsLoading(false);
    }
};

const handleGoogleError = () => {
    toast({
        variant: "destructive",
        title: "Login failed",
        description: "Google sign-in failed",
    });
};
```

- [ ] **Step 3: Add the button to the JSX**

Inside `<CardContent>`, after the closing `</Form>` tag and before `</CardContent>`, add:

```tsx
<div className="relative my-4">
    <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">or</span>
    </div>
</div>
<div className="flex justify-center">
    <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap={false}
    />
</div>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Login.tsx
git commit -m "feat: add Google Sign-In button to Login page"
```

---

### Task 9: Manual End-to-End Verification

- [ ] **Step 1: Start both servers**

Terminal 1:
```bash
cd backend && npm run dev
```
Confirm: `MongoDB connected` and `Server running on port 5000`

Terminal 2:
```bash
cd frontend && npm run dev
```
Confirm: Vite server starts on `http://localhost:5173`

- [ ] **Step 2: Test new user (Google-only)**

1. Open `http://localhost:5173/login` in a private/incognito browser window
2. Click "Sign in with Google"
3. Select a Google account that does NOT have an existing account in the app
4. Confirm you are redirected to the home page and logged in (name visible in nav)
5. Check MongoDB — user should exist with `googleId` set and no `password`

- [ ] **Step 3: Test account linking**

1. Log out
2. Register a new account using the same Gmail address (email/password flow)
3. Log out
4. Click "Sign in with Google" with that same Gmail
5. Confirm login succeeds — you are the same user (same `_id` in localStorage `userInfo`)
6. Check MongoDB — user should now have both `password` and `googleId` set

- [ ] **Step 4: Test returning Google user**

1. Log out
2. Click "Sign in with Google" again with the same account used in Step 2
3. Confirm login succeeds immediately

- [ ] **Step 5: Confirm existing email/password login still works**

1. Log out
2. Log in with `admin@example.com` / `123456` (seeded user)
3. Confirm login works normally
