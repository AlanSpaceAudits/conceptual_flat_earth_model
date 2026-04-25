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

import { Ttxt, Tval, Thold, Tcall } from './animation.js';
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
    name: 'North-pole GP trace — slow → 5.33× ramp',
    group: 'general',
    intro: {
      // Observer parked near the north pole on summer solstice so
      // the sun stays above the horizon for the full 53-day ramp
      // and its optical-vault projection keeps rendering all demo.
      ObserverLat: 82.505, ObserverLong: -62.335,
      InsideVault: false,
      BodySource: 'astropixels',
      DateTime: 3093,                  // 2025-06-21 solstice
      CameraDirection: 0,
      CameraHeight: 89.9,              // straight-down on the disc
      CameraDistance: 20,
      Zoom: 1.5,
      VaultSize: 1, VaultHeight: 0.45,
      // Render everything in the sky for the trace: dome true-
      // positions + optical-vault projections + the GP polyline
      // itself. User can still click ◉ to flip true positions
      // off mid-demo — the animator only advances DateTime, it
      // doesn't re-apply the intro, so toggles stick.
      ShowGPPath: true,
      ShowTruePositions: true,
      ShowOpticalVault: true,
      ShowStars: true,
      ShowSunTrack: false, ShowMoonTrack: false,
      ShowFeGrid: true,
    },
    tasks: (m) => {
      const start = m.state.DateTime;
      // Cubic ease-in over 53.3 days / 30 s. Peak instantaneous
      // rate = 3·53.3/30 ≈ 5.33 days/sec.
      return [
        Ttxt('82°N summer solstice · Heavenly vault looking straight down on the pole · true + optical positions + GP traces for every tracked body · ramps from near-still to 5.33× over 30 s.'),
        Tval('DateTime', start + 53.3, 30 * 1000, T1, 'accel'),
      ];
    },
  },
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
];

// Analemma demos. Observer stationary, Time fixed at 12:00 UTC,
// DateTime stair-steps through 365 days of 2025 with the days365
// easing so each frame holds a single integer day-of-year. The sun
// / moon optical-vault coord at each step is appended to the
// Sun/MoonAnalemmaPoints accumulator (see app.js) and rendered as
// a polyline. After the year completes, a Thold task keeps the
// demo active so the user can study the curve.
const ANALEMMA_START = 2922.5;   // 2025-01-01 12:00 UTC, days since 2017-01-01
const ANALEMMA_DUR   = 30 * 1000;
function makeAnalemma(label, lat, mode) {
  const heading = lat >= 0 ? 180 : 0;
  const camH = lat === 0 ? 75 : Math.abs(lat) === 90 ? 12 : 45;
  const groupId = mode === 'sun'  ? 'sun-analemma'
                : mode === 'moon' ? 'moon-analemma'
                :                   'combo-analemma';
  const targets = [];
  if (mode === 'sun'  || mode === 'both') targets.push('sun');
  if (mode === 'moon' || mode === 'both') targets.push('moon');
  return {
    name: label,
    group: groupId,
    intro: {
      ObserverLat: lat, ObserverLong: 0, ObserverHeading: heading,
      BodySource: 'astropixels',
      DateTime: ANALEMMA_START,
      InsideVault: true,
      OpticalZoom: 1.0,
      VaultSize: 1, VaultHeight: 0.45,
      CameraHeight: camH, CameraDirection: 0,
      TrackerTargets: targets,
      ShowSunAnalemma:  mode === 'sun'  || mode === 'both',
      ShowMoonAnalemma: mode === 'moon' || mode === 'both',
      ShowSunTrack: false, ShowMoonTrack: false,
      ShowShadow: false, ShowTruePositions: true,
      ShowOpticalVault: true, ShowStars: true,
      FollowTarget: null, FreeCamActive: false,
      SpecifiedTrackerMode: false,
    },
    tasks: () => [
      Ttxt(`${label} · Time fixed at 12:00 UTC · 365 daily steps over 30 s.`),
      Tval('DateTime', ANALEMMA_START + 365, ANALEMMA_DUR, T1, 'days365'),
      Ttxt('Year complete · click End Demo to exit, or pause/resume to study the curve.'),
      Thold(),
    ],
  };
}
const ANALEMMA_LATS = [
  [ 90, '90°N (north pole)'],
  [ 45, '45°N'           ],
  [  0, '0° (equator)'   ],
  [-45, '45°S'           ],
  [-90, '90°S (south pole)'],
];

// Monthly daily-arc variant for the 45° sun analemma. Samples on the
// 21st of each month so the four solstice / equinox dates (Mar 21,
// Jun 21, Sep 21, Dec 21) anchor the figure-8 symmetrically — the
// other eight samples land halfway between, giving the classic
// evenly-spaced analemma layout. Astropixels (Fred Espenak's
// tabulated DE405) drives the ephemeris.
const ANALEMMA_MONTH_DAYS = [
  3001, // 2025-03-21 — vernal equinox
  3032, // 2025-04-21
  3062, // 2025-05-21
  3093, // 2025-06-21 — summer solstice
  3123, // 2025-07-21
  3154, // 2025-08-21
  3185, // 2025-09-21 — autumnal equinox
  3215, // 2025-10-21
  3246, // 2025-11-21
  3276, // 2025-12-21 — winter solstice
  3307, // 2026-01-21
  3338, // 2026-02-21
];
const MONTHLY_DAY_DURATION_MS = 3500;

