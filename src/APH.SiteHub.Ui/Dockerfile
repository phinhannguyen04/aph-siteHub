FROM oven/bun:1.4.2 AS build
WORKDIR /app
COPY src/APH.SiteHub.Ui/package.json src/APH.SiteHub.Ui/bun.lock ./
RUN bun install --frozen-lockfile
COPY src/APH.SiteHub.Ui ./
# Next.js rewrites are fixed at build time: this is where /api and /health are proxied.
ARG SITEHUB_DEV_API_TARGET=http://backend:3000
ENV SITEHUB_DEV_API_TARGET=$SITEHUB_DEV_API_TARGET \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
RUN bun run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
