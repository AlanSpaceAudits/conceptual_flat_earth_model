// Renderer facade: owns the scene, instantiates every world object, and
// routes model 'update' events to their per-frame update methods.

import * as THREE from 'three';
import { SceneManager } from './scene.js';
import {
  DiscBase, DiscGrid, Shadow, VaultOfHeavens, ObserversOpticalVault,
  CelestialMarker, Observer, Stars, LatitudeLines, GroundPoint,
  CelestialPoles, DeclinationCircles, Yggdrasil, MtMeru, ToroidalVortex,
} from './worldObjects.js';
import { loadLandGeo, buildLandMesh } from './earthMap.js';
import { FE_RADIUS } from '../core/constants.js';
import { ToRad } from '../math/utils.js';
import { V } from '../math/vect3.js';
import { celestLatLongToVaultCoord } from '../core/feGeometry.js';
import { vaultCoordToGlobalFeCoord } from '../core/transforms.js';

export class Renderer {
  constructor(canvas, model) {
    this.canvas = canvas;
    this.model = model;

    this.sm = new SceneManager(canvas, model);

    // Single clipping plane shared across anything that might drop below the
    // disc (z = 0). Everything the observer "sees" is above this plane.
    const clipPlanes = [this.sm.clipBelowDisc];

    this.discBase = new DiscBase(FE_RADIUS);
    this.sm.world.add(this.discBase.group);

    this.land = null; // populated async

    this.discGrid = new DiscGrid(FE_RADIUS);
    this.sm.world.add(this.discGrid.group);

    this.shadow = new Shadow(FE_RADIUS);
    this.sm.world.add(this.shadow.group);

    this.latLines = new LatitudeLines(FE_RADIUS);
    this.sm.world.add(this.latLines.group);

    this.sunGP  = new GroundPoint(0xffc844);
    this.moonGP = new GroundPoint(0xf4f4f4);
    this.sm.world.add(this.sunGP.group);
    this.sm.world.add(this.moonGP.group);

    // Dashed lines from the body's vault position straight down to its
    // ground point. The line ends share (x, y) because the vault and GP
    // come from the same AE projection of (Dec, RA − GMST).
    this.sunGPLine  = this._makeDashedLine(0xffc844);
    this.moonGPLine = this._makeDashedLine(0xf4f4f4);
    this.sm.world.add(this.sunGPLine);
    this.sm.world.add(this.moonGPLine);

    this.vaultOfHeavens = new VaultOfHeavens(clipPlanes);
    this.sm.world.add(this.vaultOfHeavens.group);

    this.observersOpticalVault = new ObserversOpticalVault(clipPlanes);
    this.sm.world.add(this.observersOpticalVault.group);

    this.stars = new Stars(2000, clipPlanes);
    this.sm.world.add(this.stars.group);

    this.celestialPoles = new CelestialPoles(clipPlanes);
    this.sm.world.add(this.celestialPoles.group);

    this.decCircles = new DeclinationCircles(clipPlanes);
    this.sm.world.add(this.decCircles.group);

    // Mythic axis-mundi centerpieces at the disc centre. Only one is
    // shown at a time, driven by state.Cosmology.
    this.yggdrasil = new Yggdrasil();
    this.mtMeru    = new MtMeru();
    this.toroidalVortex     = new ToroidalVortex('single');
    this.toroidalVortexDual = new ToroidalVortex('dual');
    this.sm.world.add(this.yggdrasil.group);
    this.sm.world.add(this.mtMeru.group);
    this.sm.world.add(this.toroidalVortex.group);
    this.sm.world.add(this.toroidalVortexDual.group);

    // Sun and moon markers. Vault-of-heavens dots stay large-ish so they're
    // findable against the starfield; the optical-vault dots are tiny points
    // (observer-relative visual sources). Halos use additive blending so they
    // "bloom" against whatever is behind them.
    this.sunMarker = new CelestialMarker(
      0xffc844,
      { vaultSize: 0.017, opticalSize: 0.004, haloScale: 2.2 },
      clipPlanes,
    );
    this.moonMarker = new CelestialMarker(
      0xf4f4f4,
      { vaultSize: 0.013, opticalSize: 0.003, haloScale: 2.2 },
      clipPlanes,
    );

    // Five classical naked-eye planets, each on their own vault shell with
    // its own marker colour / size.
    // Planets read as *points* of light, clearly smaller than the sun
    // (vaultSize 0.017 / opticalSize 0.004) and the moon (0.013 / 0.003).
    // Slight size differences hint at visual brightness (Venus/Jupiter
    // biggest, Mercury smallest).
    const PLANET_STYLE = {
      mercury: { color: 0xd0b090, vaultSize: 0.0045, opticalSize: 0.0022 },
      venus:   { color: 0xfff0c8, vaultSize: 0.0070, opticalSize: 0.0030 },
      mars:    { color: 0xd05040, vaultSize: 0.0055, opticalSize: 0.0026 },
      jupiter: { color: 0xe8d09a, vaultSize: 0.0075, opticalSize: 0.0032 },
      saturn:  { color: 0xe4c888, vaultSize: 0.0060, opticalSize: 0.0028 },
    };
    this.planetMarkers = {};
    for (const [name, style] of Object.entries(PLANET_STYLE)) {
      const m = new CelestialMarker(
        style.color,
        {
          vaultSize: style.vaultSize, opticalSize: style.opticalSize,
          haloScale: 2.4, showHalo: false, // no glow — keeps planets distinct
        },
        clipPlanes,
      );
      this.planetMarkers[name] = m;
      this.sm.world.add(m.group);
    }
    this.sm.world.add(this.sunMarker.group);
    this.sm.world.add(this.moonMarker.group);

    this._clipPlanes = clipPlanes;

    this.observer = new Observer();
    this.sm.world.add(this.observer.group);

    // Rays as Line objects managed via this.rebuildRays() each frame.
    this.rayGroup = new THREE.Group();
    this.rayGroup.name = 'rays';
    this.sm.world.add(this.rayGroup);

    // Track curves (sun/moon arc lines). Also clipped at disc.
    this.sunTrack  = this._blankLine(0xffa000, 0.75, clipPlanes);
    this.moonTrack = this._blankLine(0xaaaaff, 0.7, clipPlanes);
    this.sm.world.add(this.sunTrack);
    this.sm.world.add(this.moonTrack);

    model.addEventListener('update', () => this.frame());

    // animation loop
    this._raf = this._raf.bind(this);
    requestAnimationFrame(this._raf);
  }

