// Geocentric sun and moon positions from real time and date, plus Greenwich
// sidereal time. Implementations follow Meeus, *Astronomical Algorithms*:
//   - Sun:  Ch. 25 "low-precision" formulae (accurate to ~0.01° over a century)
//   - Moon: simplified Brown / Meeus Ch. 47 with the dominant periodic terms
//           only (accurate to ~0.5° in longitude, ~0.1° in latitude)
//   - GMST: Meeus Ch. 12 equation 12.4 (accurate to the millisecond)
//
// These are sufficient to put the sun and moon in their real-sky positions
// from an observer's viewpoint so that their daily, monthly, and annual
// cycles are visibly independent of one another, not just a uniform sweep.

const DEG = Math.PI / 180;

function norm360(x) { return ((x % 360) + 360) % 360; }

// Julian Day number from a JS Date (UTC).
function julianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// Geocentric equatorial coordinates of the sun (right ascension, declination)
// in radians, apparent-of-date.
export function sunEquatorial(date) {
  const jd = julianDay(date);
  const n = jd - 2451545.0;                              // days since J2000.0
  const L = norm360(280.460 + 0.9856474 * n);            // mean longitude
  const g = norm360(357.528 + 0.9856003 * n) * DEG;      // mean anomaly
  let lambda = L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g);
  lambda = norm360(lambda);
  const eps = (23.439 - 0.0000004 * n) * DEG;            // mean obliquity
  const lamR = lambda * DEG;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lamR), Math.cos(lamR));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lamR));
  return { ra, dec };
}

// Geocentric equatorial coordinates of the moon, apparent-of-date.
// Simplified Meeus with the largest periodic terms only.
export function moonEquatorial(date) {
  const jd = julianDay(date);
  const d = jd - 2451545.0;
  const T = d / 36525;

  // Fundamental angles, degrees (normalised to [0, 360))
  const L0 = norm360(218.3164477 + 481267.88123421 * T);   // moon's mean longitude
  const D  = norm360(297.8501921 + 445267.1114034  * T);   // moon's mean elongation from sun
  const M  = norm360(357.5291092 + 35999.0502909   * T);   // sun's mean anomaly
  const Mp = norm360(134.9633964 + 477198.8675055  * T);   // moon's mean anomaly
  const F  = norm360(93.2720950  + 483202.0175233  * T);   // argument of latitude

  const DR = D * DEG, MR = M * DEG, MpR = Mp * DEG, FR = F * DEG;

  // Dominant ecliptic-longitude corrections (degrees).
  let dLam =
      6.289 * Math.sin(MpR)
   + -1.274 * Math.sin(2 * DR - MpR)
   +  0.658 * Math.sin(2 * DR)
   + -0.186 * Math.sin(MR)
   + -0.059 * Math.sin(2 * MpR - 2 * DR)
   + -0.057 * Math.sin(MpR - 2 * DR + MR)
   +  0.053 * Math.sin(MpR + 2 * DR)
   +  0.046 * Math.sin(2 * DR - MR)
   + -0.041 * Math.sin(MpR - MR);

  let lambda = norm360(L0 + dLam);

  // Dominant ecliptic-latitude corrections (degrees).
  let beta =
      5.128 * Math.sin(FR)
   +  0.281 * Math.sin(MpR + FR)
   +  0.278 * Math.sin(MpR - FR)
   +  0.173 * Math.sin(2 * DR - FR)
   +  0.055 * Math.sin(2 * DR + FR - MpR)
   + -0.046 * Math.sin(2 * DR - FR - MpR);

  const eps = (23.439 - 0.0000004 * d) * DEG;
  const lamR = lambda * DEG;
  const betR = beta * DEG;
  const ra = Math.atan2(
    Math.sin(lamR) * Math.cos(eps) - Math.tan(betR) * Math.sin(eps),
    Math.cos(lamR),
  );
  const dec = Math.asin(
    Math.sin(betR) * Math.cos(eps)
      + Math.cos(betR) * Math.sin(eps) * Math.sin(lamR),
  );
  return { ra, dec };
}

// Greenwich Mean Sidereal Time in degrees (0 .. 360).
export function greenwichSiderealDeg(date) {
  const jd = julianDay(date);
  const T = (jd - 2451545.0) / 36525;
  let gst = 280.46061837
          + 360.98564736629 * (jd - 2451545.0)
          + 0.000387933 * T * T
          - (T * T * T) / 38710000;
  return norm360(gst);
}

// Equatorial (RA, Dec) -> unit vector in the model's celestial frame.
// Celest frame convention: +x toward vernal equinox (RA=0, Dec=0),
//                          +z toward celestial pole (Dec=+90°).
export function equatorialToCelestCoord({ ra, dec }) {
  const cd = Math.cos(dec);
  return [cd * Math.cos(ra), cd * Math.sin(ra), Math.sin(dec)];
}

