// Canonical (lat, lon) → disc position. Hard-coded north-pole
// azimuthal-equidistant; the FE grid, observer placement, and every
// above-disc anchor share this single coordinate framework regardless
// of the loaded map art / projection.

const DEG = Math.PI / 180;

export function setActiveProjection() {}

export function canonicalLatLongToDisc(latDeg, longDeg, feRadius = 1) {
  const r = feRadius * (90 - latDeg) / 180;
  const lo = longDeg * DEG;
  return [r * Math.cos(lo), r * Math.sin(lo), 0];
}
