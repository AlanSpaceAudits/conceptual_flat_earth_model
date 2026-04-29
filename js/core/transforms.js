// Coordinate-frame transforms and conversions.
//
// Reference frame: stationary flat earth, rotating celestial dome.
//
//   celest  - +z is the celestial pole (dome's axis of rotation);
//             sun/moon directions live here as unit vectors
//   globe   - local observer frame: +x zenith, +y east, +z north
//   fe-local- local flat-earth frame at observer: +z up, +x outward, +y east
//   fe      - global stationary flat-earth disc: z=0 is the disc plane, +z up
//   dome    - rotating sky frame: sky's current angular position about +z
//             determines how a dome-fixed point maps to fe coords

import { ToRad, ToDeg, Limit1 } from '../math/utils.js';
import { M } from '../math/mat3.js';
import { V } from '../math/vect3.js';
import { canonicalLatLongToDisc } from './canonical.js';

// Celest -> local-globe: rotate by -(observer-longitude + skyRotAngle) about Z,
// then by +latitude about Y.
export function compTransMatCelestToGlobe(obsLatDeg, obsLongDeg, skyRotAngleDeg) {
  const first = M.RotatingZ(ToRad(-obsLongDeg - skyRotAngleDeg));
  return M.RotatingY(ToRad(obsLatDeg), first);
}

// Local-fe -> global-fe.
//
// Local-FE convention: +x = south, +y = east, +z = up. The rotation
// is built from the active projection's gradient at (obsLat, obsLon)
// so a non-AE projection (currently only DP) gets the right
// curved-meridian tangent for "north". Sampling
// `canonicalLatLongToDisc` keeps this in lockstep with the
// projection-dispatch in canonical.js (S680).
//
// For AE polar, the gradient collapses to `-(cos λ, sin λ)` for the
// "north" direction — i.e. `RotatingZ(λ)` — so behaviour is unchanged
// when no override is active. At the canonical AE pole (lat = 90°)
// the gradient is singular; fall back to the longitude rotation so
// the meridian picked by ObserverLong continues to drive the frame.
export function compTransMatLocalFeToGlobalFe(observerCoord, observerLongDeg, observerLatDeg = null) {
  let ax, ay, bx, by;
  if (observerLatDeg === null) {
    const lr = ToRad(observerLongDeg);
    const cl = Math.cos(lr), sl = Math.sin(lr);
    ax = cl;  ay = sl;       // local +x (south) → global
    bx = -sl; by = cl;       // local +y (east)  → global
  } else {
    const eps = 1e-3;
    const lat = observerLatDeg;
    const lon = observerLongDeg;
    const pHere = canonicalLatLongToDisc(lat, lon, 1);
    const latProbe = lat >= 90 - eps ? lat - eps : lat + eps;
    const sign = lat >= 90 - eps ? -1 : 1;
    const pN = canonicalLatLongToDisc(latProbe, lon, 1);
    const dnx = (pN[0] - pHere[0]) * sign;
    const dny = (pN[1] - pHere[1]) * sign;
    const nLen = Math.hypot(dnx, dny);
    if (nLen < 1e-9) {
      const lr = ToRad(observerLongDeg);
      const cl = Math.cos(lr), sl = Math.sin(lr);
      ax = cl;  ay = sl;
      bx = -sl; by = cl;
    } else {
      const nx = dnx / nLen, ny = dny / nLen;
      ax = -nx; ay = -ny;       // south = -north
      bx =  ny; by = -nx;       // east  = north rotated −90° in disc plane
    }
  }
  const rot = {
    r: [
      [ax, bx, 0],
      [ay, by, 0],
      [0,  0,  1],
    ],
    t: [0, 0, 0],
  };
  return M.Moving(observerCoord[0], observerCoord[1], observerCoord[2], rot);
}

// Dome -> fe: the sky-frame point, after the current sky rotation, expressed
// in the stationary disc's coordinates.
export function compTransMatVaultToFe(skyRotAngleDeg) {
  return M.RotatingZ(-ToRad(skyRotAngleDeg));
}

