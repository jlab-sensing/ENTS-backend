import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import { useCallback, useMemo } from 'react';
import { panelIdToUnifiedType } from '../catalog/dashboardCatalog';
import PowerCharts from './PowerCharts';
import SortableChartPanel from './SortableChartPanel';
import TerosCharts from './TerosCharts';
import UnifiedChart from './UnifiedChart';

function DashboardPanelContent({ panelId, chartProps }) {
  const shared = {
    cells: chartProps.cells,
    startDate: chartProps.startDate,
    endDate: chartProps.endDate,
    stream: chartProps.stream,
    liveData: chartProps.liveData,
  };

  const unifiedType = panelIdToUnifiedType(panelId);
  if (unifiedType) {
    return (
      <UnifiedChart
        type={unifiedType}
        cells={chartProps.cells}
        startDate={chartProps.startDate}
        endDate={chartProps.endDate}
        stream={chartProps.stream}
        liveData={chartProps.liveData}
        processedData={chartProps.processedSensors}
      />
    );
  }

  switch (panelId) {
    case 'power-vi':
      return (
        <PowerCharts
          {...shared}
          variant='voltage'
          processedData={chartProps.processedPower}
          onDataStatusChange={chartProps.onPowerDataStatusChange}
        />
      );
    case 'power-p':
      return (
        <PowerCharts
          {...shared}
          variant='power'
          processedData={chartProps.processedPower}
          onDataStatusChange={chartProps.onPowerDataStatusChange}
        />
      );
    case 'teros':
      return (
        <TerosCharts
          {...shared}
          variant='vwc'
          processedData={chartProps.processedTeros}
          onDataStatusChange={chartProps.onTerosDataStatusChange}
        />
      );
    case 'temp':
      return (
        <TerosCharts
          {...shared}
          variant='temp'
          processedData={chartProps.processedTeros}
          onDataStatusChange={chartProps.onTerosDataStatusChange}
        />
      );
    default:
      return null;
  }
}

DashboardPanelContent.propTypes = {
  panelId: PropTypes.string.isRequired,
  chartProps: PropTypes.object.isRequired,
};

function SortableDashboardPanel({ panelId, chartProps, onRemovePanel, panelColumns }) {
  return (
    <SortableChartPanel id={panelId} onRemove={onRemovePanel} panelColumns={panelColumns}>
      <DashboardPanelContent panelId={panelId} chartProps={chartProps} />
    </SortableChartPanel>
  );
}

SortableDashboardPanel.propTypes = {
  panelId: PropTypes.string.isRequired,
  chartProps: PropTypes.object.isRequired,
  onRemovePanel: PropTypes.func.isRequired,
  panelColumns: PropTypes.oneOf([1, 2]).isRequired,
};

export default function DashboardPanelGrid({
  panelOrder,
  onPanelOrderChange,
  onRemovePanel,
  chartProps,
  panelColumns,
}) {
  const dndSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      onPanelOrderChange((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        if (oldIndex === -1 || newIndex === -1) return items;
        return arrayMove(items, oldIndex, newIndex);
      });
    },
    [onPanelOrderChange],
  );

  const visiblePanels = useMemo(
    () =>
      panelOrder.map((panelId) => (
        <SortableDashboardPanel
          key={panelId}
          panelId={panelId}
          chartProps={chartProps}
          onRemovePanel={onRemovePanel}
          panelColumns={panelColumns}
        />
      )),
    [panelOrder, chartProps, onRemovePanel, panelColumns],
  );

  if (panelOrder.length === 0) {
    return null;
  }

  return (
    <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={panelOrder} strategy={rectSortingStrategy}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: panelColumns === 1 ? '1fr' : { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
            width: '100%',
            alignItems: 'stretch',
            justifyContent: 'space-evenly',
            '& > *': { minWidth: 0 },
          }}
        >
          {visiblePanels}
        </Box>
      </SortableContext>
    </DndContext>
  );
}

DashboardPanelGrid.propTypes = {
  panelOrder: PropTypes.arrayOf(PropTypes.string).isRequired,
  onPanelOrderChange: PropTypes.func.isRequired,
  onRemovePanel: PropTypes.func.isRequired,
  panelColumns: PropTypes.oneOf([1, 2]).isRequired,
  chartProps: PropTypes.shape({
    cells: PropTypes.array,
    startDate: PropTypes.any,
    endDate: PropTypes.any,
    stream: PropTypes.bool,
    liveData: PropTypes.array,
    processedPower: PropTypes.object,
    processedTeros: PropTypes.object,
    processedSensors: PropTypes.object,
    onPowerDataStatusChange: PropTypes.func,
    onTerosDataStatusChange: PropTypes.func,
  }).isRequired,
};
