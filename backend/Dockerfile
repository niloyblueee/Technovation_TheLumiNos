# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

# Install backend dependencies with the minimal toolchain required for native modules
COPY package*.json ./
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 build-essential \
    && npm ci --omit=dev \
    && npm cache clean --force \
    && apt-get purge -y --auto-remove python3 build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy application source
COPY . .

# Railway injects PORT; default to 5000 for local usage
EXPOSE 5000

CMD ["npm", "start"]
