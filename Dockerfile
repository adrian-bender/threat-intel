# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (better caching)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build NestJS app
RUN npm run build


# ---------- Runtime stage ----------
FROM node:20-alpine

WORKDIR /app

# Copy only what we need
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# NestJS default port
EXPOSE 3000

CMD ["node", "dist/main.js"]
