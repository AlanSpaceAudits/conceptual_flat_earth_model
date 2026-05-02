// Newton's Bucket - dynamics frame demo.
//
// The point of the scene is deliberately narrow:
//   1. The observed fact is the concave water surface: the rim rises when
//      bucket, water, and local aether co-rotate.
//   2. In the Earth-centered inertial (ECI) frame the water has rim speed, so
//      m r omega^2 predicts the concave surface directly.
//   3. A rider rotating with the bucket sees the water at rest. Used as the
//      direct prediction frame, that gives zero centrifugal term and misses the
//      observed surface unless extra inertial forces are inserted.
//   4. The stationary-Earth/aether reading keeps the ECI frame as the direct
//      prediction frame; apparent sky rotation belongs to the
//      surrounding cosmos.

import * as THREE from 'three';
import { BaseExperiment } from '../baseExperiment.js';

const C_BG       = 0x050914;
const C_BUCKET   = 0xd7e2ef;
const C_GROUND   = 0x63748a;
const C_WATER    = 0x55c7ff;
const C_LAB      = 0x42ffd0;
const C_FAIL     = 0xff5a54;
const C_AETHER   = 0xf4a640;
const C_TEXT     = 0xdcecff;
const C_STAR     = 0xffe8a0;

const BUCKET_RADIUS = 0.62;
const BUCKET_HEIGHT = 0.78;
const WATER_CENTER_Z = 0.24;
const WATER_BASE_CURVE = 0.18;
const SKY_DAY_RATE = 0.04; // days per second while the dome-motion toggle is on.
const ROTATION_DIR = -1; // Match the local dome/aether sweep shown in the scene.

const SKY_TARGETS = [
  { id: 'sun',          label: 'Sun',      color: 0xffc844, size: 0.012 },
  { id: 'moon',         label: 'Moon',     color: 0xf4f4f4, size: 0.010 },
  { id: 'venus',        label: 'Venus',    color: 0xfff0c8, size: 0.008 },
  { id: 'mars',         label: 'Mars',     color: 0xff5a54, size: 0.008 },
  { id: 'jupiter',      label: 'Jupiter',  color: 0xffa060, size: 0.009 },
  { id: 'saturn',       label: 'Saturn',   color: 0xe4c888, size: 0.008 },
  { id: 'star:polaris', label: 'Polaris',  color: C_STAR,   size: 0.007 },
  { id: 'star:eltanin', label: 'Eltanin',  color: C_STAR,   size: 0.007 },
  { id: 'star:sirius',  label: 'Sirius',   color: 0xffffff, size: 0.007 },
];

const SKY_TARGET_IDS = SKY_TARGETS.map((target) => target.id);

function cssColor(hex) {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function makeLine(points, color, opacity = 1, dashed = false) {
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = dashed
    ? new THREE.LineDashedMaterial({
        color,
        transparent: opacity < 1,
        opacity,
        dashSize: 0.07,
        gapSize: 0.045,
      })
    : new THREE.LineBasicMaterial({
        color,
        transparent: opacity < 1,
        opacity,
      });
  const line = new THREE.Line(geo, mat);
  if (dashed) line.computeLineDistances();
  return line;
}

function makeSkyLine(points, color, opacity = 1, dashed = false) {
  const line = makeLine(points, color, opacity, dashed);
  line.frustumCulled = false;
  line.renderOrder = 72;
  line.material.depthTest = false;
  line.material.depthWrite = false;
  return line;
}

function setLinePoints(line, points) {
  if (!line) return;
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry().setFromPoints(points);
  line.computeLineDistances?.();
}

function makeRingLine(radius, z, color, opacity = 1, segments = 96) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, z));
  }
  return makeLine(points, color, opacity);
}

function makeCircularArrow(radius, startAngle, sweep, color, z = 0.02, opacity = 1) {
  const group = new THREE.Group();
  const points = [];
  const steps = 42;
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + sweep * (i / steps);
    points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, z));
  }
  group.add(makeLine(points, color, opacity));

  const end = startAngle + sweep;
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.055, 0.13, 14),
    new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity }),
  );
  head.position.set(Math.cos(end) * radius, Math.sin(end) * radius, z);
  const tangent = end + (sweep >= 0 ? Math.PI / 2 : -Math.PI / 2);
  head.rotation.z = tangent - Math.PI / 2;
  group.add(head);
  return group;
}

function setMaterialOpacity(group, opacity) {
  group.traverse((child) => {
    const materials = child.material
      ? (Array.isArray(child.material) ? child.material : [child.material])
      : [];
    for (const material of materials) {
      if (material.userData.baseOpacity == null) {
        material.userData.baseOpacity = material.opacity;
      }
      const baseOpacity = material.userData.baseOpacity;
      material.transparent = baseOpacity < 1 || opacity < 1;
      material.opacity = baseOpacity * opacity;
    }
  });
}

