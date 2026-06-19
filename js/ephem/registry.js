// Modular ephemeris registry.
//
// The simulator is ephemeris-agnostic: any provider that can answer
// "give me geocentric RA/Dec for this body at this instant" can be
// registered here and selected as the active source. For now only the
// Ptolemy (Almagest deferent + epicycle) pipeline — "ptolz" — is wired
// in, to get the model running on a single source. Adding VSOP87, DE405,
// Schlyter, etc. later is one `register()` call each; the rest of the
// app never changes because every body position is funnelled through the
// Tang canonical frame downstream of this module.
//
// Provider interface:
//   {
//     id:    string,
//     label: string,
//     bodyRADec(name, dateUTC) -> { ra, dec }   // radians, geocentric apparent
//     covers(name) -> bool,
//     coversDate(dateUTC) -> bool,
//   }

import * as ptolemy from './ptolemy.js';
import * as ptolemyCorrected from './ptolemyCorrected.js';
import * as masterTang from './masterTang.js';
import { bodyParallaxSine as masterParallaxSine } from './masterTang.js';

const _providers = new Map();
let _activeId = null;

export function register(provider) {
  if (!provider || !provider.id) throw new Error('ephemeris provider needs an id');
  _providers.set(provider.id, provider);
  if (_activeId === null) _activeId = provider.id;
  return provider.id;
}

export function setActiveSource(id) {
  if (!_providers.has(id)) throw new Error(`unknown ephemeris source: ${id}`);
  _activeId = id;
}

export function activeSource() { return _activeId; }
export function availableSources() { return [..._providers.keys()]; }
export function sourceLabel(id) { return _providers.get(id)?.label ?? id; }

function _readingValid(r) {
  return r && Number.isFinite(r.ra) && Number.isFinite(r.dec);
}

// Geocentric RA/Dec (radians) for a body at a date from the chosen source
// (defaults to the active one). Earth is the observer's frame origin.
// Returns { ra: NaN, dec: NaN } when the source can't deliver.
export function bodyRADec(name, dateUTC, source = _activeId) {
  if (name === 'earth') return { ra: 0, dec: 0 };
  const p = _providers.get(source);
  if (!p || !p.covers(name) || !p.coversDate(dateUTC)) return { ra: NaN, dec: NaN };
  const r = p.bodyRADec(name, dateUTC);
  return _readingValid(r) ? r : { ra: NaN, dec: NaN };
}

// sin(horizontal parallax) = R⊕/d for a body — a dimensionless ratio, the only
// "distance" the topocentric correction needs. Sourced from the master's
// distance-ratio geometry regardless of which angle-source is active (a
// provider may override via its own `parallaxSine`). Stars/unsupported: 0.
export function bodyParallaxSine(name, dateUTC, source = _activeId) {
  const p = _providers.get(source);
  if (p && typeof p.parallaxSine === 'function') return p.parallaxSine(name, dateUTC);
  return masterParallaxSine(name, dateUTC);
}

// --- Tang Ptolz: epicycle-corrected Ptolemy -------------------------------
//
// The ORIGINAL Almagest (ptolemy.js) is selectable separately as the 'ptolemy'
// comparison source. THIS provider is the Tang epicycle-corrected version: the
// same deferent+epicycle model with a fitted series of CORRECTION EPICYCLES
// added (ptolemyCorrected.js), pulling the Almagest's ~degrees of error down to
// arcminutes — the demonstration that epicycles reproduce the modern ephemeris.
const ptolzProvider = {
  id: 'tangPtolz',
  label: 'Tang Ptolz (geocentric epicycles → modern, ~arcsec)',
  bodyRADec: (name, date) => ptolemyCorrected.bodyGeocentric(name, date),
  covers: (name) => ptolemyCorrected.coversBody(name),
  coversDate: (date) => ptolemyCorrected.coversDate(date),
  supported: ptolemyCorrected.SUPPORTED_BODIES,
};

register(ptolzProvider);

// Master Tang provider: geocentric, fully epicyclic, apparent-of-date, modern
// accuracy (~arcsecond) for Sun, Moon, and all seven planets. This is the
// primary source; Ptolemy stays registered for historical comparison.
const masterProvider = {
  id: 'tangMaster',
  label: 'Tang Master (full sky, geocentric, modern)',
  bodyRADec: (name, date) => masterTang.bodyGeocentric(name, date),
  parallaxSine: (name, date) => masterTang.bodyParallaxSine(name, date),
  covers: (name) => masterTang.coversBody(name),
  coversDate: (date) => masterTang.coversDate(date),
  supported: masterTang.SUPPORTED_BODIES,
};
register(masterProvider);
setActiveSource('tangMaster');

// Bodies the active source can render. The model uses this to prune the
// tracker / per-frame compute to what the current ephemeris supports.
export function supportedBodies(source = _activeId) {
  const p = _providers.get(source);
  return p && p.supported ? new Set([...p.supported]) : new Set();
}
