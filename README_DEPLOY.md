# Deployment Without Docker

## Environment Variables
Set the following variables in `backend/.env`:

- `DATABASE_URL=postgres://user:password@localhost:5432/arabic_screenplay`
- `JWT_SECRET` and `REFRESH_TOKEN_SECRET`
- `GEMINI_API_KEY`
- `REDIS_URL`
- `FRONTEND_ORIGIN`
- `RATE_LIMIT_PER_MIN` and `HEAVY_LIMIT`
- `LOG_LEVEL` (default `info`)

## Local Postgres
1. Install PostgreSQL and create a database named `arabic_screenplay`.
2. Update `DATABASE_URL` with your credentials.
3. Apply migrations:
   ```bash
   npm run migrate:up --workspace=backend
   ```
4. Build and start:
   ```bash
   npm run build
   npm start --workspace=backend
   ```

## Using Supabase
1. Create a new project in Supabase.
2. Copy the connection string from the dashboard and set it as `DATABASE_URL`.
3. Run the migrations as above.

Logs are written to stdout; ensure your process manager captures them.

## Row Level Security
All tables storing user data include an `owner_user_id` column and RLS policies. PostgreSQL enforces that each authenticated user can only access their own rows. Migrations enable the policies automatically.

## Authentication
API requests require a bearer JWT. Middleware validates the token and binds the request to the authenticated user; routes reject mismatched user IDs. Test coverage ensures users cannot read another user's data.

## Logging
`pino` logs structured events such as errors, LLM requests, and file exports. Secrets like authorization headers and passwords are redacted. View logs with:
```bash
npm run prod:logs --workspace=backend
```

## Backups
Database backups are taken with `scripts/backup_db.sh` which keeps daily dumps for seven days.
Example cron job:
```
0 2 * * * /path/to/repo/scripts/backup_db.sh >> /var/log/backup.log 2>&1
```

## CI/CD
GitHub Actions run on each push and pull request to `main`:
- `npm run build`
- `npm run lint`
- `npm test`
- Secret scanning via gitleaks
- Dependency audit via `npm audit`
Protect the `main` branch to require a green CI run before merging.
