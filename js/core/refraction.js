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
// Pressure / temperature correction follows the spreadsheet form,
// with `(P/P0) * (283/(273+T))` where P0 = 1010 mbar (≈ 101 kPa) and
// the formulas' reference temperature is 10°C (283 K). Pressure is
// passed in mbar and temperature in °C — those are the units the
// Refraction submenu exposes to the user. Default MSL conditions
// are 1013.25 mbar / 15°C; with those values the adjustment factor
// lands at ~0.986 (close to the formulas' nominal 1.0 reference).

const P0_MBAR = 1010;
const T_REF_K = 283;

function pressureTempAdjustment(pressureMbar, tempC) {
  return (pressureMbar / P0_MBAR) * (T_REF_K / (273 + tempC));
}

export function bennettRefractionDeg(appAltDeg, pressureMbar = 1013.25, tempC = 15) {
  const h = appAltDeg;
  let R = 1 / Math.tan((h + 7.31 / (h + 4.4)) * Math.PI / 180);
  R = R - 0.06 * Math.sin((14.7 * R + 13) * Math.PI / 180);
  R *= pressureTempAdjustment(pressureMbar, tempC);
  return R / 60;
}

export function seidelmanRefractionDeg(appAltDeg, pressureMbar = 1013.25, tempC = 15) {
  const h = appAltDeg;
  const R = (34.133 + 4.197 * h + 0.00428 * h * h) /
            (1 + 0.505 * h + 0.0845 * h * h);
  return R * pressureTempAdjustment(pressureMbar, tempC) / 60;
}

export function refractionDeg(mode, appAltDeg, pressureMbar = 1013.25, tempC = 15) {
  if (!mode || mode === 'off') return 0;
  if (!Number.isFinite(appAltDeg)) return 0;
  if (appAltDeg < -1) return 0;
  const h = Math.max(appAltDeg, -0.9);
  if (mode === 'bennett')   return bennettRefractionDeg(h, pressureMbar, tempC);
  if (mode === 'seidelman') return seidelmanRefractionDeg(h, pressureMbar, tempC);
  return 0;
}

// Lift a local-globe direction (x = zenith, y = east, z = north) by
// the chosen refraction model. Returns a new vector at the same
// magnitude with elevation increased by R(elevation). Azimuth is
// preserved.
export function applyRefractionLocalGlobe(coord, mode, pressureMbar = 1013.25, tempC = 15) {
  if (!mode || mode === 'off') return coord;
  const len = Math.hypot(coord[0], coord[1], coord[2]);
  if (len === 0) return coord;
  const yz = Math.hypot(coord[1], coord[2]);
  const elevDeg = Math.atan2(coord[0], yz) * 180 / Math.PI;
  const Rdeg = refractionDeg(mode, elevDeg, pressureMbar, tempC);
  if (!Rdeg) return coord;
  const newElevRad = (elevDeg + Rdeg) * Math.PI / 180;
  const newZenith  = Math.sin(newElevRad) * len;
  const newHoriz   = Math.cos(newElevRad) * len;
  const k = yz === 0 ? 0 : newHoriz / yz;
  return [newZenith, coord[1] * k, coord[2] * k];
}
