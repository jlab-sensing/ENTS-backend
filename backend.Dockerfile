FROM python:3.11.0-bullseye as development
WORKDIR /app/backend/
COPY backend/requirements.txt ./
RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt
ENV FLASK_DEBUG=0
COPY backend/ ./
EXPOSE 8000
WORKDIR /app/
CMD ["gunicorn", "-b", ":8000", "backend.app:app"]

FROM python:3.11.0-bullseye as build
WORKDIR /app/backend/
COPY backend/requirements.txt ./
RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt
COPY backend/ ./
EXPOSE 8000
WORKDIR /app/
CMD ["gunicorn", "-b", ":8000", "backend.app:app"]