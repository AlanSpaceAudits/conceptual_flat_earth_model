// Stellarium-exported geocentric trace overlays.
//
// Populate `STELLARIUM_TRACES[body]` with arrays of
// `{ jd?, ra, dec }` rows where `ra` and `dec` are in DEGREES
// (right-ascension can be 0..360 OR -180..180 — both wrap fine).
// Optional `jd` (Julian Date) is unused by the renderer; included
// so you can paste full Stellarium CSV rows without trimming.
//
// Stellarium quick-export workflow:
//   1. Right-click body → "Information" → enable RA/Dec readout
//   2. Tools → "Solar System Editor" → open the orbit-output panel
//      (or use the AstroCalc → "Ephemeris" tool: pick body, range,
//       step, copy the table to CSV)
//   3. Paste rows here as { ra: <deg>, dec: <deg> }
//
// The renderer reads each entry, projects via `canonicalLatLongToDisc`
// (the same AE math the FE-model GP tracer uses), and draws the
// trace as a connected polyline at the disc's z=0.004 lift. RA wraps
// near the 0/360 boundary trigger a pen-up so the line doesn't
// jump across the disc.

export const STELLARIUM_TRACES = {
  sun:     [],
  moon:    [],
  mercury: [],
  venus:   [],
  mars:    [],
  jupiter: [],
  saturn:  [],
  uranus:  [],
  neptune: [],
};
