import axios from 'axios';

/**
 * Get data availability information for specified cells
 * @param {Array} cellIds - Array of cell IDs to check
 * @returns {Promise} Promise resolving to data availability information
 */
export const getDataAvailability = (cellIds) => {
  const cellIdsParam = cellIds.join(',');
  return axios
    .get(`${process.env.PUBLIC_URL}/api/data-availability/?cell_ids=${cellIdsParam}`)
    .then((res) => res.data)
    .catch((error) => {
      console.error('Error fetching data availability:', error);
      throw error;
    });
};
