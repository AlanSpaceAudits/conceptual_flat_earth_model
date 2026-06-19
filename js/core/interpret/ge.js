// GE interpreter — globe-earth geometry.
//
// The second independent interpretation of the same shared (Tang-canonical)
// celestial sphere. This module knows ONLY the spherical-earth model: the
// observer on a globe of radius FE_RADIUS, the celestial sphere wrapping it,
// and the optical cap that hugs the visible hemisphere. It imports nothing
// from the FE interpreter and holds no disc / dome geometry. Distances in
// this frame read out in km / nmi.
//
// Because FE and GE read the SAME celestial sphere, a body's angular
// position is identical in both; they differ only in how that angle is
// turned into a scene position and what unit the surface distance is given in.

import { ToRad } from '../../math/utils.js';

const SUB_HORIZON = [0, 0, -1000];

// Observer's local orthonormal basis at (lat, lon): north = d/dLat,
// east = d/dLon, up = radial outward. Row-major components the renderer
// copies straight into a Matrix4.
export function observerBasis(latDeg, lonDeg) {
  const latR = ToRad(latDeg), lonR = ToRad(lonDeg);
  const cl = Math.cos(latR), sl = Math.sin(latR);
  const co = Math.cos(lonR), so = Math.sin(lonR);
  return {
    northX: -sl * co, northY: -sl * so, northZ: cl,
    eastX:  -so,      eastY:   co,      eastZ:  0,
    upX:     cl * co, upY:     cl * so, upZ:    sl,
  };
}

// Observer position on a globe of radius `globeRadius`. When `atCenter` is
// set (the fictitious centre observer in GE mode) the position collapses to
// the world origin; the local basis above still carries the surface tilt.
export function observerCoord(latDeg, lonDeg, globeRadius, atCenter) {
  if (atCenter) return [0, 0, 0];
  const latR = ToRad(latDeg), lonR = ToRad(lonDeg);
  const cl = Math.cos(latR), sl = Math.sin(latR);
  const co = Math.cos(lonR), so = Math.sin(lonR);
  return [globeRadius * cl * co, globeRadius * cl * so, globeRadius * sl];
}

// Place a celestial point on the globe's heavenly-vault shell at
// (declination, ground-point longitude). GP longitude folds GMST out of RA
// so the vault co-rotates with Earth, matching the FE vault convention.
export function heavenlyVaultCoord(decDeg, gpLonDeg, vaultRadius) {
  const phi = ToRad(decDeg), lam = ToRad(gpLonDeg);
  const cp = Math.cos(phi);
  return [
    vaultRadius * cp * Math.cos(lam),
    vaultRadius * cp * Math.sin(lam),
    vaultRadius * Math.sin(phi),
  ];
}

// Project a body's local-sky direction (zenith, east, north) onto the GE
// optical cap (hemisphere of radius `feRadius`, tangent at the observer).
// Sub-horizon bodies (zenith <= 0) are parked at the far-below sentinel so
// they vanish at the horizon, matching the FE vault's culling convention.
export function opticalProject(localSky, frame, obsCoord, feRadius) {
  if (!frame || !obsCoord) return [...SUB_HORIZON];
  if (localSky[0] <= 0) return [...SUB_HORIZON];
  const R = feRadius;
  const ax = localSky[2];   // north
  const ay = localSky[1];   // east
  const az = localSky[0];   // zenith
  return [
    obsCoord[0] + R * (ax * frame.northX + ay * frame.eastX + az * frame.upX),
    obsCoord[1] + R * (ax * frame.northY + ay * frame.eastY + az * frame.upY),
    obsCoord[2] + R * (ax * frame.northZ + ay * frame.eastZ + az * frame.upZ),
  ];
}
