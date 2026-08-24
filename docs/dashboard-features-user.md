# DirtViz Dashboard — User Guide

This guide explains how to use the new dashboard features: customizable chart layouts, derived equations, live streaming, and CSV export.

For local setup and login requirements, see [development.md](./development.md).

---

## Getting started

1. Open the **Dashboard** and sign in (Live mode requires a logged-in session).
2. Select one or more **cells** from the cell dropdown at the top.
3. Charts appear automatically based on what sensors each cell has. Adding another cell appends any new chart types that cell introduces; fully switching to a different set of cells rebuilds the default layout for that selection.
4. Use **Hourly** for historical data over your chosen date range, or **Live** to watch new measurements arrive in real time.

---

## Chart layout

### What you see

Each chart is a **panel** — a card on the dashboard. Power, TEROS, CO₂, soil tension, and other sensor types each get their own panel when data exists for your selected cells.

When multiple cells are selected, most panels show **one line per cell** on the same chart (for example, three cells → three voltage lines on one Voltage & Current panel).

### Reorder panels

1. Hover over a chart panel.
2. Drag the **≡** handle (top-left) to move the panel.
3. Order is saved in the page URL automatically, so you can bookmark or share the layout.

### Remove a panel

1. Hover over the panel.
2. Click **×** (top-right) to remove it from the layout.

You need at least one panel on the dashboard; the last panel cannot be removed.

### Change column layout

Use the grid icons above the charts:

- **Two columns** — side-by-side panels (default on wide screens).
- **Single column** — full-width panels stacked vertically.

### Add a chart

1. Click **+ ADD CHART**.
2. If multiple cells are selected, pick which cell’s catalog to browse.
3. Choose a chart type from the list (Voltage & Current, Soil Tension, CO₂, etc.).
4. The new panel appears and the URL updates.

If a chart type is **already on the dashboard**, it will not appear again in the list. Adding the same measurement type for another cell does not create a duplicate panel — the existing chart will include the new cell as an additional line when that cell is selected.

When you **add a cell** to an existing selection, panels for that cell’s new sensor types are appended automatically (you do not need Add Chart for those). When you **replace** the selection with a completely different set of cells, the dashboard rebuilds the default panel set for the new cells. Clearing all cells also clears the `layout` parameter from the URL.

### Restore a removed chart

Use **+ ADD CHART** and pick the type you removed. It reappears on the dashboard.

---

## Derived equations

Create custom calculated charts from sensor streams (for example, ratio of VWC to temperature).

### Add an equation panel

1. Click **Σ ADD EQUATION**.
2. Enter an expression using **cellId:stream** tokens, for example:
   - `407:vwc / 407:temp`
   - `1:co2 * 2`
   - `3:pressure - 1013`
3. Use operators: `+`, `-`, `*`, `/`, `^` (power), and parentheses.
4. Click **Save**. The equation appears as its own panel.

Quick-insert chips in the modal help you build expressions. Examples update based on your first selected cell.

### Edit or remove an equation

- **Edit:** Hover the equation panel → click the pencil icon → change the expression → Save.
- **Remove:** Hover → click **×**.

### Supported streams (examples)

| Token suffix | Meaning |
|--------------|---------|
| `vwc`, `temp`, `ec` | TEROS soil moisture, temperature, conductivity |
| `voltage`, `current`, `power` (or `v`, `i`, `p`) | Power measurements |
| `co2`, `pressure`, `humidity`, `temperature` | Generic sensor streams (BME280, CO₂, etc.) |

Use the form **`{cell id}:{stream}`** — the cell id must match a cell you have selected.

### Historical vs Live

- **Hourly:** The equation is computed from historical data over your date range, using the same downsample setting as other charts (None / Hourly / Daily).
- **Live:** The equation updates as new websocket measurements arrive. All inputs must receive at least one value before the first point is plotted; operands that arrive in separate packets are combined using each input’s **latest known value**.

Live mode requires you to be signed in.

---

## Date range and downsampling

- Set **start** and **end** dates with the date pickers (Hourly mode only).
- Choose downsampling: **None**, **Hourly**, or **Daily**. This controls how dense the historical charts and CSV export are.
- The dashboard may auto-adjust the range to match when your cell last reported data.

