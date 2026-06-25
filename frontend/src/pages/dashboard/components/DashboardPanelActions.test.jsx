import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DashboardPanelActions from './DashboardPanelActions';

describe('DashboardPanelActions', () => {
  it('calls onAddChart when Add chart is clicked', async () => {
    const user = userEvent.setup();
    const onAddChart = vi.fn();

    render(
      <DashboardPanelActions
        onAddChart={onAddChart}
        onAddEquation={vi.fn()}
        panelColumns={2}
        onPanelColumnsChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add chart' }));
    expect(onAddChart).toHaveBeenCalledTimes(1);
  });

  it('calls onAddEquation when Add equation is clicked', async () => {
    const user = userEvent.setup();
    const onAddEquation = vi.fn();

    render(
      <DashboardPanelActions
        onAddChart={vi.fn()}
        onAddEquation={onAddEquation}
        panelColumns={2}
        onPanelColumnsChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add equation' }));
    expect(onAddEquation).toHaveBeenCalledTimes(1);
  });

  it('switches column layout', async () => {
    const user = userEvent.setup();
    const onPanelColumnsChange = vi.fn();

    render(
      <DashboardPanelActions
        onAddChart={vi.fn()}
        onAddEquation={vi.fn()}
        panelColumns={2}
        onPanelColumnsChange={onPanelColumnsChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Single column wide' }));
    expect(onPanelColumnsChange).toHaveBeenCalledWith(1);
  });
});
