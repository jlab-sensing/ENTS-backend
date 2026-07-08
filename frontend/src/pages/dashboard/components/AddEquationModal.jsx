import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { listEquationStreamKeys } from '../equation/equationStreams';
import { validateEquationExpression } from '../equation/equationParser';
import { validateEquationOnServer } from '../../../services/equation';

const DEFAULT_EXAMPLES = ['1:vwc / 1:temp', '1:co2 * 2', '1:pressure - 1013', '1:vwc ^ 2'];

function examplesForCell(cellId) {
  if (cellId == null) return DEFAULT_EXAMPLES;
  const id = String(cellId);
  return [`${id}:vwc / ${id}:temp`, `${id}:co2 * 2`, `${id}:pressure - 1013`, `${id}:vwc ^ 2`];
}

const QUICK_STREAMS = ['vwc', 'temp', 'co2', 'bme280', 'pressure'];

function AddEquationModal({
  open,
  onClose,
  onSave,
  selectedCells = [],
  initialExpression = '',
  mode = 'add',
}) {
  const [expression, setExpression] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setExpression(initialExpression);
    setError(null);
  }, [open, initialExpression]);

  const handleSave = async () => {
    const trimmed = expression.trim();
    const validationError = validateEquationExpression(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const cellIds = selectedCells.map((cell) => cell.id);
      const serverResult = await validateEquationOnServer(trimmed, cellIds);
      if (serverResult.error) {
        setError(serverResult.error);
        return;
      }
      onSave(trimmed);
      onClose();
    } catch {
      setError('Could not validate expression with the server.');
    } finally {
      setSaving(false);
    }
  };

  const streamHint = listEquationStreamKeys().slice(0, 12).join(', ');
  const exampleCellId = selectedCells[0]?.id ?? null;
  const exampleExpressions = examplesForCell(exampleCellId);
  const placeholder =
    exampleCellId != null ? `${exampleCellId}:vwc / ${exampleCellId}:temp` : '1:vwc / 1:temp';

  const insertToken = (token) => {
    setExpression((prev) => (prev.trim() ? `${prev.trim()} ${token}` : token));
    setError(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        {mode === 'edit' ? 'Edit equation' : 'Add equation'}
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Use <strong>cellId:stream</strong> (e.g. <code>2:vwc</code> = VWC on cell 2). Operators:{' '}
            <code>+ − * / ^ ( )</code>. Saved in the same <code>layout=</code> param as catalog panels, e.g.{' '}
            <code>layout=v1:vwc,temp,2:vwc + 2:bme280</code>.
          </Typography>

          {selectedCells.length > 0 ? (
            <Alert
              severity="info"
              sx={{
                py: 0.75,
                alignItems: 'flex-start',
                '& .MuiAlert-message': {
                  width: '100%',
                },
              }}
            >
              <Typography variant="caption" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
                Selected cells ({selectedCells.length}) — use the id in formulas
              </Typography>
              <Box
                sx={{
                  maxHeight: 140,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  pr: 0.5,
                  mt: 0.5,
                }}
              >
                {selectedCells.map((cell) => (
                  <Box
                    key={cell.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) auto',
                      alignItems: 'center',
                      width: '100%',
                      gap: 1,
                      py: 0.75,
                      px: 1,
                      mb: 0.75,
                      borderRadius: 1,
                      bgcolor: 'rgba(255,255,255,0.35)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: 600,
                        color: 'text.primary',
                      }}
                    >
                      {cell.name || 'Unnamed'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.35, flexShrink: 0 }}>
                      <Box
                        sx={{
                          px: 0.9,
                          py: 0.25,
                          borderRadius: 999,
                          bgcolor: 'info.main',
                          color: 'info.contrastText',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          lineHeight: 1.4,
                        }}
                      >
                        {cell.id}
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        e.g. {cell.id}:vwc
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ py: 0.5 }}>
              Select a cell in the toolbar first — examples below use id 1 until you pick a cell.
            </Alert>
          )}

          <TextField
            label="Expression"
            value={expression}
            onChange={(e) => {
              setExpression(e.target.value);
              setError(null);
            }}
            multiline
            minRows={2}
            fullWidth
            placeholder={placeholder}
            inputProps={{ spellCheck: false }}
            error={Boolean(error)}
            helperText={
              error ||
              (exampleCellId != null
                ? `Layout example: v1:vwc,temp,${exampleCellId}:vwc / ${exampleCellId}:temp`
                : 'Layout example: v1:vwc,temp,47:vwc / 47:temp')
            }
          />

          {exampleCellId != null && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                Insert stream token for cell {exampleCellId}
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {QUICK_STREAMS.map((stream) => (
                  <Chip
                    key={stream}
                    label={`${exampleCellId}:${stream}`}
                    size="small"
                    variant="outlined"
                    onClick={() => insertToken(`${exampleCellId}:${stream}`)}
                    sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
              Examples{exampleCellId != null ? ` for cell ${exampleCellId}` : ''}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {exampleExpressions.map((ex) => (
                <Chip
                  key={ex}
                  label={ex}
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setExpression(ex);
                    setError(null);
                  }}
                  sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                />
              ))}
            </Stack>
          </Box>

          <Alert severity="info" sx={{ py: 0.5 }}>
            Known streams include: {streamHint}, …
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Validating…' : mode === 'edit' ? 'Save changes' : 'Add equation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

AddEquationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  selectedCells: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string,
    }),
  ),
  initialExpression: PropTypes.string,
  mode: PropTypes.oneOf(['add', 'edit']),
};

export default AddEquationModal;
