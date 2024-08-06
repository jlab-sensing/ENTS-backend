import { React } from 'react';
import { Container } from '@mui/material';
import About from './About';
import News from './News';
import Intro from './Intro';
import Contact from './Contact';
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
      {/* <News /> */}
      {/* <Contact /> */}
    </Container>
  );
}

export default Home;
