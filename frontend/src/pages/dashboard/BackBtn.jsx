import { React } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useNavigate } from 'react-router-dom';

function BackBtn() {
  const navigate = useNavigate();
  return (
    <button key='prev' onClick={() => navigate(-1)}>
      <img src={ChevronLeftIcon} />
    </button>
  );
}

export default BackBtn;
