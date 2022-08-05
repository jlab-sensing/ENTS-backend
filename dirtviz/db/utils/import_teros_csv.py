import csv
from datetime import datetime

from tqdm import tqdm
from sqlalchemy.orm import Session

from ..conn import engine
from ..tables import TEROSData

import pdb


def import_teros_csv(path, cell_map, batch_size=10000):
    """Imports raw TEROS data to table TEROSData

    Expects columns in the following format
    timestamp,sensorID,raw_VWC,temp,EC

    Parameters
    ----------
    path : str
        Path to csv file.
    call_map : dict
        Dictionary that maps sensorID from the csv to name of cell in the
        database.
    """

    with open(path, newline='') as csvfile:
        teros_reader = csv.reader(csvfile)


        # skip first row
        teros_reader.__next__()

        with Session(engine) as s:
            count = 0
            tmp = []

            # get cell data
            for sens_id, cell_name in cell_map.items():
                c = get_or_create_cell(cell_name)
                cell_map[cell_name] = c

            for row in tqdm(teros_reader):
                # convert string to timestamp
                ts = datetime.fromtimestamp(int(row[0]))

                tdata = TEROSData(
                    cell_id=cell_map[row[1]].id,
                    ts=ts,
                    vwc=row[2],
                    temp=row[3],
                    ec=row[4]
                )

                tmp.append(tdata)

                count += 1
                if (count > batch_size and tmp):
                    # save objects
                    s.bulk_save_objects(tmp)
                    s.commit()
                    # reset counter/tmp array
                    count = 0
                    tmp.clear()

            # save remaining objects
            s.bulk_save_objects(tmp)
            s.commit()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="TEROSLogger csv importer utility")
    parser.add_argument("--batch-size", type=int, default=10000, help="Batch size of inserts")
    parser.add_argument( "--cell", action="append", required=True,
                        help="""Mapping of sensorID to cell name in the form of
                        sensorID, cell_name""")
    parser.add_argument("path", type=str, help="Name of cell")

    args = parser.parse_args()

    cell_map = {}
    for pair in args.cell:
        csv_id,db_id = pair.split(',')
        cell_map[csv_id] = db_id

    print("Cell Mapping")
    print(cell_map)

    import_teros_csv(args.path, cell_map, args.batch_size)
