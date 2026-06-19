// Convert the authoritative geomagnetic coefficient files into compact JS data
// modules the runtime imports. Source files (public domain):
//   js/geomag/data/WMM2025.COF       — NOAA NCEI World Magnetic Model 2025
//   js/geomag/data/igrf14coeffs.txt  — IAGA International Geomagnetic Ref Field 14
// Output:
//   js/geomag/data/wmm2025.js, js/geomag/data/igrf14.js
import { readFileSync, writeFileSync } from 'node:fs';

const dir = new URL('../js/geomag/data/', import.meta.url);

// --- WMM2025.COF: header epoch line, then "n m g h gdot hdot", end at 9999... ---
const wmm = readFileSync(new URL('WMM2025.COF', dir), 'utf8').split('\n');
const wmmEpoch = parseFloat(wmm[0].trim().split(/\s+/)[0]);
const wmmCoeffs = [];
for (let i = 1; i < wmm.length; i++) {
  const t = wmm[i].trim();
  if (!t || t.startsWith('9999')) break;
  const p = t.split(/\s+/).map(Number);
  wmmCoeffs.push([p[0], p[1], p[2], p[3], p[4], p[5]]);  // n m g h gdot hdot
}
const wmmNmax = Math.max(...wmmCoeffs.map((c) => c[0]));
writeFileSync(new URL('wmm2025.js', dir),
`// AUTO-GENERATED from WMM2025.COF (NOAA NCEI, public domain). Do not edit.
// World Magnetic Model 2025; valid 2025.0-2030.0. coeffs: [n, m, g, h, gdot, hdot] (nT, nT/yr).
export const WMM2025 = { name: 'WMM2025', kind: 'wmm', epoch: ${wmmEpoch}, nMax: ${wmmNmax}, validFrom: 2025.0, validTo: 2030.0,
  coeffs: ${JSON.stringify(wmmCoeffs)} };
`);
console.log(`WMM2025: ${wmmCoeffs.length} coeffs, nMax ${wmmNmax}, epoch ${wmmEpoch}`);

// --- igrf14coeffs.txt: "g/h n m <value per epoch 1900..2025> <SV 2025-30>" ---
const igrfRaw = readFileSync(new URL('igrf14coeffs.txt', dir), 'utf8').split('\n');
const hi = igrfRaw.findIndex((l) => l.trim().startsWith('g/h'));
const headerCols = igrfRaw[hi].trim().split(/\s+/).slice(3);     // ['1900.0',...,'2025.0','2025-30']
const epochs = headerCols.slice(0, -1).map(parseFloat);          // 1900..2025
const map = new Map();
for (let i = hi + 1; i < igrfRaw.length; i++) {
  const t = igrfRaw[i].trim();
  if (!t) continue;
  const p = t.split(/\s+/);
  const gh = p[0], n = +p[1], m = +p[2];
  const vals = p.slice(3).map(Number);                          // epochs.length + 1 (SV)
  const key = `${n},${m}`;
  if (!map.has(key)) map.set(key, { n, m, g: new Array(epochs.length).fill(0), h: new Array(epochs.length).fill(0), gsv: 0, hsv: 0 });
  const e = map.get(key);
  const series = vals.slice(0, epochs.length), sv = vals[epochs.length];
  if (gh === 'g') { e.g = series; e.gsv = sv; } else { e.h = series; e.hsv = sv; }
}
const igrfCoeffs = [...map.values()].sort((a, b) => a.n - b.n || a.m - b.m)
  .map((e) => [e.n, e.m, e.g, e.h, e.gsv, e.hsv]);
const igrfNmax = Math.max(...igrfCoeffs.map((c) => c[0]));
writeFileSync(new URL('igrf14.js', dir),
`// AUTO-GENERATED from igrf14coeffs.txt (IAGA/NOAA, public domain). Do not edit.
// IGRF-14; epochs 1900-2025 + secular variation to 2030. coeffs: [n, m, gPerEpoch[], hPerEpoch[], gsv, hsv].
export const IGRF14 = { name: 'IGRF-14', kind: 'igrf', nMax: ${igrfNmax}, epochs: ${JSON.stringify(epochs)},
  validFrom: ${epochs[0]}, validTo: 2030.0,
  coeffs: ${JSON.stringify(igrfCoeffs)} };
`);
console.log(`IGRF14: ${igrfCoeffs.length} coeffs, nMax ${igrfNmax}, ${epochs.length} epochs ${epochs[0]}-${epochs[epochs.length-1]}`);
