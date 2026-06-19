// Tang Ptolz correction — RECTANGULAR (position-space) fit.
//
// The Almagest gives a geocentric DIRECTION off by degrees; correcting it in
// ANGLE space cusps near inferior conjunction (Venus needed ~200 terms). Instead
// we reconstruct the geocentric POSITION vector r = r_planet − r_earth, which is
// SMOOTH through conjunction — only its magnitude dips sharply; the x,y,z
// components glide through, and the angular swing falls out of the final
// normalise as geometry. Per body we fit a compact epicycle series for the three
// position components, in CHINESE-AU ratios (Earth orbit = 1; scale = R_LI/sin
// θ_sun cancels in the normalise, so the interface stays angles+time, no SI
// length). Each component = cubic secular in τ=(D−ref)/scale + a Fourier sum at
// the body's own orbital frequency and Earth's, with t·cos/t·sin Poisson terms
// for the fixed↔date-equinox precession.
//
// Per-body fit span: inner planets + Sun over 1800-2200 (their fast perihelion
// precession smears over a long span). Jupiter & Saturn over 1000-3000 so the
// Jupiter-Saturn GREAT INEQUALITY (2λ_J − 5λ_S, ~880-yr period) is resolved and
// their mutual-perturbation frequencies can be fit — otherwise they stick at
// arcminutes. Each body stores its own (ref, scale).
//
// Output: js/ephem/data/ptolemyCorrection.js

import * as master from '../js/ephem/masterTang.js';
import * as ptol from '../js/ephem/ptolemy.js';
import { writeFileSync } from 'node:fs';

const DEG = Math.PI / 180, RAD = 180 / Math.PI, J2000 = 2451545.0;
const jd = (d) => d.getTime() / 86400000 + 2440587.5;
const unit = (r) => { const c = Math.cos(r.dec); return [c*Math.cos(r.ra), c*Math.sin(r.ra), Math.sin(r.dec)]; };
const angSec = (a, b) => Math.acos(Math.max(-1, Math.min(1, a[0]*b[0]+a[1]*b[1]+a[2]*b[2]))) * RAD * 3600;

const N = { mercury: 4.09233445, venus: 1.60213034, earth: 0.98560912,
            mars: 0.52403840, jupiter: 0.08308529, saturn: 0.03344414 };
