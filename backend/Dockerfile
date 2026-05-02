# Backend Dockerfile
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Create data directory for SQLite volume
RUN mkdir -p /app/data

# Expose port
EXPOSE 5000

# Run schema push and start server
# Using -e to ensure environment variables are passed correctly
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]

# For development, use:
# CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
