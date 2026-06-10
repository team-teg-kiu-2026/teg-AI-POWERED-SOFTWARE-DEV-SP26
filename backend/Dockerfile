# NutriSmart backend — production image.
# Build from the backend/ directory:  docker build -t nutrismart-backend backend/
# Run:                                 docker run -p 5000:5000 --env-file .env nutrismart-backend
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=5000

WORKDIR /app

# Install dependencies first so this layer caches across code changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application source.
COPY . .

EXPOSE 5000

# Liveness probe hits the fast, no-I/O /health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import os,sys,urllib.request; \
sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:'+os.environ.get('PORT','5000')+'/health', timeout=4).status==200 else 1)"

# Gunicorn binds the platform-provided $PORT (Railway/Render set this).
# Threaded (gthread) workers: this service is I/O-bound (it waits on OpenRouter),
# so threads let one worker serve many concurrent requests instead of blocking.
# 2 workers x 8 threads = 16 concurrent slots, so /health is never stuck behind
# a slow chat call.
CMD ["sh", "-c", "gunicorn app:app --bind 0.0.0.0:${PORT:-5000} --workers 2 --threads 8 --worker-class gthread --timeout 120"]
