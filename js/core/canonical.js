// Canonical (lat, lon) → disc position router. Delegates to the
// projection identified by `activeId`, set via setActiveProjection().

import { getProjection } from './projections.js';

let activeId = 'ae';

export function setActiveProjection(id) {
  activeId = id || 'ae';
}

export function canonicalLatLongToDisc(latDeg, longDeg, feRadius = 1) {
  const proj = getProjection(activeId);
  return proj.project(latDeg, longDeg, feRadius);
}
