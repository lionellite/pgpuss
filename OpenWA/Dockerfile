# OpenWA - Dockerfile
# Multi-stage build for production-ready image

# ===== Stage 1: Builder =====
FROM node:22-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ===== Stage 2: Production =====
FROM node:22-slim AS production

# Install required dependencies for Puppeteer's Chromium
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Create app user for security
RUN groupadd -r openwa && useradd -r -g openwa openwa

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev && npm cache clean --force

# Patch whatsapp-web.js : canCheckStatusRankingPosterGating n'est plus une fonction
# dans les versions récentes de WhatsApp Web. L'optional chaining évite le crash.
RUN node -e "\
const fs = require('fs');\
const file = '/app/node_modules/whatsapp-web.js/src/util/Injected/Utils.js';\
if (fs.existsSync(file)) {\
  const c = fs.readFileSync(file, 'utf8');\
  const p = c.replace(/\.canCheckStatusRankingPosterGating\(\)/g, '?.canCheckStatusRankingPosterGating?.()');\
  fs.writeFileSync(file, p);\
  console.log('✓ whatsapp-web.js patched');\
} else { console.log('File not found, skipping patch'); }\
"

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create data directories with proper permissions
RUN mkdir -p ./data/sessions ./data/media && \
    chown -R openwa:openwa /app

# Note: Running as root to allow Docker socket access for orchestration
# For production with stricter security, consider using a Docker socket proxy
# USER openwa

# Expose port
EXPOSE 2785

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:2785/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start with dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
