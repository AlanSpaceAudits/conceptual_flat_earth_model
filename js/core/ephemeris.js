// Ephemeris dispatcher — routes body-position queries to one of three
// structurally distinct pipelines (S011):
//
//   'heliocentric' → ephemerisHelio.js   — Schlyter heliocentric Kepler,
//                                          composed with the Sun's
//                                          geocentric orbit.
//   'geocentric'   → ephemerisGeo.js     — single Earth-focus Kepler
//                                          ellipse per planet (S010).
//                                          No Sun stage anywhere.
//   'ptolemy'      → ephemerisPtolemy.js — Ptolemy's deferent+epicycle
//                                          model, ported from R.H. van
//                                          Gent's Almagest Ephemeris
//                                          Calculator. Structurally
//                                          geocentric throughout.
//
// Ptolemy port credit:
//   R.H. van Gent, "Almagest Ephemeris Calculator"
//   https://webspace.science.uu.nl/~gent0113/astro/almagestephemeris.htm
//
// Common Meeus-based Sun/Moon, GMST, eclipse-finder, and frame-rotation
// helpers live in `ephemerisCommon.js` and are shared by the Helio and
// GeoC pipelines (both use Meeus Ch.25/Ch.47 for the luminaries, only
// their planet treatments differ). The Ptolemy pipeline is fully
// self-contained — it has its own Sun and Moon models drawn from the
// Almagest.
//
// All three pipelines expose the same API shape: `bodyGeocentric`,
// `planetEquatorial`, `sunEquatorial`, `moonEquatorial`. The router
// `bodyRADec(name, date, source)` selects one of them.
//
// Legacy exports (`bodyGeocentric`, `bodyFromHeliocentric`, single-arg
// `planetEquatorial`, etc.) are preserved so downstream code can keep
// importing the names it already uses; they default to the `'geocentric'`
// (Earth-focus Kepler) pipeline. The S009 `bodyFromHeliocentric` alias
// collapsed to `bodyGeocentric` in S010 remains available.

import * as helio from './ephemerisHelio.js';
import * as geo   from './ephemerisGeo.js';
import * as ptol  from './ephemerisPtolemy.js';
import * as apix  from './ephemerisAstropixels.js';
import * as vsop  from './ephemerisVsop87.js';

export {
  sunEquatorial as meeusSunEquatorial,
  moonEquatorial as meeusMoonEquatorial,
  greenwichSiderealDeg,
  equatorialToCelestCoord,
  findNextEclipses,
  julianDay,
  meanObliquityDeg,
  norm360,
} from './ephemerisCommon.js';

// The pipeline namespaces, exported so modules that want to compute
// several readings simultaneously can do so without reimporting the
// individual files.
export { helio, geo, ptol, apix, vsop };

export const EPHEMERIS_SOURCES = ['geocentric', 'heliocentric', 'ptolemy', 'astropixels', 'vsop87'];
// S221 — Uranus + Neptune added. DE405 / AstroPixels carries
// coverage 2019–2030; the other four pipelines (HelioC / GeoC /
// Ptolemy / VSOP87) don't have the outer-planet elements or
// coefficients yet, so their `bodyGeocentric` falls back to
// `{ ra: NaN, dec: NaN }` for those two names. Consumers that
// render comparison rows should treat NaN as "no data".
// Pluto is absent — Espenak doesn't publish Pluto ephemerides
// on AstroPixels, so there's no DE405 source to bundle here.
export const PLANET_NAMES = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
export const BODY_NAMES   = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

// Primary router. Returns `{ ra, dec }` in radians, geocentric-apparent.
export function bodyRADec(name, date, source = 'geocentric') {
  if (source === 'heliocentric') return helio.bodyGeocentric(name, date);
  if (source === 'ptolemy')      return ptol.bodyGeocentric(name, date);
  if (source === 'astropixels')  return apix.bodyGeocentric(name, date);
  if (source === 'vsop87')       return vsop.bodyGeocentric(name, date);
  return geo.bodyGeocentric(name, date);
}

// Per-pipeline planet API (callers who already know which source they
// want).
export function planetEquatorial(name, date, source = 'geocentric') {
  if (source === 'heliocentric') return helio.planetEquatorial(name, date);
  if (source === 'ptolemy')      return ptol.planetEquatorial(name, date);
  if (source === 'astropixels')  return apix.planetEquatorial(name, date);
  if (source === 'vsop87')       return vsop.planetEquatorial(name, date);
  return geo.planetEquatorial(name, date);
}

// Sun / Moon routers. HelioC and GeoC pipelines both use Meeus; Ptolemy
// has its own Almagest implementations; Astropixels uses DE405-derived
// tabulated data.
export function sunEquatorial(date, source = 'geocentric') {
  if (source === 'ptolemy')     return ptol.sunEquatorial(date);
  if (source === 'astropixels') return apix.sunEquatorial(date);
  if (source === 'vsop87')      return vsop.sunEquatorial(date);
  return geo.sunEquatorial(date);
}
export function moonEquatorial(date, source = 'geocentric') {
  if (source === 'ptolemy')     return ptol.moonEquatorial(date);
  if (source === 'astropixels') return apix.moonEquatorial(date);
  if (source === 'vsop87')      return vsop.moonEquatorial(date);
  return geo.moonEquatorial(date);
}

// Legacy exports — downstream imports that pre-date the router.
// `bodyGeocentric` defaults to the 'geocentric' pipeline (Earth-focus
// Kepler, the S010 behaviour). `bodyFromHeliocentric` is retained as
// an alias for S009 compatibility; use `bodyRADec(name, date,
// 'heliocentric')` explicitly to route through the HelioC pipeline.
export function bodyGeocentric(name, date) { return geo.bodyGeocentric(name, date); }
export const bodyFromHeliocentric = bodyGeocentric;
