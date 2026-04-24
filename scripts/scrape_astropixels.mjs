// Scrape Fred Espenak's "AstroPixels" geocentric ephemeris tables and
// emit a compact JS data module. One-time script — run once per update
// of the source tables, then commit the resulting `js/data/astropixels.js`.
//
// Data source:
//   Fred Espenak, "AstroPixels — Ephemeris"
//   https://www.astropixels.com/ephemeris/ephemeris.html
//   Tables generated from JPL DE405 planetary and lunar ephemerides.
//
// Attribution:
//   Credit: Fred Espenak (AstroPixels). Data used in this simulator
//   with attribution in every consuming module; see
//   `js/core/ephemerisAstropixels.js` for the runtime module.
//
// Scope:
//   Years 2019–2030 (the full range Espenak currently publishes on
//   astropixels.com at scrape time, 2026-04-23). Bodies: sun, moon,
//   mercury, venus, mars, jupiter, saturn, uranus, neptune. Daily at
//   00:00 UTC. (S221 extension: Uranus + Neptune added. Pluto is not
//   published on AstroPixels — index search returned zero matches —
//   so it isn't in this bundle.)
//
// Extraction:
//   Each table row is fixed-width text inside a <pre>…</pre> block.
//   Columns 2 and 3 are always RA (h m s) and Dec (±° ' ") regardless
//   of body. All other columns (distance, magnitude, phase, etc.) are
//   discarded — only geocentric apparent RA/Dec is needed for the sim.
//
// Output format (`js/data/astropixels.js`):
//   export const ASTROPIXELS = {
//     meta: { source, generatedAt, yearMin, yearMax, bodies },
//     // per-body: { year: Float64Array([raSec, decArcsec, raSec, decArcsec, ...]) }
//     // ordered by day-of-year starting Jan 1. 365 or 366 rows.
//     sun: { 2019: [...], 2020: [...], ... },
//     moon: { ... },
//     mercury: { ... },
//     ...
//   };

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const BODY_PATHS = {
  sun:     (y) => `https://www.astropixels.com/ephemeris/sun/sun${y}.html`,
  moon:    (y) => `https://www.astropixels.com/ephemeris/moon/moon${y}.html`,
  mercury: (y) => `https://www.astropixels.com/ephemeris/planets/mercury${y}.html`,
  venus:   (y) => `https://www.astropixels.com/ephemeris/planets/venus${y}.html`,
  mars:    (y) => `https://www.astropixels.com/ephemeris/planets/mars${y}.html`,
  jupiter: (y) => `https://www.astropixels.com/ephemeris/planets/jupiter${y}.html`,
  saturn:  (y) => `https://www.astropixels.com/ephemeris/planets/saturn${y}.html`,
  // Uranus + Neptune follow the same path pattern as the
  // inner planets; verified 2026-04-24. Pluto is not published on
  // AstroPixels at all, so it's absent from this bundle.
  uranus:  (y) => `https://www.astropixels.com/ephemeris/planets/uranus${y}.html`,
  neptune: (y) => `https://www.astropixels.com/ephemeris/planets/neptune${y}.html`,
};

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
const CACHE = '/tmp/astropixels_cache';
mkdirSync(CACHE, { recursive: true });

async function fetchCached(url, cachePath) {
  if (existsSync(cachePath)) return readFileSync(cachePath, 'utf8');
  process.stdout.write(`  fetch ${url} … `);
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' } });
  if (!res.ok) { console.log(`HTTP ${res.status}`); return null; }
  const text = await res.text();
  writeFileSync(cachePath, text);
  console.log(`${text.length} bytes`);
  await new Promise(r => setTimeout(r, 750));   // be polite
  return text;
}

