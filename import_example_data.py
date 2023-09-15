#!/usr/bin/env python
from backend.api.database.utils.import_cell_data import import_cell_data
# from backend.api.database.utils.import_teros_csv import import_teros_csv
from tqdm import tqdm
import csv

if __name__ == "__main__":
    print("Importing sample data")
    import_cell_data("data/imwut_v1_1.csv", "examplelogger", "imwut_v1_1")
    print("Done!")

