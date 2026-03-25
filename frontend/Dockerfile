# ============================================
# Frontend Dockerfile - Build + Nginx
# ============================================

# ── Build stage ───────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments
ARG VITE_API_URL=/api/v1
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Install dependencies
COPY package.json bun.lockb ./
RUN npm install -g bun && bun install

# Copy source and build
COPY . .
RUN echo "Building with VITE_API_URL=$VITE_API_URL" && bun run build

# ── Production stage (Nginx) ─────────────────
FROM nginx:alpine

# Qual nginx.conf usar (dev=nginx.conf, prod=nginx.prod.conf)
ARG NGINX_CONF=nginx.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf

# Para prod: certbot challenge dir
RUN mkdir -p /var/www/certbot

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
