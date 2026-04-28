// Southern-hemisphere non-stop flight routes from the KMZ
// "Southern Non-Stop". Each city carries WGS-84 lat / lon (degrees,
// east-positive, north-positive). Each flight pairs two city ids so
// the renderer can resolve coordinates without duplication.

export const FLIGHT_CITIES = [
  { id: 'syd', name: 'Sydney',       lat: -33.95003, lon:  151.18169 },
  { id: 'scl', name: 'Santiago',     lat: -33.39710, lon:  -70.79368 },
  { id: 'mel', name: 'Melbourne',    lat: -37.67082, lon:  144.84298 },
  { id: 'akl', name: 'Auckland',     lat: -37.00894, lon:  174.78638 },
  { id: 'jnb', name: 'Johannesburg', lat: -26.13939, lon:   28.24679 },
  { id: 'drw', name: 'Darwin',       lat: -12.41323, lon:  130.88129 },
  { id: 'gru', name: 'Sao Paulo',    lat: -23.43022, lon:  -46.47167 },
  { id: 'eze', name: 'Buenos Aires', lat: -34.81653, lon:  -58.53727 },
  { id: 'per', name: 'Perth',        lat: -31.93855, lon:  115.96725 },
];

export const FLIGHT_ROUTES = [
  { id: 'mel-scl', from: 'mel', to: 'scl', label: 'Melbourne ↔ Santiago' },
  { id: 'scl-syd', from: 'scl', to: 'syd', label: 'Santiago ↔ Sydney' },
  { id: 'akl-scl', from: 'akl', to: 'scl', label: 'Auckland ↔ Santiago' },
  { id: 'jnb-gru', from: 'jnb', to: 'gru', label: 'Johannesburg ↔ Sao Paulo' },
  { id: 'jnb-per', from: 'jnb', to: 'per', label: 'Johannesburg ↔ Perth' },
  { id: 'jnb-syd', from: 'jnb', to: 'syd', label: 'Johannesburg ↔ Sydney' },
  { id: 'eze-drw', from: 'eze', to: 'drw', label: 'Buenos Aires ↔ Darwin' },
];

export function cityById(id) {
  return FLIGHT_CITIES.find((c) => c.id === id) || null;
}

// Great-circle interpolation between two (lat, lon) points (degrees).
// Returns `n` evenly-spaced samples along the spherical arc, including
// endpoints. Spherical-linear interpolation in 3-D unit-vector space
// keeps the arc on the geodesic regardless of how far apart the
// endpoints are (handles antipodes by falling back to the meridian
// through the start point — those don't appear in the route list).
export function greatCircleArc(latA, lonA, latB, lonB, n = 96) {
  const toR = Math.PI / 180;
  const toD = 180 / Math.PI;
  const φa = latA * toR, λa = lonA * toR;
  const φb = latB * toR, λb = lonB * toR;
  const ax = Math.cos(φa) * Math.cos(λa);
  const ay = Math.cos(φa) * Math.sin(λa);
  const az = Math.sin(φa);
  const bx = Math.cos(φb) * Math.cos(λb);
  const by = Math.cos(φb) * Math.sin(λb);
  const bz = Math.sin(φb);
  let dot = ax * bx + ay * by + az * bz;
  dot = Math.max(-1, Math.min(1, dot));
  const ω = Math.acos(dot);
  const sinω = Math.sin(ω);
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    let cx, cy, cz;
    if (sinω < 1e-9) {
      cx = ax; cy = ay; cz = az;
    } else {
      const sa = Math.sin((1 - t) * ω) / sinω;
      const sb = Math.sin(t * ω) / sinω;
      cx = sa * ax + sb * bx;
      cy = sa * ay + sb * by;
      cz = sa * az + sb * bz;
    }
    const r = Math.hypot(cx, cy, cz) || 1;
    const lat = Math.asin(cz / r) * toD;
    const lon = Math.atan2(cy, cx) * toD;
    out[i] = { lat, lon };
  }
  return out;
}

