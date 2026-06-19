// Full-accuracy geocentric Moon — Meeus, *Astronomical Algorithms*, 2nd ed.,
// 1998, Chapter 47 ("Position of the Moon"), complete lunar theory (ELP-2000/82
// truncation).
//
// The abridged Meeus moon in `common.js` (27 longitude + 18 latitude terms)
// runs ~1–2° off DE405 and is too coarse for eclipse contact prediction. This
// module implements the FULL Chapter 47 series: the 60-term Table 47.A
// (Σl, Σr) and the 60-term Table 47.B (Σb), plus the A1/A2/A3 additive
// arguments, the E-factor on M-dependent terms, and the additive Σl / Σb
// corrections that follow the tables. Resulting accuracy is ~10″ in RA/Dec,
// validated against DE405 (AstroPixels) in scripts/validate-moon.mjs.
//
// Coefficient tables ported verbatim from the MIT-licensed `astronomia`
// package (commenthol / Sonia Keys), file `src/moonposition.js`, which
// reproduces Meeus Tables 47.A and 47.B exactly:
//   https://github.com/commenthol/astronomia  (MIT)
// The same package supplies this project's VSOP87 planetary data. The numeric
// coefficients are Meeus's published values; they were not approximated here.
//
// Conceptual note: each periodic (D, M, M′, F) term below is one epicycle of
// the lunar deferent — a Fourier component of the Moon's true longitude /
// latitude / distance about its mean motion. This is the identical
// epicycle-as-Fourier-term construction used by the planetary VSOP87 series.
//
// The point: gravitational perturbation theory is just a geometric correction.
// The terms below ARE the Moon's gravitational perturbations (evection,
// variation, the annual equation, and the rest), and every one of them is an
// epicycle, a circle, which is pure geometry. The whole perturbation series is
// circles. There is no force, mass, or acceleration anywhere in the code.
//
// Epicycle = trig: a point on a circle of radius A turning at a steady rate C,
// starting at angle B, sits at A·cos(B + C·t) along an axis (and A·sin(B + C·t)
// along the perpendicular one). That is exactly the form of each term here. So
// one gravitational perturbation = one rotating circle = one cosine. Nothing
// else is in it.
//
// Specific sources (PDFs and parsed notes in the project sources/ folder):
// Gallavotti (2001) "Quasi-periodic motions from Hipparchus to Kolmogorov",
// Rend. Lincei 12, 125 (arXiv:chao-dyn/9907004) proves any quasi-periodic
// motion is a Fourier series that factors into deferent plus epicycles, and
// that Newtonian gravitation confirms rather than ends the circular-motion
// conception; Hanson (1960) Isis 51(2), 150; Kosheleva & Kreinovich (2019)
// UTEP-CS-19-82. The evection / variation / annual-equation terms used below
// are the standard Meeus Ch.47 coefficients.
//
// The series yields apparent ecliptic longitude/latitude referenced to the
// MEAN equinox of date, WITHOUT nutation (Meeus 47, p. 342). Per the task
// spec we add nutation in longitude (Δψ) to λ and convert to RA/Dec using the
// TRUE obliquity ε = ε₀ + Δε. Nutation here is the standard 2-term
// Ω-driven model (Meeus 22.A, the same one used by common.js), imported via
// moonNodeOmegaDeg / meanObliquityDeg.

import { DEG, julianDay, meanObliquityDeg, moonNodeOmegaDeg, norm360 } from './common.js';
import { deltaTSeconds as deltaTSecondsByYear } from './deltaT.js';
import { DEG_PER_DU, MOON_MEAN_DIST_M } from '../tang/units.js';

// --- Lunar horizontal parallax, Chinese-first, Earth-radius-free ------------
// The parallax is built the way the project derives every quantity: it STARTS
// as an observed angle in the Chinese du system, and the GE (modern) value is
// got by multiplying by the one scaling factor — `…_DU * DEG_PER_DU` is
// literally "du × factor", so the conversion is visible in the variable. Earth's
// radius is never named here; it lives only in js/tang/units.js as a
// familiar-unit reference. The mean lunar parallax is the canonical du datum
// (the Moon's measured shift across the baseline — the quantity Tang eclipse /
// zenith-star longitude work relied on): 0.963056 du × DEG_PER_DU = 0.949214°
// ≈ 56.95′ ≈ the canonical 57′. The monthly swing enters only as the
// dimensionless fraction δ = Σr/d_mean, so sin(π) = sin(π_mean)/(1 + δ); the
// one length used (the Moon's OWN mean distance, to make Σr fractional) is
// imported from units.js. A distance, if wanted, falls back out of the parallax
// by inverse trig: d = R/sin(π).
const MEAN_LUNAR_PARALLAX_DU  = 0.963056;                            // Chinese datum (du)
const MEAN_LUNAR_PARALLAX_DEG = MEAN_LUNAR_PARALLAX_DU * DEG_PER_DU; // GE: du × factor
const SIN_MEAN_LUNAR_PARALLAX = Math.sin(MEAN_LUNAR_PARALLAX_DEG * DEG);

