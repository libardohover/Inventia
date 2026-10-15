# --- Etapa 1: compilar frontend y servidor ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Etapa 2: imagen de producción ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0 DATA_DIR=/app/data
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
RUN mkdir -p /app/data && chown node:node /app/data
VOLUME ["/app/data"]
EXPOSE 3000
USER node
CMD ["node", "dist/server.cjs"]
