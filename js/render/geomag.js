// Geomagnetic overlay renderer.
//
// Turns the projection-agnostic contour data (js/geomag/contours.js) into a
// THREE.Group for the active map projection: a color-band mesh (the "heatmap")
// and isoline LineSegments, every vertex pushed through projection.project() so
// it lands correctly on whichever projection is current — same path the
// coastlines use. The agonic (zero-declination) line is drawn emphasized.
//
// buildGeomagOverlay(contour, projection, opts) -> THREE.Group

import * as THREE from 'three';

const LIFT_BAND = 2e-4, LIFT_LINE = 4e-4, LIFT_ZERO = 6e-4;   // stack above the disc, below markers
const lerp = (a, b, t) => a + (b - a) * t;

// declination: diverging blue (west) -> pale (0) -> red (east)
function declColor(d) {
  const t = Math.max(-1, Math.min(1, d / 25));
  if (t <= 0) { const u = 1 + t; return [lerp(0.18, 0.95, u), lerp(0.38, 0.95, u), lerp(0.95, 0.95, u)]; }
  return [0.95, lerp(0.95, 0.32, t), lerp(0.95, 0.20, t)];
}
// intensity: sequential cool -> warm over ~22000-66000 nT
const INT_STOPS = [[0, [0.10, 0.12, 0.55]], [0.25, [0.10, 0.65, 0.80]], [0.5, [0.20, 0.75, 0.25]], [0.75, [0.95, 0.88, 0.20]], [1, [0.90, 0.22, 0.15]]];
function intColor(f) {
  const t = Math.max(0, Math.min(1, (f - 22000) / 44000));
  for (let i = 0; i < INT_STOPS.length - 1; i++) {
    if (t <= INT_STOPS[i + 1][0]) { const [t0, c0] = INT_STOPS[i], [t1, c1] = INT_STOPS[i + 1]; const u = (t - t0) / (t1 - t0); return c0.map((c, k) => lerp(c, c1[k], u)); }
  }
  return INT_STOPS[INT_STOPS.length - 1][1];
}

export function buildGeomagOverlay(contour, projection, { feRadius = 1, style = 'both', lineOpacity = 0.85, bandOpacity = 0.32 } = {}) {
  const group = new THREE.Group();
  group.name = 'geomag';
  const color = contour.quantity === 'declination' ? declColor : intColor;
  const proj = (lat, lon) => projection.project(lat, lon, feRadius);

  // --- color bands (heatmap): one colored quad per grid cell ---
  if (style === 'bands' || style === 'both') {
    const { grid, lats, lons } = contour;
    const pos = [], col = [];
    for (let i = 0; i < lats.length - 1; i++) for (let j = 0; j < lons.length - 1; j++) {
      const v = (grid[i][j] + grid[i][j + 1] + grid[i + 1][j + 1] + grid[i + 1][j]) / 4;
      const [r, g, b] = color(v);
      const corners = [[lats[i], lons[j]], [lats[i], lons[j + 1]], [lats[i + 1], lons[j + 1]], [lats[i + 1], lons[j]]];
      const P = corners.map(([la, lo]) => { const p = proj(la, lo); return [p[0], p[1], LIFT_BAND]; });
      for (const idx of [0, 1, 2, 0, 2, 3]) { pos.push(...P[idx]); col.push(r, g, b); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: bandOpacity, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    }));
    mesh.renderOrder = 7;
    group.add(mesh);
  }

  // --- isolines ---
  if (style === 'lines' || style === 'both') {
    const pos = [], col = [], zero = [];
    for (const s of contour.segments) {
      const [r, g, b] = color(s.level);
      for (const [la, lo] of s.pts) {
        const p = proj(la, lo);
        if (s.isZero) zero.push(p[0], p[1], LIFT_ZERO);
        else { pos.push(p[0], p[1], LIFT_LINE); col.push(r, g, b); }
      }
    }
    if (pos.length) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      const m = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: lineOpacity, depthTest: false, depthWrite: false }));
      m.renderOrder = 8;
      group.add(m);
    }
    if (zero.length) {   // agonic line: emphasized white
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(zero, 3));
      const m = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false }));
      m.renderOrder = 9;
      group.add(m);
    }
  }
  return group;
}

// Globe (GE) variant: same contour data, but each lat/lon vertex placed on the
// 3D sphere ([R·cosφ·cosλ, R·cosφ·sinλ, R·sinφ], matching the globe's texture
// convention) instead of the 2D disc. A colour-less depth-writing sphere at the
// globe radius occludes the back hemisphere, so depthTest hides far-side lines.
const DEG = Math.PI / 180;
const sphereXYZ = (lat, lon, R) => {
  const cl = Math.cos(lat * DEG);
  return [R * cl * Math.cos(lon * DEG), R * cl * Math.sin(lon * DEG), R * Math.sin(lat * DEG)];
};

export function buildGeomagGlobe(contour, radius, { style = 'both', lineOpacity = 0.9, bandOpacity = 0.42 } = {}) {
  const group = new THREE.Group();
  group.name = 'geomag-globe';
  const color = contour.quantity === 'declination' ? declColor : intColor;

  // depth-only occluder at the surface: writes the near hemisphere's depth so
  // overlay vertices on the far side fail depthTest and vanish.
  const occ = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32),
    new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, depthTest: true, side: THREE.FrontSide }));
  occ.renderOrder = 6;
  group.add(occ);

  if (style === 'bands' || style === 'both') {
    const { grid, lats, lons } = contour, R = radius * 1.001, pos = [], col = [];
    for (let i = 0; i < lats.length - 1; i++) for (let j = 0; j < lons.length - 1; j++) {
      const v = (grid[i][j] + grid[i][j + 1] + grid[i + 1][j + 1] + grid[i + 1][j]) / 4;
      const [r, g, b] = color(v);
      const P = [[lats[i], lons[j]], [lats[i], lons[j + 1]], [lats[i + 1], lons[j + 1]], [lats[i + 1], lons[j]]].map(([la, lo]) => sphereXYZ(la, lo, R));
      for (const idx of [0, 1, 2, 0, 2, 3]) { pos.push(...P[idx]); col.push(r, g, b); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: bandOpacity, depthTest: true, depthWrite: false, side: THREE.DoubleSide }));
    mesh.renderOrder = 7;
    group.add(mesh);
  }
  if (style === 'lines' || style === 'both') {
    const pos = [], col = [], zero = [], R = radius * 1.002, Rz = radius * 1.003;
    for (const s of contour.segments) {
      const [r, g, b] = color(s.level);
      for (const [la, lo] of s.pts) {
        if (s.isZero) zero.push(...sphereXYZ(la, lo, Rz));
        else { pos.push(...sphereXYZ(la, lo, R)); col.push(r, g, b); }
      }
    }
    if (pos.length) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      const m = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: lineOpacity, depthTest: true, depthWrite: false }));
      m.renderOrder = 8;
      group.add(m);
    }
    if (zero.length) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(zero, 3));
      const m = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthTest: true, depthWrite: false }));
      m.renderOrder = 9;
      group.add(m);
    }
  }
  return group;
}
