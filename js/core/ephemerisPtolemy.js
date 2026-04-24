// Ptolemy pipeline — geocentric deferent + epicycle ephemeris per Almagest.
//
// Ported from:
//   R.H. van Gent, "Almagest Ephemeris Calculator"
//   https://webspace.science.uu.nl/~gent0113/astro/almagestephemeris.htm
//   (retrieved 2026-04-23). Original JavaScript at `addfiles/almagest.js`.
//
// Credit for the original implementation, the Ptolemaic parameter
// transcription, and the inner-planet latitude formulas goes to
// R.H. van Gent (Utrecht University). This module is a port to modern
// ES-module JavaScript, with the DOM-coupled parts of the original
// removed, the sexagesimal parameter literals retained verbatim, and
// the equatorial output converted to radians to match the rest of this
// simulator's ephemeris API.
//
// Model: Claudius Ptolemy, *Almagest* (c. 150 CE). Each planet is
// represented by an eccentric deferent carrying an epicycle on which
// the planet rides; the Earth sits at the observer. Mercury has an
// additional moving-deferent mechanism (Ptolemy's "crank"). Latitudes
// use Ptolemy's auxiliary theories (simple tilted plane for outer
// planets, two-angle oscillation for Venus and Mercury).
//
// Accuracy (Ptolemy's own, verified by many studies):
//   Sun     ≈ 10'–30' over ±2000 years of epoch
//   Moon    ≈ 1°     (weak on evection, nil on variation)
//   Planets ≈ 1°–2°  around antiquity; a few degrees around modern dates
//
// Frame of reference: structurally Earth-centred throughout. There is
// no Sun-relative stage, no heliocentric intermediate, no coordinate
// subtraction. Each planet's ecliptic longitude is produced directly
// by adding the deferent's equation of centre and the epicycle's
// equation of anomaly to its mean longitude.
//
// Output coordinates use Ptolemy's own obliquity (23°51'20" ≈ 23.855°,
// not the modern 23.44°), so declinations here differ by up to ~0.4°
// from the Meeus-based pipelines. That is historically authentic, not
// an error.

import { DEG } from './ephemerisCommon.js';

// ------------------------------------------------------------------
// Epoch and time
// ------------------------------------------------------------------
//
// Ptolemy's epoch = 1 Thoth, Nabonassar year 1 ≈ apparent noon at
// the meridian of Alexandria on 26 February 747 BCE (proleptic
// Julian). JD of this epoch from van Gent:
//   JD_epoch = 1448637 + (22 − (17+34/60)/60)/24 = 1448637.904468
// The small offset encodes the Alexandria longitude (30° E) and a
// 17m 34s correction between Ptolemy's and the modern equation-of-
// time convention.
const JD_EPOCH = 1448637 + (22 - (17 + 34 / 60) / 60) / 24;

function julianDay(date) { return date.getTime() / 86400000 + 2440587.5; }
function ptolemyDay(date) { return julianDay(date) - JD_EPOCH; }

// ------------------------------------------------------------------
// Sexagesimal → decimal (preserves van Gent's source literals)
// ------------------------------------------------------------------
function sex(...parts) {
  let value = 0;
  let factor = 1;
  for (const p of parts) { value += p * factor; factor /= 60; }
  return value;
}

// Degree-trig helpers (Almagest math is all in degrees).
const sind   = x => Math.sin(x * DEG);
const cosd   = x => Math.cos(x * DEG);
const asind  = x => Math.asin(x) / DEG;
const atand  = x => Math.atan(x) / DEG;
const atand2 = (y, x) => Math.atan2(y, x) / DEG;
const degmod = x => ((x % 360) + 360) % 360;
const sgn    = x => x < 0 ? -1 : x > 0 ? 1 : 0;

// ------------------------------------------------------------------
// Ptolemaic orbital constants (exact sexagesimal copy from van Gent)
// ------------------------------------------------------------------
//
// All angles in degrees; mean-motion rates in degrees per day. The
// van Gent comment block quotes the Almagest tables these come from
// (IV.4 for the Moon, III.2 and III.4 for the Sun, IX.4 / X.1–3 /
// XI.1 / XI.5 for the planets).

// Sun
const nsunlong    = sex(  0,59, 8,17,13,12,31);  // mean longitude / day
const mlongsun0   = sex(330,45, 0);              // mean longitude at epoch
const apogeesun   = sex( 65,30, 0);              // solar apogee (tropical)
const eccsun      = sex(  0, 2,30);              // eccentricity (Ptolemy: 2;30 = 1/24)
const obliquity   = sex( 23,51,20);              // Ptolemy's obliquity

