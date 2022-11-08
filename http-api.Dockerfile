FROM python:3.11.0-bullseye
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY dirtviz /app/dirtviz
CMD ["python", "-m", "dirtviz.integrations.api"]
EXPOSE 8090
