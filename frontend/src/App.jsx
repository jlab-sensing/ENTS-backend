import "./App.css";
import { React, useState } from "react";

import axios from "axios";

import { Line } from "react-chartjs-2";

import Chart from "chart.js/auto";
import { CategoryScale } from "chart.js";
import "chartjs-adapter-luxon";
import zoomPlugin from "chartjs-plugin-zoom";

Chart.register(CategoryScale);
Chart.register(zoomPlugin);

function App() {
  const [tempChartData, setTempChartData] = useState({
    label: [],
    datasets: [
      {
        data: [],
        borderColor: "black",
        borderWidth: 2,
      },
    ],
  });
  const [vChartData, setVChartData] = useState({
    label: [],
    datasets: [
      {
        data: [],
        borderColor: "black",
        borderWidth: 2,
        yAxisID: "vAxis",
      },
      {
        data: [],
        borderColor: "black",
        borderWidth: 2,
        yAxisID: "cAxis",
      },
    ],
  });
  const [pwrChartData, setPwrChartData] = useState({
    label: [],
    datasets: [
      {
        label: "Voltage",
        data: [],
        borderColor: "black",
        borderWidth: 2,
      },
    ],
  });
  const [vwcChartData, setVWCChartData] = useState({
    label: [],
    datasets: [
      {
        label: "VWC",
        data: [],
        borderColor: "black",
        borderWidth: 2,
        yAxisID: "vwcAxis",
      },
      {
        label: "EC",
        data: [],
        borderColor: "black",
        borderWidth: 2,
        yAxisID: "ecAxis",
      },
    ],
  });

  const zoomOptions = {
    zoom: {
      pinch: {
        enabled: true,
      },
      mode: "xy",
    },
    pan: {
      enabled: true,
      mode: "xy",
    },
  };

  const vChartOptions = {
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
  const pwrChartOptions = {
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
  const vwcChartOptions = {
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
            day: "D",
          },
        },
      },
      ecAxis: {
        position: "right",
        beginAtZero: true,
        title: {
          display: true,
          text: "EC (µS/cm)",
        },
      },
      vwcAxis: {
        position: "left",
        beginAtZero: true,
        suggestedMax: 0.9,
        title: {
          display: true,
          text: "VWC (%)",
        },
        min: 0,
        grid: {
          drawOnChartArea: false,
        },
      },
      // yAxes: [
      //   {
      //     id: "tAxis",
      //     type: "linear",
      //     position: "right",
      //     title: {
      //       display: true,
      //       text: "Temperature (°C)",
      //     },
      //   },
      //   {
      //     id: "vwcAxis",
      //     text: "VWC (%)",
      //     position: "left",
      //     title: {
      //       display: true,
      //       text: "VWC (%)",
      //     },
      //   },
      // ],
      // vwcAxis: {
      //   title: {
      //     display: true,
      //     text: "VWC",
      //   },
      // },
    },
    plugins: {
      zoom: zoomOptions,
    },
  };
  const tempChartOptions = {
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

  async function getCellData() {
    try {
      await axios.get("http://localhost:8000/cell").then((response) => {
        const cellDataObj = JSON.parse(response.data);
        setVChartData({
          labels: cellDataObj.timestamp,
          // labels: labels,
          datasets: [
            {
              label: "Voltage (v)",
              data: cellDataObj.v,
              borderColor: "lightgreen",
              borderWidth: 2,
              fill: false,
              yAxisID: "vAxis",
              radius: 2,
              pointRadius: 2,
            },
            {
              label: "Current (µA)",
              data: cellDataObj.i,
              borderColor: "purple",
              borderWidth: 2,
              fill: false,
              yAxisID: "cAxis",
              radius: 2,
              pointRadius: 2,
            },
          ],
        });
        setPwrChartData({
          labels: cellDataObj.timestamp,
          // labels: labels,
          datasets: [
            {
              label: "Power (µV)",
              data: cellDataObj.p,
              borderColor: "orange",
              borderWidth: 2,
              fill: false,
              radius: 2,
              pointRadius: 2,
            },
          ],
        });
        setVWCChartData({
          labels: cellDataObj.timestamp,
          // labels: labels,
          datasets: [
            {
              label: "Volumetric Water Content (VWC)",
              data: cellDataObj.vwc,
              borderColor: "blue",
              borderWidth: 2,
              fill: false,
              yAxisID: "vwcAxis",
              radius: 2,
              pointRadius: 2,
            },
            {
              label: "Electrical Conductivity (µS/cm)",
              data: cellDataObj.ec,
              borderColor: "black",
              borderWidth: 2,
              fill: false,
              yAxisID: "ecAxis",
              radius: 2,
              pointRadius: 2,
            },
          ],
        });
        setTempChartData({
          labels: cellDataObj.timestamp,
          // labels: labels,
          datasets: [
            {
              label: "Temperature",
              data: cellDataObj.temp,
              borderColor: "red",
              borderWidth: 2,
              fill: false,
              radius: 2,
              pointRadius: 2,
            },
          ],
        });
        console.log(response);
      });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="App">
      <button
        type="button"
        className="btn btn-sm btn-primary"
        onClick={getCellData}
      >
        GetCellData
      </button>
      <p>test</p>
      <div className="grid-chart">
        <div>
          <Line data={vChartData} options={vChartOptions} height="100%" />
        </div>
        <div>
          <Line data={pwrChartData} options={pwrChartOptions} height="100%" />
        </div>
        <div>
          <Line data={vwcChartData} options={vwcChartOptions} height="100%" />
        </div>
        <div>
          <Line data={tempChartData} options={tempChartOptions} height="100%" />
        </div>
      </div>
    </div>
  );
}

export default App;
