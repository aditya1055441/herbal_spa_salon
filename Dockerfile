# ==============================================================================
# Aura Botanica - Pure Herbal Salon & Spa
# Production Multi-Stage Dockerfile for Render (render.com) Web Service
# ==============================================================================

# Stage 1: Build Angular Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build -- --configuration=production

# Stage 2: Prepare Node.js Backend & Static SPA Server
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist/frontend/browser /app/frontend/dist/frontend/browser

# Render exposes the web service via the port defined in $PORT (default 10000)
EXPOSE 10000

CMD ["node", "backend/server.js"]
