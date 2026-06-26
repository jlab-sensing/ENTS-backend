import axios from 'axios';

/**
 * Server-side equation validation (allow-listed AST).
 * @param {string} expression
 * @param {number[]} [cellIds]
 * @returns {Promise<{ ok?: boolean, refs?: string[], error?: string }>}
 */
export async function validateEquationOnServer(expression, cellIds) {
  const body = { expression };
  if (Array.isArray(cellIds) && cellIds.length > 0) {
    body.cell_ids = cellIds;
  }

  try {
    const res = await axios.post(`${process.env.PUBLIC_URL}/api/equations/validate`, body);
    return res.data ?? { ok: true };
  } catch (error) {
    const message = error.response?.data?.error;
    if (message) {
      return { error: message };
    }
    throw error;
  }
}
