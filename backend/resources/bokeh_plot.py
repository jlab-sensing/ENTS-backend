#!/usr/bin/env python3

"""
Implements the bokeh plots mirring those generated from show_twobat.py from
original data processing. There is a datetime slider that adjusts the range of
the graphs. The script uses the interal bokeh server to serve the graphs.

Notes
-----
All statements involving the database should be put inside of functions to
prevent overwritting of the global namespace.

Todo
----
    - Display key statistics (max power)

.. moduleauthor:: John Madden <jtmadden@ucsc.edu>
"""

from flask_restful import Resource
import json


from bokeh.plotting import figure
from bokeh.models import (ColumnDataSource, LinearAxis, Range1d, Select)
# from bokeh.io import curdoc
from bokeh import layouts
from bokeh.embed import json_item

from sqlalchemy.orm import Session
from sqlalchemy import select

from ..db.conn import engine
from ..db.tables import Cell
from ..db.getters import get_power_data, get_teros_data

# Create empty data sources
teros_source = ColumnDataSource()
source = ColumnDataSource()


class BokehPlot(Resource):
    def get(self):
        def update_data(cell_id):
            """Updates plotted data

            Selects cell data from database and updates the ColumnDataSource for
            power and teros data.

            Parameters
            ----------
            cell_id : int
                cell_id to update data from
            """

            with Session(engine) as sess:
                teros_source.data = get_teros_data(sess, cell_id)
                source.data = get_power_data(sess, cell_id)

        def get_cells():
            """Gets identifiers for each of the cells

            Returns
            -------
            list(tuple)
                Each tuple is in the format of (id, repr) where both are strings. The
                id is the cell_id from the database and repr is the identification
                string of the cell.
            """

            with Session(engine) as sess:
                # Create cell select widget
                stmt = select(Cell).order_by(Cell.name)
                opts = [(str(c.id), repr(c)) for c in sess.scalars(stmt)]
                return opts

        cell_opts = get_cells()
        cell_select = Select(options=cell_opts)
        update_data(int(cell_opts[0][0]))

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
            y_range=Range1d(start=0, end=1.),
            x_axis_type="datetime",
            aspect_ratio=2.,
        )

        # Create separate y axis for current
        vi.extra_y_ranges = {"I": Range1d(start=0, end=200)}
        vi.add_layout(LinearAxis(
            axis_label="Current [uA]", y_range_name="I"), 'right')

        # Plot data
        vi.line("timestamp", "v", source=source,
                legend_label="V1", color="green")
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

        teros_temp_vwc.line("timestamp", "vwc",
                            source=teros_source, legend_label="VWC")
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

        # date_range= DatetimeRangeSlider(
        #    title="Date Range",
        #    start=rl_data.index[0],
        #    end=rl_data.index[-1],
        #    value=(rl_data.index[0], rl_data.index[-1]),
        #    step=100000,
        # )

        # pylint: disable=unused-argument

        def update_cell(attrname, old, new):
            """Callback to update the data source based on the selected cell"""

            update_data(int(new))

        # date_range.on_change('value', update_range)
        cell_select.on_change('value', update_cell)

        rl_col = layouts.column(power, vi)
        teros_col = layouts.column(teros_temp_vwc, teros_ec)
        graphs = layouts.row(rl_col, teros_col)
        layout = layouts.column(cell_select, graphs, width=1000)

        # curdoc().add_root(layout)
        # curdoc().title = "DirtViz"

        return json.dumps(json_item(layout, "Dirtviz"))

    def post(self):
        pass
