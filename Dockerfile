# =============================================================================
# Dockerfile — پلتفرم دعوتنامه دیجیتال «ایوان» (Multi-Stage Build)
# پشتیبانی از محیط Development و Production (Ubuntu 24.04 / Node 22 LTS)
# =============================================================================

# --- Stage 1: Base & Dependencies ---
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat curl tzdata
ENV TZ=Asia/Tehran

COPY package.json package-lock.json* ./
RUN npm install

# --- Stage 2: Development Target ---
FROM base AS development
ENV NODE_ENV=development
ENV PORT=3000
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# --- Stage 3: Builder (Frontend Vite Build) ---
FROM base AS builder
COPY . .
RUN npm run build

# --- Stage 4: Production Runner ---
FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache curl tzdata && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 eyvan
ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=Asia/Tehran

COPY --from=base /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src ./src

RUN mkdir -p /app/uploads && chown -R eyvan:nodejs /app
USER eyvan

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

CMD ["npx", "tsx", "server.ts"]
