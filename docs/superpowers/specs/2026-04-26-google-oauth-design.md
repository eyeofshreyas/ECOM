# Google OAuth Integration Design

**Date:** 2026-04-26  
**Status:** Approved  

## Overview

Add Google Sign-In to the existing MERN e-commerce app using a frontend-driven OAuth approach. The existing JWT-based email/password flow is unchanged. Google auth produces the same JWT response shape, so no downstream code changes are needed.

## Approach

Frontend-only Google Identity Services (`@react-oauth/google`) — user clicks the Google button, Google returns a credential (ID token) in the browser, frontend POSTs it to the backend, backend verifies it locally using `google-auth-library` and issues the app's own JWT.

Rejected alternatives:
- Backend OAuth redirect flow (Passport.js) — unnecessary complexity, requires sessions/cookies
- Firebase Authentication — overkill dependency, would require migrating existing users

## Data Flow

1. User clicks "Sign in with Google" on the Login page
2. Google popup opens, user selects their account
3. Google returns a credential (ID token) to the frontend callback
4. Frontend POSTs `{ credential }` to `POST /api/users/auth/google`
5. Backend verifies the token locally with `google-auth-library` using `GOOGLE_CLIENT_ID`
6. Backend extracts `name`, `email`, `sub` (googleId) from the verified payload
7. Account resolution:
   - Email exists, no `googleId` → link: set googleId, save, return JWT
   - Email exists, has `googleId` → return JWT directly
   - No user with that email → create user with `{ name, email, googleId }`, return JWT
8. Response shape is identical to normal login: `{ _id, name, email, isAdmin, token }`
9. Frontend stores as `userInfo` in localStorage — no changes to existing post-login logic

## Backend Changes

### User Model (`backend/src/models/User.js`)
- `password`: remove `required: true` — make optional. Existing users unaffected (already have passwords stored). The `pre('save')` hook already skips hashing when password is not modified.
- `googleId`: add new optional `String` field with `sparse: true, unique: true` index (sparse allows multiple null values without violating uniqueness)

### New Route
`POST /api/users/auth/google` — public, no `protect` middleware

### New Controller Function (`authGoogle` in `userController.js`)
```
1. Verify credential using google-auth-library OAuth2Client
2. Extract { name, email, sub as googleId } from ticket.getPayload()
3. Find user by email
4. Resolve account (link / return / create) as described above
5. Return { _id, name, email, isAdmin, token: generateToken(_id) }
```

### Dependencies
- `google-auth-library` (backend)

### Environment Variables
- `backend/.env`: `GOOGLE_CLIENT_ID=<value>` (same value as frontend)

## Frontend Changes

### Dependencies
- `@react-oauth/google` (frontend)

### `frontend/src/main.tsx`
Wrap `<App />` with `<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>`.

### `frontend/src/pages/Login.tsx`
Add a `<GoogleLogin>` button below the existing form, separated by an "or" divider.

- `onSuccess`: POST `{ credential }` to `/api/users/auth/google`, store response as `userInfo` in localStorage, navigate (same as normal login)
- `onError`: show destructive toast "Google sign-in failed"

### Environment Variables
- `frontend/.env`: `VITE_GOOGLE_CLIENT_ID=748390660765-3hvk72cu80a0td21hlrh6inlkgq71vr7.apps.googleusercontent.com` ✅ already set

## Error Handling
- Invalid / expired Google token → 401 `{ message: 'Invalid Google token' }`
- Google verification throws → caught by `next(error)`, returns 500

## Files to Create / Modify

| File | Change |
|------|--------|
| `backend/src/models/User.js` | Make password optional, add googleId field |
| `backend/src/controllers/userController.js` | Add `authGoogle` function |
| `backend/src/routes/userRoutes.js` | Add `POST /auth/google` route |
| `backend/.env` | Add `GOOGLE_CLIENT_ID` |
| `frontend/src/main.tsx` | Wrap with `GoogleOAuthProvider` |
| `frontend/src/pages/Login.tsx` | Add `GoogleLogin` button |
| `frontend/.env` | Already has `VITE_GOOGLE_CLIENT_ID` ✅ |

## Out of Scope
- Google Sign-In on the Register page (Login handles both cases via auto-create)
- Profile page showing "linked with Google" status
- Unlinking a Google account
- Any other OAuth provider
