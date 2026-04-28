// Flight-route renderer.
//
// Plots great-circle paths between named airports across the FE
// disc (azimuthal-equidistant projection at z = 0) and the GE
// terrestrial sphere (radius FE_RADIUS, lat/lon → cartesian). Each
// route is sampled at fixed angular cadence so the curve traces a
// real geodesic on both worlds.
//
// Each city is marked with a flat ground ring at its (lat, lon) and
// a name-box sprite offset along a radial outward direction so the
// box sits clear of the route artwork. A thin leader line from the
// ring centre to the box ties the two together.
//
// Visibility is gated by `s.ShowFlightRoutes`; the optional
// `s.FlightRoutesSelected` filter accepts a route id, an array of
// ids, or `'all'` (the default when toggled on but unspecified) to
// pick the subset of routes to draw. `s.FlightRoutesProgress`
// (0..1) clips each route partway along its arc so the demo
// animator can sweep planes from origin to destination.

import * as THREE from 'three';
import { FE_RADIUS } from '../core/constants.js';
import { canonicalLatLongToDisc } from '../core/canonical.js';
import {
  FLIGHT_CITIES, FLIGHT_ROUTES,
  cityById, greatCircleArc, greatCircleComplement,
} from '../data/flightRoutes.js';

const ARC_SAMPLES   = 96;
const COMP_SAMPLES  = 192;
const FE_LIFT       = 0.0035;
const GE_LIFT       = 1.003;
const ROUTE_COLOR   = 0xff8040;
const CITY_COLOR    = 0xff8040;
const LABEL_OFFSET_FE = 0.20;
const LABEL_OFFSET_GE = 0.26;
const RING_INNER    = 0.0085;
const RING_OUTER    = 0.0125;
// Fixed-size label canvas — every city label uses the same bitmap
// dimensions so the on-screen size doesn't drift between
// long-named and short-named airports. World scale is then a single
// constant for every label, removing the "different resolution"
// look the user flagged.
const LABEL_CANVAS_W = 360;
const LABEL_CANVAS_H = 80;
const LABEL_WORLD_H  = 0.052;
const LABEL_WORLD_W  = LABEL_WORLD_H * (LABEL_CANVAS_W / LABEL_CANVAS_H);
const PLANE_WORLD    = 0.034;

function makeLabelSprite(text) {
  const cv = document.createElement('canvas');
  cv.width = LABEL_CANVAS_W;
  cv.height = LABEL_CANVAS_H;
  const ctx = cv.getContext('2d');
  // Pick the largest font size that fits the longest city name in
  // the fixed-width canvas. Same visual scale for every label, so
  // they all read uniformly across demos.
  let fontPx = 38;
  ctx.font = `bold ${fontPx}px ui-monospace, Menlo, monospace`;
  while (ctx.measureText(text).width > LABEL_CANVAS_W - 32 && fontPx > 18) {
    fontPx -= 1;
    ctx.font = `bold ${fontPx}px ui-monospace, Menlo, monospace`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(15, 19, 28, 0.92)';
  ctx.fillRect(0, 0, LABEL_CANVAS_W, LABEL_CANVAS_H);
  ctx.strokeStyle = 'rgba(255, 184, 90, 0.85)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, LABEL_CANVAS_W - 2, LABEL_CANVAS_H - 2);
  ctx.fillStyle = '#ffd6a8';
  ctx.fillText(text, LABEL_CANVAS_W / 2, LABEL_CANVAS_H / 2);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true,
    depthTest: false, depthWrite: false,
  });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(LABEL_WORLD_W, LABEL_WORLD_H, 1);
  sp.center.set(0.5, 0.5);
  sp.renderOrder = 71;
  return sp;
}

