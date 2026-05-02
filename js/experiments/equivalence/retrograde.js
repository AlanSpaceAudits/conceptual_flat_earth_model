// Planetary Retrograde Motion
// Paints the observed apparent planet path in the stationary Earth sky frame.

import * as THREE from 'three';
import { BaseExperiment } from '../baseExperiment.js';
import { dateTimeToString } from '../../core/time.js';
import { vaultCoordAt } from '../../core/feGeometry.js';

const PLANET_COLORS = {
  mercury: 0xd0b090,
  venus: 0xfff0c8,
  mars: 0xd05040,
  jupiter: 0xffa060,
  saturn: 0xe4c888,
  uranus: 0xa8d8e0,
  neptune: 0x7fa6e8,
};

const PLANET_NAMES = {
  mercury: 'Mercury',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  uranus: 'Uranus',
  neptune: 'Neptune',
};

const RETROGRADE_TYPES = {
  mercury: 'inner',
  venus: 'inner',
  mars: 'outer',
  jupiter: 'outer',
  saturn: 'outer',
  uranus: 'outer',
  neptune: 'outer',
};

const SCENARIOS = [
  {
    id: 'outer-2026',
    label: 'Mars + Jupiter + Saturn',
    planets: ['saturn', 'jupiter', 'mars'],
    startUtc: [2026, 7, 1, 0, 0],
    endUtc: [2027, 4, 25, 0, 0],
    focus: [10, 115],
    speed: 7.5,
    retro: [
      { planet: 'saturn', startUtc: [2026, 7, 28, 0, 0], endUtc: [2026, 12, 13, 0, 0] },
      { planet: 'jupiter', startUtc: [2026, 12, 14, 0, 0], endUtc: [2027, 4, 14, 0, 0] },
      { planet: 'mars', startUtc: [2027, 1, 12, 0, 0], endUtc: [2027, 4, 4, 0, 0] },
    ],
  },
  {
    id: 'outer-all-2026',
    label: 'All outer planets',
    planets: ['neptune', 'uranus', 'saturn', 'jupiter', 'mars'],
    startUtc: [2026, 7, 1, 0, 0],
    endUtc: [2027, 4, 25, 0, 0],
    focus: [5, 105],
    speed: 7.5,
    retro: [
      { planet: 'neptune', startUtc: [2026, 7, 8, 0, 0], endUtc: [2026, 12, 14, 0, 0] },
      { planet: 'saturn', startUtc: [2026, 7, 28, 0, 0], endUtc: [2026, 12, 13, 0, 0] },
      { planet: 'uranus', startUtc: [2026, 9, 11, 0, 0], endUtc: [2027, 2, 10, 0, 0] },
      { planet: 'jupiter', startUtc: [2026, 12, 14, 0, 0], endUtc: [2027, 4, 14, 0, 0] },
      { planet: 'mars', startUtc: [2027, 1, 12, 0, 0], endUtc: [2027, 4, 4, 0, 0] },
    ],
  },
  {
    id: 'uranus-neptune-2026',
    label: 'Uranus + Neptune',
    planets: ['neptune', 'uranus'],
    startUtc: [2026, 7, 1, 0, 0],
    endUtc: [2027, 2, 25, 0, 0],
    focus: [-5, 25],
    speed: 6.2,
    retro: [
      { planet: 'neptune', startUtc: [2026, 7, 8, 0, 0], endUtc: [2026, 12, 14, 0, 0] },
      { planet: 'uranus', startUtc: [2026, 9, 11, 0, 0], endUtc: [2027, 2, 10, 0, 0] },
    ],
  },
  {
    id: 'mars-2027',
    label: 'Mars 2027 backtrack',
    planets: ['mars'],
    startUtc: [2027, 1, 1, 0, 0],
    endUtc: [2027, 4, 25, 0, 0],
    focus: [15, 155],
    speed: 2.6,
    retro: [
      { planet: 'mars', startUtc: [2027, 1, 12, 0, 0], endUtc: [2027, 4, 4, 0, 0] },
    ],
  },
  {
    id: 'jupiter-2026',
    label: 'Jupiter 2026-27 backtrack',
    planets: ['jupiter'],
    startUtc: [2026, 11, 20, 0, 0],
    endUtc: [2027, 4, 25, 0, 0],
    focus: [20, 125],
    speed: 4.8,
    retro: [
      { planet: 'jupiter', startUtc: [2026, 12, 14, 0, 0], endUtc: [2027, 4, 14, 0, 0] },
    ],
  },
  {
    id: 'saturn-2026',
    label: 'Saturn 2026 backtrack',
    planets: ['saturn'],
    startUtc: [2026, 7, 1, 0, 0],
    endUtc: [2026, 12, 31, 0, 0],
    focus: [0, 355],
    speed: 5.2,
    retro: [
      { planet: 'saturn', startUtc: [2026, 7, 28, 0, 0], endUtc: [2026, 12, 13, 0, 0] },
    ],
  },
  {
    id: 'inner-2026',
    label: 'Mercury + Venus',
    planets: ['mercury', 'venus'],
    startUtc: [2026, 9, 10, 0, 0],
    endUtc: [2026, 11, 28, 0, 0],
    focus: [-10, 210],
    speed: 2.7,
    retro: [
      { planet: 'venus', startUtc: [2026, 10, 3, 0, 0], endUtc: [2026, 11, 13, 0, 0] },
      { planet: 'mercury', startUtc: [2026, 10, 24, 0, 0], endUtc: [2026, 11, 14, 0, 0] },
    ],
  },
];

const DEFAULT_SCENARIO_ID = 'mars-2027';
const DEFAULT_DAYS_PER_SECOND = 0.5;
const SOURCE = 'astropixels';
// Sample density: 24 samples per day → smooth daily circles on the
// topographical plane. The native GP path includes Earth's daily
// rotation so each day produces one near-circular loop around the
// pole; the loop's centre and radius drift seasonally as the planet's
// declination changes. That drift is the "retrograde wreath" — many
// stacked daily circles whose envelope reverses direction during a
// retrograde window.
const TRACE_STEP_DAYS = 1 / 24;
const ENVELOPE_STEP_DAYS = 1;
const STAR_LOCKED_STEP_DAYS = 0.25;
const STAR_LOCKED_Z = 0.084;
const STAR_LOCKED_TARGET_SIZE = 0.34;
const STAR_LOCKED_MAX_SCALE = 0.035;

function utcDateTime(parts, ExperimentClass) {
  const [year, month, day, hour = 0, minute = 0] = parts;
  return ExperimentClass.utcDateTime(year, month, day, hour, minute, 0);
}

function planetLabel(id) {
  return PLANET_NAMES[id] || id;
}

function joinPlanetLabels(planets = []) {
  const labels = planets.map(planetLabel);
  if (labels.length <= 1) return labels[0] || 'the selected planet';
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}

function scenarioObjectText(scenario) {
  return joinPlanetLabels(scenario?.planets || []);
}

function scenarioPrimaryText(scenario) {
  const planets = Array.isArray(scenario?.planets) ? scenario.planets : [];
  return planetLabel(planets[planets.length - 1] || planets[0] || 'mars');
}

function scenarioRetroType(scenario) {
  const types = new Set((scenario?.planets || []).map((planet) => RETROGRADE_TYPES[planet]).filter(Boolean));
  if (types.size > 1) return 'mixed';
  return types.values().next().value || 'outer';
}

function scenarioMechanismText(scenario) {
  const type = scenarioRetroType(scenario);
  if (type === 'inner') {
    return 'Inner-planet retrograde occurs around inferior conjunction; the apparent direction reverses against the fixed stars while the planet stays near the Sun in the sky.';
  }
  if (type === 'mixed') {
    return 'The selected objects are all retrograde-capable planets: inner planets reverse around inferior conjunction, while outer planets reverse when the apparent Earth-planet geometry reaches opposition/overtaking geometry.';
  }
  return 'Outer-planet retrograde is the familiar opposition-season backtrack: the apparent direction slows, stations, reverses, stations again, then resumes direct motion.';
}