// Moon
const nlongmoon   = sex( 13,10,34,58,33,30,30);
const nanommoon   = sex( 13, 3,53,56,17,51,59);
const nlatargmoon = sex( 13,13,45,39,48,56,37);
const nelongmoon  = sex( 12,11,26,41,20,17,59);
const mlongmoon0  = sex( 41,22, 0);
const manommoon0  = sex(268,49, 0);
const latargmoon0 = sex(354,15, 0);
const melongmoon0 = sex( 70,37, 0);
const epimoon     = sex(  0, 6,20);   // epicycle radius (deferent = 60)
const eccmoon     = sex(  0,12,29);   // deferent eccentricity
const incmoon     = sex(  5, 0, 0);   // lunar-orbit inclination

// Saturn
const nlongsat    = sex(  0, 2, 0,33,31,28,51);
const nepianomsat = sex(  0,57, 7,43,41,43,40);
const apogeesat0  = sex(224,10, 0);
const episat      = sex(  0, 6,30);
const eccsat      = sex(  0, 3,25);
const incsat0     = sex(  2,30, 0);
const incsat1     = sex(  4,30, 0);
const nodesat     = sex( 50, 0, 0);
const mepisat_epoch     = 296 + 43 / 60;   // from van Gent almagestpos()
const mepianomsat_epoch = 34 + 2 / 60;

// Jupiter
const nlongjup    = sex(  0, 4,59,14,26,46,31);
const nepianomjup = sex(  0,54, 9, 2,46,26, 0);
const apogeejup0  = sex(152, 9, 0);
const epijup      = sex(  0,11,30);
const eccjup      = sex(  0, 2,45);
const incjup0     = sex(  1,30, 0);
const incjup1     = sex(  2,30, 0);
const nodejup     = sex(340, 0, 0);
const mepijup_epoch     = 184 + 41 / 60;
const mepianomjup_epoch = 146 + 4 / 60;

// Mars
const nlongmar    = sex(  0,31,26,36,53,51,33);
const nepianommar = sex(  0,27,41,40,19,20,58);
const apogeemar0  = sex(106,40, 0);
const epimar      = sex(  0,39,30);
const eccmar      = sex(  0, 6, 0);
const incmar0     = sex(  1, 0, 0);
const incmar1     = sex(  2,15, 0);
const nodemar     = 0;
const mepimar_epoch     = 3 + 32 / 60;
const mepianommar_epoch = 327 + 13 / 60;

// Venus
const nepianomven = sex(  0,36,59,25,53,11,28);
const apogeeven0  = sex( 46,10, 0);
const epiven      = sex(  0,43,10);
const eccven      = sex(  0, 1,15);
const incven0     = sex(  0,10, 0);
const incven1_raw = sex(  2,30, 0);   // van Gent negates: incve1 = −sex2dec(incven1)
const incven2     = sex(  3,30, 0);
const mepianomven_epoch = 71 + 7 / 60;

// Mercury
const nepianommer = sex(  3, 6,24, 6,59,35,50);
const apogeemer0  = sex(181,10, 0);
const epimer      = sex(  0,22,30);
const eccmer      = sex(  0, 3, 0);
const incmer0_raw = sex(  0,45, 0);   // negated by van Gent
const incmer1     = sex(  6,15, 0);
const incmer2_raw = sex(  7, 0, 0);   // negated by van Gent
const mepianommer_epoch = 21 + 55 / 60;

// ------------------------------------------------------------------
// Core deferent+epicycle math (van Gent: eqplan / eqme / latout)
// ------------------------------------------------------------------
//
// `eqplan` — Venus, Mars, Jupiter, Saturn.
//   Arguments: mode n (1=equation of centre, 2=equation of anomaly,
//                      3=distance in deferent-radius units),
//              ecc, epi (in deferent-radius units),
//              meccanom (mean anomaly on deferent, deg),
//              mepianom (mean anomaly on epicycle, deg).
function eqplan(n, ecc, epi, meccanom, mepianom) {
  const esin = ecc * sind(meccanom);
  const ecos = ecc * cosd(meccanom);
  const a    = ecos + Math.sqrt(1 - esin * esin);
  const pros = -atand(2 * esin / a);
  const b    = Math.sqrt(a * a + 4 * esin * esin);
  const fsin = epi * sind(mepianom - pros);
  const fcos = epi * cosd(mepianom - pros);
  const eq   = atand(fsin / (b + fcos));
  const eps  = asind(esin);
  const px   = epi * cosd(mepianom) + ecc * cosd(meccanom) + cosd(eps);
  const py   = epi * sind(mepianom) - 2 * ecc * sind(meccanom);
  const dist = Math.sqrt(px * px + py * py);
  if (n === 1) return pros;
  if (n === 2) return eq;
  return dist;
}