// Central angle between two (lat, lon) points in degrees. Equal to
// great-circle distance / Earth radius — used for the central-angle
// demo overlay so the user can see numerically that the southern
// non-stop legs match the northern equivalents in arc length.
export function centralAngleDeg(latA, lonA, latB, lonB) {
  const toR = Math.PI / 180;
  const φa = latA * toR, λa = lonA * toR;
  const φb = latB * toR, λb = lonB * toR;
  const dot = Math.sin(φa) * Math.sin(φb)
            + Math.cos(φa) * Math.cos(φb) * Math.cos(λa - λb);
  return Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
}

// Format a duration (in seconds) as `HH:MM:SS`.
export function formatHMS(sec) {
  if (sec == null || !isFinite(sec)) return '—';
  const total = Math.round(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Format an angular rate (degrees per hour) as `D° MM' SS.S"/h`.
// Negative inputs render with a leading `−`. Returns `—` for null /
// non-finite. The angle-only convention matches the rest of the
// flight-routes demos: this project stays in central-angle + time
// units and never reports linear distance / speed.
export function formatDmsPerHour(degPerHour) {
  if (degPerHour == null || !isFinite(degPerHour)) return '—';
  const sign = degPerHour < 0 ? '−' : '';
  const total = Math.abs(degPerHour);
  const d = Math.floor(total);
  const mFloat = (total - d) * 60;
  const m = Math.floor(mFloat);
  const s = (mFloat - m) * 60;
  return `${sign}${d}° ${String(m).padStart(2, '0')}' ${s.toFixed(1).padStart(4, '0')}"/h`;
}

// Format a signed delta (in seconds) as `+M:SS` / `−M:SS`.
export function formatHMSDelta(sec) {
  if (sec == null || !isFinite(sec)) return '—';
  const sign = sec < 0 ? '−' : '+';
  const abs = Math.abs(Math.round(sec));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${sign}${m}:${String(s).padStart(2, '0')}`;
}

// Complementary half of the full great circle through (A, B): the
// long way from B back to A, passing through −A and −B. Returns `n`
// samples along that arc, including endpoints (B at i=0, A at i=n−1)
// — paired with `greatCircleArc(A, B, n)` you have the entire 360°
// of the great circle (route + complement) without overlap.
export function greatCircleComplement(latA, lonA, latB, lonB, n = 192) {
  const toR = Math.PI / 180;
  const toD = 180 / Math.PI;
  const φa = latA * toR, λa = lonA * toR;
  const φb = latB * toR, λb = lonB * toR;
  const ax = Math.cos(φa) * Math.cos(λa);
  const ay = Math.cos(φa) * Math.sin(λa);
  const az = Math.sin(φa);
  const bx = Math.cos(φb) * Math.cos(λb);
  const by = Math.cos(φb) * Math.sin(λb);
  const bz = Math.sin(φb);
  let dot = ax * bx + ay * by + az * bz;
  dot = Math.max(-1, Math.min(1, dot));
  const ω = Math.acos(dot);
  const sinω = Math.sin(ω) || 1e-9;
  // In-plane unit vector perpendicular to A: N = (B − cos(ω)·A) / sin(ω).
  const nx = (bx - ax * Math.cos(ω)) / sinω;
  const ny = (by - ay * Math.cos(ω)) / sinω;
  const nz = (bz - az * Math.cos(ω)) / sinω;
  // Parameterise the great circle by `s` ∈ [0, 2π] where `s=ω`
  // is at B; the complement runs from `s = ω` back round to
  // `s = 2π` (which is A again).
  const span = 2 * Math.PI - ω;
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const s = ω + t * span;
    const cs = Math.cos(s), ss = Math.sin(s);
    const cx = ax * cs + nx * ss;
    const cy = ay * cs + ny * ss;
    const cz = az * cs + nz * ss;
    const r = Math.hypot(cx, cy, cz) || 1;
    const lat = Math.asin(cz / r) * toD;
    const lon = Math.atan2(cy, cx) * toD;
    out[i] = { lat, lon };
  }
  return out;
}