// Horner polynomial evaluation: c[0] + c[1]·x + c[2]·x² + …
function horner(x, ...c) {
  let r = c[c.length - 1];
  for (let i = c.length - 2; i >= 0; i--) r = r * x + c[i];
  return r;
}

function pmod2pi(x) {
  const TWO_PI = 2 * Math.PI;
  return ((x % TWO_PI) + TWO_PI) % TWO_PI;
}

// ΔT = TT − UTC in seconds. The Moon moves ~0.55″/s, so the ~72 s offset
// between civil time (UTC) and the ephemeris time scale (TT) that Meeus's
// elements are expressed in shifts the apparent Moon by ~40″ — well above
// the 10″ target. We therefore evaluate the series at JDE = JD(UTC) + ΔT/86400.
// Polynomial: full Espenak-Meeus set (js/ephem/deltaT.js), valid across the
// whole canon range, not just 2005-2050.
function deltaTSeconds(date) {
  const y = date.getUTCFullYear() + (date.getUTCMonth() + 0.5) / 12;
  return deltaTSecondsByYear(y);
}

// Julian Ephemeris Day (TT-based) from a UTC JS Date.
// `dtOverrideSec` lets a caller supply a known Delta-T (e.g. the eclipse
// canon's own measured value for that date) instead of the polynomial fit.
function julianEphemerisDay(date, dtOverrideSec) {
  const dt = Number.isFinite(dtOverrideSec) ? dtOverrideSec : deltaTSeconds(date);
  return julianDay(date) + dt / 86400;
}

// Mean elements (radians). Meeus 47.1–47.5, full-precision Horner forms.
function dmf(T) {
  const d  = horner(T, 297.8501921 * DEG, 445267.1114034 * DEG, -0.0018819 * DEG, DEG / 545868, -DEG / 113065000);
  const m  = horner(T, 357.5291092 * DEG,  35999.0502909 * DEG, -0.0001536 * DEG, DEG / 24490000);
  const mp = horner(T, 134.9633964 * DEG, 477198.8675055 * DEG,  0.0087414 * DEG, DEG / 69699, -DEG / 14712000);
  const f  = horner(T,  93.2720950 * DEG, 483202.0175233 * DEG, -0.0036539 * DEG, -DEG / 3526000, DEG / 863310000);
  return [d, m, mp, f];
}

// Table 47.A — 60 terms: [D, M, M', F, Σl (×1e-6 deg), Σr (×1e-3 km)].
const TA = [
  [0, 0, 1, 0, 6288774, -20905355],
  [2, 0, -1, 0, 1274027, -3699111],
  [2, 0, 0, 0, 658314, -2955968],
  [0, 0, 2, 0, 213618, -569925],
  [0, 1, 0, 0, -185116, 48888],
  [0, 0, 0, 2, -114332, -3149],
  [2, 0, -2, 0, 58793, 246158],
  [2, -1, -1, 0, 57066, -152138],
  [2, 0, 1, 0, 53322, -170733],
  [2, -1, 0, 0, 45758, -204586],
  [0, 1, -1, 0, -40923, -129620],
  [1, 0, 0, 0, -34720, 108743],
  [0, 1, 1, 0, -30383, 104755],
  [2, 0, 0, -2, 15327, 10321],
  [0, 0, 1, 2, -12528, 0],
  [0, 0, 1, -2, 10980, 79661],
  [4, 0, -1, 0, 10675, -34782],
  [0, 0, 3, 0, 10034, -23210],
  [4, 0, -2, 0, 8548, -21636],
  [2, 1, -1, 0, -7888, 24208],
  [2, 1, 0, 0, -6766, 30824],
  [1, 0, -1, 0, -5163, -8379],
  [1, 1, 0, 0, 4987, -16675],
  [2, -1, 1, 0, 4036, -12831],
  [2, 0, 2, 0, 3994, -10445],
  [4, 0, 0, 0, 3861, -11650],
  [2, 0, -3, 0, 3665, 14403],
  [0, 1, -2, 0, -2689, -7003],
  [2, 0, -1, 2, -2602, 0],
  [2, -1, -2, 0, 2390, 10056],
  [1, 0, 1, 0, -2348, 6322],
  [2, -2, 0, 0, 2236, -9884],
  [0, 1, 2, 0, -2120, 5751],
  [0, 2, 0, 0, -2069, 0],
  [2, -2, -1, 0, 2048, -4950],
  [2, 0, 1, -2, -1773, 4130],
  [2, 0, 0, 2, -1595, 0],
  [4, -1, -1, 0, 1215, -3958],
  [0, 0, 2, 2, -1110, 0],
  [3, 0, -1, 0, -892, 3258],
  [2, 1, 1, 0, -810, 2616],
  [4, -1, -2, 0, 759, -1897],
  [0, 2, -1, 0, -713, -2117],
  [2, 2, -1, 0, -700, 2354],
  [2, 1, -2, 0, 691, 0],
  [2, -1, 0, -2, 596, 0],
  [4, 0, 1, 0, 549, -1423],
  [0, 0, 4, 0, 537, -1117],
  [4, -1, 0, 0, 520, -1571],
  [1, 0, -2, 0, -487, -1739],
  [2, 1, 0, -2, -399, 0],
  [0, 0, 2, -2, -381, -4421],
  [1, 1, 1, 0, 351, 0],
  [3, 0, -2, 0, -340, 0],
  [4, 0, -3, 0, 330, 0],
  [2, -1, 2, 0, 327, 0],
  [0, 2, 1, 0, -323, 1165],
  [1, 1, -1, 0, 299, 0],
  [2, 0, 3, 0, 294, 0],
  [2, 0, -1, -2, 0, 8752],
];