function scenarioWindowText(scenario, ExperimentClass) {
  const rows = scenario?.retro || [];
  if (!rows.length) return 'the selected retrograde window';
  return rows.map((item) => {
    const start = formatDate(utcDateTime(item.startUtc, ExperimentClass));
    const end = formatDate(utcDateTime(item.endUtc, ExperimentClass));
    return `${planetLabel(item.planet)} ${start} to ${end}`;
  }).join('; ');
}

function formatDate(dateTime) {
  return dateTimeToString(dateTime).split(' / ')[0];
}

function radToDeg(rad) {
  return rad * 180 / Math.PI;
}

function unwrapAngleNear(angleDeg, referenceDeg) {
  let angle = angleDeg;
  while (angle - referenceDeg > 180) angle -= 360;
  while (referenceDeg - angle > 180) angle += 360;
  return angle;
}

function scenarioFocus(scenario) {
  const focus = Array.isArray(scenario?.focus) ? scenario.focus : [15, 155];
  return {
    lat: Number.isFinite(focus[0]) ? focus[0] : 15,
    lon: Number.isFinite(focus[1]) ? focus[1] : 155,
  };
}

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    disposeObjectTree(child);
  }
}

function disposeObjectTree(obj) {
  while (obj.children?.length) {
    const child = obj.children[0];
    obj.remove(child);
    disposeObjectTree(child);
  }
  obj.geometry?.dispose?.();
  const materials = Array.isArray(obj.material)
    ? obj.material
    : obj.material ? [obj.material] : [];
  for (const material of materials) {
    material.map?.dispose?.();
    material.dispose?.();
  }
}

function makePathMaterial(color, opacity = 0.24) {
  return new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthTest: false,
    depthWrite: false,
  });
}

function makePaintMaterial(color, opacity = 0.07, size = 3) {
  return new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity,
    sizeAttenuation: false,
    depthTest: false,
    depthWrite: false,
  });
}

function makeStarReferenceMaterial() {
  return new THREE.PointsMaterial({
    color: 0xe8f5ff,
    size: 3,
    transparent: true,
    opacity: 0.78,
    sizeAttenuation: false,
    depthTest: false,
    depthWrite: false,
  });
}

function makeStationTick(color, label) {
  const group = new THREE.Group();
  const tick = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.044, 0, 0),
      new THREE.Vector3(0.044, 0, 0),
      new THREE.Vector3(0.044, -0.014, 0),
      new THREE.Vector3(0.044, 0.014, 0),
    ]),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.88,
      depthTest: false,
      depthWrite: false,
    }),
  );
  tick.renderOrder = 64;
  group.add(tick);

  const labelSprite = makeTextSprite(label, `#${color.toString(16).padStart(6, '0')}`);
  labelSprite.scale.set(0.044, 0.016, 1);
  labelSprite.position.set(0.066, 0.024, 0.014);
  labelSprite.renderOrder = 89;
  group.add(labelSprite);

  return group;
}

function makeStarLockedCursor() {
  const group = new THREE.Group();
  const arrow = new THREE.Mesh(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      0.024, 0, 0,
      -0.015, 0.013, 0,
      -0.015, -0.013, 0,
    ]), 3)),
    new THREE.MeshBasicMaterial({
      color: 0x42ffd0,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    }),
  );
  arrow.renderOrder = 71;
  group.add(arrow);
  group.frustumCulled = false;
  return group;
}

function makeStarLockedAxes() {
  const group = new THREE.Group();
  group.name = 'fixed-star-ra-dec-axes';
  const axes = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.11, 0, 0), new THREE.Vector3(0.11, 0, 0),
      new THREE.Vector3(0, -0.085, 0), new THREE.Vector3(0, 0.085, 0),
      new THREE.Vector3(0.085, -0.010, 0), new THREE.Vector3(0.085, 0.010, 0),
      new THREE.Vector3(-0.085, -0.010, 0), new THREE.Vector3(-0.085, 0.010, 0),
      new THREE.Vector3(-0.010, 0.065, 0), new THREE.Vector3(0.010, 0.065, 0),
      new THREE.Vector3(-0.010, -0.065, 0), new THREE.Vector3(0.010, -0.065, 0),
    ]),
    new THREE.LineBasicMaterial({
      color: 0xdcecff,
      transparent: true,
      opacity: 0.62,
      depthTest: false,
      depthWrite: false,
    }),
  );
  axes.renderOrder = 60;
  axes.frustumCulled = false;
  group.add(axes);

  const loopLabel = makeTextSprite('fixed-star backtrack', '#42ffd0');
  loopLabel.scale.set(0.116, 0.030, 1);
  loopLabel.position.set(0, 0.112, 0.018);
  group.add(loopLabel);

  const spinLabel = makeTextSprite('daily spin removed', '#dcecff');
  spinLabel.scale.set(0.106, 0.027, 1);
  spinLabel.position.set(0, -0.112, 0.018);
  group.add(spinLabel);

  group.visible = false;
  return group;
}

function makeTextSprite(text, color = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '700 42px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.76)';
  ctx.fillStyle = color;
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  }));
  sprite.scale.set(0.12, 0.03, 1);
  sprite.renderOrder = 88;
  return sprite;
}

export class RetrogradeExperiment extends BaseExperiment {
  static get id() { return 'retrograde'; }
  static get name() { return 'Planetary Retrograde'; }
  static get category() { return 'equivalence'; }
  static get description() { return 'Native planet positions paint their apparent retrograde backtrack against the fixed stars.'; }

  init() {
    this.scenarioId = DEFAULT_SCENARIO_ID;
    this.daysPerSecond = DEFAULT_DAYS_PER_SECOND;
    this.loop = true;
    this.vortexOn = false;
    this.elapsedDays = 0;
    this._sampledDays = 0;   // how far the live GP trace has been painted
    this._sampledEnvelopeDays = 0;
    this._sampledStarLockedDays = 0;
    this._lastInsideVault = false;
    this.followObserver = false;
    this.experimentScale = 1;
    this._lastTraceReset = 0;
    this.liveEl = null;
    this.equivalenceOverlay = null;
    this.traceGroup = new THREE.Group();
    this.traceGroup.name = 'retrograde-native-gp-trace';
    this.envelopeGroup = new THREE.Group();
    this.envelopeGroup.name = 'retrograde-daily-envelope';
    this.starReferenceGroup = new THREE.Group();
    this.starReferenceGroup.name = 'retrograde-fixed-star-reference';
    this.starLockedGuideGroup = new THREE.Group();
    this.starLockedGuideGroup.name = 'retrograde-fixed-star-guide';
    this.starLockedAxisGuide = null;
    this.starLockedCursorGroup = new THREE.Group();
    this.starLockedCursorGroup.name = 'retrograde-fixed-star-cursors';
    this.vaultPathGroup = new THREE.Group();
    this.vaultPathGroup.name = 'retrograde-heavenly-vault-path';
    this.opticalPathGroup = new THREE.Group();
    this.opticalPathGroup.name = 'retrograde-optical-vault-path';
    this.stationGroup = new THREE.Group();
    this.stationGroup.name = 'retrograde-station-markers';
    this.labelGroup = new THREE.Group();
    this.labelGroup.name = 'retrograde-planet-labels';
    this.traceRecords = new Map();
    this.envelopeRecords = new Map();
    this.starLockedBases = new Map();
    this.starLockedRecords = new Map();
    this.starLockedCursors = new Map();
    this.vaultPathRecords = new Map();
    this.opticalPathRecords = new Map();
    this.labelSprites = new Map();
    this.visualGroup.add(this.traceGroup);
    this.visualGroup.add(this.envelopeGroup);
    this.visualGroup.add(this.starReferenceGroup);
    this.visualGroup.add(this.starLockedGuideGroup);
    this.visualGroup.add(this.starLockedCursorGroup);
    this.visualGroup.add(this.vaultPathGroup);
    this.visualGroup.add(this.opticalPathGroup);
    this.visualGroup.add(this.stationGroup);
    this.visualGroup.add(this.labelGroup);
  }

