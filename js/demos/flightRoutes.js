// Flight-routes demo set. One entry per route plus a combined-all
// demo, a central-angle demo, and a constant-speed / equal-arc-length
// demo. Each entry sweeps `FlightRoutesProgress` 0 → 1 over a fixed
// window so the great-circle line draws out across the disc / sphere.

import { Ttxt, Tval, Tcall, Thold } from './animation.js';
import {
  FLIGHT_ROUTES, FLIGHT_CITIES, cityById, centralAngleDeg,
  formatHMS, formatHMSDelta, formatDmsPerHour,
} from '../data/flightRoutes.js';
import { FLIGHT_TRACKS } from '../data/flightTracks.js';

// Convert linear mph to central-angle deg/h. The KML carries air
// speed in mph; this project displays everything in pure angle-and-
// time units, so per-waypoint speeds are normalised by the mean
// Earth great-circle (1° ≈ 111.195 km ≈ 69.0936 mi). The constant is
// derived once and reused for every flight stat.
const MI_PER_DEG = 69.0936;
const mphToDegPerHour = (mph) => (mph == null || !isFinite(mph)) ? null : mph / MI_PER_DEG;

const T1  = 1000;
const T8  = 8000;
const T12 = 12000;

// Wall-time-tuned tween durations. The demos run with
// `speedScale: 1` (overriding the default 0.125 slow-celestial
// cadence), so authored ms ≈ wall ms.
const SWEEP_PER_ROUTE = 4500;
const SWEEP_COMBINED  = 6000;
const FLIGHT_SPEED_SCALE = 1.0;

// Top-down camera at the AE pole (lat 90°, lon 0°). Heavenly view
// (InsideVault: false) so the orbit camera centres on the disc /
// globe, not an observer's eye height.
const TOP_DOWN_CAMERA = {
  CameraDirection: 0,
  CameraHeight:    89.9,
  CameraDistance:  20,
  Zoom:            3.5,
  ObserverLat:     90,
  ObserverLong:    0,
  InsideVault:     false,
  FreeCameraMode:  false,
  FollowTarget:    null,
};

// Hide every sky / observer overlay — the demo is a pure
// map-projection geometry view. TrackerTargets cleared so the
// per-tracker GP markers (sun / moon / planets / every catalogued
// star) don't paint dots and dashed lines on top of the route map.
const SKY_HIDDEN = {
  ShowStars:               false,
  ShowConstellationLines:  false,
  ShowPlanets:             false,
  ShowOpticalVault:        false,
  ShowTruePositions:       false,
  ShowSunTrack:            false,
  ShowMoonTrack:           false,
  ShowSunArc:              false,
  ShowMoonArc:             false,
  ShowGPPath:              false,
  ShowAxisLine:            false,
  ShowVaultRays:           false,
  ShowOpticalVaultRays:    false,
  ShowProjectionRays:      false,
  ShowManyRays:            false,
  TrackerTargets:          [],
  FollowTarget:            null,
  ShowBlackHoles:          false,
  ShowQuasars:             false,
  ShowGalaxies:            false,
  ShowSatellites:          false,
};

// FE grid on; sun/moon GP drops off so the demo isn't visually
// crowded with celestial ground points the user has already
// hidden via SKY_HIDDEN. FE map and GE map both default to the
// line-art / outline-only styles so the orange flight artwork and
// cyan central-angle legs read clean against a black backdrop.
const ROUTE_OVERLAYS = {
  ShowFeGrid:        true,
  ShowGroundPoints:  false,
  ShowFlightRoutes:  true,
  FlightRoutesProgress: 0,
  WorldModel:        'fe',
  MapProjection:     'ae_lineart',
  MapProjectionGe:   'ge_art_line',
};

const baseIntro = (extra) => Object.assign({}, SKY_HIDDEN, ROUTE_OVERLAYS, TOP_DOWN_CAMERA, extra || {});

