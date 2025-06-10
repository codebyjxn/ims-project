# Multi-stage Dockerfile for development and production

# Development stage
FROM node:18-alpine AS development

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 4000

# Start the application in development mode with hot reloading
CMD ["npm", "run", "dev"]

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies first (needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Clean up dev dependencies after build
RUN npm prune --omit=dev

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 4000

# Start the application
CMD ["npm", "start"] 