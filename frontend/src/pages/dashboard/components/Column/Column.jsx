import React from 'react';
import "./Column.css";
import {CellDrag} from "../CellDrag/CellDrag";
import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';

export const Column = ({ CellDrags }) => {
  if (!Array.isArray(CellDrags)) {
    console.error('CellDrags prop is not an array', CellDrags);
    return null; // or render some fallback UI
  }
  return (
    <div className="column">
      <SortableContext items={CellDrags} strategy={verticalListSortingStrategy}>
        {CellDrags.map((cellDrag) => (
          <CellDrag key ={cellDrag.id} id={cellDrag.id} title={cellDrag.title}/>
        ))}
      </SortableContext>
    </div>
  );
};
