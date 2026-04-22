// A handful of built-in demos adapted from Walter's originals. All state
// values are in the modular unit-FE frame.

import { Tpse, Ttxt, Tval } from './animation.js';

const T1 = 1000, T2 = 2000, T3 = 3000, T5 = 5000, T8 = 8000;

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
];
