FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Le standalone peut être dans un sous-dossier, on copie tout
COPY --from=builder /app/.next/standalone/ ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Trouver et déplacer server.js au bon endroit si dans un sous-dossier
RUN if [ ! -f server.js ] && [ -d planning-app ]; then \
      cp -r planning-app/* . && rm -rf planning-app; \
    fi && \
    if [ ! -f server.js ] && [ -d planning-tmp ]; then \
      cp -r planning-tmp/* . && rm -rf planning-tmp; \
    fi

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