function snapSunNoonVault(model) {
  const c = model.computed;
  const sv = c.SunVaultCoord;
  if (!sv) return;
  const cur = Array.isArray(model.state.SunMonthMarkers)
    ? model.state.SunMonthMarkers : [];
  model.setState({ SunMonthMarkers: [...cur, [sv[0], sv[1], sv[2]]] });
}

function makeSunAnalemmaMonthly(label, lat) {
  const heading = lat >= 0 ? 180 : 0;
  // At the equator the noon sun is near zenith and the analemma
  // straddles the up-vector; at the poles the sun's daily motion is a
  // horizontal circle around the zenith. In both cases the cleanest
  // single-camera view is nearly straight up. Mid-latitudes still
  // read best at a 45° tilt.
  const camH = lat === 0 ? 85
             : Math.abs(lat) === 90 ? 85
             : 45;
  return {
    name: label,
    group: 'sun-analemma',
    intro: {
      ObserverLat: lat, ObserverLong: 0, ObserverHeading: heading,
      BodySource: 'astropixels',
      DateTime: ANALEMMA_MONTH_DAYS[0],
      InsideVault: true,
      OpticalZoom: 1.0,
      VaultSize: 1, VaultHeight: 0.45,
      CameraHeight: camH, CameraDirection: 0,
      TrackerTargets: ['sun'],
      ShowSunAnalemma: false, ShowMoonAnalemma: false,
      ShowSunTrack: false, ShowMoonTrack: false,
      ShowShadow: false, ShowTruePositions: true,
      ShowOpticalVault: true, ShowStars: true,
      FollowTarget: null, FreeCamActive: false, FreeCameraMode: false,
      SpecifiedTrackerMode: false,
      ShowGPTracer: false, GPTracerTargets: [],
      SunVaultArcOn: true,
      SunMonthMarkers: [],
      SunMonthMarkersWorldSpace: true,
    },
    tasks: () => {
      const t = [
        Ttxt(`${label} · 12 monthly daily arcs on the heavenly vault · 21st of each month from 2025-03-21 (vernal equinox) · noon-position circle on each.`),
        // Re-assert observer placement and reset both the vault-arc
        // accumulator and the noon-marker list off→on so a re-run is
        // clean and prior state can't leak through.
        Tcall((m) => m.setState({
          ObserverLat: lat, ObserverLong: 0, ObserverHeading: heading,
          CameraHeight: camH, CameraDirection: 0, InsideVault: true,
        })),
        Tcall((m) => m.setState({ SunVaultArcOn: false })),
        Tcall((m) => m.setState({ SunVaultArcOn: true, SunMonthMarkers: [] })),
      ];
      for (const dayStart of ANALEMMA_MONTH_DAYS) {
        t.push(Tval('DateTime', dayStart, 1, 0, 'linear'));
        t.push(Tval('DateTime', dayStart + 0.5, MONTHLY_DAY_DURATION_MS / 2, 0, 'linear'));
        t.push(Tcall(snapSunNoonVault));
        t.push(Tval('DateTime', dayStart + 1.0, MONTHLY_DAY_DURATION_MS / 2, 0, 'linear'));
      }
      t.push(Ttxt('12 daily arcs traced · 12 noon snapshots placed on the heavenly vault. Pause/resume or End Demo.'));
      t.push(Thold());
      return t;
    },
  };
}

const ANALEMMA_DEMOS = [
  ...ANALEMMA_LATS.map(([lat, t]) => makeSunAnalemmaMonthly(`Sun analemma · ${t}`, lat)),
  ...ANALEMMA_LATS.map(([lat, t]) => makeAnalemma(`Moon analemma · ${t}`,       lat, 'moon')),
  ...ANALEMMA_LATS.map(([lat, t]) => makeAnalemma(`Sun + Moon analemma · ${t}`, lat, 'both')),
];

