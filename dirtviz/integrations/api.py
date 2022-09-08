from http.server import HTTPServer, BaseHTTPRequestHandler
from http.client import HTTPResponse
from sqlalchemy.orm import Session
from datetime import datetime
from ..db.conn import engine
from ..db.get_or_create import get_or_create_logger, get_or_create_cell
from ..db.tables import PowerData, TEROSData


class Handler(BaseHTTPRequestHandler):
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

            data = content.decode('UTF-8').split(",")
            cells = logger_cells.split(",")

            types = [int, int, int, int, int, float, float, int]
            ts_r, v1, i1, v2, i2, raw_vwc, temp, ec = [
                t(m) for t, m in zip(types, data)]

            ts_r = datetime.fromtimestamp(ts_r)

            with Session(engine) as s:
                # Create logger if name does not exist
                l = get_or_create_logger(s, logger_name)

                # Create cell if it does not exist
                c1 = get_or_create_cell(
                    s, cells[0], None)
                c2 = get_or_create_cell(
                    s, cells[1], None)

                # PowerData
                pd1 = PowerData(
                    logger_id=l.id,
                    cell_id=c1.id,
                    ts=ts_r,
                    current=i1,
                    voltage=v1
                )

                pd2 = PowerData(
                    logger_id=l.id,
                    cell_id=c2.id,
                    ts=ts_r,
                    current=i2,
                    voltage=v2
                )

                td1 = TEROSData(
                    cell_id=c1.id,
                    ts=ts_r,
                    vwc=raw_vwc,
                    temp=temp,
                    ec=ec
                )

                td2 = TEROSData(
                    cell_id=c2.id,
                    ts=ts_r,
                    vwc=raw_vwc,
                    temp=temp,
                    ec=ec
                )

                s.add_all([pd1, pd2, td1, td2])
                s.commit()
        else:
            print("Handler for content type {ctype} not implemented".format(ctype = "mfc-data"))


if __name__ == "__main__":
    httpd = HTTPServer(('', 8000), Handler)
    httpd.serve_forever()
