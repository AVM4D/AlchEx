FROM node:20-alpine AS builder

WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --ignore-optional

COPY backend ./backend
RUN cd backend && npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S alchex -u 1001

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./package.json

USER alchex

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

CMD ["node", "dist/server.js"]
