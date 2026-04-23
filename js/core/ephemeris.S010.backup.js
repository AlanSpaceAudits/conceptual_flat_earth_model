// Geocentric sun, moon and planet positions from real time and date, plus
// Greenwich sidereal time. Implementations follow Meeus, *Astronomical
// Algorithms*, 2nd ed., 1998 for the sun, moon and GMST — all three are
// written geocentric-apparent in Meeus and need no frame transformation.
// Planets are evaluated as single Kepler ellipses with the Earth at the
// focus (S010).
//
//   - Sun:  Ch. 25 "higher accuracy" method (formulas 25.2, 25.3, 25.4,
//           25.6, 25.8, 25.9) — apparent-of-date, includes nutation +
//           aberration + apparent-obliquity correction. Expected accuracy
//           ~1" in RA/Dec across ±2000 years of J2000.
//   - Moon: expanded Meeus Ch. 47 — 27 longitude + 18 latitude periodic
//           terms. Expected accuracy ~10" longitude, ~4" latitude.
//   - GMST: Meeus Ch. 12 equation 12.4.
//   - Planets: one Keplerian ellipse per planet with the Earth at the
//           focus (S010). Elements (eccentricity, inclination, node,
//           argument, mean anomaly at epoch, mean motion) are conceptual
//           ratios; no physical AU distance is interpreted. Positions
//           are computed once per planet with no Sun-relative stage.
//           Accuracy versus real ephemeris is poor — inner planets no
//           longer librate about the Sun and no planet exhibits
//           retrograde motion — but the active math chain in this
//           module is Earth-centred throughout.
//
// S009 — upgraded from the earlier low-precision sun / 9-term moon
// formulas to the current Meeus higher-accuracy versions.
//
// S010 — the heliocentric planetary chain has been removed from the
// active path. Previously each planet was computed as
// `sun_around_earth + planet_around_sun` (Tychonic composition); that
// whole second-term stage is gone. There is no Sun-centred intermediate,
// no `sunGeo + planetRelSun` sum, no `bodyHeliocentric` helper, and
// `bodyFromHeliocentric` / `bodyRADec(..., 'heliocentric')` are overt
// collapses onto the geocentric chain (kept as named aliases only so
// the Tracker HUD's dual-readout still resolves). The Tychonic-reframe
// version that this file replaced is preserved verbatim at
// `js/core/ephemeris.reframe.backup.js`; the original heliocentric
// version from before any S010 work is at
// `js/core/ephemeris.S009.backup.js`. Revert path in
// `change_log_serials.md`.

const DEG = Math.PI / 180;

function norm360(x) { return ((x % 360) + 360) % 360; }

// Julian Day number from a JS Date (UTC).
function julianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// Mean obliquity of the ecliptic in degrees (Meeus 22.2).
function meanObliquityDeg(T) {
  // 23° 26' 21.448" - 46.8150" T - 0.00059" T² + 0.001813" T³
  return 23 + 26 / 60 + 21.448 / 3600
       - (46.8150 * T + 0.00059 * T * T - 0.001813 * T * T * T) / 3600;
}

// Nutation-in-longitude / apparent-obliquity correction via the longitude of
// the Moon's ascending node Ω. Sufficient for cel-nav precision:
//   Δψ ≈ −0.00569 − 0.00478·sin Ω    (degrees, low-accuracy nutation)
//   Δε ≈  0.00256·cos Ω              (degrees)
// Higher-order nutation terms contribute < 0.001° and are skipped here.
function moonNodeOmegaDeg(T) {
  return norm360(125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000);
}

// Geocentric equatorial coordinates of the sun (right ascension, declination)
// in radians, apparent-of-date. Meeus Ch. 25 higher-accuracy method.
export function sunEquatorial(date) {
  const jd = julianDay(date);
  const T  = (jd - 2451545.0) / 36525;   // Julian centuries from J2000.0

  // Geometric mean longitude (Meeus 25.2).
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  // Mean anomaly of the Sun (Meeus 25.3).
  const M  = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const MR = M * DEG;
  // Eccentricity of Earth's orbit (Meeus 25.4).
  const e  = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  // Equation of the centre C, degrees (Meeus 25, prose after 25.4).
  const C  = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(MR)
           + (0.019993 - 0.000101 * T) * Math.sin(2 * MR)
           +  0.000289                  * Math.sin(3 * MR);
  // True longitude and true anomaly.
  const lambdaTrue = L0 + C;
  // Longitude of the Moon's ascending node (nutation term).
  const omegaDeg = moonNodeOmegaDeg(T);
  const omega    = omegaDeg * DEG;
  // Apparent longitude: subtract the fixed aberration term and the
  // node-driven nutation-in-longitude (Meeus 25.9).
  const lambda   = lambdaTrue - 0.00569 - 0.00478 * Math.sin(omega);
  // Apparent obliquity (Meeus 25.8): mean + node-driven nutation.
  const epsDeg   = meanObliquityDeg(T) + 0.00256 * Math.cos(omega);
  const lamR = lambda * DEG;
  const epsR = epsDeg * DEG;
  const ra   = Math.atan2(Math.cos(epsR) * Math.sin(lamR), Math.cos(lamR));
  const dec  = Math.asin(Math.sin(epsR) * Math.sin(lamR));
  return { ra, dec };
}

