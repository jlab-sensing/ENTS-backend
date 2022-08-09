FROM python:latest
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY dirtviz /app/dirtviz
COPY migrate_and_start.sh .
CMD ["./migrate_and_start.sh"]
EXPOSE 5006
