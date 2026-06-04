import axios from 'axios';

/**
 * @typedef {object} CatalogApiEntry
 * @property {string} panel_id
 * @property {string} label
 * @property {string} description
 * @property {string} category
 * @property {'builtin' | 'unified'} kind
 * @property {string} [unified_type]
 */

/**
 * Chartable series for a cell (read-only catalog).
 * @param {number} cellId
 * @returns {Promise<CatalogApiEntry[]>}
 */
export async function getSensorCatalog(cellId) {
  const res = await axios.get(`${process.env.PUBLIC_URL}/api/catalog/sensors`, {
    params: { cell_id: cellId },
  });
  return res.data?.entries ?? [];
}
