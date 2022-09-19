"""
-HTTP API server implementation
-Used to upload rocketlogger data to postgreSQL via ethernet
-based on existing rocketlogger data format, code must be altered if format
    changes
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from .decoder import add_data


class Handler(BaseHTTPRequestHandler):
    """HTTP Request Handler"""

    # pylint: disable-next=invalid-name
    def do_POST(self):
        """Handle HTTP POST request
            -Only handles type 'mfc-data', no current plans to expand
        """
        # Send OK response
        self.send_response(200)
        self.end_headers()
        # retrieve length and type of message
        content_len = int(self.headers.get('Content-Length', 0))
        content_type = self.headers.get('Content-Type', 0)
        logger_name = self.headers.get('Device-Name', 0)
        logger_cells = self.headers.get('Cells')

        if content_type == "mfc-data":
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
            print(f"Handler for content type {content_type} not implemented")


if __name__ == "__main__":
    httpd = HTTPServer(('', 8090), Handler)
    httpd.serve_forever()
