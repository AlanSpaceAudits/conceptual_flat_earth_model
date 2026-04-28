// Flight-route renderer.
//
// Plots great-circle paths between named airports across the FE
// disc (azimuthal-equidistant projection at z = 0) and the GE
// terrestrial sphere (radius FE_RADIUS, lat/lon → cartesian). Each
// route is sampled at fixed angular cadence so the curve traces a
// real geodesic on both worlds. City markers + labels render as
// small orange points + text sprites at the same lat/lon.
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

function makeLabel(text) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.font = 'bold 32px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(15, 19, 28, 0.92)';
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = '#ffd6a8';
  ctx.fillText(text, 8, 32);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true,
    depthTest: false, depthWrite: false,
  });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(0.18, 0.045, 1);
  sp.renderOrder = 71;
  return sp;
}

export class FlightRoutes {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'flight-routes';
    this.group.visible = false;

    // City markers + labels — one Mesh + one Sprite per city, both
    // top-level so visibility can be flipped without rebuilding.
    this._cityMeshes = new Map();
    this._cityLabels = new Map();
    for (const city of FLIGHT_CITIES) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.008, 12, 10),
        new THREE.MeshBasicMaterial({
          color: CITY_COLOR, transparent: true, opacity: 0.95,
          depthTest: false, depthWrite: false,
        }),
      );
      mesh.renderOrder = 70;
      this.group.add(mesh);
      this._cityMeshes.set(city.id, mesh);

      const label = makeLabel(city.name);
      this.group.add(label);
      this._cityLabels.set(city.id, label);
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
      const mesh = this._cityMeshes.get(city.id);
      const label = this._cityLabels.get(city.id);
      const show = cityVisible(city.id);
      mesh.visible = show;
      label.visible = show;
      if (!show) continue;
      const p = project(city.lat, city.lon);
      mesh.position.set(p[0], p[1], p[2]);
      // Float labels just above each marker so they don't sit on top
      // of the dot sprite. GE places them along the radial outward
      // direction so the label rides on the surface tangent ring.
      if (ge) {
        const r = Math.hypot(p[0], p[1], p[2]) || 1;
        const f = 1 + 0.06;
        label.position.set(p[0] * f, p[1] * f, p[2] * f);
      } else {
        label.position.set(p[0] + 0.01, p[1] + 0.01, p[2] + 0.005);
      }
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
