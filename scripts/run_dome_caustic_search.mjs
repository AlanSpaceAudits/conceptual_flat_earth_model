// Offline runner for the 720-combo dome-caustic brute force.
//
// Mirrors the search the app does on toggle, with a representative
// Antarctic 24-h-sun configuration as the input geometry. Reports the
// winning combination and the best alignment dot product, plus the top
// few runners-up.

import { traceDomeCaustic } from '../js/render/domeCaustic.js';

const FE_RADIUS = 1;

// Observer: roughly the West-Antarctica 24h-sun station (-79.77°, -83.26°).
// FE polar AE position: r = (90 − lat) / 180 = 169.77/180 = 0.943.
const obsLat = -79.77;
const obsLon = -83.26;
const obsR   = (90 - obsLat) / 180 * FE_RADIUS;
const obsLonR = obsLon * Math.PI / 180;
const obs = [obsR * Math.cos(obsLonR), obsR * Math.sin(obsLonR), 0];

// Sun: austral-summer-solstice noon UT-ish. Dec ≈ −23.4, GP_lon = 0
// (good enough for a first cut). Vault height 0.3 (default-ish).
const sunLat = -23.4;
const sunLon = 0;
const sunR   = (90 - sunLat) / 180 * FE_RADIUS;
const sunLonR = sunLon * Math.PI / 180;
const baseSunZ = 0.3;
const sunVault = [sunR * Math.cos(sunLonR), sunR * Math.sin(sunLonR), baseSunZ];

// Apparent-sun direction from observer (the same vector the search
// scores against in app.js).
const tdx = sunVault[0] - obs[0];
const tdy = sunVault[1] - obs[1];
const tdz = sunVault[2] - obs[2];
const tlen = Math.hypot(tdx, tdy, tdz);
const tx = tdx / tlen, ty = tdy / tlen, tz = tdz / tlen;
console.log('observer:', obs.map(v => v.toFixed(3)));
console.log('sun vault:', sunVault.map(v => v.toFixed(3)));
console.log('apparent sun direction:', [tx, ty, tz].map(v => v.toFixed(3)));
console.log('apparent sun elevation:', (Math.asin(tz) * 180 / Math.PI).toFixed(2), 'deg');
console.log('');

const sizes      = [0.6, 0.8, 1.0, 1.2, 1.4];
const heights    = [0.10, 0.25, 0.40, 0.55, 0.70, 0.85];
const sunZMults  = [0.5, 1.0, 1.5];
const profiles   = [1.5, 2.0, 3.0, 5.0];
const bounceList = [1, 2];

const evalCombo = (sz, dh, sm, pp, nb) => {
  const sunPos = [sunVault[0], sunVault[1], sm * baseSunZ];
  const dr = sz * FE_RADIUS;
  const r = traceDomeCaustic({
    sunPos, domeR: dr, domeH: dh,
    domeProfile: pp, nBounces: nb,
    discClipR: FE_RADIUS * 1.4,
    nTheta: 60, nPhi: 30,
    observerCoord: obs,
  });
  let bestDot = -Infinity;
  let bestPeak = null;
  for (const p of (r.peaks || [])) {
    const r2 = (p.x * p.x + p.y * p.y) / (dr * dr);
    const peakZ = r2 < 1 ? dh * Math.pow(1 - Math.pow(Math.sqrt(r2), pp), 1 / pp) : 0;
    const dx = p.x - obs[0];
    const dy = p.y - obs[1];
    const dz = peakZ - obs[2];
    const dlen = Math.hypot(dx, dy, dz);
    if (dlen < 1e-9 || dz <= 0) continue;
    const dot = (dx * tx + dy * ty + dz * tz) / dlen;
    if (dot > bestDot) { bestDot = dot; bestPeak = { x: p.x, y: p.y, z: peakZ, dot }; }
  }
  return { dot: bestDot, peak: bestPeak };
};

const results = [];
const t0 = Date.now();
for (const sz of sizes) {
  for (const dh of heights) {
    for (const sm of sunZMults) {
      for (const pp of profiles) {
        for (const nb of bounceList) {
          const r = evalCombo(sz, dh, sm, pp, nb);
          results.push({ sz, dh, sm, pp, nb, dot: r.dot, peak: r.peak });
        }
      }
    }
  }
}
const dtMs = Date.now() - t0;
console.log(`${results.length} combinations evaluated in ${dtMs} ms`);

results.sort((a, b) => b.dot - a.dot);
console.log('\nTop 10 combinations (by alignment dot product):');
for (let i = 0; i < Math.min(10, results.length); i++) {
  const r = results[i];
  if (!isFinite(r.dot)) {
    console.log(`  ${i + 1}. (no aligned peak found) sz=${r.sz} dh=${r.dh} sm=${r.sm} p=${r.pp} bounces=${r.nb}`);
    continue;
  }
  const angle = Math.acos(Math.min(1, Math.max(-1, r.dot))) * 180 / Math.PI;
  const peakLoc = r.peak ? `peak=(${r.peak.x.toFixed(2)}, ${r.peak.y.toFixed(2)}, ${r.peak.z.toFixed(2)})` : '';
  console.log(`  ${i + 1}. sz=${r.sz.toFixed(2)} dh=${r.dh.toFixed(2)} sm=${r.sm.toFixed(2)} p=${r.pp.toFixed(1)} bounces=${r.nb}  dot=${r.dot.toFixed(4)} (${angle.toFixed(1)}° off-target) ${peakLoc}`);
}

const valid = results.filter(r => isFinite(r.dot));
const stats = valid.length
  ? {
      n: valid.length,
      best: valid[0].dot,
      median: valid[Math.floor(valid.length / 2)].dot,
      worst: valid[valid.length - 1].dot,
    }
  : null;
console.log('\nValid-result stats:', stats);
