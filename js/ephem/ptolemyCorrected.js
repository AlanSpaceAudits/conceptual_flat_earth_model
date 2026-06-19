// Tang Ptolz — geocentric position-space epicycle reconstruction.
//
// The original Almagest (ptolemy.js) gives a geocentric DIRECTION off by degrees.
// Correcting that direction in ANGLE space cusps near inferior conjunction —
// Venus needed ~200 terms and still only reached arcminutes. The fix is to work
// in POSITION space, exactly the way VSOP / Tang Master implicitly does: the
// geocentric position vector r = r_planet − r_earth is smooth even through
// conjunction (only its magnitude dips sharply; the x,y,z components glide
// through), and the violent angular swing falls out of the final normalise as
// pure geometry instead of being fit.
//
// So per body we carry a compact epicycle series for the three geocentric
// position components (x,y,z), in CHINESE-AU ratios (Earth orbit = 1; the
// absolute scale = R_LI/sin θ_sun cancels in the normalise, so the interface
// stays angles+time — no SI length). Each component = cubic secular + a Fourier
// sum at the body's own orbital frequency and Earth's (plus t·cos/t·sin Poisson
// terms for the precession between the fixed and date equinoxes). Rebuild:
//   r = (x(t), y(t), z(t))   →   RA = atan2(y,x),  Dec = asin(z/|r|)
//
// Accuracy vs Tang Master over 1800-2200 (RMS): Sun/Mercury/Venus ~17-20″,
// Mars ~39″, Jupiter ~3.5′, Saturn ~6′ — with 14 terms per body. Venus is no
// longer special: 11° (raw Almagest) → 20″. This is the literal demonstration
// that a finite stack of epicycles reproduces the modern ephemeris, the
// quasi-periodic-motion result of Gallavotti (2001) / Hanson (1960), now in
// position space where it converges fast. The Moon is carried through as the
// raw Almagest position (no fit), so it still renders.

import * as ptol from './ptolemy.js';
import { PTOLEMY_CORRECTION } from './data/ptolemyCorrection.js';

const DEG = Math.PI / 180, TWO_PI = 2 * Math.PI, J2000 = 2451545.0;
const julianDay = (d) => d.getTime() / 86400000 + 2440587.5;

// Geocentric position vector (Chinese-AU ratio) from the epicycle table.
function positionVec(body, jd) {
  const c = PTOLEMY_CORRECTION[body];
  if (!c) return null;
  const D = jd - J2000;
  const t = (D - c.ref) / c.scale;   // normalized time (per-body span)
  const series = (p) => {
    let v = p.sec[0] + p.sec[1]*t + p.sec[2]*t*t + p.sec[3]*t*t*t;
    for (let i = 0; i < c.freqs.length; i++) {
      const a = c.freqs[i] * D * DEG, cs = Math.cos(a), sn = Math.sin(a);
      v += p.harm[i][0]*cs + p.harm[i][1]*sn + t * (p.harm[i][2]*cs + p.harm[i][3]*sn);
    }
    return v;
  };
  return [series(c.x), series(c.y), series(c.z)];
}

// Apparent geocentric RA/Dec (radians).
export function bodyGeocentric(name, date) {
  const v = positionVec(name, julianDay(date));
  if (!v) return ptol.bodyGeocentric(name, date);   // Moon etc.: raw Almagest
  const [x, y, z] = v;
  const r = Math.hypot(x, y, z);
  let ra = Math.atan2(y, x);
  ra = ((ra % TWO_PI) + TWO_PI) % TWO_PI;
  const dec = Math.asin(z / r);
  return { ra, dec };
}

export function planetEquatorial(name, date) { return bodyGeocentric(name, date); }
export function sunEquatorial(date) { return bodyGeocentric('sun', date); }
export function moonEquatorial(date) { return ptol.bodyGeocentric('moon', date); }

export const SUPPORTED_BODIES = new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn']);
export function coversBody(name) { return SUPPORTED_BODIES.has(name); }
export function coversDate(_date) { return true; }
export const BUILTIN_CORRECTIONS = { precession: true, nutation: true, aberration: true, fk5: false };
