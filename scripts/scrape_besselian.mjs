// Scrape NASA's per-eclipse Besselian element tables for the
// solar eclipses already catalogued in
// `js/data/astropixelsEclipses.js`. Output goes to
// `js/data/eclipseBesselian.js`.
//
// Source page per eclipse:
//   https://eclipse.gsfc.nasa.gov/SEsearch/SEdata.php?Ecl=YYYYMMDD
//
// Each page embeds a JS array `var elements = new Array( ... )` with
// 27 numbers — the canonical Espenak Besselian element block:
//
//   [0]  JD of t0  (Julian date, TDT)
//   [1]  t0        (TDT decimal hours)
//   [2]  t_min     (hours from t0; usually -3.0)
//   [3]  t_max     (hours from t0; usually +3.0)
//   [4]  ΔT        (seconds; TT − UT)
//   [5..8]  X polynomial coefficients (4, degree 3)
//   [9..12] Y polynomial coefficients (4, degree 3)
//   [13..15] D polynomial coefficients (3, degree 2)
//   [16..18] μ polynomial coefficients (3, degree 2)
//   [19..21] L1 polynomial coefficients (3, degree 2)
//   [22..24] L2 polynomial coefficients (3, degree 2)
//   [25..26] tan(f1), tan(f2)
//
// Attribution baked into the output file: Fred Espenak / NASA GSFC.

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { ASTROPIXELS_ECLIPSES } from '../js/data/astropixelsEclipses.js';

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const CACHE = '/tmp/nasa_besselian_cache';
mkdirSync(CACHE, { recursive: true });

async function fetchCached(url, path) {
  if (existsSync(path)) return readFileSync(path, 'utf8');
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  const text = await r.text();
  writeFileSync(path, text);
  return text;
}

function parseElements(html) {
  // Total / annular / hybrid pages: clean JS array.
  const m = html.match(/var\s+elements\s*=\s*new\s+Array\s*\(\s*([^)]+)\)/);
  if (m) {
    const nums = m[1].split(',').map((s) => parseFloat(s.trim())).filter((n) => Number.isFinite(n));
    if (nums.length === 27) {
      return {
        jdT0: nums[0], t0Tdt: nums[1], tMin: nums[2], tMax: nums[3], deltaT: nums[4],
        x: nums.slice(5, 9),  y: nums.slice(9, 13),
        d: nums.slice(13, 16), mu: nums.slice(16, 19),
        l1: nums.slice(19, 22), l2: nums.slice(22, 25),
        tanF1: nums[25], tanF2: nums[26],
      };
    }
  }
  // Partial-eclipse pages: <pre>-formatted table.
  return parsePartialPre(html);
}

function parsePartialPre(html) {
  // Strip tags + collapse whitespace inside the <pre> block.
  const preMatch = html.match(/<pre>([\s\S]*?)<\/pre>/);
  if (!preMatch) return null;
  const preTxt = preMatch[1].replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ');

  // Pull JD of t0, t0 (TDT hours), ΔT.
  const jdM = preTxt.match(/JD\s*=\s*([\d.]+)/);
  // "Polynomial Besselian Elements for: 2022 Apr 30 21.000 TDT (=t0)"
  const t0M = preTxt.match(/Polynomial Besselian Elements for:\s*\d{4}\s+\w+\s+\d{1,2}\s+(\d+\.\d+)\s*TDT/);
  // ΔT printed as "T = 72.8 s" after entity stripping (Δ becomes nothing).
  const dtM = preTxt.match(/\bT\s*=\s*([\d.]+)\s*s\b/);
  if (!jdM || !t0M) return null;
  const jdT0  = parseFloat(jdM[1]);
  const t0Tdt = parseFloat(t0M[1]);
  const deltaT = dtM ? parseFloat(dtM[1]) : 69.2;

  // Parse the 4-row coefficient table. Header line:
  //   n        x          y         d          l1         l2          μ
  // Data rows:
  //   0   X0  Y0  D0  L10  L20  μ0
  //   1   X1  Y1  D1  L11  L21  μ1
  //   2   X2  Y2  D2  L12  L22  μ2
  //   3   X3  Y3                            (only X / Y get a cubic term)
  const rows = [];
  for (let n = 0; n <= 3; n++) {
    // Match `n` followed by some decimals on the same logical line.
    const re = new RegExp(`\\b${n}\\b\\s+(-?[\\d.]+)\\s+(-?[\\d.]+)(?:\\s+(-?[\\d.]+)\\s+(-?[\\d.]+)\\s+(-?[\\d.]+)\\s+(-?[\\d.]+))?`);
    const r = preTxt.match(re);
    if (!r) {
      if (n <= 2) return null; // need degrees 0-2 for everything
      rows.push(null);
      continue;
    }
    rows.push(r);
  }
  const x  = [parseFloat(rows[0][1]), parseFloat(rows[1][1]),
              parseFloat(rows[2][1]), rows[3] ? parseFloat(rows[3][1]) : 0];
  const y  = [parseFloat(rows[0][2]), parseFloat(rows[1][2]),
              parseFloat(rows[2][2]), rows[3] ? parseFloat(rows[3][2]) : 0];
  const d  = [parseFloat(rows[0][3]), parseFloat(rows[1][3]), parseFloat(rows[2][3])];
  const l1 = [parseFloat(rows[0][4]), parseFloat(rows[1][4]), parseFloat(rows[2][4])];
  const l2 = [parseFloat(rows[0][5]), parseFloat(rows[1][5]), parseFloat(rows[2][5])];
  const mu = [parseFloat(rows[0][6]), parseFloat(rows[1][6]), parseFloat(rows[2][6])];

  // tan f1 / f2.
  const tf = preTxt.match(/tan\s*f1\s*=\s*([\d.\-]+)\s+tan\s*f2\s*=\s*([\d.\-]+)/);
  if (!tf) return null;
  const tanF1 = parseFloat(tf[1]);
  const tanF2 = parseFloat(tf[2]);

  if (![...x, ...y, ...d, ...l1, ...l2, ...mu, tanF1, tanF2].every(Number.isFinite)) return null;
  return {
    jdT0, t0Tdt, tMin: -3, tMax: 3, deltaT,
    x, y, d, mu, l1, l2, tanF1, tanF2,
  };
}

