import { DndContext } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SortableChartPanel from './SortableChartPanel';

function renderSortablePanel(props) {
  return render(
    <DndContext>
      <SortableContext items={[props.id]} strategy={rectSortingStrategy}>
        <SortableChartPanel {...props}>
          <div>Chart body</div>
        </SortableChartPanel>
      </SortableContext>
    </DndContext>,
  );
}

describe('SortableChartPanel', () => {
  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    const expression = '1:vwc / 1:temp';

    renderSortablePanel({
      id: expression,
      onEdit,
      panelColumns: 2,
    });

    const panel = screen.getByText('Chart body').parentElement?.parentElement;
    fireEvent.mouseEnter(panel);
    fireEvent.click(screen.getByRole('button', { name: 'Edit equation' }));
    expect(onEdit).toHaveBeenCalledWith(expression);
  });

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();

    renderSortablePanel({
      id: 'teros',
      onRemove,
      panelColumns: 2,
    });

    const panel = screen.getByText('Chart body').parentElement?.parentElement;
    fireEvent.mouseEnter(panel);
    fireEvent.click(screen.getByRole('button', { name: 'Remove panel' }));
    expect(onRemove).toHaveBeenCalledWith('teros');
  });
});
