# Agentropic - OpenClaw Container
#
# STARTER DOCKERFILE - This will need refinement once we test the actual project.
# OpenClaw is a Python-based agent framework. We clone it, install deps,
# and run it behind nginx with supervisor managing both processes.

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    wget \
    supervisor \
    nginx \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1001 appuser && \
    useradd --uid 1001 --gid 1001 --create-home --shell /bin/bash appuser

# Create directories
RUN mkdir -p /app /var/log/supervisor /etc/supervisor/conf.d && \
    chown -R appuser:appuser /app

WORKDIR /app

# Clone OpenClaw
# TODO: Pin to a specific release tag for stability
RUN git clone --depth 1 https://github.com/openclaw/openclaw.git /app/openclaw

WORKDIR /app/openclaw

# Install Python dependencies
# Fallback chain: try requirements.txt first, then editable install
RUN pip install --no-cache-dir -r requirements.txt 2>/dev/null || \
    pip install --no-cache-dir -e . 2>/dev/null || \
    echo "WARN: Some dependencies may have failed -- needs refinement"

# Supervisor config
COPY <<'EOF' /etc/supervisor/supervisord.conf
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid
user=root

[program:openclaw]
command=python -m uvicorn main:app --host 0.0.0.0 --port 8000
directory=/app/openclaw
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/openclaw.log
stderr_logfile=/var/log/supervisor/openclaw-error.log
user=appuser

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
EOF

# Nginx config
COPY <<'EOF' /etc/nginx/conf.d/openclaw.conf
server {
    listen 8080;

    location /healthz {
        access_log off;
        return 200 'ok';
        add_header Content-Type text/plain;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

RUN rm -f /etc/nginx/sites-enabled/default

# Ensure app directory is writable by appuser
RUN chown -R appuser:appuser /app/openclaw

EXPOSE 8080

CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
