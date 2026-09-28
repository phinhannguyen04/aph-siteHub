FROM oven/bun:1.4.2 AS build
WORKDIR /app
COPY package.json bun.lock ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY patches patches
RUN bun install --frozen-lockfile
COPY backend backend
RUN bun --cwd backend build

FROM oven/bun:1.4.2
WORKDIR /app
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/migrations ./backend/migrations
USER bun
EXPOSE 3000
CMD ["bun", "backend/dist/main.js"]
