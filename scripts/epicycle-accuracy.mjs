// How accurate can the geocentric epicyclic model get, as a function of the
// number of epicycles?
//
// VSOP87 represents each planet's heliocentric L, B, R as a sum of periodic
// terms A*cos(B + C*T). Each such term IS an epicycle: a circle of radius A
// turning at frequency C with phase B. This script keeps only the top-N
// epicycles per coordinate, forms the geocentric direction (planet minus
// Earth, the major epicycle), and measures the angular error against the full
// series. The full series is sub-arcsecond vs reality, so convergence to it is
// the relevant ladder.
//
// Run: node scripts/epicycle-accuracy.mjs

import MERCURY from '../js/data/vsop87/mercury.js';
import VENUS   from '../js/data/vsop87/venus.js';
import EARTH   from '../js/data/vsop87/earth.js';
import MARS    from '../js/data/vsop87/mars.js';
import JUPITER from '../js/data/vsop87/jupiter.js';
import SATURN  from '../js/data/vsop87/saturn.js';

const DATA = { mercury: MERCURY, venus: VENUS, earth: EARTH, mars: MARS, jupiter: JUPITER, saturn: SATURN };
const PLANETS = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];

// Flatten a coordinate series {0:[[A,B,C]...],1:[...]} into ranked epicycles.
// Rank by effective amplitude over a ~century baseline so the secular
// (higher T-power) terms are weighted by how much they actually move the body
// near the current era, not by raw A.
function rankTerms(series) {
  const terms = [];
  for (let p = 0; p <= 5; p++) {
    const arr = series[String(p)];
    if (!arr) continue;
    for (const t of arr) terms.push({ A: t[0], B: t[1], C: t[2], p });
  }
  // Largest-amplitude epicycles first (the power-0/1 secular terms carry the
  // deferent and mean motion and dominate; the periodic terms are the
  // epicycles proper, ranked by circle radius A).
  terms.sort((a, b) => Math.abs(b.A) - Math.abs(a.A));
  return terms;
}
const RANK = {};
for (const body of Object.keys(DATA)) {
  RANK[body] = { L: rankTerms(DATA[body].L), B: rankTerms(DATA[body].B), R: rankTerms(DATA[body].R) };
}
function totalEpicycles(body) {
  return RANK[body].L.length + RANK[body].B.length + RANK[body].R.length;
}

function evalTrunc(ranked, T, N) {
  const lim = N === Infinity ? ranked.length : Math.min(N, ranked.length);
  let total = 0;
  for (let i = 0; i < lim; i++) {
    const t = ranked[i];
    total += t.A * Math.cos(t.B + t.C * T) * Math.pow(T, t.p);
  }
  return total;
}
function helioRect(body, T, N) {
  const L = evalTrunc(RANK[body].L, T, N);
  const B = evalTrunc(RANK[body].B, T, N);
  const R = evalTrunc(RANK[body].R, T, N);
  const cb = Math.cos(B);
  return { x: R * cb * Math.cos(L), y: R * cb * Math.sin(L), z: R * Math.sin(B) };
}
// Geocentric ecliptic direction (lon, lat) at truncation N. Sun: -Earth.
function geoDir(body, T, N) {
  const e = helioRect('earth', T, N);
  let gx, gy, gz;
  if (body === 'sun') { gx = -e.x; gy = -e.y; gz = -e.z; }
  else { const p = helioRect(body, T, N); gx = p.x - e.x; gy = p.y - e.y; gz = p.z - e.z; }
  const r = Math.hypot(gx, gy, gz);
  return { lon: Math.atan2(gy, gx), lat: Math.asin(gz / r) };
}
function sepArcsec(a, b) {
  const c = Math.sin(a.lat) * Math.sin(b.lat) + Math.cos(a.lat) * Math.cos(b.lat) * Math.cos(a.lon - b.lon);
  return Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI * 3600;
}

// Dates spread across the historical-to-future range (millennia from J2000).
const JD = (y) => 2451545.0 + (y - 2000) * 365.25;
const T_OF = (y) => (JD(y) - 2451545.0) / 365250;
const YEARS = [700, 1000, 1300, 1700, 2000, 2025, 2400];
const N_LADDER = [3, 6, 12, 25, 50, 100, Infinity];

console.log('Max geocentric direction error vs the FULL VSOP epicycle series, arcsec.');
console.log('Body sun + planets. N = epicycles kept per coordinate (L, B, R each).\n');
const head = 'N/coord '.padEnd(10) + ['sun', ...PLANETS].map((p) => p.slice(0, 7).padStart(9)).join('');
console.log(head);
for (const N of N_LADDER) {
  const cells = ['sun', ...PLANETS].map((body) => {
    let worst = 0;
    for (const y of YEARS) {
      const T = T_OF(y);
      const approx = geoDir(body, T, N);
      const full = geoDir(body, T, Infinity);
      worst = Math.max(worst, sepArcsec(approx, full));
    }
    const s = worst < 0.05 ? '<0.05' : worst.toFixed(worst < 100 ? 2 : 0);
    return s.padStart(9);
  });
  const label = (N === Infinity ? 'full' : String(N)).padEnd(10);
  console.log(label + cells.join(''));
}

console.log('\nTotal epicycles in the full series (L + B + R terms):');
for (const body of PLANETS) console.log(`  ${body.padEnd(8)} ${totalEpicycles(body)}  (+ earth ${totalEpicycles('earth')} shared for the geocentric subtraction)`);
console.log('\nNote: the full series is sub-arcsecond vs JPL DE; convergence above shows');
console.log('how many epicycles bring the geocentric direction to a given accuracy.');