---

## Export to CSV

1. Stay in **Hourly** mode (export is hidden in Live mode).
2. Select the cells and panels you want included.
3. Click **EXPORT TO CSV**.

**What you get:**

- **One CSV file per selected cell** (for example `Cell_A.csv`, `Cell_B.csv`).
- Columns match the panels currently on your dashboard and the visible date range.
- Downsampling matches your chart setting (None / Hourly / Daily).
- Missing values appear as `NAN`.

Wait until charts finish loading before exporting; the button shows **DOWNLOADING...** while data is still loading.

---

## Sharing a dashboard view

The URL stores your setup:

| Parameter | Meaning |
|-----------|---------|
| `cell_id` | Comma-separated cell ids (e.g. `407,408,2578`) |
| `startDate` / `endDate` | Date range (when manually set) |
| `layout` | Panel order and types (e.g. `v1:vi,vwc,temp,co2`) |

Copy the link from the address bar. Opening the link restores cells, layout, and (when present) dates.

**Layout short names (examples):**

| URL token | Chart |
|-----------|-------|
| `vi` | Voltage & Current |
| `power` | Power |
| `vwc` | VWC & EC |
| `temp` | Temperature |
| `co2` | CO₂ |
| `presHum` | Pressure & humidity |
| `1:vwc / 1:temp` | Derived equation (full expression in URL) |

If a shared layout references charts your cells do not have, a notification warns which panels could not be loaded.

---

## Live streaming tips

- Toggle **Live** to watch charts update in real time.
- You must be **logged in** to enable Live.
- Select the cells that are actually receiving uploads; live data is scoped per cell.
- Equation panels in Live mode follow the same websocket stream as power and sensor charts.

On the development preview server, use cells that have active upload streams configured. Production DirtViz uses the same host for the page and websocket connection.

---

## Common questions

**Why is a chart empty?**  
No data in the selected date range, the cell has no sensor of that type, or data is still loading. Try widening the date range or confirming the cell has uploads. If you combined cells with very different data windows (for example March legacy power on one cell and recent generic sensors on another), the smart date range may jump to a window where some panels have no points — adjust the dates manually.

**Why did Add Chart not add a second Soil Tension panel?**  
Same measurement type across cells shares one panel. Select all relevant cells; each appears as its own series on that chart.

**Why didn’t a new cell’s charts appear?**  
Adding a cell should append its new chart types automatically. If a type is already on the board, it is reused (no duplicate panel). Fully swapping cells rebuilds the default set. You can always use **+ ADD CHART** for anything still missing.

**Why does CSV not match what I see after changing downsampling?**  
Wait for charts to finish reloading after changing None/Hourly/Daily, then export again.

**Why won’t Live turn on?**  
Sign in first. Live is disabled for logged-out users.

---

## Related issues and PRs

| Feature | Issue / PR |
|---------|------------|
| Dynamic layout & Add Chart | [#675](https://github.com/jlab-sensing/ENTS-backend/issues/675), [#770](https://github.com/jlab-sensing/ENTS-backend/pull/770) |
| Derived equations | [#780](https://github.com/jlab-sensing/ENTS-backend/pull/780) |
| Live equation streaming | [#805](https://github.com/jlab-sensing/ENTS-backend/pull/805) |
| CSV export | [#468](https://github.com/jlab-sensing/ENTS-backend/issues/468), [#797](https://github.com/jlab-sensing/ENTS-backend/pull/797) |
| CSV honors downsample | [#813](https://github.com/jlab-sensing/ENTS-backend/issues/813), [#815](https://github.com/jlab-sensing/ENTS-backend/pull/815) |
| One chart per sensor type | [#804](https://github.com/jlab-sensing/ENTS-backend/issues/804), [#816](https://github.com/jlab-sensing/ENTS-backend/pull/816) |
| Auto-add panels on cell change / clear layout | [#817](https://github.com/jlab-sensing/ENTS-backend/issues/817), [#819](https://github.com/jlab-sensing/ENTS-backend/pull/819) |
