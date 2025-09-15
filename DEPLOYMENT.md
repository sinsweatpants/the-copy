# Deployment

## Frontend (Firebase Hosting SPA)
1. Install CLI: `npm i -g firebase-tools`
2. Build frontend: `npm run -w frontend build`
3. Deploy: `firebase deploy --only hosting`

`VITE_API_BASE` must point to the external API base URL.

## Backend
The API runs separately from this repository. Set environment flags to disable storage:
- `DISABLE_DB=true`
- `DISABLE_REDIS=true`
- `FRONTEND_ORIGINS=https://example.com`

## Future database support
To enable Postgres or Redis later, provide `DATABASE_URL` and `REDIS_URL` and run migrations with `node-pg-migrate`.
