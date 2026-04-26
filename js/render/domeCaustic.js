// Dome caustic tracer.
//
// Treats the inside surface of the heavenly-vault dome as a specular
// reflector. From a point light source (the sun) inside the dome,
// trace a fan of rays, intersect each with the dome interior, reflect
// off the surface, then intersect the reflected ray with the disc
// plane (z = 0). Bins the disc-plane impact points into a 2-D density
// grid and returns the local maxima — these are the convergence
// points of the caustic, i.e. the candidate "ghost sun" projections.
//
// Geometry: ellipsoidal cap with equatorial radius `domeR` and apex
// height `domeH`. Cap occupies z >= 0.

const TWO_PI = Math.PI * 2;

export function traceDomeCaustic({
  sunPos,
  domeR = 1.0,
  domeH = 0.45,
  nTheta = 240,
  nPhi   = 120,
  discClipR = 1.5,
  gridN  = 96,
  topPeaks = 12,
  minIntensityFrac = 0.18,
  observerCoord = null,
} = {}) {
  const empty = { peaks: [], peakMax: 0, peakSun: null };
  if (!sunPos) return empty;
  const hits = [];
  const [ox, oy, oz] = sunPos;
  const R2 = domeR * domeR;
  const H2 = domeH * domeH;

  for (let i = 0; i < nPhi; i++) {
    const phi = ((i + 0.5) / nPhi) * (Math.PI / 2);
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    for (let j = 0; j < nTheta; j++) {
      const theta = (j / nTheta) * TWO_PI;
      const dx = sinPhi * Math.cos(theta);
      const dy = sinPhi * Math.sin(theta);
      const dz = cosPhi;

      const a = (dx * dx + dy * dy) / R2 + (dz * dz) / H2;
      const b = 2 * ((ox * dx + oy * dy) / R2 + (oz * dz) / H2);
      const c = (ox * ox + oy * oy) / R2 + (oz * oz) / H2 - 1;
      const disc = b * b - 4 * a * c;
      if (disc < 0) continue;
      const sq = Math.sqrt(disc);
      const t = (-b + sq) / (2 * a);
      if (t <= 1e-6) continue;
      const hx = ox + t * dx;
      const hy = oy + t * dy;
      const hz = oz + t * dz;
      if (hz < 0) continue;

      let gx = hx / R2;
      let gy = hy / R2;
      let gz = hz / H2;
      const gl = Math.sqrt(gx * gx + gy * gy + gz * gz);
      if (gl < 1e-12) continue;
      const nx = -gx / gl;
      const ny = -gy / gl;
      const nz = -gz / gl;

      const dot = dx * nx + dy * ny + dz * nz;
      const rx = dx - 2 * dot * nx;
      const ry = dy - 2 * dot * ny;
      const rz = dz - 2 * dot * nz;
      if (rz >= -1e-6) continue;

      const tDisc = -hz / rz;
      if (tDisc <= 0) continue;
      const fx = hx + tDisc * rx;
      const fy = hy + tDisc * ry;
      if (fx * fx + fy * fy > discClipR * discClipR) continue;
      hits.push([fx, fy]);
    }
  }
  if (!hits.length) return empty;

  // Bin hits into a square grid covering the disc (and a bit beyond).
  const cell = (2 * discClipR) / gridN;
  const grid = new Float32Array(gridN * gridN);
  for (let k = 0; k < hits.length; k++) {
    const [hx, hy] = hits[k];
    const ix = Math.floor((hx + discClipR) / cell);
    const iy = Math.floor((hy + discClipR) / cell);
    if (ix < 0 || ix >= gridN || iy < 0 || iy >= gridN) continue;
    grid[iy * gridN + ix] += 1;
  }

  // Local maxima: cell stronger than every 8-neighbour.
  let peakMax = 0;
  const maxima = [];
  for (let iy = 1; iy < gridN - 1; iy++) {
    for (let ix = 1; ix < gridN - 1; ix++) {
      const v = grid[iy * gridN + ix];
      if (v <= 0) continue;
      let isMax = true;
      for (let dy = -1; dy <= 1 && isMax; dy++) {
        for (let dx = -1; dx <= 1 && isMax; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (grid[(iy + dy) * gridN + (ix + dx)] > v) isMax = false;
        }
      }
      if (!isMax) continue;
      if (v > peakMax) peakMax = v;
      const x = (ix + 0.5) * cell - discClipR;
      const y = (iy + 0.5) * cell - discClipR;
      maxima.push({ x, y, v });
    }
  }
  if (!peakMax) return empty;

  // Threshold: keep peaks whose count is at least `minIntensityFrac`
  // of the global max. Sort by intensity, cap at `topPeaks`.
  const cutoff = peakMax * minIntensityFrac;
  const peaks = maxima
    .filter(p => p.v >= cutoff)
    .sort((a, b) => b.v - a.v)
    .slice(0, topPeaks)
    .map(p => ({ x: p.x, y: p.y, intensity: p.v / peakMax }));

  // Candidate "ghost sun": the peak whose direction-from-observer is
  // *most opposed* to the sun's direction-from-observer. A strict
  // ">135° antipodal" filter produced nothing for hemispherical
  // reflectors (which retro-focus to the sun side), so the picker
  // here always returns the best-available candidate; the renderer
  // can still gate on dot product or intensity if needed.
  let peakSun = null;
  if (observerCoord && peaks.length) {
    const ox = observerCoord[0];
    const oy = observerCoord[1];
    const sdx = sunPos[0] - ox;
    const sdy = sunPos[1] - oy;
    const sdLen = Math.hypot(sdx, sdy);
    if (sdLen > 1e-6) {
      const sUx = sdx / sdLen;
      const sUy = sdy / sdLen;
      let bestCos = Infinity;
      for (const p of peaks) {
        const pdx = p.x - ox;
        const pdy = p.y - oy;
        const pdLen = Math.hypot(pdx, pdy);
        if (pdLen < 1e-6) continue;
        const cosA = (pdx * sUx + pdy * sUy) / pdLen;
        if (cosA < bestCos) { bestCos = cosA; peakSun = p; }
      }
      if (peakSun) peakSun.opposedness = -bestCos;
    }
  }

  return { peaks, peakMax, peakSun };
}
