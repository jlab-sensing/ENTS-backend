import { React } from 'react';
import { Container } from '@mui/material';
import About from './About';
import Intro from './Intro';
function Home() {
  return (
    <Container
      disableGutters={true}
      maxWidth={false}
      sx={{
        height: '100vh',
        width: '100vw',
        overflowY: 'auto',
        overscrollBehaviorY: 'contain',
        scrollSnapType: 'y mandatory',
      }}
    >
      <About />
      <Intro />
    </Container>
  );
}

export default Home;
