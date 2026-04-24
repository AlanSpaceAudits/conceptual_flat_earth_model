// Hand-curated constellation catalogue. Each constellation has a list of
// bright stars (J2000.0 equatorial coords, RA in degrees 0-360, Dec in
// degrees −90..+90) plus an adjacency list of stick-figure line segments
// given as pairs of star indices into the same list.
//
// Stars here are celestial directions — exactly the same [lat=Dec, lon=RA]
// format the Stars cloud uses, so they project through the same pipeline
// to either the heavenly vault or the observer's optical vault.
//
// Per-star fields:
//   ra, dec  — J2000.0 equatorial coordinates, degrees
//   celnav   — optional id that matches a `CEL_NAV_STARS.id` entry in
//              `celnavStars.js`. The renderer uses this to suppress the
//              duplicate point sprite (the cel-nav layer already paints
//              that star with apparent-of-date corrections applied).
//              Line endpoints still use the constellation's own J2000
//              position — sub-arcminute drift is invisible on the cap.
//   id, name — required when `celnav` is absent. Unique id used by the
//              Tracker (`star:<id>`) and as the key for `CATALOGUED_STARS`
//              below. `name` is the display label in the tracker HUD.
//   mag      — apparent visual magnitude (used for tracker readout).
//
// S210 — full J2000.0 position refresh. Coordinates match Hipparcos /
// SIMBAD to 4 decimals (~0.4″). Stars that are also in `celnavStars.js`
// keep values identical to that file so the two renderers project the
// same stars to the same pixel.
//
// S214 — every cel-nav crossover tags its `celnav` id so the
// constellation renderer no longer paints a duplicate sprite on top of
// the cel-nav star.
//
// S215 — σ Octantis entry (single star, southern pole).
//
// S217 — every non-cel-nav star now carries `id` / `name` / `mag` so
// it can be tracked through the standard `star:<id>` path. A flat
// `CATALOGUED_STARS` export lets consumers (the tracker lookup, the
// control-panel button grid, and `app.update()`) iterate over all
// catalogued non-cel-nav stars without re-walking the constellation
// tree. Positional errors in the earlier hand-curated set that were
// already corrected in S210:
//   - Ursa Minor epsilon: RA 244.35 → 251.4926 (was ~7° wrong)
//   - Ursa Minor eta:     RA 239.84 → 244.3753 (was ~4.5° wrong)
//   - Gemini index 6 (was a duplicate of Tejat) → Propus η Gem.

