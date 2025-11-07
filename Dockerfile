# Multi-stage Dockerfile for optimized production build

# Use Node 22 from a direct registry to avoid proxy issues  
FROM node:22-alpine AS base
RUN apk add --no-cache openssl ca-certificates

# Stage 1: Dependencies
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Configure npm and install production dependencies
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set strict-ssl false && \
    npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Stage 2: Builder  
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev)
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set strict-ssl false && \
    npm ci --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate && \
    npm run build

# Stage 3: Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apiuser

# Copy built application and dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Set ownership
RUN chown -R apiuser:nodejs /app
USER apiuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/server.js"]