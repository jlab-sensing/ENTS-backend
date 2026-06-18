import { useEffect, useMemo, useState } from 'react';
import {
  fetchDashboardPowerTerosData,
  fetchDashboardSensorData,
} from '../catalog/historicalDataLoader';

const EMPTY = {};

/**
 * Central historical loader for dashboard panels (catalog-gated, deduped, stale-safe).
 */
export function useDashboardHistoricalData({
  cells,
  panelOrder,
  startDate,
  endDate,
  stream,
  cellSensorsById,
  resample = 'hour',
  enabled = true,
}) {
  const [historicalPowerByCell, setHistoricalPowerByCell] = useState(EMPTY);
  const [historicalTerosByCell, setHistoricalTerosByCell] = useState(EMPTY);
  const [historicalSensorByKey, setHistoricalSensorByKey] = useState(EMPTY);
  const [powerTerosLoading, setPowerTerosLoading] = useState(false);
  const [sensorLoading, setSensorLoading] = useState(false);

  const cellIdsKey = useMemo(() => cells.map((cell) => cell.id).join(','), [cells]);
  const panelOrderKey = useMemo(() => panelOrder.join(','), [panelOrder]);
  const rangeKey = useMemo(
    () => `${startDate.toISO()}|${endDate.toISO()}`,
    [startDate, endDate],
  );
  const sensorInputsKey = useMemo(() => JSON.stringify(cellSensorsById ?? {}), [cellSensorsById]);
  const cellSnapshot = useMemo(
    () => cells.map(({ id, name }) => ({ id, name })),
    [cells],
  );
  const panelOrderSnapshot = useMemo(() => [...panelOrder], [panelOrder]);
  const sensorInputs = useMemo(() => cellSensorsById ?? {}, [cellSensorsById]);
  const historicalLoading = powerTerosLoading || sensorLoading;

  useEffect(() => {
    if (!enabled || stream) {
      setPowerTerosLoading(false);
      setSensorLoading(false);
      setHistoricalPowerByCell(EMPTY);
      setHistoricalTerosByCell(EMPTY);
      setHistoricalSensorByKey(EMPTY);
      return undefined;
    }

    if (!cellIdsKey || !panelOrderKey) {
      setPowerTerosLoading(false);
      setSensorLoading(false);
      setHistoricalPowerByCell(EMPTY);
      setHistoricalTerosByCell(EMPTY);
      setHistoricalSensorByKey(EMPTY);
      return undefined;
    }

    let cancelled = false;
    setPowerTerosLoading(true);

    fetchDashboardPowerTerosData({
      cells: cellSnapshot,
      panelOrder: panelOrderSnapshot,
      startDate,
      endDate,
      resample,
    })
      .then((payload) => {
        if (cancelled) return;
        setHistoricalPowerByCell(payload.historicalPowerByCell);
        setHistoricalTerosByCell(payload.historicalTerosByCell);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Dashboard power/TEROS historical load failed:', error);
        setHistoricalPowerByCell(EMPTY);
        setHistoricalTerosByCell(EMPTY);
      })
      .finally(() => {
        if (cancelled) return;
        setPowerTerosLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, stream, cellIdsKey, panelOrderKey, rangeKey, resample, cellSnapshot, panelOrderSnapshot, startDate, endDate]);

  useEffect(() => {
    if (!enabled || stream || !cellIdsKey || !panelOrderKey) {
      setSensorLoading(false);
      setHistoricalSensorByKey(EMPTY);
      return undefined;
    }

    let cancelled = false;
    setSensorLoading(true);

    fetchDashboardSensorData({
      cells: cellSnapshot,
      panelOrder: panelOrderSnapshot,
      startDate,
      endDate,
      cellSensorsById: sensorInputs,
      resample,
    })
      .then((payload) => {
        if (cancelled) return;
        setHistoricalSensorByKey(payload.historicalSensorByKey);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Dashboard sensor historical load failed:', error);
        setHistoricalSensorByKey(EMPTY);
      })
      .finally(() => {
        if (cancelled) return;
        setSensorLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    stream,
    cellIdsKey,
    panelOrderKey,
    rangeKey,
    resample,
    sensorInputsKey,
    sensorInputs,
    cellSnapshot,
    panelOrderSnapshot,
    startDate,
    endDate,
  ]);

  return { historicalPowerByCell, historicalTerosByCell, historicalSensorByKey, historicalLoading };
}
