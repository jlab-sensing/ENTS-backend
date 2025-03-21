#!/usr/bin/env python
from backend.api.utils.import_cell_data import import_cell_data

# from backend.api.utils.import_teros_csv import import_teros_csv
import os

if __name__ == "__main__":

    csv_files = os.listdir("./data")
    csv_files = [
        f for f in csv_files if os.path.isfile("./data" + "/" + f)
    ]  # Filtering only the files.
    print(*csv_files, sep="\n")
    for f in csv_files:
        name = f[:-4]
        print("Importing " + f + " data")
        import_cell_data("data/" + f, "examplelogger", name)
        print("Finished importing " + f + "!")