// --- Planets (Schlyter low-precision, ~1° accuracy) ---------------------
//
// Each row: [N0, dN, i0, di, w0, dw, a0, da, e0, de, M0, dM]
//   N = longitude of ascending node (deg)
//   i = inclination to ecliptic (deg)
//   w = argument of perihelion (deg)
//   a = semi-major axis (unitless; earth = 1)
//   e = eccentricity
//   M = mean anomaly (deg)
// Rates are per day; values are for 1999-12-31 00:00 UT (Schlyter's epoch).
// The `a` column is in the same ratio units as Schlyter's original table;
// the actual distance scale cancels out at the atan2 angle extraction in
// planetEquatorial(), so no physical length enters the model.
const PLANET_EL = {
  mercury: [ 48.3313,  3.24587e-5,   7.0047,    5.00e-8,    29.1241, 1.01444e-5, 0.387098, 0,         0.205635,  5.59e-10,  168.6562, 4.0923344368],
  venus:   [ 76.6799,  2.46590e-5,   3.3946,    2.75e-8,    54.8910, 1.38374e-5, 0.723330, 0,         0.006773, -1.302e-9,   48.0052, 1.6021302244],
  earth:   [  0,       0,            0.0000,    0,         282.9404, 4.70935e-5, 1.000000, 0,         0.016709, -1.151e-9,  356.0470, 0.9856002585],
  mars:    [ 49.5574,  2.11081e-5,   1.8497,   -1.78e-8,   286.5016, 2.92961e-5, 1.523688, 0,         0.093405,  2.516e-9,   18.6021, 0.5240207766],
  jupiter: [100.4542,  2.76854e-5,   1.3030,   -1.557e-7,  273.8777, 1.64505e-5, 5.20256,  0,         0.048498,  4.469e-9,   19.8950, 0.0830853001],
  saturn:  [113.6634,  2.38980e-5,   2.4886,   -1.081e-7,  339.3939, 2.97661e-5, 9.55475,  0,         0.055546, -9.499e-9,  316.9670, 0.0334442282],
};

// Days since Schlyter's 2000 Jan 0.0 epoch (= 1999-12-31 00:00 UT,
// JD 2451543.5). The Unix epoch (1970-01-01 00:00 UT) is JD 2440587.5,
// so the offset in days is 2451543.5 − 2440587.5 = 10956.
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

// Heliocentric ecliptic (x, y, z) in the same unit as `a` (no physical
// length — the scale cancels at atan2 in planetEquatorial below).
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

// Geocentric equatorial coordinates of a planet (radians).
//
// Schlyter's "earth" elements actually describe the Sun's geocentric orbit,
// so `heliocentric('earth', d)` returns the Sun's geocentric xyz (= −Earth's
// heliocentric xyz). To get the planet's geocentric ecliptic coordinates we
// therefore ADD the planet's heliocentric xyz to the Sun's geocentric xyz
// (cf. Schlyter "Computing planetary positions", "Geocentric position"):
//     xgeo = xh_planet + xs   etc.
export function planetEquatorial(name, date) {
  const d = schlyterDay(date);
  const sg = heliocentric('earth', d);   // Sun's geocentric position
  const p  = heliocentric(name, d);      // planet heliocentric position
  const xg = p.x + sg.x, yg = p.y + sg.y, zg = p.z + sg.z;
  const eclip = (23.4393 - 3.563e-7 * d) * DEG;
  const xeq = xg;
  const yeq = yg * Math.cos(eclip) - zg * Math.sin(eclip);
  const zeq = yg * Math.sin(eclip) + zg * Math.cos(eclip);
  const ra  = Math.atan2(yeq, xeq);
  const dec = Math.atan2(zeq, Math.hypot(xeq, yeq));
  return { ra, dec };
}

export const PLANET_NAMES = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];

// --- Eclipse search -----------------------------------------------------
//
// Step forward from a start date, evaluating the sun-moon angular
// separation (for solar eclipses — the two bodies coincide on the sky) and
// the sun-to-antimoon separation (for lunar eclipses — the moon sits near
// the anti-solar point where Earth's shadow is).
//
// A local minimum of either separation that also falls below ~1.5° marks
// an eclipse somewhere on Earth. This is a syzygy filter; accuracy tracks
// the moon ephemeris (~0.5°), which is enough to name the next event to
// the day for any date 1900–2100.

const ECLIPSE_ANG_THRESHOLD = 1.5 * DEG;   // radians

function sepAngle(a, b) {
  const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  return Math.acos(Math.max(-1, Math.min(1, d)));
}

export function findNextEclipses(startDate, windowDays = 400) {
  const stepMs = 3600 * 1000; // 1-hour steps
  const start = startDate.getTime();
  let nextSolar = null;
  let nextLunar = null;

  // Keep the previous two samples of each separation so we can detect a
  // local minimum at sample (i-1) by seeing i-2 > i-1 < i.
  let prevSolar = null, prevPrevSolar = null;
  let prevLunar = null, prevPrevLunar = null;

  const totalSteps = windowDays * 24;
  for (let i = 0; i <= totalSteps; i++) {
    const t = new Date(start + i * stepMs);
    const sunVec  = equatorialToCelestCoord(sunEquatorial(t));
    const moonVec = equatorialToCelestCoord(moonEquatorial(t));
    const antiMoon = [-moonVec[0], -moonVec[1], -moonVec[2]];
    const solarSep = sepAngle(sunVec, moonVec);
    const lunarSep = sepAngle(sunVec, antiMoon);

    if (!nextSolar && prevPrevSolar !== null
        && prevSolar <= prevPrevSolar && prevSolar <= solarSep
        && prevSolar < ECLIPSE_ANG_THRESHOLD) {
      nextSolar = new Date(start + (i - 1) * stepMs);
    }
    if (!nextLunar && prevPrevLunar !== null
        && prevLunar <= prevPrevLunar && prevLunar <= lunarSep
        && prevLunar < ECLIPSE_ANG_THRESHOLD) {
      nextLunar = new Date(start + (i - 1) * stepMs);
    }
    if (nextSolar && nextLunar) break;

    prevPrevSolar = prevSolar; prevSolar = solarSep;
    prevPrevLunar = prevLunar; prevLunar = lunarSep;
  }

  return { nextSolar, nextLunar };
}
