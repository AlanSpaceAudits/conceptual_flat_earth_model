// Hand-curated constellation catalogue. Each constellation has a list of
// bright stars (J2000.0 equatorial coords, RA in degrees 0-360, Dec in
// degrees −90..+90) plus an adjacency list of stick-figure line segments
// given as pairs of star indices into the same list.
//
// Stars here are celestial directions — exactly the same [lat=Dec, lon=RA]
// format the Stars cloud uses, so they project through the same pipeline
// to either the heavenly vault or the observer's optical vault.

export const CONSTELLATIONS = [
  {
    name: 'Orion',
    stars: [
      // 0 Betelgeuse, 1 Bellatrix, 2 Mintaka, 3 Alnilam, 4 Alnitak,
      // 5 Saiph, 6 Rigel, 7 Meissa
      { ra:  88.79, dec:   7.41 },
      { ra:  81.28, dec:   6.35 },
      { ra:  83.00, dec:  -0.30 },
      { ra:  84.05, dec:  -1.20 },
      { ra:  85.19, dec:  -1.94 },
      { ra:  86.94, dec:  -9.67 },
      { ra:  78.63, dec:  -8.20 },
      { ra:  83.78, dec:   9.93 },
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,0],[4,5],[5,6],[6,2],[1,7],[7,0]],
  },
  {
    name: 'Ursa Major (Big Dipper)',
    stars: [
      // 0 Dubhe, 1 Merak, 2 Phecda, 3 Megrez, 4 Alioth, 5 Mizar, 6 Alkaid
      { ra: 165.93, dec:  61.75 },
      { ra: 165.46, dec:  56.38 },
      { ra: 178.46, dec:  53.69 },
      { ra: 183.86, dec:  57.03 },
      { ra: 193.51, dec:  55.96 },
      { ra: 200.98, dec:  54.93 },
      { ra: 206.89, dec:  49.31 },
    ],
    lines: [[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]],
  },
  {
    name: 'Ursa Minor (Little Dipper)',
    stars: [
      // 0 Polaris, 1 Yildun, 2 Epsilon, 3 Zeta, 4 Eta, 5 Gamma, 6 Kochab
      { ra:  37.95, dec:  89.26 },
      { ra: 263.05, dec:  86.59 },
      { ra: 244.35, dec:  82.04 },
      { ra: 236.01, dec:  77.79 },
      { ra: 239.84, dec:  75.76 },
      { ra: 230.18, dec:  71.83 },
      { ra: 222.68, dec:  74.16 },
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]],
  },
  {
    name: 'Cassiopeia',
    stars: [
      // W-shape: 0 Caph, 1 Schedar, 2 Gamma, 3 Ruchbah, 4 Segin
      { ra:   2.29, dec:  59.15 },
      { ra:  10.13, dec:  56.54 },
      { ra:  14.18, dec:  60.72 },
      { ra:  21.45, dec:  60.24 },
      { ra:  28.60, dec:  63.67 },
    ],
    lines: [[0,1],[1,2],[2,3],[3,4]],
  },
  {
    name: 'Cygnus',
    stars: [
      // Northern Cross: 0 Deneb, 1 Sadr, 2 Gienah, 3 Delta, 4 Albireo
      { ra: 310.36, dec:  45.28 },
      { ra: 305.56, dec:  40.26 },
      { ra: 311.55, dec:  33.97 },
      { ra: 296.24, dec:  45.13 },
      { ra: 292.68, dec:  27.96 },
    ],
    lines: [[0,1],[1,4],[2,1],[1,3]],
  },
  {
    name: 'Leo',
    stars: [
      // 0 Regulus, 1 Eta, 2 Algieba, 3 Zosma, 4 Denebola, 5 Theta
      { ra: 152.09, dec:  11.97 },
      { ra: 151.83, dec:  16.76 },
      { ra: 154.99, dec:  19.84 },
      { ra: 168.53, dec:  20.52 },
      { ra: 177.26, dec:  14.57 },
      { ra: 168.56, dec:  15.43 },
    ],
    lines: [[0,1],[1,2],[2,3],[3,5],[5,0],[3,4],[5,4]],
  },
  {
    name: 'Scorpius',
    stars: [
      // 0 Antares, 1 Graffias, 2 Dschubba, 3 Pi, 4 Sigma, 5 Tau, 6 Epsilon,
      // 7 Mu, 8 Zeta, 9 Lambda (Shaula), 10 Kappa
      { ra: 247.35, dec: -26.43 },
      { ra: 241.36, dec: -19.80 },
      { ra: 240.08, dec: -22.62 },
      { ra: 239.71, dec: -26.11 },
      { ra: 245.30, dec: -25.59 },
      { ra: 248.97, dec: -28.22 },
      { ra: 252.54, dec: -34.29 },
      { ra: 256.72, dec: -38.05 },
      { ra: 254.65, dec: -42.36 },
      { ra: 263.40, dec: -37.10 },
      { ra: 265.62, dec: -39.03 },
    ],
    lines: [[1,2],[2,3],[3,4],[4,0],[0,5],[5,6],[6,7],[7,8],[8,10],[10,9]],
  },
  {
    name: 'Crux (Southern Cross)',
    stars: [
      // 0 Acrux, 1 Mimosa, 2 Gacrux, 3 Delta Crucis
      { ra: 186.65, dec: -63.10 },
      { ra: 191.93, dec: -59.69 },
      { ra: 187.79, dec: -57.11 },
      { ra: 183.79, dec: -58.75 },
    ],
    lines: [[0,2],[1,3]],
  },
  {
    name: 'Taurus',
    stars: [
      // 0 Aldebaran, 1 Elnath, 2 Zeta, 3 Lambda, 4 Theta, 5 Epsilon
      { ra:  68.98, dec:  16.51 },
      { ra:  81.57, dec:  28.61 },
      { ra:  84.41, dec:  21.14 },
      { ra:  60.17, dec:  12.49 },
      { ra:  67.17, dec:  15.87 },
      { ra:  67.15, dec:  19.18 },
    ],
    lines: [[0,1],[0,2],[1,2],[0,4],[4,5],[5,3]],
  },
  {
    name: 'Gemini',
    stars: [
      // 0 Pollux, 1 Castor, 2 Wasat, 3 Mebsuta, 4 Alhena, 5 Tejat, 6 Mu
      { ra: 116.33, dec:  28.03 },
      { ra: 113.65, dec:  31.89 },
      { ra: 110.03, dec:  21.98 },
      { ra: 100.98, dec:  25.13 },
      { ra:  99.43, dec:  16.40 },
      { ra:  95.74, dec:  22.51 },
      { ra:  95.94, dec:  22.51 },
    ],
    lines: [[0,2],[2,4],[1,3],[3,5],[5,6]],
  },
];
