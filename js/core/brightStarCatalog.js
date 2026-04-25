// Bright Star Catalog — union of every static-position object the sim
// already carries plus the HYG-named stars, the OpenNGC / VizieR
// extras, the second-tier 500-each batches, and the solar-system
// body roster (sun, moon, eight planets, Pluto). Each entry tags
// its source category in `cat` so the renderer can paint per-vertex
// colours that match how that category shows in its own layer.
//
// Satellites (static + extras) are listed here too so the BSC
// search and grid include them, but the satellite layer remains the
// dynamic renderer.

import { CEL_NAV_STARS }      from './celnavStars.js';
import { CATALOGUED_STARS }   from './constellations.js';
import { BLACK_HOLES }        from './blackHoles.js';
import { GALAXIES }           from './galaxies.js';
import { QUASARS }            from './quasars.js';
import { SATELLITES }         from './satellites.js';
import { NAMED_STARS_HYG }    from './_namedStarsHyg.js';
import { NAMED_STARS_HYG_EXTRA } from './_namedStarsHygExtra.js';
import { GALAXIES_EXTRA }     from './galaxiesExtra.js';
import { GALAXIES_EXTRA2 }    from './galaxiesExtra2.js';
import { QUASARS_EXTRA }      from './quasarsExtra.js';
import { QUASARS_EXTRA2 }     from './quasarsExtra2.js';
import { SATELLITES_EXTRA }   from './satellitesExtra.js';
import { SOLAR_SYSTEM_BSC }   from './solarSystem.js';

const COLOR_BY_CAT = {
  celnav:     0xffe8a0,
  catalogued: 0xffffff,
  blackhole:  0x9966ff,
  galaxy:     0xff80c0,
  quasar:     0x40e0d0,
  named:      0xfff5d8,
  satellite:  0x66ff88,
  planet:     0xffa060,
};

function tag(list, cat, nativeRendered = false) {
  return list.map((e) => ({
    ...e,
    cat,
    color: e.color != null ? e.color : COLOR_BY_CAT[cat],
    // entries flagged nativeRendered are skipped by the BSC layer's
    // own render pass — their dot is already painted by the cel-nav /
    // catalogued / black-hole / galaxy / quasar / satellite / planet
    // layer that owns them. Without this, ShowBsc paints them a
    // second time and the FPS halves once both layers are on.
    nativeRendered: nativeRendered || e.kind === 'planet',
  }));
}

const SOURCES = [
  ...tag(CEL_NAV_STARS,           'celnav',     true),
  ...tag(CATALOGUED_STARS,        'catalogued', true),
  ...tag(BLACK_HOLES,             'blackhole',  true),
  ...tag(GALAXIES,                'galaxy',     true),
  ...tag(QUASARS,                 'quasar',     true),
  ...tag(SATELLITES,              'satellite',  true),
  ...tag(NAMED_STARS_HYG,         'named'),
  ...tag(NAMED_STARS_HYG_EXTRA,   'named'),
  ...tag(GALAXIES_EXTRA,          'galaxy'),
  ...tag(GALAXIES_EXTRA2,         'galaxy'),
  ...tag(QUASARS_EXTRA,           'quasar'),
  ...tag(QUASARS_EXTRA2,          'quasar'),
  ...tag(SATELLITES_EXTRA,        'satellite'),
  ...tag(SOLAR_SYSTEM_BSC,        'planet'),
];

const _seen = new Set();
export const BRIGHT_STAR_CATALOG = SOURCES.filter((e) => {
  if (_seen.has(e.id)) return false;
  _seen.add(e.id);
  return true;
});

const _BSC_BY_ID = new Map(BRIGHT_STAR_CATALOG.map((s) => [s.id, s]));
export function bscStarById(id) { return _BSC_BY_ID.get(id) || null; }
