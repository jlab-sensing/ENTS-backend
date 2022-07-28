FROM python:latest
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY dirtviz.py /app/
COPY db/ /app/db/
CMD ["bokeh", "serve", "dirtviz.py"]
EXPOSE 5006
