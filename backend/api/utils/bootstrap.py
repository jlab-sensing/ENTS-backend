"""Logger and cell boostrap script.

Create a new logger and

Examples:

    $ python -m dirtviz.api.utils.bootstrap
"""

import random

from sqlalchemy.orm import Session

from ..conn import engine
from ..models.logger import Logger
from ..models.cell import Cell


def generate_mac_address() -> str:
    """Generate a random MAC address."""
    # Set the first byte to have locally administered bit set (02)
    # and unicast (least significant bit of first octet = 0)
    mac = [
        0x02,
        random.randint(0x00, 0xFF),
        random.randint(0x00, 0xFF),
        random.randint(0x00, 0xFF),
        random.randint(0x00, 0xFF),
        random.randint(0x00, 0xFF),
    ]

    return ":".join(f"{octet:02x}" for octet in mac)


def bootstrap() -> tuple[int, int]:
    """Boostrap a logger and cell combination."""

    with Session(engine) as sess:
        # Generate fake MAC address
        mac = generate_mac_address()

        # Add logger
        logger = Logger(
            name=f"logger-{mac}",
            type="Other",
            device_eui=mac,
            description="Test Logger",
        )
        sess.add(logger)
        sess.flush()

        # Add cell
        # Location is UCSC for map testing
        cell = Cell(
            name=f"cell-{logger.id}",
            location="Test Location",
            latitude=36.99183878072351,
            longitude=-122.05874253686056,
            archive=False,
            user_id=None,
        )
        sess.add(cell)

        # Save changes
        sess.commit()

        logger_id = logger.id
        cell_id = cell.id

    return (logger_id, cell_id)


def entry():
    """Entrypoint for the cli call."""

    for _ in range(5):
        logger, cell = bootstrap()

        print(logger)

        print(cell)


if __name__ == "__main__":
    entry()
