// Validate tangPlanets against modern references.
//   1. Orbital accuracy: tangPlanets + precession-only  vs  VSOP87 (mean of date)
//   2. End-to-end modern:  tangPlanets + full trepidation vs  DE405/astropixels (apparent)
// Trepidation = precession + nutation + aberration applied as ONE combined
// stage (apparentStarPosition), the same correction the star catalogue uses.
// Run: node scripts/validate-planets.mjs

import * as tang from '../js/ephem/tangPlanets.js';
import * as vsop from '../js/core/ephemerisVsop87.js';
import * as apix from '../js/core/ephemerisAstropixels.js';
import { apparentStarPosition } from '../js/ephem/common.js';

const PLANETS = ['sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

// angular separation between two {ra,dec} (radians) -> arcminutes
function sepArcmin(a, b) {
  if (!a || !b || !Number.isFinite(a.ra) || !Number.isFinite(b.ra)) return NaN;
  const c = Math.sin(a.dec) * Math.sin(b.dec)
          + Math.cos(a.dec) * Math.cos(b.dec) * Math.cos(a.ra - b.ra);
  return Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI * 60;
}
const fmt = (x) => Number.isFinite(x) ? x.toFixed(2).padStart(8) : '     n/a';

function table(title, dates, refFn, opts) {
  console.log(`\n${title}`);
  console.log('date        ' + PLANETS.map((p) => p.slice(0, 7).padStart(8)).join(''));
  const acc = {};
  for (const d of dates) {
    const row = PLANETS.map((p) => {
      const j2000 = tang.bodyGeocentric(p, d);
      const app = Number.isFinite(j2000.ra)
        ? apparentStarPosition(j2000.ra, j2000.dec, d, opts) : { ra: NaN, dec: NaN };
      const ref = refFn(p, d);
      const s = sepArcmin(app, ref);
      if (Number.isFinite(s)) { (acc[p] ||= []).push(s); }
      return fmt(s);
    }).join('');
    console.log(d.toISOString().slice(0, 10) + '  ' + row);
  }
  console.log('max arcmin  ' + PLANETS.map((p) => fmt(acc[p] ? Math.max(...acc[p]) : NaN)).join(''));
  console.log('rms arcmin  ' + PLANETS.map((p) => {
    const a = acc[p]; if (!a) return '     n/a';
    return fmt(Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length));
  }).join(''));
}

// 1. Orbital accuracy vs VSOP87 (both mean of date -> precession only).
const vsopDates = ['1000-03-21', '1300-06-21', '1700-09-23', '2000-01-01', '2025-06-13', '2400-01-01']
  .map((s) => new Date(s + 'T12:00:00Z'));
table('=== tangPlanets + precession only  vs  VSOP87 (mean of date), arcmin ===',
  vsopDates, (p, d) => vsop.bodyGeocentric(p, d),
  { precession: true, nutation: false, aberration: false });

// 2. End-to-end apparent vs DE405/AstroPixels (its tabulated 2019-2030 window).
const apixDates = ['2020-03-20', '2022-07-04', '2024-04-08', '2026-06-13', '2028-12-21']
  .map((s) => new Date(s + 'T12:00:00Z'));
table('=== tangPlanets + full trepidation  vs  DE405 (apparent), arcmin ===',
  apixDates, (p, d) => apix.bodyGeocentric(p, d),
  { precession: true, nutation: true, aberration: true });
