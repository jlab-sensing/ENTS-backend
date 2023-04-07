"""Rocketlogger CSV importer

Examples
--------
Import data for cell1 and cell2 that was logged using rocket1::

    $ python -m dirtviz.db.utils.import_teros_csv data.csv rocket1 cell1 cell2


Help prompt for utility::

    $ python -m dirtviz.db.utils.import_teros_csv -h
"""

import csv
from datetime import datetime

from tqdm import tqdm
from sqlalchemy.orm import Session

from ..conn import engine
from ..tables import PowerData
from ..get_or_create import get_or_create_cell, get_or_create_logger


def import_rl_csv(path, logger_name, cell1_name, cell2_name, batch_size=10000):
    """Imports raw RocketLogger data in PowerData table. A logger instance for
    the rokcet locker must be created first.

    Expects columns in the following format
    timestamp,I1L_valid,I2L_valid,I1H [nA],I1L [10pA],V1 [10nV],V2 [10nV],I2H [nA],I2L [10pA]

    Parameters
    ----------
    path : str
        Path to csv file.
    logger_name : str
        Logger name for the Rocketlogger
    cell1_name : str
        Name of cell being measured on channel 1.
    cell2_name : str
        Name of cell being measured on channel 2.
    """

    # pylint: disable=R0801

    with open(path, newline='', encoding="UTF-8") as csvfile:
        rl_reader = csv.reader(csvfile)


        # Skip header
        for _ in range(11):
            next(rl_reader)

        tmp = []

        with Session(engine) as sess:
            # Get or create objects
            logger = get_or_create_logger(sess, logger_name)
            cell1 = get_or_create_cell(sess, cell1_name)
            cell2 = get_or_create_cell(sess, cell2_name)

            for row in tqdm(rl_reader):

                # convert string to timestamp
                ts = datetime.fromtimestamp(float(row[0]))

                tmp.append(
                    PowerData(
                        logger_id=logger.id,
                        cell_id=cell1.id,
                        ts=ts,
                        current=row[4],
                        voltage=row[5],
                    )
                )

                tmp.append(
                    PowerData(
                        logger_id=logger.id,
                        cell_id=cell2.id,
                        ts=ts,
                        current=row[8],
                        voltage=row[6],
                    )
                )

                if (len(tmp) > batch_size and tmp):
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
    parser.add_argument("--batch-size", type=int, default=10000, help="Batch size of inserts")
    parser.add_argument("path", type=str, help="Name of cell")
    parser.add_argument("rl", type=str, help="Name of rocketlogger")
    parser.add_argument("cell1", type=str, help="Name of cell connected to channel 1")
    parser.add_argument("cell2", type=str, help="Name of cell connected to channel 2")

    args = parser.parse_args()

    import_rl_csv(args.path, args.rl, args.cell1, args.cell2, args.batch_size)
