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
const PLANE_WORLD    = 0.058;

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

// Pixel-art plane portrait — same chunky 96 × 96 grid the tracker
// HUD uses for the planet / galaxy / quasar panels, scaled 4× so the
// pixels read crisply against the dark info-box background. Drawn
// once on first construction; the box reuses the same canvas across
// every flight-routes demo.
function drawFlightArt(ctx) {
  const SIZE = 96, S = 4;
  const cx = SIZE / 2, cy = SIZE / 2;
  const fillRect = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x * S, y * S, S, S); };
  const fillBlock = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x * S, y * S, w * S, h * S); };
  // Background sky — soft radial fade from indigo to near-black.
  for (let y = 0; y < SIZE; y++) {
    const t = y / (SIZE - 1);
    const r = Math.round(15  + (10 - 15)  * t);
    const g = Math.round(19  + (14 - 19)  * t);
    const b = Math.round(40  + (22 - 40)  * t);
    for (let x = 0; x < SIZE; x++) fillRect(x, y, `rgb(${r}, ${g}, ${b})`);
  }
  // Cloud puffs — a scatter of pale pixels behind the plane.
  ctx.fillStyle = 'rgba(220, 230, 245, 0.28)';
  const clouds = [
    [12, 18, 6, 2], [22, 22, 4, 2], [70, 16, 8, 3], [80, 70, 6, 2],
    [16, 70, 5, 2], [60, 78, 7, 2], [42, 12, 4, 2], [82, 44, 4, 2],
  ];
  for (const [x, y, w, h] of clouds) ctx.fillRect(x * S, y * S, w * S, h * S);
  // Plane body — fuselage centre line + nose taper.
  fillBlock(cx - 2, cy - 24, 4, 50, '#ffe6c0');   // fuselage
  fillBlock(cx - 1, cy - 26, 2, 2, '#fff4d8');    // nose tip
  fillBlock(cx - 3, cy - 22, 6, 4, '#fff4d8');    // cockpit highlight
  // Main wings — wide diamond shape.
  fillBlock(cx - 22, cy + 2, 44, 4, '#ffe6c0');
  fillBlock(cx - 26, cy + 4, 52, 2, '#f4a640');
  fillBlock(cx - 18, cy + 6, 36, 1, '#cc7a18');
  // Tail wings.
  fillBlock(cx - 10, cy + 18, 20, 3, '#ffe6c0');
  fillBlock(cx - 12, cy + 20, 24, 1, '#f4a640');
  // Vertical fin.
  fillBlock(cx - 1, cy + 14, 2, 8, '#ffd698');
  fillBlock(cx - 1, cy + 22, 2, 2, '#cc7a18');
  // Window line on fuselage.
  ctx.fillStyle = '#1a1f30';
  for (let i = 0; i < 8; i++) fillRect(cx - 1, cy - 14 + i * 3, '#1a1f30');
  // Engine pods on the wings.
  fillBlock(cx - 14, cy + 4, 3, 4, '#cc7a18');
  fillBlock(cx + 11, cy + 4, 3, 4, '#cc7a18');
  // Thin orange outline along the leading edge.
  fillBlock(cx - 22, cy + 1, 44, 1, '#ff8040');
  // Speed marks behind the plane.
  ctx.fillStyle = 'rgba(255, 184, 90, 0.55)';
  for (let i = 0; i < 6; i++) fillRect(cx + 4 + i, cy + 12, 'rgba(255, 184, 90, 0.55)');
  for (let i = 0; i < 6; i++) fillRect(cx - 9 - i, cy + 12, 'rgba(255, 184, 90, 0.55)');
}

// Build a single info-box DOM node. Two of these are stacked
// vertically by `_updateInfoBox` so the constant-speed demo can show
// a north-leg + south-leg side-by-side comparison; single-box demos
// only ever populate the first one.
function buildInfoBoxEl(id, top, left) {
  const el = document.createElement('div');
  el.id = id;
  el.className = 'flight-info-box';
  el.style.cssText = [
    'position: absolute',
    `top: ${top}px`,
    `left: ${left}px`,
    'padding: 0',
    'font: 14px/1.45 ui-monospace, Menlo, monospace',
    'color: #f4f6fa',
    'background: rgba(10, 14, 22, 0.94)',
    'border: 1px solid rgba(255, 184, 90, 0.85)',
    'border-radius: 8px',
    'z-index: 30',
    'min-width: 380px',
    'max-width: 460px',
    'pointer-events: none',
    'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35)',
    'display: none',
  ].join(';');
  el.innerHTML = `
    <div class="fi-header">
      <div class="fi-title"></div>
    </div>
    <div class="fi-content">
      <div class="fi-art-row">
        <canvas class="fi-art" width="384" height="384"></canvas>
      </div>
      <div class="fi-readout"></div>
    </div>
  `;
  return el;
}

