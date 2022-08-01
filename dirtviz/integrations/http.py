from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime
import base64

from chirpstack_api.as_pb import integration
from google.protobuf.json_format import Parse

from sqlalchemy import select
from ..db.conn import engine
from ..db.tables import Logger, Cell, PowerData, TEROSData
form ..db.get_or_create import get_or_create_logger


class Handler(BaseHTTPRequestHandler):
    # True -  JSON marshaler
    # False - Protobuf marshaler (binary)
    json = False

    def do_POST(self):
        self.send_response(200)
        self.end_headers()
        query_args = parse_qs(urlparse(self.path).query)

        content_len = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_len)

        if query_args["event"][0] == "up":
            self.up(body)

        elif query_args["event"][0] == "join":
            self.join(body)

        else:
            print("handler for event %s is not implemented" % query_args["event"][0])

    def up(self, body):
        up = self.unmarshal(body, integration.UplinkEvent())

        ts = datetime.fromtimestamp(up.publishedAt)

        # TODO Check if the following implements the base64 decode
        #data = up.data.hex()
        data = base64.b64decode(up.data)
        v1, _, i1, v2, _, i2 = data.split(",")

        with Session(engine) as s:
            # Create logger if name does not exist
            get_or_create_logger(s, up.tags.logger_name)

            # Create cell1 if does not exist
            stmt = (
                select(Cell)
                .where(Cell.name==up.tags.cell1_name)
                .where(Cell.location==up.tags.cell1_loc)
            )
            c1 = s.execute(stmt).count()
            if not c:
                c1 = Cell(
                    name=up.tags.cell1_name,
                    location=up.tags.cell1_loc
                )
                s.add(c1)

            # Create cell2 if does not exist
            stmt = (
                select(Cell)
                .where(Cell.name==up.tags.cell2_name)
                .where(Cell.location==up.tags.cell2_loc)
            )
            c2 = s.execute(stmt).count()
            if not c:
                c2 = Cell(
                    name=up.tags.cell2_name,
                    location=up.tags.cell2_loc
                )
                s.add(c2)

            # PowerData
            data1 = PowerData(
                logger_id=l.id,
                cell_id=c1.id,
                ts=ts,
                current=i1,
                voltage=v1
            )

            data2 = PowerData(
                logger_id=l.id,
                cell_id=c2.id,
                ts=ts,
                current=i2,
                voltage=v2
            )

            s.add_all([data1, data2])

            s.commit()


        print("Uplink received from: %s with payload: %s" % (up.dev_eui.hex(), up.data.hex()))

    def join(self, body):
        join = self.unmarshal(body, integration.JoinEvent())
        print("Device: %s joined with DevAddr: %s" % (join.dev_eui.hex(), join.dev_addr.hex()))

    def unmarshal(self, body, pl):
        if self.json:
            return Parse(body, pl)

        pl.ParseFromString(body)
        return pl


if __name__ == "__main__":
    httpd = HTTPServer(('', 8090), Handler)
    httpd.serve_forever()
