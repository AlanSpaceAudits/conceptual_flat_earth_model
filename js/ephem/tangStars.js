// ============================================================================
// TANG STARS  —  the fixed stars, in the Tang du / xiu angle system
// ============================================================================
//
// The stars are handled here exactly as the rest of the simulator handles them.
// Their catalogued J2000 positions are carried to the date with the combined
// precession + nutation + aberration correction. The project groups those three
// under the single label "trepidation"; they are the slow sky motions Chinese
// astronomers themselves tracked (the creep of the solstitial and equinoctial
// points along the equator above all). Nothing new is introduced for the stars.
//
// The only thing this module adds is the last step that the planets and Moon
// already get through the Tang frame: it expresses each star's apparent
// position in du and the 28 xiu (入宿度 ru xiu du, 去極度 qu ji du), the way a
// Tang observer would have written it down rather than in modern degrees.
//
// One point worth stating plainly, and it holds for everything the ephemeris
// reports (planets, Sun, Moon, and stars alike): the Tang angle and the modern
// angle differ by nothing more than a conversion factor. One du is 360/365.25
// of a degree, a single constant. The du value is not a different angle or an
// approximation of one; it is the same direction on the sky written against a
// 365.25-part circle instead of a 360-part one. So a position recorded in du is
// internally consistent within the Tang system in exactly the way a degree is
// internally consistent within the modern system. Neither is the truer number.
// The angle is measured and used entirely within whichever system you read it
// in, and the two only ever meet through that one conversion factor.
//
// Source list: the 58-star Nautical Almanac catalogue (js/core/celnavStars.js),
// the canonical bright-star set the tracker uses. Corrections: Meeus precession
// (Ch.21), nutation (22.A), aberration (23.2), via apparentStarPosition.

import { CEL_NAV_STARS } from '../core/celnavStars.js';
import { apparentStarPosition } from './common.js';
import { raDecRadToTang } from '../tang/frame.js';

const HOURS_TO_RAD = Math.PI / 12;
const DEG_TO_RAD = Math.PI / 180;

export const STARS = CEL_NAV_STARS;
const _byId = new Map(STARS.map((s) => [s.id, s]));

// Default trepidation = the full combined precession + nutation + aberration,
// the same lump the star tracker applies (StarTrepidation on).
const FULL_TREPIDATION = { precession: true, nutation: true, aberration: true };

// Apparent geocentric position of one star at `date`, in the Tang frame.
// Returns { ra, dec, tang } where ra/dec are apparent-of-date radians and tang
// is the canonical du/xiu record (xiu, rxdDu, qjdDu). `opts` chooses which
// trepidation components to apply; default is the full combined correction.
export function starTang(star, date, opts = FULL_TREPIDATION) {
  const raJ2000  = star.raH * HOURS_TO_RAD;     // catalogue J2000, hours -> rad
  const decJ2000 = star.decD * DEG_TO_RAD;
  const { ra, dec } = apparentStarPosition(raJ2000, decJ2000, date, opts);
  return { ra, dec, tang: raDecRadToTang(ra, dec) };
}

export function starTangById(id, date, opts) {
  const s = _byId.get(id);
  return s ? starTang(s, date, opts) : null;
}

// Every catalogued star with its Tang position at `date`.
export function allStarsTang(date, opts) {
  return STARS.map((s) => ({ id: s.id, name: s.name, mag: s.mag, ...starTang(s, date, opts) }));
}
