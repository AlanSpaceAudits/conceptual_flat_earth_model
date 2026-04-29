// Map renderer.
//
// Two entry points:
//
//   buildGeoJsonLand(geoJson, projection, feRadius)
//     Walks Natural Earth GeoJSON polygons and projects each vertex
//     through `projection.project(...)` to build a filled land mesh + a
//     coastline LineSegments. Used for projections that have no
//     artwork asset.
//
//   buildImageMap(projection, feRadius)
//     Textures a flat circular disc with the projection's image asset.
//     Preserves the image's native aspect by cropping the canvas to the
//     inscribed map circle — no conceptual re-projection, just a display-
//     scale crop of the source artwork.
//
// Both return a THREE.Group ready to add into the scene.

import * as THREE from 'three';

const EPS_LIFT = 1e-4; // avoid z-fighting with the disc plane

// -------------------------------------------------------------------------
// GeoJSON path
// -------------------------------------------------------------------------

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

function ringToDiscPoints(ring, projection, feRadius) {
  const dense = densifyRing(ring);
  const pts = [];
  for (const [lon, lat] of dense) {
    const p = projection.project(lat, lon, feRadius);
    pts.push(new THREE.Vector2(p[0], p[1]));
  }
  return pts;
}

export async function loadLandGeo(url = 'assets/ne_110m_land.geojson') {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  return res.json();
}

