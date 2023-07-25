import { React } from "react";
import Nav from "../../components/Nav";
import { Box, Button, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import chart from "../../assets/chart.svg";
import { useNavigate } from "react-router-dom";

function About() {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        position: "relative",
        scrollSnapAlign: "center",
        scrollSnapStop: "always",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#DAD7CD",
      }}
    >
      <Nav></Nav>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          flexGrow: 1,
          paddingTop: "2.5%",
          paddingRight: "5%",
          paddingLeft: "5%",
        }}
      >
        <Box
          maxWidth="sm"
          sx={{
            display: "flex",
            flexGrow: "1",
            flexDirection: "column",
            alignItems: "start",
            gap: "5%",
          }}
        >
          <Typography variant="h4" component="h1">
            A DATA VISUALIZATION PROGRAM FOR XYZ
          </Typography>
          <Typography variant="subtitle1" component="sub">
            sub-header to explain use case.... Lorem ipsum dolor sit amet,
            consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
            labore et dolore magna aliqua. In aliquam sem fringilla ut. Sed
            egestas egestas fringilla phasellus faucibus scelerisque.
          </Typography>
          <Box maxWidth="sm" sx={{ display: "flex", flexDirection: "row" }}>
            <Button
              sx={{
                backgroundColor: "#B3C297",
                "&:hover": {
                  backgroundColor: "#A3B18A",
                },
                color: "#364F42",
              }}
            >
              Checkout live data
            </Button>
            <Button key="map" onClick={() => navigate("/map")}>
              View Map
            </Button>
          </Box>
        </Box>
        <Box
          component="img"
          sx={{ alignSelf: "start", width: "auto" }}
          src={chart}
        ></Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          paddingBottom: "5%",
          justifySelf: "flex-end",
          alignSelf: "center",
          alignItems: "center",
        }}
      >
        <p>Learn more!</p>
        <ExpandMoreIcon></ExpandMoreIcon>
      </Box>
    </Box>
  );
}

export default About;
