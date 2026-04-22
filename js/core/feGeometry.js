// Flat-earth disc + dome geometry, all in unitless FE_RADIUS coordinates.

import { ToRad, sqr } from '../math/utils.js';
import { coordToLatLong, localGlobeCoordToGlobalFeCoord } from './transforms.js';
import { latLongToCoord } from './transforms.js';

// Azimuthal-equidistant projection centred on the north pole:
//   lat = +90  ->  disc centre
//   lat =   0  ->  half-radius ring (equator)
//   lat = -90  ->  outer rim
//
// Returns a 3D point [x, y, 0] on the disc.
export function pointOnFE(latDeg, longDeg, feRadius = 1) {
  const r = feRadius * (90 - latDeg) / 180;
  const lo = ToRad(longDeg);
  return [r * Math.cos(lo), r * Math.sin(lo), 0];
}

// Visual-only alternative radial mappings for the disc. The AE map is still
// the model's internal frame — these only affect how continents, graticule,
// and latitude circles are painted on the disc surface. Supported values:
//   'ae'        — azimuthal-equidistant (the model's native mapping).
//   'hellerick' — Lambert azimuthal equal-area (polar aspect) normalised so
//                 the southern pole lands on the rim. Used as a visual
//                 stand-in for Hellerick's boreal look until an
//                 authoritative formula is available.
export function pointOnFeMap(latDeg, longDeg, feRadius = 1, projection = 'ae') {
  const lo = ToRad(longDeg);
  let r;
  if (projection === 'hellerick') {
    r = feRadius * Math.sin((90 - latDeg) * Math.PI / 360);
  } else {
    r = feRadius * (90 - latDeg) / 180;
  }
  return [r * Math.cos(lo), r * Math.sin(lo), 0];
}

// Global FE coord for a fe-style lat/long (i.e. the disc position of a
// geographical point).
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
  const r = feRadius * (90 - latDeg) / 180;
  const lo = ToRad(longDeg);
  const x = r * Math.cos(lo);
  const y = r * Math.sin(lo);

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
  const r = feRadius * (90 - latDeg) / 180;
  const lo = ToRad(longDeg);
  return [r * Math.cos(lo), r * Math.sin(lo), z];
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
