// Geomagnetic contour builder.
//
// Evaluates a chosen field quantity (declination or total intensity) on a global
// lat/lon grid for a model + date, then extracts isolines via marching squares.
// Output is lat/lon geometry only — projection-agnostic, so the render layer can
// push it through whatever map projection is active (js/render/geomag.js).
//
// computeField(model, quantity, year, step) -> { lats, lons, grid }
// computeContours(...)                       -> { levels, segments[], grid, lats, lons }
//   segments: [{ level, isZero, pts: [[lat,lon],[lat,lon], ...] }]  (LineSegments pairs)

import { fieldAt } from './field.js';

const range = (a, b, step) => { const o = []; for (let v = a; v <= b + 1e-9; v += step) o.push(v); return o; };

export function computeField(modelKey, quantity, year, step = 2) {
  const latMax = quantity === 'declination' ? 87 : 89;   // D is singular at the poles
  const lats = range(-latMax, latMax, step);
  const lons = range(-180, 180, step);
  const grid = lats.map((lat) => lons.map((lon) => {
    const f = fieldAt(modelKey, lat, lon, 0, year);
    return quantity === 'declination' ? f.D : f.F;
  }));
  return { lats, lons, grid };
}

// Interval + value extent per quantity (nT for intensity, degrees for declination).
export function quantityScale(quantity) {
  return quantity === 'declination'
    ? { levels: range(-180, 180, 5), min: -30, max: 30, zero: 0, unit: '°', interval: 5 }
    : { levels: range(20000, 66000, 4000), min: 22000, max: 66000, zero: null, unit: 'nT', interval: 4000 };
}

export function computeContours(modelKey, quantity, year, step = 2) {
  const { lats, lons, grid } = computeField(modelKey, quantity, year, step);
  const { levels } = quantityScale(quantity);
  const wrap = quantity === 'declination';   // declination is an angle: skip cells spanning the ±180 seam
  const segments = [];

  for (let i = 0; i < lats.length - 1; i++) {
    for (let j = 0; j < lons.length - 1; j++) {
      // cell corners (value, lat, lon): SW, SE, NE, NW
      const c = [
        { v: grid[i][j],         lat: lats[i],     lon: lons[j] },
        { v: grid[i][j + 1],     lat: lats[i],     lon: lons[j + 1] },
        { v: grid[i + 1][j + 1], lat: lats[i + 1], lon: lons[j + 1] },
        { v: grid[i + 1][j],     lat: lats[i + 1], lon: lons[j] },
      ];
      if (wrap) {
        const vs = c.map((p) => p.v);
        if (Math.max(...vs) - Math.min(...vs) > 180) continue;   // seam / pole singularity: drop
      }
      for (const level of levels) {
        // edge crossings (4 edges of the cell)
        const cross = [];
        for (let e = 0; e < 4; e++) {
          const a = c[e], b = c[(e + 1) % 4];
          if ((a.v - level) * (b.v - level) < 0) {
            const t = (level - a.v) / (b.v - a.v);
            cross.push([a.lat + (b.lat - a.lat) * t, a.lon + (b.lon - a.lon) * t]);
          }
        }
        if (cross.length === 2) segments.push({ level, isZero: level === 0, pts: cross });
        else if (cross.length === 4) {
          segments.push({ level, isZero: level === 0, pts: [cross[0], cross[1]] });
          segments.push({ level, isZero: level === 0, pts: [cross[2], cross[3]] });
        }
      }
    }
  }
  return { levels, segments, grid, lats, lons, quantity };
}
