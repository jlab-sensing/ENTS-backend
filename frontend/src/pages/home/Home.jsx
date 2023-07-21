import { React } from "react";
import Nav from "../../components/Nav";
import { Container, Box, Button } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import chartsHome from "../../assets/chartsHome.png";

function Home() {
  return (
    <Container
      disableGutters={true}
      maxWidth={false}
      sx={{
        height: "100vh",
        width: "100vw",
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
          justifyContent: "space-evenly",
          flexGrow: 1,
        }}
      >
        <Box
          maxWidth="sm"
          sx={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h1>A data visualization application for xyz</h1>
          <p>
            sub-header to explain use case.... Lorem ipsum dolor sit amet,
            consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
            labore et dolore magna aliqua. In aliquam sem fringilla ut. Sed
            egestas egestas fringilla phasellus faucibus scelerisque.
          </p>
          <Box maxWidth="sm" sx={{ display: "flex", flexDirection: "row" }}>
            <Button>Checkout live data</Button>
            <Button>Learn More</Button>
          </Box>
        </Box>
        <Box>
          <img src="chartsHome"></img>
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-evenly",
          paddingBottom: "5%",
          justifySelf: "flex-end",
        }}
      >
        <ExpandMoreIcon></ExpandMoreIcon>
      </Box>
    </Container>
  );
}

export default Home;
