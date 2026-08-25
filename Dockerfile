FROM oven/bun:1 AS base
WORKDIR /app

# Install backend dependencies
COPY backend/package.json backend/bun.lock* ./
RUN bun install --frozen-lockfile

# Copy backend source
COPY backend/tsconfig.json ./
COPY backend/src ./src

# Build
RUN bun run build

# Production stage
FROM oven/bun:1-slim AS production
WORKDIR /app

COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

CMD ["bun", "dist/main.js"]
