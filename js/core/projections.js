// Projection registry.
//
// Every entry defines:
//   project(lat, lon, feRadius) → [x, y, 0] on the disc
//
// Disc output is normalised so the projection's widest axis hits
// feRadius; celestial overlays (land contours, ground points,
// observer, rays) all flow through the same `project()` via
// `canonicalLatLongToDisc`, so swapping the active projection
// re-warps both the map art AND every celestial placement together.
//
// Add new projections by dropping another entry into `PROJECTIONS`.

const DEG = Math.PI / 180;

// --- Polar-azimuthal helper (pole-at-origin, lon-as-azimuth) --------
function polarFromRadial(latDeg, longDeg, feRadius, radialFn) {
  const lo = longDeg * DEG;
  const r = feRadius * radialFn(latDeg);
  return [r * Math.cos(lo), r * Math.sin(lo), 0];
}

// Classic FE radial (linear AE).
const RADIAL_AE = (lat) => (90 - lat) / 180;
// Lambert azimuthal equal-area, polar aspect, normalised r(-90°)=1.
const RADIAL_LAEA = (lat) => Math.sin((90 - lat) * Math.PI / 360);
// Power-law tweak of AE matching the proportional-AE artwork.
const RADIAL_PROPORTIONAL = (lat) => Math.pow((90 - lat) / 180, 0.75);

// --- Forward functions for world-map projections --------------------

// Azimuthal Equidistant centred at (0, 0) with edge angle = π.
// Shows the whole sphere on one disc — both poles land on the vertical
// centreline as distinct points (the "dual-pole / butt-shape" disc).
function projectAEDual(lat, lon, r = 1) {
  const phi = lat * DEG;
  const lam = lon * DEG;
  const cosC = Math.cos(phi) * Math.cos(lam);
  const c = Math.acos(Math.max(-1, Math.min(1, cosC)));
  if (c < 1e-9) return [0, 0, 0];
  const k = (c / Math.PI) / Math.sin(c);
  return [r * k * Math.cos(phi) * Math.sin(lam),
          r * k * Math.sin(phi),
          0];
}

// Equirectangular / plate carrée. x = lon/180, y = lat/90, scaled so the
// wider axis hits r.
function projectEquirect(lat, lon, r = 1) {
  return [r * lon / 180, r * lat / 360, 0];
}

// Mercator. Clamped at ±85° so poles don't run off to infinity. Scaled
// so lon span [-180°, +180°] → [-r, +r]; the y extent at ±85° stretches
// up to about ±r.
function projectMercator(lat, lon, r = 1) {
  const phi = Math.max(-85, Math.min(85, lat)) * DEG;
  const y = Math.log(Math.tan(Math.PI / 4 + phi / 2));
  // ln(tan(45° + 85°/2)) ≈ 3.131 — scale y by that to fit [-r, r].
  return [r * lon / 180, r * y / 3.131, 0];
}

// Mollweide. Pseudocylindrical equal-area ellipse, 2:1 aspect.
function projectMollweide(lat, lon, r = 1) {
  const phi = lat * DEG, lam = lon * DEG;
  let theta = phi;
  for (let i = 0; i < 10; i++) {
    const num = 2 * theta + Math.sin(2 * theta) - Math.PI * Math.sin(phi);
    const den = 2 + 2 * Math.cos(2 * theta);
    const dt = num / (Math.abs(den) < 1e-9 ? 1e-9 : den);
    theta -= dt;
    if (Math.abs(dt) < 1e-8) break;
  }
  const x = (2 * Math.sqrt(2) / Math.PI) * lam * Math.cos(theta);
  const y = Math.sqrt(2) * Math.sin(theta);
  // Natural bounds ±2√2 × ±√2 — scale x to [-r, r].
  return [r * x / (2 * Math.sqrt(2)), r * y / (2 * Math.sqrt(2)), 0];
}

// Robinson. 19-row lookup table from the published 5°-spaced values.
const ROBINSON_TABLE = [
  [0,  1.0000, 0.0000], [5,  0.9986, 0.0620], [10, 0.9954, 0.1240],
  [15, 0.9900, 0.1860], [20, 0.9822, 0.2480], [25, 0.9730, 0.3100],
  [30, 0.9600, 0.3720], [35, 0.9427, 0.4340], [40, 0.9216, 0.4958],
  [45, 0.8962, 0.5571], [50, 0.8679, 0.6176], [55, 0.8350, 0.6769],
  [60, 0.7986, 0.7346], [65, 0.7597, 0.7903], [70, 0.7186, 0.8435],
  [75, 0.6732, 0.8936], [80, 0.6213, 0.9394], [85, 0.5722, 0.9761],
  [90, 0.5322, 1.0000],
];
function robinsonLookup(absLat) {
  const i = Math.max(0, Math.min(17, Math.floor(absLat / 5)));
  const r0 = ROBINSON_TABLE[i], r1 = ROBINSON_TABLE[i + 1];
  const t = (absLat - r0[0]) / 5;
  return { A: r0[1] + t * (r1[1] - r0[1]), B: r0[2] + t * (r1[2] - r0[2]) };
}
function projectRobinson(lat, lon, r = 1) {
  const s = lat < 0 ? -1 : 1;
  const { A, B } = robinsonLookup(Math.abs(lat));
  const x = 0.8487 * A * lon * DEG;
  const y = 1.3523 * s * B;
  // Max x ≈ 0.8487·π ≈ 2.666, max y ≈ 1.3523. Scale x to [-r, r].
  return [r * x / (0.8487 * Math.PI), r * y / 2.666, 0];
}

