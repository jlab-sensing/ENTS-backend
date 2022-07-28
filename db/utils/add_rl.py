from sqlalchemy.orm import Session

from ..tables import RocketLogger
from ..conn import engine

def add_rl(mac=None, hostname=None) -> RocketLogger:
    """Adds a new rocketlogger

    Parameters
    ----------
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
        rl = RocketLogger(
            mac=mac,
            hostname=hostname,
        )

        s.add(rl)
        s.commit()

        return rl.__repr__()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Add rocketlogger utility")
    parser.add_argument("mac", type=str, help="MAC Address of rocketlogger")
    parser.add_argument("hostname", type=str, help="FQDN of rocketlogger")

    args = parser.parse_args()

    print(add_rl(args.mac, args.hostname))

