import {
  isKnownPanelId,
  LAYOUT_VERSION,
  panelIdToUnifiedType,
} from './dashboardCatalog';

/**
 * Short URL tokens for built-in panels (internal panel_id may differ).
 */
export const LAYOUT_NAME_TO_PANEL_ID = {
  vwc: 'teros',
  teros: 'teros',
  temp: 'temp',
  vi: 'power-vi',
  voltage: 'power-vi',
  'power-vi': 'power-vi',
  power: 'power-p',
  'power-p': 'power-p',
};

/** Built-in panels → preferred short layout token. */
export const PANEL_ID_TO_LAYOUT_NAME = {
  teros: 'vwc',
  temp: 'temp',
  'power-vi': 'vi',
  'power-p': 'power',
};

/**
 * Split layout body on commas outside parentheses.
 * @param {string} body
 * @returns {string[]}
 */
export function splitLayoutEntries(body) {
  const entries = [];
  let current = '';
  let depth = 0;

  for (const ch of body) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth = Math.max(0, depth - 1);

    if (ch === ',' && depth === 0) {
      if (current.trim()) entries.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }

  if (current.trim()) entries.push(current.trim());
  return entries;
}

/**
 * @param {string} token
 * @returns {string | null}
 */
export function resolveLayoutTokenToPanelId(token) {
  if (!token) return null;
  if (isKnownPanelId(token)) return token;

  const alias = LAYOUT_NAME_TO_PANEL_ID[token] ?? LAYOUT_NAME_TO_PANEL_ID[token.toLowerCase()];
  if (alias && isKnownPanelId(alias)) return alias;

  const unifiedPanelId = `u:${token}`;
  if (isKnownPanelId(unifiedPanelId)) return unifiedPanelId;

  return null;
}

/**
 * @param {string} panelId
 * @returns {string}
 */
export function panelIdToLayoutToken(panelId) {
  if (PANEL_ID_TO_LAYOUT_NAME[panelId]) {
    return PANEL_ID_TO_LAYOUT_NAME[panelId];
  }

  const unifiedType = panelIdToUnifiedType(panelId);
  if (unifiedType) return unifiedType;

  return panelId;
}

/**
 * @param {string} entry
 * @returns {string | null}
 */
export function parseLayoutEntry(entry) {
  const trimmed = entry?.trim();
  if (!trimmed) return null;

  return resolveLayoutTokenToPanelId(trimmed);
}

/**
 * @param {string} entry
 * @returns {boolean}
 */
export function isLayoutPanelEntry(entry) {
  return parseLayoutEntry(entry) != null;
}

/**
 * Accepts short names like `vwc,temp,presHum` and legacy `v1:teros,temp,...`.
 * @param {string | null | undefined} raw
 * @returns {string[]}
 */
export function parseLayoutParam(raw) {
  if (!raw || typeof raw !== 'string') return [];

  const trimmed = raw.trim();
  const legacy = trimmed.match(/^v1:(.+)$/i);
  const body = legacy ? legacy[1] : trimmed;

  const resolved = splitLayoutEntries(body)
    .map(parseLayoutEntry)
    .filter(Boolean);

  return resolved.length > 0 ? resolved : [];
}

/**
 * Serializes to v1 + short tokens: v1:vi,vwc,presHum
 * @param {string[]} panelOrder
 * @returns {string | null}
 */
export function serializeLayoutParam(panelOrder) {
  const valid = panelOrder.filter((entry) => isKnownPanelId(entry));
  if (valid.length === 0) return null;
  return `${LAYOUT_VERSION}:${valid.map(panelIdToLayoutToken).join(',')}`;
}
