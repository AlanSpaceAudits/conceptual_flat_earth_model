// ============================================================================
// TANG MASTER EPHEMERIS  (geocentric, fully epicyclic, modern accuracy)
// ============================================================================
//
// TWO TANG EPHEMERIDES
// --------------------
// The project carries two geocentric ephemerides, both reporting in the Tang
// du / xiu angle system:
//   * TANG PTOLZ (js/ephem/ptolemy.js): Ptolemy's own Almagest model, his
//     deferent + epicycle + equant geometry and his own parameters, nothing
//     added. Sun, Moon, and the five classical planets, at Ptolemy's accuracy.
//   * TANG MASTER (this file): the comprehensive one. The same geocentric,
//     epicyclic kind of construction, but the angle-and-time DATA for each body
//     is taken from the best modern series, so it spans the whole sky to a few
//     arcseconds and includes the bodies the Almagest's tables never listed.
//
// Both report in du and the 28 xiu, and this holds for everything below
// (planets, Sun, Moon, and the stars): the Tang angle differs from the modern
// angle by nothing more than a conversion factor. One du is 360/365.25 of a
// degree, a single constant. The du value is not a different or approximate
// angle; it is the same direction on the sky written against a 365.25-part
// circle instead of a 360-part one. A position in du is internally consistent
// within the Tang system in exactly the way a degree is within the modern
// system. Neither is the truer number; the two meet only through that one
// conversion factor. The angles are measured and used entirely within whichever
// system they are read in.
//
// WHAT THE MODERN SERIES ARE
// --------------------------
// The modern theories used here (VSOP87 for Sun and planets, the full Meeus
// lunar series for the Moon) are the position DATA: tables of where each body
// is over time. They are the same kind of object as an epicycle model. A VSOP87
// term A*cos(B + C*t) is one epicycle (a circle of radius A, frequency C, phase
// B); VSOP87 is just thousands of them summed on the deferent. Taking the
// numbers from VSOP is reading the position off a longer epicycle sum and
// expressing it geocentrically.
//
// They supply exactly two things:
//   (1) the planets' angular positions over time at modern precision, and
//   (2) the bodies Ptolemy's tables never carried: the Moon to arcseconds, and
//       Uranus and Neptune (discovered 1781 / 1846).
// The geocentric, epicyclic construction is unchanged. The retrograde loops are
// still produced exactly as Ptolemy produced them, by the geocentric
// subtraction (planet minus Earth), the largest epicycle of all, the annual one.
//
// Why epicycles reach any accuracy (so this is not hand-waving): solving
// Kepler's equation M = E - e sin E and forming the true longitude gives the
// equation of centre, a Fourier (sine) series in the mean anomaly,
//    v - M = (2e - e^3/4) sin M + (5/4 e^2) sin 2M + (13/12 e^3) sin 3M + ...
// where every sin(kM) is one epicycle. An ellipse, solved, is an infinite stack
// of epicycles, so the popular idea that heliocentrism "replaced epicycles with
// clean ellipses" is simply false. Gallavotti (2001) proves the formal version:
// any quasi-periodic motion is a Fourier series, and ordering its coefficients
// by decreasing size recovers a deferent plus nested epicycles exactly (his
// Eqs. 8-9). He states it outright, that "Newtonian mechanics has been ... [the]
// most brilliant confirmation" of the circular-motion conception, not its end.
// Cited specifically (PDFs and parsed source notes are in the project sources/
// folder): Gallavotti (2001) "Quasi-periodic motions from Hipparchus to
// Kolmogorov", Rend. Lincei 12, 125 (arXiv:chao-dyn/9907004); Hanson (1960)
// Isis 51(2), 150; Kosheleva & Kreinovich (2019) UTEP-CS-19-82; McCall (2023);
// Rushkin (2015) arXiv:1502.01967; Fitzpatrick, A Modern Almagest; Wikipedia,
// "Deferent and epicycle" and "Equant".
//
// ---------------------------------------------------------------------------
// PROVENANCE
// ---------------------------------------------------------------------------
//   THE MODEL (geocentric deferent + epicycle + equant): Ptolemy, Almagest;
//     Fitzpatrick, A Modern Almagest (implementation equations); the equant and
//     fitting it to a real ephemeris: Rushkin 2015; Rhodes, Ptolemy's cosmos to
//     scale; Wikipedia_Equant. Ptolemy's own parameters: Riley 1995. Epicycles
//     are a Fourier series: Hanson 1960; Kosheleva & Kreinovich 2019; McCall
//     2023; UMD_Fourier_Visualization; Wikipedia_Deferent_and_Epicycle.
//   POSITION DATA fed into the geocentric model (the A*cos(B+C*t) epicycle
//   terms, angle over time):
//     Sun + Mercury..Neptune: VSOP87D, Bretagnon & Francou (1988), A&A 202, 309
//       (JS port via Sonia Keys -> commenthol, MIT). Supplies the planets'
//       positions over time, and Uranus and Neptune, which the Almagest never
//       listed.
//     Moon: full Meeus, Astronomical Algorithms 2nd ed., Ch. 47.
//     Apparent-place corrections (light-time, aberration, nutation, Delta-T):
//       Meeus Ch. 23, 22, 33. These are the precession / nutation / aberration
//       sky motions the system groups under "trepidation"; Chinese astronomers
//       tracked the same motions.
//     Eclipse syzygy anchor: F. Espenak (NASA / AstroPixels) eclipse canon.
// ============================================================================

