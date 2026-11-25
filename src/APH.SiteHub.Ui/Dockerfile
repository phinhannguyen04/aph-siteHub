FROM node:24-alpine AS build
WORKDIR /app
COPY src/APH.SiteHub.Ui/package.json src/APH.SiteHub.Ui/package-lock.json ./
RUN npm ci
COPY src/APH.SiteHub.Ui ./
RUN npm run build

# Static single-page app. nginx also proxies /api and /health to the backend service (see nginx.conf).
FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY src/APH.SiteHub.Ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
