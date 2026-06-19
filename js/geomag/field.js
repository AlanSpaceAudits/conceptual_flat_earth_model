// Geomagnetic field synthesis — declination, inclination, intensity from the
// WMM2025 / IGRF-14 spherical-harmonic (Gauss) coefficients.
//
// Port of NOAA's geomag70 shval3 algorithm (Malin & Barraclough), the canonical
// reference implementation. Schmidt semi-normalised associated Legendre
// recursion; geodetic input converted to geocentric on the WGS84 ellipsoid, the
// field summed in the geocentric frame and rotated back to geodetic. Validated
// against the official WMM2025 test-value table (scripts/validate-geomag.mjs).
//
// fieldAt(model, latDeg, lonDeg, altKm, decimalYear) -> { X, Y, Z, H, F, D, I }
//   X north, Y east, Z down (nT); H horizontal, F total (nT); D declination,
//   I inclination (degrees). Models: WMM2025 / IGRF14 (js/geomag/data/).

import { WMM2025 } from './data/wmm2025.js';
import { IGRF14 } from './data/igrf14.js';

const EARTH_R = 6371.2;        // geomagnetic reference radius, km
const A2 = 40680631.6;         // WGS84 equatorial radius^2, km^2
const B2 = 40408296.0;         // WGS84 polar radius^2, km^2
const DTR = Math.PI / 180;

export const MODELS = { wmm: WMM2025, igrf: IGRF14 };

// Flat g/h array in geomag70 order (1-indexed): g(1,0) g(1,1) h(1,1) g(2,0) ...
// time-adjusted to `year`. Returns { gh, nMax }.
function buildGH(model, year) {
  const nMax = model.nMax;
  const gh = [0];                                  // gh[0] unused
  // (n,m) -> {g,h} adjusted to year
  const at = new Map();
  if (model.kind === 'wmm') {
    const t = year - model.epoch;                  // years from epoch (extrapolate via SV)
    for (const [n, m, g, h, gd, hd] of model.coeffs) at.set(`${n},${m}`, { g: g + t * gd, h: h + t * hd });
  } else {
    const ep = model.epochs, last = ep[ep.length - 1];
    const y = Math.max(model.validFrom, Math.min(model.validTo, year));
    for (const [n, m, gArr, hArr, gsv, hsv] of model.coeffs) {
      let g, h;
      if (y >= last) { const dt = y - last; g = gArr[gArr.length - 1] + dt * gsv; h = hArr[hArr.length - 1] + dt * hsv; }
      else {
        let i = 0; while (i < ep.length - 1 && ep[i + 1] <= y) i++;
        const f = (y - ep[i]) / (ep[i + 1] - ep[i]);
        g = gArr[i] + f * (gArr[i + 1] - gArr[i]);
        h = hArr[i] + f * (hArr[i + 1] - hArr[i]);
      }
      at.set(`${n},${m}`, { g, h });
    }
  }
  for (let n = 1; n <= nMax; n++) for (let m = 0; m <= n; m++) {
    const c = at.get(`${n},${m}`) || { g: 0, h: 0 };
    gh.push(c.g);
    if (m > 0) gh.push(c.h);
  }
  return { gh, nMax };
}

