import { React } from "react";
import { Box, Typography } from "@mui/material";
import aboutBg from "../../assets/about-bg.jpg";

function Intro() {
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
        backgroundImage: `url(${aboutBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* About PAGE */}
      <Typography
        variant="h2"
        component="h1"
        sx={{ color: "#344E41", textAlign: "center", my: "20vh" }}
      >
        A SENTENCE ABOUT THE PURPOSE OF MFCS
      </Typography>
    </Box>
  );
}

export default Intro;
