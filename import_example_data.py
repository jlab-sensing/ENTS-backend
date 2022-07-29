#!/usr/bin/env python

from dirtviz.db.utils.add_logger import add_logger
from dirtviz.db.utils.add_cell import add_cell
from dirtviz.db.utils.import_rl_csv import import_rl_csv
from dirtviz.db.utils.import_teros_csv import import_teros_csv

if __name__ == "__main__":
    print("Added rocket logger")
    # add rocket loggers
    add_logger("rocket1")

    print("Adding cells")
    # add cells
    add_cell("cell1", "jlab")
    add_cell("cell2", "jlab")

    print("Import rocketlogger data")
    import_rl_csv("data/soil_20220629-214516_8.csv", 1, 1, 2)
    print("Import TEROS-12 data")
    import_teros_csv("data/TEROSoutput-1656537434-f17.csv", {"1": "1", "3": "2"})