function sweepRoute(routeId) {
  return [
    Tcall((m) => m.setState({
      ShowFlightRoutes: true,
      FlightRoutesSelected: routeId,
      FlightRoutesProgress: 0,
    })),
    Tval('FlightRoutesProgress', 1, SWEEP_PER_ROUTE, 0, 'linear'),
    Ttxt('Route connected — toggle FE / GE freely; press Stop when done.'),
    Thold(),
  ];
}

function schematicInfoBox(route) {
  const a = cityById(route.from), b = cityById(route.to);
  const angle = centralAngleDeg(a.lat, a.lon, b.lat, b.lon);
  const aCoord = `(${a.lat.toFixed(2)}°, ${a.lon.toFixed(2)}°)`;
  const bCoord = `(${b.lat.toFixed(2)}°, ${b.lon.toFixed(2)}°)`;
  return {
    title: route.label,
    lines: [
      '~Takeoff             : (no flight data)',
      `Depart              : ${a.name}  ${aCoord}`,
      `Destination         : ${b.name}  ${bCoord}`,
      `Central Angle       : ${angle.toFixed(2)}°`,
      '~Arrival (predicted) : (no flight data)',
      '~Arrival (measured)  : (no flight data)',
      '~Air Time            : (no flight data)',
      '~Air Speed (avg)     : (no flight data)',
      '~Ground Speed (calc) : (no flight data)',
    ],
  };
}

const PER_ROUTE_DEMOS = FLIGHT_ROUTES.map((r) => {
  const a = cityById(r.from), b = cityById(r.to);
  const angle = centralAngleDeg(a.lat, a.lon, b.lat, b.lon);
  return {
    name: `Route — ${r.label}`,
    group: 'flight-routes',
    speedScale: FLIGHT_SPEED_SCALE,
    intro: baseIntro({
      FlightRoutesSelected: r.id,
      FlightRoutesProgress: 0,
      FlightInfoBox: schematicInfoBox(r),
    }),
    tasks: () => [
      Ttxt(`${r.label} · central angle ${angle.toFixed(2)}°.`),
      ...sweepRoute(r.id),
    ],
  };
});

// QF27/28 actual-flight tracks. The KMZ has lat / lon / altitude /
// air speed / ground speed / heading / wind speed / wind direction
// per waypoint. Pair each track to the existing schematic 'scl-syd'
// route so the great-circle visual stays the same; the info box is
// driven from the bundled flight data so the user sees actual vs
// predicted flight time and the average ground speed (= great-circle
// distance ÷ actual flight seconds).
function qfFlightDemo(track) {
  const startWp = track.waypoints[0];
  const endWp   = track.waypoints[track.waypoints.length - 1];
  const angle = centralAngleDeg(startWp.lat, startWp.lon, endWp.lat, endWp.lon);
  const actualSec = track.actualSec;
  const predictedSec = track.predictedSec;
  const deltaSec = (actualSec != null && predictedSec != null) ? actualSec - predictedSec : null;
  // Ground speed in central-angle deg/hour: full great-circle
  // angle divided by elapsed flight hours. Pure angle / time, no
  // linear distance ever computed.
  const gsDegPerH = (actualSec && actualSec > 0)
    ? (angle / (actualSec / 3600))
    : null;
  // Air speed in deg/h: per-waypoint samples are in mph; convert
  // each one through the mean Earth great-circle, then average so
  // the displayed value is a true central-angle rate.
  let aspSum = 0, aspN = 0;
  for (const w of track.waypoints) {
    const dPerH = mphToDegPerHour(w.asp);
    if (dPerH != null) { aspSum += dPerH; aspN += 1; }
  }
  const aspAvgDegPerH = aspN > 0 ? (aspSum / aspN) : null;
  // QF27 = SYD→SCL, QF28 = SCL→SYD. Same great circle either way.
  const isQf27 = track.flight === 'QF27';
  const depart = isQf27 ? 'Sydney' : 'Santiago';
  const dest   = isQf27 ? 'Santiago' : 'Sydney';
  const dir = `${depart} → ${dest}`;
  return {
    name: `Actual flight — ${track.label}`,
    group: 'flight-routes',
    speedScale: FLIGHT_SPEED_SCALE,
    intro: baseIntro({
      FlightRoutesSelected: 'scl-syd',
      FlightRoutesProgress: 0,
      FlightInfoBox: {
        title: `${track.flight} · ${track.date} · ${dir}`,
        lines: [
          'Takeoff             : N/A',
          `Depart              : ${depart}  (${startWp.lat.toFixed(2)}°, ${startWp.lon.toFixed(2)}°)`,
          `Destination         : ${dest}  (${endWp.lat.toFixed(2)}°, ${endWp.lon.toFixed(2)}°)`,
          `Central Angle       : ${angle.toFixed(2)}°`,
          `Arrival (predicted) : ${formatHMS(predictedSec)}`,
          `Arrival (measured)  : ${formatHMS(actualSec)}`,
          `Air Time            : ${formatHMS(actualSec)}`,
          `Air Speed (avg)     : ${formatDmsPerHour(aspAvgDegPerH)}`,
          `Ground Speed (calc) : ${formatDmsPerHour(gsDegPerH)}`,
        ],
      },
    }),
    tasks: () => [
      Ttxt(`${track.label}: ${dir} · ${angle.toFixed(2)}° central angle, predicted ${formatHMS(predictedSec)} (${formatHMSDelta(deltaSec)}).`),
      ...sweepRoute('scl-syd'),
    ],
  };
}

