# Security Policy

- Rotate API keys and credentials regularly.
- Use GitHub Actions Secrets to store CI secrets.
- For containerized deployments, mount secrets at `/run/secrets/<KEY>` and read via `getEnv` helper.
- Do not commit `.env` files or binary artifacts; use `scripts/purge-secrets-history.sh` to scrub history if leaks occur.