export class NewtonBucketExperiment extends BaseExperiment {
  static get id() { return 'newton-bucket'; }
  static get name() { return "Newton's Bucket"; }
  static get category() { return 'aether'; }
  static get description() {
    return 'Newton bucket: the Earth-centered inertial frame predicts the observed concave water surface directly.';
  }

  init() {
    this.experimentScale = 1;
    this.labScale = 0.30;
    this.followObserver = false;
    this.mode = 'lab';
    this.spinOn = true;
    this.spinRate = 1.0;
    this.skyMotionOn = true;
    this.vortexOn = false;
    this.currentCurve = WATER_BASE_CURVE;
    this.textures = [];
    this.readableSprites = [];
    this.labels = {};
    this.modeButtons = null;
    this.spinToggle = null;
    this.vortexToggle = null;
    this.skyMarkerEntries = new Map();

    this._buildVisualization();
  }

  getHistoricalSetup() {
    return {
      state: {
        WorldModel: 'fe',
        ObserverLat: 90,
        ObserverLong: 0,
        ObserverHeading: 0,
        DateTime: NewtonBucketExperiment.utcDateTime(2019, 3, 29, 3, 19, 0),
        TimezoneOffsetMinutes: 0,
        BodySource: 'astropixels',
        StarfieldType: 'celnav',
        StarTrepidation: true,
        ShowVault: true,
        ShowVaultGrid: false,
        ShowFeGrid: true,
        ShowOpticalVault: false,
        ShowOpticalVaultGrid: false,
        ShowTruePositions: true,
        ShowStars: true,
        ShowPlanets: true,
        ShowCelestialBodies: true,
        ShowCelNav: true,
        ShowConstellations: false,
        ShowConstellationLines: false,
        ShowBlackHoles: false,
        ShowQuasars: false,
        ShowGalaxies: false,
        ShowSatellites: false,
        ShowGroundPoints: false,
        ShowGPTracer: false,
        ShowOpticalVaultTrace: false,
        TraceCelestialFrame: false,
        TrackerTargets: [],
        FollowTarget: null,
        SpecifiedTrackerMode: false,
        ShowLiveEphemeris: false,
        InsideVault: false,
        DarkBackground: true,
        Cosmology: 'none',
        CameraDirection: -32,
        CameraHeight: 38,
        CameraDistance: 6.8,
        Zoom: 4.65,
        Description: 'NEWTON BUCKET: observed concave water surface matches the ECI frame prediction directly.',
      },
    };
  }

  activate() {
    super.activate();
    if (typeof document !== 'undefined') {
      document.body?.classList?.add('newton-bucket-active');
    }
    this.mode = 'lab';
    this.spinOn = true;
    this.skyMotionOn = true;
    this.vortexOn = false;
    this.visualGroup.position.set(0, 0, 0);
    this.visualGroup.scale.setScalar(1);
    this._positionLabAtProjectionCenter();
    this._resetSkyTrails();
    this._applyWaterShape();
    this._refreshMode();
    this._syncVortexState();
    this._updateSkyLayer(true);
  }

  deactivate() {
    if (typeof document !== 'undefined') {
      document.body?.classList?.remove('newton-bucket-active');
    }
    super.deactivate();
  }

