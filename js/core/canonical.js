// Canonical terrestrial coordinate shell.
//
// Single authoritative (lat, lon) ↔ disc-coordinate mapping for every
// overlay that needs a ground-frame position: tropics, graticule,
// ground points, sun / moon / planet vault markers, sun / moon tracks,
// the longitude ring on the disc rim, and any future ephemeris-driven
// overlay.
//
// The mapping is azimuthal-equidistant by construction:
//     r = feRadius · (90 − latDeg) / 180
//     x = r · cos(lon),  y = r · sin(lon)
//
// It has no dependency on the currently-selected map projection. Map
// artwork is a visual underlay consumed only by `js/render/earthMap.js`
// and the projection-registry it reads from; nothing else may treat
// `projection.project(...)` as a source of coordinate truth.
//
// Rule: overlays import `canonicalLatLongToDisc`. The projection
// registry is strictly the province of the underlay builder.

import { ToRad } from '../math/utils.js';

export function canonicalLatLongToDisc(latDeg, longDeg, feRadius = 1) {
  const r = feRadius * (90 - latDeg) / 180;
  const lo = ToRad(longDeg);
  return [r * Math.cos(lo), r * Math.sin(lo), 0];
}
