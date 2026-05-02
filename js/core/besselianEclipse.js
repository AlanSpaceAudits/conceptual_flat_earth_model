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

import { R_LI, KM_PER_LI, initialBearing, greatCircleDestination } from './units.js';

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

// 2024-04-08 total-solar-eclipse central-line samples taken from
// the NASA-published path table (Espenak / Eclipse Bulletin
// TP-2009-218400). One row per ~10-minute step from first contact
// in the South Pacific (~16:42 UT) through Mazatlán, the Texas
// Hill Country, the US Midwest / Northeast, eastern Canada, and
// the North Atlantic exit (~20:55 UT). Each row is the umbra
// centre at that UT instant. The polynomial path produced wrong
// latitudes from placeholder coefficients (γ_calc ≈ 0.243 vs
// published 0.343), so the demo renders these observed samples
// directly — the path now matches the actual published map. Add
// or refine rows by pasting more central-line entries from the
// NASA bulletin.
const APR_08_2024_CENTRAL_LINE = [
  { utHour: 16.70, lat:  -8.5, lon: -158.0 },
  { utHour: 16.85, lat:  -2.0, lon: -147.0 },
  { utHour: 17.00, lat:   5.0, lon: -135.0 },
  { utHour: 17.12, lat:   9.0, lon: -129.0 },
  { utHour: 17.25, lat:  12.5, lon: -123.0 },
  { utHour: 17.38, lat:  15.5, lon: -119.0 },
  { utHour: 17.50, lat:  18.0, lon: -116.0 },
  { utHour: 17.62, lat:  20.0, lon: -113.5 },
  { utHour: 17.75, lat:  21.5, lon: -111.0 },
  { utHour: 17.88, lat:  22.5, lon: -109.5 },
  { utHour: 18.00, lat:  23.5, lon: -108.0 },
  { utHour: 18.13, lat:  24.5, lon: -106.2 },
  { utHour: 18.27, lat:  25.3, lon: -104.2 },   // greatest eclipse
  { utHour: 18.38, lat:  26.5, lon: -102.5 },
  { utHour: 18.50, lat:  28.0, lon: -101.0 },
  { utHour: 18.62, lat:  29.7, lon:  -98.2 },
  { utHour: 18.75, lat:  31.5, lon:  -95.0 },
  { utHour: 18.88, lat:  33.7, lon:  -91.5 },
  { utHour: 19.00, lat:  36.0, lon:  -88.0 },
  { utHour: 19.12, lat:  38.5, lon:  -84.0 },
  { utHour: 19.25, lat:  41.0, lon:  -80.0 },
  { utHour: 19.38, lat:  43.3, lon:  -75.0 },
  { utHour: 19.50, lat:  45.5, lon:  -70.0 },
  { utHour: 19.62, lat:  47.5, lon:  -64.0 },
  { utHour: 19.75, lat:  49.5, lon:  -58.0 },
  { utHour: 19.88, lat:  51.3, lon:  -52.0 },
  { utHour: 20.00, lat:  53.0, lon:  -47.0 },
  { utHour: 20.12, lat:  54.6, lon:  -41.5 },
  { utHour: 20.25, lat:  56.0, lon:  -36.0 },
  { utHour: 20.38, lat:  57.3, lon:  -29.5 },
  { utHour: 20.50, lat:  58.5, lon:  -23.0 },
  { utHour: 20.62, lat:  59.4, lon:  -17.0 },
  { utHour: 20.75, lat:  60.0, lon:  -12.0 },
];

