# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy rest of the source
COPY . .

# They already bind to 0.0.0.0 in index.js and read PORT from env
EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "index.js"]