function ensureInfoBox() {
  let el = document.getElementById('flight-info-box');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'flight-info-box';
  el.style.cssText = [
    'position: absolute',
    'top: 88px',
    'left: 16px',
    'padding: 10px 14px',
    'font: 12px/1.45 ui-monospace, Menlo, monospace',
    'color: #ffd6a8',
    'background: rgba(15, 19, 28, 0.94)',
    'border: 1px solid rgba(255, 184, 90, 0.85)',
    'border-radius: 4px',
    'z-index: 30',
    'min-width: 260px',
    'max-width: 360px',
    'pointer-events: none',
    'white-space: pre-line',
    'display: none',
  ].join(';');
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    #flight-info-box .flight-info-title { color: #f4a640; font-weight: 700; margin-bottom: 6px; letter-spacing: 0.04em; }
    #flight-info-box .flight-info-line  { color: #f4f6fa; }
    #flight-info-box .flight-info-blank { color: #6a7385; font-style: italic; }
  `;
  document.head.appendChild(styleTag);
  const view = document.getElementById('view') || document.body;
  view.appendChild(el);
  return el;
}

function makePlaneTexture() {
  const cv = document.createElement('canvas');
  cv.width = 96; cv.height = 96;
  const ctx = cv.getContext('2d');
  // Top-down silhouette with the nose at canvas y = 14 (toward
  // canvas top, which lands at texture v ≈ 0.85). The mesh that
  // wraps this texture is built with its local +y axis pointing in
  // the same direction so a quaternion that aligns +y with the arc
  // tangent makes the plane "fly" in that direction without any
  // billboarded screen-space rotation hacks.
  ctx.translate(48, 48);
  ctx.fillStyle = '#fff5e6';
  ctx.strokeStyle = '#ff8040';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(8, -10);
  ctx.lineTo(36, 4);
  ctx.lineTo(36, 12);
  ctx.lineTo(8, 6);
  ctx.lineTo(6, 22);
  ctx.lineTo(14, 28);
  ctx.lineTo(14, 32);
  ctx.lineTo(0, 28);
  ctx.lineTo(-14, 32);
  ctx.lineTo(-14, 28);
  ctx.lineTo(-6, 22);
  ctx.lineTo(-8, 6);
  ctx.lineTo(-36, 12);
  ctx.lineTo(-36, 4);
  ctx.lineTo(-8, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makePlaneMesh(sharedTex) {
  const geom = new THREE.PlaneGeometry(PLANE_WORLD, PLANE_WORLD);
  const mat = new THREE.MeshBasicMaterial({
    map: sharedTex,
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: true, depthWrite: false,
  });
  const m = new THREE.Mesh(geom, mat);
  m.renderOrder = 72;
  m.frustumCulled = false;
  return m;
}

export class FlightRoutes {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'flight-routes';
    this.group.visible = false;

    // City artwork — one ring + one label sprite + one leader line per
    // city, all top-level so visibility flips without rebuilding.
    this._cityRings  = new Map();
    this._cityLabels = new Map();
    this._cityLeads  = new Map();
    for (const city of FLIGHT_CITIES) {
      const ringGeom = new THREE.RingGeometry(RING_INNER, RING_OUTER, 36);
      const ring = new THREE.Mesh(
        ringGeom,
        new THREE.MeshBasicMaterial({
          color: CITY_COLOR, transparent: true, opacity: 0.95,
          side: THREE.DoubleSide,
          depthTest: true, depthWrite: false,
        }),
      );
      ring.renderOrder = 70;
      this.group.add(ring);
      this._cityRings.set(city.id, ring);

      const label = makeLabelSprite(city.name);
      this.group.add(label);
      this._cityLabels.set(city.id, label);

      const leadGeom = new THREE.BufferGeometry();
      leadGeom.setAttribute('position',
        new THREE.BufferAttribute(new Float32Array(6), 3));
      const lead = new THREE.Line(
        leadGeom,
        new THREE.LineBasicMaterial({
          color: CITY_COLOR, transparent: true, opacity: 0.85,
          depthTest: true, depthWrite: false,
        }),
      );
      lead.renderOrder = 70;
      lead.frustumCulled = false;
      this.group.add(lead);
      this._cityLeads.set(city.id, lead);
    }

    // Pre-sample each route's great-circle path (lat/lon list);
    // only the world-space projection is recomputed per frame so
    // FE↔GE switches don't pay the spherical-interp cost again.
    this._routeArcs = new Map();
    this._routeLines = new Map();
    this._routePlanes = new Map();
    this._routeComps = new Map();
    this._routeCompLines = new Map();
    this._planeTexture = makePlaneTexture();
    for (const r of FLIGHT_ROUTES) {
      const a = cityById(r.from), b = cityById(r.to);
      const arc = greatCircleArc(a.lat, a.lon, b.lat, b.lon, ARC_SAMPLES);
      this._routeArcs.set(r.id, arc);
      const buf = new Float32Array(ARC_SAMPLES * 3);
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(buf, 3));
      geom.setDrawRange(0, ARC_SAMPLES);
      const line = new THREE.Line(
        geom,
        new THREE.LineBasicMaterial({
          color: ROUTE_COLOR, transparent: true, opacity: 0.95,
          depthTest: true, depthWrite: false,
        }),
      );
      line.renderOrder = 69;
      line.frustumCulled = false;
      this.group.add(line);
      this._routeLines.set(r.id, line);

      const plane = makePlaneMesh(this._planeTexture);
      plane.visible = false;
      this.group.add(plane);
      this._routePlanes.set(r.id, plane);

      // Complementary great-circle half — the long way around from B
      // back to A. Drawn as a dashed line so the user can see the
      // full geodesic loop while the solid line marks the actual
      // flight leg.
      const comp = greatCircleComplement(a.lat, a.lon, b.lat, b.lon, COMP_SAMPLES);
      this._routeComps.set(r.id, comp);
      const compBuf = new Float32Array(COMP_SAMPLES * 3);
      const compGeom = new THREE.BufferGeometry();
      compGeom.setAttribute('position', new THREE.BufferAttribute(compBuf, 3));
      compGeom.setDrawRange(0, COMP_SAMPLES);
      const compLine = new THREE.Line(
        compGeom,
        new THREE.LineDashedMaterial({
          color: ROUTE_COLOR, transparent: true, opacity: 0.55,
          dashSize: 0.025, gapSize: 0.018,
          depthTest: true, depthWrite: false,
        }),
      );
      compLine.renderOrder = 68;
      compLine.frustumCulled = false;
      this.group.add(compLine);
      this._routeCompLines.set(r.id, compLine);
    }
  }

  _projectLatLonFE(lat, lon) {
    const d = canonicalLatLongToDisc(lat, lon, FE_RADIUS);
    return [d[0], d[1], FE_LIFT];
  }

  _projectLatLonGE(lat, lon) {
    // The WorldGlobe sphere is built from `SphereGeometry(...).rotateX(π/2)`
    // and sampled with `u_sampled = vUv.x + 0.5`. That UV layout puts
    // texture longitude 0° at world `-x` and longitude 180° at world
    // `+x`, so the geographically-correct cartesian for the texture is
    // `(-cos(lat)cos(lon), -cos(lat)sin(lon), sin(lat))`. Without the
    // sign flip a city renders 180° around the globe from where the
    // texture draws it (Sydney over the South Atlantic, Santiago over
    // Indonesia, etc.).
    const φ = lat * Math.PI / 180;
    const λ = lon * Math.PI / 180;
    const cp = Math.cos(φ);
    const r = FE_RADIUS * GE_LIFT;
    return [-r * cp * Math.cos(λ), -r * cp * Math.sin(λ), r * Math.sin(φ)];
  }

  _resolveSelected(state) {
    const sel = state.FlightRoutesSelected;
    if (sel === 'all' || sel == null) return null;
    if (Array.isArray(sel)) return new Set(sel);
    if (typeof sel === 'string') return new Set([sel]);
    return null;
  }

  _orientRingFE(ring) {
    ring.quaternion.identity();
  }

  _orientRingGE(ring, surfacePos) {
    const n = new THREE.Vector3(surfacePos[0], surfacePos[1], surfacePos[2]).normalize();
    const z = new THREE.Vector3(0, 0, 1);
    const q = new THREE.Quaternion().setFromUnitVectors(z, n);
    ring.quaternion.copy(q);
  }

  _labelOffsetFE(p) {
    const r = Math.hypot(p[0], p[1]);
    if (r < 1e-6) return [LABEL_OFFSET_FE, 0, 0];
    const ux = p[0] / r;
    const uy = p[1] / r;
    return [ux * LABEL_OFFSET_FE, uy * LABEL_OFFSET_FE, 0];
  }

  _labelOffsetGE(p) {
    const r = Math.hypot(p[0], p[1], p[2]);
    if (r < 1e-6) return [0, 0, LABEL_OFFSET_GE];
    return [
      (p[0] / r) * LABEL_OFFSET_GE,
      (p[1] / r) * LABEL_OFFSET_GE,
      (p[2] / r) * LABEL_OFFSET_GE,
    ];
  }

  _updateInfoBox(state) {
    const box = ensureInfoBox();
    const info = state.FlightInfoBox;
    if (!info || !info.lines) {
      box.style.display = 'none';
      return;
    }
    const lines = info.lines.map((l) => {
      if (typeof l !== 'string') return '';
      // Lines starting with '~' render in a muted italic so the user
      // sees "no data" entries clearly. Otherwise normal styling.
      if (l.startsWith('~')) {
        return `<div class="flight-info-line flight-info-blank">${l.slice(1)}</div>`;
      }
      return `<div class="flight-info-line">${l}</div>`;
    }).join('');
    box.innerHTML =
      `<div class="flight-info-title">${info.title || 'Flight'}</div>${lines}`;
    box.style.display = '';
  }

  update(model) {
    const s = model.state;
    this._updateInfoBox(s);
    const on = !!s.ShowFlightRoutes;
    this.group.visible = on;
    if (!on) return;

    const ge = s.WorldModel === 'ge';
    const project = ge
      ? (lat, lon) => this._projectLatLonGE(lat, lon)
      : (lat, lon) => this._projectLatLonFE(lat, lon);
    const filterSet = this._resolveSelected(s);
    const cityFilter = new Set();
    const cityVisible = (id) => filterSet ? cityFilter.has(id) : true;
    if (filterSet) {
      for (const r of FLIGHT_ROUTES) {
        if (filterSet.has(r.id)) {
          cityFilter.add(r.from);
          cityFilter.add(r.to);
        }
      }
    }
    const progress = Math.max(0, Math.min(1, (s.FlightRoutesProgress == null) ? 1 : s.FlightRoutesProgress));

    for (const city of FLIGHT_CITIES) {
      const ring  = this._cityRings.get(city.id);
      const label = this._cityLabels.get(city.id);
      const lead  = this._cityLeads.get(city.id);
      const show  = cityVisible(city.id);
      ring.visible  = show;
      label.visible = show;
      lead.visible  = show;
      if (!show) continue;

      const p = project(city.lat, city.lon);
      ring.position.set(p[0], p[1], p[2]);
      if (ge) {
        this._orientRingGE(ring, p);
      } else {
        this._orientRingFE(ring);
      }

      const off = ge ? this._labelOffsetGE(p) : this._labelOffsetFE(p);
      const labelPos = [p[0] + off[0], p[1] + off[1], p[2] + off[2]];
      label.position.set(labelPos[0], labelPos[1], labelPos[2]);

      const leadBuf = lead.geometry.attributes.position.array;
      leadBuf[0] = p[0];
      leadBuf[1] = p[1];
      leadBuf[2] = p[2];
      leadBuf[3] = labelPos[0];
      leadBuf[4] = labelPos[1];
      leadBuf[5] = labelPos[2];
      lead.geometry.attributes.position.needsUpdate = true;
    }

    for (const r of FLIGHT_ROUTES) {
      const line = this._routeLines.get(r.id);
      const plane = this._routePlanes.get(r.id);
      const compLine = this._routeCompLines.get(r.id);
      const show = filterSet ? filterSet.has(r.id) : true;
      line.visible = show;
      plane.visible = show && progress > 0 && progress < 1;
      compLine.visible = show;
      if (!show) continue;
      // Dashed complementary arc — full set of points refreshed each
      // frame so a FE↔GE switch reprojects the long way correctly.
      const comp = this._routeComps.get(r.id);
      const compBuf = compLine.geometry.attributes.position.array;
      for (let i = 0; i < comp.length; i++) {
        const { lat, lon } = comp[i];
        const cp = project(lat, lon);
        compBuf[i * 3]     = cp[0];
        compBuf[i * 3 + 1] = cp[1];
        compBuf[i * 3 + 2] = cp[2];
      }
      compLine.geometry.attributes.position.needsUpdate = true;
      compLine.computeLineDistances();
      const arc = this._routeArcs.get(r.id);
      const buf = line.geometry.attributes.position.array;
      const nDraw = Math.max(2, Math.round(progress * arc.length));
      let lastP = null, prevP = null;
      for (let i = 0; i < nDraw; i++) {
        const { lat, lon } = arc[i];
        const p = project(lat, lon);
        buf[i * 3]     = p[0];
        buf[i * 3 + 1] = p[1];
        buf[i * 3 + 2] = p[2];
        prevP = lastP;
        lastP = p;
      }
      line.geometry.setDrawRange(0, nDraw);
      line.geometry.attributes.position.needsUpdate = true;
      if (plane.visible && lastP && prevP) {
        // Orient the plane mesh in 3-space so its local +y aligns
        // with the arc tangent (forward) and its local +z aligns
        // with the surface outward normal. FE: outward = world +z;
        // GE: outward = unit vector from origin to lastP. Forward is
        // computed from the previous→current waypoint delta and
        // re-orthogonalised against outward so a sphere-tangent
        // direction rides on the surface plane instead of dipping
        // through it.
        const ge = s.WorldModel === 'ge';
        const upX = ge ? lastP[0] : 0;
        const upY = ge ? lastP[1] : 0;
        const upZ = ge ? lastP[2] : 1;
        let upLen = Math.hypot(upX, upY, upZ) || 1;
        const nUp = new THREE.Vector3(upX / upLen, upY / upLen, upZ / upLen);
        let fwd = new THREE.Vector3(
          lastP[0] - prevP[0],
          lastP[1] - prevP[1],
          lastP[2] - prevP[2],
        );
        const dotF = fwd.dot(nUp);
        fwd.addScaledVector(nUp, -dotF);
        if (fwd.lengthSq() < 1e-12) fwd.set(1, 0, 0);
        fwd.normalize();
        const right = new THREE.Vector3().crossVectors(fwd, nUp).normalize();
        const m = new THREE.Matrix4().makeBasis(right, fwd, nUp);
        plane.quaternion.setFromRotationMatrix(m);
        plane.position.set(lastP[0], lastP[1], lastP[2]);
      } else if (plane.visible && lastP) {
        plane.position.set(lastP[0], lastP[1], lastP[2]);
      }
    }
  }
}
