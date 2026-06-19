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
import * as ptol  from '../ephem/ptolemy.js';
import * as apix  from './ephemerisAstropixels.js';
import * as vsop  from './ephemerisVsop87.js';

// Tang canonical frame + modular ephemeris registry.
//
// Every body position the simulator renders is funnelled through the
// Tang (Chinese du/xiu) canonical store: the position is held in du/xiu and the
// modern RA/Dec consumers receive is produced FROM it. The two systems are a
// single scaling factor apart (Tang/modern), so they convert exactly both ways
// and give identical results; neither is observably primary, and here the
// du/xiu record is the canonical one. New sources plug into the registry with
// no change to consumers of this dispatcher.
import { bodyTang } from '../tang/sphere.js';
import { raDecRadToTang } from '../tang/frame.js';

// sin(horizontal parallax) = R⊕/d for a body (dimensionless ratio, no distance).
// Used by the observer-view topocentric correction; the shared Tang sphere
// itself stays geocentric.
export { bodyParallaxSine } from '../ephem/registry.js';

export {
  sunEquatorial as meeusSunEquatorial,
  moonEquatorial as meeusMoonEquatorial,
  greenwichSiderealDeg,
  equatorialToCelestCoord,
  findNextEclipses,
  julianDay,
  meanObliquityDeg,
  norm360,
} from '../ephem/common.js';

// The pipeline namespaces, exported so modules that want to compute
// several readings simultaneously can do so without reimporting the
// individual files.
export { helio, geo, ptol, apix, vsop };

// Only the Ptolemy ("ptolz") source is wired into the active registry for
// now. The other pipeline files remain on disk as dormant modular
// providers; register them in `js/ephem/registry.js` to bring them back
// into the source list.
export const EPHEMERIS_SOURCES = ['tangMaster', 'tangPtolz', 'astropixels', 'geocentric', 'vsop87', 'heliocentric', 'ptolemy'];
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

// Primary router. Returns `{ ra, dec }` in radians, geocentric-apparent,
// reconstructed from the canonical Tang (du/xiu) record.
//
// All sources now funnel through the Tang frame on the active registry
// ephemeris (ptolz). The `source` argument is retained for call-site
// compatibility but the registry owns source selection; with only the
// Ptolemy provider wired, every request resolves there. `_tryPipeline`
// and the legacy fallback chain stay defined below for the dormant
// pipeline files but are not on the active path.
export function bodyRADec(name, date, source) {
  if (name === 'earth') return { ra: 0, dec: 0 };
  // Tang registry sources run through the canonical du frame.
  if (source === undefined || source === 'tangMaster' || source === 'tangPtolz') {
    const src = (source === 'tangMaster' || source === 'tangPtolz') ? source : undefined;
    const { ra, dec } = bodyTang(name, date, src);
    return { ra, dec };
  }
  // Legacy comparison pipelines (DE405 / GeoC / VSOP87 / HelioC / Almagest),
  // selectable in the Tracker for live ephemeris comparison. If the chosen
  // pipeline can't deliver this body/date, fall through the chain and then the
  // Tang frame so the rendered sky never goes blank.
  const direct = _tryPipeline(source, name, date);
  if (direct) return direct;
  for (const id of FALLBACK_ORDER) {
    const r = _tryPipeline(id, name, date);
    if (r) return r;
  }
  const { ra, dec } = bodyTang(name, date);
  return { ra, dec };
}

// As `bodyRADec`, plus the canonical Tang record (xiu / ru-xiu-du /
// qu-ji-du) so HUD readouts can show the Chinese coordinate directly.
export function bodyRADecTang(name, date) {
  if (name === 'earth') {
    return { ra: 0, dec: 0, tang: raDecRadToTang(0, 0) };
  }
  return bodyTang(name, date);
}

// Same shape as the old multi-pipeline router; `used` is always the
// active registry source now (ptolz).
export function bodyRADecRoute(name, date, _source) {
  if (name === 'earth') return { reading: { ra: 0, dec: 0 }, used: 'ptolemy' };
  const { ra, dec } = bodyTang(name, date);
  return { reading: { ra, dec }, used: 'ptolemy' };
}

// Planet / Sun / Moon routers — all funnel through the Tang canonical
// frame on the active registry source (ptolz). The `source` argument is
// kept for compatibility but no longer selects a pipeline.
export function planetEquatorial(name, date, _source) {
  const { ra, dec } = bodyTang(name, date);
  return { ra, dec };
}
export function sunEquatorial(date, _source) {
  const { ra, dec } = bodyTang('sun', date);
  return { ra, dec };
}
export function moonEquatorial(date, _source) {
  const { ra, dec } = bodyTang('moon', date);
  return { ra, dec };
}

// Legacy exports — downstream imports that pre-date the router.
// `bodyGeocentric` defaults to the 'geocentric' pipeline (Earth-focus
// Kepler, the behaviour). `bodyFromHeliocentric` is retained as
// an alias for compatibility; use `bodyRADec(name, date,
// 'heliocentric')` explicitly to route through the HelioC pipeline.
export function bodyGeocentric(name, date) {
  const { ra, dec } = bodyTang(name, date);
  return { ra, dec };
}
export const bodyFromHeliocentric = bodyGeocentric;
