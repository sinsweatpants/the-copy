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

## 2025-09-15 (Batch B)
- Verified existing `firebase.json` already serves the SPA with the required rewrite and cache headers.
- Confirmed `.firebaserc` includes a default project placeholder.
- Checked `frontend/.env.production.example` documents `VITE_API_BASE` for the external API.

To test:
- Inspection only (no automated commands executed).

## 2025-09-15 (Batch C)
- Declared `prom-client` for the backend workspace and created Prometheus helpers.
- Instrumented Express responses with an HTTP duration histogram and exposed `GET /metrics`.

To test:
- `npm test -w backend` *(blocked: requires fetching new dependencies from npm registry, which is not accessible in this environment).*

## 2025-09-15 (Batch D)
- Added Redis-aware rate limiting middleware with a memory fallback and startup logging.
- Bootstrapped the Express server asynchronously so the limiter is attached before listening.

To test:
- `npm test -w backend` *(blocked: npm registry access required for newly declared dependencies).*

## 2025-09-15 (Batch E)
- Updated the security middleware to build CSP connect-src from configured frontend and API origins.
- Applied the security middleware in the server bootstrap and allowed `EXTERNAL_API_BASE` in env validation.

To test:
- `npm test -w backend` *(blocked: npm registry access required for newly declared dependencies).*

## 2025-09-15 (Batch F)
- Broadened logger redaction to cover cookies, API keys, tokens, and secret payload fields.

To test:
- `npm test -w backend` *(blocked: npm registry access required for newly declared dependencies).*

## 2025-09-15 (Batch G)
- Exported a reusable Puppeteer launch helper and replaced the PDF smoke test with a fast Jest mock asserting `--no-sandbox` flags.

To test:
- `npm test -w backend` *(blocked: npm registry access required for newly declared dependencies).*

## 2025-09-15 (Batch H)
- Unified CI to install dependencies once on Node 20, build/test both workspaces, and run a frontend type-check.

To test:
- Workflow only (not executed locally in this environment).

## 2025-09-15 (Batch I)
- Re-exported the Express app after the async bootstrap refactor to keep Jest suites working.

To test:
- `npm test -w backend` *(fails until npm registry access allows installing new dependencies like `prom-client`).*
