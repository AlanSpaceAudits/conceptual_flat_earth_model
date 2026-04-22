// A handful of built-in demos adapted from Walter's originals. All state
// values are in the modular unit-FE frame.

import { Tpse, Ttxt, Tval } from './animation.js';
import { findNextEclipses, sunEquatorial, greenwichSiderealDeg } from '../core/ephemeris.js';
import { TIME_ORIGIN } from '../core/constants.js';
import { dateTimeToDate } from '../core/time.js';

const T1 = 1000, T2 = 2000, T3 = 3000, T5 = 5000, T8 = 8000;

// Shared between the eclipse demo's intro() and tasks() so the task list
// can target the same eclipse the intro located.
let _eclipseDT = null;

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
    name: 'Solar eclipse — maximum (calibration)',
    intro: (model) => {
      // Snap to the moment of maximum solar eclipse and stand the observer
      // at the subsolar point so the sun sits at the zenith. If the sun
      // and moon markers don't visually overlap on the optical vault at
      // this instant, the offset between them is the ephemeris error —
      // calibrate the moon (or sun) model to close the gap.
      const curDate = dateTimeToDate(model.state.DateTime - 1);
      const { nextSolar } = findNextEclipses(curDate);
      if (!nextSolar) { _eclipseDT = null; return {}; }
      _eclipseDT = nextSolar.getTime() / TIME_ORIGIN.msPerDay - TIME_ORIGIN.ZeroDate;

      const eq = sunEquatorial(nextSolar);
      const gmstDeg = greenwichSiderealDeg(nextSolar);
      const raDeg  = eq.ra  * 180 / Math.PI;
      const decDeg = eq.dec * 180 / Math.PI;
      const subLong = ((raDeg - gmstDeg + 540) % 360) - 180;
      return {
        DateTime:          _eclipseDT,                       // max eclipse
        ObserverLat:       Math.max(-85, Math.min(85, decDeg)),
        ObserverLong:      subLong,
        ObserverHeading:   0,
        CameraHeight:      89.9,                             // look straight up
        InsideVault:       true,
        ShowOpticalVault:  true,
        ShowTruePositions: false,
        ShowFacingVector:  false,
      };
    },
    tasks: () => {
      if (_eclipseDT == null) {
        return [ Ttxt('No solar eclipse found within the search window.') ];
      }
      return [
        Ttxt('Solar eclipse — snapped to maximum. Observer at the subsolar point, looking straight up. Sun and moon should coincide on the optical vault; any visible offset is the ephemeris gap to calibrate.'),
      ];
    },
  },
];
