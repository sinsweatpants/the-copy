# Builder stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY backend/package*.json backend/
RUN cd backend && npm ci --omit=dev
COPY frontend/package*.json frontend/
RUN cd frontend && npm ci --omit=dev
COPY . .
RUN cd frontend && npm run build
RUN cd backend && npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/frontend/dist frontend/dist
COPY backend/package*.json backend/
RUN cd backend && npm ci --omit=dev
RUN addgroup -S app && adduser -S app -G app
USER app
EXPOSE 4000
CMD ["node", "backend/dist/server.js"]
