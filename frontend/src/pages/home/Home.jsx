import { React } from 'react';
import { Container } from '@mui/material';
import About from './About';
import Intro from './Intro';
import TopNav from '../../components/TopNav.jsx';


function Home() {
  return (
    <Container
      disableGutters={true}
      maxWidth={false}
      sx={{
        width: '100vw',
        overflowX: 'hidden',
        p: 0,
      }}
    >
      <Intro />
      <About /> 
    </Container>
);
}

export default Home;
