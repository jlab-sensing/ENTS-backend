import React from 'react';
import { Box } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import Nav from '../../components/Nav';

function Map() {
  const styles = {
    leafletContainer: {
      width: '100%',
      height: '100vh',
    },
  };
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        position: 'relative',
        scrollSnapAlign: 'center',
        scrollSnapStop: 'always',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#DAD7CD',
      }}
    >
      <Nav />
      {/* MAP PAGE */}
      <MapContainer
        center={[36.95620689807501, -122.05855126777698]}
        zoom={40}
        scrollWheelZoom={true}
        style={styles.leafletContainer}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <Marker position={[36.95620689807501, -122.05855126777698]}>
          <Popup>This is the location of our lab at Westside Research Park.</Popup>
        </Marker>
      </MapContainer>
    </Box>
  );
}
export default Map;
