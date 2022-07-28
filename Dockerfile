FROM python:latest
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY dirtviz /app/dirtviz
CMD ["bokeh", "serve", "dirtviz"]
EXPOSE 5006