// `eqme` — Mercury (Ptolemy's special moving-deferent "crank").
function eqme(n, ecc, epi, meccanom, mepianom) {
  const ecos    = ecc * cosd(meccanom);
  const esin    = ecc * sind(meccanom);
  const ecoscos = 2 * ecc * cosd(meccanom / 2) * cosd(3 * meccanom / 2);
  const ecossin = 2 * ecc * cosd(meccanom / 2) * sind(3 * meccanom / 2);
  const a       = ecos + ecoscos + Math.sqrt(1 - ecossin * ecossin);
  const pros    = -atand(esin / a);
  const b       = Math.sqrt(a * a + esin * esin);
  const fcos    = epi * cosd(mepianom - pros);
  const fsin    = epi * sind(mepianom - pros);
  const eq      = atand(fsin / (b + fcos));
  const gcos    = ecc * (cosd(meccanom) + cosd(2 * meccanom));
  const gsin    = ecc * (sind(meccanom) + sind(2 * meccanom));
  const pp      = Math.sqrt(1 - gsin * gsin) + gcos;
  const qq      = Math.sqrt(pp * pp + ecc * ecc + 2 * ecc * pp * cosd(meccanom));
  const px      = qq + fcos;
  const py      = fsin;
  const dist    = Math.sqrt(px * px + py * py);
  if (n === 1) return pros;
  if (n === 2) return eq;
  return dist;
}

// `latout` — ecliptic latitude for Mars, Jupiter, Saturn.
function latout(epi, ecc, inc0, inc1, node, latarg, tepianom) {
  const rho1      = epi * cosd(tepianom);
  const rho2      = epi * sind(tepianom);
  const rhoLatMax = 1 + ecc * cosd(node);
  const rhoLatMin = 1 - ecc * cosd(node);
  const rho3      = Math.sqrt((rhoLatMax + rho1) ** 2 + rho2 * rho2);
  const rho4      = Math.sqrt((rhoLatMin + rho1) ** 2 + rho2 * rho2);
  const latMax    = (inc0 * (rho1 + rhoLatMax) - inc1 * rho1) / rho3;
  const latMin    = (inc0 * (rho1 + rhoLatMin) - inc1 * rho1) / rho4;
  const carg      = cosd(latarg);
  return carg * ((latMax + latMin) + sgn(carg) * (latMax - latMin)) / 2;
}

// ------------------------------------------------------------------
// Ecliptic (lon, lat) in Ptolemy's obliquity → equatorial (ra, dec)
// ------------------------------------------------------------------
function eclipticToEquatorial(tlong, lat) {
  const x = cosd(lat) * cosd(tlong);
  const y = cosd(lat) * sind(tlong) * cosd(obliquity) - sind(lat) * sind(obliquity);
  const z = cosd(lat) * sind(tlong) * sind(obliquity) + sind(lat) * cosd(obliquity);
  const raDeg  = degmod(atand2(y, x));
  const decDeg = atand(z / Math.sqrt(x * x + y * y));
  return { ra: raDeg * DEG, dec: decDeg * DEG };
}

// ------------------------------------------------------------------
// Sun (Almagest III.4) — eccentric, no epicycle
// ------------------------------------------------------------------
//
// Computes and returns the Sun's true tropical longitude as well as
// RA/Dec, so Venus and Mercury (which share the Sun's mean longitude)
// can reuse it.
function sunLongitude(ddays) {
  const mlongsu = degmod(mlongsun0 + ddays * nsunlong);
  const manomsu = degmod(mlongsu - apogeesun);
  const eqsu    = atand(eccsun * sind(manomsu) / (1 + eccsun * cosd(manomsu)));
  const tlongsu = degmod(mlongsu - eqsu);
  return { mlongsu, tlongsu };
}

export function sunEquatorial(date) {
  const { tlongsu } = sunLongitude(ptolemyDay(date));
  return eclipticToEquatorial(tlongsu, 0);
}

