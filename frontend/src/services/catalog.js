import axios from 'axios';

/**
 * @typedef {object} CatalogApiEntry
 * @property {string} panel_id
 * @property {string} label
 * @property {string} description
 * @property {string} category
 * @property {'builtin' | 'unified' | 'sensor'} kind
 * @property {string} [unified_type]
 * @property {number} [sensor_id]
 * @property {string} [sensor_name]
 * @property {string} [measurement]
 * @property {string} [unit]
 */

/**
 * Chartable series for a cell (read-only catalog).
 * @param {number} cellId
 * @returns {Promise<CatalogApiEntry[]>}
 */
export async function getSensorCatalog(cellId) {
  try {
    const res = await axios.get(`${process.env.PUBLIC_URL}/api/catalog/sensors`, {
      params: { cell_id: cellId },
    });
    return res.data?.entries ?? [];
  } catch (error) {
    console.error('Error getting sensor catalog:', error.response ? error.response.data : error.message);
    return [];
  }
}
