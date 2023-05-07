"""TEROS-12 import utility for legacy csv data

Examples
--------
Import data for cell1 and cell2 that was logged using rocket1::

    $ python -m dirtviz.db.utils.import_teros_csv --cell 1,cell1 \
        --cell 2,cell data.csv

Help prompt for utility::

    $ python -m dirtviz.db.utils.import_teros_csv -h
"""

import csv
from datetime import datetime

from tqdm import tqdm
from sqlalchemy.orm import Session

from ..conn import engine
from ..tables import TEROSData
from ..get_or_create import get_or_create_cell


def import_teros_csv(path, mapping, batch_size=10000):
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

    # pylint: disable=R0801

    with open(path, newline='', encoding='utf-8') as csvfile:
        teros_reader = csv.reader(csvfile)


        # skip first row
        next(teros_reader)

        with Session(engine) as sess:
            count = 0
            tmp = []

            # get cell data
            cell_obj_map = {}
            for sens_id, cell_name in mapping.items():
                cell_obj_map[sens_id] = get_or_create_cell(sess, cell_name)

            for row in tqdm(teros_reader):
                # convert string to timestamp
                ts = datetime.fromtimestamp(int(row[0]))

                tdata = TEROSData(
                    cell_id=cell_obj_map[row[1]].id,
                    ts=ts,
                    vwc=row[2],
                    temp=row[3],
                    ec=row[4]
                )

                tmp.append(tdata)

                count += 1
                if (count > batch_size and tmp):
                    # save objects
                    sess.bulk_save_objects(tmp)
                    sess.commit()
                    # reset counter/tmp array
                    count = 0
                    tmp.clear()

            # save remaining objects
            sess.bulk_save_objects(tmp)
            sess.commit()


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
