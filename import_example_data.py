#!/usr/bin/env python

from dirtviz.db.utils.add_logger import add_logger
from dirtviz.db.utils.add_cell import add_cell
from dirtviz.db.utils.import_rl_csv import import_rl_csv
from dirtviz.db.utils.import_teros_csv import import_teros_csv

if __name__ == "__main__":
    print("Importing rocketlogger data")
    import_rl_csv("data/soil_20220629-214516_8.csv", "examplelogger", "cell1",
                  "cell2")

    print("Importing TEROS-12 data")
    import_teros_csv(
        path="data/TEROSoutput-1656537434-f17.csv",
        cell_map={
            "1": "cell1",
            "3": "cell2"
        }
    )

    print("Done!")
