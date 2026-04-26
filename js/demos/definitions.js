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
import { ASTROPIXELS_ECLIPSES } from '../data/astropixelsEclipses.js';
import { TIME_ORIGIN } from '../core/constants.js';

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

function snapNoonVault(model, mode) {
  const c = model.computed;
  const patch = {};
  if (mode === 'sun' || mode === 'both') {
    const sv = c.SunVaultCoord;
    if (sv) {
      const cur = Array.isArray(model.state.SunMonthMarkers)
        ? model.state.SunMonthMarkers : [];
      patch.SunMonthMarkers = [...cur, [sv[0], sv[1], sv[2]]];
    }
  }
  if (mode === 'moon' || mode === 'both') {
    const mv = c.MoonVaultCoord;
    if (mv) {
      const cur = Array.isArray(model.state.MoonMonthMarkers)
        ? model.state.MoonMonthMarkers : [];
      patch.MoonMonthMarkers = [...cur, [mv[0], mv[1], mv[2]]];
    }
  }
  if (Object.keys(patch).length) model.setState(patch);
}

function makeAnalemmaMonthly(label, lat, mode) {
  const heading = lat >= 0 ? 180 : 0;
  // At the equator the noon sun is near zenith and the analemma
  // straddles the up-vector; at the poles the sun's daily motion is a
  // horizontal circle around the zenith. In both cases the cleanest
  // single-camera view is nearly straight up. Mid-latitudes still
  // read best at a 45° tilt.
  const camH = lat === 0 ? 85
             : Math.abs(lat) === 90 ? 85
             : 45;
  const groupId = mode === 'sun'  ? 'sun-analemma'
                : mode === 'moon' ? 'moon-analemma'
                :                   'combo-analemma';
  const targets = [];
  if (mode === 'sun'  || mode === 'both') targets.push('sun');
  if (mode === 'moon' || mode === 'both') targets.push('moon');
  const sunOn  = mode === 'sun'  || mode === 'both';
  const moonOn = mode === 'moon' || mode === 'both';
  const bodyLabel = mode === 'moon' ? 'moon' : (mode === 'both' ? 'sun + moon' : 'sun');
  return {
    name: label,
    group: groupId,
    intro: {
      ObserverLat: lat, ObserverLong: 0, ObserverHeading: heading,
      BodySource: 'astropixels',
      DateTime: ANALEMMA_MONTH_DAYS[0],
      InsideVault: true,
      OpticalZoom: 1.0,
      VaultSize: 1, VaultHeight: 0.45,
      CameraHeight: camH, CameraDirection: 0,
      TrackerTargets: targets,
      ShowSunAnalemma: false, ShowMoonAnalemma: false,
      ShowSunTrack: false, ShowMoonTrack: false,
      ShowShadow: false, ShowTruePositions: true,
      ShowOpticalVault: true, ShowStars: true,
      FollowTarget: null, FreeCamActive: false, FreeCameraMode: false,
      SpecifiedTrackerMode: false,
      ShowGPTracer: false, GPTracerTargets: [],
      SunVaultArcOn: sunOn,
      MoonVaultArcOn: moonOn,
      SunMonthMarkers: [],
      MoonMonthMarkers: [],
      SunMonthMarkersWorldSpace: true,
      MoonMonthMarkersWorldSpace: true,
    },
    tasks: () => {
      const t = [
        Ttxt(`${label} · 12 monthly daily arcs on the heavenly vault (${bodyLabel}) · 21st of each month from 2025-03-21 (vernal equinox) · noon-position circle on each.`),
        // Re-assert observer placement and reset arc / marker state
        // off→on so a re-run is clean and prior demo state can't leak
        // through.
        Tcall((m) => m.setState({
          ObserverLat: lat, ObserverLong: 0, ObserverHeading: heading,
          CameraHeight: camH, CameraDirection: 0, InsideVault: true,
        })),
        Tcall((m) => m.setState({ SunVaultArcOn: false, MoonVaultArcOn: false })),
        Tcall((m) => m.setState({
          SunVaultArcOn: sunOn,
          MoonVaultArcOn: moonOn,
          SunMonthMarkers: [],
          MoonMonthMarkers: [],
        })),
      ];
      for (const dayStart of ANALEMMA_MONTH_DAYS) {
        t.push(Tval('DateTime', dayStart, 1, 0, 'linear'));
        t.push(Tval('DateTime', dayStart + 0.5, MONTHLY_DAY_DURATION_MS / 2, 0, 'linear'));
        t.push(Tcall((m) => snapNoonVault(m, mode)));
        t.push(Tval('DateTime', dayStart + 1.0, MONTHLY_DAY_DURATION_MS / 2, 0, 'linear'));
      }
      t.push(Ttxt('12 daily arcs traced · 12 noon snapshots placed on the heavenly vault. Pause/resume or End Demo.'));
      t.push(Thold());
      return t;
    },
  };
}

