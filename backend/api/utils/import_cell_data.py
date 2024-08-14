"""Rocketlogger CSV importer

Examples
--------
Import data for cell and cell2 that was logged using rocket1::

    $ python -m dirtviz.db.utils.import_teros_csv data.csv rocket1 cell cell2


Help prompt for utility::

    $ python -m dirtviz.db.utils.import_teros_csv -h
"""

import csv
from datetime import datetime

from tqdm import tqdm
from sqlalchemy.orm import Session

from ..conn import engine
from ..models.power_data import PowerData
from ..models.teros_data import TEROSData
from .get_or_create import get_or_create_cell, get_or_create_logger


def import_cell_data(path, logger_name, cell_name, batch_size=10000):
    """Imports raw RocketLogger data in PowerData table. A logger instance for
    the rokcet locker must be created first.

    Expects columns in the following format
    timestamp, Voltage (mV), Current (uA), Power(uW), EC (uS/cm),
    VWC (%), Temperature (C)

    Parameters
    ----------
    path : str
        Path to csv file.
    logger_name : str
        Logger name for the Rocketlogger
    cell_name : str
        Name of cell.
    """

    # pylint: disable=R0801

    with open(path, newline="", encoding="UTF-8") as csvfile:
        data_reader = csv.reader(csvfile)

        # Skip header
        for _ in range(11):
            next(data_reader)

        tmp = []

        with Session(engine) as sess:
            # Get or create objects
            logger = get_or_create_logger(sess, logger_name)
            cell = get_or_create_cell(sess, cell_name)

            for row in tqdm(data_reader):
                # convert string to timestamp
                cleaned_ts = row[0][1:-4]
                # print("\n" + repr(cleaned_ts))
                ts = datetime.strptime(cleaned_ts, "%d %b %Y %H:%M:%S").replace(
                    tzinfo=None
                )

                tmp.append(
                    PowerData(
                        logger_id=logger.id,
                        cell_id=cell.id,
                        ts=ts,
                        current=float(row[2]) * 1e-6,
                        voltage=float(row[1]) * 1e-3,
                    )
                )

                tdata = TEROSData(
                    cell_id=cell.id,
                    ts=ts,
                    vwc=float(row[5]),
                    temp=float(row[6]),
                    ec=float(row[4]),
                )

                tmp.append(tdata)

                if len(tmp) > batch_size and tmp:
                    # Save objects
                    sess.bulk_save_objects(tmp)
                    sess.commit()
                    # Reset array
                    tmp.clear()

            # Save remaining objects
            sess.bulk_save_objects(tmp)
            sess.commit()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Rocketlogger csv importer utility")
    parser.add_argument(
        "--batch-size", type=int, default=10000, help="Batch size of inserts"
    )
    parser.add_argument("path", type=str, help="Path to cell data csv")
    parser.add_argument("rl", type=str, help="Name of rocketlogger")
    parser.add_argument("cell", type=str, help="Name of cell")

    args = parser.parse_args()

    import_cell_data(args.path, args.rl, args.cell, args.cell2, args.batch_size)
