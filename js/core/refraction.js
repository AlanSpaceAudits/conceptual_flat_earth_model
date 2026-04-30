// Astronomical refraction.
//
// Two formulas — Bennett (1982) and Seidelman (Explanatory Supplement
// to the Astronomical Almanac) — both take APPARENT altitude in
// degrees and return refraction (apparent lift above the true
// position) in arcminutes. We feed true altitude as the input; the
// difference between true and apparent for the purposes of evaluating
// R is below the formula's own quoted accuracy except very near the
// horizon, where both formulas degrade anyway.
//
// Pressure correction follows the spreadsheet: barometric model with
// T = 15°C, sea-level p0 = 101 kPa.

const KPA_SEA_LEVEL = 101;
const T_C = 15;

function pressureAdjustment(elevationMeters) {
  const P = KPA_SEA_LEVEL * Math.exp(
    -(0.029 * 9.81 * elevationMeters) / (8.314 * (T_C + 273.15)),
  );
  return (P / KPA_SEA_LEVEL) * (283 / (273 + T_C));
}

export function bennettRefractionDeg(appAltDeg, elevationMeters = 0) {
  const h = appAltDeg;
  let R = 1 / Math.tan((h + 7.31 / (h + 4.4)) * Math.PI / 180);
  R = R - 0.06 * Math.sin((14.7 * R + 13) * Math.PI / 180);
  R *= pressureAdjustment(elevationMeters);
  return R / 60;
}

export function seidelmanRefractionDeg(appAltDeg, elevationMeters = 0) {
  const h = appAltDeg;
  const R = (34.133 + 4.197 * h + 0.00428 * h * h) /
            (1 + 0.505 * h + 0.0845 * h * h);
  return R * pressureAdjustment(elevationMeters) / 60;
}

export function refractionDeg(mode, appAltDeg, elevationMeters = 0) {
  if (!mode || mode === 'off') return 0;
  if (!Number.isFinite(appAltDeg)) return 0;
  // Below horizon the formulas misbehave; return 0 there.
  if (appAltDeg < -1) return 0;
  const h = Math.max(appAltDeg, -0.9);
  if (mode === 'bennett')   return bennettRefractionDeg(h, elevationMeters);
  if (mode === 'seidelman') return seidelmanRefractionDeg(h, elevationMeters);
  return 0;
}

// Lift a local-globe direction (x = zenith, y = east, z = north) by
// the chosen refraction model. Returns a new vector at the same
// magnitude with elevation increased by R(elevation). Azimuth is
// preserved.
export function applyRefractionLocalGlobe(coord, mode, elevationMeters = 0) {
  if (!mode || mode === 'off') return coord;
  const len = Math.hypot(coord[0], coord[1], coord[2]);
  if (len === 0) return coord;
  const yz = Math.hypot(coord[1], coord[2]);
  const elevDeg = Math.atan2(coord[0], yz) * 180 / Math.PI;
  const Rdeg = refractionDeg(mode, elevDeg, elevationMeters);
  if (!Rdeg) return coord;
  const newElevRad = (elevDeg + Rdeg) * Math.PI / 180;
  const newZenith  = Math.sin(newElevRad) * len;
  const newHoriz   = Math.cos(newElevRad) * len;
  const k = yz === 0 ? 0 : newHoriz / yz;
  return [newZenith, coord[1] * k, coord[2] * k];
}
