import { React, useState } from "react";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import "chartjs-adapter-luxon";
import zoomPlugin from "chartjs-plugin-zoom";
import { zoomOptions } from "../defaultChartOptions";

export default function VChart({ data }) {
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
            hour: "hh:mm",
            day: "D",
          },
        },
      },
      vAxis: {
        position: "left",
        beginAtZero: true,
        title: {
          display: true,
          text: "Cell Voltage (V)",
        },
        suggestedMax: 0.28,
        min: 0,
        stepSize: 5,
        grid: {
          drawOnChartArea: false,
        },
      },
      cAxis: {
        position: "right",
        beginAtZero: true,
        title: {
          display: true,
          text: "Current (µA)",
        },
      },
    },
    plugins: {
      zoom: zoomOptions,
    },
  };

  return (
    <div className="v-chart">
      <Line data={data} options={chartOptions} />
    </div>
  );
}