import VSOP87_MERCURY from '../data/vsop87/mercury.js';
import VSOP87_VENUS   from '../data/vsop87/venus.js';
import VSOP87_EARTH   from '../data/vsop87/earth.js';
import VSOP87_MARS    from '../data/vsop87/mars.js';
import VSOP87_JUPITER from '../data/vsop87/jupiter.js';
import VSOP87_SATURN  from '../data/vsop87/saturn.js';
import VSOP87_URANUS  from '../data/vsop87/uranus.js';
import VSOP87_NEPTUNE from '../data/vsop87/neptune.js';
import { DEG, norm360, meanObliquityDeg, moonNodeOmegaDeg } from './common.js';
import { moonEquatorial as fullMoonEquatorial, moonEclipticOfDate } from './moonFull.js';
import { DEG_PER_DU, R_LI, C_LI_PER_SEC } from '../tang/units.js';
import { deltaTdaysFromJD } from './deltaT.js';

const VSOP = {
  mercury: VSOP87_MERCURY, venus: VSOP87_VENUS, earth: VSOP87_EARTH,
  mars: VSOP87_MARS, jupiter: VSOP87_JUPITER, saturn: VSOP87_SATURN,
  uranus: VSOP87_URANUS, neptune: VSOP87_NEPTUNE,
};

// Hook to register further VSOP87D bodies (same epicycle format) at runtime.
export function registerOuterPlanet(name, data) { VSOP[name] = data; }

const ARCSEC = Math.PI / (180 * 3600);
const julianDay = (date) => date.getTime() / 86400000 + 2440587.5;

// --- Solar horizontal-parallax sine, Chinese-first -------------------------
// The Sun's parallax anchor: a du datum carried to modern by `…_DU * DEG_PER_DU`
// (du × factor). 0.00247845 du × DEG_PER_DU = 8.794″ — the canonical solar
// parallax at the MEAN Earth–Sun distance. The body's actual parallax then
// scales by its distance relative to that mean, the same fractional form as the
// Moon (`sin(π_mean)/(1 + δ)`); no AU or kilometre as a unit. See
// bodyParallaxSine.
const SOLAR_PARALLAX_DU  = 0.00247845;                     // Chinese datum (du)
const SOLAR_PARALLAX_DEG = SOLAR_PARALLAX_DU * DEG_PER_DU;  // GE: du × factor
const SIN_SOLAR_PARALLAX = Math.sin(SOLAR_PARALLAX_DEG * DEG);

