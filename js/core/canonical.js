// Canonical (lat, lon) → disc position. Default is hard-coded
// north-pole azimuthal-equidistant; the FE grid, observer placement,
// and every above-disc anchor share this single coordinate framework.
//
// Projections that opt into `useProjectionGrid` (currently only `dp`,
// the dual-pole AE world model) can override the framework via
// `setActiveProjection(id)`. While such an override is active, every
// caller that goes through `canonicalLatLongToDisc` lands on the
// override projection's disc — observer, sun / moon GPs, optical-vault
// rays, eclipse paths, etc. — so the visualisation stays internally
// consistent end-to-end.
//
// Projections without `useProjectionGrid` (mercator / equirect / etc.)
// are treated as decorative art only and don't override the framework.

import { getProjection } from './projections.js';

const DEG = Math.PI / 180;

let _activeProjection = null;

export function setActiveProjection(id) {
  if (!id) { _activeProjection = null; return; }
  const proj = getProjection(id);
  _activeProjection = (proj && proj.useProjectionGrid) ? proj : null;
}

export function canonicalLatLongToDisc(latDeg, longDeg, feRadius = 1) {
  if (_activeProjection) {
    return _activeProjection.project(latDeg, longDeg, feRadius);
  }
  const r = feRadius * (90 - latDeg) / 180;
  const lo = longDeg * DEG;
  return [r * Math.cos(lo), r * Math.sin(lo), 0];
}
