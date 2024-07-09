import React from 'react';
import "./DropList.css";
import {DragItem} from "../DragItem/DragItem";
import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {useDroppable} from '@dnd-kit/core';

export const DropList = ({ id,dragItems, columnID}) => {
  const {setNodeRef} = useDroppable({id});

  if (!Array.isArray(dragItems)) {
    console.error('CellDrags prop is not an array', dragItems);}
  return (
    <div className="DropList" ref = {setNodeRef}>
      <SortableContext items={dragItems} strategy={verticalListSortingStrategy}>
        {dragItems.map((dragItem) => (
          <DragItem key ={dragItem.key} id={dragItem.id} title={dragItem.title} columnID={columnID}/>
        ))}
      </SortableContext>
    </div>
  );
};
