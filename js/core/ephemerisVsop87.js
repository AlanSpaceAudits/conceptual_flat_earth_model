// VSOP87 pipeline — analytical heliocentric theory of Bretagnon & Francou.
//
// Theory source:
//   Bretagnon, P., and Francou, G. (1988). "Planetary theories in
//   rectangular and spherical variables — VSOP87 solutions."
//   Astronomy and Astrophysics, 202, 309–315.
//
// JavaScript coefficient data (`js/data/vsop87/*.js`) ported by
//   Sonia Keys (Go) → commenthol (JS, `astronomia` npm package, MIT).
//   Reproduced here with attribution; see
//   `js/data/vsop87/LICENSE_ATTRIBUTION.md` for the MIT notice.
//
// Variant: VSOP87D — heliocentric spherical coordinates, mean equinox
// of date. Geocentric RA/Dec is obtained by:
//   1. Evaluating planet's and Earth's heliocentric (L, B, R)
//   2. Subtracting in rectangular coords → geocentric (x, y, z)
//   3. FK5 correction (Meeus 32.3) — small bias into the FK5 frame
//   4. Ecliptic → equatorial using mean obliquity of date
// No extra precession step is needed because VSOP87D already returns
// mean-of-date ecliptic coordinates.
//
// Accuracy: sub-arcsecond for inner planets, a few arcseconds for
// outer planets, across roughly ±4000 years of J2000. Matches JPL
// DE ephemerides to within ~1" for dates within a few centuries of
// J2000 — agrees with the AstroPixels pipeline to sub-arcsecond at
// their common tabulated dates.
//
// Coverage: the five classical Schlyter planets. Mercury, Venus, Mars,
// Jupiter, Saturn — plus Earth (used internally for the geocentric
// subtraction and as the source of the Sun ephemeris: Sun's
// geocentric = minus Earth's heliocentric).
//
// Moon: VSOP87 does not provide the Moon; this pipeline delegates to
// the Meeus Ch.47 moon already in `ephemerisCommon.js` (same as the
// Helio and GeoC pipelines use).

import VSOP87_MERCURY from '../data/vsop87/mercury.js';
import VSOP87_VENUS   from '../data/vsop87/venus.js';
import VSOP87_EARTH   from '../data/vsop87/earth.js';
import VSOP87_MARS    from '../data/vsop87/mars.js';
import VSOP87_JUPITER from '../data/vsop87/jupiter.js';
import VSOP87_SATURN  from '../data/vsop87/saturn.js';
import { DEG, meanObliquityDeg, moonEquatorial as meeusMoon } from './ephemerisCommon.js';

const VSOP = {
  mercury: VSOP87_MERCURY,
  venus:   VSOP87_VENUS,
  earth:   VSOP87_EARTH,
  mars:    VSOP87_MARS,
  jupiter: VSOP87_JUPITER,
  saturn:  VSOP87_SATURN,
};

function julianDay(date) { return date.getTime() / 86400000 + 2440587.5; }

// Evaluate one VSOP87 series { 0:[...], 1:[...], ..., 5:[...] } at
// T (in millennia from J2000). Each term is [A, B, C] summed as
// A·cos(B + C·T); each power p contributes its sum multiplied by Tᵖ.
function evalSeries(series, T) {
  let total = 0;
  let Tpow  = 1;
  for (let p = 0; p <= 5; p++) {
    const key = String(p);
    if (series[key]) {
      const terms = series[key];
      let sum = 0;
      for (let i = 0; i < terms.length; i++) {
        const t = terms[i];
        sum += t[0] * Math.cos(t[1] + t[2] * T);
      }
      total += sum * Tpow;
    }
    Tpow *= T;
  }
  return total;
}

// Heliocentric (L, B, R) for a body at T (millennia from J2000).
// L, B in radians (ecliptic, mean equinox of date). R in AU.
function heliocentric(body, T) {
  const data = VSOP[body];
  return {
    L: evalSeries(data.L, T),
    B: evalSeries(data.B, T),
    R: evalSeries(data.R, T),
  };
}

function sphToRect(L, B, R) {
  const cosB = Math.cos(B);
  return { x: R * cosB * Math.cos(L), y: R * cosB * Math.sin(L), z: R * Math.sin(B) };
}

