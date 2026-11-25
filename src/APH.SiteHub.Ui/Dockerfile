FROM oven/bun:1.4.2 AS build
WORKDIR /app
COPY src/APH.SiteHub.Ui/package.json src/APH.SiteHub.Ui/bun.lock ./
RUN bun install --frozen-lockfile
COPY src/APH.SiteHub.Ui ./
RUN bun run build

# Static single-page app. nginx also proxies /api and /health to the backend service (see nginx.conf).
FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY src/APH.SiteHub.Ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