  _buildVisualization() {
    this.visualGroup.name = 'Newton bucket inertial frame demo';
    this.visualGroup.position.set(0, 0, 0);
    this.visualGroup.scale.setScalar(1);

    this.skyLayer = this._makeSkyLayer();
    this.visualGroup.add(this.skyLayer);

    this.sceneRoot = new THREE.Group();
    this.sceneRoot.name = 'stationary Earth lab bucket';
    this.sceneRoot.scale.setScalar(this.labScale);
    this.visualGroup.add(this.sceneRoot);

    this.sceneRoot.add(this._makeBase());
    this.sceneRoot.add(this._makeReferenceAxes());

    this.bucketGroup = this._makeBucket();
    this.sceneRoot.add(this.bucketGroup);

    this.spinGroup = this._makeSpinLayer();
    this.sceneRoot.add(this.spinGroup);

    this.actualWater = new THREE.Mesh(
      this._makeWaterGeometry(this.currentCurve),
      new THREE.MeshBasicMaterial({
        color: C_WATER,
        transparent: true,
        opacity: 0.58,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.actualWater.renderOrder = 15;
    this.sceneRoot.add(this.actualWater);

    this.waterContourGroup = new THREE.Group();
    this.sceneRoot.add(this.waterContourGroup);
    this._rebuildWaterContours();

    this.restWater = new THREE.Mesh(
      this._makeWaterGeometry(0),
      new THREE.MeshBasicMaterial({
        color: C_WATER,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.restWater.renderOrder = 14;
    this.sceneRoot.add(this.restWater);

    this.flatPrediction = this._makeFlatPrediction();
    this.sceneRoot.add(this.flatPrediction);

    this.forceArrows = this._makeForceArrows();
    this.sceneRoot.add(this.forceArrows);

    this.cosmosLocal = this._makeCosmosLayer();
    this.sceneRoot.add(this.cosmosLocal);

    this.particles = this._makeWaterParticles();
    this.sceneRoot.add(this.particles);

    this.labels.title = this._makeTextSprite('Newton Bucket Frame Test', {
      color: C_TEXT,
      scale: 0.124,
      width: 500,
      height: 82,
      fontSize: 44,
    });
    this.labels.title.position.set(0, -1.28, 1.1);

    this.labels.frame = this._makeTextSprite('ECI frame: water rotates', {
      color: C_LAB,
      scale: 0.160,
      width: 640,
      height: 104,
      fontSize: 36,
    });
    this.labels.frame.position.set(-0.82, 0.98, 0.92);

    this.labels.law = this._makeTextSprite('ECI correctly predicts: v = omega r -> concave', {
      color: C_AETHER,
      scale: 0.158,
      width: 920,
      height: 104,
      fontSize: 36,
    });
    this.labels.law.position.set(-0.8, 0.3, 0.62);

    this.labels.result = this._makeTextSprite('Matches observation, laws of physics directly apply', {
      color: C_LAB,
      scale: 0.170,
      width: 980,
      height: 108,
      fontSize: 36,
    });
    this.labels.result.position.set(0, -1.18, 0.52);

    this.labels.flat = this._makeTextSprite('Bucket rider predicts flat, not observed', {
      color: C_FAIL,
      scale: 0.150,
      width: 780,
      height: 78,
      fontSize: 34,
    });
    this.labels.flat.position.set(1.22, -0.08, 0.42);

    this.labels.cosmos = this._makeTextSprite('Sky rotates; ECI still predicts concave water', {
      color: C_AETHER,
      scale: 0.164,
      width: 900,
      height: 96,
      fontSize: 34,
    });
    this.labels.cosmos.position.set(0, 0.04, 1.54);

    for (const label of Object.values(this.labels)) {
      this.sceneRoot.add(label);
    }

    this._applyWaterShape();
    this._refreshMode();
  }

  _makeSkyLayer() {
    const group = new THREE.Group();
    group.name = 'actual celestial dome positions';

    this.skyMarkerEntries = new Map();
    for (const target of SKY_TARGETS) {
      const marker = new THREE.Group();
      marker.name = `sky-marker-${target.id}`;
      marker.visible = false;

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(target.size, 18, 14),
        new THREE.MeshBasicMaterial({
          color: target.color,
          transparent: true,
          opacity: 0.82,
          depthTest: false,
          depthWrite: false,
        }),
      );
      dot.renderOrder = 82;
      marker.add(dot);

      const halo = new THREE.Mesh(
        new THREE.RingGeometry(target.size * 1.55, target.size * 2.2, 32),
        new THREE.MeshBasicMaterial({
          color: target.color,
          transparent: true,
          opacity: 0.26,
          side: THREE.DoubleSide,
          depthTest: false,
          depthWrite: false,
        }),
      );
      halo.renderOrder = 81;
      marker.add(halo);

      if (['sun', 'star:polaris'].includes(target.id)) {
        const label = this._makeTextSprite(target.label, {
          color: target.color,
          scale: 0.046,
          width: 260,
          height: 72,
          fontSize: 32,
        });
        label.position.set(0.035, 0.0, 0.018);
        label.renderOrder = 83;
        marker.add(label);
      }

      const drop = makeSkyLine(
        [new THREE.Vector3(), new THREE.Vector3()],
        target.color,
        0.08,
        true,
      );
      drop.visible = false;

      const trail = makeSkyLine([], target.color, target.id.startsWith('star:') ? 0.06 : 0.12);
      trail.visible = false;

      group.add(drop, trail, marker);
      this.skyMarkerEntries.set(target.id, {
        target,
        marker,
        halo,
        drop,
        trail,
        trailPoints: [],
      });
    }

    const fixedAxis = makeSkyLine([
      new THREE.Vector3(0, 0, 0.002),
      new THREE.Vector3(0, 0, 0.86),
    ], C_AETHER, 0.12, true);
    group.add(fixedAxis);

    return group;
  }

  _positionLabAtProjectionCenter() {
    if (!this.sceneRoot) return;
    this.sceneRoot.position.set(0, 0, 0.024);
    this.sceneRoot.scale.setScalar(this.labScale);
  }

  _resetSkyTrails() {
    if (!this.skyMarkerEntries) return;
    for (const entry of this.skyMarkerEntries.values()) {
      entry.trailPoints = [];
      setLinePoints(entry.trail, []);
      entry.trail.visible = false;
    }
  }

  _getSkyTargetPosition(id) {
    const c = this.model?.computed || {};
    let coord = null;

    if (id === 'sun') coord = c.SunVaultCoord;
    else if (id === 'moon') coord = c.MoonVaultCoord;
    else if (c.Planets?.[id]) coord = c.Planets[id].vaultCoord;
    else if (id.startsWith('star:')) {
      const starId = id.slice(5);
      const star = c.CelNavStars?.find((s) => s.id === starId)
        || c.CataloguedStars?.find((s) => s.id === starId);
      coord = star?.vaultCoord || null;
    }

    if (!Array.isArray(coord) || coord.length < 3) return null;
    if (!coord.every(Number.isFinite)) return null;
    return new THREE.Vector3(coord[0], coord[1], coord[2]);
  }

  _updateSkyLayer(forceTrail = false) {
    if (!this.skyMarkerEntries) return;
    const camPos = new THREE.Vector3();
    this.renderer?.sm?.camera?.getWorldPosition(camPos);

    for (const [id, entry] of this.skyMarkerEntries) {
      const pos = this._getSkyTargetPosition(id);
      const visible = !!pos && this.mode === 'mach';
      entry.marker.visible = visible;
      entry.drop.visible = visible;
      entry.trail.visible = visible && entry.trailPoints.length > 1;
      if (!visible) continue;

      entry.marker.position.copy(pos);
      if (camPos.lengthSq() > 0) entry.halo.lookAt(camPos);
      setLinePoints(entry.drop, [
        pos,
        new THREE.Vector3(pos.x, pos.y, 0.006),
      ]);

      const last = entry.trailPoints[entry.trailPoints.length - 1];
      const moved = !last || last.distanceToSquared(pos) > 0.000012;
      if ((this.skyMotionOn || forceTrail) && moved) {
        entry.trailPoints.push(pos.clone());
        if (entry.trailPoints.length > 34) entry.trailPoints.shift();
        setLinePoints(entry.trail, entry.trailPoints);
        entry.trail.visible = entry.trailPoints.length > 1;
      }
    }
  }

  _makeBase() {
    const group = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.26, 1.34, 0.055, 80),
      new THREE.MeshBasicMaterial({
        color: C_BG,
        transparent: true,
        opacity: 0.92,
      }),
    );
    base.rotation.x = Math.PI / 2;
    base.position.z = -0.03;
    group.add(base);

    group.add(makeRingLine(1.26, 0.004, C_GROUND, 0.55, 128));
    group.add(makeRingLine(0.84, 0.008, C_GROUND, 0.28, 128));
    group.add(makeRingLine(0.42, 0.012, C_GROUND, 0.18, 128));

    return group;
  }

  _makeReferenceAxes() {
    const group = new THREE.Group();
    group.add(makeLine([
      new THREE.Vector3(-1.2, 0, 0.015),
      new THREE.Vector3(1.2, 0, 0.015),
    ], C_GROUND, 0.32, true));
    group.add(makeLine([
      new THREE.Vector3(0, -1.2, 0.015),
      new THREE.Vector3(0, 1.2, 0.015),
    ], C_GROUND, 0.32, true));
    return group;
  }

  _makeBucket() {
    const group = new THREE.Group();

    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(BUCKET_RADIUS, BUCKET_RADIUS * 0.93, BUCKET_HEIGHT, 96, 1, true),
      new THREE.MeshBasicMaterial({
        color: C_BUCKET,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      }),
    );
    wall.rotation.x = Math.PI / 2;
    wall.position.z = BUCKET_HEIGHT / 2;
    group.add(wall);

    group.add(makeRingLine(BUCKET_RADIUS, BUCKET_HEIGHT, C_BUCKET, 0.88, 128));
    group.add(makeRingLine(BUCKET_RADIUS * 0.93, 0.035, C_BUCKET, 0.54, 128));

    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const xTop = Math.cos(a) * BUCKET_RADIUS;
      const yTop = Math.sin(a) * BUCKET_RADIUS;
      const xBot = Math.cos(a) * BUCKET_RADIUS * 0.93;
      const yBot = Math.sin(a) * BUCKET_RADIUS * 0.93;
      group.add(makeLine([
        new THREE.Vector3(xBot, yBot, 0.035),
        new THREE.Vector3(xTop, yTop, BUCKET_HEIGHT),
      ], C_BUCKET, 0.34));
    }

    const handle = makeLine([
      new THREE.Vector3(-0.45, -0.08, BUCKET_HEIGHT + 0.03),
      new THREE.Vector3(-0.3, -0.35, BUCKET_HEIGHT + 0.2),
      new THREE.Vector3(0, -0.47, BUCKET_HEIGHT + 0.25),
      new THREE.Vector3(0.3, -0.35, BUCKET_HEIGHT + 0.2),
      new THREE.Vector3(0.45, -0.08, BUCKET_HEIGHT + 0.03),
    ], C_BUCKET, 0.45);
    group.add(handle);

    return group;
  }

  _makeSpinLayer() {
    const group = new THREE.Group();

    const arrowA = makeCircularArrow(0.78, -0.25, ROTATION_DIR * Math.PI * 1.35, C_LAB, 0.9, 0.9);
    const arrowB = makeCircularArrow(0.46, Math.PI * 1.05, ROTATION_DIR * Math.PI * 1.0, C_WATER, 0.56, 0.72);
    group.add(arrowA, arrowB);

    this.bucketObserver = new THREE.Group();
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 16, 16),
      new THREE.MeshBasicMaterial({ color: C_FAIL }),
    );
    head.position.set(BUCKET_RADIUS + 0.1, 0, 0.56);
    const body = makeLine([
      new THREE.Vector3(BUCKET_RADIUS + 0.1, 0, 0.52),
      new THREE.Vector3(BUCKET_RADIUS + 0.1, 0, 0.34),
    ], C_FAIL, 0.9);
    const arm = makeLine([
      new THREE.Vector3(BUCKET_RADIUS + 0.03, 0, 0.46),
      new THREE.Vector3(BUCKET_RADIUS + 0.17, 0, 0.46),
    ], C_FAIL, 0.9);
    this.bucketObserver.add(head, body, arm);
    group.add(this.bucketObserver);