  async loadLand() {
    const gj = await loadLandGeo();
    this.land = buildLandMesh(gj, { feRadius: FE_RADIUS });
    this.sm.world.add(this.land);
    this.frame();
  }

  _blankLine(color, opacity, clippingPlanes = []) {
    const m = new THREE.LineBasicMaterial({
      color, transparent: opacity < 1, opacity, clippingPlanes,
    });
    return new THREE.Line(new THREE.BufferGeometry(), m);
  }

  _makeDashedLine(color) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
    // Plain solid line — dashed materials at this scale read as a column of
    // bead-like dots that get mistaken for stars.
    const mat = new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0.45,
      depthTest: false, depthWrite: false,
    });
    const line = new THREE.Line(geo, mat);
    line.renderOrder = 45;
    return line;
  }

  _updateDashedLine(line, topPos, color) {
    const pts = [topPos[0], topPos[1], topPos[2], topPos[0], topPos[1], 0.0015];
    line.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  }

  _setLinePts(line, pts) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    line.geometry.dispose();
    line.geometry = g;
  }

  frame() {
    const m = this.model;
    this.discGrid.update(m);
    this.shadow.update(m);
    this.latLines.update(m);

    // Sub-solar and sub-lunar ground points (lat/lon where the body is
    // currently at zenith). Dec is the lat; lon is RA - GMST, wrapped to
    // [-180, 180]. These are the disc-surface projections of the true
    // sources on the vault of the heavens.
    const c = m.computed, s = m.state;
    const wrapLon = (x) => ((x + 180) % 360 + 360) % 360 - 180;
    const sunLat  = c.SunDec * 180 / Math.PI;
    const sunLon  = wrapLon(c.SunRA * 180 / Math.PI - c.SkyRotAngle);
    const moonLat = c.MoonDec * 180 / Math.PI;
    const moonLon = wrapLon(c.MoonRA * 180 / Math.PI - c.SkyRotAngle);
    this.sunGP.updateAt(sunLat,  sunLon,  FE_RADIUS, s.ShowGroundPoints);
    this.moonGP.updateAt(moonLat, moonLon, FE_RADIUS, s.ShowGroundPoints);

    // Vertical dashed line from each body's sub-point on its vault down
    // to its ground point on the disc. Hidden when the true-source end is
    // hidden (InsideVault mode or ShowTruePositions off) since the line
    // would dangle with nothing at its top.
    const showGPLine = s.ShowGroundPoints
                     && !s.InsideVault
                     && (s.ShowTruePositions !== false);
    this.sunGPLine.visible  = showGPLine;
    this.moonGPLine.visible = showGPLine;
    if (s.ShowGroundPoints) {
      this._updateDashedLine(this.sunGPLine,  c.SunVaultCoord);
      this._updateDashedLine(this.moonGPLine, c.MoonVaultCoord);
    }

    this.vaultOfHeavens.update(m);
    this.observersOpticalVault.update(m);
    this.stars.update(m);
    this.celestialPoles.update(m);
    this.decCircles.update(m);
    this.yggdrasil.update(m);
    this.mtMeru.update(m);
    this.toroidalVortex.update(m);
    this.toroidalVortexDual.update(m);
    this.observer.update(m);

    // In first-person (InsideVault) mode the true-source markers on the
    // heavenly vault must not render — the observer is supposed to see only
    // what's projected into their optical vault. `showVault` on the
    // CelestialMarker controls just those true-source dots and halos.
    // `ShowTruePositions` is the explicit user toggle for the same effect
    // without entering first-person mode.
    const showTrueVault = !s.InsideVault && (s.ShowTruePositions !== false);
    this.sunMarker.update(
      c.SunVaultCoord, c.SunOpticalVaultCoord, showTrueVault, s.ShowOpticalVault,
      c.SunAnglesGlobe.elevation,
    );
    this.moonMarker.update(
      c.MoonVaultCoord, c.MoonOpticalVaultCoord, showTrueVault, s.ShowOpticalVault,
      c.MoonAnglesGlobe.elevation,
    );

    // Planet markers: same pipeline as sun/moon but each has its own vault
    // height so they're layered above the starfield. Optical-vault dots
    // are gated on NightFactor so planets only appear in the observer's
    // sky once the sun has dropped far enough for them to be visible.
    for (const [name, m] of Object.entries(this.planetMarkers)) {
      const p = c.Planets[name];
      if (!p || !s.ShowPlanets) {
        m.group.visible = false;
        continue;
      }
      m.group.visible = true;
      m.update(p.vaultCoord, p.opticalVaultCoord, showTrueVault, s.ShowOpticalVault,
               p.anglesGlobe.elevation, c.NightFactor);
    }

    this._updateTracks();
    this._updateRays();

    // Visibility overrides for first-person mode. The heavenly vault shell,
    // the dome starfield, the sub-solar / sub-lunar ground points, and the
    // observer's own figure all vanish; the optical vault and its projected
    // markers stay.
    if (s.InsideVault) {
      this.vaultOfHeavens.group.visible = false;
      this.stars.domePoints.visible = false;
      this.sunGP.group.visible  = false;
      this.moonGP.group.visible = false;
      this.sunGPLine.visible    = false;
      this.moonGPLine.visible   = false;
      this.sunTrack.visible     = false;
      this.moonTrack.visible    = false;
      // Hide the observer figure / marker so we're not standing inside it.
      this.observer.group.visible = false;
      // Hide the vault-of-heavens rays (point to true sources).
      this.rayGroup.visible = false;
    } else {
      // Most groups have their own update() that re-derives visibility
      // each frame from state — vaultOfHeavens.update() doesn't touch
      // group.visible, so it has to be restored here or the dome stays
      // hidden after exiting first-person mode.
      this.vaultOfHeavens.group.visible = true;
      this.observer.group.visible = true;
      this.rayGroup.visible = true;
    }
  }

  _updateTracks() {
    const s = this.model.state;
    const c = this.model.computed;
    const trackPts = (lat) => {
      const pts = [];
      for (let lon = -180; lon <= 180; lon += 3) {
        const local = celestLatLongToVaultCoord(lat, lon, s.VaultSize, s.VaultHeight);
        const p = vaultCoordToGlobalFeCoord(local, c.TransMatVaultToFe);
        pts.push(p[0], p[1], p[2]);
      }
      return pts;
    };

    this.sunTrack.visible = s.ShowSunTrack;
    if (s.ShowSunTrack) this._setLinePts(this.sunTrack, trackPts(c.SunCelestLatLong.lat));

    this.moonTrack.visible = s.ShowMoonTrack;
    if (s.ShowMoonTrack) this._setLinePts(this.moonTrack, trackPts(c.MoonCelestLatLong.lat));
  }

  _updateRays() {
    // Clear previous
    while (this.rayGroup.children.length) {
      const c = this.rayGroup.children.pop();
      c.geometry?.dispose();
      c.material?.dispose();
    }
    const s = this.model.state;
    const c = this.model.computed;
    const obs = c.ObserverFeCoord;

    const addRay = (target, color, opacity = 0.9) => {
      // Bezier control point = half-way offset toward observer's local up
      const mid = V.Scale(V.Add(obs, target), 0.5);
      const up = [0, 0, s.VaultHeight * 0.15 * s.RayParameter];
      const ctl = V.Add(mid, up);
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40, u = 1 - t;
        pts.push(
          u * u * obs[0] + 2 * u * t * ctl[0] + t * t * target[0],
          u * u * obs[1] + 2 * u * t * ctl[1] + t * t * target[1],
          u * u * obs[2] + 2 * u * t * ctl[2] + t * t * target[2],
        );
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      this.rayGroup.add(new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({
          color, transparent: opacity < 1, opacity,
          clippingPlanes: this._clipPlanes,
        }),
      ));
    };

    // Smooth fade from -3° below horizon up to +2° above, matching the
    // optical-vault orb fade. Keeps the ray line from snapping on/off
    // between frames when autoplay is running fast.
    const fade = (elev) => Math.max(0, Math.min(1, (elev + 3) / 5));
    const sunFade  = fade(c.SunAnglesGlobe.elevation);
    const moonFade = fade(c.MoonAnglesGlobe.elevation);

    // Vault rays to the true sun/moon position on the vault of the heavens
    // stay drawn regardless of horizon: the physical source is still there.
    if (s.ShowVaultRays) {
      addRay(c.SunVaultCoord,  0xff8800);
      addRay(c.MoonVaultCoord, 0x88aacc);
    }
    // Optical-vault rays represent what the observer sees, so they fade
    // smoothly with the body's elevation.
    if (s.ShowOpticalVaultRays) {
      if (sunFade  > 0) addRay(c.SunOpticalVaultCoord,  0xcc6600, 0.7 * sunFade);
      if (moonFade > 0) addRay(c.MoonOpticalVaultCoord, 0x6688aa, 0.7 * moonFade);
    }
  }

  _raf(ts) {
    // Per-frame tick for features that animate independently of model
    // state changes (the toroidal vortex colour flow is the only one
    // right now). dt in seconds, clamped to avoid jumps from background
    // tabs.
    const now = typeof ts === 'number' ? ts : performance.now();
    const dt = this._lastRafTs
      ? Math.max(0, Math.min(0.1, (now - this._lastRafTs) / 1000))
      : 0;
    this._lastRafTs = now;
    this.toroidalVortex?.tick(dt);
    this.toroidalVortexDual?.tick(dt);
    this.sm.render();
    requestAnimationFrame(this._raf);
  }
}
