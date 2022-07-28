#!/usr/bin/env python3

"""
Implements the bokeh plots mirring those generated from show_twobat.py from
original data processing. There is a datetime slider that adjusts the range of
the graphs. The script uses the interal bokeh server to serve the graphs.

TODO
- Graph TEROS-12 Sensor Data
- Display key statistics (max power)

.. moduleauthor:: John Madden <jtmadden@ucsc.edu>
"""

import os
import pdb

import pandas as pd

from bokeh.plotting import figure, show
from bokeh.models import ColumnDataSource, LinearAxis, Range1d, DatetimeRangeSlider
from bokeh.models import AutocompleteInput, Select
from bokeh.io import curdoc
from bokeh import layouts

from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy import cast
from sqlalchemy.sql import label
from sqlalchemy import text

from .db.conn import engine
from .db.tables import PowerData, Cell
from .db.getters import get_power_data

# Path to data directory
DATA_DIR = "data"
# Name of TEROS data file
TEROS_NAME = "TEROSoutput-1656537434-f17.csv"
# Name of RocketLogger data file
RL_NAME = "soil_20220629-214516_8.csv"

sess = Session(engine)

def load_rl_data(_filename):
    """Loads rocketlogger data and downsamples the data to a reasonable
    timestep. The graphs were started to lag with all the raw data.

    Parameters
    ----------
    _filename: str
        Path to csv formatted file

    Note
    ----
    read_csv() skips blank lines therefore the header index is 9 to skip the
    rocketlogger preamble.

    There is nothing implemented to handle switching between IL and IH.
    """

    # The data has two current channels and the I1L_valid and I2L_valid indicate
    # which channels is currently being used. For now only I*L are valid
    raw = pd.read_csv(_filename,
                      header=9,
                      names=["timestamp", "I1L_valid", "I2L_valid", "I1H",
                             "I1L", "V1", "V2", "I2H", "I2L"],
                      )
    # Calculate timestamp and make index
    raw["timestamp"] = pd.to_datetime(raw["timestamp"], unit='s')
    raw = raw.set_index("timestamp")
    # Convert units
    raw[["I1L", "I2L"]] = raw[["I1L", "I2L"]]*10e-6
    raw[["V1", "V2"]] = raw[["V1", "V2"]]*10e-9
    # Calculate power
    raw["P1"] = raw["V1"] * raw["I1L"]
    raw["P2"] = raw["V2"] * raw["I2L"]

    # Calculate moving average
    downsampled = raw.resample('10min').mean()

    return downsampled


def load_teros_data(_filename):
    """Loads TEROS soil data and converts the raw volumetric water content to
    a percentage.

    Parameters
    ----------
    _filename: str
        Path to csv formatted file.

    Returns
    -------
    pd.DataFrame
        Dataframe containing loaded data with same columns as in the csv file.
    """

    raw = pd.read_csv(_filename, header=0)
    # Convert to datetime
    raw["timestamp"] = pd.to_datetime(raw["timestamp"], unit='s')
    raw = raw.set_index("timestamp")

    # Calculate volumetric water content
    raw["vwc"] = (9.079e-10)*raw["raw_VWC"]**3 - (6.626e-6)*raw["raw_VWC"]**2 + (1.643e-2)*raw["raw_VWC"] - 1.354e1
    raw["vwc"] = 100 * raw["vwc"]
    # Only take sensor 1
    sensor1 = raw[raw["sensorID"] == 1]

    downsampled = sensor1.resample('10min').mean()

    return downsampled



# Create cell select widget
stmt = select(Cell).order_by(Cell.name)
cell_options = [(str(c.id), c.__repr__()) for c in sess.scalars(stmt)]
cell_select = Select(options=cell_options)


# Read TEEROS data
teros_path = os.path.join(DATA_DIR, TEROS_NAME)
teros_data = load_teros_data(teros_path)
teros_source = ColumnDataSource(teros_data)