// Winkel Tripel. Mean of Aitoff and equirectangular at the standard
// parallel acos(2/π).
function projectWinkelTripel(lat, lon, r = 1) {
  const phi = lat * DEG, lam = lon * DEG;
  const alpha = Math.acos(Math.min(1, Math.cos(phi) * Math.cos(lam / 2)));
  const sinc = Math.abs(alpha) < 1e-9 ? 1 : Math.sin(alpha) / alpha;
  const aitoffX = 2 * Math.cos(phi) * Math.sin(lam / 2) / sinc;
  const aitoffY = Math.sin(phi) / sinc;
  const phi1 = Math.acos(2 / Math.PI);
  const eqX = lam * Math.cos(phi1);
  const eqY = phi;
  const x = (aitoffX + eqX) / 2;
  const y = (aitoffY + eqY) / 2;
  // Natural bounds ±(π/2 + π·cos(φ1)/2) × ±(π/2+1)/2.
  // Empirical max |x| ≈ 2.507, max |y| ≈ 1.286.
  return [r * x / 2.507, r * y / 2.507, 0];
}

// Hammer. Lambert AEA horizontally compressed 2:1.
function projectHammer(lat, lon, r = 1) {
  const phi = lat * DEG, lam = lon * DEG;
  const d = Math.sqrt(1 + Math.cos(phi) * Math.cos(lam / 2));
  const x = (2 * Math.sqrt(2) * Math.cos(phi) * Math.sin(lam / 2)) / d;
  const y = (Math.sqrt(2) * Math.sin(phi)) / d;
  // Bounds ±2√2 × ±√2.
  return [r * x / (2 * Math.sqrt(2)), r * y / (2 * Math.sqrt(2)), 0];
}

// Aitoff. Equirectangular scaled by sin(α)/α over halved longitude.
function projectAitoff(lat, lon, r = 1) {
  const phi = lat * DEG, lam = lon * DEG;
  const alpha = Math.acos(Math.min(1, Math.cos(phi) * Math.cos(lam / 2)));
  const sinc = Math.abs(alpha) < 1e-9 ? 1 : Math.sin(alpha) / alpha;
  const x = 2 * Math.cos(phi) * Math.sin(lam / 2) / sinc;
  const y = Math.sin(phi) / sinc;
  return [r * x / Math.PI, r * y / Math.PI, 0];
}

// Sinusoidal. Equal-area with sine-shaped meridians.
function projectSinusoidal(lat, lon, r = 1) {
  const phi = lat * DEG, lam = lon * DEG;
  const x = lam * Math.cos(phi);
  const y = phi;
  return [r * x / Math.PI, r * y / Math.PI, 0];
}

// Equal Earth. Savrič, Patterson, Jenny 2018 polynomial.
function projectEqualEarth(lat, lon, r = 1) {
  const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796;
  const M = Math.sqrt(3) / 2;
  const phi = lat * DEG, lam = lon * DEG;
  const th = Math.asin(M * Math.sin(phi));
  const th2 = th * th;
  const th6 = th2 * th2 * th2;
  const denom = M * (A1 + 3 * A2 * th2 + th6 * (7 * A3 + 9 * A4 * th2));
  const x = lam * Math.cos(th) / denom;
  const y = th * (A1 + A2 * th2 + th6 * (A3 + A4 * th2));
  // Max x ≈ 2.7, max y ≈ 1.36.
  return [r * x / 2.7, r * y / 2.7, 0];
}

// Eckert IV. Pseudocylindrical equal-area, pole-line.
function projectEckertIV(lat, lon, r = 1) {
  const phi = lat * DEG, lam = lon * DEG;
  let th = phi / 2;
  for (let i = 0; i < 10; i++) {
    const num = th + Math.sin(th) * Math.cos(th) + 2 * Math.sin(th)
              - (2 + Math.PI / 2) * Math.sin(phi);
    const den = 1 + Math.cos(th) * Math.cos(th) - Math.sin(th) * Math.sin(th)
              + 2 * Math.cos(th);
    const dt = num / (Math.abs(den) < 1e-9 ? 1e-9 : den);
    th -= dt;
    if (Math.abs(dt) < 1e-8) break;
  }
  const kx = 2 / Math.sqrt(Math.PI * (4 + Math.PI));
  const ky = 2 * Math.sqrt(Math.PI / (4 + Math.PI));
  const x = kx * lam * (1 + Math.cos(th));
  const y = ky * Math.sin(th);
  return [r * x / (kx * Math.PI * 2), r * y / (kx * Math.PI * 2), 0];
}

