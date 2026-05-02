// Besselian-element shadow-axis projection.
//
// Distance convention: Bessel x, y, l1, l2 are NORMALISED to a
// 1-radius sphere. In this project the "Earth" sphere is the
// Tang sphere with radius `R_LI` ≈ 20,419.49 li (Yi Xing's
// 351 li 80 bu / du calibration; see `js/core/units.js`). To
// recover absolute distances multiply Bessel coords by `R_LI`;
// e.g. the umbral footprint radius on the surface is `l2 · R_LI`
// li. The projection math itself is unitless — every formula
// here treats the surface as the unit sphere — so no Earth-radius
// km constant ever enters this file.
//
// Angle convention: d (axis declination) and μ (Greenwich hour
// angle of the axis) are in degrees. To express the shadow
// declination in du / fen for tracker readouts, route the value
// through `fmtDuFen` from `units.js`; the polynomial keeps degrees
// so the published NASA / Espenak bulletins drop in unchanged.
//
// IMPORTANT — coefficient verification pending:
//   The polynomial coefficients below are placeholders modelled
//   on the standard NASA Eclipse Bulletin format for the
//   2024-04-08 total eclipse. Cross-checking γ at greatest eclipse
//   against the published value (γ ≈ 0.343) flags y₀ as suspect;
//   the recovered γ from these placeholders is ≈ 0.243. Drop in
//   the verified coefficients from
//   `https://eclipse.gsfc.nasa.gov/SEpubs/...` (NASA Technical
//   Publication TP-2009-218400, F. Espenak / J. Meeus) before
//   relying on the rendered path; otherwise the central line will
//   land in the wrong band of latitudes.

import { R_LI } from './units.js';

// `polyEval(coeffs, t)` evaluates  c0 + c1·t + c2·t² + ...
function polyEval(coeffs, t) {
  let v = 0;
  let p = 1;
  for (const c of coeffs) {
    v += c * p;
    p *= t;
  }
  return v;
}

// PLACEHOLDER coefficients — verify against NASA bulletin before
// production use. `t = TDT − t0` in decimal hours, `t0 = 18.0 TDT`.
const BESSEL_2024_APR_08 = {
  t0Tdt: 18.0,
  // ΔT in seconds (TT − UT). 69.2 s for 2024-04-08 per IERS.
  deltaT: 69.2,
  // Polynomial coefficients (constant first → highest power last).
  x:  [-0.318240,  0.5117263,  0.0000326, -0.0000084],
  y:  [ 0.219764, -0.1659531, -0.0000395,  0.0000017],
  d:  [ 7.586144,  0.0143388, -0.0000022],            // degrees
  mu: [89.591217, 15.0040518],                        // degrees;
                                                      // rate = 15.0040518 °/h
                                                      // is the standard
                                                      // sidereal Greenwich
                                                      // hour-angle rate.
  l1: [ 0.535814,  0.0000618, -0.0000128],
  l2: [-0.010373,  0.0000615, -0.0000127],
};

// Evaluate the elements at hour offset `t` from t0=18.0 TDT.
export function besselian2024Apr08(t) {
  const E = BESSEL_2024_APR_08;
  return {
    t,
    x:  polyEval(E.x,  t),
    y:  polyEval(E.y,  t),
    d:  polyEval(E.d,  t),
    mu: polyEval(E.mu, t),
    l1: polyEval(E.l1, t),
    l2: polyEval(E.l2, t),
  };
}

// Shadow-axis subpoint on the unit sphere. Inputs in degrees;
// returns `{ lat, lon }` in degrees, or null when the axis misses
// the sphere (`ξ² + η² > 1`).
//
// Formula source: NASA Solar Eclipse Predictions / Astronomical
// Almanac chapter 11 (USNO). Spherical-Earth simplification —
// Earth flattening adds ~10 arcmin which is below visible
// resolution on the flat-map render at this project's scale.
export function besselianAxisToLatLon(x, y, dDeg, muDeg) {
  const d   = dDeg * Math.PI / 180;
  const cosD = Math.cos(d);
  const sinD = Math.sin(d);
  const xi  = x;
  const eta = y;
  const r2  = xi * xi + eta * eta;
  if (r2 > 1) return null;
  const zeta = Math.sqrt(1 - r2);
  const sinPhi = eta * sinD + zeta * cosD;
  const phi    = Math.asin(Math.max(-1, Math.min(1, sinPhi)));
  const denom  = zeta * cosD - eta * sinD;
  const theta  = Math.atan2(xi, denom) * 180 / Math.PI;
  let lon = muDeg - theta;
  // Wrap to (-180, +180].
  lon = ((lon + 180) % 360 + 360) % 360 - 180;
  return { lat: phi * 180 / Math.PI, lon };
}

// Build the shadow-axis polyline.
//   tStart, tEnd — hours relative to t0=18.0 TDT
//   dt           — step in hours
// Returns `{ t, lat, lon, l1, l2, l1Li, l2Li }` per sample. l1/l2
// are kept dimensionless (Bessel convention); l1Li / l2Li are the
// same values multiplied through R_LI for consumers that want a
// distance in li (penumbra / umbra footprint radius). Off-sphere
// samples are dropped — no NaN sentinels — so a renderer can
// connect consecutive entries with line segments unconditionally.
export function besselian2024Apr08Path(tStart = -2.5, tEnd = 2.5, dt = 0.1) {
  const out = [];
  for (let t = tStart; t <= tEnd + 1e-9; t += dt) {
    const e = besselian2024Apr08(t);
    const ll = besselianAxisToLatLon(e.x, e.y, e.d, e.mu);
    if (!ll) continue;
    out.push({
      t,
      lat:  ll.lat,
      lon:  ll.lon,
      l1:   e.l1,
      l2:   e.l2,
      l1Li: e.l1 * R_LI,
      l2Li: e.l2 * R_LI,
    });
  }
  return out;
}

// Reference time for the 2024-04-08 eclipse, in TDT decimal hours.
// Demo intros that want to centre the camera or freeze the clock
// at greatest eclipse can read this directly.
export const T0_2024_APR_08_TDT = 18.0;
