import { React, useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, TextField, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { deleteCell } from '../../../services/cell';
import { useOutletContext } from 'react-router-dom';

function DeleteCellModal() {
  let data = useOutletContext();
  const refetch = data[3];
  const user = data[4];
  data = data[0];
  const [isOpen, setOpen] = useState(false);
  const [cellId, setCellId] = useState('');
  const [response, setResponse] = useState(null);

  const handleOpen = () => {
    setOpen(true);
    setResponse(null);
  };

  const handleClose = () => setOpen(false);

  useEffect(() => {
    console.log(response);
  }, [response]);

  if (!user) {
    return <></>;
  }

  return (
    <>
      <Button sx={{ color: 'black' }} key='delete' onClick={handleOpen}>
        <DeleteIcon />
      </Button>
      <Modal
        open={isOpen}
        onClose={handleClose}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
          }}
          component='form'
        >
          {response == null && (
            <>
              <IconButton
                sx={{ position: 'absolute', top: 5, right: 5 }}
                aria-label='close'
                size='small'
                onClick={handleClose}
              >
                <CloseIcon fontSize='small' />
              </IconButton>
              <Typography variant='h6' component='h2'>
                Delete Cell
              </Typography>
              <Typography sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  id='outlined-basic'
                  label='Cell ID'
                  variant='outlined'
                  error={cellId.length === 0 || isNaN(Number(cellId))}
                  helperText={
                    !cellId.length ? 'Cell ID is required' : isNaN(Number(cellId)) ? 'Please enter a valid number' : ''
                  }
                  value={cellId}
                  onChange={(e) => {
                    setCellId(e.target.value);
                  }}
                />
              </Typography>
              <Button
                onClick={() => {
                  deleteCell(cellId)
                    .then((res) => {
                      setResponse(res);
                      refetch();
                    })
                    .catch((error) => console.error(error));
                }}
                color='error'
              >
                Delete Cell
              </Button>
            </>
          )}

          {response && (
            <>
              <IconButton
                sx={{ position: 'absolute', top: 5, right: 5 }}
                aria-label='close'
                size='small'
                onClick={handleClose}
              >
                <CloseIcon fontSize='small' />
              </IconButton>
              <h1>Cell Deleted</h1>
              <p>The cell with ID {cellId} has been successfully deleted.</p>
              <Button onClick={handleClose}>Done</Button>
            </>
          )}
        </Box>
      </Modal>
    </>
  );
}

export default DeleteCellModal;
