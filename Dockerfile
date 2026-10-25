# syntax=docker/dockerfile:1
FROM node:24.21.0-bookworm-slim AS frontend-build
WORKDIR /build/frontend
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
COPY assets ./assets
COPY public ./public
RUN npm run build

FROM python:3.12.7-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PGDATA=/var/lib/postgresql/data/pgdata PORT=8080
RUN apt-get update && apt-get install -y --no-install-recommends postgresql postgresql-client tini && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY THIRD_PARTY_NOTICES ./THIRD_PARTY_NOTICES
COPY kapibank-backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY kapibank-backend/app ./app
COPY kapibank-backend/alembic ./alembic
COPY kapibank-backend/alembic.ini ./alembic.ini
COPY kapibank-backend/entrypoint.sh ./entrypoint.sh
COPY --from=frontend-build /build/frontend/dist ./frontend-dist
RUN chmod +x /app/entrypoint.sh
VOLUME ["/var/lib/postgresql/data"]
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=40s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/health',timeout=2)"
ENTRYPOINT ["/usr/bin/tini", "--", "/app/entrypoint.sh"]
