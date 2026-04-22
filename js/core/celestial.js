// Celestial direction vectors (unit sphere — no absolute distances).
//
// All three functions return unit vectors in the "celestial" frame, where
// +z is the celestial pole (perpendicular to the earth equator plane) and
// the sun's position at spring equinox is on the +x axis.

import { ToRad } from '../math/utils.js';
import { M } from '../math/mat3.js';

// Ecliptic-to-celestial transform: rotate the ecliptic plane up by the
// obliquity of the ecliptic.
export function compTransMatSunToCelest(obliquityDeg) {
  return M.RotatingX(ToRad(obliquityDeg));
}

// Moon-orbit -> celestial transform: compose moon orbit inclination,
// nodal precession (rotation about the ecliptic pole), and ecliptic tilt.
export function compTransMatMoonToCelest(obliquityDeg, moonInclinationDeg, moonPrecessAngleDeg) {
  const m1 = M.RotatingX(ToRad(moonInclinationDeg));
  const m2 = M.RotatingZ(ToRad(moonPrecessAngleDeg), m1);
  return M.RotatingX(ToRad(obliquityDeg), m2);
}

// Sun position as a unit vector in the celestial frame.
export function sunAngleToCelestCoord(sunAngleDeg, transMatSunToCelest) {
  const a = ToRad(sunAngleDeg);
  return M.Trans(transMatSunToCelest, [Math.cos(a), Math.sin(a), 0]);
}

// Moon position as a unit vector in the celestial frame.
export function moonAngleToCelestCoord(moonAngleDeg, transMatMoonToCelest) {
  const a = ToRad(moonAngleDeg);
  return M.Trans(transMatMoonToCelest, [Math.cos(a), Math.sin(a), 0]);
}

// Unit vector pointing to the moon's own north pole (used for visual
// phase orientation — which edge of the moon is lit).
export function moonNorthCelestCoord(transMatMoonToCelest) {
  return M.Trans(transMatMoonToCelest, [0, 0, 1]);
}
