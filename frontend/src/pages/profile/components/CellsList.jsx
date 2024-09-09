import { Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useUserCells } from '../../../services/cell';
import { useOutletContext } from 'react-router-dom';
import AddCellModal from './AddCellModal';

function CellsList() {
  const [user, axiosPrivate] = useOutletContext();
  const { data, isLoading, isError } = useUserCells(axiosPrivate);

  if (!user) {
    return <></>;
  }
  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (isError) {
    return <Typography>Error loading cells.</Typography>;
  }

  const columns = [
    { field: 'id', headerName: 'Cell ID', width: 90 },
    {
      field: 'name',
      headerName: 'Name',
      width: 150,
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 150,
    },
    {
      field: 'lat',
      headerName: 'Latitude',
      width: 150,
    },
    {
      field: 'long',
      headerName: 'Longitude',
      width: 150,
    },
    {
      field: 'archive',
      headerName: 'Archive',
      width: 150,
    },
  ];
  let rows;
  if (data.map) {
    rows = data.map((cell) => ({
      id: cell.id,
      name: cell.name,
      location: cell.location,
      lat: cell.latitude,
      long: cell.longitude,
      archive: cell.archive,
    }));
  } else {
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#A0A0A0',
        width: '90%',
        height: '100',
        p: 2,
        borderRadius: '10px',
      }}
    >
      <div />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          bgcolor: '#A0A0A0',
          p: 1,
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant='h5'
          sx={{ textAlign: 'center', color: '#588157', fontWeight: 'bold', flex: 1, marginRight: '-8.5%' }}
        >
          Your Cells
        </Typography>
        <AddCellModal />
      </Box>
      <DataGrid rows={rows} columns={columns} pageSize={5} />
    </Box>
  );
}

export default CellsList;
