import fs from 'fs';

/**
 * Retrieve secret value from environment or Docker secret file.
 * Throws if the key is missing.
 */
export function getEnv(key: string): string {
  const envVal = process.env[key];
  if (envVal) return envVal;
  const secretPath = `/run/secrets/${key}`;
  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, 'utf8').trim();
  }
  throw new Error(`Missing required secret: ${key}`);
}
