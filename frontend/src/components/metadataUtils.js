let nextRowId = 1;

/**
 * Generates a stable unique row identifier for the metadata editor.
 * @returns {string}
 */
export function createRowId() {
  const id = `meta-row-${nextRowId}`;
  nextRowId += 1;
  return id;
}

/**
 * Formats a stored metadata value into an editable text representation.
 * @param {*} value
 * @returns {string}
 */
export function formatMetadataValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Converts a cell metadata object into editable key-value rows.
 * @param {Record<string, *>|null|undefined} metadata
 * @returns {Array<{id: string, key: string, value: string}>}
 */
export function metadataToRows(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return [];
  }
  return Object.entries(metadata).map(([key, value]) => ({
    id: createRowId(),
    key,
    value: formatMetadataValue(value),
  }));
}

/**
 * Parses a raw metadata input string into a JSON-compatible value.
 * Numbers, booleans, null, and valid JSON objects/arrays are typed;
 * everything else is preserved as a string.
 * @param {string} raw
 * @returns {*}
 */
export function parseMetadataValue(raw) {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return '';
  }
  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }
  if (trimmed === 'null') {
    return null;
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const parsedNumber = Number(trimmed);
    if (Number.isFinite(parsedNumber)) {
      return parsedNumber;
    }
  }
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

/**
 * Validates editor rows and serializes them into a metadata dictionary.
 * Blank rows (both key and value empty) are ignored.
 * @param {Array<{id: string, key: string, value: string}>} rows
 * @returns {{metadata: Record<string, *>, rowErrors: Record<string, string>, hasError: boolean}}
 */
export function rowsToMetadata(rows) {
  const metadata = {};
  const rowErrors = {};
  const seenKeys = new Set();

  rows.forEach((row) => {
    const trimmedKey = row.key.trim();
    const trimmedValue = row.value.trim();

    if (!trimmedKey && !trimmedValue) {
      return;
    }
    if (!trimmedKey) {
      rowErrors[row.id] = 'Key is required';
      return;
    }
    if (seenKeys.has(trimmedKey)) {
      rowErrors[row.id] = 'Duplicate key';
      return;
    }

    seenKeys.add(trimmedKey);
    metadata[trimmedKey] = parseMetadataValue(row.value);
  });

  return {
    metadata,
    rowErrors,
    hasError: Object.keys(rowErrors).length > 0,
  };
}

/**
 * Formats a metadata object as a compact single-line summary for table cells.
 * @param {Record<string, *>|null|undefined} metadata
 * @returns {string}
 */
export function formatMetadataSummary(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return '—';
  }
  const entries = Object.entries(metadata);
  if (entries.length === 0) {
    return '—';
  }
  return entries.map(([key, value]) => `${key}: ${formatMetadataValue(value)}`).join(', ');
}