// Parse a single row "  Jan 01   … RA_h RA_m RA_s.ss   ±Dec_d Dec_m Dec_s.s …"
// and return [raSec, decArcsec] or null.
//
// Row formats differ across bodies:
//   Planets : "  Jan 01   17 16 17.21   -21 56 29.2   …"
//   Moon    : "  Jan 01   19 46 43.32   -25 51 37.6   …"
//   Sun     : "  Jan 01   10676.5   06:43:36.1   -03:26.3    18 47 02.44   -22 59 53.5   …"
// The Sun inserts JD / GMST / EoT columns before RA/Dec. So we first
// gate on a month+day prefix, then search for the RA-Dec pattern
// anywhere in the rest of the line. The RA/Dec pattern is specific
// enough (two-digit fields with decimal seconds) not to false-match
// any of the other columns in any body type.
const PREFIX_RE = /^\s*([A-Z][a-z][a-z])\s+(\d+)\b/;
const RADEC_RE  = /\b(\d{1,2})\s+(\d{1,2})\s+(\d{1,2}\.\d+)\s+([+-]\d{1,2})\s+(\d{1,2})\s+(\d{1,2}\.\d+)\b/;
function parseRow(line) {
  if (!PREFIX_RE.test(line)) return null;
  const m = line.match(RADEC_RE);
  if (!m) return null;
  const [, rh, rm, rs, ds, dm, dss] = m;
  const raSec    = (+rh) * 3600 + (+rm) * 60 + (+rs);
  const decSign  = ds.startsWith('-') ? -1 : 1;
  const decDeg   = Math.abs(+ds);
  const decArcsec = decSign * (decDeg * 3600 + (+dm) * 60 + (+dss));
  return [raSec, decArcsec];
}

// Parse a whole-year page for one body. Returns Float64Array of
// [ra0, dec0, ra1, dec1, …] length 2*N where N is 365 or 366.
function parseYear(html) {
  const rows = [];
  for (const raw of html.split(/\r?\n/)) {
    const row = parseRow(raw);
    if (row) rows.push(row);
  }
  const out = new Float64Array(rows.length * 2);
  for (let i = 0; i < rows.length; i++) {
    out[2 * i]     = rows[i][0];
    out[2 * i + 1] = rows[i][1];
  }
  return out;
}

async function main() {
  const result = {
    meta: {
      source: 'Fred Espenak, AstroPixels — https://www.astropixels.com/ephemeris/',
      note:   'Precomputed from JPL DE405 planetary and lunar ephemerides.',
      generatedAt: new Date().toISOString(),
      yearMin: Math.min(...YEARS),
      yearMax: Math.max(...YEARS),
      bodies:  Object.keys(BODY_PATHS),
      columns: ['raSec (seconds of time)', 'decArcsec (signed arcseconds)'],
    },
  };

  for (const body of Object.keys(BODY_PATHS)) {
    console.log(`=== ${body} ===`);
    result[body] = {};
    for (const year of YEARS) {
      const url = BODY_PATHS[body](year);
      const cache = `${CACHE}/${body}${year}.html`;
      const html = await fetchCached(url, cache);
      if (!html) { console.log(`  ${year}: SKIP`); continue; }
      const data = parseYear(html);
      result[body][year] = Array.from(data);   // JSON-safe
      console.log(`  ${year}: ${data.length / 2} rows`);
    }
  }

  // Emit as a JS module so the sim can `import` it directly.
  const out = `// Auto-generated by scripts/scrape_astropixels.mjs — do not edit by hand.
// Data source: Fred Espenak, "AstroPixels — Ephemeris"
//   https://www.astropixels.com/ephemeris/
//   Tables computed from JPL DE405 planetary and lunar ephemerides.
// Attribution: credit for the underlying ephemeris data belongs to
//   Fred Espenak (AstroPixels). This file bundles only RA/Dec for the
//   seven bodies used in the simulator, years ${result.meta.yearMin}–${result.meta.yearMax}.
//
// Row layout per body per year: Float64 pairs [raSec, decArcsec] at
// 00:00 UTC for each day-of-year starting Jan 1 (365 or 366 rows).

export const ASTROPIXELS = ${JSON.stringify(result, null, 0)};
`;

  const outPath = '/home/alan/claude/fe_model/js/data/astropixels.js';
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, out);
  console.log(`\nWrote ${outPath} (${out.length} bytes)`);
}

main().catch(e => { console.error(e); process.exit(1); });
