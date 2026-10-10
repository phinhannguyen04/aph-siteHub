FROM oven/bun:1.4.2 AS build
WORKDIR /app
COPY package.json bun.lock ./
COPY frontend/package.json frontend/package.json
RUN bun install --frozen-lockfile
COPY frontend frontend
COPY shared shared
RUN bun --cwd frontend build

FROM nginx:1.27-alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
