import { React } from 'react';
import { Button } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { useNavigate } from 'react-router-dom';

function BackBtn() {
  const navigate = useNavigate();
  return (
    <Button sx={{ color: 'black' }} key='prev' onClick={() => navigate('/')}>
      <NavigateBeforeIcon />
    </Button>
  );
}

export default BackBtn;
