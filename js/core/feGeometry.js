// Flat-earth disc + dome geometry, all in unitless FE_RADIUS coordinates.

import { ToRad, sqr } from '../math/utils.js';
import { coordToLatLong, localGlobeCoordToGlobalFeCoord } from './transforms.js';
import { latLongToCoord } from './transforms.js';

// Routes (lat, lon) -> disc xy through the active map projection so the
// observer and every above-disc anchor share the same coordinate
// framework as the FE grid lines.
import { canonicalLatLongToDisc } from './canonical.js';
import { getProjection } from './projections.js';

export function pointOnFE(latDeg, longDeg, feRadius = 1) {
  const p = canonicalLatLongToDisc(latDeg, longDeg, feRadius);
  return [p[0], p[1], 0];
}

export function pointOnFeMap(latDeg, longDeg, feRadius = 1, projectionId = 'ae') {
  return getProjection(projectionId).project(latDeg, longDeg, feRadius);
}

export function feLatLongToGlobalFeCoord(latDeg, longDeg, feRadius = 1) {
  return pointOnFE(latDeg, longDeg, feRadius);
}

// Dome projection: place a celestial direction (given by its CELESTIAL lat/long)
// onto a vault surface. Two flavours:
//
//   seasonalBand = 0  (default, geometric cap)
//       z = floor + sqrt(R² - r²) · (apex − floor) / R
//       → standard ellipsoidal lift. Weak elevation variation between the
//         tropics because most of the motion happens near r = 0.
//
//   seasonalBand > 0  (stylised sun / moon)
//       z is interpolated linearly across the declination band so the body
//       climbs visibly *north* (toward Cancer, z → apex) and drops *south*
//       (toward Capricorn, z → near floor) on its own vault. The radial x/y
//       still comes from the AE projection so the body stays above its GP.
export function celestLatLongToVaultCoord(
  latDeg, longDeg, domeSize, domeHeight, feRadius = 1, floor = 0, seasonalBand = 0,
) {
  const domeRadius = domeSize * feRadius;
  const p = canonicalLatLongToDisc(latDeg, longDeg, feRadius);
  const x = p[0];
  const y = p[1];
  const r = Math.hypot(x, y);

  let z;
  if (seasonalBand > 0) {
    // Clamp declination to the body's band, map linearly across the height
    // range with a little headroom on either side so neither extreme sits
    // exactly on the floor or apex.
    const clamped = Math.max(-seasonalBand, Math.min(seasonalBand, latDeg));
    const norm = 0.5 + 0.5 * (clamped / seasonalBand);   // 0 at south, 1 at north
    const headroom = 0.12;
    const mix = headroom + (1 - 2 * headroom) * norm;    // 0.12..0.88
    z = floor + (domeHeight - floor) * mix;
  } else {
    const zSq = sqr(domeRadius) - sqr(r);
    z = floor + (zSq > 0 ? Math.sqrt(zSq) : 0) * (domeHeight - floor) / domeRadius;
  }
  return [x, y, z];
}

// Direct vault placement: AE projection (x, y) at a fixed altitude z. Used
// for the sun and moon, whose altitude is set by declination alone (constant
// across a day) — rather than sitting on a curved cap whose z varies with
// the body's projected radius.
export function vaultCoordAt(latDeg, longDeg, z, feRadius = 1) {
  const p = canonicalLatLongToDisc(latDeg, longDeg, feRadius);
  return [p[0], p[1], z];
}

export function celestCoordToVaultCoord(celestVect, domeSize, domeHeight, feRadius = 1) {
  const { lat, lng } = coordToLatLong(celestVect);
  return celestLatLongToVaultCoord(lat, lng, domeSize, domeHeight, feRadius);
}

export function celestLatLongToGlobalFeSphereCoord(
  latDeg, longDeg, length, transMatCelestToGlobe, transMatLocalFeToGlobalFe,
) {
  // celest lat/long direction -> local globe at that length -> global fe frame
  const celestCoord = latLongToCoord(latDeg, longDeg, length);
  // M.Trans import kept local to avoid cycles
  const localGlobeCoord = _trans(transMatCelestToGlobe, celestCoord);
  return localGlobeCoordToGlobalFeCoord(localGlobeCoord, transMatLocalFeToGlobalFe);
}

// Helper: avoid importing M here to keep the module small.
function _trans(m, v) {
  const r = m.r, t = m.t;
  return [
    r[0][0]*v[0] + r[0][1]*v[1] + r[0][2]*v[2] + t[0],
    r[1][0]*v[0] + r[1][1]*v[1] + r[1][2]*v[2] + t[1],
    r[2][0]*v[0] + r[2][1]*v[1] + r[2][2]*v[2] + t[2],
  ];
}