// Table 47.B — 60 terms: [D, M, M', F, Σb (×1e-6 deg)].
const TB = [
  [0, 0, 0, 1, 5128122],
  [0, 0, 1, 1, 280602],
  [0, 0, 1, -1, 277693],
  [2, 0, 0, -1, 173237],
  [2, 0, -1, 1, 55413],
  [2, 0, -1, -1, 46271],
  [2, 0, 0, 1, 32573],
  [0, 0, 2, 1, 17198],
  [2, 0, 1, -1, 9266],
  [0, 0, 2, -1, 8822],
  [2, -1, 0, -1, 8216],
  [2, 0, -2, -1, 4324],
  [2, 0, 1, 1, 4200],
  [2, 1, 0, -1, -3359],
  [2, -1, -1, 1, 2463],
  [2, -1, 0, 1, 2211],
  [2, -1, -1, -1, 2065],
  [0, 1, -1, -1, -1870],
  [4, 0, -1, -1, 1828],
  [0, 1, 0, 1, -1794],
  [0, 0, 0, 3, -1749],
  [0, 1, -1, 1, -1565],
  [1, 0, 0, 1, -1491],
  [0, 1, 1, 1, -1475],
  [0, 1, 1, -1, -1410],
  [0, 1, 0, -1, -1344],
  [1, 0, 0, -1, -1335],
  [0, 0, 3, 1, 1107],
  [4, 0, 0, -1, 1021],
  [4, 0, -1, 1, 833],
  [0, 0, 1, -3, 777],
  [4, 0, -2, 1, 671],
  [2, 0, 0, -3, 607],
  [2, 0, 2, -1, 596],
  [2, -1, 1, -1, 491],
  [2, 0, -2, 1, -451],
  [0, 0, 3, -1, 439],
  [2, 0, 2, 1, 422],
  [2, 0, -3, -1, 421],
  [2, 1, -1, 1, -366],
  [2, 1, 0, 1, -351],
  [4, 0, 0, 1, 331],
  [2, -1, 1, 1, 315],
  [2, -2, 0, -1, 302],
  [0, 0, 1, 3, -283],
  [2, 1, 1, -1, -229],
  [1, 1, 0, -1, 223],
  [1, 1, 0, 1, 223],
  [0, 1, -2, -1, -220],
  [2, 1, -1, -1, -220],
  [1, 0, 1, 1, -185],
  [2, -1, -2, -1, 181],
  [0, 1, 2, 1, -177],
  [4, 0, -2, -1, 176],
  [4, -1, -1, -1, 166],
  [1, 0, 1, -1, -164],
  [4, 0, 1, -1, 132],
  [1, 0, -1, -1, -119],
  [4, -1, 0, -1, 115],
  [2, -2, 0, 1, 107],
];

