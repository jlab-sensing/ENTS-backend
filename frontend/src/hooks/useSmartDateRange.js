import { DateTime } from 'luxon';
import { useCallback, useState } from 'react';
import { getDataAvailability } from '../services/dataAvailability';

/**
 * Custom hook for intelligent date range selection
 * Automatically selects the most recent 2 weeks of available data,
 * falling back to the last available 2-week period if needed
 */
export function useSmartDateRange() {
  const [showFallbackNotification, setShowFallbackNotification] = useState(false);
  const [fallbackDates, setFallbackDates] = useState({ start: null, end: null });

  /**
   * Calculate intelligent date range based on data availability
   * @param {Array} selectedCells - Array of selected cell objects
   * @returns {Object} { startDate, endDate, isFallback }
   */
  const calculateSmartDateRange = useCallback(async (selectedCells) => {
    if (!selectedCells || selectedCells.length === 0) {
      // Default range when no cells selected
      return {
        startDate: DateTime.now().minus({ days: 14 }),
        endDate: DateTime.now(),
        isFallback: false,
      };
    }

    try {
      const cellIds = selectedCells.map((cell) => cell.id);
      const availability = await getDataAvailability(cellIds);

      if (!availability.latest_timestamp) {
        // No data available, use default range
        return {
          startDate: DateTime.now().minus({ days: 14 }),
          endDate: DateTime.now(),
          isFallback: false,
        };
      }

      const latestDate = DateTime.fromISO(availability.latest_timestamp);
      if (!latestDate.isValid) {
        return {
          startDate: DateTime.now().minus({ days: 14 }),
          endDate: DateTime.now(),
          isFallback: false,
        };
      }

      const getAdjustedStartDate = (endDate) => {
        const defaultStartDate = endDate.minus({ days: 14 });
        if (!availability.earliest_timestamp) {
          return defaultStartDate;
        }

        const earliestDate = DateTime.fromISO(availability.earliest_timestamp);
        if (!earliestDate.isValid) {
          return defaultStartDate;
        }

        return defaultStartDate < earliestDate ? earliestDate : defaultStartDate;
      };

      if (availability.has_recent_data) {
        // Recent data available, use the most recent 2-week period ending at latest data.
        const endDate = latestDate;
        const startDate = getAdjustedStartDate(endDate);
        return {
          startDate,
          endDate,
          isFallback: false,
        };
      } else {
        // No recent data, fall back to most recent available 2-week period
        const fallbackEndDate = latestDate;
        const adjustedStartDate = getAdjustedStartDate(fallbackEndDate);

        // Store fallback dates for notification
        setFallbackDates({
          start: adjustedStartDate.toJSDate(),
          end: fallbackEndDate.toJSDate(),
        });

        return {
          startDate: adjustedStartDate,
          endDate: fallbackEndDate,
          isFallback: true,
        };
      }
    } catch (error) {
      console.error('Error calculating smart date range:', error);
      // Fall back to default range on error
      return {
        startDate: DateTime.now().minus({ days: 14 }),
        endDate: DateTime.now(),
        isFallback: false,
      };
    }
  }, []);

  /**
   * Show the fallback notification
   */
  const showFallbackNotificationHandler = useCallback(() => {
    setShowFallbackNotification(true);
  }, []);

  /**
   * Hide the fallback notification
   */
  const hideFallbackNotification = useCallback(() => {
    setShowFallbackNotification(false);
  }, []);

  return {
    calculateSmartDateRange,
    showFallbackNotification,
    fallbackDates,
    showFallbackNotificationHandler,
    hideFallbackNotification,
  };
}
