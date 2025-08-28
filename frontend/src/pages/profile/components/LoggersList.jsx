import { Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useOutletContext } from 'react-router-dom';
import AddLoggerModal from './AddLoggerModal';
import DeleteLoggerModal from './DeleteLoggerModal';
import EditLoggerModal from './EditLoggerModal';
import { React, useState } from 'react';

function LoggersList() {
  let data = useOutletContext();
  const user = data[4];
  
  // Logger data will be at index 6 in the outlet context (after cell data)
  const loggerData = data[6];
  const loggerIsLoading = data[7];
  const loggerIsError = data[8];
  
  const [selectedRowId, setSelectedRowId] = useState('');

  if (!user) {
    return <></>;
  }
  if (loggerData === null) {
    return;
  }
  if (loggerIsLoading) {
    return <Typography>Loading...</Typography>;
  }
  if (loggerIsError) {
    return <Typography>Error loading loggers.</Typography>;
  }

  const columns = [
    { field: 'id', headerName: 'Logger ID', width: 85 },
    { field: 'name', headerName: 'Name', width: 145 },
    { field: 'type', headerName: 'Type', width: 125 },
    { field: 'device_eui', headerName: 'Device EUI', width: 135 },
    { field: 'description', headerName: 'Description', width: 190 },
    { field: 'date_created', headerName: 'Date Created', width: 120 },
    {
      field: 'edit',
      headerName: '',
      width: 85,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => <EditLoggerModal logger={params.row} />,
    },
  ];

  let rows = [];
  if (loggerData && loggerData.map) {
    rows = loggerData.map((logger) => ({
      id: logger.id,
      name: logger.name,
      type: logger.type || '',
      device_eui: logger.device_eui || '',
      description: logger.description || '',
      date_created: logger.date_created ? new Date(logger.date_created).toLocaleDateString() : '',
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
          Your Loggers
        </Typography>
        <AddLoggerModal />
        <DeleteLoggerModal id={selectedRowId} />
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

export default LoggersList;