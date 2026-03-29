# Stage 1: Build Angular frontend
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration=production

# Stage 2: Serve with Node.js (Express)
FROM node:24-alpine
WORKDIR /app
RUN npm init -y && npm install express http-proxy-middleware
COPY --from=build /app/dist/frontend/browser ./public
COPY serve.js .
EXPOSE 3000
CMD ["node", "serve.js"]
