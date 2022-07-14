#!/usr/bin/env python3

import pdb

import pandas as pd

from bokeh.plotting import figure, show
from bokeh.models import LinearAxis, Range1d
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
# Calculate power
raw["P1"] = raw["V1"] * raw["I1L"]
raw["P2"] = raw["V2"] * raw["I2L"]

# Calculate moving average
moving_avg = raw.resample('10min').mean()

# Plot Power
power = figure(title="Power Measurements", x_axis_label='time [s]',
           y_axis_label='Power [Watts]')
power.line(moving_avg.index, moving_avg["P1"], legend_label="Power")

# Plot voltage/current
vi = figure(title="Voltage/Current Measurements", x_axis_label='time',
            y_axis_label='V [V}')

# Create separate y axis for current
vi.extra_y_ranges = {"I": Range1d(start=0, end=2*moving_avg["I1L"].max())}
vi.add_layout(LinearAxis(axis_label="I [uA]", y_range_name="I"), 'right')

# Plot data
for vcols in ["V1", "V2"]:
    vi.line(moving_avg.index, moving_avg[vcols], legend_label=vcols)
for icols in ["I1L", "I2L"]:
    vi.line(moving_avg.index, moving_avg[icols], legend_label=icols,
            y_range_name="I")

curdoc().add_root(column(power, vi, sizing_mode="stretch_both"))
curdoc().title = "MFC"
