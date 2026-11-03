"""Logger and cell boostrap script.

Create a new logger and

Examples:

    $ python -m dirtviz.api.utils.bootstrap
"""

import random

from sqlalchemy.orm import Session
import subprocess
from datetime import datetime, timedelta, timezone
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
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=14)

    for index in range(5):
        logger_id, cell_id = bootstrap()
        cell_start = start + timedelta(hours=index * 6)
        cell_end = end - timedelta(hours=index * 2)

        print(f"Uploading sample data for cell {cell_id}", flush=True)

        subprocess.run(
            [
                "ents", "sim_generic", "batch",
                "--url", "http://backend:8000/api/sensor/",
                "--sensor", "POWER_VOLTAGE", "BME280_TEMP",
                "--cell", str(cell_id),
                "--logger", str(logger_id),
                "--start", cell_start.isoformat(),
                "--end", cell_end.isoformat(),
                "--freq", "3600",
                "--min", str(-1 + index * 0.2),
                "--max", str(1 + index * 0.2),
            ],
            check=True,
        )


if __name__ == "__main__":
    entry()
