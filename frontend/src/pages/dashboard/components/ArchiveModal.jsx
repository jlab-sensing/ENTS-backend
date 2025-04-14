import { React, useState } from 'react';
import { Button, Box, Stack, Modal, Fade, Tooltip } from '@mui/material';
import { DndContext, closestCorners, DragOverlay } from '@dnd-kit/core';
import { DropList } from './DropList/DropList';
import { DragItem } from './DragItem/DragItem';
import archive from '../../../assets/archive.svg';
import { arrayMove } from '@dnd-kit/sortable';
import { useSetCellArchive } from '../../../services/cell';
import { PropTypes } from 'prop-types';

export default function ArchiveModal({ cells }) {
  const [cellsList, setCellsList] = useState(
    cells.data.map((cell) => ({
      key: cell.id,
      id: cell.id,
      title: cell.name,
      isArchived: cell.archive,
    })),
  );
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [activeCell, setActiveCell] = useState(null);
  const { mutate: setCellArchive } = useSetCellArchive();
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragOver = (event) => {
    // activeID - selected dragItem id
    // overID - id of column or dragItem that selected dragItem is over
    const { active, over } = event;
    if (!over) return;

    const overID = over.id;
    const activeID = active.id;
    if (overID === activeID) return;

    const isActiveATask = active.id != 'unarchive' && active.id != 'archive';
    const isOverATask = over.id != 'unarchive' && over.id != 'archive';

    if (!isActiveATask) return;
    /// Both active and over are tasks

    const overIndex = cellsList.findIndex((task) => task.id === overID);
    const activeIndex = cellsList.findIndex((task) => task.id === activeID);

    if (isOverATask) {
      setCellsList((cellsList) => {
        ///If the tasks are in different columns
        if (cellsList[activeIndex].isArchived !== cellsList[overIndex].isArchived) {
          cellsList[activeIndex].isArchived = cellsList[overIndex].isArchived;
          return arrayMove(cellsList, activeIndex, overIndex);
        } else {
          ///If the tasks are in the same column
          return arrayMove(cellsList, activeIndex, overIndex);
        }
      });
    }
    /// If the active is a task and the over is a column
    else if (cellsList[activeIndex].isArchived != (overID === 'archive')) {
      setCellsList((cellsList) => {
        cellsList[activeIndex].isArchived = !cellsList[activeIndex].isArchived;
        return arrayMove(cellsList, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = (event) => {
    const { over } = event;
    /// Over a column
    if (over.id === 'unarchive' || over.id === 'archive') {
      setCellArchive({ cellId: activeCell.id, archive: over.id === 'archive' });
      return;
    }
    /// Over a cell
    else if (activeCell.data.current.columnID !== over.data.current.columnID) {
      setCellArchive({ cellId: activeCell.id, archive: !(activeCell.data.current.columnID === 'archive') });
      return;
    }
    /// Not changed
    return;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveCell(active);
    const draggedCell = cellsList.find(cell => cell.id === active.id);
    setDraggedItem(draggedCell);
  };

  return (
    <>
      <Tooltip title='Archive' placement='bottom' disableInteractive>
        <Button variant='outlined' onClick={handleOpen} sx={{ heigh: '16px', width: '16px' }}>
          <Box component='img' src={archive}></Box>
        </Button>
      </Tooltip>
      <Modal open={open} onClose={handleClose} closeAfterTransition>
        <Fade in={open}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: '10px',
          }}>
            <DndContext
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              collisionDetection={closestCorners}
            >
              <Stack direction='row' spacing={2} justifyContent='space-between'>
                <DropList
                  id='unarchive'
                  dragItems={cellsList.filter((item) => item.isArchived === false)}
                  columnID='unarchive'
                />
                <DropList
                  id='archive'
                  dragItems={cellsList.filter((item) => item.isArchived === true)}
                  columnID='archive'
                />
              </Stack>
              <DragOverlay>
                {draggedItem ? (
                  <DragItem
                    id={draggedItem.id}
                    title={draggedItem.title}
                    columnID={draggedItem.isArchived ? 'archive' : 'unarchive'}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}

ArchiveModal.propTypes = {
  cells: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
};
