FROM node:22.14.0-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22.14.0-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public && npx prisma generate && npm run build

FROM node:22.14.0-bookworm-slim AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=file:/data/fintrack.db
WORKDIR /app
RUN groupadd --system --gid 1001 fintrack && useradd --system --uid 1001 --gid fintrack --home-dir /app fintrack \
    && mkdir -p /data && chown fintrack:fintrack /data
COPY --from=builder --chown=fintrack:fintrack /app/.next/standalone ./
COPY --from=builder --chown=fintrack:fintrack /app/.next/static ./.next/static
COPY --from=builder --chown=fintrack:fintrack /app/public ./public
COPY --from=builder --chown=fintrack:fintrack /app/prisma ./prisma
COPY --from=builder --chown=fintrack:fintrack /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=fintrack:fintrack /app/node_modules/@prisma ./node_modules/@prisma
COPY --chown=fintrack:fintrack docker-entrypoint.cjs ./
USER fintrack
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "docker-entrypoint.cjs"]
