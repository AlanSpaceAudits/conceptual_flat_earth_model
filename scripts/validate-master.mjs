// Master ephemeris accuracy vs DE405 / Espenak (apparent geocentric).
// Both are apparent of date, so this is a direct angular comparison.
// Run: node scripts/validate-master.mjs

import * as master from '../js/ephem/masterTang.js';
import * as apix from '../js/core/ephemerisAstropixels.js';

const BODIES = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

function sepArcsec(a, b) {
  if (!a || !b || !Number.isFinite(a.ra) || !Number.isFinite(b.ra)) return NaN;
  const c = Math.sin(a.dec) * Math.sin(b.dec)
          + Math.cos(a.dec) * Math.cos(b.dec) * Math.cos(a.ra - b.ra);
  return Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI * 3600;
}
const f = (x) => Number.isFinite(x) ? (x < 100 ? x.toFixed(2) : x.toFixed(0)).padStart(9) : '      n/a';

// DE405 table is trustworthy ~2020-2027 (its Moon tail degrades ~40" by 2028-30).
const dates = ['2020-03-20', '2021-08-01', '2022-12-21', '2024-04-08', '2025-06-13', '2026-10-15', '2027-09-23']
  .map((s) => new Date(s + 'T00:00:00Z'));

console.log('masterTang vs DE405/Espenak apparent geocentric, arcsec\n');
console.log('date        ' + BODIES.map((b) => b.slice(0, 7).padStart(9)).join(''));
const acc = {};
for (const d of dates) {
  const row = BODIES.map((b) => {
    const s = sepArcsec(master.bodyGeocentric(b, d), apix.bodyGeocentric(b, d));
    if (Number.isFinite(s)) (acc[b] ||= []).push(s);
    return f(s);
  }).join('');
  console.log(d.toISOString().slice(0, 10) + '  ' + row);
}
console.log('max arcsec  ' + BODIES.map((b) => f(acc[b] ? Math.max(...acc[b]) : NaN)).join(''));
console.log('rms arcsec  ' + BODIES.map((b) => {
  const a = acc[b]; if (!a) return '      n/a';
  return f(Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length));
}).join(''));
