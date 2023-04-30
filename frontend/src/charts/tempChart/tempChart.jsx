import { React } from "react";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-luxon";
import { zoomOptions } from "../defaultChartOptions";
import PropTypes from "prop-types";

export default function TempChart(props) {
  const data = props.data;
  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        position: "bottom",
        title: {
          display: true,
          text: "Time",
        },
        type: "time",
        ticks: {
          autoSkip: false,
          autoSkipPadding: 50,
          maxRotation: 0,
          major: {
            enabled: true,
          },
        },
        time: {
          displayFormats: {
            hour: "hh:mm a",
            day: "MM/dd",
          },
        },
      },
      y: {
        type: "linear",
        position: "left",
        beginAtZero: true,
        suggestedMax: 35,
        title: {
          display: true,
          text: "Temperature (°C)",
        },
      },
    },
    plugins: {
      zoom: zoomOptions,
    },
  };

  return (
    <div className="temp-chart">
      <Line data={data} options={chartOptions} />
    </div>
  );
}
TempChart.propTypes = {
  data: PropTypes.object,
};