  get selectedScenario() {
    return SCENARIOS.find((s) => s.id === this.scenarioId) || SCENARIOS[0];
  }

  getWindowStart() {
    return utcDateTime(this.selectedScenario.startUtc, this.constructor);
  }

  getWindowEnd() {
    return utcDateTime(this.selectedScenario.endUtc, this.constructor);
  }

  getHistoricalSetup() {
    const scenario = this.selectedScenario;
    const focus = scenarioFocus(scenario);
    return {
      state: {
        WorldModel: 'fe',
        BodySource: SOURCE,
        StarfieldType: 'celnav',
        DateTime: this.getWindowStart(),
        ObserverLat: focus.lat,
        ObserverLong: focus.lon,
        ShowVault: true,
        ShowVaultGrid: false,
        ShowTruePositions: true,
        ShowOpticalVault: true,
        ShowOpticalVaultRays: false,
        ShowProjectionRays: false,
        ShowFeGrid: true,
        ShowStars: true,
        DynamicStars: true,
        PermanentNight: false,
        DarkBackground: true,
        ShowShadow: true,
        ShowDayNightShadow: true,
        ShowCelNav: true,
        ShowCelestialBodies: true,
        ShowPlanets: true,
        ShowGroundPoints: true,
        TrackerGPOverride: true,
        SpecifiedTrackerMode: false,
        TrackerTargets: [...scenario.planets],
        FollowTarget: null,
        ShowGPTracer: false,
        ShowOpticalVaultTrace: false,
        ShowTraceUnder: true,
        TraceCelestialFrame: false,
        Cosmology: 'none',
        ClearTraceCount: (this.model?.state?.ClearTraceCount | 0) + 1,
        FreeCameraMode: false,
        FreeCamActive: false,
        InsideVault: false,
        CameraDirection: 0,
        CameraHeight: 34,
        CameraDistance: 8.8,
        Zoom: 4.2,
        Description: 'PLANETARY RETROGRADE: native GP trace of the heavenly-vault apparent path.',
      },
    };
  }

  activate() {
    if (typeof document !== 'undefined') {
      document.body?.classList?.add('retrograde-experiment-active');
    }
    super.activate();
    this.visualGroup.position.set(0, 0, 0);
    this.visualGroup.scale.setScalar(1);
    this.vortexOn = false;
    this.daysPerSecond = DEFAULT_DAYS_PER_SECOND;
    this.rebuildTraceLines();
    this.resetTrace();
    this.rebuildPlanetLabels();
    this.openEquivalenceOverlay();
  }

  deactivate() {
    if (typeof document !== 'undefined') {
      document.body?.classList?.remove('retrograde-experiment-active');
    }
    this.closeEquivalenceOverlay();
    super.deactivate();
  }

  resetTrace() {
    this.elapsedDays = 0;
    this._sampledDays = 0;
    this._sampledEnvelopeDays = 0;
    this._sampledStarLockedDays = 0;
    const scenario = this.selectedScenario;
    const focus = scenarioFocus(scenario);
    this._lastTraceReset = (this.model?.state?.ClearTraceCount | 0) + 1;
    this.clearTraceLines();
    this.model?.setState?.({
      DateTime: this.getWindowStart(),
      ObserverLat: focus.lat,
      ObserverLong: focus.lon,
      TrackerTargets: [...scenario.planets],
      FollowTarget: null,
      ShowGPTracer: false,
      ShowOpticalVaultTrace: false,
      ShowTraceUnder: true,
      TraceCelestialFrame: false,
      ShowTruePositions: true,
      SpecifiedTrackerMode: false,
      Cosmology: this.vortexOn ? 'vortex2' : 'none',
      ClearTraceCount: this._lastTraceReset,
      Description: `PLANETARY RETROGRADE: painting ${scenarioObjectText(scenario)} raw topo path plus fixed-star backtrack.`,
    });
    this.rebuildStarLockedBases();
    this.rebuildStarReferenceMarkers();
    this.rebuildStationMarkers();
    // Seed each trace with the start-instant sample.
    for (const planet of scenario.planets) {
      const rec = this.traceRecords.get(planet);
      const env = this.envelopeRecords.get(planet);
      const starLockRec = this.starLockedRecords.get(planet);
      const vaultRec = this.vaultPathRecords.get(planet);
      const optRec = this.opticalPathRecords.get(planet);
      const groundPoint = this.capturePlanetGroundPoint(planet);
      const envelopePoint = this.capturePlanetGroundPoint(planet, 0.041);
      const starLockedPoint = this.capturePlanetStarLockedPoint(planet);
      const vaultPoint = this.capturePlanetVaultPoint(planet);
      const opticalPoint = this.capturePlanetOpticalPoint(planet);
      if (rec && groundPoint) this.appendTracePoint(rec, groundPoint);
      if (env && envelopePoint) this.appendTracePoint(env, envelopePoint);
      if (starLockRec && starLockedPoint) this.appendTracePoint(starLockRec, starLockedPoint);
      if (vaultRec && vaultPoint) this.appendTracePoint(vaultRec, vaultPoint);
      if (optRec && opticalPoint) this.appendTracePoint(optRec, opticalPoint);
    }
    this.updateStarLockedCursors();
    this.updateStarLockedFrame();
    this.updateStationMarkerVisibility();
    this.updateTraceVisibility();
    this.updateLiveReadout();
  }

  setScenario(id) {
    if (!SCENARIOS.some((s) => s.id === id)) return;
    this.scenarioId = id;
    this.daysPerSecond = DEFAULT_DAYS_PER_SECOND;
    this._lastInsideVault = false;
    this.rebuildTraceLines();
    this.resetTrace();
    this.rebuildPlanetLabels();
    this.refreshScenarioControls?.();
    this.refreshEquivalenceOverlay();
  }

  setVortexOn(on) {
    this.vortexOn = !!on;
    this.model?.setState?.({
      Cosmology: this.vortexOn ? 'vortex2' : 'none',
    });
    this.updateLiveReadout();
  }

