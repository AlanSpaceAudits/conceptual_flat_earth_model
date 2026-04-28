// GE art-projection generator.
//
// Produces a 2:1 equirectangular canvas drawn from Natural Earth land
// GeoJSON in a chosen visual style. The resulting canvas wraps onto
// the GE terrestrial sphere via the existing WorldGlobe shader path,
// giving the GE mode a set of "drawn" world maps that mirror the
// generated FE art projections without needing a bundled raster
// asset.

import * as THREE from 'three';

const CANVAS_W = 2048;
const CANVAS_H = 1024;

// World-equirect mapping: lon ∈ [-180, +180] -> x ∈ [0, W];
//                         lat ∈ [+90,  -90] -> y ∈ [0, H].
function lonLatToXY(lon, lat) {
  const x = ((lon + 180) / 360) * CANVAS_W;
  const y = ((90 - lat) / 180) * CANVAS_H;
  return [x, y];
}

function eachRing(geoJson, fn) {
  if (!geoJson || !Array.isArray(geoJson.features)) return;
  for (const feat of geoJson.features) {
    const g = feat && feat.geometry;
    if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates]
      : g.type === 'MultiPolygon' ? g.coordinates
      : null;
    if (!polys) continue;
    for (const poly of polys) {
      for (const ring of poly) fn(ring);
    }
  }
}

// Splits a ring at antimeridian crossings so the canvas paths don't
// shoot a long horizontal stroke across the whole image when a
// polygon wraps around the date line.
function splitAtAntimeridian(ring) {
  const segments = [];
  let cur = [];
  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i];
    if (cur.length === 0) {
      cur.push([lon, lat]);
      continue;
    }
    const prevLon = cur[cur.length - 1][0];
    if (Math.abs(lon - prevLon) > 180) {
      segments.push(cur);
      cur = [[lon, lat]];
    } else {
      cur.push([lon, lat]);
    }
  }
  if (cur.length > 0) segments.push(cur);
  return segments;
}

function drawGraticule(ctx, latStep, lonStep, color, lineWidth) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  for (let lon = -180; lon <= 180; lon += lonStep) {
    const [x] = lonLatToXY(lon, 0);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_H);
    ctx.stroke();
  }
  for (let lat = -90; lat <= 90; lat += latStep) {
    const [, y] = lonLatToXY(0, lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }
  ctx.restore();
}

function buildLandPath(ctx, geoJson) {
  const path = new Path2D();
  eachRing(geoJson, (ring) => {
    const segments = splitAtAntimeridian(ring);
    for (const seg of segments) {
      if (seg.length < 2) continue;
      const [x0, y0] = lonLatToXY(seg[0][0], seg[0][1]);
      path.moveTo(x0, y0);
      for (let i = 1; i < seg.length; i++) {
        const [x, y] = lonLatToXY(seg[i][0], seg[i][1]);
        path.lineTo(x, y);
      }
    }
  });
  return path;
}

const STYLES = {
  ge_line_art(ctx, geoJson) {
    ctx.fillStyle = '#06080d';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const path = buildLandPath(ctx, geoJson);
    ctx.strokeStyle = '#e8eef5';
    ctx.lineWidth = 1.5;
    ctx.stroke(path);
  },

  ge_blueprint(ctx, geoJson) {
    ctx.fillStyle = '#0b2545';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawGraticule(ctx, 15, 15, 'rgba(140, 200, 255, 0.18)', 1);
    drawGraticule(ctx, 30, 30, 'rgba(140, 200, 255, 0.32)', 1.4);
    const path = buildLandPath(ctx, geoJson);
    ctx.strokeStyle = '#9ad7ff';
    ctx.lineWidth = 2;
    ctx.stroke(path);
  },

  ge_topo(ctx, geoJson) {
    ctx.fillStyle = '#a9cfe6';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const path = buildLandPath(ctx, geoJson);
    ctx.fillStyle = '#5a8a4a';
    ctx.fill(path);
    ctx.strokeStyle = '#2c4a26';
    ctx.lineWidth = 1.2;
    ctx.stroke(path);
  },

  ge_sepia(ctx, geoJson) {
    ctx.fillStyle = '#f0e3c2';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawGraticule(ctx, 30, 30, 'rgba(120, 80, 40, 0.18)', 1.2);
    const path = buildLandPath(ctx, geoJson);
    ctx.fillStyle = '#c79a5b';
    ctx.fill(path);
    ctx.strokeStyle = '#5a3818';
    ctx.lineWidth = 1.5;
    ctx.stroke(path);
  },

  ge_translucent(ctx, geoJson) {
    ctx.fillStyle = '#1a3550';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawGraticule(ctx, 30, 30, 'rgba(220, 235, 255, 0.18)', 1);
    const path = buildLandPath(ctx, geoJson);
    ctx.fillStyle = 'rgba(110, 170, 220, 0.65)';
    ctx.fill(path);
    ctx.strokeStyle = 'rgba(220, 240, 255, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.stroke(path);
  },

  ge_neon(ctx, geoJson) {
    ctx.fillStyle = '#0a0014';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const path = buildLandPath(ctx, geoJson);
    ctx.save();
    ctx.shadowColor = '#ff39c5';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#ff39c5';
    ctx.lineWidth = 2.2;
    ctx.stroke(path);
    ctx.restore();
    ctx.save();
    ctx.shadowColor = '#39d4ff';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#39d4ff';
    ctx.lineWidth = 0.8;
    ctx.stroke(path);
    ctx.restore();
  },
};

export const GE_ART_STYLES = Object.keys(STYLES);

// Returns a CanvasTexture ready for the WorldGlobe sphere shader.
// `geoJson` may be null — in that case the canvas is filled with the
// style's background colour and re-rendered later when the GeoJSON
// finishes loading. The caller is responsible for re-invoking with a
// fresh texture once GeoJSON is available.
export function generateGeArtTexture(styleId, geoJson) {
  const draw = STYLES[styleId];
  const cv = document.createElement('canvas');
  cv.width = CANVAS_W;
  cv.height = CANVAS_H;
  const ctx = cv.getContext('2d');
  if (!draw) {
    ctx.fillStyle = '#1a3a5e';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  } else if (!geoJson) {
    ctx.fillStyle = '#1a3a5e';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  } else {
    draw(ctx, geoJson);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  // Match the equirect raster path: shift u by 0.5 so the prime
  // meridian on the canvas (centred at x = W/2) lines up with world
  // +x on the rotated sphere.
  tex.offset.set(0.5, 0);
  tex.needsUpdate = true;
  return tex;
}
