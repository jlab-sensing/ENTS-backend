FROM python:latest
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY dirtviz.py .
CMD ["bokeh", "serve", "dirtviz.py"]
EXPOSE 5006
