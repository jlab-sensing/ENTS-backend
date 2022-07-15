#!/usr/bin/env python3

import pdb

import pandas as pd

from bokeh.plotting import figure, show
from bokeh.models import ColumnDataSource, LinearAxis, Range1d, DatetimeRangeSlider
from bokeh.io import curdoc
from bokeh.layouts import column, row


# Read soil date
# NOTE: read_csv skips blank lines therefore the header index is 9
# The data has two current channels and the I1L_valid and I2L_valid indicate
# which channels is currently being used. For now only I*L are valid
raw = pd.read_csv("soil_20220629-214516_8.csv", header=9,
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
moving_avg = raw.resample('10min').mean()

# Plot Power
power = figure(
    title="Power Measurements",
    x_axis_label='Date',
    x_axis_type="datetime",
    y_axis_label='Power [uW]',
    aspect_ratio=2.,
)
power.line(moving_avg.index, moving_avg["P1"], legend_label="P1")


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
vi.line(moving_avg.index, moving_avg["V1"], legend_label="V1", color="green")
vi.line(moving_avg.index, moving_avg["I1L"], legend_label="I1L",
        y_range_name="I", color="red")

#pdb.set_trace()
date_range= DatetimeRangeSlider(title="Date Range",
                                start=moving_avg.index[0],
                                end=moving_avg.index[-1],
                                value=(moving_avg.index[0],
                                       moving_avg.index[-1]),
                                step=100000,
                                )

#def update_data(attrname, old, new):


graph_col = column(power, vi, sizing_mode="fixed")
layout = row(date_range, graph_col)

curdoc().add_root(layout)
curdoc().title = "MFC"
