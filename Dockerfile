FROM python:latest
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["bokeh", "serve", "dirtviz.py"]
EXPOSE 5006