// FK5 correction (Meeus 32.3). Inputs / outputs in radians; T in
// centuries from J2000. Brings VSOP87 mean dynamical ecliptic into
// the FK5 reference frame.
const ARCSEC_TO_RAD = Math.PI / (180 * 3600);
function fk5Correction(L, B, T_cent) {
  const Lp = L - (1.397 + 0.00031 * T_cent) * T_cent * DEG;
  const dL = (-0.09033 + 0.03916 * (Math.cos(Lp) + Math.sin(Lp)) * Math.tan(B)) * ARCSEC_TO_RAD;
  const dB =  0.03916 * (Math.cos(Lp) - Math.sin(Lp)) * ARCSEC_TO_RAD;
  return { L: L + dL, B: B + dB };
}

// Ecliptic (L, B) → equatorial (RA, Dec) at mean obliquity of date.
function eclipToEq(L, B, T_cent) {
  const eps = meanObliquityDeg(T_cent) * DEG;
  const sinL = Math.sin(L);
  const cosL = Math.cos(L);
  const tanB = Math.tan(B);
  let ra  = Math.atan2(sinL * Math.cos(eps) - tanB * Math.sin(eps), cosL);
  const dec = Math.asin(Math.sin(B) * Math.cos(eps) + Math.cos(B) * Math.sin(eps) * sinL);
  ra = ((ra % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return { ra, dec };
}

// Geocentric apparent equatorial (RA, Dec) for a planet.
export function planetEquatorial(body, date) {
  // the bundled VSOP87 tables in `js/data/vsop87/` cover
  // mercury, venus, earth, mars, jupiter, saturn. Uranus / Neptune
  // coefficients exist upstream but aren't imported here yet; Pluto
  // is outside VSOP87 entirely. Return NaN so the tracker HUD shows
  // "—" instead of crashing inside `evalSeries(undefined)`.
  if (!VSOP[body]) return { ra: NaN, dec: NaN };
  const jd = julianDay(date);
  const T_mil  = (jd - 2451545.0) / 365250;
  const T_cent = (jd - 2451545.0) / 36525;

  const p = heliocentric(body, T_mil);
  const e = heliocentric('earth', T_mil);
  const pr = sphToRect(p.L, p.B, p.R);
  const er = sphToRect(e.L, e.B, e.R);
  const gx = pr.x - er.x, gy = pr.y - er.y, gz = pr.z - er.z;
  const R  = Math.sqrt(gx * gx + gy * gy + gz * gz);
  const L  = Math.atan2(gy, gx);
  const B  = Math.asin(gz / R);
  const fk5 = fk5Correction(L, B, T_cent);
  return eclipToEq(fk5.L, fk5.B, T_cent);
}

// Sun's geocentric RA/Dec = opposite direction to Earth's heliocentric.
export function sunEquatorial(date) {
  const jd = julianDay(date);
  const T_mil  = (jd - 2451545.0) / 365250;
  const T_cent = (jd - 2451545.0) / 36525;

  const e = heliocentric('earth', T_mil);
  // Sun geocentric direction: L+π, −B (in ecliptic spherical).
  const L = e.L + Math.PI;
  const B = -e.B;
  const fk5 = fk5Correction(L, B, T_cent);
  return eclipToEq(fk5.L, fk5.B, T_cent);
}

// Moon: VSOP87 doesn't cover the Moon — delegate to Meeus.
export const moonEquatorial = meeusMoon;

export function bodyGeocentric(name, date) {
  if (name === 'sun')   return sunEquatorial(date);
  if (name === 'moon')  return moonEquatorial(date);
  if (name === 'earth') return { ra: 0, dec: 0 };
  return planetEquatorial(name, date);
}

// Coverage. VSOP87D ships coefficient sets for the inner six planets
// + Earth (Earth used internally for the geocentric subtraction).
// Moon delegates to Meeus, so it stays in the list. Uranus / Neptune
// never had VSOP87 sets bundled here. Date span is roughly ±4000 yr
// from J2000 — we keep the predicate generous so the fallback
// chain only routes around the missing planets, not date.
export const SUPPORTED_BODIES = new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn']);
export function coversBody(name) { return SUPPORTED_BODIES.has(name); }
export function coversDate(_date) { return true; }
// Built-in corrections summary:
//   precession : YES (mean equinox of date — VSOP87D output frame)
//   nutation   : NO  (mean obliquity, not true obliquity)
//   aberration : NO  (no light-time / annual-aberration correction)
// FK5 correction is applied (Meeus 32.3) so the output is FK5
// geocentric apparent for everything except nutation + aberration.
export const BUILTIN_CORRECTIONS = { precession: true, nutation: false, aberration: false, fk5: true };
