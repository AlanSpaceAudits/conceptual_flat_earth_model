// Renderer facade: owns the scene, instantiates every world object, and
// routes model 'update' events to their per-frame update methods.

import * as THREE from 'three';
import { SceneManager } from './scene.js';
import {
  DiscBase, DiscGrid, Shadow, EclipseShadow, VaultOfHeavens, ObserversOpticalVault,
  CelestialMarker, Observer, Stars, LatitudeLines, GroundPoint,
  CelestialPoles, DeclinationCircles, Yggdrasil, MtMeru, ToroidalVortex,
  LongitudeRing, CelNavStars, TrackedGroundPoints, CatalogPointStars,
  GPPathOverlay, GPTracer, Discworld, AnalemmaLine, SunMoonGlyph,
} from './worldObjects.js';
import { loadLandGeo, buildGeoJsonLand, buildImageMap, buildBlankMap } from './earthMap.js';
import { Constellations } from './constellations.js';
import { StarfieldChart } from './starfieldChart.js';
import { getProjection } from '../core/projections.js';
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

    this.bscStars = new CatalogPointStars({
      sourceKey: 'BscStars',
      color: 0xfff5d8,
      domeSize: 3,
      sphereSize: 2.5,
      maxCount: 4096,
      clippingPlanes: clipPlanes,
      showKey: 'ShowBsc',
      perVertexColors: true,
      trackerKey: 'BscTargets',
    });
    this.sm.world.add(this.bscStars.group);

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

    this.gpTracer = new GPTracer(clipPlanes);
    this.sm.world.add(this.gpTracer.group);

    this.satelliteStars = new CatalogPointStars({
      sourceKey: 'Satellites',
      color: 0x66ff88,
      domeSize: 4,
      sphereSize: 3.5,
      maxCount: 1024,
      clippingPlanes: clipPlanes,
      requireMembership: true,
      showKey: 'ShowSatellites',
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

    this.sunAnalemma  = new AnalemmaLine(0xffd060, 0.95);
    this.moonAnalemma = new AnalemmaLine(0xc0c0d8, 0.85);
    this.sm.world.add(this.sunAnalemma.group);
    this.sm.world.add(this.moonAnalemma.group);

    model.addEventListener('update', () => this.frame());

    // animation loop
    this._raf = this._raf.bind(this);
    requestAnimationFrame(this._raf);
  }

  async loadLand() {
    this._landGeo = await loadLandGeo();
    this._rebuildLand(this.model.state.MapProjection || 'ae');
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
    const c = m.computed, s = m.state;
    const projId = s.MapProjection || 'ae';
    if (projId !== this._landProjection) {
      this._rebuildLand(projId);
    }
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
    this.sunGP.updateAt(sunLat,  sunLon,  FE_RADIUS, s.ShowGroundPoints);
    this.moonGP.updateAt(moonLat, moonLon, FE_RADIUS, s.ShowGroundPoints);
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
    const sunVaultVis  = c.SunVaultCoord;
    const moonVaultVis = c.MoonVaultCoord;

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
    this.bscStars.update(m);
    this.satelliteStars.update(m);
    this.gpPathOverlay.update(m);
    this.gpTracer.update(m);
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
    // Tracker-as-source-of-truth: Show gates the category, membership
    // always decides which bodies render inside it. STM narrows to
    // FollowTarget when active.
    const showSun   = bodyCategoryOn && trackerSet.has('sun');
    const showMoon  = bodyCategoryOn && trackerSet.has('moon');
    this.sunMarker.group.visible  = showSun;
    this.moonMarker.group.visible = showMoon;
    if (showSun) {
      this.sunMarker.update(
        sunVaultVis, c.SunOpticalVaultCoord, showTrueVault, s.ShowOpticalVault,
        c.SunAnglesGlobe.elevation,
      );
    }
    if (showMoon) {
      this.moonMarker.update(
        moonVaultVis, c.MoonOpticalVaultCoord, showTrueVault, s.ShowOpticalVault,
        c.MoonAnglesGlobe.elevation,
      );
    }

    const nineOn = !!s.ShowSunMoonNine;
    this.sunNine.update(
      sunVaultVis, c.SunOpticalVaultCoord, 0.10, 0.025,
      nineOn && showSun,
    );
    this.moonNine.update(
      moonVaultVis, c.MoonOpticalVaultCoord, 0.08, 0.020,
      nineOn && showMoon,
    );

    // Planet markers: same pipeline as sun/moon but each has its own vault
    // height so they're layered above the starfield. Optical-vault dots
    // are gated on NightFactor so planets only appear in the observer's
    // sky once the sun has dropped far enough for them to be visible.
    for (const [name, mk] of Object.entries(this.planetMarkers)) {
      const p = c.Planets[name];
      if (!p || !s.ShowPlanets || !bodyCategoryOn) {
        mk.group.visible = false;
        continue;
      }
      if (!trackerSet.has(name)) {
        mk.group.visible = false;
        continue;
      }
      mk.group.visible = true;
      mk.update(p.vaultCoord, p.opticalVaultCoord,
                showTrueVault, s.ShowOpticalVault,
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
      // hidden after exiting first-person mode.
      this.vaultOfHeavens.group.visible = true;
      this.observer.group.visible = true;
      this.rayGroup.visible = true;
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
    // Vault rays to the true sun/moon position on the vault of the heavens
    // stay drawn regardless of horizon: the physical source is still there.
    if (s.ShowVaultRays) {
      if (sunOn)  addRay(c.SunVaultCoord,  0xff8800, 0.9, sunElev);
      if (moonOn) addRay(c.MoonVaultCoord, 0x88aacc, 0.9, moonElev);
    }
    // Optical-vault rays represent what the observer sees, so they fade
    // smoothly with the body's elevation.
    if (s.ShowOpticalVaultRays) {
      if (sunOn  && sunFade  > 0) addRay(c.SunOpticalVaultCoord,  0xcc6600, 0.7 * sunFade,  sunElev);
      if (moonOn && moonFade > 0) addRay(c.MoonOpticalVaultCoord, 0x6688aa, 0.7 * moonFade, moonElev);
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
        const pts = [
          vaultCoord[0], vaultCoord[1], vaultCoord[2],
          opticalCoord[0], opticalCoord[1], opticalCoord[2],
        ];
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        this.rayGroup.add(new THREE.Line(
          geo,
          new THREE.LineBasicMaterial({
            color, transparent: true, opacity: 0.7,
            clippingPlanes: this._clipPlanes,
          }),
        ));
      };
      // STM filter. Sun / moon / per-planet rays only
      // render when their id is in `TrackerTargets` (or when the
      // mode is off — `sunOn` / `moonOn` / `trackerSet` use the
      // same logic the two ray classes above use).
      if (sunOn) {
        addProjectionRay(c.SunVaultCoord,  c.SunOpticalVaultCoord,
                         c.SunAnglesGlobe.elevation,  0xffc844);
      }
      if (moonOn) {
        addProjectionRay(c.MoonVaultCoord, c.MoonOpticalVaultCoord,
                         c.MoonAnglesGlobe.elevation, 0xf4f4f4);
      }
      for (const [name, p] of Object.entries(c.Planets || {})) {
        if (!bodyCatOn || !trackerSet.has(name)) continue;
        addProjectionRay(p.vaultCoord, p.opticalVaultCoord,
                         p.anglesGlobe.elevation,
                         PLANET_RAY_COLORS[name] || 0xff8c66);
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