// Side-panel race track. One canvas, redrawn every frame from the
// active state, showing two straight horizontal tracks whose pixel
// length is proportional to each lane's central angle. Two plane
// icons race along the tracks at `FlightRoutesProgress`. Equal-arc
// demos load both lanes with the same angle, so the straight-line
// race makes the equality obvious even when the map AE projection
// makes the curves look unequal.
function ensureRacePanel() {
  let el = document.getElementById('flight-race-panel');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'flight-race-panel';
  el.style.cssText = [
    'position: absolute',
    'top: 540px',
    'left: 12px',
    'padding: 0',
    'background: rgba(10, 14, 22, 0.94)',
    'border: 1px solid rgba(255, 184, 90, 0.85)',
    'border-radius: 8px',
    'z-index: 30',
    'min-width: 620px',
    'pointer-events: none',
    'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35)',
    'display: none',
  ].join(';');
  el.innerHTML = `
    <div class="fr-header" style="
      padding: 10px 16px;
      background: rgba(255, 154, 60, 0.10);
      border-bottom: 1px solid rgba(255, 184, 90, 0.30);
      border-radius: 8px 8px 0 0;
      color: #f4a640;
      font: 700 18px/1.45 ui-monospace, Menlo, monospace;
      letter-spacing: 0.04em;
    "></div>
    <canvas class="fr-canvas" width="1100" height="560"
      style="width: 600px; height: 305px; display: block; image-rendering: pixelated; padding: 16px;"></canvas>
  `;
  const view = document.getElementById('view') || document.body;
  view.appendChild(el);
  return el;
}

// Silhouette matching the world-plane sprite (`makePlaneTexture` —
// nose at canvas y = -34, tail at y = +32). `headingRad` rotates the
// figure so it can fly in any direction; race lanes pass +π/2 so the
// nose points to canvas +x ("right" along the lane).
function drawPlaneSilhouette(ctx, cx, cy, scale, headingRad = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(headingRad);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#fff5e6';
  ctx.strokeStyle = '#ff8040';
  ctx.lineWidth = 2.5 / scale;
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
  ctx.restore();
}

function drawRaceCanvas(ctx, info, progress) {
  const W = 1100, H = 560;
  ctx.clearRect(0, 0, W, H);
  const lanes = info.lanes || [];
  if (!lanes.length) return;
  const padL = 180;
  const padR = 180;
  const padTopY = 70;
  const padBottomY = 70;
  const trackPxMax = W - padL - padR;
  const laneSpan = (H - padTopY - padBottomY) / Math.max(1, lanes.length);
  // Track lengths scale with each lane's AE-projected arc length so
  // the side panel preserves the same visual length difference the
  // main FE map shows. `angle` (central angle) drives the
  // elapsed° / total° readout — equal angles still finish at the
  // same `progress=1` instant since the route line is parameterised
  // 0..1 regardless of pixel length.
  const lengths = lanes.map((l) => (l.aeLength != null ? l.aeLength : l.angle));
  const maxLength = Math.max(...lengths);
  for (let i = 0; i < lanes.length; i++) {
    const lane = lanes[i];
    const lenPx = (lengths[i] / maxLength) * trackPxMax;
    const yMid = padTopY + laneSpan * (i + 0.5);
    // Lane label.
    ctx.fillStyle = lane.color || '#ffd6a8';
    ctx.font = 'bold 30px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(lane.label || '', 20, yMid - 56);
    ctx.fillStyle = '#9aa3b3';
    ctx.font = '24px ui-monospace, Menlo, monospace';
    ctx.fillText(`${lane.angle.toFixed(2)}°`, 20, yMid + 42);
    // Track baseline.
    ctx.strokeStyle = '#7a8499';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(padL, yMid);
    ctx.lineTo(padL + lenPx, yMid);
    ctx.stroke();
    // Already-traversed segment in accent.
    const swept = lenPx * Math.max(0, Math.min(1, progress));
    ctx.strokeStyle = lane.color || '#ff8040';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(padL, yMid);
    ctx.lineTo(padL + swept, yMid);
    ctx.stroke();
    // Start / end markers.
    ctx.fillStyle = lane.color || '#ff8040';
    ctx.beginPath();
    ctx.arc(padL, yMid, 14, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(padL + lenPx, yMid, 14, 0, 2 * Math.PI);
    ctx.fill();
    // World-plane silhouette riding the swept tip — same shape as
    // the planes flying around the FE map (`makePlaneTexture`),
    // rotated +π/2 so the nose points along the lane.
    const px = padL + swept;
    drawPlaneSilhouette(ctx, px, yMid, 1.0, Math.PI / 2);
    // Live progress as elapsed° / total°.
    ctx.fillStyle = '#ffd698';
    ctx.font = '24px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(
      `${(lane.angle * progress).toFixed(2)}° / ${lane.angle.toFixed(2)}°`,
      W - 20, yMid + 42,
    );
    ctx.textAlign = 'left';
  }
}

