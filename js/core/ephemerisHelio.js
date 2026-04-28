// HelioC pipeline — Schlyter heliocentric Keplerian planets, composed
// with the Sun's geocentric position to yield geocentric RA/Dec.
//
// **Comparison-mode only.** Default rendering pipeline is DE405
// (`ephemerisAstropixels.js`); HelioC only contributes a row in the
// side-by-side comparison HUD when
// `state.ShowEphemerisReadings` is on. With comparison off,
// `app.update` never invokes this pipeline. It also doesn't sit on
// the fallback chain (`astropixels → geocentric → vsop87 →
// ptolemy`), so a stray DE405 miss won't accidentally route here
// either.
//
// Reference: Paul Schlyter, "Computing planetary positions — a tutorial
// with worked examples" (http://www.stjarnhimlen.se/comp/ppcomp.html).
// Schlyter's trick: his "earth" row actually encodes the Sun's orbit
// around the Earth (the sign is pre-negated), so the geocentric planet
// position is obtained as
//
//     planet_geocentric_ecliptic = planet_heliocentric + sun_geocentric
//
// rather than the textbook `planet_helio − earth_helio` subtraction.
// Numerically equivalent, one fewer negation.
//
// This is the pipeline that was the sim's original planet model
// (pre-). restores it as a selectable source alongside the
// Earth-focus GeoC pipeline (`ephemerisGeo.js`) and the Ptolemaic one
// (`ephemerisPtolemy.js`). Sun and Moon delegate to Meeus via
// `ephemerisCommon.js` (same as the GeoC pipeline).

import { DEG, sunEquatorial, moonEquatorial } from './ephemerisCommon.js';

// --- Orbital elements (Schlyter epoch 1999-12-31 00:00 UT) --------------
//
// Row layout: [N0, dN, i0, di, w0, dw, a0, da, e0, de, M0, dM]
//   N = longitude of ascending node (deg)
//   i = inclination to ecliptic (deg)
//   w = argument of perihelion (deg)
//   a = semi-major axis (AU; Earth-Sun distance = 1)
//   e = eccentricity
//   M = mean anomaly (deg)
//
// `earth` row is Schlyter's pre-negated Sun-around-Earth trick (see header).
const PLANET_EL = {
  mercury: [ 48.3313,  3.24587e-5,   7.0047,    5.00e-8,    29.1241, 1.01444e-5, 0.387098, 0,         0.205635,  5.59e-10,  168.6562, 4.0923344368],
  venus:   [ 76.6799,  2.46590e-5,   3.3946,    2.75e-8,    54.8910, 1.38374e-5, 0.723330, 0,         0.006773, -1.302e-9,   48.0052, 1.6021302244],
  earth:   [  0,       0,            0.0000,    0,         282.9404, 4.70935e-5, 1.000000, 0,         0.016709, -1.151e-9,  356.0470, 0.9856002585],
  mars:    [ 49.5574,  2.11081e-5,   1.8497,   -1.78e-8,   286.5016, 2.92961e-5, 1.523688, 0,         0.093405,  2.516e-9,   18.6021, 0.5240207766],
  jupiter: [100.4542,  2.76854e-5,   1.3030,   -1.557e-7,  273.8777, 1.64505e-5, 5.20256,  0,         0.048498,  4.469e-9,   19.8950, 0.0830853001],
  saturn:  [113.6634,  2.38980e-5,   2.4886,   -1.081e-7,  339.3939, 2.97661e-5, 9.55475,  0,         0.055546, -9.499e-9,  316.9670, 0.0334442282],
};

// Days since Schlyter's 2000 Jan 0.0 epoch (JD 2451543.5).
// Unix-epoch JD is 2440587.5 → offset 10956.
function schlyterDay(date) {
  return date.getTime() / 86400000 - 10956;
}

function elementsAt(name, d) {
  const el = PLANET_EL[name];
  return {
    N: el[0] + el[1]  * d,
    i: el[2] + el[3]  * d,
    w: el[4] + el[5]  * d,
    a: el[6] + el[7]  * d,
    e: el[8] + el[9]  * d,
    M: el[10] + el[11] * d,
  };
}

function solveKepler(M, e) {
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let k = 0; k < 6; k++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}

// Heliocentric ecliptic (x, y, z) in AU (ratio units; scale cancels at
// atan2 in planetEquatorial). For the 'earth' row this returns the
// Sun's position as seen from Earth (see header).
function heliocentric(name, d) {
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

// Geocentric equatorial coordinates of a planet (radians). Compose
// Schlyter's Sun-around-Earth row with the planet's heliocentric xyz,
// then rotate ecliptic→equatorial at the Schlyter obliquity
// ε = 23.4393° − 3.563e-7·d.
export function planetEquatorial(name, date) {
  // outer planets (uranus, neptune) and Pluto aren't in
  // Schlyter's element table here, so return a NaN sentinel the
  // tracker can render as "—" instead of a spurious zero reading.
  if (!PLANET_EL[name]) return { ra: NaN, dec: NaN };
  const d = schlyterDay(date);
  const sg = heliocentric('earth', d);   // Sun's geocentric position
  const p  = heliocentric(name, d);      // planet's heliocentric position
  const xg = p.x + sg.x, yg = p.y + sg.y, zg = p.z + sg.z;
  const eclip = (23.4393 - 3.563e-7 * d) * DEG;
  const xeq = xg;
  const yeq = yg * Math.cos(eclip) - zg * Math.sin(eclip);
  const zeq = yg * Math.sin(eclip) + zg * Math.cos(eclip);
  const ra  = Math.atan2(yeq, xeq);
  const dec = Math.atan2(zeq, Math.hypot(xeq, yeq));
  return { ra, dec };
}

// Geocentric (RA, Dec) for any supported body in the HelioC pipeline.
// Sun and Moon delegate to Meeus (ephemerisCommon.js); planets go
// through the heliocentric composition above.
export function bodyGeocentric(name, date) {
  if (name === 'sun')   return sunEquatorial(date);
  if (name === 'moon')  return moonEquatorial(date);
  if (name === 'earth') return { ra: 0, dec: 0 };
  return planetEquatorial(name, date);
}

export const SUPPORTED_BODIES = new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn']);
export function coversBody(name) { return SUPPORTED_BODIES.has(name); }
export function coversDate(_date) { return true; }
export const BUILTIN_CORRECTIONS = { precession: true, nutation: true, aberration: true, fk5: false };
