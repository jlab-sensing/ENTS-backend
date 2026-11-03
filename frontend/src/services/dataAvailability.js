import axios from 'axios';

/**
 * Get data availability information for specified cells
 * @param {Array} cellIds - Array of cell IDs to check
 * @param {string} [accessToken] - Optional access token so signed-in users can include their private cells
 * @returns {Promise} Promise resolving to data availability information
 */
export const getDataAvailability = (cellIds, accessToken) => {
  const config = accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {};
  const cellIdsParam = cellIds.join(',');
  return axios
    .get(`${process.env.PUBLIC_URL}/api/data-availability/?cell_ids=${cellIdsParam}`, config)
    .then((res) => res.data)
    .catch((error) => {
      console.error('Error fetching data availability:', error);
      throw error;
    });
};