function ensureInfoBoxes() {
  let primary   = document.getElementById('flight-info-box');
  let secondary = document.getElementById('flight-info-box-2');
  if (primary && secondary) return [primary, secondary];
  const view = document.getElementById('view') || document.body;
  if (!document.getElementById('flight-info-box-style')) {
    const styleTag = document.createElement('style');
    styleTag.id = 'flight-info-box-style';
    styleTag.textContent = `
      .flight-info-box .fi-header {
        display: flex; align-items: center; gap: 8px;
        padding: 6px 12px;
        background: rgba(255, 154, 60, 0.10);
        border-bottom: 1px solid rgba(255, 184, 90, 0.30);
        border-radius: 8px 8px 0 0;
      }
      .flight-info-box .fi-title { color: #f4a640; font-weight: 700; font-size: 14px; letter-spacing: 0.04em; }
      .flight-info-box .fi-content { padding: 14px 16px; }
      .flight-info-box .fi-art-row {
        display: flex; gap: 16px; align-items: center;
        border-bottom: 1px solid rgba(120, 150, 200, 0.22);
        padding-bottom: 12px; margin-bottom: 10px;
      }
      .flight-info-box .fi-art {
        width: 160px; height: 160px;
        background: rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(120, 150, 200, 0.3);
        border-radius: 4px;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
        flex: 0 0 auto;
      }
      .flight-info-box .fi-readout { display: flex; flex-direction: column; gap: 3px; }
      .flight-info-box .fi-line  { color: #f4f6fa; font-size: 14px; padding: 2px 4px; }
      .flight-info-box .fi-blank { color: #6a7385; font-style: italic; font-size: 14px; padding: 2px 4px; }
      .flight-info-box .fi-live  { color: #ffd698; font-size: 14px; padding: 2px 4px; font-variant-numeric: tabular-nums; }
    `;
    document.head.appendChild(styleTag);
  }
  if (!primary) {
    primary = buildInfoBoxEl('flight-info-box', 80, 12);
    view.appendChild(primary);
    const ctxA = primary.querySelector('.fi-art').getContext('2d');
    ctxA.imageSmoothingEnabled = false;
    drawFlightArt(ctxA);
  }
  if (!secondary) {
    // Side-by-side layout: primary box at 380 px min-width + 12 px
    // starting gutter + 16 px breathing room ≈ 408 px to its right
    // edge. Secondary lands just clear of that.
    secondary = buildInfoBoxEl('flight-info-box-2', 80, 420);
    view.appendChild(secondary);
    const ctxB = secondary.querySelector('.fi-art').getContext('2d');
    ctxB.imageSmoothingEnabled = false;
    drawFlightArt(ctxB);
  }
  return [primary, secondary];
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
    this._routeAngleLines = new Map();
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

      // Central-angle visualisation. FE: lines from each endpoint to
      // the AE pole at world (0, 0, 0) — angle at the disc centre is
      // the longitude separation, not the spherical central angle.
      // GE: lines from each endpoint to the globe centre at world
      // (0, 0, 0) — that angle IS the great-circle central angle.
      // Drawing both legs shows the geometric difference between
      // projections at a glance. Two segments per route, written
      // into one BufferGeometry as a LineSegments call.
      const angleBuf = new Float32Array(12);
      const angleGeom = new THREE.BufferGeometry();
      angleGeom.setAttribute('position', new THREE.BufferAttribute(angleBuf, 3));
      const angleLine = new THREE.LineSegments(
        angleGeom,
        new THREE.LineBasicMaterial({
          color: 0x66c8ff, transparent: true, opacity: 0.95,
          // depthTest off so the legs from each endpoint to the
          // world origin stay visible through the GE terrestrial
          // sphere even when the camera sits inside it via
          // ObserverAtCenter.
          depthTest: false, depthWrite: false,
        }),
      );
      angleLine.renderOrder = 73;
      angleLine.frustumCulled = false;
      this.group.add(angleLine);
      this._routeAngleLines.set(r.id, angleLine);
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

  _renderInfoBox(box, info, state) {
    if (!info || !info.lines) {
      box.style.display = 'none';
      return;
    }
    const titleEl = box.querySelector('.fi-title');
    const readoutEl = box.querySelector('.fi-readout');
    if (titleEl) titleEl.textContent = info.title || 'Flight';
    if (readoutEl) {
      readoutEl.innerHTML = info.lines.map((l) => {
        // Function lines are evaluated per-frame against the live
        // state — used for the constant-speed demo's live
        // remaining-central-angle countdown. Returning a string
        // starting with '!' marks it as a "live" highlighted row;
        // '~' marks blanks; everything else is the normal foreground.
        let val = l;
        if (typeof l === 'function') val = l(state) || '';
        if (typeof val !== 'string') return '';
        if (val.startsWith('~')) return `<div class="fi-blank">${val.slice(1)}</div>`;
        if (val.startsWith('!')) return `<div class="fi-live">${val.slice(1)}</div>`;
        return `<div class="fi-line">${val}</div>`;
      }).join('');
    }
    box.style.display = '';
  }

  _updateInfoBox(state) {
    const [primary, secondary] = ensureInfoBoxes();
    const info = state.FlightInfoBox;
    if (!info) {
      primary.style.display = 'none';
      secondary.style.display = 'none';
    } else if (Array.isArray(info)) {
      this._renderInfoBox(primary,   info[0] || null, state);
      this._renderInfoBox(secondary, info[1] || null, state);
    } else {
      this._renderInfoBox(primary, info, state);
      secondary.style.display = 'none';
    }
    this._updateRacePanel(state);
  }

  _updateRacePanel(state) {
    const panel = ensureRacePanel();
    const race = state.FlightRaceTrack;
    if (!race || !Array.isArray(race.lanes) || race.lanes.length === 0) {
      panel.style.display = 'none';
      return;
    }
    const headerEl = panel.querySelector('.fr-header');
    if (headerEl) headerEl.textContent = race.title || 'Equal Arc — race';
    const cv = panel.querySelector('.fr-canvas');
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const progress = Math.max(0, Math.min(1, state.FlightRoutesProgress || 0));
    drawRaceCanvas(ctx, race, progress);
    panel.style.display = '';
  }

  update(model) {
    const s = model.state;
    this._updateInfoBox(s);
    const on = !!s.ShowFlightRoutes;
    // Body class flips the rest of the HUD (Live Moon Phases panel,
    // Live Ephemeris side tab) out of the way for the duration of a
    // flight-routes demo. CSS rules in `styles.css` key off this
    // class.
    if (typeof document !== 'undefined' && document.body) {
      const has = document.body.classList.contains('flight-demo-active');
      if (on && !has) document.body.classList.add('flight-demo-active');
      else if (!on && has) document.body.classList.remove('flight-demo-active');
    }
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
      const angleLine = this._routeAngleLines.get(r.id);
      const show = filterSet ? filterSet.has(r.id) : true;
      line.visible = show;
      plane.visible = show && progress > 0 && progress < 1;
      compLine.visible = show;
      // `HideFlightCentralAngle` suppresses the endpoint→origin legs
      // even on selected routes — Equal Arc demos use this so the
      // side-by-side race lanes carry the central-angle story
      // exclusively.
      angleLine.visible = show && !s.HideFlightCentralAngle;
      if (!show) continue;
      // Central-angle legs — Depart → centre and Arrival → centre.
      // World origin is the AE pole in FE and the globe centre in GE.
      const fromCity = cityById(r.from), toCity = cityById(r.to);
      const fromP = project(fromCity.lat, fromCity.lon);
      const toP   = project(toCity.lat,   toCity.lon);
      const angleBuf = angleLine.geometry.attributes.position.array;
      angleBuf[0] = fromP[0]; angleBuf[1]  = fromP[1]; angleBuf[2]  = fromP[2];
      angleBuf[3] = 0;        angleBuf[4]  = 0;        angleBuf[5]  = 0;
      angleBuf[6] = toP[0];   angleBuf[7]  = toP[1];   angleBuf[8]  = toP[2];
      angleBuf[9] = 0;        angleBuf[10] = 0;        angleBuf[11] = 0;
      angleLine.geometry.attributes.position.needsUpdate = true;
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