const ANALEMMA_DEMOS = [
  ...ANALEMMA_LATS.map(([lat, t]) => makeAnalemmaMonthly(`Sun analemma · ${t}`,        lat, 'sun')),
  ...ANALEMMA_LATS.map(([lat, t]) => makeAnalemmaMonthly(`Moon analemma · ${t}`,       lat, 'moon')),
  ...ANALEMMA_LATS.map(([lat, t]) => makeAnalemmaMonthly(`Sun + Moon analemma · ${t}`, lat, 'both')),
];

// One synodic month (~29.5 days) is the moon's natural cycle from new
// moon to new moon. Sampling daily at the same UTC instant over 28
// days produces a clean lunar path on the heavenly vault — daily arcs
// stitched into one continuous trace, with 28 noon-position notches
// stepping along it. Use astropixels for ephemeris consistency with
// the sun analemma variant.
const SYNODIC_DAYS = 28;
const SYNODIC_DAY_DURATION_MS = 1500;

function snapMoonNoonVault(model) {
  const c = model.computed;
  const mv = c.MoonVaultCoord;
  if (!mv) return;
  const cur = Array.isArray(model.state.MoonMonthMarkers)
    ? model.state.MoonMonthMarkers : [];
  model.setState({ MoonMonthMarkers: [...cur, [mv[0], mv[1], mv[2]]] });
}

function makeMoonSynodic(label, lat) {
  const heading = lat >= 0 ? 180 : 0;
  const camH = lat === 0 ? 85
             : Math.abs(lat) === 90 ? 85
             : 45;
  const startDay = ANALEMMA_MONTH_DAYS[0];
  return {
    name: label,
    group: 'moon-synodic',
    intro: {
      ObserverLat: lat, ObserverLong: 0, ObserverHeading: heading,
      BodySource: 'astropixels',
      DateTime: startDay,
      InsideVault: true,
      OpticalZoom: 1.0,
      VaultSize: 1, VaultHeight: 0.45,
      CameraHeight: camH, CameraDirection: 0,
      TrackerTargets: ['moon'],
      ShowSunAnalemma: false, ShowMoonAnalemma: false,
      ShowSunTrack: false, ShowMoonTrack: false,
      ShowShadow: false, ShowTruePositions: true,
      ShowOpticalVault: true, ShowStars: true,
      FollowTarget: null, FreeCamActive: false, FreeCameraMode: false,
      SpecifiedTrackerMode: false,
      ShowGPTracer: false, GPTracerTargets: [],
      SunVaultArcOn: false,
      MoonVaultArcOn: true,
      SunMonthMarkers: [],
      MoonMonthMarkers: [],
      MoonMonthMarkersWorldSpace: true,
    },
    tasks: () => {
      const t = [
        Ttxt(`${label} · 28 daily noon-UTC snapshots over one synodic month from 2025-03-21.`),
        Tcall((m) => m.setState({
          ObserverLat: lat, ObserverLong: 0, ObserverHeading: heading,
          CameraHeight: camH, CameraDirection: 0, InsideVault: true,
        })),
        Tcall((m) => m.setState({ MoonVaultArcOn: false })),
        Tcall((m) => m.setState({ MoonVaultArcOn: true, MoonMonthMarkers: [] })),
      ];
      for (let i = 0; i < SYNODIC_DAYS; i++) {
        const dayStart = startDay + i;
        t.push(Tval('DateTime', dayStart, 1, 0, 'linear'));
        t.push(Tval('DateTime', dayStart + 0.5, SYNODIC_DAY_DURATION_MS / 2, 0, 'linear'));
        t.push(Tcall(snapMoonNoonVault));
        t.push(Tval('DateTime', dayStart + 1.0, SYNODIC_DAY_DURATION_MS / 2, 0, 'linear'));
      }
      t.push(Ttxt('28 daily snapshots traced over one synodic month. Pause/resume or End Demo.'));
      t.push(Thold());
      return t;
    },
  };
}

const MOON_SYNODIC_DEMOS = ANALEMMA_LATS.map(([lat, t]) =>
  makeMoonSynodic(`Moon path · ${t} (synodic)`, lat),
);

// Paired-side sun analemma: capture the same heavenly-vault sun
// position twice each month — once at UTC 12:00 (the sun's GP is over
// lon 0, this observer's noon) and once at UTC 00:00 (sun's GP is
// over lon 180, the antipodal observer's noon). Two figure-8s form
// on opposite sides of the disc; each closed loop only connects its
// own dots.
function snapSunNoonVaultLon0(model) {
  const c = model.computed;
  const sv = c.SunVaultCoord;
  if (!sv) return;
  const cur = Array.isArray(model.state.SunMonthMarkers)
    ? model.state.SunMonthMarkers : [];
  model.setState({ SunMonthMarkers: [...cur, [sv[0], sv[1], sv[2]]] });
}