#rl_path = os.path.join(DATA_DIR, RL_NAME)
#rl_data = load_rl_data(rl_path)

rl_data = get_power_data(sess, int(cell_options[0][0]))
source = ColumnDataSource(rl_data)


# Plot Power
power = figure(
    title="Power Measurements",
    x_axis_label='Date',
    x_axis_type="datetime",
    y_axis_label='Power [uW]',
    aspect_ratio=2.,
)
power.line("timestamp", "p", source=source, legend_label="P1")


# Plot voltage/current
vi = figure(
    title="Voltage/Current Measurements",
    x_axis_label='Date',
    y_axis_label='Voltage [V]',
    y_range=Range1d(start=0,end=1.),
    x_axis_type="datetime",
    aspect_ratio = 2.,
)

# Create separate y axis for current
vi.extra_y_ranges = {"I": Range1d(start=0, end=200)}
vi.add_layout(LinearAxis(axis_label="Current [uA]", y_range_name="I"), 'right')

# Plot data
vi.line("timestamp", "v", source=source, legend_label="V1", color="green")
vi.line("timestamp", "i", source=source, legend_label="I1L",
        y_range_name="I", color="red")


# Plot TEROS data
teros_temp_vwc = figure(
    title="TEROS-12 Sensor Data",
    x_axis_label="Date",
    x_axis_type="datetime",
    y_axis_label="Volumetric Water Content [%]",
    y_range=Range1d(start=0, end=100),
    aspect_ratio=2.,
)
teros_temp_vwc.extra_y_ranges = {"temp": Range1d(start=0, end=40.)}
teros_temp_vwc.add_layout(LinearAxis(axis_label="Temperature [C]",
                                     y_range_name="temp"), 'right')

teros_temp_vwc.line("timestamp", "vwc", source=teros_source, legend_label="VWC")
teros_temp_vwc.line("timestamp", "temp", source=teros_source,
           legend_label="Temperature", y_range_name="temp", color="red")

# Plot TEROS EC data
teros_ec = figure(
    title="TEROS-12 Measured Electricaly Conductivity",
    x_axis_label="Date",
    x_axis_type="datetime",
    y_axis_label="Electrical Conductivity",
    aspect_ratio=2.,
)
teros_ec.line("timestamp", "EC", source=teros_source,
           legend_label="Electrical Conductivity [uS/cm]", color="green")


#date_range= DatetimeRangeSlider(
#    title="Date Range",
#    start=rl_data.index[0],
#    end=rl_data.index[-1],
#    value=(rl_data.index[0], rl_data.index[-1]),
#    step=100000,
#)

def update_range(attrname, old, new):
    """Update range of data displayed

    Parameters
    ----------
    attrname: str
    old: tuple
        Tuple of old dates
    new: tuple
        Tuple of new dates

    Notes
    -----
    bokeh uses ms units for epoch time contrary to the input timestamp used in
    the original pandas dataframe.
    """

    lower, upper = pd.to_datetime(new, unit='ms')

    # Update rocketlogger data
    selected = rl_data
    selected = selected[selected.index >= lower]
    selected = selected[selected.index <= upper]

    source.data = selected

    # Update TEROS data
    selected_teros = teros_data
    selected_teros = selected_teros[selected_teros.index >= lower]
    selected_teros = selected_teros[selected_teros.index <= upper]

    teros_source.data = selected_teros


def update_cell(attrname, old, new):
    """Updated the data source based on the selected cels"""

    #pdb.set_trace()
    new_data = get_power_data(sess, int(new))
    source.data = new_data


#date_range.on_change('value', update_range)
cell_select.on_change('value', update_cell)

rl_col = layouts.column(power, vi)
teros_col = layouts.column(teros_temp_vwc, teros_ec)
graphs = layouts.row(rl_col, teros_col)
layout = layouts.column(cell_select, rl_col, width=1000)

curdoc().add_root(layout)
curdoc().title = "DirtViz"

sess.close()
