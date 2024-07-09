import { React, useState } from 'react';
import { DateTime } from 'luxon';
import DownloadBtn from './components/DownloadBtn';
import { Box, Grid, Stack, Divider, Button, Modal } from '@mui/material';
import Archive from '../../assets/archive.svg';
import DateRangeSel from './components/DateRangeSel';
import CellSelect from './components/CellSelect';
import PowerCharts from './components/PowerCharts';
import TerosCharts from './components/TerosCharts';
import BackBtn from './components/BackBtn';
import SensorChart from './components/SensorChart';
import Fade from '@mui/material/Fade';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { DropList } from './components/DropList/DropList';
import { arrayMove } from '@dnd-kit/sortable';
import { useCells } from '../../services/cell';
import { setCellArchive } from '../../services/cell';
function Dashboard() {
  const [startDate, setStartDate] = useState(DateTime.now().minus({ days: 14 }));
  const [endDate, setEndDate] = useState(DateTime.now());
  const [dBtnDisabled, setDBtnDisabled] = useState(true);
  const [selectedCells, setSelectedCells] = useState([]);
  const [stream, setStream] = useState(false);
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const cells = useCells();

  const [cellsList, setCellsList] = useState(cells?.data?.map((cell) => ({
    
    id: cell.id,
    title: cell.name,
    columnID: cell.archive ? 'archive' : 'unarchive'
  })));
 /* const [unarchive, setUnarchive] = useState(
    Array.isArray(cells.data)
      ? cells.data.filter((cell) => !cell.archive ).map((cell) => {
          return (
            {key: cell.key, id: cell.id, title: cell.name, columnID: 'unarchive'}
          );
        })
      : ''
  );

  const [archive, setArchive] = useState(
    Array.isArray(cells.data)
      ? cells.data.filter((cell) => cell.archive ).map((cell) => {
          return (
            {id: cell.id, title: cell.name, columnID: 'archive'}
          );
        })
      : ''
  ); */

  const handleDragStart = (event) => {
      return;
  };

  const onDragOver = (event) => {
    const{active, over} = event;
    if(!over) return;

    const overID = over.id;
    const activeID = active.id;
    if (overID === activeID) return;
    
    const isActiveATask = active.id != 'unarchive' && active.id != 'archive';
    const isOverATask = over.id != 'unarchive' && over.id != 'archive';

    if(!isActiveATask) return;
    /// Both active and over are tasks
    
    if(isActiveATask && isOverATask){
      setCellsList((cellsList) => {
      const overIndex = cellsList.findIndex((task) => task.id === overID);
      const activeIndex = cellsList.findIndex((task) => task.id === activeID);
      ///If the tasks are in different columns
      if(cellsList[activeIndex].columnID != cellsList[overIndex].columnID){
        console.log('1')
        cellsList[activeIndex].columnID = cellsList[overIndex].columnID;
        setCellArchive(activeID, cellsList[overIndex].columnID === 'archive' ? true : false);
        arrayMove(cellsList, activeIndex, overIndex - 1);
      }
      else{
      ///If the tasks are in the same column
        console.log('2')
        arrayMove(cellsList, activeIndex, overIndex );}
  })}
    /// If the active is a task and the over is a column
    if(isActiveATask && !isOverATask){
      setCellsList((cellsList) => {
        console.log('3')
        const activeIndex = cellsList.findIndex((task) => task.id === activeID);
        cellsList[activeIndex].columnID = cellsList[activeIndex].columnID === 'archive' ? 'unarchive' : 'archive';
        setCellArchive(activeID, cellsList[activeIndex].columnID === 'archive' ? true : false);
      })}  
  
  
}

  return (
    <>
    <Box>
      <Stack
        direction='column'
        divider={<Divider orientation='horizontal' flexItem />}
        justifyContent='spaced-evently'
        sx={{ height: '100vh', boxSizing: 'border-box' }}
      >
        <Stack direction='row' alignItems='center' justifyContent='space-evenly' sx={{ p: 2 }} flex>
          <BackBtn />
          <CellSelect selectedCells={selectedCells} setSelectedCells={setSelectedCells} />
          <Box display='flex' justifyContent='center' alignItems='center'>
            <DateRangeSel
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            ></DateRangeSel>
          </Box>
          <Button
            variant='outlined'
            onClick={handleOpen}
            sx={{heigh: "16px", width: "16px"}}
          >
           <Box component='img' src={Archive} ></Box>
          </Button>
          <DownloadBtn
            disabled={dBtnDisabled}
            setDBtnDisabled={setDBtnDisabled}
            cells={selectedCells}
            startDate={startDate}
            endDate={endDate}
          />
          <Button
            variant='outlined'
            onClick={() => {
              console.log('test');
              setStream(!stream);
            }}
          >
            {stream ? 'streaming' : 'hourly'}
          </Button>
        </Stack>
        <Grid
          container
          spacing={3}
          sx={{ height: '100%', width: '100%', p: 2 }}
          alignItems='center'
          justifyContent='space-evenly'
          columns={{ xs: 4, sm: 8, md: 12 }}
        >
          <PowerCharts cells={selectedCells} startDate={startDate} endDate={endDate} stream={stream} />
          <TerosCharts cells={selectedCells} startDate={startDate} endDate={endDate} stream={stream} />
        </Grid>
      </Stack>

      <Stack
        direction='column'
        divider={<Divider orientation='horizontal' flexItem />}
        justifyContent='spaced-evently'
        sx={{ height: '100vh', boxSizing: 'border-box' }}
      >
        <SensorChart cells={selectedCells} startDate={startDate} endDate={endDate} stream={stream} />
      </Stack>
      <Modal open={open} onClose={handleClose} closeAfterTransition>
        <Fade in={open}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '70%',
              height: '70%',
              bgcolor: 'background.paper',
              border: '1px solid #000',
              boxShadow: 24,
              p: 3,
            }}
          >
            
            <h1>Archive</h1>
            <DndContext collisionDetection={closestCenter} onDragOver={onDragOver} onDragStart={handleDragStart}>
              <Stack direction="row"   divider={<Divider orientation="vertical" flexItem sx={{ borderWidth: '.5px', borderColor: 'lightgray' }}/>} spacing = {2}>
                <div style={{flex: 1, Width:'50%', minHeight: '200px', maxHeight: '100vh', border: '2px solid #ccc', overflowY: 'auto', paddingBottom: '264px'}}>
                  <h2 style = {{textAlign: 'center', textDecoration: 'underline'}}>Unarchive</h2>
                  <DropList id="unarchive" dragItems={cellsList.filter((item) => item.columnID === 'unarchive')} columnID='unarchive'/>
                </div>
                <div style={{flex:1, Width: '50%', minHeight: '200px', maxHeight: '100vh' ,border: '2px solid #ccc', overflowY: 'auto', paddingBottom: '264px'}}>
                  <h2 style = {{textAlign: 'center', textDecoration: 'underline'}}>Archive</h2>
                  <DropList id="archive" dragItems={cellsList.filter((item) => item.columnID === 'archive')} columnID='archive'/>
                </div>
              </Stack>
            </DndContext>
            <Button onClick={handleClose} style = {{border: '2px gray'}}>Close</Button>
          </Box>
        </Fade>
      </Modal>
    </Box>
</>
  ); }
export default Dashboard;
