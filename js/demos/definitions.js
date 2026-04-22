// A handful of built-in demos adapted from Walter's originals. All state
// values are in the modular unit-FE frame.

import { Tpse, Ttxt, Tval } from './animation.js';
import { findNextEclipses, sunEquatorial, moonEquatorial, greenwichSiderealDeg } from '../core/ephemeris.js';
import { TIME_ORIGIN } from '../core/constants.js';
import { dateTimeToDate } from '../core/time.js';

const T1 = 1000, T2 = 2000, T3 = 3000, T5 = 5000, T8 = 8000;

// Shared between the eclipse demo's intro() and tasks() so the task list
// can target the same eclipse the intro located.
let _eclipseDT = null;

// Refine a known eclipse time by scanning ±2 h around it in 1-minute steps
// and picking the instant when this model's sun-moon angular separation is
// minimised. Lets us land exactly on the moment of closest approach the
// *model* can deliver, even when the model's lunar theory is off by a few
// tenths of a degree from the true ephemeris.
function refineEclipseMinSeparation(approxDate) {
  const stepMs = 60 * 1000;             // 1 minute
  const range  = 2 * 60;                // ±2 hours in minutes
  let bestT = approxDate.getTime();
  let bestSep = Infinity;
  for (let k = -range; k <= range; k++) {
    const t = approxDate.getTime() + k * stepMs;
    const d = new Date(t);
    const sun  = sunEquatorial(d);
    const moon = moonEquatorial(d);
    const dot = Math.cos(sun.dec) * Math.cos(moon.dec) *
                  Math.cos(sun.ra - moon.ra)
              + Math.sin(sun.dec) * Math.sin(moon.dec);
    const sep = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (sep < bestSep) { bestSep = sep; bestT = t; }
  }
  return new Date(bestT);
}

// Build the intro / tasks pair for an eclipse demo given a fixed Date for
// the eclipse maximum. Observer is planted at the subsolar point at that
// moment, camera points straight up, and the animation sweeps ±1 h
// (5 real seconds on each side of maximum).
function buildEclipseDemo(fixedDate) {
  return {
    intro: () => {
      if (!fixedDate) { _eclipseDT = null; return {}; }
      const refined = refineEclipseMinSeparation(fixedDate);
      _eclipseDT = refined.getTime() / TIME_ORIGIN.msPerDay - TIME_ORIGIN.ZeroDate;
      const eq = sunEquatorial(refined);
      const gmstDeg = greenwichSiderealDeg(refined);
      const raDeg  = eq.ra  * 180 / Math.PI;
      const decDeg = eq.dec * 180 / Math.PI;
      const subLong = ((raDeg - gmstDeg + 540) % 360) - 180;
      return {
        DateTime:          _eclipseDT - 1 / 24,
        ObserverLat:       Math.max(-85, Math.min(85, decDeg)),
        ObserverLong:      subLong,
        ObserverHeading:   0,
        CameraHeight:      89.9,
        InsideVault:       true,
        ShowOpticalVault:  true,
        ShowTruePositions: false,
        ShowFacingVector:  false,
      };
    },
    tasks: () => {
      if (_eclipseDT == null) {
        return [ Ttxt('Eclipse date not configured for this demo.') ];
      }
      return [
        Ttxt('Solar eclipse — starting 1 h before maximum. Observer at the subsolar point looking straight up.'),
        Tval('DateTime', _eclipseDT, 5000, 0, 'linear'),
        Ttxt('Maximum eclipse — sun and moon should coincide here. Any visible offset is the ephemeris gap to calibrate.'),
        Tval('DateTime', _eclipseDT + 1 / 24, 5000, 0, 'linear'),
        Ttxt('Moon past the sun — eclipse over.'),
      ];
    },
  };
}

export const DEMOS = [
  {
    name: 'Equinox at the equator',
    intro: {
      ObserverLat: 0, ObserverLong: 15, DayOfYear: 82, Time: 12,
      CameraDirection: 30, CameraHeight: 25, Zoom: 1.4,
      VaultSize: 1, VaultHeight: 0.45,
    },
    tasks: () => [
      Ttxt('Spring equinox at the equator. Watch the sun rise in the east.'),
      Tval('Time', 6, T3, T1),
      Ttxt('Noon — sun at zenith.', 500),
      Tval('Time', 12, T3, T1),
      Tval('Time', 18, T3, T1),
      Ttxt('Sunset in the west.', 500),
      Tval('Time', 24, T3, T1),
    ],
  },
  {
    name: 'Summer solstice, northern observer',
    intro: {
      ObserverLat: 45, ObserverLong: 0, DayOfYear: 172, Time: 12,
      CameraDirection: 30, CameraHeight: 25, Zoom: 1.4,
    },
    tasks: () => [
      Ttxt('45°N on summer solstice. Sun stays high, long daylight.'),
      Tval('Time', 0, T5, 0, 'linear'),
      Tval('Time', 24, 2 * T5, 0, 'linear'),
    ],
  },
  {
    name: 'Winter solstice, northern observer',
    intro: {
      ObserverLat: 45, ObserverLong: 0, DayOfYear: 355, Time: 12,
    },
    tasks: () => [
      Ttxt('45°N on winter solstice. Low arc, short daylight.'),
      Tval('Time', 0, T5, 0, 'linear'),
      Tval('Time', 24, 2 * T5, 0, 'linear'),
    ],
  },
  {
    name: 'Moon phases over one month',
    intro: {
      ObserverLat: 0, ObserverLong: 15, DayOfYear: 82, Time: 21,
      ShowMoonTrack: true, ShowSunTrack: true,
    },
    tasks: () => [
      Ttxt('Watch the moon phase cycle over ~27 days.'),
      Tval('DateTime', 82 + 27, T8, 0, 'linear'),
    ],
  },
  {
    name: 'Observer travels north-south',
    intro: {
      ObserverLat: 0, ObserverLong: 15, DayOfYear: 82, Time: 12,
    },
    tasks: () => [
      Ttxt('Moving the observer from equator to poles.'),
      Tval('ObserverLat', 85, T3, T1),
      Tval('ObserverLat', -85, 2 * T3, T1),
      Tval('ObserverLat', 0, T3, T1),
    ],
  },
  {
    name: 'Day over 24 hours at high latitude',
    intro: {
      ObserverLat: 78, ObserverLong: 15, DayOfYear: 172, Time: 0,
    },
    tasks: () => [
      Ttxt('78°N on summer solstice — 24-hour daylight.'),
      Tval('Time', 24, 2 * T8, 0, 'linear'),
    ],
  },
  {
    name: 'Solar Eclipse (Partial)',
    intro: () => {
      // Find the next solar conjunction from the current real-world time
      // (not the model DateTime) so running the Total demo first doesn't
      // leave the Partial search stuck near April 2024.
      const { nextSolar } = findNextEclipses(new Date());
      return buildEclipseDemo(nextSolar).intro();
    },
    tasks: () => buildEclipseDemo(null).tasks(),
  },
  {
    name: 'Solar Eclipse (Total) — 2024-04-08',
    intro: () => buildEclipseDemo(
      new Date(Date.UTC(2024, 3, 8, 18, 17, 0)),   // April = month 3
    ).intro(),
    tasks: () => buildEclipseDemo(null).tasks(),
  },
];