// --- Light-time of one AU = AU/c, derived in the Chinese li system ----------
// AU as a li length, by the same parallax law as everything else:
//   AU = R_li / sin(solar parallax)        (units_of_measurement)
// c is the li-native speed C_LI_PER_SEC (units.js). Their quotient AU/c is a
// TIME, the scale-invariant the brief identifies, so it carries no length unit
// and matches the SI light-time. This replaces the former SI c-in-AU/day
// constant; the planet light-time is then dist[AU] × AU_LIGHT_TIME_DAY.
const AU_LI             = R_LI / SIN_SOLAR_PARALLAX;            // AU expressed in li
const AU_LIGHT_TIME_DAY = (AU_LI / C_LI_PER_SEC) / 86400;      // AU/c, in days

// Delta-T (TT - UTC) comes from js/ephem/deltaT.js (full Espenak-Meeus range,
// -1999..+3000). The VSOP and lunar series are functions of TT, so the JS Date
// (UTC) is shifted to TT before evaluating. The Moon needs this most (~0.5"/s);
// applying it to the Sun and planets too keeps the whole sky at one physical
// instant, which the eclipse syzygy timing depends on.

// --- The epicycle sum -------------------------------------------------------
// Each term [A, B, C] is ONE epicycle: a circle of radius A, turning at
// angular frequency C, started at phase B. Powers of T carry the slow secular
// drift of the deferent. This is the whole of VSOP87.
function evalSeries(series, T) {
  let total = 0, Tpow = 1;
  for (let p = 0; p <= 5; p++) {
    const terms = series[String(p)];
    if (terms) {
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

// Heliocentric ecliptic (L, B radians, R AU), mean equinox of date, at
// T millennia from J2000. L and B here are the full epicycle stack summed.
function heliocentric(body, Tmil) {
  const d = VSOP[body];
  return { L: evalSeries(d.L, Tmil), B: evalSeries(d.B, Tmil), R: evalSeries(d.R, Tmil) };
}
function sphToRect(L, B, R) {
  const cb = Math.cos(B);
  return { x: R * cb * Math.cos(L), y: R * cb * Math.sin(L), z: R * Math.sin(B) };
}

// --- Apparent-place corrections (Meeus) ------------------------------------
// Nutation, two-term low-accuracy model (Meeus 22.A): the wobble of the
// equinox, ~9-17 arcsec. dpsi in longitude, deps in obliquity (radians).
function nutation(Tcent) {
  const om = moonNodeOmegaDeg(Tcent) * DEG;
  return { dpsi: -17.20 * Math.sin(om) * ARCSEC, deps: 9.20 * Math.cos(om) * ARCSEC };
}
// Annual aberration in ecliptic coordinates (Meeus 23.2): the ~20.5 arcsec
// tilt of every ray from the Earth's orbital velocity. Needs the Sun's true
// longitude O and the Earth orbit's eccentricity e and perihelion longitude pi.
const KAPPA = 20.49552 * ARCSEC;
function aberrationEcliptic(lambda, beta, sunLon, Tcent) {
  const e  = 0.016708634 - 0.000042037 * Tcent - 0.0000001267 * Tcent * Tcent;
  const pi = (102.93735 + 1.71946 * Tcent + 0.00046 * Tcent * Tcent) * DEG;
  const cb = Math.cos(beta);
  const dLam = (-KAPPA * Math.cos(sunLon - lambda) + e * KAPPA * Math.cos(pi - lambda)) / cb;
  const dBet = -KAPPA * Math.sin(beta) * (Math.sin(sunLon - lambda) - e * Math.sin(pi - lambda));
  return { dLam, dBet };
}

// Sun's geometric ecliptic longitude (radians, of date) from Earth's series,
// used by the aberration formula. Sun is opposite the Earth.
function sunGeometricLon(Tmil) {
  const e = heliocentric('earth', Tmil);
  return norm360((e.L + Math.PI) * 180 / Math.PI) * DEG;
}

// Ecliptic (lambda, beta) + true obliquity -> equatorial (RA, Dec).
function eclipToEq(lambda, beta, trueEps) {
  const sl = Math.sin(lambda), cl = Math.cos(lambda), tb = Math.tan(beta);
  let ra = Math.atan2(sl * Math.cos(trueEps) - tb * Math.sin(trueEps), cl);
  const dec = Math.asin(Math.sin(beta) * Math.cos(trueEps) + Math.cos(beta) * Math.sin(trueEps) * sl);
  ra = ((ra % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return { ra, dec };
}

// --- Apparent geocentric place of a planet (Meeus Ch. 33) ------------------
// 1. light-time: the planet is seen where it WAS, distance/c days ago, so its
//    own orbital motion during light travel is removed by iterating on the
//    retarded time. (This is the planet's "epicycle" advancing while the light
//    is in flight.)
// 2. annual aberration: Earth's velocity tilts the ray (~20.5 arcsec).
// 3. nutation: equinox wobble.
function apparentPlanet(body, jd) {
  const Tmil  = (jd - 2451545.0) / 365250;
  const Tcent = (jd - 2451545.0) / 36525;
  const earth = heliocentric('earth', Tmil);
  const er = sphToRect(earth.L, earth.B, earth.R);

  // Light-time iteration: recompute the planet at jd - tau until tau converges.
  let tau = 0, gx = 0, gy = 0, gz = 0;
  for (let k = 0; k < 5; k++) {
    const Tp = (jd - tau - 2451545.0) / 365250;
    const p  = heliocentric(body, Tp);
    const pr = sphToRect(p.L, p.B, p.R);
    gx = pr.x - er.x; gy = pr.y - er.y; gz = pr.z - er.z;
    const dist = Math.hypot(gx, gy, gz);
    const newTau = dist * AU_LIGHT_TIME_DAY;
    if (Math.abs(newTau - tau) < 1e-9) { tau = newTau; break; }
    tau = newTau;
  }

  let lambda = Math.atan2(gy, gx);
  let beta   = Math.asin(gz / Math.hypot(gx, gy, gz));

  const sunLon = sunGeometricLon(Tmil);
  const ab = aberrationEcliptic(lambda, beta, sunLon, Tcent);
  lambda += ab.dLam; beta += ab.dBet;

  const nut = nutation(Tcent);
  lambda += nut.dpsi;                                  // nutation in longitude
  const trueEps = meanObliquityDeg(Tcent) * DEG + nut.deps;
  return eclipToEq(lambda, beta, trueEps);
}

// --- Apparent geocentric Sun (Meeus Ch. 25) --------------------------------
// The Sun gets aberration (which already equals its light-time displacement,
// so no separate light-time step) and nutation.
function apparentSun(jd) {
  const Tmil  = (jd - 2451545.0) / 365250;
  const Tcent = (jd - 2451545.0) / 36525;
  const earth = heliocentric('earth', Tmil);
  let lambda = norm360((earth.L + Math.PI) * 180 / Math.PI) * DEG;   // opposite Earth
  let beta   = -earth.B;

  const ab = aberrationEcliptic(lambda, beta, lambda, Tcent);        // sunLon == lambda
  lambda += ab.dLam; beta += ab.dBet;
  const nut = nutation(Tcent);
  lambda += nut.dpsi;
  const trueEps = meanObliquityDeg(Tcent) * DEG + nut.deps;
  return eclipToEq(lambda, beta, trueEps);
}

// --- Public API ------------------------------------------------------------
// Apparent geocentric RA/Dec (radians) of date. `dtOverrideSec` supplies a
// known Delta-T (TT - UT) in seconds for this instant instead of the polynomial
// fit; pass the eclipse canon's own measured Delta-T to reproduce a historical
// eclipse at its exact dynamical time. Delta-T is the single global TT - UT
// offset at this date, so one value covers the whole sky here.
export function bodyGeocentric(name, date, dtOverrideSec) {
  if (name === 'earth') return { ra: 0, dec: 0 };
  const jd = julianDay(date);
  const dtDays = Number.isFinite(dtOverrideSec) ? dtOverrideSec / 86400 : deltaTdaysFromJD(jd);
  const jde = jd + dtDays;   // UT -> TT
  if (name === 'sun')  return apparentSun(jde);
  // Moon: full Meeus Ch.47 (moonFull.js), apparent geocentric of date. Its
  // periodic terms are the lunar deferent's epicycles (~120 of them).
  if (name === 'moon') return fullMoonEquatorial(date, dtOverrideSec);
  if (!VSOP[name]) return { ra: NaN, dec: NaN };
  return apparentPlanet(name, jde);
}
export function planetEquatorial(name, date) { return bodyGeocentric(name, date); }
export function sunEquatorial(date) { return bodyGeocentric('sun', date); }
export function moonEquatorial(date) { return bodyGeocentric('moon', date); }

// Earth–Sun distance relative to its own mean — a pure fraction (≈1, swinging
// ±1.7% over the year). VSOP returns it as the ~1-valued heliocentric radius;
// because the solar parallax is defined AT that mean, this radius IS the
// fraction the parallax scales by. No AU enters as a unit.
function earthSunDistanceRatio(jde) {
  const Tmil = (jde - 2451545.0) / 365250;
  return heliocentric('earth', Tmil).R;
}

// Geocentric distance as a Chinese-AU RATIO (Earth's orbit = 1) — a pure Kepler
// ratio, no SI length. Used by the rectangular Tang-Ptolz correction to give the
// Almagest's direction a magnitude so the residual can be fit in position space
// (where it is smooth, instead of cusping in angle near conjunction). The
// absolute scale (Chinese AU = R_LI/sin θ_sun in li) cancels in the final
// normalise, so only this ratio matters.
export function geocentricDistanceAU(name, date) {
  const jd = julianDay(date);
  const dt = deltaTdaysFromJD(jd);
  const Tmil = (jd + dt - 2451545.0) / 365250;
  const earth = heliocentric('earth', Tmil);
  if (name === 'sun' || name === 'earth') return earth.R;
  const er = sphToRect(earth.L, earth.B, earth.R);
  const p  = heliocentric(name, Tmil);
  const pr = sphToRect(p.L, p.B, p.R);
  return Math.hypot(pr.x - er.x, pr.y - er.y, pr.z - er.z);
}

// sin(horizontal parallax), built the same way for both eclipse bodies: a
// du-anchored mean parallax divided by the body's distance RELATIVE TO ITS OWN
// MEAN (a fraction), never an absolute distance.
//   Moon: sin(π_mean)/(1 + Σr/d_mean)                 (from moonFull)
//   Sun : sin(π_sun_mean)/(Earth–Sun ÷ its mean)
//   planets: 0 — their parallax is < ~30″ (sub-pixel), and pinning it would
//            need the planet's distance in AU, which the FE frame doesn't use.
export function bodyParallaxSine(name, date, dtOverrideSec) {
  if (name === 'moon') return moonEclipticOfDate(date, dtOverrideSec).sinHP;
  if (name === 'sun') {
    const jd = julianDay(date);
    const dt = Number.isFinite(dtOverrideSec) ? dtOverrideSec / 86400 : deltaTdaysFromJD(jd);
    return SIN_SOLAR_PARALLAX / earthSunDistanceRatio(jd + dt);
  }
  return 0;
}

export function SUPPORTED_BODIES_FN() {
  return new Set(['sun', 'moon', ...Object.keys(VSOP).filter((b) => b !== 'earth')]);
}
export const SUPPORTED_BODIES = SUPPORTED_BODIES_FN();
export function coversBody(name) { return SUPPORTED_BODIES_FN().has(name); }
export function coversDate(_date) { return true; }
// All apparent-of-date corrections are baked in per component (the geocentric
// "everything factored in" convention), so no separate trepidation stage.
export const BUILTIN_CORRECTIONS = { precession: true, nutation: true, aberration: true, fk5: false };
