// GeoC pipeline — Earth-focus Kepler ellipses per planet.
//
// restructured the planetary chain in this simulator so that each
// planet is modelled as a single Keplerian ellipse with the Earth at
// the focus, evaluated once per planet and rotated ecliptic→equatorial.
// The Schlyter element values (a, e, i, Ω, ω, M, n) are retained as
// conceptual ratio parameters; they are not interpreted as Sun-relative
// orbits inside this module. No Sun-around-Earth row, no `sun + planet`
// composition, no heliocentric intermediate of any kind.
//
// Consequence (stated honestly): inner planets (Mercury, Venus) do not
// librate about the Sun in this model, and no planet exhibits retrograde
// motion. RA/Dec values diverge from real ephemeris positions by large
// amounts. The trade is deliberate: this pipeline is *structurally*
// geocentric at every stage.
//
// split this code out of the former monolithic `ephemeris.js`
// into its own module so the router can pick it as the `'geocentric'`
// pipeline alongside Helio and Ptolemy.

import { DEG, julianDay, sunEquatorial, moonEquatorial } from './ephemerisCommon.js';

// --- Orbital elements (Schlyter epoch 1999-12-31 00:00 UT) ---------------
//
// Row layout: [N0, dN, i0, di, w0, dw, a0, da, e0, de, M0, dM]
//   N = longitude of ascending node (deg)
//   i = inclination to ecliptic (deg)
//   w = argument of perihelion (deg)
//   a = semi-major axis (unitless ratio; scale cancels at atan2)
//   e = eccentricity
//   M = mean anomaly (deg)
// Rates are per day.
//
// In this module these parameters specify a Keplerian ellipse with the
// **Earth at the focus** for each planet. See module header.
const ORBIT_EL = {
  mercury: [ 48.3313,  3.24587e-5,   7.0047,    5.00e-8,    29.1241, 1.01444e-5, 0.387098, 0,         0.205635,  5.59e-10,  168.6562, 4.0923344368],
  venus:   [ 76.6799,  2.46590e-5,   3.3946,    2.75e-8,    54.8910, 1.38374e-5, 0.723330, 0,         0.006773, -1.302e-9,   48.0052, 1.6021302244],
  mars:    [ 49.5574,  2.11081e-5,   1.8497,   -1.78e-8,   286.5016, 2.92961e-5, 1.523688, 0,         0.093405,  2.516e-9,   18.6021, 0.5240207766],
  jupiter: [100.4542,  2.76854e-5,   1.3030,   -1.557e-7,  273.8777, 1.64505e-5, 5.20256,  0,         0.048498,  4.469e-9,   19.8950, 0.0830853001],
  saturn:  [113.6634,  2.38980e-5,   2.4886,   -1.081e-7,  339.3939, 2.97661e-5, 9.55475,  0,         0.055546, -9.499e-9,  316.9670, 0.0334442282],
};

// Days since Schlyter's 2000 Jan 0.0 epoch (= 1999-12-31 00:00 UT,
// JD 2451543.5). Unix epoch JD is 2440587.5, offset 10956.
function schlyterDay(date) {
  return date.getTime() / 86400000 - 10956;
}

function elementsAt(name, d) {
  const el = ORBIT_EL[name];
  return {
    N: el[0] + el[1]  * d,
    i: el[2] + el[3]  * d,
    w: el[4] + el[5]  * d,
    a: el[6] + el[7]  * d,
    e: el[8] + el[9]  * d,
    M: el[10] + el[11] * d,
  };
}

// Solve Kepler's equation M = E − e·sin E for E (radians).
function solveKepler(M, e) {
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let k = 0; k < 6; k++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}

// Evaluate a planet's Earth-focus Kepler ellipse at day `d` and return
// the geocentric ecliptic position (x, y, z). Unit of length is the
// tabulated `a`; absolute scale cancels at atan2 in planetEquatorial.
function keplerEarthFocus(name, d) {
  const { N, i, w, a, e, M } = elementsAt(name, d);
  const Mr = (M * DEG);
  const E  = solveKepler(((Mr % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2), e);
  const xv = a * (Math.cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v  = Math.atan2(yv, xv);
  const r  = Math.hypot(xv, yv);
  const Nr = N * DEG, ir = i * DEG, wr = w * DEG;
  const vw = v + wr;
  return {
    x: r * (Math.cos(Nr) * Math.cos(vw) - Math.sin(Nr) * Math.sin(vw) * Math.cos(ir)),
    y: r * (Math.sin(Nr) * Math.cos(vw) + Math.cos(Nr) * Math.sin(vw) * Math.cos(ir)),
    z: r * Math.sin(vw) * Math.sin(ir),
  };
}

// Geocentric equatorial coordinates of a planet (radians).
// Single Earth-focus Kepler evaluation + ecliptic→equatorial rotation.
// No Sun-around-Earth stage, no planet-around-Sun stage.
export function planetEquatorial(name, date) {
  // uranus, neptune, pluto aren't in this Earth-focus element
  // table; signal "no data" with NaN so the tracker HUD renders "—".
  if (!ORBIT_EL[name]) return { ra: NaN, dec: NaN };
  const d = schlyterDay(date);
  const p = keplerEarthFocus(name, d);
  const eclip = (23.4393 - 3.563e-7 * d) * DEG;
  const xeq = p.x;
  const yeq = p.y * Math.cos(eclip) - p.z * Math.sin(eclip);
  const zeq = p.y * Math.sin(eclip) + p.z * Math.cos(eclip);
  const ra  = Math.atan2(yeq, xeq);
  const dec = Math.atan2(zeq, Math.hypot(xeq, yeq));
  return { ra, dec };
}

// Geocentric (RA, Dec) for any supported body in the GeoC pipeline.
// Sun and Moon delegate to Meeus (ephemerisCommon.js).
export function bodyGeocentric(name, date) {
  if (name === 'sun')   return sunEquatorial(date);
  if (name === 'moon')  return moonEquatorial(date);
  if (name === 'earth') return { ra: 0, dec: 0 };
  return planetEquatorial(name, date);
}

// julianDay is imported solely for parity with the other pipelines'
// module interfaces; the GeoC planet math uses schlyterDay directly.
export { julianDay };

// Coverage. Schlyter Earth-focus elements ship the 5 classical
// planets; sun / moon delegate to the Meeus pair in ephemerisCommon.
// Date span effectively unlimited within Schlyter's century-scale
// element validity. Built-in corrections come from Meeus, which
// already applies precession + nutation + aberration to its sun /
// moon outputs.
export const SUPPORTED_BODIES = new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn']);
export function coversBody(name) { return SUPPORTED_BODIES.has(name); }
export function coversDate(_date) { return true; }
export const BUILTIN_CORRECTIONS = { precession: true, nutation: true, aberration: true, fk5: false };
