# Etapa de build
FROM node:22-slim AS builder

WORKDIR /app

# Instala OpenSSL si usás Prisma y FFmpeg para procesamiento de video
RUN apt-get update -y && apt-get install -y openssl ffmpeg && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Etapa de producción
FROM node:22-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ffmpeg && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
