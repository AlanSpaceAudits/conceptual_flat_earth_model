// Unitless constants for the FE dome model.
//
// All distances are expressed as multiples of the flat-earth disc radius
// (FE_RADIUS = 1). Heliocentric-specific lengths (DistSun, DistMoon,
// RadiusEarth, RadiusSun, RadiusMoon) are deliberately absent — the
// celestial sphere is unit, and the sun is effectively at infinity for
// moon-phase shading.
//
// Time constants (sidereal periods, obliquity, lunar inclination) are
// observational and apply in either frame.

export const FE_RADIUS = 1;

// Dimensionless geometry (ratios of FE_RADIUS). Defaults preserve Walter's
// visual look: his VaultHeight / RadiusFE = 9000 / 20015 ~= 0.4497.
export const GEOMETRY = {
  // Heavenly vault: plan radius == disc radius by default (VaultSize=1), so
  // it sits directly over the earth rather than flaring out past it. Max
  // trimmed from 5.0 to 1.2 so the shell can't inflate to fill the scene.
  VaultSizeDefault:      1.0,
  VaultSizeMin:          1.0,
  VaultSizeMax:          1.2,
  VaultHeightDefault:    0.75,
  VaultHeightMin:        0.4,
  VaultHeightMax:        1.0,
  CameraDistanceDefault: 10.0,
  CameraDistanceMinRel:  2.0,
  ZoomMin:               1.0,
  ZoomMax:              10.0,
  // Horizontal radius of the observer's optical vault: pegged to the
  // distance from the north pole to the equator on the FE disc (= 0.5 of
  // FE_RADIUS). This represents the conceptual "limit of vision" cap onto
  // which the celestial bodies and starfield project.
  OpticalVaultRadiusFar:  0.5,
  OpticalVaultRadiusNear: 0.5,
  // Vertical extent of the optical vault — smaller than the radius so the
  // cap stays flatter than a hemisphere, but large enough that the
  // rise-transit-set star arcs are visibly curved. Lower values (e.g.
  // 0.18) squash elevation so hard that arcs read as horizontal slides
  // and the latitude-dependent arc reversal (N vs S hemisphere) becomes
  // hard to see.
  OpticalVaultHeightFar:  0.35,
  OpticalVaultHeightNear: 0.35,
  // User-adjustable bounds for the optical vault. Default state uses the
  // Far values above; the slider can shrink or enlarge the cap within
  // these limits.
  OpticalVaultSizeMin:    0.1,
  OpticalVaultSizeMax:    1.0,
  OpticalVaultHeightMin:  0.05,
  OpticalVaultHeightMax:  1.0,
};

// Observational constants (frame-independent).
export const CELESTIAL = {
  SidericDay:         23.93447,       // hours per sidereal rotation
  SunPeriod:         365.256363004,   // days per sidereal year
  SunEcliptic:        23.44,          // obliquity of ecliptic, degrees
  SunAngleOffset:     78.5,           // day offset so DateTime=0 -> spring equinox
  MoonPeriod:         27.321661,      // sidereal month, days
  MoonEcliptic:        5.145,         // lunar orbit inclination, degrees
  MoonAngleOffset:     0.48,          // empirical: matches 2017-08-21 solar eclipse
  MoonPrecessPeriod: -6798.383,       // nodal regression period, days
  MoonPrecessOffset: -301.996,        // empirical offset
};

// Date origin: days from 1970-01-01 to 2017-01-01. Populated at init.
export const TIME_ORIGIN = {
  ZeroDate: 0,
  msPerDay: 86_400_000,
};

export function initTimeOrigin() {
  const d = new Date(Date.UTC(2017, 0, 1, 0, 0, 0, 0));
  TIME_ORIGIN.ZeroDate = d.getTime() / TIME_ORIGIN.msPerDay;
}
