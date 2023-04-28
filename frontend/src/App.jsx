import "./App.css";
import { React, useState, useEffect } from "react";

import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { CategoryScale } from "chart.js";
import "chartjs-adapter-luxon";
import zoomPlugin from "chartjs-plugin-zoom";
import { getCellData, getCellIds } from "./services/cell";

Chart.register(CategoryScale);
Chart.register(zoomPlugin);

function App() {
  const [selectedCell, setSelectedCell] = useState(0);
  const [cellIds, setCellIds] = useState({
    data: [],
  });
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

  // async function getCellIds() {
  //   try {
  //     await axios
  //       .get(`${process.env.PUBLIC_URL}/api/cell/id`)
  //       .then((response) => {
  //         setCellIds({
  //           data: JSON.parse(response.data),
  //         });
  //       });
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }

  // async function getCellData(cellId) {
  //   try {
  //     await axios
  //       .get(`${process.env.PUBLIC_URL}/api/cell/data/${cellId}`)
  //       .then((response) => {
  //         const cellDataObj = JSON.parse(response.data);
  //         setVChartData({
  //           labels: cellDataObj.timestamp,
  //           // labels: labels,
  //           datasets: [
  //             {
  //               label: "Voltage (v)",
  //               data: cellDataObj.v,
  //               borderColor: "lightgreen",
  //               borderWidth: 2,
  //               fill: false,
  //               yAxisID: "vAxis",
  //               radius: 2,
  //               pointRadius: 2,
  //             },
  //             {
  //               label: "Current (µA)",
  //               data: cellDataObj.i,
  //               borderColor: "purple",
  //               borderWidth: 2,
  //               fill: false,
  //               yAxisID: "cAxis",
  //               radius: 2,
  //               pointRadius: 2,
  //             },
  //           ],
  //         });
  //         setPwrChartData({
  //           labels: cellDataObj.timestamp,
  //           // labels: labels,
  //           datasets: [
  //             {
  //               label: "Power (µV)",
  //               data: cellDataObj.p,
  //               borderColor: "orange",
  //               borderWidth: 2,
  //               fill: false,
  //               radius: 2,
  //               pointRadius: 2,
  //             },
  //           ],
  //         });
  //         setVWCChartData({
  //           labels: cellDataObj.timestamp,
  //           // labels: labels,
  //           datasets: [
  //             {
  //               label: "Volumetric Water Content (VWC)",
  //               data: cellDataObj.vwc,
  //               borderColor: "blue",
  //               borderWidth: 2,
  //               fill: false,
  //               yAxisID: "vwcAxis",
  //               radius: 2,
  //               pointRadius: 2,
  //             },
  //             {
  //               label: "Electrical Conductivity (µS/cm)",
  //               data: cellDataObj.ec,
  //               borderColor: "black",
  //               borderWidth: 2,
  //               fill: false,
  //               yAxisID: "ecAxis",
  //               radius: 2,
  //               pointRadius: 2,
  //             },
  //           ],
  //         });
  //         setTempChartData({
  //           labels: cellDataObj.timestamp,
  //           // labels: labels,
  //           datasets: [
  //             {
  //               label: "Temperature",
  //               data: cellDataObj.temp,
  //               borderColor: "red",
  //               borderWidth: 2,
  //               fill: false,
  //               radius: 2,
  //               pointRadius: 2,
  //             },
  //           ],
  //         });
  //       });
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }
  const updateCellIds = () => {
    getCellIds().then((response) => {
      setCellIds({
        data: JSON.parse(response.data),
      });
    });
  };

  const updateCharts = (sC) => {
    getCellData(sC).then((response) => {
      const cellDataObj = JSON.parse(response.data);
      setVChartData({
        labels: cellDataObj.timestamp,
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
    });
  };

  function changeCell(e) {
    setSelectedCell(e.target.value);
  }

  useEffect(() => {
    updateCharts(selectedCell);
  }, [selectedCell]);

  useEffect(() => {
    updateCellIds();
    getCellIds();
  }, []);

  return (
    <div className="App">
      <div onChange={changeCell}>
        {cellIds.data.map(([id, name]) => {
          return (
            <div key={id}>
              <input type="radio" value={id} name="selectCell" /> {name}
            </div>
          );
        })}
      </div>
      <button type="button" className="btn2" onClick={getCellIds}>
        GetCellIds
      </button>
      <button
        type="button"
        className="btn btn-sm btn-primary"
        onClick={() => updateCharts(selectedCell)}
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
