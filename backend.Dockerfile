FROM python:3.11.0-bullseye
WORKDIR /app/backend/
COPY backend/requirements.txt ./
RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt
ENV FLASK_DEBUG=0
COPY backend/ ./
EXPOSE 8000
WORKDIR /app/
CMD ["gunicorn", "-b", ":8000", "backend.app:app"]