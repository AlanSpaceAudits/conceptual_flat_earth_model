// Projection registry.
//
// A projection is a data object describing how geographic (lat, lon) pairs
// map onto the flat disc, plus optional source-image metadata describing
// the artwork that depicts that projection. It is deliberately
// model-agnostic: nothing here commits to a globe, a heliocentric frame,
// or any astronomical interpretation. It only defines
//
//   (lat, lon, feRadius) → disc coordinate [x, y, 0]
//
// and, when an artwork asset exists, where that asset lives and how much
// of its canvas is actually the map.
//
// Entries declare either:
//
//   imageAsset: null                 use a procedural GeoJSON render
//   imageAsset: 'assets/foo.png'     use the artwork directly as the
//                                    disc's map texture
//
// Add a new projection by adding an entry here. No other file needs
// editing for a new entry to appear in the UI.

const DEG = Math.PI / 180;

// --- radial helpers --------------------------------------------------------
// Each projection's latLongToDisc uses a polar-azimuth layout (pole at
// origin, longitude = azimuth). The only thing that varies between them
// is the radial function r(lat). The helper below centralises the
// polar-to-cartesian step.
function polarFromRadial(latDeg, longDeg, feRadius, radialFn) {
  const lo = longDeg * DEG;
  const r = feRadius * radialFn(latDeg);
  return [r * Math.cos(lo), r * Math.sin(lo), 0];
}

// Azimuthal equidistant: r = (90 − lat) / 180, linear.
const RADIAL_AE = (lat) => (90 - lat) / 180;

// Lambert azimuthal equal-area (polar aspect), normalised so r(−90°) = 1.
// Stand-in for Hellerick's boreal look until authoritative formula is
// wired up.
const RADIAL_LAEA = (lat) => Math.sin((90 - lat) * Math.PI / 360);

// Power-law tweak of AE used to match the "proportional" artwork's
// ≈ 60 %-radius equator. The artwork itself is the source of truth;
// this transform is what lets celestial overlays land on it.
const RADIAL_PROPORTIONAL = (lat) => Math.pow((90 - lat) / 180, 0.75);

// --- projection objects ----------------------------------------------------

export const PROJECTIONS = {
  ae: {
    id: 'ae',
    name: 'Default (AE)',
    imageAsset: null,
    imageNativeWidth: null,
    imageNativeHeight: null,
    // 0..0.5 UV half-radius; fraction of the shorter image dimension
    // occupied by the map circle. Ignored when imageAsset is null.
    imageInscribedRadius: 0.5,
    notes: 'Azimuthal-equidistant, model-native frame. Land rendered from GeoJSON.',
    project(lat, lon, feRadius = 1) {
      return polarFromRadial(lat, lon, feRadius, RADIAL_AE);
    },
  },

  hellerick: {
    id: 'hellerick',
    name: 'Hellerick boreal',
    imageAsset: null,
    imageNativeWidth: null,
    imageNativeHeight: null,
    imageInscribedRadius: 0.5,
    notes: 'Lambert equal-area polar aspect, stand-in until Hellerick formula is confirmed. Land rendered from GeoJSON.',
    project(lat, lon, feRadius = 1) {
      return polarFromRadial(lat, lon, feRadius, RADIAL_LAEA);
    },
  },

  proportional: {
    id: 'proportional',
    name: 'Proportional AE Map',
    imageAsset: 'assets/map_proportional.png',
    imageNativeWidth: 1920,
    imageNativeHeight: 1080,
    // Map circle is inscribed in the centre 1080×1080 region of the
    // 1920×1080 canvas, matching the starfield chart layout. Adjust if
    // the asset's inscription differs.
    imageInscribedRadius: 0.5,
    notes: 'Artwork-driven. Overlay transform is the radial function that places celestial overlays consistently with the image.',
    project(lat, lon, feRadius = 1) {
      return polarFromRadial(lat, lon, feRadius, RADIAL_PROPORTIONAL);
    },
  },
};

export function getProjection(id) {
  return PROJECTIONS[id] || PROJECTIONS.ae;
}

export function listProjections() {
  return Object.values(PROJECTIONS).map((p) => ({ value: p.id, label: p.name }));
}
