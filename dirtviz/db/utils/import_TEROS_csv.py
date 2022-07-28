import csv
from datetime import datetime

from tqdm import tqdm
from sqlalchemy.orm import Session

from ..conn import engine
from ..tables import TEROSData

import pdb


def import_TEROS_csv(path, cell_map, batch_size=100000):
    """Imports raw TEROS data to table TEROSData

    Expects columns in the following format
    timestamp,sensorID,raw_VWC,temp,EC

    Parameters
    ----------
    path : str
        Path to csv file.
    call_map : dict
        Dictionary that maps sensorID from the csv to cell_id in the database
    """

    with open(path, newline='') as csvfile:
        teros_reader = csv.reader(csvfile)

        count = 0
        tmp = []

        # skip first row
        teros_reader.__next__()

        for row in tqdm(teros_reader):
            # convert string to timestamp
            ts = datetime.fromtimestamp(int(row[0]))

            tdata = TEROSData(
                cell_id=cell_map[row[1]],
                ts=ts,
                raw_VWC=row[2],
                temperature=row[3],
                ec=row[4]
            )

            tmp.append(tdata)

            count += 1
            if (count > batch_size and tmp):
                with Session(engine) as s:
                    s.bulk_save_objects(tmp)
                    s.commit()
                count = 0
                tmp.clear()

        # save remaining objects
        with Session(engine) as s:
            s.bulk_save_objects(tmp)
            s.commit()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Rocketlogger csv importer utility")
    parser.add_argument("--batch-size", type=int, default=100000, help="Batch size of inserts")
    parser.add_argument("path", type=str, help="Name of cell")
    parser.add_argument("--cell", action="append", required=True, help="Mapping of sensorID to cell_id in the form of sensorID,cell_id")

    args = parser.parse_args()

    cell_map = {}
    for pair in args.cell:
        csv_id,db_id = pair.split(',')
        cell_map[csv_id] = db_id

    print(cell_map)

    import_TEROS_csv(args.path, cell_map, args.batch_size)
