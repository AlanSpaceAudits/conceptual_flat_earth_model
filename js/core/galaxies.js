// Notable galaxies, J2000.0.
// Entry shape matches CEL_NAV_STARS / CATALOGUED_STARS / BLACK_HOLES
// / QUASARS — flows through the shared projectStar() helper in
// app.update().

export const GALAXIES = [
  { id: 'gal_m31',       name: 'M31 (Andromeda)',        raH:  0.71231, decD:  41.26917, mag: 3.44 },
  { id: 'gal_m32',       name: 'M32',                    raH:  0.71161, decD:  40.86528, mag: 8.08 },
  { id: 'gal_m33',       name: 'M33 (Triangulum)',       raH:  1.56414, decD:  30.66028, mag: 5.72 },
  { id: 'gal_m51',       name: 'M51 (Whirlpool)',        raH: 13.49797, decD:  47.19528, mag: 8.4  },
  { id: 'gal_m63',       name: 'M63 (Sunflower)',        raH: 13.26369, decD:  42.02917, mag: 8.59 },
  { id: 'gal_m64',       name: 'M64 (Black Eye)',        raH: 12.94556, decD:  21.68250, mag: 8.52 },
  { id: 'gal_m77',       name: 'M77 (Cetus A)',          raH:  2.71133, decD:  -0.01333, mag: 9.6  },
  { id: 'gal_m81',       name: "M81 (Bode's)",           raH:  9.92583, decD:  69.06528, mag: 6.94 },
  { id: 'gal_m82',       name: 'M82 (Cigar)',            raH:  9.93111, decD:  69.67972, mag: 8.41 },
  { id: 'gal_m87',       name: 'M87 (Virgo A)',          raH: 12.51372, decD:  12.39111, mag: 8.6  },
  { id: 'gal_m101',      name: 'M101 (Pinwheel)',        raH: 14.05350, decD:  54.34917, mag: 7.86 },
  { id: 'gal_m104',      name: 'M104 (Sombrero)',        raH: 12.66650, decD: -11.62306, mag: 8.0  },
  { id: 'gal_m110',      name: 'M110',                   raH:  0.67281, decD:  41.68528, mag: 8.07 },
  { id: 'gal_ngc253',    name: 'NGC 253 (Sculptor)',     raH:  0.79250, decD: -25.28806, mag: 7.2  },
  { id: 'gal_ngc4565',   name: 'NGC 4565 (Needle)',      raH: 12.60578, decD:  25.98750, mag: 9.6  },
  { id: 'gal_ngc4631',   name: 'NGC 4631 (Whale)',       raH: 12.70222, decD:  32.54139, mag: 9.2  },
  { id: 'gal_ngc5128',   name: 'NGC 5128 (Centaurus A)', raH: 13.42489, decD: -43.01910, mag: 6.8  },
  { id: 'gal_lmc',       name: 'Large Magellanic Cloud', raH:  5.39278, decD: -69.75611, mag: 0.9  },
  { id: 'gal_smc',       name: 'Small Magellanic Cloud', raH:  0.87889, decD: -72.82861, mag: 2.7  },
  { id: 'gal_cartwheel', name: 'Cartwheel',              raH:  0.62806, decD: -33.71639, mag: 15.2 },
];

const _GAL_BY_ID = new Map(GALAXIES.map((g) => [g.id, g]));
export function galaxyById(id) { return _GAL_BY_ID.get(id) || null; }
