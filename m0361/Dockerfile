# Multi-stage Dockerfile — enterprise optimized
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production=false || npm install

FROM base AS build
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/package.json /app/package-lock.json* ./
RUN npm ci --only=production || npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
COPY --from=build /app/index.html ./index.html
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -qO- http://localhost:5000/api/health || exit 1
CMD ["node", "server/server.js"]
