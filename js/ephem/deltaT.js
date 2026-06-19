// Delta-T (TT - UT), seconds, across the full historical and predicted range.
//
// The ephemeris series (VSOP87, the lunar theory) are functions of Terrestrial
// Time (TT). A civil clock is UT. Their difference, Delta-T, is not constant
// and cannot be computed from theory; it is measured (Earth's rotation slows
// irregularly). These are the standard piecewise polynomial fits.
//
// Source: F. Espenak & J. Meeus, "Polynomial Expressions for Delta T", NASA
// Eclipse Web Site (the same fit used in the Five Millennium eclipse canon, so
// our timing and the canon's share one Delta-T model). Valid roughly -1999 to
// +3000; outside that it falls back to the long-term parabola -20 + 32 u^2.

// Delta-T in seconds for a decimal year.
export function deltaTSeconds(year) {
  const y = year;
  let u, t;
  if (y < -500) {
    u = (y - 1820) / 100;
    return -20 + 32 * u * u;
  }
  if (y < 500) {
    u = y / 100;
    return 10583.6 - 1014.41 * u + 33.78311 * u**2 - 5.952053 * u**3
         - 0.1798452 * u**4 + 0.022174192 * u**5 + 0.0090316521 * u**6;
  }
  if (y < 1600) {
    u = (y - 1000) / 100;
    return 1574.2 - 556.01 * u + 71.23472 * u**2 + 0.319781 * u**3
         - 0.8503463 * u**4 - 0.005050998 * u**5 + 0.0083572073 * u**6;
  }
  if (y < 1700) {
    t = y - 1600;
    return 120 - 0.9808 * t - 0.01532 * t**2 + t**3 / 7129;
  }
  if (y < 1800) {
    t = y - 1700;
    return 8.83 + 0.1603 * t - 0.0059285 * t**2 + 0.00013336 * t**3 - t**4 / 1174000;
  }
  if (y < 1860) {
    t = y - 1800;
    return 13.72 - 0.332447 * t + 0.0068612 * t**2 + 0.0041116 * t**3
         - 0.00037436 * t**4 + 0.0000121272 * t**5 - 0.0000001699 * t**6 + 0.000000000875 * t**7;
  }
  if (y < 1900) {
    t = y - 1860;
    return 7.62 + 0.5737 * t - 0.251754 * t**2 + 0.01680668 * t**3
         - 0.0004473624 * t**4 + t**5 / 233174;
  }
  if (y < 1920) {
    t = y - 1900;
    return -2.79 + 1.494119 * t - 0.0598939 * t**2 + 0.0061966 * t**3 - 0.000197 * t**4;
  }
  if (y < 1941) {
    t = y - 1920;
    return 21.20 + 0.84493 * t - 0.076100 * t**2 + 0.0020936 * t**3;
  }
  if (y < 1961) {
    t = y - 1950;
    return 29.07 + 0.407 * t - t**2 / 233 + t**3 / 2547;
  }
  if (y < 1986) {
    t = y - 1975;
    return 45.45 + 1.067 * t - t**2 / 260 - t**3 / 718;
  }
  if (y < 2005) {
    t = y - 2000;
    return 63.86 + 0.3345 * t - 0.060374 * t**2 + 0.0017275 * t**3
         + 0.000651814 * t**4 + 0.00002373599 * t**5;
  }
  if (y < 2050) {
    t = y - 2000;
    return 62.92 + 0.32217 * t + 0.005589 * t**2;
  }
  if (y < 2150) {
    return -20 + 32 * ((y - 1820) / 100)**2 - 0.5628 * (2150 - y);
  }
  u = (y - 1820) / 100;
  return -20 + 32 * u * u;
}

// Decimal year from a Julian Day (sufficient precision for Delta-T).
export function yearFromJD(jd) { return 2000 + (jd - 2451545.0) / 365.25; }

// Delta-T expressed in days, from a Julian Day.
export function deltaTdaysFromJD(jd) { return deltaTSeconds(yearFromJD(jd)) / 86400; }
