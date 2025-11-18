import { Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useOutletContext } from 'react-router-dom';
import AddCellModal from './AddCellModal';
import DeleteCellModal from './DeleteCellModal';
import EditCellModal from './EditCellModal';
import { React, useState } from 'react';
import ShareButton from './ShareButton';

function CellsList() {
  let data = useOutletContext();
  const isLoading = data[1];
  const isError = data[2];
  const user = data[4];
  data = data[0];
  const [selectedRowsId, setSelectedRowsId] = useState([]);

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
    setSelectedRowsId(newSelection);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#A0A0A0',
        width: { xs: '100%', sm: '95%', md: '90%' },
        maxWidth: '1400px',
        minHeight: { xs: 'calc(100vh - 80px)', md: '100vh' },
        p: { xs: 1, sm: 1.5, md: 2 },
        borderRadius: '10px',
        flexGrow: 1,
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          bgcolor: '#A0A0A0',
          p: 1,
          justifyContent: 'space-between',
          gap: { xs: 1, sm: 0 },
        }}
      >
        <Typography
          variant='h5'
          sx={{
            textAlign: { xs: 'left', sm: 'center' },
            color: '#588157',
            fontWeight: 'bold',
            flex: { xs: 'unset', sm: 1 },
            marginRight: { xs: 0, sm: '-8.5%' },
            mb: { xs: 1, sm: 0 },
          }}
        >
          Your Cells
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <ShareButton ids={selectedRowsId} />
          <AddCellModal />
          <DeleteCellModal ids={selectedRowsId} />
        </Box>
      </Box>

      {/* Wrapper to ensure DataGrid does not exceed background */}
      <Box
        sx={{
          flexGrow: 1,
          height: '100%',
          overflowX: 'auto',
          overflowY: 'auto',
          width: '100%',
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          checkboxSelection={true}
          autoHeight
          onRowSelectionModelChange={handleRowSelection}
          sx={{
            minWidth: { xs: '600px', sm: 'unset' },
          }}
        />
      </Box>
    </Box>
  );
}

export default CellsList;