  update(dt) {
    if (!this.active) return;
    const start = this.getWindowStart();
    const end = this.getWindowEnd();
    const span = Math.max(1, end - start);

    if (this.isPlaying) {
      this.elapsedDays += (dt || 0.016) * this.daysPerSecond;
      if (this.elapsedDays > span) {
        if (this.loop) {
          this.resetTrace();
          return;
        }
        this.elapsedDays = span;
        this.isPlaying = false;
      }
    }

    const targetElapsed = Math.min(this.elapsedDays, span);
    // Sub-step the model time at TRACE_STEP_DAYS resolution, painting
    // each planet's native GP at every step so the daily-rotation loops
    // and seasonal drift come out smooth on the disc. setState(false)
    // skips the renderer emit on intermediate steps; the final
    // setState(true) below paints the scene at the displayed instant.
    while (this._sampledDays + TRACE_STEP_DAYS <= targetElapsed) {
      this._sampledDays += TRACE_STEP_DAYS;
      this.model?.setState?.({ DateTime: start + this._sampledDays }, false);
      for (const planet of this.selectedScenario.planets) {
        const rec = this.traceRecords.get(planet);
        const vaultRec = this.vaultPathRecords.get(planet);
        const optRec = this.opticalPathRecords.get(planet);
        const groundPoint = this.capturePlanetGroundPoint(planet);
        const vaultPoint = this.capturePlanetVaultPoint(planet);
        const opticalPoint = this.capturePlanetOpticalPoint(planet);
        if (rec && groundPoint) this.appendTracePoint(rec, groundPoint);
        if (vaultRec && vaultPoint) this.appendTracePoint(vaultRec, vaultPoint);
        if (optRec && opticalPoint) this.appendTracePoint(optRec, opticalPoint);
      }
    }

    while (this._sampledEnvelopeDays + ENVELOPE_STEP_DAYS <= targetElapsed) {
      this._sampledEnvelopeDays += ENVELOPE_STEP_DAYS;
      this.model?.setState?.({ DateTime: start + this._sampledEnvelopeDays }, false);
      for (const planet of this.selectedScenario.planets) {
        const rec = this.envelopeRecords.get(planet);
        const point = this.capturePlanetGroundPoint(planet, 0.041);
        if (rec && point) this.appendTracePoint(rec, point);
      }
    }

    while (this._sampledStarLockedDays + STAR_LOCKED_STEP_DAYS <= targetElapsed) {
      this._sampledStarLockedDays += STAR_LOCKED_STEP_DAYS;
      this.model?.setState?.({ DateTime: start + this._sampledStarLockedDays }, false);
      for (const planet of this.selectedScenario.planets) {
        const rec = this.starLockedRecords.get(planet);
        const point = this.capturePlanetStarLockedPoint(planet);
        if (rec && point) this.appendTracePoint(rec, point);
      }
    }

    this.model?.setState?.({ DateTime: start + targetElapsed }, true);
    this.updateOpticalEntryAim();
    this.updatePlanetLabels();
    this.updateStarLockedCursors();
    this.updateStarLockedFrame();
    this.updateStationMarkerVisibility();
    this.updateTraceVisibility();
    this.updateLiveReadout();
  }

  // Native GP for a planet on the topographical plane: take the
  // planet's heavenly-vault 3D coordinate (which already includes
  // Earth's daily rotation through SkyRotAngle) and drop it
  // vertically to z = 0. This is the actual sub-planet point on the
  // disc — the geometric "ground point" the planet sits above at
  // this instant. Tracing it through time paints the planet's
  // native daily orbits + seasonal drift directly on the surface.
  capturePlanetGroundPoint(planet, z = 0.018) {
    const data = this.model?.computed?.Planets?.[planet];
    const v = data?.vaultCoord;
    if (!v || !Number.isFinite(v[0]) || !Number.isFinite(v[1])) return null;
    return new THREE.Vector3(v[0], v[1], z);
  }

  capturePlanetStarSample(planet) {
    const data = this.model?.computed?.Planets?.[planet];
    if (!data || !Number.isFinite(data.ra) || !Number.isFinite(data.dec)) return null;
    return {
      raDeg: radToDeg(data.ra),
      decDeg: radToDeg(data.dec),
    };
  }

  captureStarLockedSamplePoint(planet, sample, z = STAR_LOCKED_Z) {
    const basis = this.starLockedBases?.get(planet);
    if (!basis || !sample) return null;
    const ra = unwrapAngleNear(sample.raDeg, basis.centerRa);
    const dx = (ra - basis.centerRa) * basis.cosDec * basis.scale;
    const dy = (sample.decDeg - basis.centerDec) * basis.scale;
    return new THREE.Vector3(-dx, dy, z);
  }

  // Fixed-star drift point: same apparent RA/Dec input as the native
  // Primary planet dot, expressed in a small local chart with the daily spin
  // factored out. The chart group is translated each frame so the
  // current point sits directly on the visible planet vault dot.
  capturePlanetStarLockedPoint(planet, z = STAR_LOCKED_Z) {
    return this.captureStarLockedSamplePoint(planet, this.capturePlanetStarSample(planet), z);
  }

  capturePlanetVaultPoint(planet) {
    const data = this.model?.computed?.Planets?.[planet];
    const v = data?.vaultCoord;
    if (!v || !Number.isFinite(v[0]) || !Number.isFinite(v[1]) || !Number.isFinite(v[2])) {
      return null;
    }
    return new THREE.Vector3(v[0], v[1], v[2]);
  }

  capturePlanetOpticalPoint(planet) {
    const data = this.model?.computed?.Planets?.[planet];
    const v = data?.opticalVaultCoord;
    if (!v || !Number.isFinite(v[0]) || !Number.isFinite(v[1]) || !Number.isFinite(v[2])) {
      return null;
    }
    return new THREE.Vector3(v[0], v[1], v[2]);
  }

  activePlanetSkyPoint(planet) {
    return this.model?.state?.InsideVault
      ? this.capturePlanetOpticalPoint(planet)
      : this.capturePlanetVaultPoint(planet);
  }

  primaryPlanet() {
    const planets = Array.isArray(this.selectedScenario?.planets)
      ? this.selectedScenario.planets
      : [];
    return planets[planets.length - 1] || planets[0] || 'mars';
  }

  updateOpticalEntryAim() {
    const inside = !!this.model?.state?.InsideVault;
    if (inside && !this._lastInsideVault) {
      const planet = this.model?.computed?.Planets?.[this.primaryPlanet()];
      const angles = planet?.anglesGlobe;
      if (angles && Number.isFinite(angles.azimuth) && Number.isFinite(angles.elevation)) {
        this.model.setState?.({
          ObserverHeading: ((angles.azimuth % 360) + 360) % 360,
          CameraHeight: Math.max(0, Math.min(89.9, angles.elevation)),
        }, false);
      }
    }
    this._lastInsideVault = inside;
  }

  rebuildStarLockedBases() {
    if (!this.model) return;
    this.starLockedBases.clear();
    const restore = this.model.state?.DateTime ?? this.getWindowStart();
    const start = this.getWindowStart();
    const end = this.getWindowEnd();
    for (const planet of this.selectedScenario.planets) {
      const samples = [];
      let previousRa = null;
      for (let t = start; t <= end + 1e-6; t += STAR_LOCKED_STEP_DAYS) {
        this.model.setState?.({ DateTime: t }, false);
        const sample = this.capturePlanetStarSample(planet);
        if (!sample) continue;
        const ra = previousRa === null
          ? sample.raDeg
          : unwrapAngleNear(sample.raDeg, previousRa);
        previousRa = ra;
        samples.push({ ra, dec: sample.decDeg });
      }
      if (!samples.length) continue;
      let minRa = Infinity;
      let maxRa = -Infinity;
      let minDec = Infinity;
      let maxDec = -Infinity;
      for (const sample of samples) {
        minRa = Math.min(minRa, sample.ra);
        maxRa = Math.max(maxRa, sample.ra);
        minDec = Math.min(minDec, sample.dec);
        maxDec = Math.max(maxDec, sample.dec);
      }
      const centerRa = (minRa + maxRa) / 2;
      const centerDec = (minDec + maxDec) / 2;
      const cosDec = Math.max(0.18, Math.cos(centerDec * Math.PI / 180));
      const span = Math.max((maxRa - minRa) * cosDec, maxDec - minDec, 0.1);
      this.starLockedBases.set(planet, {
        centerRa,
        centerDec,
        cosDec,
        scale: Math.min(STAR_LOCKED_MAX_SCALE, STAR_LOCKED_TARGET_SIZE / span),
      });
    }
    this.model.setState?.({ DateTime: restore }, false);
  }

