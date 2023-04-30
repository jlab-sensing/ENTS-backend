// import "./Dashboard.css";
import { React, useState, useEffect } from "react";
import Chart from "chart.js/auto";
import { CategoryScale } from "chart.js";
import "chartjs-adapter-luxon";
import zoomPlugin from "chartjs-plugin-zoom";
import { getCellData, getCellIds } from "../../services/cell";
import PwrChart from "../../charts/pwrChart/pwrChart";
import VChart from "../../charts/vChart/vChart";
import VwcChart from "../../charts/vwcChart/vwcChart";
import TempChart from "../../charts/tempChart/tempChart";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { DateTime } from "luxon";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import DownloadBtn from "../../components/DownloadBtn";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import HorizontalRuleRoundedIcon from "@mui/icons-material/HorizontalRuleRounded";
Chart.register(CategoryScale);
Chart.register(zoomPlugin);

function Dashboard() {
  const [startDate, setStartDate] = useState(
    DateTime.now().minus({ months: 1 })
  );
  const [endDate, setEndDate] = useState(DateTime.now());
  const [dBtnDisabled, setDBtnDisabled] = useState(true);
  const [cellData, setCellData] = useState({});
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

  const updateCharts = (sC) => {
    getCellData(sC).then((response) => {
      const cellDataObj = JSON.parse(response.data);
      setCellData(cellDataObj);
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

  useEffect(() => {
    updateCharts(selectedCell);
  }, [selectedCell]);

  useEffect(() => {
    setDBtnDisabled(false);
  }, [setCellData]);

  useEffect(() => {
    getCellIds().then((response) => {
      setCellIds({
        data: JSON.parse(response.data),
      });

      // setSelectedCell();
    });
  }, []);
  useEffect(() => {
    if (cellIds.data[0]) {
      updateCharts(cellIds.data[0][0]);
      setSelectedCell(parseInt(cellIds.data[0][0]));
    }
  }, [cellIds]);

  return (
    <Stack
      direction="column"
      divider={<Divider orientation="horizontal" flexItem />}
      justifyContent="spaced-evently"
      sx={{ height: "100vh", boxSizing: "border-box" }}
    >
      <Stack
        direction="row"
        divider={<Divider orientation="vertical" flexItem />}
        alignItems="center"
        justifyContent="space-evenly"
        sx={{ p: 2 }}
        flexItem
      >
        {/* <Grid sx={{ marginTop: ".25%" }} container spacing={4}> */}
        {/* <Grid item xs="auto"> */}
        <FormControl sx={{ width: 1 / 4 }}>
          <InputLabel id="cell-select">Cell</InputLabel>
          <Select
            labelId="cell-select-label"
            id="cell-select"
            value={selectedCell}
            label="Cell"
            defaultValue={selectedCell}
            onChange={(e) => {
              setSelectedCell(e.target.value);
            }}
          >
            {cellIds.data.map(([id, name]) => {
              return (
                <MenuItem value={id} key={id}>
                  {name}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        {/* </Grid> */}
        {/* <Grid item xs="auto"> */}
        <Box display="flex" justifyContent="center" alignItems="center">
          <LocalizationProvider dateAdapter={AdapterLuxon}>
            <DateTimePicker
              label="Start Date"
              value={startDate}
              onChange={(startDate) => setStartDate(startDate)}
              views={["year", "month", "day", "hours"]}
            />
          </LocalizationProvider>
          <HorizontalRuleRoundedIcon sx={{ mr: 1, ml: 1 }} />
          <LocalizationProvider dateAdapter={AdapterLuxon}>
            <DateTimePicker
              label="End Date"
              value={endDate}
              onChange={(endDate) => setEndDate(endDate)}
              views={["year", "month", "day", "hours"]}
            />
          </LocalizationProvider>
        </Box>
        {/* </Grid> */}
        {/* <Grid item xs="auto"> */}
        <DownloadBtn disabled={dBtnDisabled} data={cellData} />
        {/* </Grid> */}
        {/* </Grid> */}
      </Stack>
      {/* <div onChange={changeCell}>
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
      </button> */}
      <Grid
        container
        sx={{ height: "75%", width: "100%", p: 2 }}
        alignItems="center"
        justifyContent="space-evenly"
        columns={{ xs: 4, sm: 8, md: 12 }}
      >
        <Grid item sx={{ height: "50%" }} xs={4} sm={4} md={5.5} p={0.25}>
          <VChart data={vChartData} />
        </Grid>
        <Grid item sx={{ height: "50%" }} xs={4} sm={4} md={5.5} p={0.25}>
          <PwrChart data={pwrChartData} />
        </Grid>
        <Grid item sx={{ height: "50%" }} xs={4} sm={4} md={5.5} p={0.25}>
          <VwcChart data={vwcChartData} />
        </Grid>
        <Grid item sx={{ height: "50%" }} xs={4} sm={4} md={5.5} p={0.25}>
          <TempChart data={tempChartData} />
        </Grid>
      </Grid>
    </Stack>
  );
}

export default Dashboard;
