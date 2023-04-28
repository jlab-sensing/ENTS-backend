import { React, useState } from "react";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-luxon";
import zoomPlugin from "chartjs-plugin-zoom";
import { zoomOptions } from "../defaultChartOptions";

export default function PwrChart({ data }) {
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

  return (
    <div className="pwr-chart">
      <Line data={data} options={chartOptions} />
    </div>
  );
}
