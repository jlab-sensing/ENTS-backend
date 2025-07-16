import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, IconButton, Modal, TextField, Typography } from '@mui/material';
import { React, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { deleteCell } from '../../../services/cell';

function DeleteCellModal( {id} ) {
  let data = useOutletContext();
  const refetch = data[3];
  const user = data[4];
  data = data[0];
  const [isOpen, setOpen] = useState(false);
  const [response, setResponse] = useState(null);
  const [cellId, setCellId] = useState('');

  const handleOpen = () => {
    setOpen(true);
    setResponse(null);
    setCellId(id);
  };

  const handleClose = () => {
    setOpen(false);
    setResponse(null);
    setCellId('');
  };

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
          {cellId!='' && response == null && (
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
          {cellId!='' && response && (
            <>
              <IconButton
                sx={{ position: 'absolute', top: 5, right: 5 }}
                aria-label='close'
                size='small'
                onClick={handleClose}
              >
                <CloseIcon fontSize='small' />
              </IconButton>

              {/* Success Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 28 }} />
                <Typography variant='h5' component='h2' sx={{ color: 'success.main', fontWeight: 'bold' }}>
                  Cell Deleted Successfully!
                </Typography>
              </Box>

              {/* Deletion Confirmation */}
              <Typography variant='h6' sx={{ mb: 2, color: 'text.primary' }}>
                The cell with ID <strong>{cellId}</strong> has been successfully deleted.
              </Typography>

              {/* Done Button */}
              <Button
                variant='contained'
                color='success'
                onClick={handleClose}
                sx={{
                  width: '100%',
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                }}
              >
                Done
              </Button>
            </>
          )}
        </Box>
      </Modal>
    </>
  );
}

export default DeleteCellModal;
