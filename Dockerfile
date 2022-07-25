FROM python:latest
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["bokeh", "serve", "dirtviz.py"]
EXPOSE 5006
