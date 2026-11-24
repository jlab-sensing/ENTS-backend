import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import MetadataEditor from './MetadataEditor';
import {
  formatMetadataSummary,
  formatMetadataValue,
  metadataToRows,
  parseMetadataValue,
  rowsToMetadata,
} from './metadataUtils';

describe('metadataUtils', () => {
  it('parses numbers, booleans, null, JSON, and strings', () => {
    expect(parseMetadataValue('0.4')).toBe(0.4);
    expect(parseMetadataValue('-12')).toBe(-12);
    expect(parseMetadataValue('true')).toBe(true);
    expect(parseMetadataValue('false')).toBe(false);
    expect(parseMetadataValue('null')).toBeNull();
    expect(parseMetadataValue('{"a": 1}')).toEqual({ a: 1 });
    expect(parseMetadataValue('[1, 2]')).toEqual([1, 2]);
    expect(parseMetadataValue('{bad json')).toBe('{bad json');
    expect(parseMetadataValue('  loam  ')).toBe('loam');
    expect(parseMetadataValue('')).toBe('');
  });

  it('formats values and summaries cleanly', () => {
    expect(formatMetadataValue(null)).toBe('');
    expect(formatMetadataValue(undefined)).toBe('');
    expect(formatMetadataValue(0.4)).toBe('0.4');
    expect(formatMetadataValue({ nested: true })).toBe('{"nested":true}');

    expect(formatMetadataSummary(null)).toBe('—');
    expect(formatMetadataSummary({})).toBe('—');
    expect(formatMetadataSummary({ sand: 0.4, silt: 0.2 })).toBe('sand: 0.4, silt: 0.2');
  });

  it('converts metadata objects to rows and back with validation', () => {
    expect(metadataToRows(null)).toEqual([]);
    expect(metadataToRows([])).toEqual([]);

    const rows = metadataToRows({ sand: 0.4, notes: 'topsoil' });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ key: 'sand', value: '0.4' });
    expect(rows[1]).toMatchObject({ key: 'notes', value: 'topsoil' });

    const valid = rowsToMetadata([
      ...rows,
      { id: 'blank', key: '', value: '' },
    ]);
    expect(valid).toEqual({
      metadata: { sand: 0.4, notes: 'topsoil' },
      rowErrors: {},
      hasError: false,
    });

    const invalid = rowsToMetadata([
      { id: 'r1', key: '', value: '0.5' },
      { id: 'r2', key: 'sand', value: '0.4' },
      { id: 'r3', key: 'sand', value: '0.6' },
    ]);
    expect(invalid.hasError).toBe(true);
    expect(invalid.rowErrors).toEqual({
      r1: 'Key is required',
      r3: 'Duplicate key',
    });
  });
});

describe('MetadataEditor', () => {
  it('renders empty state and adds a new row', async () => {
    const user = userEvent.setup();
    const onRowsChange = vi.fn();

    render(<MetadataEditor rows={[]} onRowsChange={onRowsChange} />);

    expect(screen.getByText(/optional key-value properties/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /add field/i }));

    expect(onRowsChange).toHaveBeenCalledWith([
      expect.objectContaining({ key: '', value: '' }),
    ]);
  });

  it('updates, validates, and removes metadata rows', async () => {
    const user = userEvent.setup();
    const onRowsChange = vi.fn();

    render(
      <MetadataEditor
        rows={[
          { id: 'row-1', key: 'sand', value: '0.4' },
          { id: 'row-2', key: 'sand', value: '0.2' },
        ]}
        rowErrors={{ 'row-2': 'Duplicate key' }}
        onRowsChange={onRowsChange}
      />,
    );

    expect(screen.getByText('Duplicate key')).toBeInTheDocument();

    const valueInput = screen.getByLabelText('Value 1');
    await user.type(valueInput, '5');
    expect(onRowsChange).toHaveBeenCalledWith([
      { id: 'row-1', key: 'sand', value: '0.45' },
      { id: 'row-2', key: 'sand', value: '0.2' },
    ]);

    await user.click(screen.getByRole('button', { name: 'Remove metadata field 2' }));
    expect(onRowsChange).toHaveBeenCalledWith([{ id: 'row-1', key: 'sand', value: '0.4' }]);
  });
});
