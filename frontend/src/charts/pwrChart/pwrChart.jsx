import { React } from "react";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-luxon";
import { zoomOptions } from "../defaultChartOptions";
import PropTypes from "prop-types";

export default function PwrChart(props) {
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
            day: "D",
          },
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Power (µV)",
        },
      },
    },
    plugins: {
      zoom: zoomOptions,
    },
  };

  return <Line data={data} options={chartOptions} />;
}

PwrChart.propTypes = {
  data: PropTypes.object,
};
