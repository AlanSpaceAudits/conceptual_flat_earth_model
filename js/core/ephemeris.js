// Ephemeris dispatcher.
//
// Loading order / runtime contract
// --------------------------------
//   • **Default ephem = Fred Espenak (DE405 / AstroPixels).** That's
//     the only pipeline guaranteed to be queried per frame. State
//     defaults `BodySource: 'astropixels'`; the rendered sun / moon /
//     planet positions all come from `apix.bodyGeocentric` for any
//     date inside Espenak's 2019–2030 window.
//   • **Comparison ephems (GeoC / HelioC / VSOP87 / Ptolemy) stay
//     dormant** until the Tracker tab's "Ephemeris comparison" toggle
//     (`state.ShowEphemerisReadings`) is on. With it off, `app.update`
//     never invokes them — only the active source runs each frame.
//     Toggling the comparison off again drops the per-frame calls so
//     the four extra pipelines effectively "unload" from the hot
//     path even if the JS engine keeps the module objects cached.
//   • **Fallback chain** (only triggered when the active source can't
//     deliver a body / date pair): `astropixels → geocentric →
//     vsop87 → ptolemy`. GeoC is the seamless fallback when Espenak's
//     2019–2030 table runs out — its Schlyter Earth-focus Kepler
//     elements span effectively unlimited dates. VSOP87 catches inner
//     planets; Ptolemy is the historical last resort.
//
// Pipelines
// ---------
//   'astropixels'  → ephemerisAstropixels.js — Espenak / DE405 daily
//                                              tables. Default. The
//                                              only pipeline ALWAYS
//                                              loaded.
//   'geocentric'   → ephemerisGeo.js         — Schlyter Earth-focus
//                                              Kepler. Wide-date
//                                              fallback. Loaded by
//                                              the static import
//                                              chain so the dispatcher
//                                              can route to it from
//                                              the fallback path
//                                              without an async wait.
//   'vsop87'       → ephemerisVsop87.js      — Bretagnon & Francou
//                                              analytical theory.
//                                              Comparison-mode only.
//   'heliocentric' → ephemerisHelio.js       — Schlyter heliocentric
//                                              Kepler, composed with
//                                              the Sun's geocentric
//                                              orbit. Comparison-mode
//                                              only.
//   'ptolemy'      → ephemerisPtolemy.js     — Almagest deferent +
//                                              epicycle, ported via
//                                              R.H. van Gent's
//                                              Almagest Ephemeris
//                                              Calculator. Comparison
//                                              -mode only.
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
// All five pipelines expose the same API shape: `bodyGeocentric`,
// `planetEquatorial`, `sunEquatorial`, `moonEquatorial`, plus
// `SUPPORTED_BODIES` / `coversBody` / `coversDate` / `BUILTIN_CORRECTIONS`
// metadata. The router `bodyRADec(name, date, source)` selects one,
// walking the fallback chain if the requested source can't deliver.
//
// Legacy exports (`bodyGeocentric`, `bodyFromHeliocentric`, single-arg
// `planetEquatorial`, etc.) are preserved so downstream code can keep
// importing the names it already uses; they default to the `'geocentric'`
// (Earth-focus Kepler) pipeline. The `bodyFromHeliocentric` alias
// collapsed to `bodyGeocentric` in remains available.

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
// Uranus + Neptune added. DE405 / AstroPixels carries
// coverage 2019–2030; the other four pipelines (HelioC / GeoC /
// Ptolemy / VSOP87) don't have the outer-planet elements or
// coefficients yet, so their `bodyGeocentric` falls back to
// `{ ra: NaN, dec: NaN }` for those two names. Consumers that
// render comparison rows should treat NaN as "no data".
// Pluto is absent — Espenak doesn't publish Pluto ephemerides
// on AstroPixels, so there's no DE405 source to bundle here.
export const PLANET_NAMES = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
export const BODY_NAMES   = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

// Pipeline registry — id, namespace, supported-body predicate,
// supported-date predicate. Used by the fallback chain below to
// route around pipelines that can't deliver a given body / date.
const PIPES = {
  astropixels:  { ns: apix,  cb: (n) => apix.coversBody(n),  cd: (d) => apix.coversDate(d) },
  geocentric:   { ns: geo,   cb: (n) => geo.coversBody(n),   cd: (d) => geo.coversDate(d) },
  vsop87:       { ns: vsop,  cb: (n) => vsop.coversBody(n),  cd: (d) => vsop.coversDate(d) },
  heliocentric: { ns: helio, cb: (n) => helio.coversBody(n), cd: (d) => helio.coversDate(d) },
  ptolemy:      { ns: ptol,  cb: (n) => ptol.coversBody(n),  cd: (d) => ptol.coversDate(d) },
};

// Fallback order when the requested source can't deliver a given
// body/date pair. DE405 first (it covers all 9 bodies in 2019–2030),
// then GeoC (the wide-range Earth-focus Kepler with the 7 inner
// bodies), then VSOP87 for analytical inner-planet coverage, then
// Ptolemy as the last historical resort.
const FALLBACK_ORDER = ['astropixels', 'geocentric', 'vsop87', 'ptolemy'];

function _readingValid(r) {
  return r && Number.isFinite(r.ra) && Number.isFinite(r.dec);
}

function _tryPipeline(id, name, date) {
  const p = PIPES[id];
  if (!p) return null;
  if (!p.cb(name) || !p.cd(date)) return null;
  const r = p.ns.bodyGeocentric(name, date);
  return _readingValid(r) ? r : null;
}

// Primary router. Returns `{ ra, dec }` in radians, geocentric-apparent.
// Tries the requested source first; if it can't deliver (body not
// supported or date out of range), walks the fallback chain so the
// caller always gets a usable reading. The exact pipeline that
// produced the value can be retrieved via `bodyRADecRoute(...)`.
export function bodyRADec(name, date, source = 'astropixels') {
  if (name === 'earth') return { ra: 0, dec: 0 };
  const tried = new Set();
  if (source) {
    const r = _tryPipeline(source, name, date);
    if (r) return r;
    tried.add(source);
  }
  for (const id of FALLBACK_ORDER) {
    if (tried.has(id)) continue;
    const r = _tryPipeline(id, name, date);
    if (r) return r;
    tried.add(id);
  }
  // Nothing covered the request — surface NaN so downstream renderers
  // can hide the body cleanly instead of pinning it at the vernal
  // equinox.
  return { ra: NaN, dec: NaN };
}

// Same as `bodyRADec` but also reports which pipeline supplied the
// value, so the UI can light up a fallback indicator when DE405
// dropped to GeoC etc.
export function bodyRADecRoute(name, date, source = 'astropixels') {
  if (name === 'earth') return { reading: { ra: 0, dec: 0 }, used: source };
  const tried = new Set();
  if (source) {
    const r = _tryPipeline(source, name, date);
    if (r) return { reading: r, used: source };
    tried.add(source);
  }
  for (const id of FALLBACK_ORDER) {
    if (tried.has(id)) continue;
    const r = _tryPipeline(id, name, date);
    if (r) return { reading: r, used: id };
    tried.add(id);
  }
  return { reading: { ra: NaN, dec: NaN }, used: null };
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
// Kepler, the behaviour). `bodyFromHeliocentric` is retained as
// an alias for compatibility; use `bodyRADec(name, date,
// 'heliocentric')` explicitly to route through the HelioC pipeline.
export function bodyGeocentric(name, date) { return geo.bodyGeocentric(name, date); }
export const bodyFromHeliocentric = bodyGeocentric;