export const CONSTELLATIONS = [
  {
    name: 'Orion',
    stars: [
      // 0 Betelgeuse (cel nav), 1 Bellatrix (cel nav), 2 Mintaka,
      // 3 Alnilam (cel nav), 4 Alnitak, 5 Saiph,
      // 6 Rigel (cel nav), 7 Meissa
      { ra:  88.7929, dec:   7.4071, celnav: 'betelgeuse' },
      { ra:  81.2828, dec:   6.3497, celnav: 'bellatrix' },
      { ra:  83.0017, dec:  -0.2991, id: 'mintaka', name: 'Mintaka', mag: 2.23 },
      { ra:  84.0533, dec:  -1.2019, celnav: 'alnilam' },
      { ra:  85.1896, dec:  -1.9426, id: 'alnitak',  name: 'Alnitak', mag: 1.79 },
      { ra:  86.9391, dec:  -9.6697, id: 'saiph',    name: 'Saiph',   mag: 2.09 },
      { ra:  78.6345, dec:  -8.2017, celnav: 'rigel' },
      { ra:  83.7845, dec:   9.9342, id: 'meissa',   name: 'Meissa',  mag: 3.39 },
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,0],[4,5],[5,6],[6,2],[1,7],[7,0]],
  },
  {
    name: 'Ursa Major (Big Dipper)',
    stars: [
      // 0 Dubhe (cel nav), 1 Merak, 2 Phecda, 3 Megrez,
      // 4 Alioth (cel nav), 5 Mizar, 6 Alkaid (cel nav)
      { ra: 165.9319, dec:  61.7511, celnav: 'dubhe' },
      { ra: 165.4602, dec:  56.3824, id: 'merak',  name: 'Merak',  mag: 2.37 },
      { ra: 178.4577, dec:  53.6948, id: 'phecda', name: 'Phecda', mag: 2.44 },
      { ra: 183.8565, dec:  57.0326, id: 'megrez', name: 'Megrez', mag: 3.31 },
      { ra: 193.5073, dec:  55.9598, celnav: 'alioth' },
      { ra: 200.9814, dec:  54.9254, id: 'mizar',  name: 'Mizar',  mag: 2.23 },
      { ra: 206.8852, dec:  49.3133, celnav: 'alkaid' },
    ],
    lines: [[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]],
  },
  {
    name: 'Ursa Minor (Little Dipper)',
    stars: [
      // 0 Polaris (cel nav), 1 Yildun (δ UMi), 2 Epsilon UMi,
      // 3 Zeta UMi, 4 Eta UMi, 5 Gamma UMi (Pherkad),
      // 6 Kochab (cel nav)
      { ra:  37.9546, dec:  89.2641, celnav: 'polaris' },
      { ra: 263.0538, dec:  86.5864, id: 'yildun',     name: 'Yildun',     mag: 4.35 },
      { ra: 251.4926, dec:  82.0372, id: 'epsilonumi', name: 'Epsilon UMi', mag: 4.21 },
      { ra: 236.0144, dec:  77.7945, id: 'zetaumi',    name: 'Zeta UMi',    mag: 4.28 },
      { ra: 244.3753, dec:  75.7552, id: 'etaumi',     name: 'Eta UMi',     mag: 4.95 },
      { ra: 230.1822, dec:  71.8340, id: 'pherkad',    name: 'Pherkad',     mag: 3.00 },
      { ra: 222.6764, dec:  74.1555, celnav: 'kochab' },
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]],
  },
  {
    name: 'Cassiopeia',
    stars: [
      // W-shape: 0 Caph (β Cas), 1 Schedar (cel nav),
      // 2 Gamma Cas, 3 Ruchbah (δ Cas), 4 Segin (ε Cas)
      { ra:   2.2948, dec:  59.1498, id: 'caph',     name: 'Caph',     mag: 2.27 },
      { ra:  10.1268, dec:  56.5373, celnav: 'schedar' },
      { ra:  14.1772, dec:  60.7167, id: 'gammacas', name: 'Gamma Cas', mag: 2.15 },
      { ra:  21.4538, dec:  60.2353, id: 'ruchbah',  name: 'Ruchbah',  mag: 2.66 },
      { ra:  28.5988, dec:  63.6701, id: 'segin',    name: 'Segin',    mag: 3.35 },
    ],
    lines: [[0,1],[1,2],[2,3],[3,4]],
  },
  {
    name: 'Cygnus',
    stars: [
      // Northern Cross: 0 Deneb (cel nav), 1 Sadr (γ Cyg),
      // 2 Gienah Cyg (ε Cyg — NOT the cel-nav 'Gienah' which is γ Crv),
      // 3 Delta Cyg, 4 Albireo (β Cyg)
      { ra: 310.3580, dec:  45.2803, celnav: 'deneb' },
      { ra: 305.5571, dec:  40.2567, id: 'sadr',      name: 'Sadr',      mag: 2.23 },
      { ra: 311.5522, dec:  33.9703, id: 'gienahcyg', name: 'Gienah Cyg', mag: 2.48 },
      { ra: 296.2422, dec:  45.1307, id: 'deltacyg',  name: 'Delta Cyg',  mag: 2.87 },
      { ra: 292.6804, dec:  27.9597, id: 'albireo',   name: 'Albireo',   mag: 3.18 },
    ],
    lines: [[0,1],[1,4],[2,1],[1,3]],
  },
  {
    name: 'Leo',
    stars: [
      // 0 Regulus (cel nav), 1 Eta Leo, 2 Algieba (γ Leo),
      // 3 Zosma (δ Leo), 4 Denebola (cel nav), 5 Theta Leo
      { ra: 152.0929, dec:  11.9672, celnav: 'regulus' },
      { ra: 151.8332, dec:  16.7626, id: 'etaleo',   name: 'Eta Leo',   mag: 3.48 },
      { ra: 154.9930, dec:  19.8415, id: 'algieba',  name: 'Algieba',  mag: 2.28 },
      { ra: 168.5270, dec:  20.5237, id: 'zosma',    name: 'Zosma',    mag: 2.56 },
      { ra: 177.2649, dec:  14.5720, celnav: 'denebola' },
      { ra: 168.5603, dec:  15.4296, id: 'thetaleo', name: 'Theta Leo', mag: 3.34 },
    ],
    lines: [[0,1],[1,2],[2,3],[3,5],[5,0],[3,4],[5,4]],
  },
  {
    name: 'Scorpius',
    stars: [
      // 0 Antares (cel nav), 1 Graffias (β Sco), 2 Dschubba (δ Sco),
      // 3 Pi Sco, 4 Sigma Sco, 5 Tau Sco, 6 Epsilon Sco, 7 Mu Sco,
      // 8 Zeta Sco, 9 Shaula (cel nav), 10 Kappa Sco
      { ra: 247.3519, dec: -26.4320, celnav: 'antares' },
      { ra: 241.3593, dec: -19.8054, id: 'graffias',   name: 'Graffias',   mag: 2.56 },
      { ra: 240.0831, dec: -22.6217, id: 'dschubba',   name: 'Dschubba',   mag: 2.32 },
      { ra: 239.7127, dec: -26.1140, id: 'pisco',      name: 'Pi Sco',     mag: 2.89 },
      { ra: 245.2971, dec: -25.5928, id: 'sigmasco',   name: 'Sigma Sco',  mag: 2.89 },
      { ra: 248.9709, dec: -28.2160, id: 'tausco',     name: 'Tau Sco',    mag: 2.82 },
      { ra: 252.5414, dec: -34.2934, id: 'epsilonsco', name: 'Epsilon Sco', mag: 2.29 },
      { ra: 256.7226, dec: -38.0475, id: 'musco',      name: 'Mu Sco',     mag: 3.57 },
      { ra: 254.6538, dec: -42.3622, id: 'zetasco',    name: 'Zeta Sco',   mag: 3.62 },
      { ra: 263.4022, dec: -37.1038, celnav: 'shaula' },
      { ra: 265.6220, dec: -39.0300, id: 'kappasco',   name: 'Kappa Sco',  mag: 2.39 },
    ],
    lines: [[1,2],[2,3],[3,4],[4,0],[0,5],[5,6],[6,7],[7,8],[8,10],[10,9]],
  },
  {
    name: 'Crux (Southern Cross)',
    stars: [
      // 0 Acrux (cel nav), 1 Mimosa (β Cru), 2 Gacrux (cel nav),
      // 3 Delta Cru
      { ra: 186.6496, dec: -63.0991, celnav: 'acrux' },
      { ra: 191.9303, dec: -59.6886, id: 'mimosa',   name: 'Mimosa',   mag: 1.25 },
      { ra: 187.7915, dec: -57.1133, celnav: 'gacrux' },
      { ra: 183.7863, dec: -58.7489, id: 'deltacru', name: 'Delta Cru', mag: 2.79 },
    ],
    lines: [[0,2],[1,3]],
  },
  {
    name: 'Taurus',
    stars: [
      // 0 Aldebaran (cel nav), 1 Elnath (cel nav), 2 Zeta Tau,
      // 3 Lambda Tau, 4 Theta Tau, 5 Epsilon Tau
      { ra:  68.9802, dec:  16.5093, celnav: 'aldebaran' },
      { ra:  81.5729, dec:  28.6075, celnav: 'elnath' },
      { ra:  84.4112, dec:  21.1425, id: 'zetatau',    name: 'Zeta Tau',    mag: 3.00 },
      { ra:  60.1705, dec:  12.4905, id: 'lambdatau',  name: 'Lambda Tau',  mag: 3.41 },
      { ra:  67.1659, dec:  15.8710, id: 'thetatau',   name: 'Theta Tau',   mag: 3.40 },
      { ra:  67.1540, dec:  19.1803, id: 'epsilontau', name: 'Epsilon Tau', mag: 3.54 },
    ],
    lines: [[0,1],[0,2],[1,2],[0,4],[4,5],[5,3]],
  },
  {
    name: 'Gemini',
    stars: [
      // 0 Pollux (cel nav), 1 Castor (α Gem), 2 Wasat (δ Gem),
      // 3 Mebsuta (ε Gem), 4 Alhena (γ Gem), 5 Tejat (μ Gem),
      // 6 Propus (η Gem)
      { ra: 116.3289, dec:  28.0262, celnav: 'pollux' },
      { ra: 113.6496, dec:  31.8881, id: 'castor',  name: 'Castor',  mag: 1.58 },
      { ra: 110.0305, dec:  21.9823, id: 'wasat',   name: 'Wasat',   mag: 3.53 },
      { ra: 100.9830, dec:  25.1311, id: 'mebsuta', name: 'Mebsuta', mag: 3.06 },
      { ra:  99.4279, dec:  16.3993, id: 'alhena',  name: 'Alhena',  mag: 1.93 },
      { ra:  95.7401, dec:  22.5136, id: 'tejat',   name: 'Tejat',   mag: 2.87 },
      { ra:  93.7194, dec:  22.5064, id: 'propus',  name: 'Propus',  mag: 3.15 },
    ],
    lines: [[0,2],[2,4],[1,3],[3,5],[5,6]],
  },
  {
    // S215 — σ Octantis, the southern celestial pole star. Magnitude
    // ~5.47, far below the cel-nav almanac cutoff, so it's not in
    // `celnavStars.js` and keeps its own point here. Single-star
    // entry, no stick-figure lines.
    name: 'Octans',
    stars: [
      { ra: 317.1929, dec: -88.9566, id: 'sigmaoct', name: 'Sigma Oct', mag: 5.47 },
    ],
    lines: [],
  },
];

// Flat list of every non-cel-nav catalogued star (carries id / name /
// mag). Consumers: tracker button grid + `star:<id>` lookup path in
// `app.update()`. Built once at module load.
export const CATALOGUED_STARS = [];
for (const con of CONSTELLATIONS) {
  for (const s of con.stars) {
    if (!s.celnav && s.id) {
      CATALOGUED_STARS.push({
        id: s.id,
        name: s.name,
        raH: s.ra / 15,                // hours for pipeline parity with CEL_NAV_STARS
        decD: s.dec,
        mag: s.mag ?? null,
        constellation: con.name,
      });
    }
  }
}

// Lookup by id, parallel to `celNavStarById`.
const _CAT_BY_ID = new Map(CATALOGUED_STARS.map((s) => [s.id, s]));
export function cataloguedStarById(id) { return _CAT_BY_ID.get(id) || null; }
