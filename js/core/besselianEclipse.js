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
import { greenwichSiderealDeg } from './ephemerisCommon.js';

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
  // Rotation from fundamental-plane coords (ξ, η, ζ) to
  // Earth-fixed Greenwich-equatorial (X, Y, Z):
  //   ξ-axis is east on the fundamental plane (perpendicular to
  //   the meridian containing the moon-sun axis).
  //   ζ-axis points along the moon-sun direction (declination d,
  //   Greenwich hour angle μ).
  //   sin φ_geocentric = Z = η cos d + ζ sin d
  //   λ = atan2(ξ, A) − μ   where A = −η sin d + ζ cos d
  // (Verified against Apr 8 2024 greatest: lat 25.3 °N, lon −104.2 °W.)
  const sinPhi = eta * cosD + zeta * sinD;
  const A      = -eta * sinD + zeta * cosD;
  const phi    = Math.asin(Math.max(-1, Math.min(1, sinPhi)));
  const theta  = Math.atan2(xi, A) * 180 / Math.PI;
  let lon = theta - muDeg;
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
// level carries a **dimensionless** `lFraction` — the band's
// surface half-width as a fraction of the sphere radius. Render
// code multiplies by `R_LI` (Tang sphere radius) to get the
// half-width in li, never going through any external Earth-radius
// constant. Map of fractions:
//   1.00 → totality (umbra) — `|l2|`
//   0.75 → 75 % obscured    — `(1 − 0.75) · l1 = 0.25 · l1`
//   0.50 → half eclipse     — `0.50 · l1`
//   0.25 → 25 % obscured    — `0.75 · l1`
//   0.00 → penumbra outer edge — `l1`
// Defaults `L1_DEFAULT` / `L2_DEFAULT` are the Apr-08-2024
// Besselian values (representative perigee total). When per-event
// Besselian polynomials land, their `l1(t_greatest)` /
// `l2(t_greatest)` should be substituted via
// `magnitudeBandFractions(l1, l2)` so each eclipse paints with
// its own footprint.
export const L1_DEFAULT = 0.5358;
export const L2_DEFAULT = 0.0103;

// Build the 5-level band table for given Besselian `l1` / `l2`.
// Pure function — no R-anchored conversion, just the fractions.
export function magnitudeBandFractions(l1 = L1_DEFAULT, l2 = L2_DEFAULT) {
  const absL2 = Math.abs(l2);
  return [
    { magnitude: 0.00, lFraction: 1.00 * l1, color: 0xb8d8ff, opacity: 0.18 },
    { magnitude: 0.25, lFraction: 0.75 * l1, color: 0xffe080, opacity: 0.22 },
    { magnitude: 0.50, lFraction: 0.50 * l1, color: 0xffb060, opacity: 0.30 },
    { magnitude: 0.75, lFraction: 0.25 * l1, color: 0xff7060, opacity: 0.38 },
    { magnitude: 1.00, lFraction: absL2,     color: 0xc02040, opacity: 0.85 },
  ];
}

// Default band table — backwards-compatible alias for the previous
// `APR_08_2024_MAGNITUDE_BANDS` export. Carries fractions, not km.
export const APR_08_2024_MAGNITUDE_BANDS = magnitudeBandFractions();

// Build the perpendicular-offset polylines for one magnitude
// band. At each central-line sample, take the local initial
// bearing toward the next sample, then walk `halfWidthLi` along
// (bearing − 90°) for the north-of-motion edge and (bearing + 90°)
// for the south-of-motion edge. For the final sample, reuse the
// bearing computed at the previous step so the band closes
// cleanly without a kink.
//
// Width input is in li (Tang sphere units). Returns
// `{ edgeNorth: [{lat, lon}], edgeSouth: [{lat, lon}] }`.
export function eclipseBandEdges(centralLine, halfWidthLi) {
  const edgeNorth = [];
  const edgeSouth = [];
  for (let i = 0; i < centralLine.length; i++) {
    const cur = centralLine[i];
    const nxt = centralLine[i + 1] || centralLine[i - 1];
    let bearing = initialBearing(cur.lat, cur.lon, nxt.lat, nxt.lon);
    if (i === centralLine.length - 1) {
      bearing = ((bearing + 360) % 360) - 180;
    }
    const left  = greatCircleDestination(cur.lat, cur.lon, bearing - 90, halfWidthLi);
    const right = greatCircleDestination(cur.lat, cur.lon, bearing + 90, halfWidthLi);
    edgeNorth.push(left);
    edgeSouth.push(right);
  }
  return { edgeNorth, edgeSouth };
}