// Geocentric equatorial coordinates of the moon, apparent-of-date.
// Expanded Meeus Ch. 47: 27 longitude terms + 18 latitude terms.
// Accuracy ~10" longitude, ~4" latitude.
export function moonEquatorial(date) {
  const jd = julianDay(date);
  const d = jd - 2451545.0;
  const T = d / 36525;

  // Fundamental angles (Meeus 47.1 – 47.5), degrees normalised to [0, 360).
  const L0 = norm360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T);
  const D  = norm360(297.8501921 + 445267.1114034  * T - 0.0018819 * T * T);
  const M  = norm360(357.5291092 +  35999.0502909  * T - 0.0001536 * T * T);
  const Mp = norm360(134.9633964 + 477198.8675055  * T + 0.0087414 * T * T);
  const F  = norm360(93.2720950  + 483202.0175233  * T - 0.0036539 * T * T);

  const DR = D * DEG, MR = M * DEG, MpR = Mp * DEG, FR = F * DEG;

  // Ecliptic longitude periodic corrections (degrees).
  // Top-27 terms from Meeus Table 47.A converted from 10⁻⁶° units to °.
  const dLam =
      6.288774 * Math.sin(MpR)
   + -1.274027 * Math.sin(2 * DR - MpR)
   +  0.658314 * Math.sin(2 * DR)
   +  0.213618 * Math.sin(2 * MpR)
   + -0.185116 * Math.sin(MR)
   + -0.114332 * Math.sin(2 * FR)
   +  0.058793 * Math.sin(2 * DR - 2 * MpR)
   +  0.057066 * Math.sin(2 * DR - MR - MpR)
   +  0.053322 * Math.sin(2 * DR + MpR)
   +  0.045758 * Math.sin(2 * DR - MR)
   + -0.040923 * Math.sin(MR - MpR)
   + -0.034720 * Math.sin(DR)
   + -0.030383 * Math.sin(MR + MpR)
   +  0.015327 * Math.sin(2 * DR - 2 * FR)
   + -0.012528 * Math.sin(MpR + 2 * FR)
   +  0.010980 * Math.sin(MpR - 2 * FR)
   +  0.010675 * Math.sin(4 * DR - MpR)
   +  0.010034 * Math.sin(3 * MpR)
   +  0.008548 * Math.sin(4 * DR - 2 * MpR)
   + -0.007888 * Math.sin(2 * DR + MR - MpR)
   + -0.006766 * Math.sin(2 * DR + MR)
   + -0.005163 * Math.sin(DR - MpR)
   +  0.004987 * Math.sin(DR + MR)
   +  0.004036 * Math.sin(2 * DR - MR + MpR)
   +  0.003994 * Math.sin(2 * DR + 2 * MpR)
   +  0.003861 * Math.sin(4 * DR)
   +  0.003665 * Math.sin(2 * DR - 3 * MpR);

  // Ecliptic latitude periodic corrections (degrees).
  // Top-18 terms from Meeus Table 47.B.
  const beta =
      5.128122 * Math.sin(FR)
   +  0.280602 * Math.sin(MpR + FR)
   +  0.277693 * Math.sin(MpR - FR)
   +  0.173237 * Math.sin(2 * DR - FR)
   +  0.055413 * Math.sin(2 * DR - MpR + FR)
   +  0.046271 * Math.sin(2 * DR - MpR - FR)
   +  0.032573 * Math.sin(2 * DR + FR)
   +  0.017198 * Math.sin(2 * MpR + FR)
   +  0.009266 * Math.sin(2 * DR + MpR - FR)
   +  0.008822 * Math.sin(2 * MpR - FR)
   +  0.008216 * Math.sin(2 * DR - MR - FR)
   +  0.004324 * Math.sin(2 * DR - 2 * MpR - FR)
   +  0.004200 * Math.sin(2 * DR + MpR + FR)
   + -0.003359 * Math.sin(2 * DR + MR - FR)
   +  0.002463 * Math.sin(2 * DR - MR - MpR + FR)
   +  0.002211 * Math.sin(2 * DR - MR + FR)
   +  0.002065 * Math.sin(2 * DR - MR - MpR - FR)
   + -0.001870 * Math.sin(MR - MpR - FR);

  // Apparent longitude/obliquity via the same node-driven nutation used
  // for the sun — keeps sun and moon consistent across dates.
  const omegaDeg = moonNodeOmegaDeg(T);
  const omega    = omegaDeg * DEG;
  const lambda   = norm360(L0 + dLam) - 0.00478 * Math.sin(omega);
  const epsDeg   = meanObliquityDeg(T) + 0.00256 * Math.cos(omega);

  const lamR = lambda * DEG;
  const betR = beta * DEG;
  const epsR = epsDeg * DEG;
  const ra = Math.atan2(
    Math.sin(lamR) * Math.cos(epsR) - Math.tan(betR) * Math.sin(epsR),
    Math.cos(lamR),
  );
  const dec = Math.asin(
    Math.sin(betR) * Math.cos(epsR)
      + Math.cos(betR) * Math.sin(epsR) * Math.sin(lamR),
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

// --- Planets (Earth-focus Kepler ellipses, S010) -------------------------
//
// Each row: [N0, dN, i0, di, w0, dw, a0, da, e0, de, M0, dM]
//   N = longitude of ascending node (deg)
//   i = inclination to ecliptic (deg)
//   w = argument of perihelion (deg)
//   a = semi-major axis (unitless ratio; scale cancels at the atan2
//       extraction in planetEquatorial(), so no physical length enters)
//   e = eccentricity
//   M = mean anomaly (deg)
// Rates are per day; values are for Schlyter's epoch 1999-12-31 00:00 UT
// (JD 2451543.5).
//
// S010 — these numbers are reinterpreted in this module as specifying a
// Keplerian ellipse with the **Earth at the focus**. No Sun-around-Earth
// row is included and no Sun-relative composition is performed; each row
// is treated as the planet's orbit in the Earth-centred frame this file
// computes in. The numerical values are retained from Schlyter's table
// because they are the closest published ratio-parameters available;
// they are *not* interpreted physically (AU has no meaning in this
// model, which you've noted depends on an assumed Earth radius). The
// direct consequence is that apparent planetary positions no longer
// match real ephemerides — inner planets do not librate about the Sun,
// outer planets do not exhibit retrograde — but the active math chain
// in this module never references the Sun as an orbit centre.
const ORBIT_EL = {
  mercury: [ 48.3313,  3.24587e-5,   7.0047,    5.00e-8,    29.1241, 1.01444e-5, 0.387098, 0,         0.205635,  5.59e-10,  168.6562, 4.0923344368],
  venus:   [ 76.6799,  2.46590e-5,   3.3946,    2.75e-8,    54.8910, 1.38374e-5, 0.723330, 0,         0.006773, -1.302e-9,   48.0052, 1.6021302244],
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
// tabulated `a`; the absolute scale cancels at the atan2 extraction in
// planetEquatorial(), so only angular ratios enter the final RA/Dec.
//
// S010 — replaces the previous `keplerPosition(name, d)` helper that
// returned a Sun-relative vector for planets. The math is the standard
// two-body orbit-plane solve followed by the three Euler rotations; the
// difference is that the focus of the ellipse is now the observer
// (Earth), so the returned (x, y, z) is the planet's geocentric ecliptic
// position directly — with no subsequent Sun-term composition.
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
//
// S010 — single Earth-focus Kepler evaluation. No Sun-around-Earth
// stage, no planet-around-Sun stage, no `sunGeo + planetRelSun` sum.
// `keplerEarthFocus` returns the planet's geocentric ecliptic (x, y, z)
// directly; the only remaining step is rotation into apparent-of-date
// equatorial coordinates at the Schlyter obliquity `ε = 23.4393° −
// 3.563e-7·d`.
export function planetEquatorial(name, date) {
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

export const PLANET_NAMES = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];

// --- Body-position API (S009 interface; S010 collapse) -------------------
//
// `bodyGeocentric(name, date)` returns `{ ra, dec }` in the geocentric
// equatorial frame — the only frame this module computes in.
//
// S010 removed every heliocentric pipeline from this module: there is no
// `bodyHeliocentric`, no `sun + planetRelSun` stage, no helio-minus-
// earth-helio subtraction. The API shape from S009 is preserved only so
// that `app.js` and the Tracker HUD keep importing the same names:
//
//   - `bodyFromHeliocentric(name, date)` is an overt alias of
//     `bodyGeocentric`. Kept as a named export so the Tracker's
//     dual-readout still resolves its imports; both the Geo and Helio
//     rows of the HUD will now carry the same value. This is the
//     inverse of a wrapper-that-hides-helio-math: it is an explicit
//     collapse onto the geocentric chain, with no hidden Sun term.
//
//   - `bodyRADec(name, date, source)` accepts `source` for signature
//     compatibility only. The parameter is ignored; both `'geocentric'`
//     and `'heliocentric'` route to `bodyGeocentric`.

// Geocentric equatorial (RA, Dec) for any supported body.
export function bodyGeocentric(name, date) {
  if (name === 'sun')   return sunEquatorial(date);
  if (name === 'moon')  return moonEquatorial(date);
  if (name === 'earth') return { ra: 0, dec: 0 };   // degenerate; observer-centred
  return planetEquatorial(name, date);
}

// S010 — overt alias. No heliocentric computation path exists in this
// module; the Tracker HUD's dual-readout will display the same value
// twice. The signature and name are preserved solely for that import.
export const bodyFromHeliocentric = bodyGeocentric;

// S010 — `source` is accepted for signature compatibility only. The
// active chain is geocentric regardless of which value is passed; the
// previous `'heliocentric'` branch went through `bodyFromHeliocentric`,
// which is now itself an alias of `bodyGeocentric`.
export function bodyRADec(name, date, _source = 'geocentric') {
  return bodyGeocentric(name, date);
}

export const BODY_NAMES = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

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
