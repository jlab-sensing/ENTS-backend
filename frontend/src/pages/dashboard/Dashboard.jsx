import { React, useState } from 'react';
import { DateTime } from 'luxon';
import DownloadBtn from './components/DownloadBtn';
import { Box, Grid, Stack, Divider, Button, Modal } from '@mui/material';
import archive from '../../assets/archive.svg'
import DateRangeSel from './components/DateRangeSel';
import CellSelect from './components/CellSelect';
import PowerCharts from './components/PowerCharts';
import TerosCharts from './components/TerosCharts';
import BackBtn from './components/BackBtn';
import SensorChart from './components/SensorChart';
import Fade from '@mui/material/Fade';
import {DndContext, closestCenter} from '@dnd-kit/core';
import { Column } from './components/Column/Column';
import { arrayMove } from '@dnd-kit/sortable';
import { useCells } from '../../services/cell';
import { setCellArchive } from '../../services/cell';
import { CellDrag } from './components/CellDrag/CellDrag';

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
  const [Unarchive, setDraggableUnarchive] = useState(
    Array.isArray(cells.data)
      ? cells.data.filter((cell) => !cell.archive ).map((cell) => {
          return (
            {id: cell.id, title: cell.name}
          );
        })
      : ''

  );
  const [Archive, setDraggableArchive] = useState(
    Array.isArray(cells.data)
      ? cells.data.filter((cell) => cell.archive ).map((cell) => {
          return (
            {id: cell.id, title: cell.name}
          );
        })
      : ''
  );

const getCellPosUnarchive = (id) => Unarchive.findIndex((CellDrag) => CellDrag.id === id)
const getCellPosArchive = (id) => Archive.findIndex((CellDrag) => CellDrag.id === id)

const handleDragStart = (event) => {
  setActiveId(event.active.id);
};

const handleDragEnd = (event) => { const {active, over} = event;


  const sourceColumn = Unarchive.find(item => item.id === active.id) ? 'Unarchive' : 'Archive';
  const destinationColumn = Unarchive.find(item => item.id === over.id) ? 'Unarchive' : 'Archive';

  if (sourceColumn === destinationColumn) {
  /// Move the item within the same column
  if (sourceColumn === 'Unarchive') {
    if (active.id === over.id) return;
    setDraggableUnarchive((items) => {
    const originalPos = getCellPosUnarchive(active.id);
    const newPos = getCellPosUnarchive(over.id);
    return arrayMove(Unarchive, originalPos, newPos);
   });
  } else {
    if (active.id === over.id) return;
    setDraggableArchive((items) => {
    const originalPos = Archive.findIndex(item => item.id === active.id);
    const newPos = Archive.findIndex(item => item.id === over.id);
    return arrayMove(Archive, originalPos, newPos);
  }) }
  /// Move the item between columns
} else {
  if (sourceColumn === 'Unarchive') {
    setDraggableUnarchive((items) => items.filter(item => item.id !== active.id));
    setDraggableArchive((items) => [...items, Unarchive.find(item => item.id === active.id)]);
    setCellArchive(active.id, true);
  } else {
    setDraggableArchive((items) => items.filter(item => item.id !== active.id));
    setDraggableUnarchive((items) => [...items, Archive.find(item => item.id === active.id)]);
    setCellArchive(active.id, false);
  }
}
};

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
           <Box component='img' src={archive} ></Box>
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
          <DndContext collisionDetection = {closestCenter} onDragEnd = {handleDragEnd}>
            <Stack direction = "row" justifyContent={'space-evenly'}>
              <Column id = "unarchive" CellDrags = {Unarchive} />
              <Column id = "archive" CellDrags = {Archive} />
            </Stack>
          </DndContext>
          <Button onClick={handleClose}>Close</Button>
        </Box>
        </Fade>
      </Modal>
    </Box>
    </>
  );
}

export default Dashboard;
