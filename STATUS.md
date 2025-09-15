# Status

## 2025-09-15
- Removed tracked binaries and added ignore patterns.
- Added SECURITY.md and purge-secrets-history.sh.
- No tests affected.
- Added Firebase Hosting config and deployment notes.
- Switched CORS to FRONTEND_ORIGINS variable with strict 403 check.
- Added PDF worker warning and smoke test.

To test:
- `npm ci`
- `npm run -w frontend build`
- `npm run -w backend build`
- `npm test -w backend`

## 2025-09-15 (Batch A)
- Added placeholder `.firebaserc`.
- Upgraded Dockerfile to Node 20 multi-stage build.
- Standardized frontend production env to `VITE_API_BASE` and documented in DEPLOYMENT.md.
- Regenerated root `package-lock.json`.

To test:
- `npm i --package-lock-only`
- `docker build -t the-copy:test .`
- `npm test`
