# ---------- Runtime stage ----------
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

ENV NODE_ENV=development
ENV DATABASE_PATH=threat_intel.db
ENV LOG_LEVEL=debug

RUN node src/threat-intel/seed-database.js

EXPOSE 8080

CMD ["npm", "run", "start:dev"]