// ------------------------------------------------------------------
// Moon (Almagest V.5–V.8) — eccentric deferent with crank + epicycle
// ------------------------------------------------------------------
export function moonEquatorial(date) {
  const ddays = ptolemyDay(date);
  const mlongmo   = degmod(mlongmoon0  + ddays * nlongmoon);
  const anommo    = degmod(manommoon0  + ddays * nanommoon);
  const latargmo0 = degmod(latargmoon0 + ddays * nlatargmoon);
  const melongmo  = degmod(melongmoon0 + ddays * nelongmoon);

  const esin  = eccmoon * sind(2 * melongmo);
  const ecos  = eccmoon * cosd(2 * melongmo);
  const oc    = ecos + Math.sqrt(1 - esin * esin);
  const prosmo  = atand(esin / (oc + ecos));
  const tanommo = degmod(anommo + prosmo);
  const fsin    = epimoon * sind(tanommo);
  const fcos    = epimoon * cosd(tanommo);
  const eqmo    = atand(fsin / (oc + fcos));

  const tlongmo = degmod(mlongmo - eqmo);
  const latarg  = degmod(latargmo0 - eqmo);
  const latmo   = incmoon * cosd(latarg);

  return eclipticToEquatorial(tlongmo, latmo);
}

// ------------------------------------------------------------------
// Outer planets — Mars, Jupiter, Saturn
// ------------------------------------------------------------------
function outerPlanet(ddays, params) {
  const {
    apogee0, nlong, nepianom,
    mepi_epoch, mepianom_epoch,
    ecc, epi, inc0, inc1, node,
  } = params;
  const prectab = ddays / 36525;   // Ptolemy's precession: 1°/century

  const apogee    = degmod(apogee0 + prectab);
  const mepi      = degmod(mepi_epoch      + ddays * nlong);
  const mepianom  = degmod(mepianom_epoch  + ddays * nepianom);
  const meccanom  = degmod(mepi - apogee);

  const pros      = eqplan(1, ecc, epi, meccanom, mepianom);
  const teccanom  = degmod(meccanom  + pros);
  const tepianom  = degmod(mepianom  - pros);
  const eqa       = eqplan(2, ecc, epi, meccanom, mepianom);
  const tlong     = degmod(mepi + pros + eqa);

  const latarg    = degmod(teccanom + node);
  const lat       = latout(epi, ecc, inc0, inc1, node, latarg, tepianom);

  return eclipticToEquatorial(tlong, lat);
}

// ------------------------------------------------------------------
// Inner planets — Venus, Mercury (share Sun's mean longitude)
// ------------------------------------------------------------------
//
// Venus and Mercury share `mepi = sun's mean longitude` because in
// Ptolemy's system their deferent centres track the Sun. Their
// latitude theories are more elaborate than the outer planets (three
// components each, following Almagest XIII.1–XIII.6).
function venusPosition(ddays) {
  const { mlongsu } = sunLongitude(ddays);
  const prectab    = ddays / 36525;
  const apogeeve   = degmod(apogeeven0 + prectab);
  const mepive     = mlongsu;
  const mepianomve = degmod(mepianomven_epoch + ddays * nepianomven);
  const meccanomve = degmod(mepive - apogeeve);

  const prosve      = eqplan(1, eccven, epiven, meccanomve, mepianomve);
  const teccanomve  = degmod(meccanomve + prosve);
  const tepianomve  = degmod(mepianomve - prosve);
  const eqave       = eqplan(2, eccven, epiven, meccanomve, mepianomve);
  const tlongve     = degmod(mepive + prosve + eqave);

  // Venus latitude — three components (van Gent; Almagest XIII).
  // Note: incven1 is used NEGATED here (per van Gent's source).
  const incve1      = -incven1_raw;
  const etave       = Math.abs(tepianomve - 180);
  const pprime      = Math.abs(epiven * cosd(etave) * sind(incve1));
  const xprime      = 0.999782 - epiven * cosd(etave) * cosd(incve1);
  const yprime      = epiven * sind(etave);
  const oprime      = Math.sqrt(xprime * xprime + yprime * yprime);
  const c3ve        = atand2(pprime, oprime);
  const c6ve        = Math.abs(atand2(epiven * sind(tepianomve),
                                      1 + epiven * cosd(tepianomve)));
  const c4ve        = 3.25 * c6ve / 60;
  const xkappa0p    = degmod(teccanomve + 90);
  const latve1      = -sgn(cosd(tepianomve)) * c3ve * cosd(xkappa0p);
  const latve2      = sgn(sind(tepianomve)) * c4ve * cosd(teccanomve);
  const latve3      = incven0 * cosd(teccanomve) * cosd(teccanomve);
  const latve       = latve1 + latve2 + latve3;

  return eclipticToEquatorial(tlongve, latve);
}