function snapSunNoonVaultLon180(model) {
  const c = model.computed;
  const sv = c.SunVaultCoord;
  if (!sv) return;
  const cur = Array.isArray(model.state.SunMonthMarkersOpp)
    ? model.state.SunMonthMarkersOpp : [];
  model.setState({ SunMonthMarkersOpp: [...cur, [sv[0], sv[1], sv[2]]] });
}

function makeSunAnalemmaPaired(label, lat) {
  const heading = lat >= 0 ? 180 : 0;
  const camH = lat === 0 ? 85
             : Math.abs(lat) === 90 ? 85
             : 45;
  return {
    name: label,
    group: 'sun-paired',
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
      MoonVaultArcOn: false,
      SunMonthMarkers: [],
      SunMonthMarkersOpp: [],
      MoonMonthMarkers: [],
      SunMonthMarkersWorldSpace: true,
      SunMonthMarkersOppWorldSpace: true,
    },
    tasks: () => {
      const t = [
        Ttxt(`${label} · 21st of each month from 2025-03-21 · noon snapshots at lon 0 (UTC 12:00, gold) and at lon 180 (UTC 00:00, magenta).`),
        Tcall((m) => m.setState({
          ObserverLat: lat, ObserverLong: 0, ObserverHeading: heading,
          CameraHeight: camH, CameraDirection: 0, InsideVault: true,
        })),
        Tcall((m) => m.setState({ SunVaultArcOn: false })),
        Tcall((m) => m.setState({
          SunVaultArcOn: true,
          SunMonthMarkers: [],
          SunMonthMarkersOpp: [],
        })),
      ];
      for (const dayStart of ANALEMMA_MONTH_DAYS) {
        // Snap the lon 180 observer's noon first (UT 00:00 = sun over
        // lon 180), then sweep forward to UT 12:00 and snap the lon 0
        // observer's noon, then sweep through the rest of the day so
        // the heavenly-vault arc traces a complete daily circle.
        t.push(Tval('DateTime', dayStart, 1, 0, 'linear'));
        t.push(Tcall(snapSunNoonVaultLon180));
        t.push(Tval('DateTime', dayStart + 0.5, MONTHLY_DAY_DURATION_MS / 2, 0, 'linear'));
        t.push(Tcall(snapSunNoonVaultLon0));
        t.push(Tval('DateTime', dayStart + 1.0, MONTHLY_DAY_DURATION_MS / 2, 0, 'linear'));
      }
      t.push(Ttxt('Two figure-8s placed on opposite sides of the disc — gold at lon 0, magenta at lon 180. Each closed loop connects only its own dots.'));
      t.push(Thold());
      return t;
    },
  };
}

const SUN_PAIRED_DEMOS = ANALEMMA_LATS.map(([lat, t]) =>
  makeSunAnalemmaPaired(`Sun analemma paired · ${t} (lon 0 + lon 180)`, lat),
);

// Eclipse-position map: at every event in the AstroPixels / DE405
// eclipse registry (2021-2040), set DateTime to that event's UT,
// snap the heavenly-vault sun coord (solar event) or moon coord
// (lunar event) into the eclipse-map state arrays. Renders as
// disc-anchored dots — no closed loop, since these are independent
// events. The entire scan is one synchronous Tcall.
function _utisoToDateTime(utISO) {
  return (new Date(utISO).getTime() / TIME_ORIGIN.msPerDay) - TIME_ORIGIN.ZeroDate;
}

function plotAllEclipses(model) {
  const solarPts = [];
  const lunarPts = [];
  const origDateTime = model.state.DateTime;
  for (const ev of ASTROPIXELS_ECLIPSES.solar) {
    const dt = _utisoToDateTime(ev.utISO);
    if (!isFinite(dt)) continue;
    model.setState({ DateTime: dt }, false);
    const sv = model.computed.SunVaultCoord;
    if (sv) solarPts.push([sv[0], sv[1], sv[2]]);
  }
  for (const ev of ASTROPIXELS_ECLIPSES.lunar) {
    const dt = _utisoToDateTime(ev.utISO);
    if (!isFinite(dt)) continue;
    model.setState({ DateTime: dt }, false);
    const mv = model.computed.MoonVaultCoord;
    if (mv) lunarPts.push([mv[0], mv[1], mv[2]]);
  }
  model.setState({
    DateTime: origDateTime,
    EclipseMapSolar: solarPts,
    EclipseMapLunar: lunarPts,
  });
}

