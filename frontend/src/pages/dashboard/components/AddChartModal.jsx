import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSensorCatalog } from '../../../services/catalog';
import { catalogEntriesFromApi, FULL_CATALOG } from '../catalog/dashboardCatalog';

function AddChartModal({ open, onClose, selectedCells, panelOrder, onAddPanel }) {
  const [pickCellId, setPickCellId] = useState(null);
  const [catalogEntries, setCatalogEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const needsCellPick = selectedCells.length > 1;
  const activeCellId = needsCellPick ? pickCellId : selectedCells[0]?.id ?? null;

  useEffect(() => {
    if (!open) return;
    if (selectedCells.length === 1) {
      setPickCellId(selectedCells[0].id);
    } else if (selectedCells.length > 1 && pickCellId == null) {
      setPickCellId(selectedCells[0].id);
    }
  }, [open, selectedCells, pickCellId]);

  const loadCatalog = useCallback(async (cellId) => {
    if (!cellId) {
      setCatalogEntries([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const apiEntries = await getSensorCatalog(cellId);
      setCatalogEntries(catalogEntriesFromApi(apiEntries));
    } catch {
      setCatalogEntries(FULL_CATALOG);
      setError('Could not load catalog from server; showing all chart types.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && activeCellId) {
      loadCatalog(activeCellId);
    }
  }, [open, activeCellId, loadCatalog]);

  const addableEntries = useMemo(
    () => catalogEntries.filter((entry) => !panelOrder.includes(entry.panelId)),
    [catalogEntries, panelOrder],
  );

  const handleSelect = (panelId) => {
    onAddPanel(panelId);
    onClose();
  };

  const activeCellName = selectedCells.find((c) => c.id === activeCellId)?.name;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Add chart from catalog
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pb: 1 }}>
          {needsCellPick && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Cell
              </Typography>
              <Select
                fullWidth
                size="small"
                value={pickCellId ?? ''}
                onChange={(e) => setPickCellId(Number(e.target.value))}
              >
                {selectedCells.map((cell) => (
                  <MenuItem key={cell.id} value={cell.id}>
                    {cell.name}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}

          {!needsCellPick && activeCellName && (
            <Typography variant="body2" color="text.secondary">
              Charts available for <strong>{activeCellName}</strong>
            </Typography>
          )}

          {error && (
            <Typography variant="body2" color="warning.main">
              {error}
            </Typography>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : addableEntries.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              All available charts are already on the dashboard.
            </Typography>
          ) : (
            <List disablePadding>
              {addableEntries.map((entry) => (
                <ListItemButton
                  key={entry.panelId}
                  onClick={() => handleSelect(entry.panelId)}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemText
                    primary={entry.label}
                    secondary={entry.description}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                  <Chip
                    size="small"
                    label={entry.category}
                    sx={{ ml: 1, textTransform: 'capitalize' }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

AddChartModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedCells: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string,
    }),
  ).isRequired,
  panelOrder: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAddPanel: PropTypes.func.isRequired,
};

export default AddChartModal;
