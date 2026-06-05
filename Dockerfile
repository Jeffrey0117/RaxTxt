FROM node:22-alpine AS builder

WORKDIR /app

# better-sqlite3 needs build tools for native compilation
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Final stage (no build tools, smaller image) ──
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY server.js ./
COPY src/ ./src/
COPY public/ ./public/

RUN mkdir -p data

EXPOSE 4015

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4015/api/health || exit 1

CMD ["node", "server.js"]
