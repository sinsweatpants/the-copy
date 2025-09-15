# ===== Builder =====
FROM node:20-alpine AS builder
WORKDIR /app

# Root deps (Workspaces respected if present)
COPY package*.json ./
RUN npm ci

# Backend build
COPY backend/package*.json backend/
COPY backend/tsconfig.json backend/
RUN cd backend && npm ci
COPY backend backend
RUN cd backend && npm run build

# Frontend build
COPY frontend/package*.json frontend/
COPY frontend/tsconfig.json frontend/
COPY frontend/vite.config.ts frontend/
COPY frontend/tailwind.config.js frontend/
COPY frontend/postcss.config.js frontend/
COPY frontend/index.html frontend/
COPY frontend/src frontend/src
RUN cd frontend && npm ci && npm run build

# ===== Runtime =====
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Backend: production deps only
COPY backend/package*.json backend/
RUN cd backend && npm ci --omit=dev

# Copy build outputs
COPY --from=builder /app/backend/dist backend/dist
COPY --from=builder /app/frontend/dist frontend/dist

# Non-root user
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 4000
CMD ["node", "backend/dist/server.js"]
