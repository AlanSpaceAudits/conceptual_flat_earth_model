// Renderer facade: owns the scene, instantiates every world object, and
// routes model 'update' events to their per-frame update methods.

import * as THREE from 'three';
import { SceneManager } from './scene.js';
import {
  DiscBase, DiscGrid, Shadow, EclipseShadow, VaultOfHeavens, ObserversOpticalVault,
  CelestialMarker, Observer, Stars, LatitudeLines, GroundPoint,
  CelestialPoles, DeclinationCircles, Yggdrasil, MtMeru, ToroidalVortex,
  LongitudeRing, CelNavStars, TrackedGroundPoints, CatalogPointStars,
  GPPathOverlay, GPTracer, StellariumTraceOverlay, Discworld, AnalemmaLine, SunMoonGlyph,
  CentralAngleArcs, MoonOpticalBody, SunOpticalBody,
  MonthMarkers, WorldGlobe, GlobeHeavenlyVault, DomeCausticOverlay,
} from './worldObjects.js';
import { loadLandGeo, buildGeoJsonLand, buildImageMap, buildBlankMap } from './earthMap.js';
import { Constellations } from './constellations.js';
import { StarfieldChart } from './starfieldChart.js';
import { getProjection } from '../core/projections.js';
import { FE_RADIUS } from '../core/constants.js';
import { ToRad } from '../math/utils.js';
import { V } from '../math/vect3.js';
import { celestLatLongToVaultCoord, feLatLongToGlobalFeCoord } from '../core/feGeometry.js';
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

    this.worldGlobe = new WorldGlobe(FE_RADIUS);
    this.sm.world.add(this.worldGlobe.group);

    this.globeHeavenlyVault = new GlobeHeavenlyVault();
    this.sm.world.add(this.globeHeavenlyVault.group);

    this.domeCaustic = new DomeCausticOverlay();
    this.sm.world.add(this.domeCaustic.group);

    this.longitudeRing = new LongitudeRing(FE_RADIUS);
    this.sm.world.add(this.longitudeRing.group);

    this.land = null; // populated async

    this.discGrid = new DiscGrid(FE_RADIUS);
    this.sm.world.add(this.discGrid.group);

    this.shadow = new Shadow(FE_RADIUS);
    this.sm.world.add(this.shadow.group);

    // solar-eclipse ground shadow (umbra + penumbra) drawn
    // on the disc during active eclipse demos. Visibility gates on
    // state.EclipseActive + state.EclipseKind === 'solar'.
    this.eclipseShadow = new EclipseShadow(FE_RADIUS);
    this.sm.world.add(this.eclipseShadow.group);

    this.latLines = new LatitudeLines(FE_RADIUS);
    this.sm.world.add(this.latLines.group);

    this.sunGP  = new GroundPoint(0xffc844);
    this.moonGP = new GroundPoint(0xf4f4f4);
    this.sm.world.add(this.sunGP.group);
    this.sm.world.add(this.moonGP.group);
    // per-tracked-object GPs. Always visible while target is in
    // TrackerTargets, independent of ShowGroundPoints.
    this.trackedGPs = new TrackedGroundPoints(256);
    this.sm.world.add(this.trackedGPs.group);

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

    // Cel Nav starfield. Hidden unless StarfieldType === 'celnav';
    // shares the ShowStars / DynamicStars / NightFactor gates with the
    // procedural `stars` cloud.
    this.celNavStars = new CelNavStars(clipPlanes);
    this.sm.world.add(this.celNavStars.group);

    this.blackHoleStars = new CatalogPointStars({
      sourceKey: 'BlackHoles',
      color: 0x9966ff,
      domeSize: 4,
      sphereSize: 3.5,
      clippingPlanes: clipPlanes,
      showKey: 'ShowBlackHoles',
    });
    this.sm.world.add(this.blackHoleStars.group);

    this.quasarStars = new CatalogPointStars({
      sourceKey: 'Quasars',
      color: 0x40e0d0,
      domeSize: 4,
      sphereSize: 3.5,
      maxCount: 256,
      clippingPlanes: clipPlanes,
      showKey: 'ShowQuasars',
    });
    this.sm.world.add(this.quasarStars.group);

    this.galaxyStars = new CatalogPointStars({
      sourceKey: 'Galaxies',
      color: 0xff80c0,
      domeSize: 4,
      sphereSize: 3.5,
      maxCount: 256,
      clippingPlanes: clipPlanes,
      showKey: 'ShowGalaxies',
    });
    this.sm.world.add(this.galaxyStars.group);

    // Satellites ride the same generic renderer but default off
    // (visibility is state-gated via ShowSatellites — the computed
    // array is simply empty when the user hasn't enabled them).
    this.gpPathOverlay = new GPPathOverlay();
    this.sm.world.add(this.gpPathOverlay.group);

    // Central / inscribed-angle arcs for GE mode. Visualised per
    // tracker entry; visibility gated on `state.ShowCentralAngle`
    // and `state.ShowInscribedAngle`.
    this.centralAngleArcs = new CentralAngleArcs(16);
    this.sm.world.add(this.centralAngleArcs.group);

    this.stellariumTraces = new StellariumTraceOverlay();
    this.sm.world.add(this.stellariumTraces.group);

    this.gpTracer = new GPTracer(clipPlanes);
    this.sm.world.add(this.gpTracer.group);

    this.sunMonthMarkers = new MonthMarkers({
      color: '#ffe680', size: 0.022, clippingPlanes: [],
      markersKey: 'SunMonthMarkers',
      worldSpaceKey: 'SunMonthMarkersWorldSpace',
      name: 'sun-month-markers',
    });
    this.sunMonthMarkersOpp = new MonthMarkers({
      color: '#ff80c0', size: 0.022, clippingPlanes: [],
      markersKey: 'SunMonthMarkersOpp',
      worldSpaceKey: 'SunMonthMarkersOppWorldSpace',
      name: 'sun-month-markers-opp',
    });
    this.moonMonthMarkers = new MonthMarkers({
      color: '#ffffff', size: 0.026, clippingPlanes: [],
      markersKey: 'MoonMonthMarkers',
      worldSpaceKey: 'MoonMonthMarkersWorldSpace',
      name: 'moon-month-markers',
    });
    this.eclipseMapSolar = new MonthMarkers({
      color: '#ffd040', size: 0.010, clippingPlanes: [],
      markersKey: 'EclipseMapSolar',
      worldSpace: true, noLoop: true, maxLoopPts: 1,
      name: 'eclipse-map-solar',
    });
    this.eclipseMapLunar = new MonthMarkers({
      color: '#a0c8ff', size: 0.010, clippingPlanes: [],
      markersKey: 'EclipseMapLunar',
      worldSpace: true, noLoop: true, maxLoopPts: 1,
      name: 'eclipse-map-lunar',
    });
    this.sm.world.add(this.sunMonthMarkers.group);
    this.sm.world.add(this.sunMonthMarkersOpp.group);
    this.sm.world.add(this.moonMonthMarkers.group);
    this.sm.world.add(this.eclipseMapSolar.group);
    this.sm.world.add(this.eclipseMapLunar.group);

    this.satelliteStars = new CatalogPointStars({
      sourceKey: 'Satellites',
      color: 0x66ff88,
      domeSize: 4,
      sphereSize: 3.5,
      maxCount: 1024,
      clippingPlanes: clipPlanes,
      requireMembership: true,
    });
    this.sm.world.add(this.satelliteStars.group);

    this.constellations = new Constellations(clipPlanes);
    this.sm.world.add(this.constellations.group);

    this.starfieldChart = new StarfieldChart(clipPlanes);
    this.sm.world.add(this.starfieldChart.group);

    this.celestialPoles = new CelestialPoles(clipPlanes);
    this.sm.world.add(this.celestialPoles.group);

    this.decCircles = new DeclinationCircles(clipPlanes);
    this.sm.world.add(this.decCircles.group);

    // Mythic axis-mundi centerpieces at the disc centre. Only one is
    // shown at a time, driven by state.Cosmology.
    this.yggdrasil = new Yggdrasil();
    this.mtMeru    = new MtMeru();
    this.discworld = new Discworld();
    this.toroidalVortex     = new ToroidalVortex('single', clipPlanes);
    this.toroidalVortexDual = new ToroidalVortex('dual',   clipPlanes);
    this.sm.world.add(this.yggdrasil.group);
    this.sm.world.add(this.mtMeru.group);
    this.sm.world.add(this.discworld.group);
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
      jupiter: { color: 0xffa060, vaultSize: 0.0075, opticalSize: 0.0032 },
      saturn:  { color: 0xe4c888, vaultSize: 0.0060, opticalSize: 0.0028 },
      // Uranus / Neptune markers. Smaller than Saturn because
      // they're fainter to the naked eye (Uranus mag ~5.7, Neptune
      // mag ~7.8, both at the limit of unaided visibility under dark
      // skies). Pale blue-green pigments reference their known
      // telescopic colours.
      uranus:  { color: 0xa8d8e0, vaultSize: 0.0040, opticalSize: 0.0020 },
      neptune: { color: 0x7fa6e8, vaultSize: 0.0038, opticalSize: 0.0018 },
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

    this.sunNine  = new SunMoonGlyph('9', '#1a1a1a', clipPlanes);
    this.moonNine = new SunMoonGlyph('9', '#1a1a1a', clipPlanes);
    this.sm.world.add(this.sunNine.group);
    this.sm.world.add(this.moonNine.group);

    // Optical-vault moon body: textured + phase-shaded plane that
    // overlays the small moon dot when the user is inside the
    // optical hemisphere. Crater base + per-frame phase composite.
    this.moonOpticalBody = new MoonOpticalBody(clipPlanes);
    this.sm.world.add(this.moonOpticalBody.group);

    // Optical-vault sun body: yellow face plane (with sunspots) +
    // additive halo plane. Same size as the moon body so eclipses
    // overlap exactly. Render orders layered so the moon body
    // (52) eclipses the sun face (51.5) while the halo (49) shows
    // through as corona.
    this.sunOpticalBody = new SunOpticalBody(clipPlanes);
    this.sm.world.add(this.sunOpticalBody.group);

    this._clipPlanes = clipPlanes;

    this.observer = new Observer();
    this.sm.world.add(this.observer.group);
    if (this.observer.zenithToCenter) {
      this.sm.world.add(this.observer.zenithToCenter);
    }

    // Top-level origin marker for the axis line — orange dot at
    // world (0, 0, 0). In GE mode the WorldGlobe's own `center`
    // dot is visible (inside the globe group); in FE mode that
    // group is hidden so this top-level dot picks up the FE case.
    // Gated on `s.ShowAxisLine`.
    this.originDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 12, 10),
      new THREE.MeshBasicMaterial({
        color: 0xff8040, transparent: true, opacity: 0.95,
        depthTest: false, depthWrite: false,
      }),
    );
    this.originDot.renderOrder = 70;
    this.originDot.visible = false;
    this.sm.world.add(this.originDot);

    // Anchor dot — orange dot left at the previous observer
    // position when the user teleports via the origin click.
    // Click again to swap back. Tracked world coord lives at
    // `this._lastDotWorld` so the click handler in mouseHandler
    // can hit-test it.
    this.lastDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 12, 10),
      new THREE.MeshBasicMaterial({
        color: 0xff8040, transparent: true, opacity: 0.95,
        depthTest: false, depthWrite: false,
      }),
    );
    this.lastDot.renderOrder = 70;
    this.lastDot.visible = false;
    this._lastDotWorld = null;
    this.sm.world.add(this.lastDot);

    // Rays as Line objects managed via this.rebuildRays() each frame.
    this.rayGroup = new THREE.Group();
    this.rayGroup.name = 'rays';
    this.sm.world.add(this.rayGroup);

    // Hover-pickable LoS / Earth-curve intersection markers. Cleared
    // and rebuilt every `_updateRays` call. The canvas pointermove
    // handler raycasts against this list and shows a tooltip with
    // the chord-tangent angle when the cursor is over a triangle.
    this._losMarks = [];
    this._losRaycaster = new THREE.Raycaster();
    this._losMouseV = new THREE.Vector2();
    this.canvas.addEventListener('pointermove', (e) => {
      if (!this._losMarks.length) {
        if (this._losTip) this._losTip.style.display = 'none';
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
      const y = ((e.clientY - rect.top)  / rect.height) * -2 + 1;
      this._losMouseV.set(x, y);
      this._losRaycaster.setFromCamera(this._losMouseV, this.sm.camera);
      const hits = this._losRaycaster.intersectObjects(this._losMarks, false);
      if (hits.length) {
        const ud = hits[0].object.userData;
        const tip = this._ensureLosTip();
        // Inscribed angle = ½ × central angle (obs ↔ GP). That's
        // the angle the red triangle reads.
        tip.textContent = `Inscribed angle: ${ud.inscribedAngle.toFixed(2)}°`;
        const viewRect = (document.getElementById('view') || document.body).getBoundingClientRect();
        tip.style.left = `${e.clientX - viewRect.left + 12}px`;
        tip.style.top  = `${e.clientY - viewRect.top  + 12}px`;
        tip.style.display = 'block';
      } else if (this._losTip) {
        this._losTip.style.display = 'none';
      }
    });

    // Track curves (sun/moon arc lines). Also clipped at disc.
    this.sunTrack  = this._blankLine(0xffa000, 0.75, clipPlanes);
    this.moonTrack = this._blankLine(0xffffff, 0.7, clipPlanes);
    this.sm.world.add(this.sunTrack);
    this.sm.world.add(this.moonTrack);

    this.sunAnalemma  = new AnalemmaLine(0xffd060, 0.95);
    this.moonAnalemma = new AnalemmaLine(0xffffff, 0.85);
    this.sunVaultArc  = new AnalemmaLine(0xffe680, 0.85);
    this.moonVaultArc = new AnalemmaLine(0xffffff, 0.9);
    this.sm.world.add(this.sunAnalemma.group);
    this.sm.world.add(this.moonAnalemma.group);
    this.sm.world.add(this.sunVaultArc.group);
    this.sm.world.add(this.moonVaultArc.group);

    model.addEventListener('update', () => this.frame());

    // animation loop
    this._raf = this._raf.bind(this);
    requestAnimationFrame(this._raf);

    // Pre-compile every material's shader program right after setup
    // so the first frame after toggling InsideVault / WorldModel
    // doesn't block on JIT GLSL compilation. Three.js compiles shader
    // programs lazily on first render, which is what makes the
    // Heavenly → Optical transition pause for ~hundreds of ms the
    // first time. `renderer.compile` walks the scene and links
    // every program ahead of time. Done after a microtask so any
    // pending material setup in the constructors has settled.
    Promise.resolve().then(() => {
      try {
        this.sm.renderer.compile(this.sm.scene, this.sm.camera);
      } catch { /* compile is best-effort; ignore failure */ }
    });
  }

  async loadLand() {
    this._landGeo = await loadLandGeo();
    if (this.worldGlobe && typeof this.worldGlobe.setLandGeo === 'function') {
      this.worldGlobe.setLandGeo(this._landGeo);
    }
    const s = this.model.state;
    const projId = (s.WorldModel === 'ge')
      ? (s.MapProjectionGe || 'hq_equirect_night')
      : (s.MapProjection || 'ae');
    this._rebuildLand(projId);
    this.frame();
  }

  _rebuildLand(projectionId) {
    const projection = getProjection(projectionId);
    const isBlank = projection.renderStyle === 'blank';
    if (!this._landGeo && !projection.imageAsset && !isBlank) return;
    if (this.land) {
      this.sm.world.remove(this.land);
      this.land.traverse((o) => {
        o.geometry?.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m.dispose());
        }
      });
    }
    this.land = isBlank
      ? buildBlankMap({ feRadius: FE_RADIUS })
      : projection.imageAsset
      ? buildImageMap(projection, { feRadius: FE_RADIUS })
      : buildGeoJsonLand(this._landGeo, projection, { feRadius: FE_RADIUS });
    this.sm.world.add(this.land);
    this._landProjection = projectionId;
  }

  _blankLine(color, opacity, clippingPlanes = []) {
    const m = new THREE.LineBasicMaterial({
      color, transparent: opacity < 1, opacity, clippingPlanes,
    });
    return new THREE.Line(new THREE.BufferGeometry(), m);
  }

  _ensureLosTip() {
    if (this._losTip) return this._losTip;
    const el = document.createElement('div');
    el.id = 'los-mark-tip';
    el.style.cssText = [
      'position: absolute',
      'pointer-events: none',
      'padding: 5px 9px',
      'font: 11px/1.35 ui-monospace, Menlo, monospace',
      'color: #fff',
      'background: rgba(180, 40, 40, 0.92)',
      'border: 1px solid #ff6868',
      'border-radius: 3px',
      'z-index: 42',
      'white-space: nowrap',
      'display: none',
    ].join(';');
    // Title row sits in a slightly brighter shade so the readout
    // rows below read as the body of the tooltip.
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      #los-mark-tip .los-tip-title {
        color: #ffe0e0;
        font-weight: 600;
        margin-bottom: 2px;
      }
    `;
    document.head.appendChild(styleTag);
    const view = document.getElementById('view') || document.body;
    view.appendChild(el);
    this._losTip = el;
    return el;
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
    // FE: drop the line straight down from the body's vault coord
    // to the disc surface (z ≈ 0). GE: drop radially from the
    // celestial-sphere coord to the globe-surface GP. The GE
    // celestial sphere sits at radius `c.GlobeVaultRadius` and the
    // globe at `FE_RADIUS`, both centred on the world origin and
    // sharing direction with `topPos`, so the surface point is
    // just `topPos * (FE_RADIUS / GlobeVaultRadius)`.
    const ge = this.model.state.WorldModel === 'ge';
    let bx, by, bz;
    if (ge) {
      const vR = this.model.computed.GlobeVaultRadius || (FE_RADIUS * 2);
      const k = FE_RADIUS / vR;
      bx = topPos[0] * k;
      by = topPos[1] * k;
      bz = topPos[2] * k;
    } else {
      bx = topPos[0];
      by = topPos[1];
      bz = 0.0015;
    }
    const pts = [topPos[0], topPos[1], topPos[2], bx, by, bz];
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
    const c = m.computed, s = m.state;
    // Per-world-model map projection: FE uses `MapProjection`, GE
    // uses `MapProjectionGe`. Each preserves its own dropdown
    // selection so toggling FE/GE doesn't clobber the other map.
    const projId = (s.WorldModel === 'ge')
      ? (s.MapProjectionGe || 'hq_equirect_night')
      : (s.MapProjection || 'ae');
    if (projId !== this._landProjection) {
      this._rebuildLand(projId);
    }
    // FE disc geometry + FE-centric overlays hide whole-cloth in
    // Globe-Earth mode so only the sphere + observer + optical vault
    // read. Optical-vault graticule, celestial poles, and observer-
    // anchored markers stay live since they share the observer's
    // local frame regardless of world model.
    const ge = s.WorldModel === 'ge';
    this.discBase.group.visible      = !ge;
    this.discGrid.group.visible      = !ge;
    this.latLines.group.visible      = !ge;
    this.longitudeRing.group.visible = !ge;
    this.shadow.group.visible        = !ge;
    this.eclipseShadow.group.visible = !ge;
    this.vaultOfHeavens.group.visible = !ge;
    this.starfieldChart.group.visible = !ge;
    this.gpPathOverlay.group.visible = !ge;
    this.yggdrasil.group.visible     = !ge && this.yggdrasil.group.visible;
    this.mtMeru.group.visible        = !ge && this.mtMeru.group.visible;
    this.discworld.group.visible     = !ge && this.discworld.group.visible;
    this.toroidalVortex.group.visible     = !ge && this.toroidalVortex.group.visible;
    this.toroidalVortexDual.group.visible = !ge && this.toroidalVortexDual.group.visible;
    if (this.land) this.land.visible = !ge;
    this.worldGlobe.update(m);
    if (this.worldGlobe && typeof this.worldGlobe.applyMapTexture === 'function') {
      // Stale URL state may carry a non-sphere projection id (e.g.
      // hq_ortho, hq_gleasons). Coerce back to the equirect night
      // default so the sphere always has a sensible texture.
      let geProjId = s.MapProjectionGe || 'hq_equirect_night';
      const geProjEntry = getProjection(geProjId);
      if (!geProjEntry || geProjEntry.wrapsSphere !== true) {
        geProjId = 'hq_equirect_night';
      }
      // Dynamic day/night swap when the user is on either equirect
      // map: pick the day variant while the observer's sun is above
      // civil-twilight midpoint (NightFactor < 0.5). Preserves the
      // user's dropdown selection — only the rendered texture flips.
      let effectiveProjId = geProjId;
      if (geProjId === 'hq_equirect_night' || geProjId === 'hq_equirect_day') {
        effectiveProjId = (c.NightFactor || 0) < 0.5
          ? 'hq_equirect_day' : 'hq_equirect_night';
      }
      this.worldGlobe.applyMapTexture(effectiveProjId, getProjection);
    }
    this.globeHeavenlyVault.update(m);
    this.domeCaustic.update(m);
    this.discGrid.update(m);
    this.shadow.update(m);
    // eclipse shadow + observer darkening feature-flagged off
    // by default (`state.ShowEclipseShadow`). The mesh + darken
    // calculations are skipped entirely; the rest of the eclipse
    // demo system (date selection, ephemeris-linked playback,
    // Meeus warning banner, autoplay queue) continues to run.
    // Re-enable by flipping the state default to true.
    if (s.ShowEclipseShadow) {
      this.eclipseShadow.update(m);
      const eclipseDark = this.eclipseShadow.computeObserverDarkFactor(m);
      this.sm.setEclipseDarkFactor?.(eclipseDark);
    } else {
      this.eclipseShadow.group.visible = false;
      this.sm.setEclipseDarkFactor?.(0);
    }
    this.latLines.update(m);
    this.longitudeRing.update(m);

    // Sub-solar and sub-lunar ground points land on the canonical
    // shell, not the projection art. Projection choice no longer
    // moves sun / moon dots, vault markers, or tracks.
    const wrapLon = (x) => ((x + 180) % 360 + 360) % 360 - 180;
    const sunLat  = c.SunDec * 180 / Math.PI;
    const sunLon  = wrapLon(c.SunRA * 180 / Math.PI - c.SkyRotAngle);
    const moonLat = c.MoonDec * 180 / Math.PI;
    const moonLon = wrapLon(c.MoonRA * 180 / Math.PI - c.SkyRotAngle);
    this.sunGP.updateAt(sunLat,  sunLon,  FE_RADIUS, s.ShowGroundPoints, ge);
    this.moonGP.updateAt(moonLat, moonLon, FE_RADIUS, s.ShowGroundPoints, ge);
    // in Specified Tracker Mode the built-in sun/moon GPs
    // defer to the TrackedGroundPoints layer: those only paint the
    // tracked-body GPs, which is exactly the the spec. Hide
    // the default-on sun/moon GPs whenever the mode is active.
    if (s.SpecifiedTrackerMode) {
      this.sunGP.updateAt(0, 0, FE_RADIUS, false);
      this.moonGP.updateAt(0, 0, FE_RADIUS, false);
    }
    this.trackedGPs.update(m);

    // Vault markers use the canonical vault coords app.js already
    // computes. No overlay-level re-projection.
    const _ge = s.WorldModel === 'ge';
    const sunVaultVis  = _ge ? (c.SunGlobeVaultCoord  || c.SunVaultCoord)  : c.SunVaultCoord;
    const moonVaultVis = _ge ? (c.MoonGlobeVaultCoord || c.MoonVaultCoord) : c.MoonVaultCoord;

    // Vertical dashed line from each body's sub-point on its vault down
    // to its ground point on the disc. Hidden when the true-source end is
    // hidden (InsideVault mode or ShowTruePositions off) since the line
    // would dangle with nothing at its top.
    // hide the sun/moon dashed GP lines in Specified Tracker
    // Mode when their target isn't in `TrackerTargets`. Matches the
    // sun/moon GP-dot gate added in so the default-on
    // sun/moon dashed verticals don't persist while only e.g. Mars
    // is tracked.
    const stmGP = !!s.SpecifiedTrackerMode;
    const trackerSetGP = new Set(
      Array.isArray(s.TrackerTargets) ? s.TrackerTargets : [],
    );
    if (s.FollowTarget) trackerSetGP.add(s.FollowTarget);
    const sunGPShow  = !stmGP || trackerSetGP.has('sun');
    const moonGPShow = !stmGP || trackerSetGP.has('moon');
    const showGPLine = s.ShowGroundPoints
                     && !s.InsideVault
                     && (s.ShowTruePositions !== false);
    this.sunGPLine.visible  = showGPLine && sunGPShow;
    this.moonGPLine.visible = showGPLine && moonGPShow;
    if (s.ShowGroundPoints && sunGPShow)  this._updateDashedLine(this.sunGPLine,  sunVaultVis);
    if (s.ShowGroundPoints && moonGPShow) this._updateDashedLine(this.moonGPLine, moonVaultVis);

    this.vaultOfHeavens.update(m);
    this.observersOpticalVault.update(m);
    this.stars.update(m);
    this.celNavStars.update(m);
    this.blackHoleStars.update(m);
    this.quasarStars.update(m);
    this.galaxyStars.update(m);
    this.satelliteStars.update(m);
    this.gpPathOverlay.update(m);
    this.centralAngleArcs.update(m);
    this.stellariumTraces.update(m);
    this.gpTracer.update(m);
    this.sunMonthMarkers.update(m);
    this.sunMonthMarkersOpp.update(m);
    this.moonMonthMarkers.update(m);
    this.eclipseMapSolar.update(m);
    this.eclipseMapLunar.update(m);
    this.starfieldChart.update(m);
    this.constellations.update(m);
    // When a chart starfield is active, hide both the heavenly-vault and
    // the optical-vault random clouds so the chart is the sole sky source.
    // Constellations are auto-unchecked by the chart-transition handler in
    // main.js, so no extra suppression needed here.
    if ((m.state.StarfieldType || 'random') !== 'random') {
      this.stars.domePoints.visible   = false;
      this.stars.spherePoints.visible = false;
    }
    // Specified Tracker Mode: hide the random starfield
    // entirely. Per-star filtering for cel-nav and catalogued stars
    // happens inside their respective renderers (they already read
    // the state flag there).
    if (s.SpecifiedTrackerMode) {
      this.stars.domePoints.visible   = false;
      this.stars.spherePoints.visible = false;
    }
    this.celestialPoles.update(m);
    this.decCircles.update(m);
    this.yggdrasil.update(m);
    this.mtMeru.update(m);
    this.discworld.update(m);
    this.toroidalVortex.update(m);
    this.toroidalVortexDual.update(m);
    this.observer.update(m);
    // Top-level orange dot — represents the (lat 90°, lon 0°)
    // "home" position in both projections so the same location
    // shows in equivalent screen-space when the user toggles
    // FE ↔ GE. FE: AE pole at world (0, 0, 0). GE: globe-north
    // pole at world (0, 0, FE_RADIUS).
    if (this.originDot) {
      this.originDot.visible = !!s.ShowAxisLine;
      if (this.originDot.visible) {
        if (s.WorldModel === 'ge') {
          this.originDot.position.set(0, 0, FE_RADIUS);
        } else {
          this.originDot.position.set(0, 0, 0);
        }
      }
    }
    // Anchor dot — render at the saved LastObserver* lat/lon, in
    // whichever projection is current. Hidden when no
    // saved-last value or when ShowAxisLine is off.
    if (this.lastDot) {
      const haveLast = s.ShowAxisLine
        && s.LastObserverLat != null && s.LastObserverLong != null;
      if (haveLast) {
        const lat = s.LastObserverLat, lon = s.LastObserverLong;
        let pos;
        if (s.WorldModel === 'ge') {
          const cl = Math.cos(lat * Math.PI / 180);
          const sl = Math.sin(lat * Math.PI / 180);
          const co = Math.cos(lon * Math.PI / 180);
          const so = Math.sin(lon * Math.PI / 180);
          pos = [FE_RADIUS * cl * co, FE_RADIUS * cl * so, FE_RADIUS * sl];
        } else {
          pos = feLatLongToGlobalFeCoord(lat, lon, FE_RADIUS);
        }
        this.lastDot.position.set(pos[0], pos[1], pos[2]);
        this._lastDotWorld = pos;
        this.lastDot.visible = true;
      } else {
        this.lastDot.visible = false;
        this._lastDotWorld = null;
      }
    }

    // In first-person (InsideVault) mode the true-source markers on the
    // heavenly vault must not render — the observer is supposed to see only
    // what's projected into their optical vault. `showVault` on the
    // CelestialMarker controls just those true-source dots and halos.
    // `ShowTruePositions` is the explicit toggle for the same effect
    // without entering first-person mode.
    const showTrueVault = !s.InsideVault && (s.ShowTruePositions !== false);
    // Specified Tracker Mode filter. When on, a sun / moon /
    // planet marker is only rendered if added
    // its id to `TrackerTargets`. The target id is the same id the
    // panel button grid emits ('sun', 'moon', planet name).
    const stm = !!s.SpecifiedTrackerMode;
    const trackerSet = stm
      ? new Set(s.FollowTarget ? [s.FollowTarget] : [])
      : new Set(Array.isArray(s.TrackerTargets) ? s.TrackerTargets : []);
    if (!stm && s.FollowTarget) trackerSet.add(s.FollowTarget);
    const bodyCategoryOn = s.ShowCelestialBodies !== false;
    const showSun   = bodyCategoryOn && trackerSet.has('sun');
    const showMoon  = bodyCategoryOn && trackerSet.has('moon');
    const sunOptVis  = _ge ? (c.SunGlobeOpticalVaultCoord  || c.SunOpticalVaultCoord)  : c.SunOpticalVaultCoord;
    const moonOptVis = _ge ? (c.MoonGlobeOpticalVaultCoord || c.MoonOpticalVaultCoord) : c.MoonOpticalVaultCoord;
    // Marker fade follows actual elevation in both modes — bodies
    // disappear from the optical cap as they cross the horizon.
    const sunElevForFade  = c.SunAnglesGlobe.elevation;
    const moonElevForFade = c.MoonAnglesGlobe.elevation;

    this.sunMarker.group.visible  = showSun;
    this.moonMarker.group.visible = showMoon;
    if (showSun) {
      this.sunMarker.update(
        sunVaultVis, sunOptVis, showTrueVault, s.ShowOpticalVault,
        sunElevForFade,
      );
    }
    if (showMoon) {
      this.moonMarker.update(
        moonVaultVis, moonOptVis, showTrueVault, s.ShowOpticalVault,
        moonElevForFade,
      );
    }

    const nineOn = !!s.ShowSunMoonNine;
    this.sunNine.update(
      sunVaultVis, sunOptVis, 0.10, 0.025,
      nineOn && showSun,
    );
    this.moonNine.update(
      moonVaultVis, moonOptVis, 0.08, 0.020,
      nineOn && showMoon,
    );

    // Optical-vault moon body (craters + phase) — only when the user
    // is inside the optical hemisphere (Optical view in FE, sphere
    // wrap in GE). Uses real ephemeris MoonPhase / MoonRotation.
    const moonBodyShow = showMoon && s.ShowOpticalVault && s.InsideVault;
    const moonElevFade = Math.max(0, Math.min(1, (moonElevForFade + 3) / 5));
    this.moonOpticalBody.update(
      moonOptVis,
      0.024,
      moonBodyShow,
      c.MoonPhase || 0,
      c.MoonRotation || 0,
      this.sm.camera,
      moonElevFade,
    );

    // Optical-vault sun body — same size as the moon body, gated
    // identically (only inside the optical hemisphere). Sunspots
    // rotate with `c.MoonRotation`: the same observer-frame angle
    // the moon's terminator uses so the sun's surface markings tilt
    // with latitude / sky position.
    const sunBodyShow = showSun && s.ShowOpticalVault && s.InsideVault;
    const sunElevFade = Math.max(0, Math.min(1, (sunElevForFade + 3) / 5));
    this.sunOpticalBody.update(
      sunOptVis,
      0.024,
      sunBodyShow,
      c.MoonRotation || 0,
      this.sm.camera,
      sunElevFade,
    );

    // Planet markers: same pipeline as sun/moon but each has its own vault
    // height so they're layered above the starfield. Optical-vault dots
    // are gated on NightFactor so planets only appear in the observer's
    // sky once the sun has dropped far enough for them to be visible.
    for (const [name, mk] of Object.entries(this.planetMarkers)) {
      const p = c.Planets[name];
      if (!p || !bodyCategoryOn) {
        mk.group.visible = false;
        continue;
      }
      if (!trackerSet.has(name)) {
        mk.group.visible = false;
        continue;
      }
      mk.group.visible = true;
      const planetVaultVis = _ge ? (p.globeVaultCoord || p.vaultCoord) : p.vaultCoord;
      const planetOptVis   = _ge ? (p.globeOpticalVaultCoord || p.opticalVaultCoord) : p.opticalVaultCoord;
      const planetElevForFade = p.anglesGlobe.elevation;
      mk.update(planetVaultVis, planetOptVis,
                showTrueVault, s.ShowOpticalVault,
                planetElevForFade, c.NightFactor);
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
      this.constellations.domeStars.visible = false;
      this.constellations.domeLines.visible = false;
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
      // hidden after exiting first-person mode. Keep the FE-only dome
      // off in GE mode (it represents the flat-disc heavenly vault).
      this.vaultOfHeavens.group.visible = !(s.WorldModel === 'ge');
      this.observer.group.visible = true;
      this.rayGroup.visible = true;
    }

    // FE-only optical-vault overlays — opticalVaultProject + the FE
    // Local→Global transform place these around `ObserverFeCoord`,
    // which doesn't follow the GE observer. Run last so each class's
    // own `update()` doesn't undo the gate.
    if (ge) {
      this.celestialPoles.group.visible     = false;
      this.decCircles.group.visible         = false;
      // MonthMarkers + eclipse-map markers now use globe-aware
      // optical-vault coords (S546/S548/S552), so they read in GE.
      this.sunNine.group.visible            = false;
      this.moonNine.group.visible           = false;
      // GP-tracer sky line still uses the FE-projected
      // opticalVaultCoord; until that's re-projected for GE, hide.
      if (this.gpTracer) this.gpTracer.skyGroup.visible = false;
    }

    // Terrestrial-sphere occlusion. In GE the WorldGlobe mesh
    // becomes opaque + depth-writing, and every sphere-projected
    // layer (true-position heavenly-vault dots and observer
    // optical-vault dots) gets `depthTest = true`. Anything
    // layered behind the terrestrial sphere is depth-culled in
    // both heavenly and optical views.
    this._applyDepthState(ge);
  }

  _applyDepthState(ge) {
    if (this.worldGlobe && this.worldGlobe.sphere) {
      const m = this.worldGlobe.sphere.material;
      const wantTransparent = !ge;
      // Track expected state so we only flag needsUpdate when
      // something actually changed. Without this guard, the sphere's
      // ShaderMaterial relinks every frame and the cumulative cost
      // shows up as a stutter on view-mode flips.
      let changed = false;
      if (m.transparent !== wantTransparent) { m.transparent = wantTransparent; changed = true; }
      const wantOpacity = ge ? 1.0 : 0.85;
      if (m.opacity !== wantOpacity) {
        m.opacity = wantOpacity;
        if (m.uniforms && m.uniforms.uOpacity) m.uniforms.uOpacity.value = wantOpacity;
      }
      if (m.depthWrite !== true) { m.depthWrite = true; changed = true; }
      if (changed) m.needsUpdate = true;
    }
    const setDT = (obj) => {
      if (!obj || !obj.material) return;
      if (obj.material.depthTest !== ge) {
        obj.material.depthTest = ge;
        obj.material.needsUpdate = true;
      }
    };
    const layers = [
      this.stars && this.stars.spherePoints,
      this.celNavStars && this.celNavStars.spherePoints,
      this.blackHoleStars && this.blackHoleStars.spherePoints,
      this.quasarStars && this.quasarStars.spherePoints,
      this.galaxyStars && this.galaxyStars.spherePoints,
      this.satelliteStars && this.satelliteStars.spherePoints,
      this.constellations && this.constellations.sphereStars,
      this.constellations && this.constellations.sphereLines,
      this.sunMarker && this.sunMarker.sphereDot,
      this.sunMarker && this.sunMarker.sphereHalo,
      this.moonMarker && this.moonMarker.sphereDot,
      this.moonMarker && this.moonMarker.sphereHalo,
    ];
    for (const obj of layers) setDT(obj);
    for (const mk of Object.values(this.planetMarkers || {})) {
      if (!mk) continue;
      setDT(mk.sphereDot);
      setDT(mk.sphereHalo);
    }
  }

  _updateTracks() {
    const s = this.model.state;
    const c = this.model.computed;
    // Tracks are built on the canonical shell via celestLatLongToVaultCoord
    // (AE math internally) + TransMatVaultToFe. Projection choice does
    // not move them.
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

    this.sunAnalemma.update(c.SunAnalemmaPoints, s.ShowSunAnalemma);
    this.moonAnalemma.update(c.MoonAnalemmaPoints, s.ShowMoonAnalemma);
    this.sunVaultArc.update(c.SunVaultArcPoints,  !!s.SunVaultArcOn);
    this.moonVaultArc.update(c.MoonVaultArcPoints, !!s.MoonVaultArcOn);
  }

  _updateRays() {
    // Clear previous
    while (this.rayGroup.children.length) {
      const c = this.rayGroup.children.pop();
      c.geometry?.dispose();
      c.material?.dispose();
    }
    if (this._losMarks) this._losMarks.length = 0;
    const s = this.model.state;
    const c = this.model.computed;
    const ge = s.WorldModel === 'ge';
    const obs = ge ? c.GlobeObserverCoord : c.ObserverFeCoord;
    if (!obs) return;
    // Below-horizon parking sentinel from worldObjects.js / app.js
    // (`localGlobe[0] <= 0` → coord = [0, 0, -1000]). Only apply
    // to the optical-vault layer; the heavenly-vault coord is
    // valid in every direction.
    const isParked = (v) => !v || (v[0] === 0 && v[1] === 0 && v[2] === -1000);

    // Two-pass ray drawer: solid where the line is unoccluded,
    // dashed where it passes behind something opaque (the GE
    // terrestrial sphere is the typical occluder). The solid pass
    // uses the default depth test (LessEqualDepth → renders only
    // when the fragment is in front); the dashed pass flips
    // depthFunc to GreaterDepth so it renders only behind opaque
    // geometry. Together they give a continuous line that visibly
    // passes through the globe so the line-of-sight reads at a
    // glance. FE has no opaque occluders along ray paths, so the
    // dashed pass is invisible there.
    const addRayLine = (pts, color, opacity) => {
      const op = Math.max(0, Math.min(1, opacity));
      const geoSolid = new THREE.BufferGeometry();
      geoSolid.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      this.rayGroup.add(new THREE.Line(
        geoSolid,
        new THREE.LineBasicMaterial({
          color, transparent: op < 1, opacity: op,
          clippingPlanes: this._clipPlanes,
        }),
      ));
      const geoDash = new THREE.BufferGeometry();
      geoDash.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const lineDash = new THREE.Line(
        geoDash,
        new THREE.LineDashedMaterial({
          color, transparent: true, opacity: op * 0.55,
          dashSize: 0.018, gapSize: 0.012,
          depthFunc: THREE.GreaterDepth,
          depthWrite: false,
          clippingPlanes: this._clipPlanes,
        }),
      );
      lineDash.computeLineDistances();
      this.rayGroup.add(lineDash);
    };

    // Straight-line GE ray. The disc-arc bezier the FE side uses
    // doesn't have a sensible analogue on the sphere, so GE draws
    // a plain segment from the observer (or vault point) to the
    // body's vault / optical-vault coord.
    const addStraight = (from, to, color, opacity = 0.9) => {
      const pts = [from[0], from[1], from[2], to[0], to[1], to[2]];
      addRayLine(pts, color, opacity);
    };

    // Chord-tangent intersection marker. For a GE LoS observer→body,
    // when the body sits geometrically below the local horizon the
    // ray's chord re-enters the globe; we mark the second
    // intersection (where the chord exits the sphere) with a small
    // red triangle tangent to the surface so the LoS / curve
    // intersection reads at a glance. With observer ON the sphere
    // (|O| = R), the chord parameter t > 0 satisfies:
    //   t = -2 (O · D) / (D · D),  D = T − O
    // and the marker is drawn only when 0 < t ≤ 1 (intersection
    // lies on the observer-target segment).
    // Eye height in FE_RADIUS units. 6 ft / Earth radius
    // = 1.8288 m / 6 378 000 m ≈ 2.87 × 10⁻⁷. Lifts the LoS
    // observer just off the globe surface so the chord-crossing
    // threshold matches a real ~6 ft tall observer's horizon dip
    // (~50 arcsec) rather than the geometric tangent at the bare
    // surface point.
    const EYE_H_REL = 2.87e-7;
    const addLosIntersectionMark = (O, T) => {
      if (!ge || !O || !T) return;
      // Lift observer along its outward normal by EYE_H_REL.
      const Olen0 = Math.hypot(O[0], O[1], O[2]) || 1;
      const oxh0 = O[0] / Olen0, oyh0 = O[1] / Olen0, ozh0 = O[2] / Olen0;
      const liftAbs = FE_RADIUS * EYE_H_REL;
      const Pox = O[0] + oxh0 * liftAbs;
      const Poy = O[1] + oyh0 * liftAbs;
      const Poz = O[2] + ozh0 * liftAbs;
      const Dx = T[0] - Pox, Dy = T[1] - Poy, Dz = T[2] - Poz;
      const dd = Dx * Dx + Dy * Dy + Dz * Dz;
      if (dd <= 1e-12) return;
      // |P + t·D|² = R²; with |P| = R + h, the 2·t·(P·D) chord
      // term acquires a constant `(2·R·h + h²)`. Solve the full
      // quadratic and pick the smallest positive root in (0, 1].
      const pd = Pox * Dx + Poy * Dy + Poz * Dz;
      const Pl2 = Pox * Pox + Poy * Poy + Poz * Poz;
      const c0 = Pl2 - FE_RADIUS * FE_RADIUS;
      const disc = pd * pd - dd * c0;
      if (disc <= 0) return;
      const sq = Math.sqrt(disc);
      const t1 = (-pd - sq) / dd;
      const t2 = (-pd + sq) / dd;
      let t = Number.POSITIVE_INFINITY;
      if (t1 > 1e-6 && t1 <= 1) t = Math.min(t, t1);
      if (t2 > 1e-6 && t2 <= 1) t = Math.min(t, t2);
      if (!Number.isFinite(t)) return;
      // Marker position: place at the great-circle MIDPOINT of the
      // minor arc from observer Ô to the body's GP direction T̂.
      // From any point on the major arc the chord obs↔GP subtends
      // an inscribed angle equal to half the central angle (the
      // inscribed-angle theorem). Anchoring the marker at this
      // midpoint surfaces the geometry — its angular distance from
      // both observer and GP equals the inscribed angle (central /
      // 2). Lift to FE_RADIUS so the marker sits on the globe.
      const Tlen0 = Math.hypot(T[0], T[1], T[2]) || 1;
      // Olen0 / oxh0 / oyh0 / ozh0 are already defined above for the
      // 6-ft-lift step; reuse them so the unit-direction work isn't
      // duplicated and the module doesn't choke on a redeclaration.
      const oxh = oxh0, oyh = oyh0, ozh = ozh0;
      const txh = T[0] / Tlen0, tyh = T[1] / Tlen0, tzh = T[2] / Tlen0;
      let mxh = oxh + txh, myh = oyh + tyh, mzh = ozh + tzh;
      const mLen = Math.hypot(mxh, myh, mzh) || 1;
      mxh /= mLen; myh /= mLen; mzh /= mLen;
      const Px = mxh * FE_RADIUS;
      const Py = myh * FE_RADIUS;
      const Pz = mzh * FE_RADIUS;
      const nx = mxh, ny = myh, nz = mzh;
      // Build two tangent axes perpendicular to the surface normal.
      let ax, ay, az;
      if (Math.abs(nz) < 0.9) { ax = 0; ay = 0; az = 1; }
      else                    { ax = 1; ay = 0; az = 0; }
      let ux = ay * nz - az * ny;
      let uy = az * nx - ax * nz;
      let uz = ax * ny - ay * nx;
      const ul = Math.hypot(ux, uy, uz) || 1;
      ux /= ul; uy /= ul; uz /= ul;
      const vx = ny * uz - nz * uy;
      const vy = nz * ux - nx * uz;
      const vz = nx * uy - ny * ux;
      const sz = FE_RADIUS * 0.012;
      // Lift slightly off the surface so the triangle doesn't
      // z-fight with the globe shader.
      const lift = FE_RADIUS * 0.0008;
      const cx = Px + nx * lift, cy = Py + ny * lift, cz = Pz + nz * lift;
      // Equilateral triangle pointing along +u (apex up the slope),
      // base along v.
      const a = [cx + ux * sz, cy + uy * sz, cz + uz * sz];
      const b = [cx + (-0.5 * ux + 0.866 * vx) * sz,
                 cy + (-0.5 * uy + 0.866 * vy) * sz,
                 cz + (-0.5 * uz + 0.866 * vz) * sz];
      const cP = [cx + (-0.5 * ux - 0.866 * vx) * sz,
                  cy + (-0.5 * uy - 0.866 * vy) * sz,
                  cz + (-0.5 * uz - 0.866 * vz) * sz];
      const verts = new Float32Array([
        a[0], a[1], a[2],
        b[0], b[1], b[2],
        cP[0], cP[1], cP[2],
      ]);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      const mat = new THREE.MeshBasicMaterial({
        color: 0xff3030,
        side: THREE.DoubleSide,
        transparent: true, opacity: 0.95,
        depthTest: false, depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 70;
      // Three related angles by the inscribed / chord-tangent
      // corollaries of the central-angle theorem:
      //   • Central angle obs↔GP: angle at the globe centre between
      //     observer's radial and the body's GP direction. For a
      //     body on the celestial sphere at world position T, the
      //     GP direction equals T̂ (T normalised), so this is
      //     `acos(Ô · T̂)`. For below-horizon bodies it exceeds
      //     90° (the body sits past the geometric horizon).
      //   • Inscribed angle: by the inscribed-angle theorem, half
      //     the central angle obs↔GP — the angle a great-circle
      //     observer at any other surface point would measure
      //     looking at the same arc.
      //   • Chord-tangent angle: the angle between the LoS chord
      //     and the tangent plane at the exit point Q, equal to
      //     `asin(|D̂ · N̂|)` where D̂ is the chord direction and N̂
      //     is the surface normal at Q. By the chord-tangent
      //     corollary this equals (arc obs↔Q) / 2.
      const Dlen = Math.sqrt(dd) || 1;
      const dn = (Dx * nx + Dy * ny + Dz * nz) / Dlen;
      const tangentDeg = Math.asin(Math.min(1, Math.abs(dn))) * 180 / Math.PI;
      const Tlen = Math.hypot(T[0], T[1], T[2]) || 1;
      const Olen = Math.hypot(O[0], O[1], O[2]) || 1;
      const cosCentral = (O[0] * T[0] + O[1] * T[1] + O[2] * T[2])
                       / (Olen * Tlen);
      const centralDeg = Math.acos(Math.max(-1, Math.min(1, cosCentral)))
                       * 180 / Math.PI;
      const inscribedDeg = centralDeg / 2;
      mesh.userData.kind = 'losMark';
      mesh.userData.tangentAngle = tangentDeg;
      mesh.userData.centralAngle = centralDeg;
      mesh.userData.inscribedAngle = inscribedDeg;
      this._losMarks.push(mesh);
      this.rayGroup.add(mesh);
    };

    // When the body is above the horizon the ray is a gentle
    // quadratic bezier (one lift control). Below the horizon LoS is
    // broken, so we fall back to a cubic bezier with two control
    // points that arc sharply over the dome — the ray "wraps" across
    // the vault instead of tunnelling through the disc. Lift scales
    // with how far below the horizon the body sits.
    const addRay = (target, color, opacity = 0.9, elevation = 90) => {
      const baseLift = s.VaultHeight * 0.15 * s.RayParameter;
      const pts = [];
      if (elevation >= 0) {
        const mid = V.Scale(V.Add(obs, target), 0.5);
        const ctl = V.Add(mid, [0, 0, baseLift]);
        for (let i = 0; i <= 40; i++) {
          const t = i / 40, u = 1 - t;
          pts.push(
            u * u * obs[0] + 2 * u * t * ctl[0] + t * t * target[0],
            u * u * obs[1] + 2 * u * t * ctl[1] + t * t * target[1],
            u * u * obs[2] + 2 * u * t * ctl[2] + t * t * target[2],
          );
        }
      } else {
        // Cubic arc: lift rises steeply near the observer, peaks over
        // the dome top (zenith), then drops toward the body's true
        // vault position on the far side of the sky.
        const deep = Math.min(90, Math.abs(elevation));
        const archHeight = s.VaultHeight * (0.6 + deep / 90) * s.RayParameter;
        const c1 = [obs[0],    obs[1],    obs[2] + archHeight * 1.2];
        const c2 = [target[0], target[1], target[2] + archHeight * 1.2];
        for (let i = 0; i <= 60; i++) {
          const t = i / 60, u = 1 - t;
          const b0 = u * u * u;
          const b1 = 3 * u * u * t;
          const b2 = 3 * u * t * t;
          const b3 = t * t * t;
          pts.push(
            b0 * obs[0] + b1 * c1[0] + b2 * c2[0] + b3 * target[0],
            b0 * obs[1] + b1 * c1[1] + b2 * c2[1] + b3 * target[1],
            b0 * obs[2] + b1 * c1[2] + b2 * c2[2] + b3 * target[2],
          );
        }
      }
      addRayLine(pts, color, opacity);
    };

    // Smooth fade from -3° below horizon up to +2° above, matching the
    // optical-vault orb fade. Keeps the ray line from snapping on/off
    // between frames when autoplay is running fast.
    const fade = (elev) => Math.max(0, Math.min(1, (elev + 3) / 5));
    const sunFade  = fade(c.SunAnglesGlobe.elevation);
    const moonFade = fade(c.MoonAnglesGlobe.elevation);

    // Ray filter matches the renderer rule: membership always
    // required, STM narrows to just FollowTarget. Also require the
    // Celestial Bodies category to be on so a hidden category never
    // emits rays for any of its bodies.
    const stm = !!s.SpecifiedTrackerMode;
    const trackerSet = stm
      ? new Set(s.FollowTarget ? [s.FollowTarget] : [])
      : new Set(Array.isArray(s.TrackerTargets) ? s.TrackerTargets : []);
    if (!stm && s.FollowTarget) trackerSet.add(s.FollowTarget);
    const bodyCatOn = s.ShowCelestialBodies !== false;
    const sunOn   = bodyCatOn && trackerSet.has('sun');
    const moonOn  = bodyCatOn && trackerSet.has('moon');

    const sunElev  = c.SunAnglesGlobe.elevation;
    const moonElev = c.MoonAnglesGlobe.elevation;
    // Mode-dispatched coords. GE reads the globe-sphere projections
    // (sphere → celestial sphere for vault, sphere → optical
    // hemisphere for optical-vault) which co-locate the rays with
    // the same per-mode geometry the markers use.
    const sunVault  = ge ? c.SunGlobeVaultCoord  : c.SunVaultCoord;
    const moonVault = ge ? c.MoonGlobeVaultCoord : c.MoonVaultCoord;
    const sunOpt    = ge ? c.SunGlobeOpticalVaultCoord  : c.SunOpticalVaultCoord;
    const moonOpt   = ge ? c.MoonGlobeOpticalVaultCoord : c.MoonOpticalVaultCoord;

    // Star catalog colour palette + lookup. Mirrors the GPTracer
    // logic in worldObjects.js so trackers / rays / GP traces all
    // pick the same colour for the same star.
    const STAR_CAT_COLORS = {
      celnav:     0xffe8a0,
      catalogued: 0xffffff,
      blackhole:  0x9966ff,
      quasar:     0x40e0d0,
      galaxy:     0xff80c0,
      satellite:  0x66ff88,
      bsc:        0xfff5d8,
    };
    const findStarEntry = (starId) => {
      const lookups = [
        ['celnav',     c.CelNavStars],
        ['catalogued', c.CataloguedStars],
        ['blackhole',  c.BlackHoles],
        ['quasar',     c.Quasars],
        ['galaxy',     c.Galaxies],
        ['satellite',  c.Satellites],
      ];
      for (const [cat, list] of lookups) {
        if (!list) continue;
        const e = list.find((x) => x.id === starId);
        if (e) return { entry: e, cat };
      }
      return null;
    };
    const starTargets = [];
    for (const id of trackerSet) {
      if (typeof id === 'string' && id.startsWith('star:')) {
        const found = findStarEntry(id.slice(5));
        if (!found) continue;
        const { entry, cat } = found;
        const baseColor = STAR_CAT_COLORS[cat] || 0xffffff;
        starTargets.push({ entry, color: baseColor, cat });
      }
    }

    // Vault rays to the true sun/moon position on the vault of the heavens
    // stay drawn regardless of horizon: the physical source is still there.
    if (s.ShowVaultRays) {
      if (ge) {
        if (sunOn  && sunVault)  { addStraight(obs, sunVault,  0xff8800, 0.9); addLosIntersectionMark(obs, sunVault); }
        if (moonOn && moonVault) { addStraight(obs, moonVault, 0xffffff, 0.9); addLosIntersectionMark(obs, moonVault); }
      } else {
        if (sunOn)  addRay(sunVault,  0xff8800, 0.9, sunElev);
        if (moonOn) addRay(moonVault, 0xffffff, 0.9, moonElev);
      }
      for (const st of starTargets) {
        const v = ge ? (st.entry.globeVaultCoord || st.entry.vaultCoord) : st.entry.vaultCoord;
        if (!v) continue;
        if (ge) { addStraight(obs, v, st.color, 0.9); addLosIntersectionMark(obs, v); }
        else    { addRay(v, st.color, 0.9, st.entry.anglesGlobe?.elevation ?? 90); }
      }
    }
    // Optical-vault rays represent what the observer sees, so they fade
    // smoothly with the body's elevation. Optical-vault rays are
    // straight LoS segments in both FE and GE — the bezier arc only
    // suits the heavenly-vault rays, where the body sits on the
    // dome and the lift control conveys the dome shape. The
    // observer's optical projection is a literal "what you see"
    // line, so a straight chord reads more honestly.
    if (s.ShowOpticalVaultRays) {
      if (sunOn  && sunFade  > 0 && !isParked(sunOpt))  addStraight(obs, sunOpt,  0xcc6600, 0.7 * sunFade);
      if (moonOn && moonFade > 0 && !isParked(moonOpt)) addStraight(obs, moonOpt, 0xcccccc, 0.7 * moonFade);
      for (const st of starTargets) {
        const elev = st.entry.anglesGlobe?.elevation ?? 0;
        const f = fade(elev);
        if (f <= 0) continue;
        const o = ge ? (st.entry.globeOpticalVaultCoord || st.entry.opticalVaultCoord) : st.entry.opticalVaultCoord;
        if (!o || isParked(o)) continue;
        addStraight(obs, o, st.color, 0.7 * f);
      }
    }

    // projection rays: straight segments from a body's true
    // position on the heavenly vault to its projected position on
    // the observer's optical vault. Hidden entirely when the body's
    // elevation is ≤ 0° (below the observer's horizon). Colours
    // match each body's in-scene marker so the rays read as
    // "this body's projection" at a glance. Stars are intentionally
    // excluded — 100+ rays would turn the vault into noise.
    if (s.ShowProjectionRays) {
      const PLANET_RAY_COLORS = {
        mercury: 0xd0b090, venus: 0xfff0c8, mars: 0xd05040,
        jupiter: 0xffa060, saturn: 0xe4c888,
        uranus: 0xa8d8e0,  neptune: 0x7fa6e8,
      };
      const addProjectionRay = (vaultCoord, opticalCoord, elev, color) => {
        if (elev <= 0) return;
        if (!vaultCoord || !opticalCoord) return;
        if (isParked(opticalCoord)) return;
        const pts = [
          vaultCoord[0], vaultCoord[1], vaultCoord[2],
          opticalCoord[0], opticalCoord[1], opticalCoord[2],
        ];
        addRayLine(pts, color, 0.7);
      };
      // STM filter. Sun / moon / per-planet rays only
      // render when their id is in `TrackerTargets` (or when the
      // mode is off — `sunOn` / `moonOn` / `trackerSet` use the
      // same logic the two ray classes above use).
      if (sunOn) {
        addProjectionRay(sunVault, sunOpt,
                         c.SunAnglesGlobe.elevation,  0xffc844);
      }
      if (moonOn) {
        addProjectionRay(moonVault, moonOpt,
                         c.MoonAnglesGlobe.elevation, 0xf4f4f4);
      }
      for (const [name, p] of Object.entries(c.Planets || {})) {
        if (!bodyCatOn || !trackerSet.has(name)) continue;
        const pVault = ge ? (p.globeVaultCoord || p.vaultCoord) : p.vaultCoord;
        const pOpt   = ge ? (p.globeOpticalVaultCoord || p.opticalVaultCoord) : p.opticalVaultCoord;
        addProjectionRay(pVault, pOpt,
                         p.anglesGlobe.elevation,
                         PLANET_RAY_COLORS[name] || 0xff8c66);
      }
      for (const st of starTargets) {
        const v = ge ? (st.entry.globeVaultCoord || st.entry.vaultCoord) : st.entry.vaultCoord;
        const o = ge ? (st.entry.globeOpticalVaultCoord || st.entry.opticalVaultCoord) : st.entry.opticalVaultCoord;
        addProjectionRay(v, o, st.entry.anglesGlobe?.elevation ?? 0, st.color);
      }
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
