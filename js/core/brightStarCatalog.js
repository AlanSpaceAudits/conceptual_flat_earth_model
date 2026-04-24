// Bright Star Catalog — union of every static-position object the sim
// already carries plus the HYG-named stars and the OpenNGC / VizieR
// extras. Each entry tags its source category in `cat` so the
// renderer can paint per-vertex colours that match how that category
// shows in its own layer.
//
// Satellites are intentionally excluded — they have time-varying
// sub-points, not fixed J2000.0 RA/Dec, so they don't fit the static
// schema.

import { CEL_NAV_STARS }      from './celnavStars.js';
import { CATALOGUED_STARS }   from './constellations.js';
import { BLACK_HOLES }        from './blackHoles.js';
import { GALAXIES }           from './galaxies.js';
import { QUASARS }            from './quasars.js';
import { NAMED_STARS_HYG }    from './_namedStarsHyg.js';
import { GALAXIES_EXTRA }     from './galaxiesExtra.js';
import { QUASARS_EXTRA }      from './quasarsExtra.js';

const COLOR_BY_CAT = {
  celnav:     0xffe8a0,
  catalogued: 0xffffff,
  blackhole:  0x9966ff,
  galaxy:     0xff80c0,
  quasar:     0x40e0d0,
  named:      0xfff5d8,
};

function tag(list, cat) {
  return list.map((e) => ({ ...e, cat, color: COLOR_BY_CAT[cat] }));
}

const SOURCES = [
  ...tag(CEL_NAV_STARS,    'celnav'),
  ...tag(CATALOGUED_STARS, 'catalogued'),
  ...tag(BLACK_HOLES,      'blackhole'),
  ...tag(GALAXIES,         'galaxy'),
  ...tag(QUASARS,          'quasar'),
  ...tag(NAMED_STARS_HYG,  'named'),
  ...tag(GALAXIES_EXTRA,   'galaxy'),
  ...tag(QUASARS_EXTRA,    'quasar'),
];

const _seen = new Set();
export const BRIGHT_STAR_CATALOG = SOURCES.filter((e) => {
  if (_seen.has(e.id)) return false;
  _seen.add(e.id);
  return true;
});

const _BSC_BY_ID = new Map(BRIGHT_STAR_CATALOG.map((s) => [s.id, s]));
export function bscStarById(id) { return _BSC_BY_ID.get(id) || null; }
