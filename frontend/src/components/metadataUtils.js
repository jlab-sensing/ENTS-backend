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
 * Formats a stored metadata value into an editable text representation
 * for the modal editor while distinguishing null from an empty string.
 * @param {*} value
 * @returns {string}
 */
export function formatEditorValue(value) {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Formats a stored metadata value into a display string for table summaries.
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
 * @returns {Array<{id: string, key: string, value: string, initialKey?: string, initialValueText?: string, isLoaded?: boolean, hasOriginalValue?: boolean, originalValue?: *}>}
 */
export function metadataToRows(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return [];
  }
  return Object.entries(metadata).map(([key, value]) => {
    const valueText = formatEditorValue(value);
    return {
      id: createRowId(),
      key,
      value: valueText,
      initialKey: key,
      initialValueText: valueText,
      isLoaded: true,
      hasOriginalValue: true,
      originalValue: value,
    };
  });
}

/**
 * Parses a raw metadata input string into a JSON-compatible value.
 * Numbers (including exponent form), booleans, null, and valid JSON objects/arrays
 * are typed; everything else is preserved as a string.
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
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
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
 * @param {Array<{id: string, key: string, value: string, initialKey?: string, initialValueText?: string, isLoaded?: boolean, hasOriginalValue?: boolean, originalValue?: *}>} rows
 * @returns {{metadata: Record<string, *>, rowErrors: Record<string, string>, hasError: boolean}}
 */
export function rowsToMetadata(rows) {
  const metadata = {};
  const rowErrors = {};
  const seenKeys = new Set();

  rows.forEach((row) => {
    const isUntouchedLoadedKey = Boolean(row.isLoaded && row.key === row.initialKey && row.key !== '');
    const effectiveKey = isUntouchedLoadedKey ? row.key : row.key.trim();
    const trimmedValue = row.value.trim();

    if (!effectiveKey && !trimmedValue) {
      return;
    }
    if (!effectiveKey) {
      rowErrors[row.id] = 'Key is required';
      return;
    }
    if (seenKeys.has(effectiveKey)) {
      rowErrors[row.id] = 'Duplicate key';
      return;
    }

    seenKeys.add(effectiveKey);
    const value =
      row.hasOriginalValue && row.value === row.initialValueText
        ? row.originalValue
        : parseMetadataValue(row.value);
    Object.defineProperty(metadata, effectiveKey, {
      value,
      enumerable: true,
      writable: true,
      configurable: true,
    });
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