const ECLIPSE_MAP_DEMO = {
  name: 'Eclipse position map · 2021-2040 (AstroPixels / DE405)',
  group: 'eclipse-map',
  intro: {
    ObserverLat: 0, ObserverLong: 0, ObserverHeading: 0,
    BodySource: 'astropixels',
    DateTime: 2922,                      // 2025-01-01 00:00 UTC
    InsideVault: false,                  // orbital view
    Zoom: 1.6,
    CameraDirection: 0, CameraHeight: 60,
    VaultSize: 1, VaultHeight: 0.45,
    TrackerTargets: ['sun', 'moon'],
    ShowSunAnalemma: false, ShowMoonAnalemma: false,
    ShowSunTrack: false, ShowMoonTrack: false,
    ShowShadow: false, ShowTruePositions: true,
    ShowOpticalVault: false, ShowStars: true,
    FollowTarget: null, FreeCamActive: false, FreeCameraMode: false,
    SpecifiedTrackerMode: false,
    SunVaultArcOn: false, MoonVaultArcOn: false,
    SunMonthMarkers: [], MoonMonthMarkers: [], SunMonthMarkersOpp: [],
    EclipseMapSolar: [], EclipseMapLunar: [],
  },
  tasks: () => [
    Ttxt('Plotting all eclipse positions in the AstroPixels / DE405 registry (44 solar + 67 lunar across 2021-2040)…'),
    Tcall(plotAllEclipses),
    Ttxt('Done · 44 solar (gold) + 67 lunar (pale blue) heavenly-vault positions across 20 years. Saros bands cluster the dots into the familiar nodal pattern.'),
    Thold(),
  ],
};

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

// Annual-cycle demo. Runs from the observer's current lat / long
// and traces the GP of the single tracked body over a full year.
// Refuses to load when zero or multiple bodies are in the tracker —
// the path's only useful when there's a single subject. The intro
// returns `null` to signal that refusal; `_playSingle` bails on a
// falsy intro and the message in `Description` surfaces in the
// description footer.
const ANNUAL_CYCLE_DEMO = {
  name: 'Annual Cycle (single tracker, observer lat/long)',
  group: 'annual-cycle',
  intro: (model) => {
    const s = model.state;
    const targets = Array.isArray(s.TrackerTargets) ? s.TrackerTargets : [];
    const set = new Set(targets);
    if (s.FollowTarget) set.add(s.FollowTarget);
    if (set.size !== 1) {
      model.setState({
        Description: `Annual Cycle demo expects exactly one tracked body. Currently tracking ${set.size}. Clear the tracker and add a single body, then try again.`,
      });
      return null;
    }
    // Preserve observer's lat/long, BodySource, world model, etc.
    // Just enable the year-long GP trace and the true-position
    // markers so the observer can watch the body wander its band.
    return {
      ShowGPPath: true,
      GPPathDays: 365,
      ShowTruePositions: true,
      ShowOpticalVault: true,
      ShowStars: true,
    };
  },
  tasks: (m) => {
    const start = m.state.DateTime;
    return [
      Ttxt('Annual cycle · observer at current lat/long · GP traces one year. Watch the band drift.'),
      Tval('DateTime', start + 365, 30 * 1000, T1, 'linear'),
      Ttxt('Year complete.'),
      Thold(),
    ];
  },
};

// The final exported list, in section order: general → solar eclipses
// → lunar eclipses → FE prediction track. Each entry carries a
// `group` field so the UI can render section headings.
export const DEMOS = [
  ...SUN_24H_DEMOS,
  ...GENERAL_DEMOS,
  ANNUAL_CYCLE_DEMO,
  ...ANALEMMA_DEMOS,
  ...MOON_SYNODIC_DEMOS,
  ...SUN_PAIRED_DEMOS,
  ECLIPSE_MAP_DEMO,
  ...SOLAR_ECLIPSE_DEMOS,
  ...LUNAR_ECLIPSE_DEMOS,
  ...FE_ECLIPSE_PREDICTION_DEMOS,
];

// Section metadata for the UI.
export const DEMO_GROUPS = [
  { id: '24h-sun',         label: '24 h Sun' },
  { id: 'general',         label: 'General' },
  { id: 'annual-cycle',    label: 'Annual Cycle' },
  { id: 'sun-analemma',    label: 'Sun Analemma' },
  { id: 'moon-analemma',   label: 'Moon Analemma' },
  { id: 'combo-analemma',  label: 'Sun + Moon Analemma' },
  { id: 'moon-synodic',    label: 'Moon Path (Synodic)' },
  { id: 'sun-paired',      label: 'Sun Analemma Paired (lon 0 + lon 180)' },
  { id: 'eclipse-map',     label: 'Eclipse Position Map' },
  { id: 'solar-eclipses',  label: 'Solar Eclipses (AstroPixels / DE405, 2021-2040)' },
  { id: 'lunar-eclipses',  label: 'Lunar Eclipses (AstroPixels / DE405, 2021-2040)' },
  { id: 'fe-predictions',  label: 'FE Eclipse Predictions (placeholder)' },
];
