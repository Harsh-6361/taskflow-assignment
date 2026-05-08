# Backend Dockerfile
FROM node:20-alpine AS builder

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .

# Pass build args if needed during this combined build
ARG VITE_API_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID

RUN npm run build

# Backend build
FROM node:20-alpine

# Install nginx
RUN apk add --no-cache nginx

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY backend/ .

# Build the application
RUN npm run build

# Copy frontend build
COPY --from=builder /app/frontend/dist /app/public

# Expose ports
EXPOSE 5000 80

# Run nginx to serve frontend + proxy to backend
COPY backend/nginx.railway.conf /etc/nginx/nginx.conf

# Start nginx and the app
CMD ["sh", "-c", "nginx -g 'daemon off;' & node dist/index.js"]