// Geocentric ecliptic position, apparent, equinox-of-date (λ includes Δψ
// nutation). Returns { lon, lat, distER, sinHP }: lon/lat in radians; sinHP is
// the sine of the Moon's horizontal parallax, built Chinese-first from a du
// angle (see the constants block above — Earth's radius is never used); distER
// is the distance that falls OUT of that parallax by inverse trig
// (distER = 1/sinHP), in units of the observer's radius.
export function moonEclipticOfDate(date, dtOverrideSec) {
  const jde = julianEphemerisDay(date, dtOverrideSec);
  const T = (jde - 2451545.0) / 36525;

  const lp = horner(T, 218.3164477 * DEG, 481267.88123421 * DEG, -0.0015786 * DEG, DEG / 538841, -DEG / 65194000);
  const [d, m, mp, f] = dmf(T);

  // Additive arguments A1, A2, A3 (Meeus 47, p. 338).
  const a1 = (119.75 + 131.849 * T) * DEG;
  const a2 = (53.09 + 479264.290 * T) * DEG;
  const a3 = (313.45 + 481266.484 * T) * DEG;

  // Eccentricity factor E (Meeus 47.6), applied to terms involving M.
  const e = horner(T, 1, -0.002516, -0.0000074);
  const e2 = e * e;

  // Additive Σl / Σb corrections that precede the table sums (Meeus 47).
  let sumL = 3958 * Math.sin(a1) + 1962 * Math.sin(lp - f) + 318 * Math.sin(a2);
  let sumR = 0;
  let sumB = -2235 * Math.sin(lp) + 382 * Math.sin(a3)
           + 175 * Math.sin(a1 - f) + 175 * Math.sin(a1 + f)
           + 127 * Math.sin(lp - mp) - 115 * Math.sin(lp + mp);

  for (let i = 0; i < TA.length; i++) {
    const [cd, cm, cmp, cf, cl, cr] = TA[i];
    const arg = cd * d + cm * m + cmp * mp + cf * f;
    let ef = 1;
    if (cm === 1 || cm === -1) ef = e;
    else if (cm === 2 || cm === -2) ef = e2;
    sumL += cl * ef * Math.sin(arg);
    sumR += cr * ef * Math.cos(arg);
  }

  for (let i = 0; i < TB.length; i++) {
    const [cd, cm, cmp, cf, cb] = TB[i];
    const arg = cd * d + cm * m + cmp * mp + cf * f;
    let ef = 1;
    if (cm === 1 || cm === -1) ef = e;
    else if (cm === 2 || cm === -2) ef = e2;
    sumB += cb * ef * Math.sin(arg);
  }

  // Nutation in longitude Δψ (2-term Ω model, Meeus 22.A) — radians.
  const omega = moonNodeOmegaDeg(T) * DEG;
  const dPsi = (-17.20 / 3600) * Math.sin(omega) * DEG;

  const lon = pmod2pi(lp + sumL * 1e-6 * DEG + dPsi);
  const lat = sumB * 1e-6 * DEG;
  // Parallax, Chinese-first and Earth-radius-free. The Moon's monthly distance
  // swing enters only as the dimensionless fraction δ = Σr / d_mean (the lunar
  // distance epicycle series relative to the Moon's mean distance), so the
  // parallax scales as sin(π) = sin(π_mean)/(1 + δ). π_mean came in as a du
  // angle × DEG_PER_DU (see the constants block); the distance falls out of the
  // parallax by inverse trig, in units of the observer's radius.
  const delta  = sumR / MOON_MEAN_DIST_M;     // fractional distance variation
  const sinHP  = SIN_MEAN_LUNAR_PARALLAX / (1 + delta);
  const distER = 1 / sinHP;                   // d = R/sin(π), R = 1 (falls out)
  return { lon, lat, distER, sinHP };
}

// Geocentric equatorial coordinates of the Moon, apparent-of-date.
// { ra, dec } in radians. Converts apparent ecliptic (λ+Δψ, β) using the
// TRUE obliquity ε = ε₀ + Δε.
export function moonEquatorial(date, dtOverrideSec) {
  const jde = julianEphemerisDay(date, dtOverrideSec);
  const T = (jde - 2451545.0) / 36525;
  const { lon, lat } = moonEclipticOfDate(date, dtOverrideSec);

  // True obliquity: mean obliquity + nutation in obliquity Δε (Meeus 22.A).
  const omega = moonNodeOmegaDeg(T) * DEG;
  const dEps = (9.20 / 3600) * Math.cos(omega) * DEG;
  const eps = meanObliquityDeg(T) * DEG + dEps;

  const sinLon = Math.sin(lon), cosLon = Math.cos(lon);
  const sinLat = Math.sin(lat), cosLat = Math.cos(lat);
  const sinEps = Math.sin(eps), cosEps = Math.cos(eps);

  let ra = Math.atan2(sinLon * cosEps - (sinLat / cosLat) * sinEps, cosLon);
  ra = ((ra % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const dec = Math.asin(sinLat * cosEps + cosLat * sinEps * sinLon);
  return { ra, dec };
}
