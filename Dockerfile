# Use a specific Node.js version for reproducibility
FROM node:18.18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy root package files first to leverage Docker cache
COPY package*.json ./

# Install root dependencies
# Using `npm install` instead of `ci` if only package.json is present
RUN npm install --only=production

# Copy backend package files and install dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy frontend package files and install dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --only=production

# Copy the rest of the source code
COPY . .

# Build the frontend application
RUN cd frontend && npm run build

# Build the backend application
RUN cd backend && npm run build

# Expose the port the backend runs on
EXPOSE 4000

# Command to run the application in production
# This assumes a "start:prod" script exists in the root package.json
CMD ["npm", "run", "start:prod"]
