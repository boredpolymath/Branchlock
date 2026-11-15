FROM python:3.12-slim

WORKDIR /app
RUN useradd --system --uid 10001 --create-home branchlock
COPY workflow-guardian-prototype/dist /app/workflow-guardian-prototype/dist
COPY workflow-guardian-service /app/workflow-guardian-service
RUN chown -R branchlock:branchlock /app

USER branchlock
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 BRANCHLOCK_HOST=0.0.0.0 PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/api/v1/health', timeout=3)"
CMD ["python", "workflow-guardian-service/server.py"]
