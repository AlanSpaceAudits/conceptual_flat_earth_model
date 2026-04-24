// Demo definitions. The sim's values are in the modular unit-FE frame.
//
// eclipse demo system overhauled:
//   • all 44 solar + 67 lunar astropixels-tabulated eclipses (2021-2040)
//     are generated from a data-driven registry (eclipseRegistry.js).
//     Each demo plays out in whichever ephemeris pipeline is active.
//   • FE eclipse-prediction track added as a structured placeholder
//     (feEclipseTrack.js) pending Shane's resource pack.
//   • The two eclipse tracks are cleanly separated from the original
//     general demos by the `group` field on each entry. The control
//     panel can render them as grouped sections.

import { Ttxt, Tval } from './animation.js';
import { SOLAR_ECLIPSE_DEMOS, LUNAR_ECLIPSE_DEMOS } from './eclipseRegistry.js';
import { FE_ECLIPSE_PREDICTION_DEMOS } from './feEclipseTrack.js';

const T1 = 1000, T3 = 3000, T5 = 5000, T8 = 8000;

// general / non-eclipse demos. Retains the original 6 demos;
// eclipse entries are now driven by eclipseRegistry.js and appended
// below. The old hand-coded Solar Eclipse (Partial) / Total 2024
// entries are superseded by the full 111-event registry but their
// behaviour is preserved in the registry's 2024-04-08 demo entry.
const GENERAL_DEMOS = [
  {
    name: 'Equinox at the equator',
    group: 'general',
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
    group: 'general',
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
    group: 'general',
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
    group: 'general',
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
    group: 'general',
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
    group: 'general',
    intro: {
      ObserverLat: 78, ObserverLong: 15, DayOfYear: 172, Time: 0,
    },
    tasks: () => [
      Ttxt('78°N on summer solstice — 24-hour daylight.'),
      Tval('Time', 24, 2 * T8, 0, 'linear'),
    ],
  },
  {
    name: 'Midnight sun at 75°N: start to end',
    group: 'general',
    intro: {
      ObserverLat: 75, ObserverLong: 0,
      BodySource: 'astropixels',
      DateTime: 3021,                 // ~2025-04-10
      ObserverHeading: 0,             // face geographic north
      CameraDirection: 0, CameraHeight: 30, CameraDistance: 10, Zoom: 1.4,
      VaultSize: 1, VaultHeight: 0.45,
      InsideVault: false,
      ShowSunTrack: true,
      ShowShadow: true,
      ShowTruePositions: true,
    },
    tasks: () => [
      Ttxt('75°N, early April 2025 — sun still rises and sets daily.'),
      Tval('DateTime', 3042, T5, T1, 'linear'),
      Ttxt('May 1 — sun about to stop setting at midnight.'),
      Tval('DateTime', 3093, T5, T1, 'linear'),
      Ttxt('June 21 — solstice, sun at its highest arc of the year.'),
      Tval('DateTime', 3140, T5, T1, 'linear'),
      Ttxt('August 7 — midnight sun ends as declination drops back below 15°.'),
      Tval('DateTime', 3179, T5, T1, 'linear'),
      Ttxt('September 15 — normal day/night cycle back in full swing.'),
    ],
  },
  {
    name: 'Midnight sun at 75°S: start to end',
    group: 'general',
    intro: {
      ObserverLat: -75, ObserverLong: 0,
      BodySource: 'astropixels',
      DateTime: 3195,                 // ~2025-10-01
      ObserverHeading: 180,           // face geographic south
      CameraDirection: 180, CameraHeight: 30, CameraDistance: 10, Zoom: 1.4,
      VaultSize: 1, VaultHeight: 0.45,
      InsideVault: false,
      ShowSunTrack: true,
      ShowShadow: true,
      ShowTruePositions: true,
    },
    tasks: () => [
      Ttxt('75°S, October 1 2025 — day/night cycle still present.'),
      Tval('DateTime', 3226, T5, T1, 'linear'),
      Ttxt('November 1 — sun about to stop setting at midnight.'),
      Tval('DateTime', 3276, T5, T1, 'linear'),
      Ttxt('December 21 — southern solstice, full 24-hour daylight.'),
      Tval('DateTime', 3324, T5, T1, 'linear'),
      Ttxt('February 7 2026 — midnight sun ends as dec moves north again.'),
      Tval('DateTime', 3355, T5, T1, 'linear'),
      Ttxt('March 10 — polar night incoming.'),
    ],
  },
];

// The final exported list, in section order: general → solar eclipses
// → lunar eclipses → FE prediction track. Each entry carries a
// `group` field so the UI can render section headings.
export const DEMOS = [
  ...GENERAL_DEMOS,
  ...SOLAR_ECLIPSE_DEMOS,
  ...LUNAR_ECLIPSE_DEMOS,
  ...FE_ECLIPSE_PREDICTION_DEMOS,
];

// Section metadata for the UI.
export const DEMO_GROUPS = [
  { id: 'general',         label: 'General' },
  { id: 'solar-eclipses',  label: 'Solar Eclipses (AstroPixels / DE405, 2021-2040)' },
  { id: 'lunar-eclipses',  label: 'Lunar Eclipses (AstroPixels / DE405, 2021-2040)' },
  { id: 'fe-predictions',  label: 'FE Eclipse Predictions (placeholder)' },
];