  rebuildStarReferenceMarkers() {
    if (!this.starReferenceGroup || !this.model) return;
    clearGroup(this.starReferenceGroup);
    const planet = this.primaryPlanet();
    if (!this.starLockedBases.has(planet)) return;
    const stars = [
      ...(this.model.computed?.CelNavStars || []),
      ...(this.model.computed?.CataloguedStars || []),
    ];
    const candidates = [];
    for (const star of stars) {
      if (!Number.isFinite(star?.ra) || !Number.isFinite(star?.dec)) continue;
      const point = this.captureStarLockedSamplePoint(planet, {
        raDeg: radToDeg(star.ra),
        decDeg: radToDeg(star.dec),
      }, STAR_LOCKED_Z - 0.012);
      if (!point) continue;
      const distance = Math.hypot(point.x, point.y);
      if (Math.abs(point.x) <= 1.0 && Math.abs(point.y) <= 0.8) {
        candidates.push({ point, distance, mag: Number.isFinite(star.mag) ? star.mag : 6 });
      }
    }
    candidates.sort((a, b) => (a.distance - b.distance) || (a.mag - b.mag));
    const selected = candidates.slice(0, 24);
    if (!selected.length) return;
    const positions = new Float32Array(selected.length * 3);
    selected.forEach(({ point }, index) => {
      positions[index * 3] = point.x;
      positions[index * 3 + 1] = point.y;
      positions[index * 3 + 2] = point.z;
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(geometry, makeStarReferenceMaterial());
    points.renderOrder = 59;
    points.frustumCulled = false;
    this.starReferenceGroup.add(points);
  }

  rebuildTraceLines() {
    if (!this.traceGroup || !this.envelopeGroup || !this.starReferenceGroup || !this.starLockedGuideGroup || !this.starLockedCursorGroup || !this.vaultPathGroup || !this.opticalPathGroup) {
      return;
    }
    clearGroup(this.traceGroup);
    clearGroup(this.envelopeGroup);
    clearGroup(this.starReferenceGroup);
    clearGroup(this.starLockedGuideGroup);
    clearGroup(this.starLockedCursorGroup);
    clearGroup(this.vaultPathGroup);
    clearGroup(this.opticalPathGroup);
    this.traceRecords.clear();
    this.envelopeRecords.clear();
    this.starLockedRecords.clear();
    this.starLockedCursors.clear();
    this.starLockedAxisGuide = null;
    this.vaultPathRecords.clear();
    this.opticalPathRecords.clear();
    const span = Math.max(1, this.getWindowEnd() - this.getWindowStart());
    // Allocate enough capacity to hold one sample per TRACE_STEP_DAYS
    // across the whole window, plus a small margin.
    const capacity = Math.ceil(span / TRACE_STEP_DAYS) + 32;
    const envelopeCapacity = Math.ceil(span / ENVELOPE_STEP_DAYS) + 32;
    const starLockedCapacity = Math.ceil(span / STAR_LOCKED_STEP_DAYS) + 32;
    const primary = this.primaryPlanet();
    for (const planet of this.selectedScenario.planets) {
      const buffer = new Float32Array(capacity * 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(buffer, 3));
      geometry.setDrawRange(0, 0);
      const line = new THREE.Line(
        geometry,
        makePathMaterial(PLANET_COLORS[planet] || 0xffffff, 0.018),
      );
      const paint = new THREE.Points(
        geometry,
        makePaintMaterial(PLANET_COLORS[planet] || 0xffffff, 0.007, 2),
      );
      line.renderOrder = 47;
      paint.renderOrder = 48;
      line.frustumCulled = false;
      paint.frustumCulled = false;
      this.traceGroup.add(line);
      this.traceGroup.add(paint);
      this.traceRecords.set(planet, { line, paint, buffer, count: 0 });

      const envelopeBuffer = new Float32Array(envelopeCapacity * 3);
      const envelopeGeometry = new THREE.BufferGeometry();
      envelopeGeometry.setAttribute('position', new THREE.BufferAttribute(envelopeBuffer, 3));
      envelopeGeometry.setDrawRange(0, 0);
      const envelopeLine = new THREE.Line(
        envelopeGeometry,
        makePathMaterial(PLANET_COLORS[planet] || 0xffffff, 0.07),
      );
      envelopeLine.renderOrder = 56;
      envelopeLine.frustumCulled = false;
      this.envelopeGroup.add(envelopeLine);
      this.envelopeRecords.set(planet, { line: envelopeLine, buffer: envelopeBuffer, count: 0 });

      const starLockedBuffer = new Float32Array(starLockedCapacity * 3);
      const starLockedGeometry = new THREE.BufferGeometry();
      starLockedGeometry.setAttribute('position', new THREE.BufferAttribute(starLockedBuffer, 3));
      starLockedGeometry.setDrawRange(0, 0);
      const starLockedLine = new THREE.Line(
        starLockedGeometry,
        makePathMaterial(0x42ffd0, 0.96),
      );
      const starLockedPaint = new THREE.Points(
        starLockedGeometry,
        makePaintMaterial(0x42ffd0, 0.74, 6),
      );
      starLockedLine.renderOrder = 76;
      starLockedPaint.renderOrder = 77;
      starLockedLine.frustumCulled = false;
      starLockedPaint.frustumCulled = false;
      this.starLockedGuideGroup.add(starLockedLine);
      this.starLockedGuideGroup.add(starLockedPaint);
      this.starLockedRecords.set(planet, {
        line: starLockedLine,
        paint: starLockedPaint,
        buffer: starLockedBuffer,
        count: 0,
      });
      if (planet === primary) {
        this.starLockedAxisGuide = makeStarLockedAxes();
        this.starLockedGuideGroup.add(this.starLockedAxisGuide);
      }

      const cursor = makeStarLockedCursor();
      this.starLockedCursorGroup.add(cursor);
      this.starLockedCursors.set(planet, cursor);

      const vaultBuffer = new Float32Array(capacity * 3);
      const vaultGeometry = new THREE.BufferGeometry();
      vaultGeometry.setAttribute('position', new THREE.BufferAttribute(vaultBuffer, 3));
      vaultGeometry.setDrawRange(0, 0);
      const vaultLine = new THREE.Line(
        vaultGeometry,
        makePathMaterial(PLANET_COLORS[planet] || 0xffffff, 0.14),
      );
      vaultLine.renderOrder = 58;
      vaultLine.frustumCulled = false;
      this.vaultPathGroup.add(vaultLine);
      this.vaultPathRecords.set(planet, { line: vaultLine, buffer: vaultBuffer, count: 0 });

      const opticalBuffer = new Float32Array(capacity * 3);
      const opticalGeometry = new THREE.BufferGeometry();
      opticalGeometry.setAttribute('position', new THREE.BufferAttribute(opticalBuffer, 3));
      opticalGeometry.setDrawRange(0, 0);
      const opticalLine = new THREE.Line(
        opticalGeometry,
        makePathMaterial(PLANET_COLORS[planet] || 0xffffff, 0.30),
      );
      opticalLine.renderOrder = 59;
      opticalLine.frustumCulled = false;
      this.opticalPathGroup.add(opticalLine);
      this.opticalPathRecords.set(planet, { line: opticalLine, buffer: opticalBuffer, count: 0 });
    }
    this.updateTraceVisibility();
  }

  clearTraceLines() {
    for (const rec of this.traceRecords.values()) this.clearTraceRecord(rec);
    for (const rec of this.envelopeRecords.values()) this.clearTraceRecord(rec);
    for (const rec of this.starLockedRecords.values()) this.clearTraceRecord(rec);
    for (const rec of this.vaultPathRecords.values()) this.clearTraceRecord(rec);
    for (const rec of this.opticalPathRecords.values()) this.clearTraceRecord(rec);
  }

  clearTraceRecord(rec) {
    rec.count = 0;
    rec.line.geometry.setDrawRange(0, 0);
    rec.line.geometry.attributes.position.needsUpdate = true;
    if (rec.paint) {
      rec.paint.geometry.setDrawRange(0, 0);
      rec.paint.geometry.attributes.position.needsUpdate = true;
    }
  }

  rebuildStationMarkers() {
    if (!this.stationGroup || !this.model) return;
    clearGroup(this.stationGroup);
    const restore = this.getWindowStart();
    for (const item of this.selectedScenario.retro) {
      const color = 0x42ffd0;
      const stations = [
        { time: utcDateTime(item.startUtc, this.constructor), label: 'S1' },
        { time: utcDateTime(item.endUtc, this.constructor), label: 'S2' },
      ];
      for (const station of stations) {
        this.model.setState?.({ DateTime: station.time }, false);
        const point = this.capturePlanetStarLockedPoint(item.planet, STAR_LOCKED_Z + 0.012);
        if (!point) continue;
        const marker = makeStationTick(color, station.label);
        marker.position.copy(point);
        marker.rotation.z = Math.atan2(point.y, point.x);
        marker.frustumCulled = false;
        marker.visible = false;
        marker.userData.revealTime = station.time;
        this.stationGroup.add(marker);
      }
    }
    this.model.setState?.({ DateTime: restore }, false);
  }

  updateStationMarkerVisibility() {
    if (!this.stationGroup) return;
    const current = Math.min(this.getWindowStart() + this.elapsedDays, this.getWindowEnd());
    for (const marker of this.stationGroup.children) {
      const revealTime = marker.userData?.revealTime;
      marker.visible = Number.isFinite(revealTime) ? current >= revealTime : true;
    }
  }

  appendTracePoint(rec, point) {
    if (!rec || !point) return;
    const capacity = Math.floor(rec.buffer.length / 3);
    if (rec.count >= capacity) return;
    rec.buffer[rec.count * 3] = point.x;
    rec.buffer[rec.count * 3 + 1] = point.y;
    rec.buffer[rec.count * 3 + 2] = point.z;
    rec.count++;
    rec.line.geometry.setDrawRange(0, rec.count);
    rec.line.geometry.attributes.position.needsUpdate = true;
    if (rec.paint) {
      rec.paint.geometry.setDrawRange(0, rec.count);
      rec.paint.geometry.attributes.position.needsUpdate = true;
    }
  }

  rebuildPlanetLabels() {
    if (!this.labelGroup) return;
    clearGroup(this.labelGroup);
    this.labelSprites.clear();
    for (const planet of this.selectedScenario.planets) {
      const color = `#${(PLANET_COLORS[planet] || 0xffffff).toString(16).padStart(6, '0')}`;
      const sprite = makeTextSprite(planetLabel(planet), color);
      this.labelSprites.set(planet, sprite);
      this.labelGroup.add(sprite);
    }
    this.updatePlanetLabels();
  }

  updatePlanetLabels() {
    if (!this.labelGroup || !this.model?.computed?.Planets) return;
    for (const [planet, sprite] of this.labelSprites) {
      const coord = this.activePlanetSkyPoint(planet);
      if (!coord) {
        sprite.visible = false;
        continue;
      }
      sprite.visible = true;
      sprite.position.set(coord.x, coord.y, coord.z + 0.026);
    }
  }

  updateStarLockedCursors() {
    if (!this.starLockedCursorGroup) return;
    for (const [planet, cursor] of this.starLockedCursors) {
      const point = this.capturePlanetStarLockedPoint(planet, STAR_LOCKED_Z + 0.018);
      if (!point) {
        cursor.visible = false;
        continue;
      }
      cursor.visible = true;
      cursor.position.copy(point);
      const rec = this.starLockedRecords.get(planet);
      if (rec?.count > 1) {
        const i = (rec.count - 2) * 3;
        cursor.rotation.z = Math.atan2(point.y - rec.buffer[i + 1], point.x - rec.buffer[i]);
      }
    }
  }

  updateStarLockedFrame() {
    const planet = this.primaryPlanet();
    const anchor = this.capturePlanetVaultPoint(planet)
      || this.capturePlanetGroundPoint(planet, STAR_LOCKED_Z);
    const drift = this.capturePlanetStarLockedPoint(planet, STAR_LOCKED_Z);
    if (this.starLockedAxisGuide) {
      this.starLockedAxisGuide.visible = !!drift;
      if (drift) this.starLockedAxisGuide.position.set(drift.x, drift.y, drift.z + 0.022);
    }
    const offset = anchor && drift
      ? { x: anchor.x - drift.x, y: anchor.y - drift.y, z: anchor.z - drift.z }
      : { x: 0, y: 0, z: 0 };
    for (const group of [this.starReferenceGroup, this.starLockedGuideGroup, this.starLockedCursorGroup, this.stationGroup]) {
      if (!group) continue;
      group.rotation.z = 0;
      group.position.set(offset.x, offset.y, offset.z);
    }
  }

  updateTraceVisibility() {
    const inside = !!this.model?.state?.InsideVault;
    const showTrue = !inside && this.model?.state?.ShowTruePositions !== false;
    if (this.traceGroup) this.traceGroup.visible = !inside;
    if (this.envelopeGroup) this.envelopeGroup.visible = !inside;
    if (this.starReferenceGroup) this.starReferenceGroup.visible = !inside;
    if (this.starLockedGuideGroup) this.starLockedGuideGroup.visible = !inside;
    if (this.starLockedCursorGroup) this.starLockedCursorGroup.visible = !inside;
    if (this.stationGroup) this.stationGroup.visible = !inside;
    if (this.vaultPathGroup) this.vaultPathGroup.visible = showTrue;
    if (this.opticalPathGroup) this.opticalPathGroup.visible = inside;
  }

  currentRetroWindows(dateTime) {
    const active = [];
    for (const item of this.selectedScenario.retro) {
      const start = utcDateTime(item.startUtc, this.constructor);
      const end = utcDateTime(item.endUtc, this.constructor);
      if (dateTime >= start && dateTime <= end) active.push(item);
    }
    return active;
  }

  scenarioSummaryHtml() {
    const rows = this.selectedScenario.retro.map((item) => {
      const start = utcDateTime(item.startUtc, this.constructor);
      const end = utcDateTime(item.endUtc, this.constructor);
      const type = RETROGRADE_TYPES[item.planet] === 'inner' ? 'inner window' : 'outer window';
      return `<div><b style="color:#${(PLANET_COLORS[item.planet] || 0xffffff).toString(16).padStart(6, '0')}">${planetLabel(item.planet)}</b><span>${type}: ${formatDate(start)} to ${formatDate(end)}</span></div>`;
    }).join('');
    return rows || '<div><b>Backtrack</b><span>Observed path is painted from the bundled ephemeris.</span></div>';
  }

  retrogradeIntroHtml() {
    const scenario = this.selectedScenario;
    const objects = scenarioObjectText(scenario);
    const primary = scenarioPrimaryText(scenario);
    return `
      <span class="retrograde-kicker">Kinematic equivalence</span>
      <strong>${objects}: same fixed-star backtrack, three coordinate descriptions.</strong>
      <div class="retrograde-vs">
        <div class="retrograde-vs-observed">
          <div class="retrograde-vs-tag">Observed sky</div>
          <p>The measured target set is ${objects} against the fixed stars:
          slow, station, reverse, station, then direct again.</p>
        </div>
        <div class="retrograde-vs-helio">
          <div class="retrograde-vs-tag">Globe frames</div>
          <p>${scenarioMechanismText(scenario)} Heliocentric and geocentric
          globe coordinates must both reproduce the same apparent angles.</p>
        </div>
        <div class="retrograde-vs-fe">
          <div class="retrograde-vs-tag">Topo native</div>
          <p>Raw daily circuits stay native. Remove daily sky spin and
          the cyan path is ${primary}'s same fixed-star backtrack.</p>
        </div>
      </div>
      <span class="retrograde-punch">Eligible retrograde objects only: ${scenarioWindowText(scenario, this.constructor)}. The native dot paints the daily path; cyan shows the apparent backtrack against fixed stars.</span>
    `;
  }

  updateLiveReadout() {
    if (!this.liveEl) return;
    const scenario = this.selectedScenario;
    const start = this.getWindowStart();
    const end = this.getWindowEnd();
    const current = Math.min(start + this.elapsedDays, end);
    const span = Math.max(1, end - start);
    const pct = Math.max(0, Math.min(100, ((current - start) / span) * 100));
    const active = this.currentRetroWindows(current);
    const activeText = active.length
      ? active.map((item) => planetLabel(item.planet)).join(', ')
      : 'direct motion';
    this.liveEl.innerHTML = `
      <div><b>Painting</b><span>${scenarioObjectText(scenario)}</span></div>
      <div><b>Eligibility</b><span>retrograde-capable planet path from the ephemeris</span></div>
      <div><b>Observable</b><span>${scenarioPrimaryText(scenario)} apparent RA/Dec backtrack against fixed stars</span></div>
      <div><b>Topo raw</b><span>faint daily circuits; not the comparison backtrack</span></div>
      <div><b>Star frame</b><span>axes remove daily sky spin</span></div>
      <div><b>Retro trace</b><span>bright cyan path is the globe-equivalent fixed-star backtrack</span></div>
      <div><b>Sky path</b><span>${this.model?.state?.InsideVault ? 'actual optical-vault dot path' : 'actual heavenly-vault dot path'}</span></div>
      <div><b>Cause story</b><span>${scenarioRetroType(scenario) === 'inner' ? 'inner-planet inferior-conjunction reversal' : scenarioRetroType(scenario) === 'mixed' ? 'inner and outer retrograde windows' : 'outer-planet opposition-season backtrack'}</span></div>
      <div><b>Date</b><span>${dateTimeToString(current)}</span></div>
      <div><b>Status</b><span>${activeText}</span></div>
      <div><b>Station</b><span>S1/S2 ticks sit on the star-locked backtrack</span></div>
      <div><b>Window</b><span>${formatDate(start)} to ${formatDate(end)} (${pct.toFixed(0)}%)</span></div>
    `;
  }

  buildControls(container) {
    const intro = document.createElement('div');
    intro.className = 'retrograde-reveal-card';
    intro.innerHTML = this.retrogradeIntroHtml();
    this.introEl = intro;
    container.appendChild(intro);

    const selectWrap = document.createElement('div');
    selectWrap.className = 'retrograde-select';
    const label = document.createElement('label');
    label.textContent = 'Paint path';
    const select = document.createElement('select');
    for (const scenario of SCENARIOS) {
      const opt = document.createElement('option');
      opt.value = scenario.id;
      opt.textContent = scenario.label;
      select.appendChild(opt);
    }
    select.value = this.scenarioId;
    select.addEventListener('change', () => this.setScenario(select.value));
    selectWrap.append(label, select);
    container.appendChild(selectWrap);

    const actions = document.createElement('div');
    actions.className = 'retrograde-actions';
    const playBtn = document.createElement('button');
    playBtn.className = 'retrograde-action-btn playing';
    playBtn.textContent = 'Pause';
    playBtn.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      playBtn.textContent = this.isPlaying ? 'Pause' : 'Play';
      playBtn.classList.toggle('playing', this.isPlaying);
    });
    const resetBtn = document.createElement('button');
    resetBtn.className = 'retrograde-action-btn';
    resetBtn.textContent = 'Repaint';
    resetBtn.addEventListener('click', () => this.resetTrace());
    actions.append(playBtn, resetBtn);
    container.appendChild(actions);

    const speed = document.createElement('div');
    speed.className = 'retrograde-slider';
    speed.innerHTML = `<label>Days per second</label><span class="retrograde-slider-value">${this.daysPerSecond.toFixed(1)}</span>`;
    const speedValue = speed.querySelector('.retrograde-slider-value');
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0.5';
    input.max = '18';
    input.step = '0.5';
    input.value = String(this.daysPerSecond);
    input.addEventListener('input', () => {
      this.daysPerSecond = parseFloat(input.value) || DEFAULT_DAYS_PER_SECOND;
      speedValue.textContent = this.daysPerSecond.toFixed(1);
    });
    speed.appendChild(input);
    container.appendChild(speed);

    const vortexBtn = document.createElement('button');
    vortexBtn.className = 'retrograde-action-btn';
    vortexBtn.textContent = 'Aether vortex: OFF';
    vortexBtn.addEventListener('click', () => {
      this.setVortexOn(!this.vortexOn);
      vortexBtn.textContent = `Aether vortex: ${this.vortexOn ? 'ON' : 'OFF'}`;
      vortexBtn.classList.toggle('playing', this.vortexOn);
    });
    container.appendChild(vortexBtn);

    this.liveEl = document.createElement('div');
    this.liveEl.className = 'retrograde-reading';
    container.appendChild(this.liveEl);
    this.updateLiveReadout();

    const windows = document.createElement('div');
    windows.className = 'retrograde-flow';
    windows.innerHTML = this.scenarioSummaryHtml();
    container.appendChild(windows);

    this.refreshScenarioControls = () => {
      select.value = this.scenarioId;
      input.value = String(this.daysPerSecond);
      speedValue.textContent = this.daysPerSecond.toFixed(1);
      vortexBtn.textContent = `Aether vortex: ${this.vortexOn ? 'ON' : 'OFF'}`;
      vortexBtn.classList.toggle('playing', this.vortexOn);
      if (this.introEl) this.introEl.innerHTML = this.retrogradeIntroHtml();
      windows.innerHTML = this.scenarioSummaryHtml();
      this.updateLiveReadout();
    };
  }

