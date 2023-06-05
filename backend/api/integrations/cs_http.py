"""Chirpstack HTTP Inetgration server

Notes
-----
The data format is hardcoded for the rocketlogger data stream. If it changes
then this code will need to be changed to reflect the format

.. codeauthor:: John Madden <jtmadden@ucsc.edu>
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

from chirpstack_api.as_pb import integration
from google.protobuf.json_format import Parse

from .decoder import add_data

class Handler(BaseHTTPRequestHandler):
    """HTTP Request Handler

    Attributes
    ----------
    json : bool
        Flag to decode using json or protobuf marshaler. True means json, False
        means protobuf.
    """


    # True -  JSON marshaler
    # False - Protobuf marshaler (binary)
    json = False

    # pylint: disable-next=invalid-name
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

        add_data(
            up.data.decode(),
            logger_name=up.tags["logger_name"],
            cell1_name=up.tags["cell1_name"],
            cell1_loc=up.tags["cell1_loc"],
            cell2_name=up.tags["cell2_name"],
            cell2_loc=up.tags["cell2_loc"]
        )

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
    httpd = HTTPServer(('', 8100), Handler)
    httpd.serve_forever()
