from http.server import HTTPServer, BaseHTTPRequestHandler
from http.client import HTTPResponse
from sqlalchemy.orm import Session
from datetime import datetime

from .decoder import add_data
from ..db.conn import engine
from ..db.get_or_create import get_or_create_logger, get_or_create_cell
from ..db.tables import PowerData, TEROSData


class Handler(BaseHTTPRequestHandler):

    # pylint: disable-next=invalid-name
    def do_POST(self):
        # Send OK response
        self.send_response(200)
        self.end_headers()
        # retrieve length and type of message
        content_len = int(self.headers.get('Content-Length', 0))
        content_type = self.headers.get('Content-Type', 0)
        logger_name = self.headers.get('Device-Name', 0)
        logger_cells = self.headers.get('Cells')

        if (content_type == "mfc-data"):
            content = self.rfile.read(content_len)

            cells = logger_cells.split(",")

            add_data(
                content.decode("UTF-8"),
                logger_name=logger_name,
                cell1_name=cells[0],
                cell1_loc=None,
                cell2_name=cells[0],
                cell2_loc=None
            )

        else:
            print("Handler for content type {ctype} not implemented".format(ctype = "mfc-data"))


if __name__ == "__main__":
    httpd = HTTPServer(('', 8000), Handler)
    httpd.serve_forever()