// 24-hour sun demos grouped under their own sub-menu. Order matches
// the UI section: two 24h overhead-sun demos first, then the two
// season-spanning midnight-sun demos.
const SUN_24H_DEMOS = [
  {
    name: "24h sun at 82°30'N (Alert, Nunavut)",
    group: '24h-sun',
    intro: {
      ObserverLat: 82.505, ObserverLong: -62.335,
      BodySource: 'astropixels',
      DateTime: 3093,                        // 2025-06-21 00:00 UTC
      InsideVault: true,                     // Optical (first-person)
      FollowTarget: 'sun',                   // camera auto-aims at sun
      TrackerTargets: ['sun'],               // hide everything except sun
      OpticalZoom: 1.0,
      VaultSize: 1, VaultHeight: 0.45,
      ObserverHeading: 180,
      ShowSunTrack: true,
      ShowShadow: true, ShowTruePositions: true,
    },
    tasks: () => [
      Ttxt('82°30′N · Alert, Nunavut · 2025-06-21 solstice · Optical view locked on the sun — two weeks of continuous midnight-sun without setting.'),
      Tval('DateTime', 3107, 40 * 1000, T1, 'linear'),
    ],
  },
  {
    name: "24h sun at 79°46'S 83°15'W (West Antarctica)",
    group: '24h-sun',
    intro: {
      ObserverLat: -79.76806, ObserverLong: -83.26167,
      BodySource: 'astropixels',
      DateTime: 2911,                        // 2024-12-21 solstice
      InsideVault: true,                     // Optical (first-person)
      FollowTarget: 'sun',                   // camera auto-aims at sun
      TrackerTargets: ['sun'],               // hide everything except sun
      OpticalZoom: 1.0,
      VaultSize: 1, VaultHeight: 0.45,
      ObserverHeading: 0,
      ShowSunTrack: true,
      ShowShadow: true, ShowTruePositions: true,
    },
    tasks: () => [
      Ttxt('79°46′S 83°15′W · West Antarctica · 2024-12-21 solstice · Optical view locked on the sun — two weeks of continuous midnight-sun. Elevation dips to ~13° at each "midnight" pass but never sets.'),
      Tval('DateTime', 2925, 40 * 1000, T1, 'linear'),
    ],
  },
  {
    name: 'Midnight sun at 75°N: start to end',
    group: '24h-sun',
    intro: {
      ObserverLat: 75, ObserverLong: 0,
      BodySource: 'astropixels',
      DateTime: 3021,                 // ~2025-04-10
      ObserverHeading: 0,
      InsideVault: true,              // Optical
      FollowTarget: 'sun',
      TrackerTargets: ['sun'],
      OpticalZoom: 1.0,
      VaultSize: 1, VaultHeight: 0.45,
      ShowSunTrack: true,
      ShowShadow: true,
      ShowTruePositions: true,
    },
    tasks: () => [
      Ttxt('75°N, early April 2025 — sun still rises and sets daily.'),
      Tval('DateTime', 3042, 2 * T8, T1, 'linear'),
      Ttxt('May 1 — sun about to stop setting at midnight.'),
      Tval('DateTime', 3093, 2 * T8, T1, 'linear'),
      Ttxt('June 21 — solstice, sun at its highest arc of the year.'),
      Tval('DateTime', 3140, 2 * T8, T1, 'linear'),
      Ttxt('August 7 — midnight sun ends as declination drops back below 15°.'),
      Tval('DateTime', 3179, 2 * T8, T1, 'linear'),
      Ttxt('September 15 — normal day/night cycle back in full swing.'),
    ],
  },
  {
    name: 'Midnight sun at 75°S: start to end',
    group: '24h-sun',
    intro: {
      ObserverLat: -75, ObserverLong: 0,
      BodySource: 'astropixels',
      DateTime: 3195,                 // ~2025-10-01
      ObserverHeading: 180,
      InsideVault: true,              // Optical
      FollowTarget: 'sun',
      TrackerTargets: ['sun'],
      OpticalZoom: 1.0,
      VaultSize: 1, VaultHeight: 0.45,
      ShowSunTrack: true,
      ShowShadow: true,
      ShowTruePositions: true,
    },
    tasks: () => [
      Ttxt('75°S, October 1 2025 — day/night cycle still present.'),
      Tval('DateTime', 3226, 2 * T8, T1, 'linear'),
      Ttxt('November 1 — sun about to stop setting at midnight.'),
      Tval('DateTime', 3276, 2 * T8, T1, 'linear'),
      Ttxt('December 21 — southern solstice, full 24-hour daylight.'),
      Tval('DateTime', 3324, 2 * T8, T1, 'linear'),
      Ttxt('February 7 2026 — midnight sun ends as dec moves north again.'),
      Tval('DateTime', 3355, 2 * T8, T1, 'linear'),
      Ttxt('March 10 — polar night incoming.'),
    ],
  },
];

// The final exported list, in section order: general → solar eclipses
// → lunar eclipses → FE prediction track. Each entry carries a
// `group` field so the UI can render section headings.
export const DEMOS = [
  ...SUN_24H_DEMOS,
  ...GENERAL_DEMOS,
  ...ANALEMMA_DEMOS,
  ...SOLAR_ECLIPSE_DEMOS,
  ...LUNAR_ECLIPSE_DEMOS,
  ...FE_ECLIPSE_PREDICTION_DEMOS,
];

// Section metadata for the UI.
export const DEMO_GROUPS = [
  { id: '24h-sun',         label: '24 h Sun' },
  { id: 'general',         label: 'General' },
  { id: 'sun-analemma',    label: 'Sun Analemma' },
  { id: 'moon-analemma',   label: 'Moon Analemma' },
  { id: 'combo-analemma',  label: 'Sun + Moon Analemma' },
  { id: 'solar-eclipses',  label: 'Solar Eclipses (AstroPixels / DE405, 2021-2040)' },
  { id: 'lunar-eclipses',  label: 'Lunar Eclipses (AstroPixels / DE405, 2021-2040)' },
  { id: 'fe-predictions',  label: 'FE Eclipse Predictions (placeholder)' },
];
