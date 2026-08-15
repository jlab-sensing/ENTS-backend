import { useEffect, useMemo, useState } from 'react';
import {
  fetchDashboardPowerTerosData,
  fetchDashboardSensorData,
} from '../catalog/historicalDataLoader';

const EMPTY = {};

/**
 * @param {string} powerRequestKey
 * @param {string} sensorRequestKey
 * @param {string|null} powerCacheKey
 * @param {string|null} sensorCacheKey
 * @param {boolean} powerLoading
 * @param {boolean} sensorLoading
 * @returns {boolean}
 */
export function isHistoricalCacheReady(
  powerRequestKey,
  sensorRequestKey,
  powerCacheKey,
  sensorCacheKey,
  powerLoading,
  sensorLoading,
) {
  return (
    !powerLoading &&
    !sensorLoading &&
    powerCacheKey === powerRequestKey &&
    sensorCacheKey === sensorRequestKey
  );
}

/**
 * Never hand callers a cache that belongs to a different resample/range/selection.
 * CSV and charts must see empty objects until both halves match the request.
 *
 * @param {boolean} ready
 * @param {Record<string, unknown>} power
 * @param {Record<string, unknown>} teros
 * @param {Record<string, unknown>} sensors
 */
export function selectPublishedHistoricalCaches(ready, power, teros, sensors) {
  if (!ready) {
    return {
      historicalPowerByCell: EMPTY,
      historicalTerosByCell: EMPTY,
      historicalSensorByKey: EMPTY,
    };
  }
  return {
    historicalPowerByCell: power,
    historicalTerosByCell: teros,
    historicalSensorByKey: sensors,
  };
}

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
  const [powerCacheKey, setPowerCacheKey] = useState(null);
  const [sensorCacheKey, setSensorCacheKey] = useState(null);

  const cellIdsKey = useMemo(() => cells.map((cell) => cell.id).join(','), [cells]);
  const panelOrderKey = useMemo(() => panelOrder.join(','), [panelOrder]);
  const rangeKey = useMemo(
    () => `${startDate.toISO()}|${endDate.toISO()}`,
    [startDate, endDate],
  );
  const sensorInputsKey = useMemo(() => JSON.stringify(cellSensorsById ?? {}), [cellSensorsById]);
  const powerRequestKey = `${resample}|${rangeKey}|${cellIdsKey}|${panelOrderKey}`;
  const sensorRequestKey = `${powerRequestKey}|${sensorInputsKey}`;
  const cellSnapshot = useMemo(
    () => cells.map(({ id, name }) => ({ id, name })),
    [cells],
  );
  const panelOrderSnapshot = useMemo(() => [...panelOrder], [panelOrder]);
  const sensorInputs = useMemo(() => cellSensorsById ?? {}, [cellSensorsById]);
  const historicalLoading = !isHistoricalCacheReady(
    powerRequestKey,
    sensorRequestKey,
    powerCacheKey,
    sensorCacheKey,
    powerTerosLoading,
    sensorLoading,
  );

  useEffect(() => {
    if (!enabled || stream) {
      setPowerTerosLoading(false);
      setSensorLoading(false);
      setHistoricalPowerByCell(EMPTY);
      setHistoricalTerosByCell(EMPTY);
      setHistoricalSensorByKey(EMPTY);
      setPowerCacheKey(null);
      setSensorCacheKey(null);
      return undefined;
    }

    if (!cellIdsKey || !panelOrderKey) {
      setPowerTerosLoading(false);
      setSensorLoading(false);
      setHistoricalPowerByCell(EMPTY);
      setHistoricalTerosByCell(EMPTY);
      setHistoricalSensorByKey(EMPTY);
      setPowerCacheKey(powerRequestKey);
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
        setPowerCacheKey(powerRequestKey);
        setPowerTerosLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, stream, cellIdsKey, panelOrderKey, rangeKey, resample, powerRequestKey, cellSnapshot, panelOrderSnapshot, startDate, endDate]);

  useEffect(() => {
    if (!enabled || stream) {
      return undefined;
    }

    if (!cellIdsKey || !panelOrderKey) {
      setSensorLoading(false);
      setHistoricalSensorByKey(EMPTY);
      setSensorCacheKey(sensorRequestKey);
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
        setSensorCacheKey(sensorRequestKey);
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
    sensorRequestKey,
    sensorInputsKey,
    sensorInputs,
    cellSnapshot,
    panelOrderSnapshot,
    startDate,
    endDate,
  ]);

  const published = selectPublishedHistoricalCaches(
    !historicalLoading,
    historicalPowerByCell,
    historicalTerosByCell,
    historicalSensorByKey,
  );

  return {
    historicalPowerByCell: published.historicalPowerByCell,
    historicalTerosByCell: published.historicalTerosByCell,
    historicalSensorByKey: published.historicalSensorByKey,
    historicalLoading,
  };
}
