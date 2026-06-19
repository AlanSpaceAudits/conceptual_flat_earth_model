// Validate the master ephemeris against Espenak & Meeus's Five Millennium
// eclipse canon (-1999..+3000). Two things:
//   1. ΔT self-check: our deltaT.js vs the canon's published ΔT per eclipse.
//   2. Eclipse timing: the master's geocentric syzygy vs the canon's greatest
//      eclipse, using the canon's own ΔT, so geometry error is isolated.
// Reported in 500-year bins to show how accuracy degrades toward the extremes.
// Run: node scripts/validate-canon.mjs

import { SOLAR_CANON, LUNAR_CANON } from '../js/data/eclipseCanon5M.js';
import { refineEclipseByMinSeparation } from '../js/ephem/common.js';
import { deltaTSeconds } from '../js/ephem/deltaT.js';
import * as master from '../js/ephem/masterTang.js';

// Each eclipse is evaluated with the canon's OWN Delta-T (its measured TT - UT
// for that date), supplied as an override, so the master's geometry is placed
// at the exact dynamical time of greatest eclipse. What remains is pure
// geometry error, with the Delta-T model removed from the comparison.
const sunFnDt  = (dt) => (d) => master.bodyGeocentric('sun', d, dt);
const moonFnDt = (dt) => (d) => master.bodyGeocentric('moon', d, dt);

// Calendar (Julian before 1582-10-15, Gregorian after) date -> Julian Day.
function jdTD(e) {
  let Y = e.y, M = e.mo;
  if (M <= 2) { Y -= 1; M += 12; }
  const greg = (e.y > 1582) || (e.y === 1582 && (e.mo > 10 || (e.mo === 10 && e.d >= 15)));
  let B = 0;
  if (greg) { const A = Math.floor(Y / 100); B = 2 - A + Math.floor(A / 4); }
  const frac = (e.h + e.mi / 60 + e.s / 3600) / 24;
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + e.d + frac + B - 1524.5;
}
// UT instant of greatest eclipse (TD - canon ΔT) as a JS Date.
function utDate(e) {
  const jdUT = jdTD(e) - e.deltaT / 86400;
  return new Date((jdUT - 2440587.5) * 86400000);
}
const binOf = (y) => Math.floor(y / 500) * 500;
const stats = (a) => a.length ? {
  max: Math.max(...a.map(Math.abs)),
  rms: Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length),
} : { max: NaN, rms: NaN };

function validate(name, canon, kind) {
  const stride = Math.max(1, Math.floor(canon.length / 350));  // ~350 samples
  const bins = new Map();
  for (let i = 0; i < canon.length; i += stride) {
    const e = canon[i];
    const seed = utDate(e);
    if (!Number.isFinite(seed.getTime())) continue;
    const r = refineEclipseByMinSeparation(seed, sunFnDt(e.deltaT), moonFnDt(e.deltaT), { kind, halfWindowMinutes: 150 });
    const timingErrMin = (r.date.getTime() - seed.getTime()) / 60000;
    const dtDiff = deltaTSeconds(e.y + (e.mo - 0.5) / 12) - e.deltaT;     // seconds
    const sepDeg = r.minSeparationRad * 180 / Math.PI;
    const b = binOf(e.y);
    if (!bins.has(b)) bins.set(b, { time: [], dt: [], sep: [], n: 0 });
    const g = bins.get(b);
    g.time.push(timingErrMin); g.dt.push(dtDiff); g.sep.push(sepDeg); g.n++;
  }
  console.log(`\n=== ${name} (${canon.length} eclipses, sampled every ${stride}) ===`);
  console.log('era            n   ΔT(mine-canon)s   timing |err|      min-sep');
  console.log('                      rms     max     rms      max     range(°)');
  for (const b of [...bins.keys()].sort((x, y) => x - y)) {
    const g = bins.get(b);
    const dt = stats(g.dt), tm = stats(g.time);
    const tmRmsS = (tm.rms * 60).toFixed(1), tmMaxS = (tm.max * 60).toFixed(1);
    const lo = Math.min(...g.sep).toFixed(2), hi = Math.max(...g.sep).toFixed(2);
    const era = `${b} to ${b + 499}`.padEnd(13);
    console.log(`${era} ${String(g.n).padStart(3)}   ${dt.rms.toFixed(1).padStart(6)} ${dt.max.toFixed(1).padStart(7)}   ` +
      `${tmRmsS.padStart(5)}s ${tmMaxS.padStart(6)}s   ${lo}-${hi}`);
  }
}

validate('SOLAR', SOLAR_CANON, 'solar');
validate('LUNAR', LUNAR_CANON, 'lunar');
