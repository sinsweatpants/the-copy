# Builder stage
FROM node:18-alpine AS build
WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Install backend dependencies and build
COPY backend/package*.json backend/
COPY backend/tsconfig.json backend/
RUN cd backend && npm ci --omit=dev
COPY backend backend
RUN cd backend && npm run build

# Install frontend dependencies and build
COPY frontend/package.json frontend/
COPY frontend/tsconfig.json frontend/
COPY frontend/vite.config.ts frontend/
COPY frontend/tailwind.config.js frontend/
COPY frontend/postcss.config.js frontend/
COPY frontend/index.html frontend/
COPY frontend/src frontend/src
RUN cd frontend && npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy built backend and dependencies
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/backend/node_modules backend/node_modules
COPY --from=build /app/backend/package.json backend/

# Copy built frontend
COPY --from=build /app/frontend/dist frontend/dist

# Create a non-root user
RUN addgroup -S app && adduser -S app -G app
# chown the app directory
RUN chown -R app:app /app
USER app

EXPOSE 4000
CMD ["node", "backend/dist/server.js"]