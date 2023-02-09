#!/usr/bin/env python

from dirtviz.db.utils.import_rl_csv import import_rl_csv
from dirtviz.db.utils.import_teros_csv import import_teros_csv

if __name__ == "__main__":
    print("Importing rocketlogger data")
    import_rl_csv("data/soil_20220629-214516_8_long.csv", "examplelogger", "cell1",
                  "cell2")

    print("Importing TEROS-12 data")
    import_teros_csv(
        path="data/TEROSoutput-1656537434-f17_long.csv",
        mapping={
            "1": "cell1",
            "3": "cell2"
        }
    )

    print("Done!")
