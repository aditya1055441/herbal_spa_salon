# ==============================================================================
# Aura Botanica - Pure Herbal Salon & Spa
# Production Multi-Stage Dockerfile for Google Cloud Platform (Cloud Run) & AWS (App Runner)
# ==============================================================================

# Stage 1: Build Angular Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build -- --configuration=production

# Stage 2: Prepare Node.js Backend & API Gateway
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist/frontend/browser /app/frontend/dist/frontend/browser

EXPOSE 8080

CMD ["node", "backend/server.js"]
