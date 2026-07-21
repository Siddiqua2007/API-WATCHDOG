# --- Stage 1: install dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Stage 2: final runtime image ---
FROM node:20-alpine AS runner
WORKDIR /app

# Run as a non-root user — a basic container security practice worth
# knowing/mentioning even for a student project.
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY . .

USER nodejs

EXPOSE 3000

CMD ["node", "server.js"]