const QF_FLIGHT_DEMOS = FLIGHT_TRACKS.map(qfFlightDemo);

function combinedInfoBox() {
  const lines = ['Routes (central angle):'];
  for (const r of FLIGHT_ROUTES) {
    const a = cityById(r.from), b = cityById(r.to);
    const angle = centralAngleDeg(a.lat, a.lon, b.lat, b.lon);
    lines.push(`  ${r.label}  ${angle.toFixed(2)}°`);
  }
  lines.push('~Air / ground speed: (no flight data)');
  return { title: 'All routes — Southern Non-Stop', lines };
}

const ALL_ROUTES_DEMO = {
  name: 'All routes — combined map',
  group: 'flight-routes',
  speedScale: FLIGHT_SPEED_SCALE,
  intro: baseIntro({
    FlightRoutesSelected: 'all',
    FlightRoutesProgress: 0,
    FlightInfoBox: combinedInfoBox(),
  }),
  tasks: () => [
    Ttxt('All seven Southern Non-Stop legs sweeping out together.'),
    Tcall((m) => m.setState({
      ShowFlightRoutes: true,
      FlightRoutesSelected: 'all',
      FlightRoutesProgress: 0,
    })),
    Tval('FlightRoutesProgress', 1, SWEEP_COMBINED, 0, 'linear'),
    Ttxt('Combined map ready — toggle FE / GE freely; press Stop when done.'),
    Thold(),
  ],
};

// Central-angle parity: pair the four longest southern legs with a
// hypothetical mirror-flipped northern equivalent so the user can see
// the central angle (great-circle distance / Earth radius) is the
// same on either hemisphere — only the AE projection makes the
// southern pair look longer.
function mirroredAngle(latA, lonA, latB, lonB) {
  return centralAngleDeg(-latA, lonA, -latB, lonB);
}
function centralAngleInfoBox() {
  const lines = ['South leg vs lat-mirrored north leg:'];
  for (const r of FLIGHT_ROUTES) {
    const a = cityById(r.from), b = cityById(r.to);
    const south = centralAngleDeg(a.lat, a.lon, b.lat, b.lon);
    const north = centralAngleDeg(-a.lat, a.lon, -b.lat, b.lon);
    lines.push(`  ${r.label}  S=${south.toFixed(2)}° = N=${north.toFixed(2)}°`);
  }
  lines.push('~Air / ground speed: (no flight data)');
  return { title: 'Central-angle parity', lines };
}

