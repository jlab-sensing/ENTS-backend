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
from .db.getters import get_power_data, get_teros_data

sess = Session(engine)

# Create cell select widget
stmt = select(Cell).order_by(Cell.name)
cell_options = [(str(c.id), c.__repr__()) for c in sess.scalars(stmt)]
cell_select = Select(options=cell_options)


# Read TEEROS data
teros_data = get_teros_data(sess, int(cell_options[0][0]))
teros_source = ColumnDataSource(teros_data)

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
teros_ec.line("timestamp", "ec", source=teros_source,
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
layout = layouts.column(cell_select, graphs, width=1000)

curdoc().add_root(layout)
curdoc().title = "DirtViz"

sess.close()
