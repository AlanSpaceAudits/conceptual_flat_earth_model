// Projects Natural Earth GeoJSON land polygons through the FE azimuthal-
// equidistant projection and builds a three.js mesh to fill them on the disc,
// plus a LineSegments object for the coastline outline.

import * as THREE from 'three';
import { pointOnFE } from '../core/feGeometry.js';

const EPS_LIFT = 1e-4; // avoid z-fighting with the disc plane

// Densify a ring of lon/lat points so a straight segment in lon/lat space
// doesn't turn into a weird chord after the non-linear projection.
function densifyRing(ring, maxDegStep = 3) {
  const out = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    const d = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    const n = Math.max(1, Math.ceil(d / maxDegStep));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      out.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
    }
  }
  out.push(ring[ring.length - 1]);
  return out;
}

function ringToDiscPoints(ring, feRadius) {
  // GeoJSON is [lon, lat]
  const dense = densifyRing(ring);
  const pts = [];
  for (const [lon, lat] of dense) {
    const p = pointOnFE(lat, lon, feRadius);
    pts.push(new THREE.Vector2(p[0], p[1]));
  }
  return pts;
}

export async function loadLandGeo(url = 'assets/ne_110m_land.geojson') {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  return res.json();
}

// Build a filled polygon mesh (green continents) + a line outline for the
// coastlines. Returns a THREE.Group with both.
export function buildLandMesh(geojson, {
  feRadius = 1,
  fillColor = 0x3f7a3f,
  fillOpacity = 0.75,
  strokeColor = 0x1d3a1d,
  strokeOpacity = 0.9,
} = {}) {
  const group = new THREE.Group();
  group.name = 'land';

  const fillMat = new THREE.MeshBasicMaterial({
    color: fillColor, transparent: fillOpacity < 1, opacity: fillOpacity,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const lineMat = new THREE.LineBasicMaterial({
    color: strokeColor, transparent: strokeOpacity < 1, opacity: strokeOpacity,
  });

  const lineSegs = [];

  for (const feat of geojson.features || []) {
    const g = feat.geometry;
    if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates]
                : g.type === 'MultiPolygon' ? g.coordinates
                : [];
    for (const poly of polys) {
      const [outer, ...holes] = poly;
      const outerPts = ringToDiscPoints(outer, feRadius);
      if (outerPts.length < 3) continue;

      const shape = new THREE.Shape(outerPts);
      for (const hole of holes) {
        const hPts = ringToDiscPoints(hole, feRadius);
        if (hPts.length >= 3) shape.holes.push(new THREE.Path(hPts));
      }
      const geom = new THREE.ShapeGeometry(shape);
      const mesh = new THREE.Mesh(geom, fillMat);
      mesh.position.z = EPS_LIFT;
      group.add(mesh);

      // Outline: emit consecutive pairs to feed LineSegments in bulk.
      for (const ring of [outer, ...holes]) {
        const rp = ringToDiscPoints(ring, feRadius);
        for (let i = 0; i < rp.length - 1; i++) {
          lineSegs.push(rp[i].x, rp[i].y, EPS_LIFT * 2);
          lineSegs.push(rp[i + 1].x, rp[i + 1].y, EPS_LIFT * 2);
        }
      }
    }
  }

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineSegs, 3));
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  lines.name = 'coastlines';
  group.add(lines);

  return group;
}