const CENTRAL_ANGLE_DEMO = {
  name: 'Central-angle theorem — north vs south arc length',
  group: 'flight-routes',
  speedScale: FLIGHT_SPEED_SCALE,
  intro: baseIntro({
    FlightRoutesSelected: 'all',
    FlightRoutesProgress: 0,
    FlightInfoBox: centralAngleInfoBox(),
  }),
  tasks: () => {
    const lines = FLIGHT_ROUTES.map((r) => {
      const a = cityById(r.from), b = cityById(r.to);
      const south = centralAngleDeg(a.lat, a.lon, b.lat, b.lon);
      const north = mirroredAngle(a.lat, a.lon, b.lat, b.lon);
      return `${r.label}: south ${south.toFixed(2)}° = mirrored north ${north.toFixed(2)}°`;
    });
    return [
      Ttxt('Each southern leg has the same central angle as its lat-mirrored northern counterpart — the AE projection only stretches the visual length.'),
      ...lines.map((l) => Ttxt(l, 1500)),
      Tcall((m) => m.setState({ ShowFlightRoutes: true, FlightRoutesSelected: 'all', FlightRoutesProgress: 0 })),
      Tval('FlightRoutesProgress', 1, SWEEP_COMBINED, 0, 'linear'),
      Ttxt('Toggle FE / GE to compare — arcs equalise on the sphere. Press Stop when done.'),
      Thold(),
    ];
  },
};

// Constant-speed demo — sweep two routes (one short, one long) at the
// same `Progress / second` rate so the user sees the per-second arc
// length is constant regardless of which projection is showing.
function constSpeedInfoBox() {
  const lines = ['At identical deg/h, equal central angle = equal time.'];
  for (const id of ['jnb-syd', 'jnb-gru']) {
    const r = FLIGHT_ROUTES.find((x) => x.id === id);
    const a = cityById(r.from), b = cityById(r.to);
    const ang = centralAngleDeg(a.lat, a.lon, b.lat, b.lon);
    lines.push(`  ${r.label}  ${ang.toFixed(2)}°`);
  }
  lines.push('~Air / ground speed: (no flight data)');
  return { title: 'Constant-speed parity', lines };
}

const CONST_SPEED_DEMO = {
  name: 'Constant speed — equal arc-length, equal time',
  group: 'flight-routes',
  speedScale: FLIGHT_SPEED_SCALE,
  intro: baseIntro({
    FlightRoutesSelected: ['jnb-syd', 'jnb-gru'],
    FlightRoutesProgress: 0,
    FlightInfoBox: constSpeedInfoBox(),
  }),
  tasks: () => [
    Ttxt('Two routes from Johannesburg — Sydney (long) and Sao Paulo (short). At constant speed, time per arc-unit is the same on both projections.'),
    Tcall((m) => m.setState({
      ShowFlightRoutes: true,
      FlightRoutesSelected: ['jnb-syd', 'jnb-gru'],
      FlightRoutesProgress: 0,
    })),
    Tval('FlightRoutesProgress', 1, SWEEP_COMBINED, 0, 'linear'),
    Ttxt('Same sweep on the GE sphere — same elapsed time, same arc-length per second.'),
    Tcall((m) => m.setState({ WorldModel: 'ge', FlightRoutesProgress: 0 })),
    Tval('FlightRoutesProgress', 1, SWEEP_COMBINED, 0, 'linear'),
    Ttxt('Both sweeps complete — toggle FE / GE freely; press Stop when done.'),
    Thold(),
  ],
};

export const FLIGHT_ROUTES_DEMOS = [
  ALL_ROUTES_DEMO,
  CENTRAL_ANGLE_DEMO,
  CONST_SPEED_DEMO,
  ...QF_FLIGHT_DEMOS,
  ...PER_ROUTE_DEMOS,
];