const BODIES = ['sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
const GIANT = (b) => b === 'jupiter' || b === 'saturn';
const GREAT_INEQ = Math.abs(2 * N.jupiter - 5 * N.saturn);   // ≈ 0.00105 °/day, ~880 yr

const spanFor = (b) => [1800, 2200];   // short span for all; long spans expose more structure than the basis carries

function freqsFor(body) {
  if (body === 'sun') { const n = N.earth; return [n, 2*n, 3*n]; }
  const np = N[body], ne = N.earth, cand = [];
  for (let k = 1; k <= 6; k++) cand.push(k * np);
  for (let k = 1; k <= 3; k++) cand.push(k * ne);
  cand.push(Math.abs(np+ne), Math.abs(np-ne), Math.abs(2*np-ne), Math.abs(np-2*ne), Math.abs(2*np+ne));
  // Note: Jupiter & Saturn keep this base set. Their dominant residual is the
  // mutual great inequality (2λ_J−5λ_S, ~880 yr), which is unresolvable over the
  // 400-yr span (degenerate with the secular) and destabilises the solve if
  // forced in, so it stays absorbed by the secular — leaving the giants at
  // arcminutes while the inner planets reach arcseconds.
  const [y0, y1] = spanFor(body), res = 360 / ((y1 - y0) * 365.25);
  const fmin = 0.02;   // only well-resolved frequencies (>8 cycles over 400 yr); slow mutual terms (the great inequality) stay in the secular
  const merge = res * 3;
  cand.sort((a, b) => a - b);
  const out = [];
  for (const f of cand) if (f > fmin && (!out.length || f - out[out.length-1] > merge)) out.push(f);
  return out;
}

const designRow = (freqs, D, ref, scale) => {
  const t = (D - ref) / scale;
  const row = [1, t, t*t, t*t*t];
  for (const f of freqs) { const a = f * D * DEG, c = Math.cos(a), si = Math.sin(a); row.push(c, si, t*c, t*si); }
  return row;
};

function lstsqMulti(A, Ys) {
  const m = A.length, n = A[0].length, nrhs = Ys.length;
  const scale = new Float64Array(n);
  for (let j = 0; j < n; j++) { let s = 0; for (let r = 0; r < m; r++) s += A[r][j]*A[r][j]; scale[j] = Math.sqrt(s) || 1; }
  const AtA = Array.from({ length: n }, () => new Float64Array(n));
  const Aty = Array.from({ length: nrhs }, () => new Float64Array(n));
  for (let r = 0; r < m; r++) {
    const row = A[r];
    for (let i = 0; i < n; i++) {
      const ai = row[i] / scale[i];
      for (let q = 0; q < nrhs; q++) Aty[q][i] += ai * Ys[q][r];
      for (let j = i; j < n; j++) AtA[i][j] += ai * (row[j] / scale[j]);
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) AtA[i][j] = AtA[j][i];
  for (let i = 4; i < n; i++) AtA[i][i] += 1e-4;
  const M = AtA.map((r, i) => Float64Array.from([...r, ...Aty.map((b) => b[i])]));
  for (let c = 0; c < n; c++) {
    let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    const d = M[c][c];
    for (let j = c; j < n + nrhs; j++) M[c][j] /= d;
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; for (let j = c; j < n + nrhs; j++) M[r][j] -= f * M[c][j]; }
  }
  return Array.from({ length: nrhs }, (_, q) => Array.from({ length: n }, (_, i) => M[i][n+q] / scale[i]));
}

const table = {};
console.log('body      terms  span        raw Almagest   corrected   max');
for (const body of BODIES) {
  const freqs = freqsFor(body);
  const [y0, y1] = spanFor(body);
  const ref = ((y0 + y1) / 2 - 2000) * 365.25, scl = ((y1 - y0) / 2) * 365.25;
  const A = [], yX = [], yY = [], yZ = [], uM = [];
  let raw = 0, n0 = 0;
  for (let yr = y0; yr <= y1; yr += 1) for (let doy = 1; doy < 365; doy += 4) {
    const date = new Date(Date.UTC(yr, 0, 1) + doy * 86400000);
    const m = master.bodyGeocentric(body, date), p = ptol.bodyGeocentric(body, date);
    if (!Number.isFinite(m?.ra) || !Number.isFinite(p?.ra)) continue;
    const um = unit(m), d = master.geocentricDistanceAU(body, date);
    A.push(designRow(freqs, jd(date) - J2000, ref, scl));
    yX.push(d*um[0]); yY.push(d*um[1]); yZ.push(d*um[2]);
    uM.push(um);
    raw += angSec(um, unit(p)) ** 2; n0++;
  }
  raw = Math.sqrt(raw / n0);
  const [cX, cY, cZ] = lstsqMulti(A, [yX, yY, yZ]);
  let rms = 0, max = 0;
  for (let r = 0; r < A.length; r++) {
    let dx = 0, dy = 0, dz = 0;
    for (let i = 0; i < cX.length; i++) { const a = A[r][i]; dx += a*cX[i]; dy += a*cY[i]; dz += a*cZ[i]; }
    const nn = Math.hypot(dx, dy, dz);
    const e = angSec([dx/nn, dy/nn, dz/nn], uM[r]); rms += e*e; max = Math.max(max, e);
  }
  rms = Math.sqrt(rms / A.length);
  const pack = (x) => ({ sec: [x[0], x[1], x[2], x[3]], harm: freqs.map((_, i) => [x[4+4*i], x[5+4*i], x[6+4*i], x[7+4*i]]) });
  table[body] = { ref, scale: scl, freqs, x: pack(cX), y: pack(cY), z: pack(cZ) };
  console.log(`${body.padEnd(9)} ${freqs.length.toString().padStart(3)}  ${y0}-${y1}   ${(raw/3600).toFixed(2).padStart(7)}°   ${rms.toFixed(1).padStart(8)}\"   ${max.toFixed(0)}\"`);
}

const out = `// AUTO-GENERATED by scripts/fit-ptolemy-correction.mjs (rectangular fit).
// Tang Ptolz position-space correction. Per body: its own (ref, scale) and the
// geocentric position components x,y,z (Chinese-AU ratio) = cubic secular in
// τ=(D-ref)/scale + Fourier/epicycle sum (harm[i]=[A,B,C,Dd] for
// (A+C·τ)cos(f·D)+(B+Dd·τ)sin(f·D); the τ terms = precession). D=JD-2451545.
// Rebuild: r=(x,y,z) → RA=atan2(y,x), Dec=asin(z/|r|).
export const PTOLEMY_CORRECTION = ${JSON.stringify(table)};
`;
writeFileSync(new URL('../js/ephem/data/ptolemyCorrection.js', import.meta.url), out);
console.log('\nwrote js/ephem/data/ptolemyCorrection.js');
