import { React } from "react";
import { Button } from "@mui/material";
import PropTypes from "prop-types";

function DownloadBtn(props) {
  const data = Object.values(props.data);
  const disabled = props.disabled;
  const downloadFile = ({ data, fileName, fileType }) => {
    const blob = new Blob([data], { type: fileType });

    const a = document.createElement("a");
    a.download = fileName;
    a.href = window.URL.createObjectURL(blob);
    const clickEvt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    a.dispatchEvent(clickEvt);
    a.remove();
  };
  /** 
    exports cell data from json obj to csv.
    runs with static number of headers
  **/
  const exportToCsv = (e) => {
    e.preventDefault();

    // Headers for each column
    let headers = ["Timestamp,vwc,temp,ec,v,i,p"];

    // Convert cell data
    const csvData = [];
    for (let i = 0; i < data[0].length; i++) {
      csvData.push(
        [
          data[0][i],
          data[1][i],
          data[2][i],
          data[3][i],
          data[4][i],
          data[5][i],
          data[6][i],
        ].join(",")
      );
    }

    downloadFile({
      data: [...headers, ...csvData].join("\n"),
      fileName: "data.csv",
      fileType: "text/csv",
    });
  };
  return (
    <div className="DownloadBtn">
      <Button disabled={disabled} variant="outlined" onClick={exportToCsv}>
        Export to CSV
      </Button>
    </div>
  );
}

DownloadBtn.propTypes = {
  data: PropTypes.object,
  disabled: PropTypes.bool,
};

export default DownloadBtn;
