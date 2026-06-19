// Tang planetary ephemeris — geocentric, epicyclic in form, modern in accuracy.
//
// Goal: the positions a Tang observer would actually have measured, computed
// to modern (naked-eye and better) accuracy, in a geocentric epicyclic model,
// ready to be expressed in du / xiu by the Tang frame.
//
// Conceptual basis (see the source notes Hanson 1960, Kosheleva & Kreinovich
// 2019, Rushkin 2015): a deferent + epicycle traces a sum of rotating vectors,
// which is the form of a Fourier series; solving Kepler's equation sums that
// series to all orders. So this module's two stages are exactly the two
// classical "inequalities":
//   1. First inequality (the planet's own eccentric orbit): the equation of
//      centre, obtained by solving Kepler's equation. This is the full
//      epicycle / equation-of-centre harmonic series, not a 1- or 2-term
//      truncation, so it is correct to all orders in e (the equant is the
//      2nd-order approximation to this; here we use the exact series).
//   2. Second inequality (the Earth-Sun motion): subtracting Earth's
//      heliocentric position. This is the large epicycle that produces
//      retrograde loops.
//
// Elements: J.L. Simon / E.M. Standish, "Keplerian Elements for Approximate
// Positions of the Major Planets" (JPL SSD), 3000 BC to 3000 AD set, so the
// model holds across the historical Chinese range, not just near J2000. The
// outer-planet b, c, s, f augmentation corrects Jupiter and Saturn's mean
// longitude over that long span.
//
// Output: geocentric equatorial RA/Dec at the MEAN J2000 equinox (radians),
// the same frame the star catalogue uses. Apparent-of-date (precession +
// nutation + aberration, i.e. the system's combined "trepidation") is applied
// downstream by the same stage that corrects the stars, so planets and stars
// stay consistent.

const DEG = Math.PI / 180;
const OBLIQ_J2000 = 23.43928 * DEG;        // mean obliquity at J2000
const norm360 = (x) => ((x % 360) + 360) % 360;

// [a, e, I, L, wbar, Omega] at J2000 and per-century rates; plus optional
// [b, c, s, f] mean-longitude augmentation (outer planets only).
// a in AU; angles in degrees; rates per Julian century.
// Source: JPL SSD "Approximate Positions of the Major Planets", 3000BC-3000AD.
const EL = {
  mercury: {
    v: [0.38709843, 0.20563661, 7.00559432, 252.25166724, 77.45771895, 48.33961819],
    r: [0.0,        0.00002123, -0.00590158, 149472.67486623, 0.15940013, -0.12214182],
  },
  venus: {
    v: [0.72332102, 0.00676399, 3.39777545, 181.97970850, 131.76755713, 76.67261496],
    r: [-0.00000026, -0.00005107, 0.00043494, 58517.81560260, 0.05679648, -0.27274174],
  },
  earth: {  // Earth-Moon barycentre
    v: [1.00000018, 0.01673163, -0.00054346, 100.46691572, 102.93005885, -5.11260389],
    r: [-0.00000003, -0.00003661, -0.01337178, 35999.37306329, 0.31795260, -0.24123856],
  },
  mars: {
    v: [1.52371243, 0.09336511, 1.85181869, -4.56813164, -23.91744784, 49.71320984],
    r: [0.00000097, 0.00009149, -0.00724757, 19140.29934243, 0.45223625, -0.26852431],
  },
  jupiter: {
    v: [5.20248019, 0.04853590, 1.29861416, 34.33479152, 14.27495244, 100.29282654],
    r: [-0.00002864, 0.00018026, -0.00322699, 3034.90371757, 0.18199196, 0.13024619],
    aug: [-0.00012452, 0.06064060, -0.35635438, 38.35125000],
  },
  saturn: {
    v: [9.54149883, 0.05550825, 2.49424102, 50.07571329, 92.86136063, 113.63998702],
    r: [-0.00003065, -0.00032044, 0.00451969, 1222.11494724, 0.54179478, -0.25015002],
    aug: [0.00025899, -0.13434469, 0.87320147, 38.35125000],
  },
};