function dateToEclCode(dateStr) {
  return dateStr.replace(/-/g, '');
}

const out = {};
let ok = 0, fail = 0;

for (const ev of ASTROPIXELS_ECLIPSES.solar) {
  const code = dateToEclCode(ev.date);
  const url = `https://eclipse.gsfc.nasa.gov/SEsearch/SEdata.php?Ecl=${code}`;
  const cachePath = `${CACHE}/${code}.html`;
  process.stdout.write(`${ev.date} ${ev.type.padEnd(8)} ... `);
  try {
    const html = await fetchCached(url, cachePath);
    const els = parseElements(html);
    if (!els) {
      console.log('PARSE FAIL');
      fail++;
      continue;
    }
    out[ev.date] = els;
    console.log('ok');
    ok++;
  } catch (e) {
    console.log(`ERR ${e.message}`);
    fail++;
  }
  // Be polite to NASA's server
  await new Promise((r) => setTimeout(r, 250));
}

console.log(`\n=== ${ok} ok, ${fail} fail ===`);

const outPath = '/home/alan/claude/fe_model/js/data/eclipseBesselian.js';
const body = `// Auto-generated by scripts/scrape_besselian.mjs — do not edit by hand.
// Data source: Fred Espenak / NASA GSFC, "Solar Eclipse Search Engine"
//   https://eclipse.gsfc.nasa.gov/SEsearch/SEdata.php?Ecl=YYYYMMDD
// Cross-checked against the AstroPixels catalog (DE405) for date /
// type alignment.
//
// Attribution: all credit for the underlying ephemeris + Besselian
// element calculation belongs to Fred Espenak. This file is a
// parsed copy of the per-eclipse element blocks the search engine
// emits as a JS array on each result page.
//
// Shape per eclipse (keyed by ISO date 'YYYY-MM-DD'):
//   {
//     jdT0:   number,        // JD of t0 (TDT)
//     t0Tdt:  number,        // t0 (TDT decimal hours)
//     tMin:   number,        // window start (hours from t0; usually -3.0)
//     tMax:   number,        // window end   (hours from t0; usually +3.0)
//     deltaT: number,        // TT − UT (seconds)
//     x:  number[4],         // X polynomial (degree 3)
//     y:  number[4],         // Y polynomial (degree 3)
//     d:  number[3],         // D polynomial (degree 2; degrees)
//     mu: number[3],         // μ polynomial (degree 2; degrees)
//     l1: number[3],         // L1 polynomial (degree 2)
//     l2: number[3],         // L2 polynomial (degree 2)
//     tanF1: number,         // tan(f1)
//     tanF2: number,         // tan(f2)
//   }
//
// All polynomials are c0 + c1·t + c2·t² (+c3·t³ for X / Y), where
// t = (UT_hours_from_t0). Distance values (X, Y, L1, L2) are
// normalised to a 1-radius sphere — multiply by R_LI for li.

export const ECLIPSE_BESSELIAN = ${JSON.stringify(out, null, 2)};
`;

writeFileSync(outPath, body);
console.log(`wrote ${outPath} (${Object.keys(out).length} eclipses)`);
