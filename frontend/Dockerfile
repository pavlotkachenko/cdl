# Stage 1: Build Angular frontend
# NOTE: Build context is the REPO ROOT (Railway dockerfilePath = frontend/Dockerfile)
FROM node:24-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npx ng build --configuration=production

# Stage 2: Serve with Caddy
FROM caddy:2-alpine
COPY frontend/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist/frontend/browser /srv
EXPOSE 80
