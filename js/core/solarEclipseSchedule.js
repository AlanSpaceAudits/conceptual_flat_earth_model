// Sorted schedule of solar-eclipse anchors in this project's
// `DateTime` units (days since TIME_ORIGIN.ZeroDate = 2017-01-01).
// Built once on first access — `initTimeOrigin()` must have run
// before the lazy build, which is true in every code path that
// reaches the eclipse logic.
//
// Source: `js/data/astropixelsEclipses.js` (Espenak / DE405,
// 2021–2040). The 44 solar entries get pre-computed `anchorMs`
// and `anchorDt` so the live-eclipse detector and the
// skip-to-next button don't redo the parse on every frame /
// click.

import { ASTROPIXELS_ECLIPSES } from '../data/astropixelsEclipses.js';
import { TIME_ORIGIN } from './constants.js';

let _schedule = null;

export function solarEclipseSchedule() {
  if (_schedule) return _schedule;
  _schedule = ASTROPIXELS_ECLIPSES.solar
    .map((ev) => {
      const d = new Date(ev.utISO);
      const ms = d.getTime();
      return {
        ...ev,
        anchorMs: ms,
        anchorDt: ms / TIME_ORIGIN.msPerDay - TIME_ORIGIN.ZeroDate,
      };
    })
    .sort((a, b) => a.anchorDt - b.anchorDt);
  return _schedule;
}

// Eclipse closest in time to `dt` (DateTime in days). Returns
// `{ ...event, anchorDt, anchorMs, distDays }` or null when the
// schedule is empty.
export function findNearestSolarEclipse(dt) {
  const sched = solarEclipseSchedule();
  if (sched.length === 0) return null;
  let best = sched[0];
  let bestDist = Math.abs(best.anchorDt - dt);
  for (let i = 1; i < sched.length; i++) {
    const d = Math.abs(sched[i].anchorDt - dt);
    if (d < bestDist) { best = sched[i]; bestDist = d; }
  }
  return { ...best, distDays: bestDist };
}

// First solar eclipse strictly after `dt`. Wraps to the earliest
// when `dt` is past the last entry, so the skip-eclipse button
// never dead-ends at the edge of the catalogue.
export function findNextSolarEclipseAfter(dt) {
  const sched = solarEclipseSchedule();
  if (sched.length === 0) return null;
  const eps = 1e-6;
  for (const ev of sched) {
    if (ev.anchorDt > dt + eps) return ev;
  }
  return sched[0];
}