  // Side overlay showing the same observed angular backtrack described in
  // globe heliocentric, globe geocentric, and native topographical
  // coordinates. The visual point is equivalence of the measured
  // angles; physical dynamics are a separate layer.
  equivalenceOverlayHtml() {
    const scenario = this.selectedScenario;
    const objects = scenarioObjectText(scenario);
    const primary = scenarioPrimaryText(scenario);
    return `
      <div class="retrograde-equivalence-kicker">Kinematic equivalence</div>
      <div class="retrograde-equivalence-title">${objects}: one measured fixed-star backtrack, three coordinate maps</div>
      <svg class="retrograde-equivalence-svg" viewBox="0 0 720 260" role="img" aria-label="Retrograde backtrack compared in heliocentric, geocentric, and topographical-plane frames">
        <g class="cell">
          <rect x="8" y="12" width="224" height="232" rx="6"/>
          <text x="120" y="30" class="cell-title helio-text">Globe heliocentric</text>
          <circle cx="78" cy="138" r="6" class="sun"/>
          <text x="78" y="157" class="tiny">Sun</text>
          <circle cx="78" cy="138" r="24" class="orbit"/>
          <circle cx="78" cy="138" r="52" class="orbit"/>
          <circle cx="54" cy="138" r="3" class="earth-jan"/>
          <circle cx="62" cy="118" r="3" class="earth-jan"/>
          <circle cx="82" cy="114" r="3" class="earth-jan"/>
          <circle cx="101" cy="124" r="3" class="earth-jan"/>
          <circle cx="102" cy="145" r="3" class="earth-jan"/>
          <circle cx="30" cy="143" r="3" class="planet"/>
          <circle cx="34" cy="130" r="3" class="planet"/>
          <circle cx="42" cy="118" r="3" class="planet"/>
          <circle cx="54" cy="108" r="3" class="planet"/>
          <circle cx="68" cy="101" r="3" class="planet"/>
          <line x1="54" y1="138" x2="24" y2="145" class="ray"/>
          <line x1="62" y1="118" x2="25" y2="127" class="ray"/>
          <line x1="82" y1="114" x2="42" y2="100" class="ray"/>
          <line x1="101" y1="124" x2="64" y2="82" class="ray"/>
          <line x1="102" y1="145" x2="84" y2="64" class="ray"/>
          <path d="M 24 145 L 25 127 Q 28 108 42 100 Q 58 98 64 82 Q 73 72 84 64" class="loop"/>
          <text x="120" y="224" class="caption">Orbit geometry -> RA/Dec.</text>
        </g>
        <g class="cell">
          <rect x="248" y="12" width="224" height="232" rx="6"/>
          <text x="360" y="30" class="cell-title geo-text">Globe geocentric</text>
          <circle cx="360" cy="135" r="5" class="earth-fixed"/>
          <text x="360" y="154" class="tiny">Earth center</text>
          <circle cx="360" cy="135" r="54" class="orbit"/>
          <circle cx="414" cy="135" r="18" class="epicycle"/>
          <path d="M 304 92 C 326 76, 356 86, 360 108 C 364 132, 334 136, 329 116 C 324 94, 356 72, 414 80" class="loop"/>
          <circle cx="329" cy="116" r="3" class="planet"/>
          <line x1="360" y1="135" x2="329" y2="116" class="ray"/>
          <line x1="360" y1="135" x2="304" y2="92" class="ray dim"/>
          <line x1="360" y1="135" x2="414" y2="80" class="ray dim"/>
          <text x="360" y="224" class="caption">Earth-centered terms -> same backtrack.</text>
        </g>
        <g class="cell highlight">
          <rect x="488" y="12" width="224" height="232" rx="6"/>
          <text x="600" y="30" class="cell-title topo-text">Topo observer-first</text>
          <circle cx="557" cy="132" r="52" class="disc"/>
          <circle cx="557" cy="132" r="2.5" class="earth-fixed"/>
          <text x="557" y="149" class="tiny">observer</text>
          <circle cx="557" cy="132" r="30" class="daily"/>
          <circle cx="557" cy="132" r="42" class="daily"/>
          <path d="M 610 132 L 638 132" class="drop"/>
          <text x="624" y="121" class="tiny">remove daily spin</text>
          <line x1="638" y1="182" x2="686" y2="182" class="axis"/>
          <line x1="638" y1="182" x2="638" y2="70" class="axis"/>
          <text x="682" y="195" class="tiny">RA drift</text>
          <text x="621" y="72" class="tiny">Dec</text>
          <circle cx="646" cy="92" r="1.8" class="star-ref"/>
          <circle cx="667" cy="78" r="1.5" class="star-ref"/>
          <circle cx="681" cy="116" r="1.7" class="star-ref"/>
          <circle cx="653" cy="150" r="1.4" class="star-ref"/>
          <path d="M 646 156 C 664 139, 681 128, 676 112 C 672 99, 649 105, 655 122 C 661 139, 680 132, 690 108" class="loop topo-loop"/>
          <circle cx="676" cy="112" r="4" class="planet"/>
          <path d="M 671 109 L 681 109 M 676 104 L 676 114" class="station-tick"/>
          <text x="663" y="103" class="station-label">S1</text>
          <path d="M 650 121 L 660 121 M 655 116 L 655 126" class="station-tick"/>
          <text x="648" y="134" class="station-label">S2</text>
          <text x="600" y="224" class="caption">Raw daily path -> same RA/Dec backtrack.</text>
        </g>
      </svg>
      <div class="retrograde-equivalence-note">
        Observed first: track ${objects} against the stars. The path slows,
        stations, reverses, stations again, then moves direct. The three views map that one
        measured fixed-star backtrack. For this selection: ${scenarioMechanismText(scenario)}
        The topo view keeps the raw daily
        surface circuits visible, then factors out daily spin to reveal
        ${primary}'s same RA/Dec backtrack before any motion story is added.
      </div>
    `;
  }

