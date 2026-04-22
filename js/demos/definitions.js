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
    name: 'Solar eclipse — optical vault',
    intro: (model) => {
      // Search for the next solar eclipse starting 1 day before the model's
      // current DateTime so "replay" of the same demo keeps targeting the
      // same upcoming event rather than jumping past it.
      const curDate = dateTimeToDate(model.state.DateTime - 1);
      const { nextSolar } = findNextEclipses(curDate);
      if (!nextSolar) { _eclipseDT = null; return {}; }
      _eclipseDT = nextSolar.getTime() / TIME_ORIGIN.msPerDay - TIME_ORIGIN.ZeroDate;

      // Subsolar point at eclipse maximum: where the sun sits at the zenith.
      // Stand 45° of arc to the north of it so the sun is due south at
      // ~45° altitude; heading 180° points the observer straight at it.
      const eq = sunEquatorial(nextSolar);
      const gmstDeg = greenwichSiderealDeg(nextSolar);
      const raDeg  = eq.ra  * 180 / Math.PI;
      const decDeg = eq.dec * 180 / Math.PI;
      const subLong = ((raDeg - gmstDeg + 540) % 360) - 180;
      const obsLat  = Math.max(-85, Math.min(85, decDeg + 45));
      return {
        DateTime:          _eclipseDT - 5 / 24,
        ObserverLat:       obsLat,
        ObserverLong:      subLong,
        ObserverHeading:   180,
        InsideVault:       true,
        ShowOpticalVault:  true,
        ShowTruePositions: false,
        ShowFacingVector:  true,
      };
    },
    tasks: () => {
      if (_eclipseDT == null) {
        return [ Ttxt('No solar eclipse found within the search window.') ];
      }
      // -5h → +5h of sim time over 10 wall-clock seconds = 1 h/s. Total
      // partial phases span ≈ 3h around maximum, leaving roughly 5 real
      // seconds of post-eclipse sky before the demo ends.
      return [
        Ttxt('Solar eclipse — sun at ~45° altitude, optical-vault view. Starting 5 h before maximum, playing at 1 h / real-second.'),
        Tval('DateTime', _eclipseDT + 5 / 24, 10000, 0, 'linear'),
        Ttxt('Moon has cleared the sun — eclipse past.', 500),
      ];
    },
  },
];
