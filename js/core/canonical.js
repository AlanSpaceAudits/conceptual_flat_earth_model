// Canonical disc-coordinate router.
//
// Any overlay that converts (lat, lon) → disc position in world coords
// calls `canonicalLatLongToDisc`. Historically that was hardcoded to
// azimuthal-equidistant; now it delegates to whichever projection is
// active per `state.MapProjection`. Every body / GP / ray / land
// contour re-projects automatically when the active projection swaps.
//
// The active id is set by a state listener in `js/main.js` so this
// module stays free of cross-imports into app/UI layers.

import { getProjection } from './projections.js';

let activeId = 'ae';

export function setActiveProjection(id) {
  activeId = id || 'ae';
}

export function canonicalLatLongToDisc(latDeg, longDeg, feRadius = 1) {
  const proj = getProjection(activeId);
  return proj.project(latDeg, longDeg, feRadius);
}