// --- Point conversions ----------------------------------------------------

export function celestCoordToLocalGlobeCoord(celestCoord, transMatCelestToGlobe) {
  return M.Trans(transMatCelestToGlobe, celestCoord);
}

// Spherical (long, lat, r) -> cartesian.
export function latLongToCoord(latDeg, longDeg, length) {
  return V.FromAngle(longDeg, latDeg, length);
}

// Cartesian -> { lat, lng } in degrees.
export function coordToLatLong(coord) {
  const vectXY = [coord[0], coord[1], 0];
  const xyLen = V.Length(vectXY);
  if (xyLen === 0) {
    return { lat: coord[2] >= 0 ? 90 : -90, lng: 0 };
  }
  const xyNorm = V.Norm(vectXY);
  const norm   = V.Norm(coord);
  const lat = 90 - ToDeg(Math.acos(Limit1(V.ScalarProd([0, 0, 1], norm))));
  let   lng = ToDeg(Math.acos(Limit1(V.ScalarProd([1, 0, 0], xyNorm))));
  if (xyNorm[1] < 0) lng *= -1;
  return { lat, lng };
}

// Equatorial (RA / Dec) → horizontal (az / el) at the observer's
// (lat, lon) and the supplied Greenwich mean sidereal time.
// RA / Dec in radians; lat / lon / gmst in degrees. Returns
// `{ azimuth, elevation }` in degrees, with azimuth measured
// clockwise from north and elevation 0° at the horizon. Returns
// NaN/NaN when the input RA / Dec aren't finite — handy when a
// comparison pipeline reports NaN for an unsupported body.
export function raDecToAzEl(raRad, decRad, latDeg, lonDeg, gmstDeg) {
  if (!Number.isFinite(raRad) || !Number.isFinite(decRad)) {
    return { azimuth: NaN, elevation: NaN };
  }
  const DEG = Math.PI / 180;
  const lat = latDeg * DEG;
  const lst = (gmstDeg + lonDeg) * DEG;
  const ha  = lst - raRad;
  const sinAlt = Math.sin(lat) * Math.sin(decRad)
              + Math.cos(lat) * Math.cos(decRad) * Math.cos(ha);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const y = -Math.cos(decRad) * Math.sin(ha);
  const x = Math.sin(decRad) * Math.cos(lat)
          - Math.cos(decRad) * Math.sin(lat) * Math.cos(ha);
  let az = Math.atan2(y, x) * 180 / Math.PI;
  az = ((az % 360) + 360) % 360;
  return { azimuth: az, elevation: alt * 180 / Math.PI };
}

// Local-globe cartesian -> { azimuth, elevation } in degrees.
// Convention: x=zenith, y=east, z=north.
export function localGlobeCoordToAngles(coord) {
  const yzLen = Math.hypot(coord[1], coord[2]);
  const norm = V.Norm(coord);
  let azimuth;
  if (yzLen === 0) {
    azimuth = 0;
  } else {
    const yzNorm = [0, coord[1] / yzLen, coord[2] / yzLen];
    azimuth = ToDeg(Math.acos(Limit1(V.ScalarProd([0, 0, 1], yzNorm))));
    if (yzNorm[1] < 0) azimuth = 360 - azimuth;
  }
  const elevation = 90 - ToDeg(Math.acos(Limit1(V.ScalarProd([1, 0, 0], norm))));
  return { azimuth, elevation };
}

// Swap of axis convention from local-globe (x-zenith, y-east, z-north) to
// local-fe (x-north, y-east, z-up).
export function localGlobeCoordToLocalFeCoord(v) {
  return [-v[2], v[1], v[0]];
}

export function localGlobeCoordToGlobalFeCoord(v, transMatLocalFeToGlobalFe) {
  return M.Trans(transMatLocalFeToGlobalFe, localGlobeCoordToLocalFeCoord(v));
}

export function vaultCoordToGlobalFeCoord(v, transMatDomeToFe) {
  return M.Trans(transMatDomeToFe, v);
}
