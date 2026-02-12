# Agentropic - GPT Researcher Container
#
# Runs GPT Researcher with Anthropic models via the LiteLLM proxy.
# The LiteLLM proxy URL and key are injected at runtime via environment
# variables, so this container never holds real API keys in the image.

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

# Clone GPT Researcher
# TODO: Pin to a specific release tag for stability
RUN git clone --depth 1 https://github.com/assafelovic/gpt-researcher.git /app/gpt-researcher

WORKDIR /app/gpt-researcher

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install the package itself
RUN pip install --no-cache-dir -e .

# Configure to use Anthropic via LiteLLM proxy
# These are defaults; override at runtime with actual values
ENV OPENAI_API_BASE=http://litellm.internal:4000 \
    OPENAI_API_KEY=placeholder-overridden-at-runtime \
    FAST_LLM=anthropic/claude-sonnet-4-20250514 \
    SMART_LLM=anthropic/claude-sonnet-4-20250514 \
    STRATEGIC_LLM=anthropic/claude-sonnet-4-20250514 \
    RETRIEVER=tavily \
    DOC_PATH=/app/gpt-researcher/outputs \
    REPORT_FORMAT=research_report

# Supervisor config
COPY <<'EOF' /etc/supervisor/supervisord.conf
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid
user=root

[program:gpt-researcher]
command=python -m uvicorn main:app --host 0.0.0.0 --port 8000
directory=/app/gpt-researcher
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/gpt-researcher.log
stderr_logfile=/var/log/supervisor/gpt-researcher-error.log
user=appuser

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
EOF

# Nginx config
COPY <<'EOF' /etc/nginx/conf.d/gpt-researcher.conf
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
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
EOF

RUN rm -f /etc/nginx/sites-enabled/default

# Ensure output directory exists and is writable
RUN mkdir -p /app/gpt-researcher/outputs && \
    chown -R appuser:appuser /app/gpt-researcher/outputs

EXPOSE 8080

CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
