# Deployment Without Docker

## Environment Variables
Set the following variables in `backend/.env`:

- `DATABASE_URL=postgres://user:password@localhost:5432/arabic_screenplay`
- `JWT_SECRET` and `REFRESH_TOKEN_SECRET`
- `GEMINI_API_KEY`
- `REDIS_URL` 
- `REDIS_ENABLED` (set to 'true' to enable Redis, 'false' to disable)
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
GitHub Actions run on every push or pull request to `main` and any `feature/*` branch. The workflow defines four jobs:

- **build-backend** – install, lint, build, and test the backend
- **build-frontend** – install, lint, build, and test the frontend
- **audit** – run `npm audit --omit=dev` to check dependencies
- **secret-scan** – scan the repository for secrets using TruffleHog

The secret scan excludes test fixtures via `.trufflehogignore` and uses dummy secrets.

The audit job fails the build on any high or critical vulnerabilities; run `npm audit --omit=dev` locally before pushing.

The `main` branch is protected and can only be merged via a pull request that passes all CI jobs and has at least one approved review.

## Redis Configuration

Redis is optional and used for PDF export queue processing. To enable Redis:

1. Install and start Redis server:
   ```bash
   # Ubuntu/Debian
   sudo apt install redis-server
   sudo systemctl start redis-server
   
   # macOS
   brew install redis
   brew services start redis
   ```

2. Set environment variables:
   ```bash
   REDIS_ENABLED=true
   REDIS_URL=redis://localhost:6379
   ```

3. Restart the application to apply changes.

**Security Note**: In production, configure Redis with:
- Password authentication (`requirepass` in redis.conf)
- Bind to specific interfaces (avoid 0.0.0.0)
- Enable SSL/TLS if connecting remotely
- Consider using Redis ACLs for fine-grained access control

If Redis is disabled (`REDIS_ENABLED=false`), PDF export functionality will be unavailable, but the application will run normally.

## Production Monitoring

### PM2 Process Management
Use PM2 for production deployment with auto-restart and monitoring:

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Monitor processes  
pm2 status
pm2 logs

# Restart applications
pm2 restart ara-screenplay-api
pm2 restart ara-screenplay-frontend

# Stop all processes
pm2 stop all
```

### Health Checks
The application includes a health check endpoint:

```bash
curl http://localhost:4000/api/health
```

Response includes:
- Database connection status  
- Redis connection status
- Server uptime
- Memory usage
- Timestamp

### Monitoring Setup
- **Logs**: Structured JSON logs via Pino with request/response details
- **Error Tracking**: HTTP errors logged with full context
- **Security**: Authorization headers and passwords automatically redacted
- **Performance**: Request duration and status codes tracked

For production monitoring, consider integrating with:
- **APM**: New Relic, DataDog, or similar
- **Log Management**: ELK Stack, Splunk, or cloud logging
- **Uptime Monitoring**: Pingdom, UptimeRobot
- **Error Tracking**: Sentry, Bugsnag
