"""Chirpstack HTTP Inetgration server

Notes
-----
The data format is hardcoded for the rocketlogger data stream. If it changes
then this code will need to be changed to reflect the format

.. codeauthor:: John Madden <jtmadden@ucsc.edu>
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime

from chirpstack_api.as_pb import integration
from google.protobuf.json_format import Parse

from sqlalchemy.orm import Session
from ..db.conn import engine
from ..db.tables import PowerData, TEROSData
from ..db.get_or_create import get_or_create_logger, get_or_create_cell

class Handler(BaseHTTPRequestHandler):
    """HTTP Request Handler

    Attributes
    ----------
    json : bool
        Flag to decode using json or protobuf marshaler. True means json, False
        means protobuf.
    """

    # pylint: disable=invalid-name

    # True -  JSON marshaler
    # False - Protobuf marshaler (binary)
    json = False

    def do_POST(self):
        """Handle post request"""

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
            print(f"""handler for event {query_args["event"][0]} is not
                  implemented""")


    def up(self, body):
        """Handle LoRa uplink event

        Parameters
        ----------
        body : bytes
            Request body
        """

        up = self.unmarshal(body, integration.UplinkEvent())

        data = self.parse_rl(up.data.decode())

        with Session(engine) as sess:
            # Create logger if name does not exist
            log = get_or_create_logger(sess, up.tags["logger_name"])

            # Create cell1 if does not exist
            c1 = get_or_create_cell(sess, up.tags["cell1_name"], up.tags["cell1_loc"])
            c2 = get_or_create_cell(sess, up.tags["cell2_name"], up.tags["cell2_loc"])

            data_list = []

            # PowerData
            data_list.append(
                    PowerData(
                    logger_id=log.id,
                    cell_id=c1.id,
                    ts=data["ts"],
                    current=data["i1"],
                    voltage=data["v1"]
                )
            )

            data_list.append(
                PowerData(
                    logger_id=log.id,
                    cell_id=c2.id,
                    ts=data["ts"],
                    current=data["i2"],
                    voltage=data["v2"]
                )
            )

            data_list.append(
                TEROSData(
                    cell_id=c1.id,
                    ts=data["ts"],
                    vwc=data["raw_vwc"],
                    temp=data["temp"],
                    ec=data["ec"]
                )
            )

            data_list.append(
                TEROSData(
                    cell_id=c2.id,
                    ts=data["ts"],
                    vwc=data["raw_vwc"],
                    temp=data["temp"],
                    ec=data["ec"]
                )
            )

            sess.add_all(data_list)
            sess.commit()

        print(f"""Uplink received from: {up.dev_eui.hex()} with payload:
              {up.data.hex()}""")


    def join(self, body):
        """Handle LoRa join event

        Parameters
        ----------
        body : bytes
            Request body
        """

        join = self.unmarshal(body, integration.JoinEvent())
        print(f"""Device: {join.dev_eui.hex()} joined with DevAddr:
              {join.dev_addr.hex()}""")


    def parse_rl(self, payload):
        """Parses sent rocketlogger data

        The payload is expected to be already decoded and formatted as a csv as
        follows::

            ts_r, v1, i1, v2, i2, raw_vwc, temp, ec

        Parameters
        ----------
        payload : bytes
            Decoded data sent from the rocketlogger

        Returns
        -------
        dict
            Dictonary of sent data. Keys are as follows ["ts_r", "v1", "i1",
            "v2", "i2", "raw_vwc", "temp", "ec"].
        """

        split = payload.split(",")

        data = {}
        data["ts"] = datetime.now()

        # format and store
        keys = ["ts_r", "v1", "i1", "v2", "i2", "raw_vwc", "temp", "ec"]
        types = [datetime.fromtimestamp, int, int, int, int,int, float, float,
                 int]
        for k, t, p in zip(keys, types, split):
            data[k] = t(p)

        return data


    def unmarshal(self, body, pl):
        """Parse data from request

        Parameters
        ----------
        body : bytes
            Request body
        pl : protobuf
            Protobuf payload decoder

        Returns
        -------
        protobuf
            Decoded payload
        """

        if self.json:
            return Parse(body, pl)

        pl.ParseFromString(body)
        return pl


if __name__ == "__main__":
    httpd = HTTPServer(('', 8090), Handler)
    httpd.serve_forever()
