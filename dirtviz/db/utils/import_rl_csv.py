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

    with open(path, newline='') as csvfile:
        rl_reader = csv.reader(csvfile)


        # Skip header
        for _ in range(11):
            rl_reader.__next__()

        count = 0
        tmp = []

        with Session(engine) as s:
            # Get or create objects
            logger = get_or_create_logger(s, logger_name)
            cell1 = get_or_create_cell(s, cell1_name)
            cell2 = get_or_create_cell(s, cell2_name)

            for row in tqdm(rl_reader):

                # convert string to timestamp
                ts = datetime.fromtimestamp(float(row[0]))

                pow1 = PowerData(
                    logger_id=logger.id,
                    cell_id=cell1.id,
                    ts=ts,
                    current=row[4],
                    voltage=row[5],
                )

                pow2 = PowerData(
                    logger_id=logger.id,
                    cell_id=cell2.id,
                    ts=ts,
                    current=row[8],
                    voltage=row[6],
                )

                tmp.append(pow1)
                tmp.append(pow2)

                count += 1
                if (count > batch_size and tmp):
                    # Save objects
                    s.bulk_save_objects(tmp)
                    s.commit()
                    # Reset counter
                    count = 0
                    tmp.clear()

            # Save remaining objects
            s.bulk_save_objects(tmp)
            s.commit()


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
