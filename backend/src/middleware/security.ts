import helmet from "helmet";

import { env } from "../config/validator.js";

const frontendOrigins = env.FRONTEND_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const externalApiBase = env.EXTERNAL_API_BASE ?? process.env.VITE_API_BASE;

const apiOrigins: string[] = [];
if (externalApiBase) {
  try {
    apiOrigins.push(new URL(externalApiBase).origin);
  } catch {
    apiOrigins.push(externalApiBase);
  }
}

const connectSrc = ["'self'", ...frontendOrigins, ...apiOrigins];

export default helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc,
      fontSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
    },
  },
  referrerPolicy: { policy: "no-referrer" },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts:
    process.env.NODE_ENV === "production"
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
      : undefined,
  noSniff: true,
  crossOriginResourcePolicy: { policy: "same-origin" },
});
