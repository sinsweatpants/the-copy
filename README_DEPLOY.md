# Deployment Without Docker

## Environment Variables
Set the following variables in `backend/.env`:

- `DATABASE_URL=postgres://user:password@localhost:5432/arabic_screenplay`
- `JWT_SECRET` and `REFRESH_TOKEN_SECRET`
- `GEMINI_API_KEY`
- `REDIS_URL`
- `FRONTEND_ORIGIN`
- `RATE_LIMIT_PER_MIN` and `HEAVY_LIMIT`

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
