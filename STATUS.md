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