// shval3: field components at geodetic lat/lon (deg), altitude (km) above ellipsoid.
function shval3(flat, flon, elev, nMax, gh) {
  const slatIn = Math.sin(flat * DTR);
  const flatAdj = (90.0 - flat) < 0.001 ? 89.999 : (90.0 + flat) < 0.001 ? -89.999 : flat;
  let slat = Math.sin(flatAdj * DTR);
  let clat = Math.cos(flatAdj * DTR);
  const sl = [0, Math.sin(flon * DTR)];
  const cl = [0, Math.cos(flon * DTR)];
  const p = new Array((nMax * (nMax + 3)) / 2 + 1).fill(0);
  const q = new Array(p.length).fill(0);
  let x = 0, y = 0, z = 0;

  // geodetic -> geocentric
  let aa = A2 * clat * clat, bb = B2 * slat * slat, cc = aa + bb;
  const dd = Math.sqrt(cc);
  const r = Math.sqrt(elev * (elev + 2.0 * dd) + (A2 * aa + B2 * bb) / cc);
  const cd = (elev + dd) / r;
  const sd = (A2 - B2) / dd * slat * clat / r;
  aa = slat; slat = slat * cd - clat * sd; clat = clat * cd + aa * sd;
  const ratio = EARTH_R / r;
  let rr = 0;

  const sq3 = Math.sqrt(3.0);
  p[1] = 2.0 * slat; p[2] = 2.0 * clat; p[3] = 4.5 * slat * slat - 1.5; p[4] = sq3 * 3.0 * clat * slat;
  q[1] = -clat;      q[2] = slat;       q[3] = -3.0 * clat * slat;      q[4] = sq3 * (slat * slat - clat * clat);

  let l = 1, n = 0, m = 1, fn = 0, fm = 1;
  const npq = (nMax * (nMax + 3)) / 2;
  for (let k = 1; k <= npq; k++) {
    if (n < m) { m = 0; n++; rr = Math.pow(ratio, n + 2); fn = n; }
    fm = m;
    if (k >= 5) {
      if (m === n) {
        aa = Math.sqrt(1.0 - 0.5 / fm);
        const j = k - n - 1;
        p[k] = (1.0 + 1.0 / fm) * aa * clat * p[j];
        q[k] = aa * (clat * q[j] + slat / fm * p[j]);
        sl[m] = sl[m - 1] * cl[1] + cl[m - 1] * sl[1];
        cl[m] = cl[m - 1] * cl[1] - sl[m - 1] * sl[1];
      } else {
        aa = Math.sqrt(fn * fn - fm * fm);
        bb = Math.sqrt((fn - 1.0) * (fn - 1.0) - fm * fm) / aa;
        cc = (2.0 * fn - 1.0) / aa;
        const ii = k - n, j = k - 2 * n + 1;
        p[k] = (fn + 1.0) * (cc * slat / fn * p[ii] - bb / (fn - 1.0) * p[j]);
        q[k] = cc * (slat * q[ii] - clat / fn * p[ii]) - bb * q[j];
      }
    }
    aa = rr * gh[l];
    if (m === 0) {
      x += aa * q[k];
      z -= aa * p[k];
      l++;
    } else {
      const bbv = rr * gh[l + 1];
      const cct = aa * cl[m] + bbv * sl[m];   // g·cos(mλ) + h·sin(mλ)  (X, Z)
      x += cct * q[k];
      z -= cct * p[k];
      if (clat > 0) y += (aa * sl[m] - bbv * cl[m]) * fm * p[k] / ((fn + 1.0) * clat);
      else          y += (aa * sl[m] - bbv * cl[m]) * q[k] * slat;
      l += 2;
    }
    m++;   // advance (n,m): m runs 0..n, then the top of the loop resets m=0, n++
  }
  // rotate geocentric -> geodetic
  aa = x;
  x = x * cd + z * sd;
  z = z * cd - aa * sd;
  return { X: x, Y: y, Z: z };
}

export function fieldAt(modelKey, latDeg, lonDeg, altKm, decimalYear) {
  const model = typeof modelKey === 'string' ? MODELS[modelKey] : modelKey;
  const { gh, nMax } = buildGH(model, decimalYear);
  const { X, Y, Z } = shval3(latDeg, lonDeg, altKm, nMax, gh);
  const H = Math.hypot(X, Y);
  const F = Math.hypot(H, Z);
  const D = Math.atan2(Y, X) / DTR;
  const I = Math.atan2(Z, H) / DTR;
  return { X, Y, Z, H, F, D, I };
}