    return group;
  }

  _makeForceArrows() {
    const group = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const from = new THREE.Vector3(Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0.36);
      const to = new THREE.Vector3(Math.cos(a) * 0.52, Math.sin(a) * 0.52, 0.46);
      const dir = to.clone().sub(from).normalize();
      const arrow = new THREE.ArrowHelper(dir, from, from.distanceTo(to), C_AETHER, 0.07, 0.04);
      arrow.traverse((child) => {
        if (child.material) {
          child.material.transparent = true;
          child.material.opacity = 0.82;
        }
      });
      group.add(arrow);
    }
    return group;
  }

  _makeFlatPrediction() {
    const group = new THREE.Group();
    const disc = new THREE.Mesh(
      this._makeWaterGeometry(0, BUCKET_RADIUS * 0.92),
      new THREE.MeshBasicMaterial({
        color: C_FAIL,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    disc.renderOrder = 16;
    group.add(disc);
    group.add(makeRingLine(BUCKET_RADIUS * 0.93, WATER_CENTER_Z, C_FAIL, 0.9, 128));
    group.add(makeLine([
      new THREE.Vector3(-BUCKET_RADIUS * 0.8, 0, WATER_CENTER_Z + 0.004),
      new THREE.Vector3(BUCKET_RADIUS * 0.8, 0, WATER_CENTER_Z + 0.004),
    ], C_FAIL, 0.58, true));
    return group;
  }

  _makeCosmosLayer() {
    const group = new THREE.Group();
    group.add(makeCircularArrow(1.30, 0.42, ROTATION_DIR * Math.PI * 1.48, C_AETHER, 0.88, 0.44));
    group.add(makeRingLine(1.30, 0.88, C_AETHER, 0.16, 128));
    group.add(makeRingLine(0.78, 1.08, C_AETHER, 0.08, 128));

    const starMat = new THREE.MeshBasicMaterial({
      color: C_STAR,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    });
    const starGeo = new THREE.SphereGeometry(0.014, 12, 10);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.16;
      const r = 0.92 + (i % 3) * 0.15;
      const z = 0.68 + ((i * 7) % 5) * 0.08;
      const star = new THREE.Mesh(starGeo, starMat);
      star.position.set(Math.cos(a) * r, Math.sin(a) * r, z);
      star.renderOrder = 28;
      group.add(star);
    }

    const pillar = makeLine([
      new THREE.Vector3(0, 0, -0.04),
      new THREE.Vector3(0, 0, 1.42),
    ], C_AETHER, 0.16, true);
    group.add(pillar);
    return group;
  }

  _makeWaterParticles() {
    const group = new THREE.Group();
    const geo = new THREE.SphereGeometry(0.026, 12, 12);
    const mat = new THREE.MeshBasicMaterial({
      color: C_WATER,
      transparent: true,
      opacity: 0.88,
    });
    this.particleMeshes = [];
    for (let i = 0; i < 18; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      const ring = i % 3;
      mesh.userData.radius = [0.22, 0.38, 0.54][ring];
      mesh.userData.phase = (i / 18) * Math.PI * 2 + ring * 0.4;
      mesh.userData.speed = 0.85 + ring * 0.24;
      group.add(mesh);
      this.particleMeshes.push(mesh);
    }
    return group;
  }

  _makeWaterGeometry(curve, radius = BUCKET_RADIUS * 0.9) {
    const radial = 24;
    const angular = 96;
    const positions = [];
    const indices = [];

    for (let i = 0; i <= radial; i++) {
      const r = radius * (i / radial);
      const z = WATER_CENTER_Z + curve * Math.pow(r / radius, 2);
      for (let j = 0; j < angular; j++) {
        const a = (j / angular) * Math.PI * 2;
        positions.push(Math.cos(a) * r, Math.sin(a) * r, z);
      }
    }

    for (let i = 0; i < radial; i++) {
      for (let j = 0; j < angular; j++) {
        const next = (j + 1) % angular;
        const a = i * angular + j;
        const b = i * angular + next;
        const c = (i + 1) * angular + j;
        const d = (i + 1) * angular + next;
        indices.push(a, c, b, b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  _waterZ(radius) {
    const r = clamp(radius / (BUCKET_RADIUS * 0.9), 0, 1);
    return WATER_CENTER_Z + this.currentCurve * r * r;
  }

  _applyWaterShape() {
    const curve = this.spinOn ? WATER_BASE_CURVE * this.spinRate * this.spinRate : 0;
    this.currentCurve = clamp(curve, 0, 0.5);

    if (this.actualWater) {
      this.actualWater.geometry.dispose();
      this.actualWater.geometry = this._makeWaterGeometry(this.currentCurve);
    }
    this._rebuildWaterContours();

    const spinning = this.spinOn && this.currentCurve > 0.01;
    if (this.actualWater) this.actualWater.visible = spinning;
    if (this.restWater) this.restWater.visible = !spinning;
    if (this.forceArrows) this.forceArrows.visible = spinning && this.mode === 'lab';
    this._refreshModeText();
  }

  _rebuildWaterContours() {
    if (!this.waterContourGroup) return;
    while (this.waterContourGroup.children.length) {
      const child = this.waterContourGroup.children[0];
      this.waterContourGroup.remove(child);
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    }

    for (const ratio of [0.25, 0.45, 0.65, 0.84, 1.0]) {
      const radius = BUCKET_RADIUS * 0.9 * ratio;
      this.waterContourGroup.add(makeRingLine(radius, this._waterZ(radius) + 0.004, C_WATER, 0.38, 112));
    }
  }

  setMode(mode) {
    if (!['lab', 'bucket', 'mach'].includes(mode)) return;
    this.mode = mode;
    this._refreshMode();
  }

  setSpinOn(on) {
    this.spinOn = !!on;
    this._applyWaterShape();
    this._refreshMode();
  }

  setSpinRate(value) {
    this.spinRate = clamp(parseFloat(value) || 1, 0.35, 1.65);
    this._applyWaterShape();
  }

  setSkyMotionOn(on) {
    this.skyMotionOn = !!on;
    if (this.skyMotionOn) this._resetSkyTrails();
    this._refreshButtons();
  }

  setVortexOn(on) {
    this.vortexOn = !!on;
    this._syncVortexState();
    this._refreshButtons();
  }

  _syncVortexState() {
    if (!this.active || !this.model) return;
    const show = this.vortexOn;
    this.model.setState({ Cosmology: show ? 'vortex2' : 'none' });
  }

  _refreshMode() {
    const showFlat = this.spinOn && this.mode === 'bucket';
    const showCosmos = this.mode === 'mach';
    const showLab = this.mode === 'lab';

    this.flatPrediction.visible = showFlat;
    this.labels.flat.visible = showFlat;
    this.cosmosLocal.visible = showCosmos;
    this.labels.cosmos.visible = showCosmos;
    this.bucketObserver.visible = this.mode === 'bucket';
    this.forceArrows.visible = this.spinOn && showLab;

    setMaterialOpacity(this.bucketGroup, this.mode === 'bucket' ? 0.42 : 1);
    this._refreshModeText();
    this._refreshButtons();
    this._syncVortexState();
    this._updateSkyLayer(true);
  }

  _refreshModeText() {
    if (!this.labels?.frame) return;

    const stopped = !this.spinOn || this.currentCurve <= 0.01;
    if (stopped) {
      this._updateTextSprite(this.labels.frame, 'No spin: no frame test', { color: C_TEXT });
      this._updateTextSprite(this.labels.law, 'Flat water before rotation', { color: C_TEXT });
      this._updateTextSprite(this.labels.result, 'Turn spin on to compare predictions', { color: C_AETHER });
      return;
    }

    const text = {
      lab: {
        frame: 'ECI frame: water rotates',
        law: 'ECI correctly predicts: v = omega r -> concave',
        result: 'Matches observation, laws of physics directly apply',
        color: C_LAB,
      },
      bucket: {
        frame: 'Bucket rider: water is treated as still',
        law: 'Predicts flat water, not the observation',
        result: 'Laws do not apply directly in this frame',
        color: C_FAIL,
      },
      mach: {
        frame: 'Stationary Earth, rotating cosmos',
        law: 'Daily sky motion is assigned above',
        result: 'ECI frame still predicts concave water',
        color: C_AETHER,
      },
    }[this.mode];

    this._updateTextSprite(this.labels.frame, text.frame, { color: text.color });
    this._updateTextSprite(this.labels.law, text.law, { color: C_AETHER });
    this._updateTextSprite(this.labels.result, text.result, { color: text.color });
  }

  _refreshButtons() {
    if (this.modeButtons) {
      for (const [mode, btn] of this.modeButtons) {
        const active = mode === this.mode;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
    }
    if (this.spinToggle) {
      this.spinToggle.dataset.state = this.spinOn ? 'on' : 'off';
      this.spinToggle.textContent = `Spin bucket: ${this.spinOn ? 'ON' : 'OFF'}`;
    }
    if (this.vortexToggle) {
      this.vortexToggle.dataset.state = this.vortexOn ? 'on' : 'off';
      this.vortexToggle.textContent = `Aether vortex: ${this.vortexOn ? 'ON' : 'OFF'}`;
    }
  }

  update(dt) {
    super.update(dt);
    if (!this.active) return;

    this.visualGroup.position.set(0, 0, 0);
    this.visualGroup.scale.setScalar(1);
    this._positionLabAtProjectionCenter();

    if (this.skyMotionOn && this.isPlaying) {
      const dayStep = dt * SKY_DAY_RATE * this.spinRate;
      this.model.setState({ DateTime: this.model.state.DateTime + dayStep }, true);
    }
    this._updateSkyLayer();
    this._updateLabelReadability();

    const speed = this.spinOn && this.isPlaying ? this.spinRate : 0;
    const rot = ROTATION_DIR * dt;
    this.bucketGroup.rotation.z += rot * speed * 1.2;
    this.spinGroup.rotation.z += rot * speed * 1.9;
    this.waterContourGroup.rotation.z += rot * speed * 0.7;
    this.actualWater.rotation.z += rot * speed * 0.45;
    this.cosmosLocal.rotation.z += rot * (this.mode === 'mach' ? 0.65 : 0.18);

    if (this.particleMeshes) {
      for (const mesh of this.particleMeshes) {
        const r = mesh.userData.radius;
        const a = mesh.userData.phase + ROTATION_DIR * this.animationTime * speed * mesh.userData.speed * 2.1;
        mesh.position.set(Math.cos(a) * r, Math.sin(a) * r, this._waterZ(r) + 0.028);
        mesh.visible = this.spinOn;
      }
    }
  }

  _updateLabelReadability() {
    const camera = this.renderer?.sm?.camera;
    if (!camera || !this.readableSprites?.length) return;
    const camPos = new THREE.Vector3();
    camera.getWorldPosition(camPos);
    const zoom = Number.isFinite(camera.zoom)
      ? camera.zoom
      : Number.isFinite(this.model?.state?.Zoom)
        ? this.model.state.Zoom
        : 4.95;
    const zoomFactor = clamp(4.65 / Math.max(0.1, zoom), 0.88, 1.28);
    const worldPos = new THREE.Vector3();
    for (const sprite of this.readableSprites) {
      const base = sprite.userData?.baseScale;
      if (!base) continue;
      sprite.getWorldPosition(worldPos);
      const distFactor = clamp(camPos.distanceTo(worldPos) / 5.6, 0.92, 1.14);
      const factor = clamp(zoomFactor * distFactor, 0.96, 2.0);
      sprite.scale.set(base.x * factor, base.y * factor, base.z);
    }
  }

  buildControls(container) {
    const header = document.createElement('h3');
    header.textContent = "Newton's Bucket";
    container.appendChild(header);

    const reveal = document.createElement('div');
    reveal.className = 'newton-reveal-card';
    reveal.innerHTML = `
      <span class="newton-reveal-kicker">Core result</span>
      <strong>The observed surface is concave. The Earth-centered inertial frame predicts that directly.</strong>
      <span>Spin the bucket until the water co-rotates with it. The rim rises:
      the surface is not flat even though the bucket rider says the water is at rest.</span>
      <span class="newton-reveal-punch">The frame test is simple: the preferred
      inertial frame is the frame in which the laws of physics apply directly.</span>
    `;
    container.appendChild(reveal);

    const flow = document.createElement('div');
    flow.className = 'newton-reveal-flow';
    flow.innerHTML = `
      <div><b>Observed</b><span>Bucket, water, and local aether co-rotate; the rim rises into a concave surface.</span></div>
      <div><b>ECI frame</b><span>Water is rotating in this frame: v = omega r. ECI correctly predicts the observed concave surface.</span></div>
      <div><b>Bucketeer</b><span>Ride with the bucket and the water is treated as still: v = 0. It predicts flat water, which does not match observation.</span></div>
      <div><b>Conclusion</b><span>ECI correctly predicts the concave water. The bucket rider predicts flat water and fails. Therefore the Earth-centered inertial frame is the preferred inertial frame: Earth stationary, laws of physics directly apply.</span></div>
    `;
    container.appendChild(flow);

    const modeLabel = document.createElement('div');
    modeLabel.className = 'newton-control-label';
    modeLabel.textContent = 'Frame being tested';
    container.appendChild(modeLabel);

    const modeWrap = document.createElement('div');
    modeWrap.className = 'newton-mode-buttons';
    this.modeButtons = new Map();
    for (const [mode, label] of [
      ['lab', 'ECI frame'],
      ['bucket', 'Bucketeer'],
      ['mach', 'Cosmos rotates'],
    ]) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'newton-mode-btn';
      btn.textContent = label;
      btn.addEventListener('click', () => this.setMode(mode));
      modeWrap.appendChild(btn);
      this.modeButtons.set(mode, btn);
    }
    container.appendChild(modeWrap);

    this.spinToggle = document.createElement('button');
    this.spinToggle.type = 'button';
    this.spinToggle.className = 'newton-toggle';
    this.spinToggle.addEventListener('click', () => this.setSpinOn(!this.spinOn));
    container.appendChild(this.spinToggle);

    this.vortexToggle = document.createElement('button');
    this.vortexToggle.type = 'button';
    this.vortexToggle.className = 'newton-toggle aether';
    this.vortexToggle.addEventListener('click', () => this.setVortexOn(!this.vortexOn));
    container.appendChild(this.vortexToggle);

    const slider = document.createElement('div');
    slider.className = 'newton-slider';
    const sLabel = document.createElement('label');
    sLabel.textContent = 'Rotation rate';
    const sVal = document.createElement('span');
    sVal.className = 'newton-slider-value';
    sVal.textContent = `${this.spinRate.toFixed(2)}x`;
    const sInput = document.createElement('input');
    sInput.type = 'range';
    sInput.min = '0.35';
    sInput.max = '1.65';
    sInput.step = '0.05';
    sInput.value = String(this.spinRate);
    sInput.addEventListener('input', () => {
      this.setSpinRate(sInput.value);
      sVal.textContent = `${this.spinRate.toFixed(2)}x`;
    });
    slider.append(sLabel, sInput, sVal);
    container.appendChild(slider);

    const reading = document.createElement('div');
    reading.className = 'newton-reading';
    reading.innerHTML = `
      <div><b>Frame test</b><span>Which frame predicts the water shape directly?</span></div>
      <div><b>Direct prediction</b><span>ECI correctly predicts observation: v = omega r gives concave water.</span></div>
      <div><b>Sky view</b><span>Daily sky rotation can be assigned to the cosmos; the ECI bucket prediction stays the same.</span></div>
    `;
    container.appendChild(reading);

    this._refreshButtons();
  }

  getInfoPanel() {
    return `
      <h3>Newton's Bucket</h3>
      <div class="newton-funnel">
        <div>
          <b>Observed result</b>
          <p>When the bucket and water rotate together, the water rises at the
          rim and forms a concave surface.</p>
        </div>
        <div>
          <b>Earth-centered inertial frame (ECI): correctly predicts observation</b>
          <p>In the ECI frame, bucket, water, and carried aether rotate.
          The water has v = omega r, so m r omega^2 correctly predicts the
          observed concave surface.</p>
        </div>
        <div>
          <b>Bucketeer prediction</b>
          <p>Ride with the bucket and the co-rotating water is treated as still:
          v = 0. That predicts flat water, which does not match observation.
          The laws do not apply directly in this frame.</p>
        </div>
        <div>
          <b>Rotating cosmos</b>
          <p>The apparent daily sky motion can be assigned to the cosmos
          rotating around a stationary Earth. That does not change the bucket result:
          the ECI frame still predicts the concave surface directly.</p>
        </div>
      </div>
      <div class="info-result-summary newton-outcome-grid">
        <div class="result-success">
          <strong>Direct match</strong>
          <p>ECI frame: water rotates with v = omega r, so it
          correctly predicts the observed concave surface. The laws of physics
          directly apply in this frame.</p>
        </div>
        <div class="result-fail">
          <strong>Misses directly</strong>
          <p>Rotating bucketeer frame: treats the water as still, predicts flat
          water, and does not match observation. The laws do not apply directly
          in this frame.</p>
        </div>
      </div>
      <h4>Significance</h4>
      <p class="newton-jargon">The frame test is direct: use each frame to
      predict the water shape. ECI correctly predicts the observed
      concave water. The bucket rider predicts flat water, which does not match
      observation. Therefore the Earth-centered inertial frame is the
      preferred inertial frame: Earth stationary, laws of physics directly
      apply.</p>
    `;
  }

  _makeTextSprite(text, options = {}) {
    const width = options.width || 512;
    const height = options.height || 96;
    const fontSize = options.fontSize || 28;
    const color = options.color ?? C_TEXT;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    this._drawSpriteText(ctx, text, color, fontSize, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    this.textures.push(texture);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    }));
    const scale = options.scale || 0.1;
    const baseScale = new THREE.Vector3(scale * (width / height), scale, 1);
    sprite.scale.copy(baseScale);
    sprite.renderOrder = 90;
    sprite.userData = { canvas, ctx, width, height, fontSize, baseScale };
    this.readableSprites?.push(sprite);
    return sprite;
  }

  _updateTextSprite(sprite, text, options = {}) {
    const data = sprite.userData;
    if (!data?.ctx) return;
    const color = options.color ?? C_TEXT;
    this._drawSpriteText(data.ctx, text, color, data.fontSize, data.width, data.height);
    if (sprite.material.map) sprite.material.map.needsUpdate = true;
  }

  _drawSpriteText(ctx, text, color, fontSize, width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(5, 9, 16, 0.82)';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
    ctx.font = `700 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.fillStyle = cssColor(color);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 8;
    const maxWidth = width - 24;
    const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    const lineHeight = fontSize * 1.16;
    const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((entry, i) => {
      ctx.fillText(entry, width / 2, startY + i * lineHeight + 1, maxWidth);
    });
  }

  dispose() {
    for (const tex of this.textures) tex.dispose?.();
    this.textures = [];
    super.dispose();
  }
}

export default NewtonBucketExperiment;
