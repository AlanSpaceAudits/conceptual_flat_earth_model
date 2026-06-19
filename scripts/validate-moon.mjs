// Validate js/ephem/moonFull.js (full Meeus Ch.47 lunar theory) against
// DE405 (AstroPixels daily samples via js/core/ephemerisAstropixels.js).
//
// Prints per-date angular separation in arcseconds plus max / RMS.
// Pass criterion: max <= 15", target <= 10".
//
//   node scripts/validate-moon.mjs

import { moonEquatorial as moonFull } from '../js/ephem/moonFull.js';
import { bodyGeocentric } from '../js/core/ephemerisAstropixels.js';

const R2D = 180 / Math.PI;
const ARCSEC = 3600 * R2D;

// Angular separation (arcsec) between two {ra,dec} (radians).
function sepArcsec(a, b) {
  const dot = Math.cos(a.dec) * Math.cos(b.dec) * Math.cos(a.ra - b.ra)
            + Math.sin(a.dec) * Math.sin(b.dec);
  return Math.acos(Math.max(-1, Math.min(1, dot))) * ARCSEC;
}

// 8 dates spanning 2020–2027. All at 00:00 UTC so the comparison lands on
// the AstroPixels daily sample points (no daily-interpolation error in the
// reference). The AstroPixels DE405 table degrades ~40″ in its 2028–2030
// tail — confirmed independently against an astronomia full-theory
// computation, which disagrees with the table by the same amount there while
// matching to ~2″ for 2020–2027. Dates are kept inside the trustworthy span.
const dates = [
  '2020-03-15T00:00:00Z',
  '2021-06-21T00:00:00Z',
  '2022-09-10T00:00:00Z',
  '2023-01-25T00:00:00Z',
  '2024-04-08T00:00:00Z', // total solar eclipse day
  '2025-11-30T00:00:00Z',
  '2026-05-12T00:00:00Z',
  '2027-07-04T00:00:00Z',
].map((s) => new Date(s));

let sumSq = 0, max = 0;
console.log('date                     sep(arcsec)');
for (const d of dates) {
  const ref = bodyGeocentric('moon', d);
  const got = moonFull(d);
  const sep = sepArcsec(got, ref);
  sumSq += sep * sep;
  if (sep > max) max = sep;
  console.log(`${d.toISOString()}   ${sep.toFixed(2)}`);
}
const rms = Math.sqrt(sumSq / dates.length);
console.log('---');
console.log(`max = ${max.toFixed(2)} arcsec   rms = ${rms.toFixed(2)} arcsec`);
console.log(max <= 15 ? `PASS (max <= 15")` : `FAIL (max > 15")`);
process.exit(max <= 15 ? 0 : 1);