function julianDay(date) { return date.getTime() / 86400000 + 2440587.5; }
function centuriesT(date) { return (julianDay(date) - 2451545.0) / 36525; }

// Solve Kepler's equation M = E - e*sin E (radians). Newton iteration. This
// is the deferent equation of centre summed to all orders.
function solveKepler(M, e) {
  let E = M + e * Math.sin(M);
  for (let k = 0; k < 8; k++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  return E;
}

// Heliocentric J2000-ecliptic rectangular coordinates (AU) of a body.
function heliocentricEcl(name, T) {
  const el = EL[name];
  const a    = el.v[0] + el.r[0] * T;
  const e    = el.v[1] + el.r[1] * T;
  const I    = (el.v[2] + el.r[2] * T) * DEG;
  const L    = el.v[3] + el.r[3] * T;
  const wbar = el.v[4] + el.r[4] * T;     // longitude of perihelion
  const Omega = (el.v[5] + el.r[5] * T) * DEG;

  // Mean anomaly, with the outer-planet augmentation on the mean longitude.
  let M = L - wbar;
  if (el.aug) {
    const [b, c, s, f] = el.aug;
    M += b * T * T + c * Math.cos(f * DEG * T) + s * Math.sin(f * DEG * T);
  }
  M = (norm360(M + 180) - 180) * DEG;     // wrap to [-180,180] then radians

  const E  = solveKepler(M, e);
  const xp = a * (Math.cos(E) - e);                       // orbital plane
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);

  const w = wbar * DEG - Omega;            // argument of perihelion
  const cw = Math.cos(w), sw = Math.sin(w);
  const cO = Math.cos(Omega), sO = Math.sin(Omega);
  const cI = Math.cos(I), sI = Math.sin(I);

  // Rotate orbital-plane (xp, yp) into J2000 ecliptic coordinates.
  return {
    x: (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
    y: (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
    z: (sw * sI) * xp + (cw * sI) * yp,
  };
}

// Geocentric ecliptic-rectangular (J2000) for a body: planet minus Earth.
function geocentricEcl(name, T) {
  const earth = heliocentricEcl('earth', T);
  if (name === 'sun') {
    return { x: -earth.x, y: -earth.y, z: -earth.z };   // Sun is opposite Earth
  }
  const p = heliocentricEcl(name, T);
  return { x: p.x - earth.x, y: p.y - earth.y, z: p.z - earth.z };
}

// Geocentric equatorial RA/Dec (radians), MEAN J2000 equinox.
export function bodyGeocentric(name, date) {
  if (name === 'earth') return { ra: 0, dec: 0 };
  if (name === 'moon') return { ra: NaN, dec: NaN };   // lunar theory handled elsewhere
  if (name !== 'sun' && !EL[name]) return { ra: NaN, dec: NaN };
  const T = centuriesT(date);
  const g = geocentricEcl(name, T);
  // Ecliptic -> equatorial (J2000 obliquity).
  const ce = Math.cos(OBLIQ_J2000), se = Math.sin(OBLIQ_J2000);
  const xeq = g.x;
  const yeq = g.y * ce - g.z * se;
  const zeq = g.y * se + g.z * ce;
  const ra  = Math.atan2(yeq, xeq);
  const dec = Math.atan2(zeq, Math.hypot(xeq, yeq));
  return { ra: (ra + 2 * Math.PI) % (2 * Math.PI), dec };
}

export function planetEquatorial(name, date) { return bodyGeocentric(name, date); }
export function sunEquatorial(date) { return bodyGeocentric('sun', date); }

// The 5 classical planets + Sun. Moon is not modelled here.
export const SUPPORTED_BODIES = new Set(['sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn']);
export function coversBody(name) { return SUPPORTED_BODIES.has(name); }
export function coversDate(_date) { return true; }
// Output is J2000 mean; the combined trepidation (precession + nutation +
// aberration) is applied downstream, the same stage that corrects the stars.
export const BUILTIN_CORRECTIONS = { precession: false, nutation: false, aberration: false, fk5: false };