// Build every magnitude band for an arbitrary central line, with
// optional per-eclipse `l1` / `l2` from Besselian elements (when
// available). Half-widths are R_LI-anchored throughout — `km` is
// only computed at the end as a display-time SI courtesy via
// `KM_PER_LI`. The Tang sphere radius is the only length scale
// the math touches.
export function eclipseShadowBandsFromPath(centralLine, l1 = L1_DEFAULT, l2 = L2_DEFAULT) {
  const bands = magnitudeBandFractions(l1, l2);
  return bands.map((spec) => {
    const halfWidthLi = spec.lFraction * R_LI;
    const { edgeNorth, edgeSouth } = eclipseBandEdges(centralLine, halfWidthLi);
    return {
      magnitude:   spec.magnitude,
      lFraction:   spec.lFraction,
      halfWidthLi,
      halfWidthKm: halfWidthLi * KM_PER_LI,
      color:       spec.color,
      opacity:     spec.opacity,
      edgeNorth,
      edgeSouth,
    };
  });
}

// Convenience: same as `eclipseShadowBandsFromPath` against the
// hardcoded Apr-08-2024 central line, with default l1 / l2.
export function besselian2024Apr08Bands() {
  return eclipseShadowBandsFromPath(besselian2024Apr08Path());
}

// Build a per-eclipse polynomial-driven shadow path directly from
// the NASA Espenak Besselian element block (one entry of
// `js/data/eclipseBesselian.js`). Walks `t` from P1 (first contact
// — `√(x²+y²) ≤ 1 + l1`) through P4 in `samples` even steps, and
// at each step projects the shadow axis to lat/lon via
// `besselianAxisToLatLon`. The returned array includes per-sample
// `l1` / `l2` so a renderer can scale magnitude bands per event.
//
// This replaces the sublunar approximation
// (`computeSolarEclipseShadowPath`) with a real Espenak path. The
// coordinate convention matches NASA's: `(x, y)` in 1-radius
// fundamental-plane units; `d` (axis declination) and `μ`
// (Greenwich axis hour angle) in degrees; `l1` / `l2` unitless
// (multiply by `R_LI` for li).
//
// Search bounds: the polynomial element block ships `tMin` /
// `tMax` (typically ±3 h around `t0`). For partial eclipses the
// shadow axis never lands on the sphere (`√(x²+y²) > 1` always),
// so the cone first touches Earth when `√(x²+y²) ≤ 1 + l1`. P1 /
// P4 are the first / last `t` satisfying that. For total /
// annular, the central line lies on the sphere over a sub-window
// of P1..P4 — we still return the full P1..P4 path so the
// magnitude-band penumbral edge sweeps from first to last contact.
//
// Returns: { samples: [{ t, lat, lon, l1, l2 }], p1, p4, greatest, l1Greatest, l2Greatest }
//   t       — UT decimal hours from `t0Tdt`
//   lat, lon — sublunar shadow-axis projection (degrees) — null
//             when axis misses sphere at this t
//   l1, l2  — per-sample penumbra / umbra cone radii (unitless)
//   p1 / p4 — UT ms of first / last sphere contact
//   greatest — UT ms of minimum √(x²+y²) (closest approach)
//   l1Greatest / l2Greatest — element values at greatest, used to
//                             size per-event magnitude bands
export function besselianShadowPathFromElements(els, samples = 65) {
  const evalAt = (t) => ({
    x:  polyEval(els.x,  t),
    y:  polyEval(els.y,  t),
    d:  polyEval(els.d,  t),
    mu: polyEval(els.mu, t),
    l1: polyEval(els.l1, t),
    l2: polyEval(els.l2, t),
  });
  // Step in 1-min increments to find P1 / P4 / greatest.
  const stepHours = 1 / 60;
  let p1H = null, p4H = null, greatestH = els.tMin;
  let minR = Infinity;
  for (let t = els.tMin; t <= els.tMax + 1e-9; t += stepHours) {
    const e = evalAt(t);
    const r = Math.sqrt(e.x * e.x + e.y * e.y);
    const reach = 1 + e.l1;
    if (r <= reach) {
      if (p1H === null) p1H = t;
      p4H = t;
    }
    if (r < minR) { minR = r; greatestH = t; }
  }
  if (p1H === null) {
    // Shadow axis never touches Earth at `1 + l1` — fallback to
    // the full polynomial window so the renderer still has
    // something. Should be rare; happens only for misclassified
    // events where the partial phase grazes barely outside the
    // tabulated tMin..tMax window.
    p1H = els.tMin;
    p4H = els.tMax;
  }
  // Sample N points evenly across [p1, p4].
  const out = [];
  const span = p4H - p1H;
  for (let i = 0; i < samples; i++) {
    const t = p1H + (span * i) / Math.max(1, samples - 1);
    const e = evalAt(t);
    const ll = besselianAxisToLatLon(e.x, e.y, e.d, e.mu);
    out.push({
      t, // UT hours from t0
      lat: ll ? ll.lat : null,
      lon: ll ? ll.lon : null,
      l1: e.l1,
      l2: e.l2,
    });
  }
  // Anchor t0 in UT-ms. NASA ships `jdT0` alongside `t0Tdt`, but
  // their JD field uses a non-standard alignment — round it to
  // the eclipse calendar date and then add `t0Tdt` (TDT hours)
  // minus ΔT (s) for a clean t0_UT.
  const jdMs = (els.jdT0 - 2440587.5) * 86400000;
  const dEclipse = new Date(jdMs);
  const dateMidnightMs = Date.UTC(
    dEclipse.getUTCFullYear(),
    dEclipse.getUTCMonth(),
    dEclipse.getUTCDate(),
  );
  const t0Ms = dateMidnightMs + (els.t0Tdt * 3600 - els.deltaT) * 1000;
  const hToMs = (h) => t0Ms + h * 3600000;
  const greatest = evalAt(greatestH);
  return {
    samples: out,
    p1: hToMs(p1H),
    p4: hToMs(p4H),
    greatest: hToMs(greatestH),
    l1Greatest: greatest.l1,
    l2Greatest: greatest.l2,
  };
}

