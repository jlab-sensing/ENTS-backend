from sqlalchemy.orm import Session

from ..tables import Logger
from ..conn import engine

def add_logger(name, mac=None, hostname=None):
    """Adds a new data logger source

    Parameters
    ----------
    name : str
        Name of logger
    mac : str
        MAC Address of the RocketLogger
    hostname : str
        FQDN of the RocketLogger

    Returns
    -------
    Reference to created RocketLogger object
    """

    with Session(engine) as s:
        # Create new object
        rl = Logger(
            name=name,
            mac=mac,
            hostname=hostname,
        )

        s.add(rl)
        s.commit()

        return rl.__repr__()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Add logger utility")
    parser.add_argument("name", type=str, help="Name of logger")
    parser.add_argument("--mac", type=str, help="MAC Address of logger")
    parser.add_argument("--hostname", type=str, help="FQDN of logger")

    args = parser.parse_args()

    print(add_logger(args.name, args.mac, args.hostname))