function mercuryPosition(ddays) {
  const { mlongsu } = sunLongitude(ddays);
  const prectab    = ddays / 36525;
  const apogeeme   = degmod(apogeemer0 + prectab);
  const mepime     = mlongsu;
  const mepianomme = degmod(mepianommer_epoch + ddays * nepianommer);
  const meccanomme = degmod(mepime - apogeeme);

  const prosme      = eqme(1, eccmer, epimer, meccanomme, mepianomme);
  const teccanomme  = degmod(meccanomme + prosme);
  const tepianomme  = degmod(mepianomme - prosme);
  const eqame       = eqme(2, eccmer, epimer, meccanomme, mepianomme);
  const tlongme     = degmod(mepime + prosme + eqame);

  // Mercury latitude — three components, per van Gent / Almagest.
  // incme0 and incme2 are NEGATED per the van Gent source.
  const incme0 = -incmer0_raw;
  const incme1 =  incmer1;
  const etame  = Math.abs(tepianomme - 180);
  const pprime = Math.abs(epimer * cosd(etame) * sind(incme1));
  const xprime = 0.94444 - epimer * cosd(etame) * cosd(incme1);
  const yprime = epimer * sind(etame);
  const oprime = Math.sqrt(xprime * xprime + yprime * yprime);
  const c3me   = atand2(pprime, oprime);
  const c6me   = Math.abs(atand2(epimer * sind(tepianomme),
                                 1 + epimer * cosd(tepianomme)));
  const c4me   = 6.8 * c6me / 60;
  const xkappa0p  = degmod(teccanomme + 270);
  const latme1    = -sgn(cosd(tepianomme)) * c3me * cosd(xkappa0p);
  const xkappa0pp = degmod(teccanomme + 180);
  const latme2    = (cosd(teccanomme) > 0 ? 0.9 : 1.1)
                     * sgn(sind(tepianomme)) * c4me * cosd(xkappa0pp);
  const latme3    = incme0 * cosd(teccanomme) * cosd(teccanomme);
  const latme     = latme1 + latme2 + latme3;

  return eclipticToEquatorial(tlongme, latme);
}

// ------------------------------------------------------------------
// Public API — matches the other pipelines (ephemerisGeo / Helio)
// ------------------------------------------------------------------
export function planetEquatorial(name, date) {
  const ddays = ptolemyDay(date);
  if (name === 'saturn') return outerPlanet(ddays, {
    apogee0: apogeesat0, nlong: nlongsat, nepianom: nepianomsat,
    mepi_epoch: mepisat_epoch, mepianom_epoch: mepianomsat_epoch,
    ecc: eccsat, epi: episat, inc0: incsat0, inc1: incsat1, node: nodesat,
  });
  if (name === 'jupiter') return outerPlanet(ddays, {
    apogee0: apogeejup0, nlong: nlongjup, nepianom: nepianomjup,
    mepi_epoch: mepijup_epoch, mepianom_epoch: mepianomjup_epoch,
    ecc: eccjup, epi: epijup, inc0: incjup0, inc1: incjup1, node: nodejup,
  });
  if (name === 'mars') return outerPlanet(ddays, {
    apogee0: apogeemar0, nlong: nlongmar, nepianom: nepianommar,
    mepi_epoch: mepimar_epoch, mepianom_epoch: mepianommar_epoch,
    ecc: eccmar, epi: epimar, inc0: incmar0, inc1: incmar1, node: nodemar,
  });
  if (name === 'venus')   return venusPosition(ddays);
  if (name === 'mercury') return mercuryPosition(ddays);
  // S221 — Ptolemy's Almagest predates the discovery of Uranus
  // (1781), Neptune (1846), and Pluto (1930). There are no deferent
  // / epicycle parameters for any of them in his model, so the
  // pipeline has nothing to say — return NaN to signal "no data"
  // rather than a spurious zero reading.
  return { ra: NaN, dec: NaN };
}

export function bodyGeocentric(name, date) {
  if (name === 'sun')   return sunEquatorial(date);
  if (name === 'moon')  return moonEquatorial(date);
  if (name === 'earth') return { ra: 0, dec: 0 };
  return planetEquatorial(name, date);
}