// Sample the moon's sublunar point around `anchorDate` to build
// a solar-eclipse shadow path. Approximation: at the moments
// near greatest eclipse, the sun-moon-Earth axis is nearly
// aligned with the geocentric moon direction, so the umbra
// subpoint sits within a few hundred km of the sublunar point —
// fine for an overlay on a flat-earth / globe map at this
// project's scale. `moonFn(date)` follows the project's
// `{ ra, dec }` convention (radians) — pick the ephemeris pair
// from `eclipseRegistry.ephemerisPair(BodySource).moonFn`.
//
// Returns an array of `{ t, lat, lon }` where `t` is the offset
// from `anchorDate` in hours. Caller is free to pick the window
// (`halfWindowHours`) and sample density.
export function computeSolarEclipseShadowPath(anchorDate, moonFn, halfWindowHours = 2.0, samples = 33) {
  const out = [];
  const step = (halfWindowHours * 2) / Math.max(1, samples - 1);
  for (let i = 0; i < samples; i++) {
    const offsetH = -halfWindowHours + i * step;
    const date = new Date(anchorDate.getTime() + offsetH * 3_600_000);
    const moonEq = moonFn(date);
    if (!moonEq || !Number.isFinite(moonEq.ra) || !Number.isFinite(moonEq.dec)) continue;
    const gmstDeg = greenwichSiderealDeg(date);
    const lat = moonEq.dec * 180 / Math.PI;
    let lon = moonEq.ra * 180 / Math.PI - gmstDeg;
    lon = ((lon + 540) % 360) - 180;
    out.push({ t: offsetH, lat, lon });
  }
  return out;
}
