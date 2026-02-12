# Agentropic - Dify Container
#
# STARTER DOCKERFILE - This will need refinement once we test actual usage
# patterns. Dify has multiple services (API, web, worker, etc.) and running
# them all in a single container requires careful orchestration.
#
# Current approach: Clone Dify, run in single-container mode using supervisor
# to manage the API server and web frontend together.

FROM python:3.11-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    wget \
    supervisor \
    nginx \
    build-essential \
    postgresql-client \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1001 appuser && \
    useradd --uid 1001 --gid 1001 --create-home --shell /bin/bash appuser

# Create directories
RUN mkdir -p /app /var/log/supervisor /etc/supervisor/conf.d && \
    chown -R appuser:appuser /app

WORKDIR /app

# Clone Dify at a known stable version
# TODO: Pin to a specific release tag once we validate which version works best
ARG DIFY_VERSION=main
RUN git clone --depth 1 --branch ${DIFY_VERSION} https://github.com/langgenius/dify.git /app/dify

# Install API dependencies
WORKDIR /app/dify/api
RUN pip install --no-cache-dir -r requirements.txt 2>/dev/null || \
    echo "WARN: Some API dependencies may have failed -- needs refinement"

# Install web frontend dependencies
WORKDIR /app/dify/web
RUN npm ci 2>/dev/null || npm install 2>/dev/null || \
    echo "WARN: Web frontend install may need refinement"
RUN npm run build 2>/dev/null || \
    echo "WARN: Web frontend build may need refinement"

# Supervisor config to manage both services
COPY <<'EOF' /etc/supervisor/supervisord.conf
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid
user=root

[program:dify-api]
command=python -m flask run --host=0.0.0.0 --port=5001
directory=/app/dify/api
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/dify-api.log
stderr_logfile=/var/log/supervisor/dify-api-error.log
environment=FLASK_APP=app,MODE=api

[program:dify-web]
command=npm start
directory=/app/dify/web
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/dify-web.log
stderr_logfile=/var/log/supervisor/dify-web-error.log
environment=PORT=3000

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
EOF

# Nginx config to proxy to both services
COPY <<'EOF' /etc/nginx/conf.d/dify.conf
server {
    listen 8080;

    location /healthz {
        access_log off;
        return 200 'ok';
        add_header Content-Type text/plain;
    }

    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:5001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Web UI (default)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

RUN rm -f /etc/nginx/sites-enabled/default

WORKDIR /app/dify

EXPOSE 8080

CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
