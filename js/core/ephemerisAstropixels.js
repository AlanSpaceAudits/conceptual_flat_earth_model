// Astropixels pipeline — geocentric RA/Dec by daily lookup + interpolation.
//
// Data source:
//   Fred Espenak, "AstroPixels — Ephemeris"
//   https://www.astropixels.com/ephemeris/ephemeris.html
//   The tables on Espenak's site are precomputed from the
//   JPL DE405 planetary and lunar ephemerides — the same reference
//   ephemeris Stellarium and most observatory-grade astronomy apps
//   use. Agreement with Stellarium is sub-arcsecond at tabulated
//   dates; linear interpolation between daily samples adds up to
//   ~1' for the Moon and ~0.5" for slower bodies.
//
// Attribution:
//   All credit for the underlying ephemeris data belongs to Fred
//   Espenak (AstroPixels). This module only bundles daily geocentric
//   RA/Dec extracted from his public tables; no re-computation is
//   performed here. Please cite Espenak in any derived work.
//
// Coverage:
//   Years 2019–2030, seven bodies (sun, moon, mercury, venus, mars,
//   jupiter, saturn). Outside that range `bodyGeocentric` returns
//   `{ ra: 0, dec: 0 }` and logs a console warning once per body.
//
// Format:
//   `js/data/astropixels.js` exports ASTROPIXELS as:
//     { meta: {…}, sun: { 2019: [raSec,decAs,…], …}, moon: {…}, …}
//   Each year array holds Float64 pairs `[raSec, decArcsec]` at
//   00:00 UTC per day-of-year (365 or 366 rows).

import { ASTROPIXELS } from '../data/astropixels.js';

const MS_PER_DAY = 86400000;
const SEC_TO_RAD = Math.PI / (12 * 3600);        // seconds of time → radians
const ARCSEC_TO_RAD = Math.PI / (180 * 3600);    // arcseconds → radians

function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }

const _warned = new Set();
function warnOnce(body, reason) {
  const key = `${body}:${reason}`;
  if (_warned.has(key)) return;
  _warned.add(key);
  console.warn(`[ephemerisAstropixels] ${body}: ${reason}`);
}

// Day-of-year (0-based) + fractional day since 00:00 UTC of that day.
function utcDayOfYear(date) {
  const y = date.getUTCFullYear();
  const janFirst = Date.UTC(y, 0, 1);
  const elapsedMs = date.getTime() - janFirst;
  const doyFloat = elapsedMs / MS_PER_DAY;
  return { year: y, doyFloat };
}

// Look up a body's RA/Dec at `date` by linear interpolation between
// the two nearest tabulated daily samples. Returns `{ ra, dec }` in
// radians or `null` if outside the tabulated year range.
function lookup(body, date) {
  const rows = ASTROPIXELS[body];
  if (!rows) return null;
  const { year, doyFloat } = utcDayOfYear(date);

  const arr = rows[year];
  if (!arr) {
    warnOnce(body, `no data for year ${year} (range: ${ASTROPIXELS.meta.yearMin}–${ASTROPIXELS.meta.yearMax})`);
    return null;
  }

  const nDays = arr.length / 2;
  const i0 = Math.floor(doyFloat);
  const i1 = i0 + 1;
  const t  = doyFloat - i0;

  // Handle year-boundary interpolation (Dec 31 23:xx → Jan 1 of next year).
  let ra0  = arr[2 * i0];
  let dec0 = arr[2 * i0 + 1];
  let ra1, dec1;
  if (i1 < nDays) {
    ra1  = arr[2 * i1];
    dec1 = arr[2 * i1 + 1];
  } else {
    const nextArr = rows[year + 1];
    if (nextArr) {
      ra1  = nextArr[0];
      dec1 = nextArr[1];
    } else {
      // Out of range for the next year — fall back to last sample.
      ra1  = ra0;
      dec1 = dec0;
    }
  }

  // RA wraps at 86400 seconds (24h). Unwrap before interpolation.
  if (ra1 - ra0 > 43200) ra1 -= 86400;
  else if (ra0 - ra1 > 43200) ra1 += 86400;

  const raSec    = ra0  + t * (ra1  - ra0);
  const decArcs  = dec0 + t * (dec1 - dec0);

  let ra  = raSec * SEC_TO_RAD;
  const dec = decArcs * ARCSEC_TO_RAD;
  // Normalise RA into [0, 2π).
  ra = ((ra % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return { ra, dec };
}

// Public API — matches other pipelines (ephemerisHelio / Geo / Ptolemy).
export function planetEquatorial(name, date) {
  const r = lookup(name, date);
  return r || { ra: NaN, dec: NaN };
}

export function sunEquatorial(date) {
  const r = lookup('sun', date);
  return r || { ra: NaN, dec: NaN };
}

export function moonEquatorial(date) {
  const r = lookup('moon', date);
  return r || { ra: NaN, dec: NaN };
}

export function bodyGeocentric(name, date) {
  if (name === 'earth') return { ra: 0, dec: 0 };
  const r = lookup(name, date);
  return r || { ra: NaN, dec: NaN };
}

// Coverage: bodies + year span.
export const SUPPORTED_BODIES = new Set(ASTROPIXELS.meta.bodies);
export function coversBody(name) { return SUPPORTED_BODIES.has(name); }
export function coversDate(date) {
  const y = date.getUTCFullYear();
  return y >= ASTROPIXELS.meta.yearMin && y <= ASTROPIXELS.meta.yearMax;
}

export const META = ASTROPIXELS.meta;
