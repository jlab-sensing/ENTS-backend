import React from 'react';
import "./DropList.css";
import {DragItem} from "../DragItem/DragItem";
import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {useDroppable} from '@dnd-kit/core';
import PropTypes from 'prop-types'

export const DropList = ({ id,dragItems, columnID}) => {
  const {setNodeRef} = useDroppable({id});
  const name = columnID === 'archive' ? 'Archive' : 'Unarchive';
  if (!Array.isArray(dragItems)) {
    console.error('CellDrags prop is not an array', dragItems);}
  return (
  <div> 
   <h2 style = {{textAlign: 'center', textDecoration: 'underline'}}>{name}</h2>
    <div className="DropList" ref = {setNodeRef} >
      <SortableContext items={dragItems} strategy={verticalListSortingStrategy}>
        {dragItems.map((dragItem) => (
          <DragItem key ={dragItem.id} id={dragItem.id} title={dragItem.title} columnID={columnID}/>
        ))}
      </SortableContext>
    </div>
    </div>
  );
};

DropList.propTypes = {
  id: PropTypes.string.isRequired,
  dragItems: PropTypes.arrayOf(PropTypes.object).isRequired,
  columnID: PropTypes.string.isRequired,
};