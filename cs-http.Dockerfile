FROM python:latest
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY dirtviz /app/dirtviz
CMD ["python", "-m", "dirtviz.integrations.cs_http"]
EXPOSE 8100
