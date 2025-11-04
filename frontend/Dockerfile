# syntax=docker/dockerfile:1

# Build stage
FROM node:22-bookworm-slim AS build
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage
FROM node:22-bookworm-slim AS runner
WORKDIR /app

# Install a lightweight static file server
RUN npm install -g serve \
    && npm cache clean --force

COPY --from=build /app/dist ./dist

ENV HOST=0.0.0.0
ENV PORT=4173
EXPOSE 4173

CMD ["sh", "-c", "serve -s dist -l ${PORT:-4173}"]
