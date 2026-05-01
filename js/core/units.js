// Chinese astronomical units (du / fen / li / bu).
//
// The Tang-era empirical calibration from the Xin Tangshu (Yi Xing,
// 8th c. CE) ties an angular du (1/365.25 of the celestial circle)
// to a ground distance of 351 li 80 bu of north-south travel along
// a meridian. That's the cleaner working ratio — the older Zhoubi
// "1 cun shadow per 1000 li" rule produces a wildly varying angular
// yield depending on the solar term and was effectively replaced by
// Yi Xing's du-based formula.
//
// References: `~/Documents/multi_2/Notes/Chinese_FE.md`,
// "Doc 9: Baidu Baike — Yixing entry" (line 449+).

export const DEG_PER_DU = 360 / 365.25;          // ≈ 0.985626283…
export const DU_PER_DEG = 365.25 / 360;          // ≈ 1.014583
export const FEN_PER_DU = 10;
export const LI_PER_DU  = 351.267;               // 351 li 80 bu, Yi Xing
export const BU_PER_LI  = 300;

// Tang sphere primitive — internal-system constants.
// Great-circle circumference falls out directly: 365.25 du × 351.267
// li/du = 128,300 li per great circle (within rounding). Sphere
// radius and diameter are 2π/π scalings of that, no SI smuggled in.
export const TANG_CIRCUMFERENCE_LI = LI_PER_DU * 365.25;       // ≈ 128,300.27
export const R_LI = TANG_CIRCUMFERENCE_LI / (2 * Math.PI);     // ≈ 20,419.49

// SI bridge (post-hoc): same logic as inch ↔ cm. The ratio of the
// two systems' reported circumferences IS the unit conversion. Using
// the WGS84 polar circumference (40,007.863 km) as the SI anchor.
export const KM_PER_LI = 40007.863 / TANG_CIRCUMFERENCE_LI;    // ≈ 0.31183

// Convert degrees → du.
export function degToDu(deg) {
  return deg * DU_PER_DEG;
}

// "23 du 7.8 fen" — DMS-style two-part split, sign-prefixed when
// the input is negative. Mirrors the look of `fmtSignedDms` so the
// two readouts can sit side by side without one looking out of
// place.
export function fmtDuFen(deg, signed = false) {
  if (!Number.isFinite(deg)) return '—';
  const totalDu = deg * DU_PER_DEG;
  const sign = totalDu < 0 ? '−' : (signed ? '+' : '');
  const abs  = Math.abs(totalDu);
  const du   = Math.floor(abs);
  const fen  = (abs - du) * FEN_PER_DU;
  return `${sign}${du} du ${fen.toFixed(1)} fen`;
}

// "1861 li 214 bu" — DMS-style two-part split for a *distance*
// derived from an angular separation along a meridian, using Yi
// Xing's 351.267 li/du calibration. Always unsigned (distance is
// magnitude only).
export function fmtLiBu(deg) {
  if (!Number.isFinite(deg)) return '—';
  const totalDu = Math.abs(deg) * DU_PER_DEG;
  const totalLi = totalDu * LI_PER_DU;
  const li = Math.floor(totalLi);
  const bu = Math.round((totalLi - li) * BU_PER_LI);
  return `${li} li ${bu} bu`;
}

// "1861 li 214 bu" formatter for a li distance directly (no degree
// detour). Mirrors `fmtLiBu` semantics for callers that already
// have li.
export function fmtLiBuFromLi(totalLi) {
  if (!Number.isFinite(totalLi)) return '—';
  const abs = Math.abs(totalLi);
  const li = Math.floor(abs);
  const bu = Math.round((abs - li) * BU_PER_LI);
  return `${li} li ${bu} bu`;
}

// -------------------------------------------------------------------------
// Tang-li geometric primitives — `R_li × θ` form
// -------------------------------------------------------------------------
//
// All distances below are returned in li using the Tang sphere
// primitive (R_LI = 20,419.49). Mathematically equivalent to going
// through `degrees × 365.25/360 × 351.267` (the path `fmtLiBu`
// already takes), but exposed here as standalone primitives so
// callers can request distance without going through the popup
// formatters.

// Great-circle distance via haversine, output in Tang li.
// Inputs in degrees, output in li.
export function haversineLi(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
  const φ1 = lat1Deg * Math.PI / 180;
  const φ2 = lat2Deg * Math.PI / 180;
  const dφ = (lat2Deg - lat1Deg) * Math.PI / 180;
  const dλ = (lon2Deg - lon1Deg) * Math.PI / 180;
  const a  = Math.sin(dφ / 2) ** 2
           + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * R_LI * Math.asin(Math.min(1, Math.sqrt(a)));
}

// Great-circle distance via radial-vector dot product, output in
// Tang li. Equivalent to `haversineLi` (modulo floating-point);
// exposed as a separate function so calling code can cross-check.
export function dotProductDistLi(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
  const φ1 = lat1Deg * Math.PI / 180;
  const φ2 = lat2Deg * Math.PI / 180;
  const dλ = (lon2Deg - lon1Deg) * Math.PI / 180;
  const cosC = Math.sin(φ1) * Math.sin(φ2)
             + Math.cos(φ1) * Math.cos(φ2) * Math.cos(dλ);
  return R_LI * Math.acos(Math.max(-1, Math.min(1, cosC)));
}

// Lat/lon → unit-sphere xyz. Output is dimensionless (length 1);
// multiply by R_LI to get a position vector in li.
export function latLonToUnitVec(latDeg, lonDeg) {
  const φ = latDeg * Math.PI / 180;
  const λ = lonDeg * Math.PI / 180;
  const cosφ = Math.cos(φ);
  return {
    x: cosφ * Math.cos(λ),
    y: cosφ * Math.sin(λ),
    z: Math.sin(φ),
  };
}

// Straight-line (chord) distance between two surface points, in li.
// Differs from haversine: haversine is the great-circle arc *along*
// the surface; chord is the straight tunnel from p1 to p2 through
// the sphere's interior. For small separations the two values
// are within rounding.
export function chordLi(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
  const a = latLonToUnitVec(lat1Deg, lon1Deg);
  const b = latLonToUnitVec(lat2Deg, lon2Deg);
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  return R_LI * Math.sqrt(dx * dx + dy * dy + dz * dz);
}
