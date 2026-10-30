import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Container, Tooltip, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getStatistics } from '../services/statistics';

function formatCompactNumber(num) {
  if (num === null || num === undefined || Number.isNaN(num)) return '0';
  const val = Number(num);
  const abs = Math.abs(val);

  if (abs >= 1_000_000_000) {
    const formatted = (val / 1_000_000_000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}B`;
  }
  if (abs >= 1_000_000) {
    const formatted = (val / 1_000_000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`;
  }
  if (abs >= 100_000) {
    const formatted = (val / 1_000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}K`;
  }
  return val.toLocaleString('en-US');
}

function formatFullNumber(num) {
  if (num === null || num === undefined || Number.isNaN(num)) return '0';
  return Number(num).toLocaleString('en-US');
}

function formatDate(isoString) {
  if (!isoString) return 'No data yet';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatBlock({ accentColor, value, rawValue, label, subtext }) {
  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: { xs: 2, md: 2.5 },
        backgroundColor: '#FFFFFF',
        border: '1px solid #D9E5DC',
        borderRadius: '12px',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
        minHeight: { xs: 145, md: 165 },
        boxSizing: 'border-box',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 20px rgba(58, 90, 64, 0.1)',
          borderColor: '#3A5A40',
        },
      }}
    >
      {/* Top accent bar */}
      <Box
        sx={{
          height: 4,
          width: 38,
          backgroundColor: accentColor,
          borderRadius: 2,
          mb: 1.5,
          flexShrink: 0,
        }}
      />

      {/* Number with exact count hover tooltip */}
      <Tooltip
        title={rawValue ? `Exact count: ${rawValue}` : ''}
        arrow
        disableHoverListener={!rawValue || rawValue === value}
      >
        <Typography
          variant="h4"
          component="div"
          sx={{
            fontSize: { xs: '1.65rem', sm: '1.8rem', md: '1.95rem', lg: '1.85rem', xl: '2.1rem' },
            fontWeight: 800,
            color: '#2F4F3E',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            minHeight: { xs: 34, md: 38 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: rawValue && rawValue !== value ? 'help' : 'default',
          }}
        >
          {value}
        </Typography>
      </Tooltip>

      {/* Label */}
      <Typography
        variant="subtitle2"
        sx={{
          fontSize: { xs: '0.85rem', md: '0.9rem' },
          fontWeight: 700,
          color: '#364F42',
          mt: 0.75,
          lineHeight: 1.25,
          minHeight: { xs: 36, md: 40 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {label}
      </Typography>

      {/* Subtext */}
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.785rem',
          color: '#5B6B62',
          mt: 0.5,
          minHeight: 18,
          lineHeight: 1.3,
          display: 'block',
        }}
      >
        {subtext || '\u00A0'}
      </Typography>
    </Box>
  );
}

StatBlock.propTypes = {
  accentColor: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  rawValue: PropTypes.string,
  label: PropTypes.string.isRequired,
  subtext: PropTypes.string,
};

StatBlock.defaultProps = {
  accentColor: '#3A5A40',
  rawValue: '',
  subtext: '',
};

function StatisticsSection() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getStatistics();
      setStats(data);
    } catch (err) {
      setError('Unable to load network statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totalUploads = stats?.total_uploads ?? 0;
  const activeCells = stats?.active_cells ?? 0;
  const totalCells = stats?.total_cells ?? 0;
  const totalSites = stats?.total_sites ?? 0;
  const totalLoggers = stats?.total_loggers ?? 0;
  const totalSensors = stats?.total_sensors ?? 0;
  const errorRate = stats?.upload_error_rate ?? 0;
  const reliability = 100 - errorRate;

  const statItems = [
    {
      accentColor: '#2563EB',
      value: loading ? '—' : formatCompactNumber(totalUploads),
      rawValue: loading ? '' : formatFullNumber(totalUploads),
      label: 'Data Uploads',
      subtext: 'Packets ingested',
    },
    {
      accentColor: '#2F4F3E',
      value: loading ? '—' : `${reliability.toFixed(1)}%`,
      rawValue: '',
      label: 'Upload Reliability',
      subtext: `${errorRate.toFixed(1)}% error rate`,
    },
    {
      accentColor: '#B45309',
      value: loading ? '—' : formatCompactNumber(activeCells),
      rawValue: loading ? '' : formatFullNumber(activeCells),
      label: 'Active Cells',
      subtext: `${formatCompactNumber(totalCells)} total cells`,
    },
    {
      accentColor: '#0D9488',
      value: loading ? '—' : formatCompactNumber(totalSites),
      rawValue: loading ? '' : formatFullNumber(totalSites),
      label: 'Deployment Sites',
      subtext: 'Field locations',
    },
    {
      accentColor: '#588157',
      value: loading ? '—' : formatCompactNumber(totalLoggers),
      rawValue: loading ? '' : formatFullNumber(totalLoggers),
      label: 'Field Loggers',
      subtext: 'Hardware units',
    },
    {
      accentColor: '#7C3AED',
      value: loading ? '—' : formatCompactNumber(totalSensors),
      rawValue: loading ? '' : formatFullNumber(totalSensors),
      label: 'Sensor Channels',
      subtext: 'Active channels',
    },
  ];

  return (
    <Box
      component="section"
      id="statistics-section"
      sx={{
        background: 'linear-gradient(180deg, #F8FAF7 0%, #EEF3EC 100%)',
        borderBottom: '1px solid #D9E5DC',
        py: { xs: 4, md: 5 },
      }}
    >
      <Container maxWidth="xl">
        {/* Uniform Grid: exactly 6 blocks - 1 row on desktop (lg), 2 rows on tablet (md/sm), 3 rows on mobile (xs) */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(6, 1fr)',
            },
            gap: { xs: 1.5, md: 2 },
            alignItems: 'stretch',
          }}
        >
          {statItems.map((item) => (
            <Box
              key={item.label}
              sx={{
                display: 'flex',
                width: '100%',
              }}
            >
              <StatBlock
                accentColor={item.accentColor}
                value={item.value}
                rawValue={item.rawValue}
                label={item.label}
                subtext={item.subtext}
              />
            </Box>
          ))}
        </Box>

        {/* Minimal info / refresh footer */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            mt: 3.5,
            textAlign: 'center',
          }}
        >
          {stats?.latest_timestamp && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                color: '#5B6B62',
                fontSize: '0.815rem',
                gap: 0.75,
              }}
            >
              <AccessTimeIcon sx={{ fontSize: '0.95rem', color: '#5B6B62' }} />
              <span>Last uplink: {formatDate(stats.latest_timestamp)}</span>
            </Box>
          )}

          {error && (
            <Typography sx={{ color: '#EF4444', fontSize: '0.815rem', fontWeight: 600 }}>
              Status: Service Unavailable
            </Typography>
          )}

          <Button
            size="small"
            variant="outlined"
            aria-label="Refresh statistics"
            onClick={() => fetchStats(true)}
            disabled={loading || refreshing}
            startIcon={<RefreshIcon sx={{ fontSize: '0.95rem' }} />}
            sx={{
              backgroundColor: '#FFFFFF',
              color: '#3A5A40',
              borderColor: '#D9E5DC',
              borderRadius: '6px',
              px: 1.5,
              py: 0.5,
              fontSize: '0.815rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              '&:hover': {
                borderColor: '#3A5A40',
                backgroundColor: 'rgba(58, 90, 64, 0.04)',
              },
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export default StatisticsSection;