  refreshEquivalenceOverlay() {
    if (this.equivalenceOverlay) {
      this.equivalenceOverlay.innerHTML = this.equivalenceOverlayHtml();
    }
  }

  openEquivalenceOverlay() {
    if (this.equivalenceOverlay || typeof document === 'undefined') return;
    const overlay = document.createElement('div');
    overlay.className = 'retrograde-equivalence-overlay';
    overlay.innerHTML = this.equivalenceOverlayHtml();
    const host = document.getElementById('view') || document.body;
    host.appendChild(overlay);
    this.equivalenceOverlay = overlay;
  }

  closeEquivalenceOverlay() {
    this.equivalenceOverlay?.remove?.();
    this.equivalenceOverlay = null;
  }

  getInfoPanel() {
    const scenario = this.selectedScenario;
    const objects = scenarioObjectText(scenario);
    const primary = scenarioPrimaryText(scenario);
    const mechanism = scenarioMechanismText(scenario);
    const windows = scenarioWindowText(scenario, this.constructor);
    return `
      <h3>Planetary Retrograde - kinematic equivalence</h3>
      <p class="retrograde-info-lede">The selected target set (${objects}) briefly appears to reverse
      direction against the fixed stars. The shared observable is the same
      apparent angular backtrack; heliocentric, geocentric, and topo
      coordinates all have to reproduce that backtrack. Active retrograde window:
      ${windows}.</p>
      <div class="retrograde-info-vs">
        <div class="retrograde-info-card retrograde-info-observed">
          <div class="retrograde-info-tag">Observed sky path</div>
          <ul>
            <li>Input is apparent RA/Dec from the bundled ephemeris.</li>
            <li>The path slows, reaches a stationary point, reverses,
            reaches a second stationary point, then resumes direct motion.</li>
            <li>This is the falsifiable target every frame must match.</li>
          </ul>
        </div>
        <div class="retrograde-info-card retrograde-info-helio">
          <div class="retrograde-info-tag">Globe heliocentric</div>
          <ul>
            <li>Computes the apparent direction from Earth and planet
            positions around the Sun.</li>
            <li>${mechanism}</li>
          </ul>
        </div>
        <div class="retrograde-info-card retrograde-info-geocentric">
          <div class="retrograde-info-tag">Globe geocentric</div>
          <ul>
            <li>Keeps Earth at the coordinate center.</li>
            <li>Uses Earth-centered angular terms, historically deferents
            and epicycles, to match the same apparent backtrack.</li>
            <li>It is kinematically equivalent at the level of observed
            sky angles.</li>
          </ul>
        </div>
        <div class="retrograde-info-card retrograde-info-fe">
          <div class="retrograde-info-tag">Topo observer-first</div>
          <ul>
            <li>Starts with the same measured apparent direction.</li>
            <li>Maps that direction to the heavenly vault, then drops its
            x/y position to the surface.</li>
            <li>White dots mark the local fixed-star reference.</li>
            <li>The cyan ${primary} path grows from the same apparent sky
            samples with daily sky rotation factored out; this is the
            globe-equivalent retrograde backtrack, pinned to the visible ${primary} dot.</li>
            <li>The 3D companion trace follows the same planet dot on the
            heavenly vault, and switches to the optical-vault path in
            eye-view.</li>
            <li>The raw result is a stack of daily ring-like paths whose slow
            seasonal drift reverses during retrograde.</li>
          </ul>
        </div>
      </div>
      <p class="retrograde-info-punch">This demo is observer-first:
      match the measured sky path first, then make the added assumptions
      visible instead of hiding them inside the coordinate story.</p>
    `;
  }
}

export default RetrogradeExperiment;
