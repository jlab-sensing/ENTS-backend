import { Box, Divider } from '@mui/material';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import useAuth from '../../auth/hooks/useAuth';
import Nav from '../../components/Nav';
import { useCells } from '../../services/cell';

function Map() {
  const { user, setUser, loggedIn, setLoggedIn } = useAuth();
  const cells = useCells();
  const home = { latitude: 36.95620689807501, longitude: -122.05855126777698 };
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
      <Nav user={user} setUser={setUser} loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.32)', borderWidth: '2px', borderBottomWidth: '0px' }} />
      {/* MAP PAGE */}
      <MapContainer
        center={[home.latitude, home.longitude]}
        zoom={40}
        scrollWheelZoom={true}
        style={styles.leafletContainer}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <Marker position={[home.latitude, home.longitude]}>
          <Popup>This is the location of our lab at Westside Research Park.</Popup>
        </Marker>
        {!cells.isLoading &&
          !cells.isError &&
          cells.data.map((cell) => (
            <Marker key={cell.id} position={[cell.latitude, cell.longitude]}>
              <Popup>
                {cell.name}: {cell.id}
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </Box>
  );
}
export default Map;
