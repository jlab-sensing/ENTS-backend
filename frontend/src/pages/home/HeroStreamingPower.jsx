import { React, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Box, Typography } from '@mui/material';
import Chip from '@mui/material/Chip';
import {
  Chart as ChartJS,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-luxon';

ChartJS.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend);

// Fixed cycle: draw 30 points per run. Seed first 8, then add 22 more.
const CYCLE_POINTS = 30;
const PRESEED_POINTS = 8; // how many points to show immediately on load/restart

export default function HeroStreamingPower({ height = 360, intervalMs = 2500 }) {
  const chartRef = useRef(null);
  const countRef = useRef(0);
  const containerRef = useRef(null);
  const driftRef = useRef(0);
  const [yBounds, setYBounds] = useState({ min: -0.3, max: 0.3, step: 0.06 });
  const yBoundsRef = useRef(yBounds);

  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const nextPower = (prevY) => {
    // Slow drift plus tiny noise for stock-like motion with bounce at bounds
    driftRef.current = clamp(
      driftRef.current + (Math.random() - 0.5) * 0.002,
      -0.006,
      0.006,
    );
    const noise = (Math.random() - 0.5) * 0.01;
    const base = (prevY ?? -0.12) + driftRef.current + noise;
    const range = Math.max(0.001, yBoundsRef.current.max - yBoundsRef.current.min);
    const minB = yBoundsRef.current.min + range * 0.02; // inner bounds to avoid touching edges
    const maxB = yBoundsRef.current.max - range * 0.02;

    let y = base;
    if (base < minB) {
      // reflect back in-range and invert/dampen drift to head upward
      y = minB + (minB - base);
      driftRef.current = Math.abs(driftRef.current) * 0.6;
    } else if (base > maxB) {
      // reflect back in-range and invert/dampen drift to head downward
      y = maxB - (base - maxB);
      driftRef.current = -Math.abs(driftRef.current) * 0.6;
    }
    return clamp(y, yBoundsRef.current.min, yBoundsRef.current.max);
  };
  const [data, setData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Power (µW)',
        data: [],
        borderColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return '#E27022';
          const gradient = c.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
          gradient.addColorStop(0, '#FFAE66');
          gradient.addColorStop(1, '#E27022');
          return gradient;
        },
        borderWidth: 2.75,
        spanGaps: true,
        pointStyle: 'circle',
        pointRadius: 3,
        pointHoverRadius: 6,
        hitRadius: 8,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: '#E27022',
        pointBorderWidth: 2,
        // Soft gradient fill to origin (0)
        fill: 'origin',
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(226,112,34,0.12)';
          const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(226,112,34,0.16)');
          gradient.addColorStop(1, 'rgba(226,112,34,0.02)');
          return gradient;
        },
        // allow drawing slightly beyond chart area so last point isn't clipped
        clip: 20,
      },
    ],
  });
  const timerRef = useRef(null);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { right: 36 } },
      // No animation when joining points
      animation: false,
      parsing: false,
      elements: { line: { tension: 0.1 } },
      animations: { x: { duration: 0 }, y: { duration: 0 } },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'second',
            tooltipFormat: 'HH:mm:ss',
            displayFormats: { second: 'HH:mm:ss' },
          },
          grid: { display: true, color: 'rgba(0,0,0,0.06)', drawBorder: false, tickLength: 6 },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            autoSkipPadding: 24,
            maxTicksLimit: 5,
            font: { size: 10 },
          },
          // Fixed left->right realtime window for the current cycle
          min: data.labels && data.labels.length ? data.labels[0] : Date.now(),
          max:
            (data.labels && data.labels.length ? data.labels[0] : Date.now()) +
            (CYCLE_POINTS - 1) * intervalMs + Math.floor(intervalMs * 0.1),
        },
        y: {
          title: { display: true, text: 'Power (µW)' },
          grid: { color: 'rgba(0,0,0,0.06)', drawBorder: false, tickLength: 6 },
          ticks: { maxTicksLimit: 10, stepSize: yBounds.step, font: { size: 10 } },
          min: yBounds.min,
          max: yBounds.max,
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          intersect: false,
          mode: 'index',
          callbacks: {
            label: (ctx) => {
              const y = ctx.parsed.y;
              const idx = ctx.dataIndex;
              const series = ctx.dataset.data || [];
              let deltaTxt = '';
              if (idx > 0 && series[idx - 1] && typeof series[idx - 1].y === 'number') {
                const d = y - series[idx - 1].y;
                const sign = d > 0 ? '+' : '';
                deltaTxt = `  (${sign}${d.toFixed(3)} µW)`;
              }
              return `Power: ${y.toFixed(3)} µW${deltaTxt}`;
            },
          },
        },
      },
    }),
    [intervalMs, data.labels, yBounds],
  );

  // keep ref in sync so generator uses latest bounds
  useEffect(() => {
    yBoundsRef.current = yBounds;
  }, [yBounds]);

  // Glow plugin to highlight the newest point and soft shadow for the line
  const glowPlugin = useMemo(
    () => ({
      id: 'heroGlow',
      afterDatasetsDraw: (chart) => {
        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);
        if (!meta || !meta.dataset) return;
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(226,112,34,0.35)';
        meta.dataset.draw(ctx);
        ctx.restore();

        const lastEl = meta.data && meta.data[meta.data.length - 1];
        if (!lastEl) return;
        const { x, y } = lastEl.getProps(['x', 'y'], true);
        const radGrad = ctx.createRadialGradient(x, y, 0, x, y, 18);
        radGrad.addColorStop(0, 'rgba(226,112,34,0.45)');
        radGrad.addColorStop(1, 'rgba(226,112,34,0)');
        ctx.save();
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = '#E27022';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      },
    }),
    [],
  );

  // Pulse ring around latest point for an elegant focal motion
  const pulsePlugin = useMemo(
    () => ({
      id: 'heroPulse',
      afterDatasetsDraw: (chart) => {
        const meta = chart.getDatasetMeta(0);
        if (!meta || !meta.data || !meta.data.length) return;
        const { ctx } = chart;
        const el = meta.data[meta.data.length - 1];
        const { x, y } = el.getProps(['x', 'y'], true);
        const t = Date.now();
        const r = 7 + 3 * (0.5 + 0.5 * Math.sin((t % 2000) / 2000 * Math.PI * 2));
        ctx.save();
        ctx.strokeStyle = 'rgba(226,112,34,0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      },
    }),
    [],
  );

  // Crosshair on hover
  const crosshairPlugin = useMemo(
    () => ({
      id: 'heroCrosshair',
      afterDatasetsDraw: (chart) => {
        const { ctx, chartArea: area } = chart;
        const active = chart.tooltip && chart.tooltip.getActiveElements ? chart.tooltip.getActiveElements() : [];
        if (!active || !active.length) return;
        const { datasetIndex, index } = active[0];
        const meta = chart.getDatasetMeta(datasetIndex);
        if (!meta || !meta.data || !meta.data[index]) return;
        const { x } = meta.data[index].getProps(['x'], true);
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, area.top);
        ctx.lineTo(x, area.bottom);
        ctx.stroke();
        ctx.restore();
      },
    }),
    [],
  );

  // Zero baseline if within range
  const zeroBaselinePlugin = useMemo(
    () => ({
      id: 'heroZeroBaseline',
      afterDraw: (chart) => {
        const yScale = chart.scales.y;
        if (!yScale) return;
        const zeroY = yScale.getPixelForValue(0);
        const { top, bottom, left, right } = chart.chartArea;
        if (zeroY >= top && zeroY <= bottom) {
          const { ctx } = chart;
          ctx.save();
          ctx.strokeStyle = 'rgba(0,0,0,0.12)';
          ctx.lineWidth = 1;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(left, zeroY);
          ctx.lineTo(right, zeroY);
          ctx.stroke();
          ctx.restore();
        }
      },
    }),
    [],
  );

  useEffect(() => {
    // Helper to seed the chart with a small window of points in the past
    const niceStep = (raw) => {
      const candidates = [0.01, 0.02, 0.05, 0.1, 0.2];
      for (const c of candidates) {
        if (raw <= c) return c;
      }
      return candidates[candidates.length - 1];
    };

    const reseedWithInitialPoints = () => {
      const end = Date.now();
      const start = end - (PRESEED_POINTS - 1) * intervalMs;
      const labels = [];
      const series = [];
      let y = -0.12;
      for (let i = 0; i < PRESEED_POINTS; i += 1) {
        y = nextPower(y);
        const t = start + i * intervalMs;
        labels.push(t);
        series.push({ x: t, y });
      }
      countRef.current = PRESEED_POINTS;
      // compute y bounds for ~10 ticks; keep constant for the cycle
      const values = series.map((p) => p.y);
      const minV = Math.min(...values);
      const maxV = Math.max(...values);
      const range = Math.max(0.05, maxV - minV);
      const pad = range * 0.2;
      const min = minV - pad;
      const max = maxV + pad;
      const step = niceStep((max - min) / 10);
      setYBounds({ min, max, step });
      setData((prev) => ({ ...prev, labels, datasets: [{ ...prev.datasets[0], data: series }] }));
    };

    // Seed on mount
    reseedWithInitialPoints();

    timerRef.current = setInterval(() => {
      setData((prev) => {
        const prevData = prev.datasets[0].data || [];
        const lastY = prevData.length ? prevData[prevData.length - 1].y : -0.12;
        const lastT = prev.labels.length ? prev.labels[prev.labels.length - 1] : Date.now();
        // If reached cycle limit (30), reseed 8 fresh random points and continue
        if (prev.labels.length >= CYCLE_POINTS) {
          reseedWithInitialPoints();
          return prev; // state will be set by reseed above
        }
        const nextX = lastT + intervalMs;
        const nextPoint = { x: nextX, y: nextPower(lastY) };
        const nextLabels = [...prev.labels, nextPoint.x];
        const nextSeries = [...prevData, nextPoint];
        countRef.current += 1;
        return { ...prev, labels: nextLabels, datasets: [{ ...prev.datasets[0], data: nextSeries }] };
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  // Stats for header chips
  const stats = useMemo(() => {
    const series = (data && data.datasets && data.datasets[0] && data.datasets[0].data) || [];
    if (!series.length) {
      return { current: null, delta: null, min: null, max: null, avg: null };
    }
    const values = series.map((p) => p.y);
    const current = values[values.length - 1];
    const prev = values.length > 1 ? values[values.length - 2] : null;
    const delta = prev != null ? current - prev : null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { current, delta, min, max, avg };
  }, [data]);

  const fmt = (v, digits = 3) => (v == null ? '-' : `${v.toFixed(digits)} µW`);

  return (
    <Box ref={containerRef} sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant='h6' sx={{ color: '#1E2D25', fontWeight: 700 }}>Live Power Data</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
        <Chip size='small' label={`Now: ${fmt(stats.current, 3)}`} sx={{ backgroundColor: '#ffffff', border: '1px solid #D9E5DC' }} />
        <Chip size='small' label={`Min: ${fmt(stats.min, 3)}`} sx={{ backgroundColor: '#ffffff', border: '1px solid #D9E5DC' }} />
        <Chip size='small' label={`Max: ${fmt(stats.max, 3)}`} sx={{ backgroundColor: '#ffffff', border: '1px solid #D9E5DC' }} />
        <Chip size='small' label={`Avg: ${fmt(stats.avg, 3)}`} sx={{ backgroundColor: '#ffffff', border: '1px solid #D9E5DC' }} />
      </Box>
      <div style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}>
        <Line ref={chartRef} data={data} options={options} plugins={[glowPlugin, pulsePlugin, crosshairPlugin, zeroBaselinePlugin]} />
      </div>
    </Box>
  );
}

HeroStreamingPower.propTypes = {
  height: PropTypes.number,
  intervalMs: PropTypes.number,
};
