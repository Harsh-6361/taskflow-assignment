# Backend Dockerfile
FROM node:20-alpine AS builder

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Backend build
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl nginx

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy application code
COPY backend/ .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Copy frontend build
COPY --from=builder /app/frontend/dist /app/public

# Create data directory for SQLite volume
RUN mkdir -p /app/data

# Expose ports
EXPOSE 5000 80

# Run nginx to serve frontend + proxy to backend
COPY backend/nginx.railway.conf /etc/nginx/nginx.conf

# Run schema push and start nginx
CMD ["sh", "-c", "npx prisma db push && nginx -g 'daemon off;' & node dist/index.js"]