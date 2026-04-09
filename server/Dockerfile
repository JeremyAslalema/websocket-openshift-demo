# Multi-stage build para optimizar tamaño
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm ci --only=production && \
    npm cache clean --force

# Instalar TypeScript globalmente para compilar
RUN npm install -g typescript

# Copiar código fuente
COPY src ./src

# Compilar TypeScript
RUN tsc

# Stage final
FROM node:20-alpine

# Instalar dumb-init para manejo de señales
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copiar dependencias compiladas
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Variables de entorno
ENV NODE_ENV=production \
    PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

EXPOSE 8080

# Usar dumb-init como entrypoint
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]