// --- Registry -------------------------------------------------------

export const PROJECTIONS = {
  ae: {
    id: 'ae', name: 'Default (AE)',
    imageAsset: null, imageInscribedRadius: 0.5,
    notes: 'Azimuthal-equidistant, polar aspect. Pole at disc centre.',
    project(lat, lon, r = 1) { return polarFromRadial(lat, lon, r, RADIAL_AE); },
  },

  blank: {
    id: 'blank', name: 'Blank (no features)',
    imageAsset: null, imageInscribedRadius: 0.5, renderStyle: 'blank',
    notes: 'Same math as AE; renders as solid black for coordinate inspection.',
    project(lat, lon, r = 1) { return polarFromRadial(lat, lon, r, RADIAL_AE); },
  },

  hellerick: {
    id: 'hellerick', name: 'Hellerick boreal',
    imageAsset: null, imageInscribedRadius: 0.5,
    notes: 'Lambert azimuthal equal-area, polar aspect.',
    project(lat, lon, r = 1) { return polarFromRadial(lat, lon, r, RADIAL_LAEA); },
  },

  proportional: {
    id: 'proportional', name: 'Proportional AE Map',
    imageAsset: 'assets/map_proportional.png',
    imageNativeWidth: 1920, imageNativeHeight: 1080,
    imageInscribedRadius: 0.5,
    notes: 'Artwork-driven AE power-law tweak (exponent 0.75).',
    project(lat, lon, r = 1) { return polarFromRadial(lat, lon, r, RADIAL_PROPORTIONAL); },
  },

  ae_dual: {
    id: 'ae_dual', name: 'AE Equatorial (dual-pole)',
    imageAsset: null, imageInscribedRadius: 0.5,
    notes: 'Azimuthal-equidistant centred at (0°, 0°), edge angle 180°. Both geographic poles fall on the vertical centre-line as two distinct points — the "dual-pole / heart" disc.',
    project: projectAEDual,
  },

  equirect: {
    id: 'equirect', name: 'Equirectangular',
    imageAsset: null, imageInscribedRadius: 0.5,
    notes: 'Plate carrée: x = lon, y = lat. 2:1 aspect.',
    project: projectEquirect,
  },

  mercator: {
    id: 'mercator', name: 'Mercator',
    imageAsset: null, imageInscribedRadius: 0.5,
    notes: 'Conformal cylindrical; poles diverge, clamped to ±85°.',
    project: projectMercator,
  },

  mollweide: {
    id: 'mollweide', name: 'Mollweide',
    imageAsset: null, imageInscribedRadius: 0.5,
    notes: 'Pseudocylindrical equal-area ellipse, 2:1.',
    project: projectMollweide,
  },

  robinson: {
    id: 'robinson', name: 'Robinson',
    imageAsset: null, imageInscribedRadius: 0.5,
    notes: 'Pseudocylindrical compromise, 5°-spaced lookup table.',
    project: projectRobinson,
  },

  winkel_tripel: {
    id: 'winkel_tripel', name: 'Winkel Tripel',
    imageAsset: null, imageInscribedRadius: 0.5,
    notes: 'Mean of Aitoff and equirectangular at φ = acos(2/π); National Geographic standard.',
    project: projectWinkelTripel,
  },

  hammer: {
    id: 'hammer', name: 'Hammer',
    imageAsset: null, imageInscribedRadius: 0.5,
    notes: 'Lambert azimuthal equal-area, horizontally squashed 2:1.',
    project: projectHammer,
  },

  aitoff: {
    id: 'aitoff', name: 'Aitoff',
    imageAsset: null, imageInscribedRadius: 0.5,
    notes: 'Equirectangular scaled by sinc(α) over halved longitude.',
    project: projectAitoff,
  },

  sinusoidal: {
    id: 'sinusoidal', name: 'Sinusoidal',
    imageAsset: null, imageInscribedRadius: 0.5,
    notes: 'Equal-area with sine-curved meridians.',
    project: projectSinusoidal,
  },

  equal_earth: {
    id: 'equal_earth', name: 'Equal Earth',
    imageAsset: null, imageInscribedRadius: 0.5,
    notes: 'Equal-area polynomial, Savrič–Patterson–Jenny (2018).',
    project: projectEqualEarth,
  },

  eckert4: {
    id: 'eckert4', name: 'Eckert IV',
    imageAsset: null, imageInscribedRadius: 0.5,
    notes: 'Pseudocylindrical equal-area with pole-line.',
    project: projectEckertIV,
  },
};

export function getProjection(id) {
  return PROJECTIONS[id] || PROJECTIONS.ae;
}

export function listProjections() {
  return Object.values(PROJECTIONS).map((p) => ({ value: p.id, label: p.name }));
}
