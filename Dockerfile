# Stage 1: Build Angular frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npx ng build --configuration=production

# Stage 2: Production backend
FROM node:22-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && apk del python3 make g++
COPY backend/src ./src
# Copy Angular build output into backend's public directory
COPY --from=frontend-build /app/frontend/dist/frontend/browser ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/server.js"]