export function buildGeoJsonLand(geojson, projection, {
  feRadius = 1,
  fillColor = 0x3f7a3f,
  fillOpacity = 0.75,
  strokeColor = 0x1d3a1d,
  strokeOpacity = 0.9,
  iceColor = 0xf0f4f8,
  iceLatCutoff = -55,
} = {}) {
  const group = new THREE.Group();
  group.name = 'land';

  const fillMat = new THREE.MeshBasicMaterial({
    color: fillColor, transparent: fillOpacity < 1, opacity: fillOpacity,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const iceMat = new THREE.MeshBasicMaterial({
    color: iceColor, transparent: fillOpacity < 1, opacity: fillOpacity,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const lineMat = new THREE.LineBasicMaterial({
    color: strokeColor, transparent: strokeOpacity < 1, opacity: strokeOpacity,
  });

  const lineSegs = [];

  const isIce = (feat, outer) => {
    if (feat.bbox && feat.bbox.length >= 4) return feat.bbox[3] < iceLatCutoff;
    let maxLat = -Infinity;
    for (const [, lat] of outer) if (lat > maxLat) maxLat = lat;
    return maxLat < iceLatCutoff;
  };

  for (const feat of geojson.features || []) {
    const g = feat.geometry;
    if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates]
                : g.type === 'MultiPolygon' ? g.coordinates
                : [];
    for (const poly of polys) {
      const [outer, ...holes] = poly;
      const outerPts = ringToDiscPoints(outer, projection, feRadius);
      if (outerPts.length < 3) continue;

      const shape = new THREE.Shape(outerPts);
      for (const hole of holes) {
        const hPts = ringToDiscPoints(hole, projection, feRadius);
        if (hPts.length >= 3) shape.holes.push(new THREE.Path(hPts));
      }
      const geom = new THREE.ShapeGeometry(shape);
      const mat  = isIce(feat, outer) ? iceMat : fillMat;
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.z = EPS_LIFT;
      group.add(mesh);

      for (const ring of [outer, ...holes]) {
        const rp = ringToDiscPoints(ring, projection, feRadius);
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

// -------------------------------------------------------------------------
// Blank path
// -------------------------------------------------------------------------
//
// Solid black disc at FE disc size. Used to inspect the canonical
// coordinate shell (graticule, tropics, longitude ring, azimuth grid)
// without any geographic art on top.

// Black FE disc with continent outlines — pairs with the
// `ae_lineart` projection. Builds a solid-black backdrop circle then
// stitches Natural Earth ring vertices through `projection.project`
// and lays them down as white `LineSegments`. No filled continent
// shapes; the disc reads as "outline-only" art, matching the
// `ge_art_line` style on the GE side so flight-route demos can swap
// projections without the user losing the white-on-black look.
export function buildLineArtMap(geojson, projection, {
  feRadius = 1,
  backgroundColor = 0x000000,
  strokeColor = 0xe8eef5,
  strokeOpacity = 1.0,
} = {}) {
  const group = new THREE.Group();
  group.name = 'land';
  // Backdrop disc. `depthTest: false` + `renderOrder = 5` keeps the
  // black backdrop painted on top of `DiscBase`'s ocean / rim at any
  // camera distance. Without this, zooming way out in heavenly-vault
  // FE flickers the line-art map against the ocean disc because both
  // sit within ~1e-4 of z=0 and the depth buffer can't resolve them
  // at far focal distances.
  const bgMat = new THREE.MeshBasicMaterial({
    color: backgroundColor, transparent: false,
    side: THREE.DoubleSide, depthWrite: false, depthTest: false,
  });
  const bg = new THREE.Mesh(new THREE.CircleGeometry(feRadius, 128), bgMat);
  bg.position.z = EPS_LIFT;
  bg.renderOrder = 5;
  bg.name = 'lineart-disc';
  group.add(bg);
  // Coastlines.
  const lineSegs = [];
  for (const feat of (geojson && geojson.features) || []) {
    const g = feat.geometry;
    if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates]
                : g.type === 'MultiPolygon' ? g.coordinates
                : [];
    for (const poly of polys) {
      for (const ring of poly) {
        const pts = ringToDiscPoints(ring, projection, feRadius);
        for (let i = 0; i < pts.length - 1; i++) {
          lineSegs.push(pts[i].x,     pts[i].y,     EPS_LIFT * 2);
          lineSegs.push(pts[i + 1].x, pts[i + 1].y, EPS_LIFT * 2);
        }
      }
    }
  }
  const lineMat = new THREE.LineBasicMaterial({
    color: strokeColor, transparent: strokeOpacity < 1, opacity: strokeOpacity,
    depthTest: false,
  });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineSegs, 3));
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  lines.renderOrder = 6;
  lines.name = 'coastlines';
  group.add(lines);
  return group;
}

export function buildBlankMap({ feRadius = 1, color = 0x000000 } = {}) {
  const group = new THREE.Group();
  group.name = 'land';
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: false, side: THREE.DoubleSide, depthWrite: false,
  });
  const geom = new THREE.CircleGeometry(feRadius, 128);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.z = EPS_LIFT;
  mesh.name = 'blank-disc';
  group.add(mesh);
  return group;
}

// -------------------------------------------------------------------------
// Image-asset path
// -------------------------------------------------------------------------
//
// Shows the projection's artwork directly as a flat circular disc at the
// FE disc's size. The texture is UV-cropped to the map circle inscribed
// inside the source canvas so letterbox padding around the artwork
// doesn't bleed through.

export function buildImageMap(projection, { feRadius = 1 } = {}) {
  const group = new THREE.Group();
  group.name = 'land';

  const loader = new THREE.TextureLoader();
  // WebP-first with optional original-format fallback for browsers
  // that can't decode WebP (effectively pre-iOS 14). The fallback
  // re-loads the bytes into the same `tex.image` so the texture
  // ref stays valid.
  const tex = loader.load(projection.imageAsset, undefined, undefined,
    projection.imageAssetFallback ? () => {
      loader.load(projection.imageAssetFallback, (loaded) => {
        tex.image = loaded.image;
        tex.needsUpdate = true;
      });
    } : undefined,
  );
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter  = THREE.LinearMipMapLinearFilter;
  tex.magFilter  = THREE.LinearFilter;
  tex.anisotropy = 4;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;

  // Crop the texture UVs to the inscribed map circle. For a canvas with
  // a non-square aspect (e.g. 1920×1080), the shorter axis sets the
  // circle diameter and the longer axis has padding on both sides.
  const W = projection.imageNativeWidth  || 1;
  const H = projection.imageNativeHeight || 1;
  if (W !== H && W > 0 && H > 0) {
    if (W > H) {
      const cropX = H / W;
      tex.repeat.set(cropX, 1);
      tex.offset.set((1 - cropX) / 2, 0);
    } else {
      const cropY = W / H;
      tex.repeat.set(1, cropY);
      tex.offset.set(0, (1 - cropY) / 2);
    }
  }

  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: false,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const geom = new THREE.CircleGeometry(feRadius, 128);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.z = EPS_LIFT;
  mesh.name = 'map-image';
  group.add(mesh);

  return group;
}
