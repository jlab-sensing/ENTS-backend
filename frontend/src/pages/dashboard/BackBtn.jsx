import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

function BackBtn() {
  <Button
    key='map'
    onClick={() => navigate('/map')}
    sx={{ my: 2, color: 'black', display: 'block' }}
  >
    Map
  </Button>;
  return (
    <button key='prev' onClick={() => navigate('/map')}>
      <img src={ChevronLeftIcon} />
    </button>
  );
}

export default BackBtn;
