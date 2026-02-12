# Agentropic - Bolt.new Container
#
# STARTER DOCKERFILE - This will need refinement once we test the actual project.
# Bolt.new is a Node.js/TypeScript app by StackBlitz. We clone it, install deps,
# build, and run it behind nginx with supervisor managing both processes.

FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    wget \
    supervisor \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1001 appuser && \
    useradd --uid 1001 --gid 1001 --create-home --shell /bin/bash appuser

# Create directories
RUN mkdir -p /app /var/log/supervisor /etc/supervisor/conf.d && \
    chown -R appuser:appuser /app

WORKDIR /app

# Clone Bolt.new
# TODO: Pin to a specific release tag for stability
RUN git clone --depth 1 https://github.com/stackblitz/bolt.new.git /app/bolt-new

WORKDIR /app/bolt-new

# Install Node.js dependencies
RUN npm install --legacy-peer-deps

# Build the application
RUN npm run build 2>/dev/null || \
    echo "WARN: Build may have failed -- needs refinement"

# Supervisor config
COPY <<'EOF' /etc/supervisor/supervisord.conf
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid
user=root

[program:bolt-new]
command=npm start
directory=/app/bolt-new
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/bolt-new.log
stderr_logfile=/var/log/supervisor/bolt-new-error.log
user=appuser
environment=PORT=3000

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
EOF

# Nginx config
COPY <<'EOF' /etc/nginx/conf.d/bolt-new.conf
server {
    listen 8080;

    location /healthz {
        access_log off;
        return 200 'ok';
        add_header Content-Type text/plain;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
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
RUN chown -R appuser:appuser /app/bolt-new

EXPOSE 8080

CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
