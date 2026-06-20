// Eclipse anchor schedule in this project's `DateTime` units (days since
// TIME_ORIGIN.ZeroDate = 2017-01-01).
//
// Source: `js/data/shaneEclipses.js` — the Dimbleby-pattern eclipse catalogue
// (35,387 eclipses, 3996 BC – AD 3648, solar + lunar). Dates/types/magnitudes/
// gammas are Meeus Ch.54 (proleptic-Gregorian, TT). Each catalogue row is
// anchored to the sim clock through its cycle_jd_tt (Julian Day, TT); the
// skip-to-next buttons, the next-eclipse readouts, and the live-shadow detector
// all read these schedules.
//
// The catalogue column is ordered by ascending JD, so each per-luminary
// schedule is ascending in `anchorDt` and the lookups use binary search —
// `findNearestSolarEclipse` runs on the per-frame compute path, so an O(log n)
// search over ~17.5k entries matters.

import { SHANE_ECLIPSES } from '../data/shaneEclipses.js';
import { TIME_ORIGIN } from './constants.js';

// Julian Day at the Unix epoch (1970-01-01T00:00:00Z). JD math is pure
// arithmetic, so it stays correct for BC years where `Date` cannot.
const JD_UNIX_EPOCH = 2440587.5;

// Greatest eclipse is given in TT; ΔT (≤ ~70 s near the present, larger in the
// deep past) is well inside the live-eclipse hunt window and the jump lead-in,
// and the live shadow path takes its own timing from the Besselian elements, so
// anchoring on TT directly is sufficient for placing the clock.
function jdToAnchor(jd) {
  const anchorMs = (jd - JD_UNIX_EPOCH) * 86400000;
  return { anchorMs, anchorDt: anchorMs / TIME_ORIGIN.msPerDay - TIME_ORIGIN.ZeroDate };
}

let _solar = null;
let _lunar = null;

function buildSchedule(lumCode) {
  const E = SHANE_ECLIPSES;
  const out = [];
  for (let i = 0; i < E.jd.length; i++) {
    if (E.lum[i] !== lumCode) continue;
    const { anchorMs, anchorDt } = jdToAnchor(E.jd[i]);
    out.push({
      date: E.date[i],
      type: E.type[i],
      magnitude: E.mag[i],
      gamma: E.gamma[i],
      saros: E.saros[i],
      luminary: lumCode === 0 ? 'Solar' : 'Lunar',
      confidence: E.confLabels[E.conf[i]],
      anchorMs,
      anchorDt,
    });
  }
  return out;   // ascending in anchorDt (catalogue is JD-sorted)
}

export function solarEclipseSchedule() { return _solar || (_solar = buildSchedule(0)); }
export function lunarEclipseSchedule() { return _lunar || (_lunar = buildSchedule(1)); }

// Index of the first entry with anchorDt > dt (binary search). Returns
// sched.length when dt is past the last entry.
function upperBound(sched, dt) {
  let lo = 0, hi = sched.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sched[mid].anchorDt > dt) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

// Eclipse closest in time to `dt`. Returns `{ ...event, distDays }` or null.
function nearest(sched, dt) {
  if (sched.length === 0) return null;
  const i = upperBound(sched, dt);
  let best = null, bestDist = Infinity;
  for (const j of [i - 1, i]) {
    if (j < 0 || j >= sched.length) continue;
    const d = Math.abs(sched[j].anchorDt - dt);
    if (d < bestDist) { best = sched[j]; bestDist = d; }
  }
  return best ? { ...best, distDays: bestDist } : null;
}

// First eclipse strictly after `dt`. Wraps to the earliest when `dt` is past
// the last entry, so the skip buttons never dead-end at the catalogue edge.
function nextAfter(sched, dt) {
  if (sched.length === 0) return null;
  const eps = 1e-6;
  const i = upperBound(sched, dt + eps);
  return i < sched.length ? sched[i] : sched[0];
}

export function findNearestSolarEclipse(dt) { return nearest(solarEclipseSchedule(), dt); }
export function findNearestLunarEclipse(dt) { return nearest(lunarEclipseSchedule(), dt); }
export function findNextSolarEclipseAfter(dt) { return nextAfter(solarEclipseSchedule(), dt); }
export function findNextLunarEclipseAfter(dt) { return nextAfter(lunarEclipseSchedule(), dt); }

// The next eclipse of either luminary after `dt` — whichever (solar or lunar)
// comes first in the cycle. Drives the single skip-to-next-eclipse button.
export function findNextEclipseAfter(dt) {
  const s = findNextSolarEclipseAfter(dt);
  const l = findNextLunarEclipseAfter(dt);
  if (!s) return l;
  if (!l) return s;
  return s.anchorDt <= l.anchorDt ? s : l;
}
