import { Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useOutletContext } from 'react-router-dom';
import AddCellModal from './AddCellModal';
import DeleteCellModal from './DeleteCellModal';
import EditCellModal from './EditCellModal';
import { React, useState } from 'react';

function CellsList() {
  let data = useOutletContext();
  const isLoading = data[1];
  const isError = data[2];
  const user = data[4];
  data = data[0];
  const [selectedRowId, setSelectedRowId] = useState('');

  if (!user) {
    return <></>;
  }
  if (data === null) {
    return;
  }
  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }
  if (isError) {
    return <Typography>Error loading cells.</Typography>;
  }

  const columns = [
    { field: 'id', headerName: 'Cell ID', width: 90 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'location', headerName: 'Location', width: 150 },
    { field: 'lat', headerName: 'Latitude', width: 150 },
    { field: 'long', headerName: 'Longitude', width: 150 },
    { field: 'archive', headerName: 'Archive', width: 150 },
    {
      field: 'edit',
      headerName: '',
      width: 85,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => <EditCellModal cell={params.row} />, // edit button in new column
    },
  ];

  let rows = [];
  if (data.map) {
    rows = data.map((cell) => ({
      id: cell.id,
      name: cell.name,
      location: cell.location,
      lat: cell.latitude,
      long: cell.longitude,
      archive: cell.archive,
    }));
  }

  const handleRowSelection = (newSelection) => {
    setSelectedRowId(newSelection[0]);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#A0A0A0',
        width: '90%',
        minHeight: '100vh',
        p: 2,
        borderRadius: '10px',
        flexGrow: 1,
      }}
    >
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
          sx={{
            textAlign: 'center',
            color: '#588157',
            fontWeight: 'bold',
            flex: 1,
            marginRight: '-8.5%',
          }}
        >
          Your Cells
        </Typography>
        <AddCellModal />
        <DeleteCellModal id={selectedRowId} />
      </Box>

      {/* Wrapper to ensure DataGrid does not exceed background */}
      <Box
        sx={{
          flexGrow: 1,
          height: '100%',
          overflowY: 'auto',
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          autoHeight
          onRowSelectionModelChange={handleRowSelection}
        />
      </Box>
    </Box>
  );
}

export default CellsList;
