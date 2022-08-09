from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime
import base64

from chirpstack_api.as_pb import integration
from google.protobuf.json_format import Parse

from sqlalchemy.orm import Session
from sqlalchemy import select
from ..db.conn import engine
from ..db.tables import PowerData, TEROSData
from ..db.get_or_create import get_or_create_logger, get_or_create_cell


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

        # Take the current timestamp
        ts_n = datetime.now()

        # decode the data
        rl = up.data.decode().split(",")
        # convert from strings to types
        types = [int, int, int, int,int, float, float, int]
        ts_r, v1, i1, v2, i2, raw_vwc, temp, ec = [t(m) for t,m in zip(types, rl)]
        # convert to timestamp objects
        ts_r = datetime.fromtimestamp(ts_r)

        # TODO run calibration for vwc

        with Session(engine) as s:
            # Create logger if name does not exist
            l = get_or_create_logger(s, up.tags["logger_name"])

            # Create cell1 if does not exist
            c1 = get_or_create_cell(s, up.tags["cell1_name"], up.tags["cell1_loc"])
            c2 = get_or_create_cell(s, up.tags["cell2_name"], up.tags["cell2_loc"])

            # PowerData
            pd1 = PowerData(
                logger_id=l.id,
                cell_id=c1.id,
                ts=ts,
                current=i1,
                voltage=v1
            )

            pd2 = PowerData(
                logger_id=l.id,
                cell_id=c2.id,
                ts=ts,
                current=i2,
                voltage=v2
            )

            td1 = TEROSData(
                cell_id=c1.id,
                ts=ts,
                vwc=raw_vwc,
                temp=temp,
                ec=ec
            )

            td2 = TEROSData(
                cell_id=c2.id,
                ts=ts,
                vwc=raw_vwc,
                temp=temp,
                ec=ec
            )

            s.add_all([pd1, pd2, td1, td2])
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
