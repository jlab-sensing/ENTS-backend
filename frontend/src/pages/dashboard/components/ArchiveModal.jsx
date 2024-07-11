import { React, useState, useEffect} from 'react';
import { Button, Box, Stack, Divider, Modal, Fade} from '@mui/material';
import { DndContext, closestCorners} from '@dnd-kit/core';
import { DropList } from './DropList/DropList';
import archive from '../../../assets/archive.svg';
import { arrayMove } from '@dnd-kit/sortable';
import { setCellArchive } from '../../../services/cell';

export default function ArchiveModal ({cells}){
    const [cellsList, setCellsList] = useState(cells.data.map((cell) => ({
            key: cell.id,
            id: cell.id,
            title: cell.name,
            columnID: cell.archive
          })));
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    useEffect(()=>{
    }, ([cellsList]))

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
        
        const overIndex = cellsList.findIndex((task) => task.id === overID);
        const activeIndex = cellsList.findIndex((task) => task.id === activeID);
    
        if(isOverATask){
          setCellsList((cellsList) => {
            ///If the tasks are in different columns
            if(cellsList[activeIndex].columnID !== cellsList[overIndex].columnID){
              cellsList[activeIndex].columnID = cellsList[overIndex].columnID;
              setCellArchive(activeID, cellsList[overIndex].columnID);
              return arrayMove(cellsList, activeIndex, overIndex);
            } else {
            ///If the tasks are in the same column
              return arrayMove(cellsList, activeIndex, overIndex);
            }
          })
        }
        /// If the active is a task and the over is a column
        else if(cellsList[activeIndex].columnID != (overID=== 'archive') ? true : false){
          setCellsList((cellsList) => {
            cellsList[activeIndex].columnID = !cellsList[activeIndex].columnID;
            setCellArchive(activeID, cellsList[activeIndex].columnID);
            return cellsList 
          })
        }  
    }    
  
  return (
    <>
    <Button
    variant='outlined'
    onClick={handleOpen}
    sx={{heigh: "16px", width: "16px"}}
  >
   <Box component='img' src={archive} ></Box>
  </Button>
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
      p: 3
    }}
  >
    <Stack direction='row' justifyContent='space-between' alignItems='center'>
    <h1>Archive</h1>
    <Button variant = 'outlined' onClick={handleClose} sx = {{height: '75%',}} >Close</Button>
    </Stack>
    <DndContext collisionDetection={closestCorners}  onDragOver ={onDragOver} >
      <Stack direction="row"  sx = {{width: '100%', height: '80%', paddingTop: '20px'}} divider={<Divider orientation="vertical" flexItem sx={{ borderWidth: '.5px', borderColor: 'lightgray' }}/>} spacing = {2}>
        <div style={{flex: 1, Width:'50%', minHeight: '200px', maxHeight: '80vh', border: '2px solid #ccc', overflowY: 'auto', paddingBottom: '50px'}}>
          <DropList id="unarchive" dragItems={cellsList.filter((item) => item.columnID === false)} columnID='unarchive'/>
        </div>
        <div style={{flex:1, Width: '50%', minHeight: '200px', maxHeight: '80vh' ,border: '2px solid #ccc', overflowY: 'auto', paddingBottom: '50px'}}>
          <DropList id="archive" dragItems={cellsList.filter((item) => item.columnID === true)} columnID='archive'/>
        </div>
      </Stack>
    </DndContext>
  </Box>
  </Fade>
  </Modal>
  </>
  )
}

