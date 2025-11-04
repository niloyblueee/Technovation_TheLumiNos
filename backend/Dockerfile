# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

# Install backend dependencies with the minimal toolchain required for native modules
# Copy manifests first to leverage Docker layer caching
COPY backend/package.json ./
COPY backend/package-lock.json ./
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 build-essential \
    # Prefer reproducible installs when lockfile is present; fall back otherwise
    && if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
    && npm cache clean --force \
    && apt-get purge -y --auto-remove python3 build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy only backend application source (works even if build context is repo root)
COPY backend/ .

# Railway injects PORT; default to 5000 for local usage
EXPOSE 5000

CMD ["npm", "start"]
