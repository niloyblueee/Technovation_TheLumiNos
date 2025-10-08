# Scaling guide

This document summarizes how to evolve the current stack (Vite + React SPA, Node/Express, MySQL) from 10k to 10M users.

Assumptions
- Traffic distribution: read-heavy on feeds/lists, write spikes on issue submissions during incidents.
- Stateless backend (JWT), MySQL primary for OLTP, minimal AI usage.

1) Tech stack fit
- Frontend: React + Vite is fine. Use prefetching, code-splitting, image/CDN. Host via CDN (Cloudflare/Netlify/Vercel static).
- Backend: Node + Express is fine. Keep handlers stateless, prefer pooled MySQL, add caching for hot reads.
- DB: MySQL ok for OLTP. Use proper indexing, connection pool sizing, and background jobs for heavy tasks.
- File uploads: move to object storage (S3/GCS/Cloudflare R2) with signed URLs. Avoid storing large photo blobs in DB columns.
- AI: optional, call asynchronously and cache results.

2) Immediate fixes
- Add DB indexes (see migrations/indexes_001.sql).
- Change issues.photo to VARCHAR(2048) (URL) and store images in object storage. Add createdAt, updatedAt timestamps.
- Add pagination to GET /api/issues, optional geo filtering.
- Rate limit sensitive endpoints (auth/login, submission) and add input limits.
- Enable HTTP compression and security headers.

3) Scale by user tiers

Tier A: up to ~10k monthly active
- 1 small VM (2 vCPU/4GB) or PaaS dyno for API, 1 shared MySQL instance, object storage for images, a CDN for SPA.
- Pool: 10–20 MySQL connections. Add basic logs + metrics.
- Backups + slow query log, fix N+1 and missing indexes.

Tier B: ~100k MAU (~10–50 rps peak)
- Horizontal API scaling: 2–3 instances behind a load balancer.
- Dedicated MySQL (db.t3.medium+) with read replica for analytics/leaderboard.
- Redis for cache (top issues, metadata), and for rate limiting.
- Queue (BullMQ/SQS) for async tasks: image virus scan, AI validation, thumbnailing, notification fan-out.
- Introduce cursor-based pagination; avoid SELECT *.

Tier C: ~1M MAU (~100–300 rps peak)
- Split read traffic: primary for writes, 1–3 replicas for reads.
- Shard hot tables if needed (by region). Add partitioning on issues by createdAt or region.
- Add fulltext index on issues.description if text search needed (or use OpenSearch/Meilisearch).
- Separate services: auth, issues, events. Adopt structured logging, tracing (OpenTelemetry).
- WAF/Bot protection, robust abuse/rate limits.

Tier D: ~10M MAU (1k–5k rps peak)
- API autoscaling with HPA; containerize (Docker + K8s) or FaaS for spikes.
- Global CDN for static + images; edge cache JSON for public endpoints.
- Database: MySQL cluster with proxy layer (ProxySQL/RDS Proxy). Consider region-based sharding.
- Heavy reads go via cache/search systems; analytical workloads off OLTP (data lake or BigQuery/Snowflake).
- Idempotent writes, backpressure, circuit breakers. DR strategy (multi-AZ/region).

4) Data model and indexes
- users: indexes on (email), (phone_number), (role,status), (createdAt). Keep reward_point with index if used for sorting.
- issues: add (createdAt, status), (status, createdAt), (assigned_department), optional spatial index if using POINT.
- events: index (date,time), (createdAt).
- Consider POINT type for coordinates and SPATIAL index for geo queries. Otherwise store decimal lat/lon.

5) API improvements
- Add pagination: /api/issues?limit=50&cursor=... and department/status filters.
- Use 429 with global + per-IP rate limit. Store per-user quotas for rewards to avoid gaming.
- Validate payload sizes; limit photos to 5–10MB and move to S3 pre-signed upload.

6) Observability & ops
- Add pino/winston JSON logs, request IDs, and correlating DB slow logs.
- Metrics: Prometheus or managed APM (Datadog/New Relic). Dashboards for RPS, p95 latency, 5xx, DB usage, queue depth.
- Health checks include DB ping and dependency checks.

7) Security
- Rotate JWT secrets; prefer asymmetric JWT (RS256) for multi-service.
- Helmet headers, CORS allowlist, cookie flags if used.
- Validate uploads (MIME, AV scan). Store PII encrypted at rest. Use parameterized SQL (already in use).

8) Deployment sketch
- Dockerize backend, use envs for config. Use Fly.io, Render, Railway, or AWS ECS/Fargate.
- MySQL managed (RDS/PlanetScale/Railway). Redis managed (Upstash/ElastiCache).
- CI/CD with lint/tests; migrations via a tool (Prisma/Migrate or knex + scripts).

Appendix: capacity rough cuts
- A single Node instance can handle ~500–1000 lightweight rps with pooling if DB is fast. DB typically is the bottleneck; cache + replicas push beyond.
- Image traffic dominates bandwidth; push it to CDN early.
