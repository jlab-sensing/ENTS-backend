FROM python:latest
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY dirtviz /app/dirtviz
CMD ["python", "-m", "python -m dirtviz.integrations.api"]
EXPOSE 8090