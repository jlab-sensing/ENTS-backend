import csv
from datetime import datetime

from tqdm import tqdm
from sqlalchemy.orm import Session

from ..conn import engine
from ..tables import PowerData


def import_rl_csv(path, rl, cell1=None, cell2=None, batch_size=100000):
    """Imports raw RocketLogger data in PowerData table.

    Expects columns in the following format
    timestamp,I1L_valid,I2L_valid,I1H [nA],I1L [10pA],V1 [10nV],V2 [10nV],I2H [nA],I2L [10pA]

    Parameters
    ----------
    path : str
        Path to csv file.
    rl : RocketLogger
        Reference to RocketLogger.
    cell1 : Cell
        Reference to cell being measured on channel 1.
    cell2 : Cell
        Reference to cell being measured on channel 2.
    """

    with open(path, newline='') as csvfile:
        rl_reader = csv.reader(csvfile)

        # Skip header
        for _ in range(11):
            rl_reader.__next__()

        count = 0
        tmp = []

        for row in tqdm(rl_reader):

            # convert string to timestamp
            ts = datetime.fromtimestamp(float(row[0]))

            pow1 = PowerData(
                rocketlogger_id=rl,
                cell_id=cell1,
                ts=ts,
                current=row[4],
                voltage=row[5],
            )

            pow2 = PowerData(
                rocketlogger_id=rl,
                cell_id=cell2,
                ts=ts,
                current=row[8],
                voltage=row[6],
            )

            tmp.append(pow1)
            tmp.append(pow2)

            count += 1
            if (count > batch_size and not tmp):
                with Session(engine) as s:
                    s.bulk_save_objects(tmp)
                    s.commit()
                count = 0
                tmp.clear()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Rocketlogger csv importer utility")
    parser.add_argument("--batch-size", type=int, default=100000, help="Batch size of inserts")
    parser.add_argument("path", type=str, help="Name of cell")
    parser.add_argument("rl", type=int, help="Id of rocketlogger")
    parser.add_argument("cell1", type=int, help="Id of cell connected to\
                        channel 1")
    parser.add_argument("cell2", type=int, help="Id of cell connected to\
                        channel 2")

    args = parser.parse_args()

    import_rl_csv(args.path, args.rl, args.cell1, args.cell2, args.batch_size)