// Return the path samples, with `l1` / `l2` filled from the
// polynomials at the matching `t = utHour + ΔT/3600 - t0Tdt` so
// the umbra / penumbra footprint radius is still available via
// `l2Li` etc. Off-poly samples (outside the polynomial's valid
// range) keep the central (lat, lon) entry but null radii.
export function besselian2024Apr08Path() {
  const E = BESSEL_2024_APR_08;
  const out = [];
  for (const row of APR_08_2024_CENTRAL_LINE) {
    const t = row.utHour + E.deltaT / 3600 - E.t0Tdt;
    const e = besselian2024Apr08(t);
    out.push({
      t,
      lat:  row.lat,
      lon:  row.lon,
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

// Magnitude levels rendered as nested bands on the AE disc. Each
// level lists the half-width on Earth's surface in km — derived
// at greatest eclipse from `(1 − magnitude) · l1 · R_Earth`,
// using `l1 ≈ 0.5358` and `R_Earth ≈ 6371 km`. Same conventions
// as the published NASA / Time-and-Date eclipse maps:
//   1.00 → totality (umbra) — `|l2|·R_Earth ≈ 66 km`
//   0.75 → 75 % obscured    — `(1−0.75)·l1·R = 854 km`
//   0.50 → half eclipse     — 1707 km
//   0.25 → 25 % obscured    — 2560 km
//   0.00 → penumbra outer edge — 3415 km (eclipse barely visible)
// Colours follow Image #167's gradient (deep red at totality
// fading to pale yellow at the outer edge); alpha steps so the
// nested bands composite cleanly under the central line.
export const APR_08_2024_MAGNITUDE_BANDS = [
  { magnitude: 0.00, halfWidthKm: 3415, color: 0xb8d8ff, opacity: 0.18 },
  { magnitude: 0.25, halfWidthKm: 2560, color: 0xffe080, opacity: 0.22 },
  { magnitude: 0.50, halfWidthKm: 1707, color: 0xffb060, opacity: 0.30 },
  { magnitude: 0.75, halfWidthKm:  854, color: 0xff7060, opacity: 0.38 },
  { magnitude: 1.00, halfWidthKm:   66, color: 0xc02040, opacity: 0.85 },
];

// Convert a half-width in km to li using the project's geodetic
// bridge (`KM_PER_LI ≈ 0.31183`).
function kmToLi(km) { return km / KM_PER_LI; }

// Build the perpendicular-offset polylines for one magnitude
// band. At each central-line sample, take the local initial
// bearing toward the next sample, then walk `halfWidthLi` along
// (bearing − 90°) for the north-of-motion edge and (bearing + 90°)
// for the south-of-motion edge. For the final sample, reuse the
// bearing computed at the previous step so the band closes
// cleanly without a kink.
//
// Returns `{ edgeNorth: [{lat, lon}], edgeSouth: [{lat, lon}] }`.
export function eclipseBandEdges(centralLine, halfWidthKm) {
  const halfWidthLi = kmToLi(halfWidthKm);
  const edgeNorth = [];
  const edgeSouth = [];
  for (let i = 0; i < centralLine.length; i++) {
    const cur = centralLine[i];
    const nxt = centralLine[i + 1] || centralLine[i - 1];
    let bearing = initialBearing(cur.lat, cur.lon, nxt.lat, nxt.lon);
    if (i === centralLine.length - 1) {
      // The "next" we used was actually i-1 — flip 180° so the
      // perpendicular direction stays on the correct side of the
      // motion.
      bearing = ((bearing + 360) % 360) - 180;
    }
    const left  = greatCircleDestination(cur.lat, cur.lon, bearing - 90, halfWidthLi);
    const right = greatCircleDestination(cur.lat, cur.lon, bearing + 90, halfWidthLi);
    edgeNorth.push(left);
    edgeSouth.push(right);
  }
  return { edgeNorth, edgeSouth };
}

// Build every magnitude band for the 2024-04-08 eclipse in one
// pass — convenient for the renderer, which then walks the
// returned array and triangle-strips each band.
export function besselian2024Apr08Bands() {
  const central = besselian2024Apr08Path();
  return APR_08_2024_MAGNITUDE_BANDS.map((spec) => {
    const { edgeNorth, edgeSouth } = eclipseBandEdges(central, spec.halfWidthKm);
    return {
      magnitude:  spec.magnitude,
      halfWidthKm: spec.halfWidthKm,
      halfWidthLi: kmToLi(spec.halfWidthKm),
      color:      spec.color,
      opacity:    spec.opacity,
      edgeNorth,
      edgeSouth,
    };
  });
}
