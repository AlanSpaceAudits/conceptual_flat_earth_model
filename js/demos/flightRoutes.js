// Flight-routes demo set. One entry per route plus a combined-all
// demo, a central-angle demo, and a constant-speed / equal-arc-length
// demo. Each entry sweeps `FlightRoutesProgress` 0 → 1 over a fixed
// window so the great-circle line draws out across the disc / sphere.

import { Ttxt, Tval, Tcall, Thold } from './animation.js';
import {
  FLIGHT_ROUTES, FLIGHT_CITIES, cityById, centralAngleDeg,
} from '../data/flightRoutes.js';

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
  Zoom:            1.5,
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

// FE grid + GP drops on (the user wanted both visible).
const ROUTE_OVERLAYS = {
  ShowFeGrid:        true,
  ShowGroundPoints:  true,
  ShowFlightRoutes:  true,
  FlightRoutesProgress: 0,
  WorldModel:        'fe',
  MapProjection:     'ae',
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

const PER_ROUTE_DEMOS = FLIGHT_ROUTES.map((r) => {
  const a = cityById(r.from), b = cityById(r.to);
  const angle = centralAngleDeg(a.lat, a.lon, b.lat, b.lon);
  const km = angle * 111.195;
  return {
    name: `Route — ${r.label}`,
    group: 'flight-routes',
    speedScale: FLIGHT_SPEED_SCALE,
    intro: baseIntro({
      FlightRoutesSelected: r.id,
      FlightRoutesProgress: 0,
    }),
    tasks: () => [
      Ttxt(`${r.label} · central angle ${angle.toFixed(2)}° (≈ ${km.toFixed(0)} km).`),
      ...sweepRoute(r.id),
    ],
  };
});

const ALL_ROUTES_DEMO = {
  name: 'All routes — combined map',
  group: 'flight-routes',
  speedScale: FLIGHT_SPEED_SCALE,
  intro: baseIntro({
    FlightRoutesSelected: 'all',
    FlightRoutesProgress: 0,
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
const CENTRAL_ANGLE_DEMO = {
  name: 'Central-angle theorem — north vs south arc length',
  group: 'flight-routes',
  speedScale: FLIGHT_SPEED_SCALE,
  intro: baseIntro({
    FlightRoutesSelected: 'all',
    FlightRoutesProgress: 0,
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
const CONST_SPEED_DEMO = {
  name: 'Constant speed — equal arc-length, equal time',
  group: 'flight-routes',
  speedScale: FLIGHT_SPEED_SCALE,
  intro: baseIntro({
    FlightRoutesSelected: ['jnb-syd', 'jnb-gru'],
    FlightRoutesProgress: 0,
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
  ...PER_ROUTE_DEMOS,
];
