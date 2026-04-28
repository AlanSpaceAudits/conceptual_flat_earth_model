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
  cityById, greatCircleArc,
} from '../data/flightRoutes.js';

const ARC_SAMPLES   = 96;
const FE_LIFT       = 0.0035;
const GE_LIFT       = 1.003;
const ROUTE_COLOR   = 0xff8040;
const CITY_COLOR    = 0xff8040;
const LABEL_OFFSET_FE = 0.075;
const LABEL_OFFSET_GE = 0.10;
const RING_INNER    = 0.0085;
const RING_OUTER    = 0.0125;

function makeLabelSprite(text) {
  const cv = document.createElement('canvas');
  cv.width = 320; cv.height = 72;
  const ctx = cv.getContext('2d');
  ctx.font = 'bold 36px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const padX = 14;
  const w = Math.ceil(ctx.measureText(text).width) + padX * 2;
  ctx.fillStyle = 'rgba(15, 19, 28, 0.92)';
  ctx.fillRect(0, 0, w, cv.height);
  ctx.strokeStyle = 'rgba(255, 184, 90, 0.85)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, cv.height - 2);
  ctx.fillStyle = '#ffd6a8';
  ctx.fillText(text, padX, cv.height / 2);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true,
    depthTest: false, depthWrite: false,
  });
  const sp = new THREE.Sprite(mat);
  // Aspect-correct scale: width in canvas pixels → world units.
  const worldH = 0.05;
  const worldW = (w / cv.height) * worldH;
  sp.scale.set(worldW, worldH, 1);
  sp.userData.aspectScale = { worldW, worldH };
  sp.center.set(0, 0.5);
  sp.renderOrder = 71;
  return sp;
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
          depthTest: false, depthWrite: false,
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
          depthTest: false, depthWrite: false,
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
          depthTest: false, depthWrite: false,
        }),
      );
      line.renderOrder = 69;
      line.frustumCulled = false;
      this.group.add(line);
      this._routeLines.set(r.id, line);
    }
  }

  _projectLatLonFE(lat, lon) {
    const d = canonicalLatLongToDisc(lat, lon, FE_RADIUS);
    return [d[0], d[1], FE_LIFT];
  }

  _projectLatLonGE(lat, lon) {
    const φ = lat * Math.PI / 180;
    const λ = lon * Math.PI / 180;
    const cp = Math.cos(φ);
    const r = FE_RADIUS * GE_LIFT;
    return [r * cp * Math.cos(λ), r * cp * Math.sin(λ), r * Math.sin(φ)];
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

  update(model) {
    const s = model.state;
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
      const show = filterSet ? filterSet.has(r.id) : true;
      line.visible = show;
      if (!show) continue;
      const arc = this._routeArcs.get(r.id);
      const buf = line.geometry.attributes.position.array;
      const nDraw = Math.max(2, Math.round(progress * arc.length));
      for (let i = 0; i < nDraw; i++) {
        const { lat, lon } = arc[i];
        const p = project(lat, lon);
        buf[i * 3]     = p[0];
        buf[i * 3 + 1] = p[1];
        buf[i * 3 + 2] = p[2];
      }
      line.geometry.setDrawRange(0, nDraw);
      line.geometry.attributes.position.needsUpdate = true;
    }
  }
}
