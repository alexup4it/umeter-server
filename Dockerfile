# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --no-audit --no-fund

# ============================================
# Stage 2: Build Next.js standalone app
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy URL so Prisma generate and Next.js build don't require a real DB
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

# Generate Prisma Client and build Next.js
RUN npx prisma generate && npm run build

# Extract only prisma CLI and its transitive dependencies from the lockfile.
# lockfile-subset resolves the full dependency tree automatically — no need
# to track individual packages like pathe, valibot, etc. by hand.
RUN npx lockfile-subset prisma -o /prisma-deps --install

# ============================================
# Stage 3: Production runner
# ============================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone Next.js output
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Copy Prisma CLI + all transitive dependencies (extracted via lockfile-subset)
COPY --from=builder --chown=node:node /prisma-deps/node_modules ./node_modules

# Copy Prisma schema + migrations (needed for `prisma migrate deploy`)
COPY --from=builder --chown=node:node /app/prisma ./prisma

# Create firmware directory owned by node so the named volume inherits
# correct permissions on first mount
RUN mkdir -p /app/firmware && chown node:node /app/firmware

# Entrypoint: migrate then start
COPY --chown=node:node entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

USER node

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
