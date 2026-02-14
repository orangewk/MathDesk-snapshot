# Multi-stage build for MathDesk

# ------------------------------
# Stage 1: Build Frontend (Vite)
# ------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/webapp

# Firebase config (Vite inlines VITE_* env vars at build time)
# Pass via: --build-arg VITE_FIREBASE_API_KEY=... or cloudbuild.yaml
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID

# Install dependencies (including devDependencies for build)
COPY webapp/package*.json ./
RUN npm install

# Build webapp
COPY webapp ./
RUN npm run build

# ------------------------------
# Stage 2: Build Backend (TypeScript)
# ------------------------------
FROM node:20-alpine AS backend-builder
WORKDIR /app/prototype

# Install dependencies (including devDependencies for build)
COPY prototype/package*.json ./
RUN npm install

# Build prototype
COPY prototype ./
RUN npm run build

# ------------------------------
# Stage 3: Runtime
# ------------------------------
FROM node:20-alpine
WORKDIR /app

# Install production dependencies only
COPY prototype/package*.json ./prototype/
WORKDIR /app/prototype
RUN npm install --omit=dev

# Copy built artifacts
WORKDIR /app
COPY --from=backend-builder /app/prototype/dist ./prototype/dist
COPY --from=frontend-builder /app/webapp/dist ./public

# Environment setup
ENV NODE_ENV=production
ENV PORT=8080
ENV PUBLIC_DIR=/app/public

# Expose port
EXPOSE 8080

# Start server
WORKDIR /app/prototype
CMD ["node", "dist/server.js"]
