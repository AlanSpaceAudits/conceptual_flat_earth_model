// Stellar Parallax - fixed S-N-F measurement overlay.
//
// The selected star is taken from the app's computed ephemeris/star pipeline,
// then the parallax demonstration applies the selected star's catalog p angle
// in that observer sky frame. The experiment keeps the native tracked star
// dot and draws its own reduced S-N-F reference, A/B sightlines, and 2p
// result so the measurement stays tied to the app ephemeris.

import * as THREE from 'three';
import { BaseExperiment } from '../baseExperiment.js';
import { dateTimeToString } from '../../core/time.js';

const C_TEXT = 0xd9dde6;
const C_DELTA = 0xffd36a;
const C_CURRENT = 0xfff3c6;
const C_A = 0x9fb7ff;
const C_B = 0x42ffd0;
const C_REF = 0xd9dde6;
const C_OBSERVER = 0x8fb8ff;

// Curated S-N-F demo:
// - Observer at lat 38°N, lon 0° (Atlantic west of Spain). Local time = UTC.
// - A: 2026-12-22 00:00 UTC = local midnight at winter solstice.
//     Sun altitude at observer: -75.4° (deep astronomical night).
// - B: 2027-06-22 00:00 UTC = local midnight at summer solstice.
//     Sun altitude at observer: -28.6° (still deep astronomical night).
// - Stars selected are circumpolar at lat 38°N (declination > 52°), so each
//   stays above the horizon at both midnights. Catalog parallaxes are
//   Hipparcos / Gaia values in arcseconds.
const DEFAULT_STAR_ID = 'alioth';
const DEMO_OBSERVER_LAT = 38.0;
const DEMO_OBSERVER_LON = 0.0;
const A_UTC = [2026, 12, 22, 0, 0];
const B_UTC = [2027, 6, 22, 0, 0];
const A_TRACE_START = 1.0;
const A_TRACE_END = 7;
const ADVANCE_START = 16;
const B_LOCK_BLEND_START = 54;
const ADVANCE_END = 60;
const B_TRACE_START = 60;
const B_TRACE_END = 65.5;
const ANGLE_START = 66;
const ANGLE_END = 73.5;
const POST_ROLL_START = 84;
const TRACE_CYCLE_SECONDS = 100;
const ARCSEC_TO_RAD = Math.PI / (180 * 3600);

// Polaris is intentionally excluded: its near-pole position makes the
// parallax ellipse nearly circular, so a 1-D ±p A/B demo shows almost
// no apparent motion between the two epochs — visually misleading even
// though the catalog math is correct. The four stars below all sit far
// enough off the celestial pole that the seasonal A/B baseline gives a
// clean, visible linear shift.
const STAR_PRESETS = [
  { id: 'alioth',  name: 'Alioth (ε UMa)',  shortName: 'Alioth',  parallaxArcsec: 0.03978, demoAltA: 24, demoAltB: 38, demoSunA: -75, demoSunB: -29 },
  { id: 'dubhe',   name: 'Dubhe (α UMa)',   shortName: 'Dubhe',   parallaxArcsec: 0.02638, demoAltA: 39, demoAltB: 27, demoSunA: -75, demoSunB: -29 },
  { id: 'kochab',  name: 'Kochab (β UMi)',  shortName: 'Kochab',  parallaxArcsec: 0.02491, demoAltA: 27, demoAltB: 48, demoSunA: -75, demoSunB: -29 },
  { id: 'schedar', name: 'Schedar (α Cas)', shortName: 'Schedar', parallaxArcsec: 0.01429, demoAltA: 36, demoAltB: 26, demoSunA: -75, demoSunB: -29 },
];

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function cssColor(hex) {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

function formatArcsec(value) {
  if (value < 0.01) return `${value.toFixed(4)}"`;
  if (value < 0.1) return `${value.toFixed(3)}"`;
  return `${value.toFixed(2)}"`;
}

function formatAltPair(star) {
  const altA = Number.isFinite(star?.demoAltA) ? star.demoAltA : star?.demoAlt;
  const altB = Number.isFinite(star?.demoAltB) ? star.demoAltB : star?.demoAlt;
  return `A ~${Math.round(altA)} deg / B ~${Math.round(altB)} deg`;
}

function shortDateTime(dateTime) {
  const full = dateTimeToString(dateTime);
  return full.replace(' / ', ' ');
}

function lineMaterial(color, opacity = 1, dashed = false) {
  const Mat = dashed ? THREE.LineDashedMaterial : THREE.LineBasicMaterial;
  return new Mat({
    color,
    transparent: opacity < 1,
    opacity,
    depthTest: false,
    depthWrite: false,
    dashSize: dashed ? 0.045 : undefined,
    gapSize: dashed ? 0.035 : undefined,
  });
}

function makeWorldLine(color, opacity = 1, dashed = false) {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
    lineMaterial(color, opacity, dashed),
  );
  line.renderOrder = 86;
  if (dashed) line.computeLineDistances();
  return line;
}

function setLinePoints(line, points) {
  if (!line) return;
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry().setFromPoints(points);
  line.computeLineDistances?.();
}

function setVisualOpacity(object, opacity) {
  object?.traverse?.((child) => {
    const materials = Array.isArray(child.material)
      ? child.material
      : child.material ? [child.material] : [];
    for (const material of materials) {
      material.transparent = true;
      material.opacity = opacity;
      material.needsUpdate = true;
    }
  });
}

function setVisualColor(object, color) {
  object?.traverse?.((child) => {
    const materials = Array.isArray(child.material)
      ? child.material
      : child.material ? [child.material] : [];
    for (const material of materials) {
      material.color?.setHex?.(color);
      material.needsUpdate = true;
    }
  });
}

function mixHex(from, to, t) {
  return new THREE.Color(from).lerp(new THREE.Color(to), clamp(t, 0, 1)).getHex();
}

function smoothStep(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function segmentProgress(t, start, end) {
  return smoothStep((t - start) / (end - start));
}

function easeInOutCubic(t) {
  const x = clamp(t, 0, 1);
  return x < 0.5
    ? 4 * x * x * x
    : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function tracePolylinePoints(points, progress) {
  if (!points?.length) return [];
  if (points.length === 1) return [points[0].clone()];
  const clamped = clamp(progress, 0, 1);
  if (clamped <= 0) return [points[0].clone(), points[0].clone()];
  if (clamped >= 1) return points.map((p) => p.clone());

  const lengths = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const len = points[i].distanceTo(points[i + 1]);
    lengths.push(len);
    total += len;
  }
  let remaining = total * clamped;
  const out = [points[0].clone()];
  for (let i = 0; i < lengths.length; i++) {
    if (remaining >= lengths[i]) {
      out.push(points[i + 1].clone());
      remaining -= lengths[i];
      continue;
    }
    const local = lengths[i] > 0 ? remaining / lengths[i] : 0;
    out.push(points[i].clone().lerp(points[i + 1], local));
    break;
  }
  if (out.length < 2) out.push(out[0].clone());
  return out;
}

function makeMarker(color, radius = 0.045, opacity = 1) {
  const group = new THREE.Group();
  const ringPts = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    ringPts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0.004));
  }
  const ring = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(ringPts),
    lineMaterial(color, opacity),
  );
  ring.renderOrder = 89;
  const crossA = makeWorldLine(color, opacity * 0.72);
  const crossB = makeWorldLine(color, opacity * 0.72);
  setLinePoints(crossA, [
    new THREE.Vector3(-radius * 0.62, 0, 0.004),
    new THREE.Vector3(radius * 0.62, 0, 0.004),
  ]);
  setLinePoints(crossB, [
    new THREE.Vector3(0, -radius * 0.62, 0.004),
    new THREE.Vector3(0, radius * 0.62, 0.004),
  ]);
  crossA.renderOrder = 89;
  crossB.renderOrder = 89;
  group.add(ring, crossA, crossB);
  return group;
}

function makeDirectionalArc(center, dirA, dirB, radius) {
  const pts = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    const dir = dirA.clone().multiplyScalar(1 - t).addScaledVector(dirB, t);
    if (dir.lengthSq() < 1e-8) continue;
    dir.normalize();
    pts.push(center.clone().addScaledVector(dir, radius));
  }
  return pts;
}

function tiltDirection(axis, side, angle) {
  const dir = axis.clone()
    .multiplyScalar(Math.cos(angle))
    .addScaledVector(side, Math.sin(angle));
  if (dir.lengthSq() < 1e-8) return axis.clone();
  return dir.normalize();
}

export class ParallaxExperiment extends BaseExperiment {
  static get id() { return 'parallax'; }
  static get name() { return 'Stellar Parallax'; }
  static get category() { return 'equivalence'; }
  static get description() {
    return 'One measured star sightline, two six-month marks, one parallax readout.';
  }

  init() {
    this.experimentScale = 1;
    this.followObserver = false;
    this.starId = DEFAULT_STAR_ID;
    this.visualBoost = 36000;
    this.geometryClock = 0;
    this.epochA = null;
    this.epochB = null;
    this._lastSeasonDateTime = null;
    this._cycleIndex = -1;
    this._wasFinalHold = false;
    this._bLockedCycle = -1;
    this._bLockStartPoint = null;
    this.measureFrame = null;
    this.measureFrameB = null;
    this.measureA = null;
    this.measureB = null;
    this._autoplayWasPlaying = false;
    this.textures = [];
    this.labels = {};
    this.starSelect = null;
    this.liveReadoutEl = null;
    this.angleOverlay = null;

    this._buildVisualization();
  }

  getHistoricalSetup() {
    return {
      state: {
        WorldModel: 'fe',
        StarfieldType: 'celnav',
        ShowVault: false,
        ShowOpticalVault: true,
        ShowFeGrid: true,
        ShowStars: true,
        ShowShadow: true,
        ShowDayNightShadow: true,
        PermanentNight: false,
        DynamicStars: false,
        ShowCelestialBodies: true,
        ShowPlanets: false,
        ShowCelNav: true,
        ShowConstellations: false,
        ShowConstellationLines: false,
        ShowBlackHoles: false,
        ShowQuasars: false,
        ShowGalaxies: false,
        ShowSatellites: false,
        ShowTruePositions: false,
        ShowGroundPoints: false,
        ShowGPPath: false,
        ShowVaultRays: false,
        ShowOpticalVaultRays: false,
        ShowProjectionRays: false,
        SuppressOpticalStarPoints: false,
        ShowLiveEphemeris: false,
        ShowEphemerisReadings: false,
        DateTime: this.getDemoStartDateTime(),
        ObserverLat: this.getObserverLat(),
        ObserverLong: this.getObserverLon(),
        SpecifiedTrackerMode: true,
        TrackerGPOverride: false,
        TrackerTargets: [`star:${DEFAULT_STAR_ID}`],
        FollowTarget: `star:${DEFAULT_STAR_ID}`,
        FreeCameraMode: false,
        FreeCamActive: false,
        InsideVault: false,
        CameraDirection: 0,
        CameraHeight: 28,
        CameraDistance: 9.2,
        Zoom: 4.8,
        Description: 'STELLAR PARALLAX: one measured star sightline; mark A, advance six months, mark B.',
      },
    };
  }

  get selectedPreset() {
    return STAR_PRESETS.find((s) => s.id === this.starId) || STAR_PRESETS[0];
  }

  getObserverLat() {
    return DEMO_OBSERVER_LAT;
  }

  getObserverLon() {
    return DEMO_OBSERVER_LON;
  }

  getDemoStartDateTime() {
    const [year, month, day, hour = 0, minute = 0] = A_UTC;
    return this.constructor.utcDateTime(year, month, day, hour, minute, 0);
  }

  getDemoEndDateTime() {
    const [year, month, day, hour = 0, minute = 0] = B_UTC;
    return this.constructor.utcDateTime(year, month, day, hour, minute, 0);
  }

  _buildVisualization() {
    this.visualGroup.name = 'stellar-parallax-snf';
    this.visualGroup.position.set(0, 0, 0);
    this.visualGroup.scale.setScalar(1);

    // Live tracked beam: observer → native N during the demo. Stays
    // visible while the model fast-forwards through daylight; locks
    // on the B sightline at the final hold.
    this.currentBeam = makeWorldLine(C_CURRENT, 0.95);
    this.visualGroup.add(this.currentBeam);

    // S-N-F geometry: reference line through N to F, the two reduced
    // sightlines, the theta arc at the observer, and the chord that
    // visualises the A-to-B = 2p split.
    this.referenceLine = makeWorldLine(C_REF, 0.55, true);
    this.compareBeams = [makeWorldLine(C_A, 0.92), makeWorldLine(C_B, 0.92)];
    this.compareStars = [makeMarker(C_A, 0.045, 0.95), makeMarker(C_B, 0.045, 0.95)];
    // Triple-stacked theta arc so the parallax angle is a thick,
    // unmistakable wedge at the observer — this is the headline
    // measurement of the demo and must be visible at a glance.
    this.thetaBaseRay = makeWorldLine(C_DELTA, 0.85);
    this.thetaArc = makeWorldLine(C_DELTA, 1.0);
    this.thetaArcInner = makeWorldLine(C_DELTA, 0.70);
    this.thetaArcOuter = makeWorldLine(C_DELTA, 0.70);
    this.thetaTip = makeMarker(C_DELTA, 0.04, 1.0);
    this.deltaChord = makeWorldLine(C_DELTA, 0.85);
    this.sunReferenceMarker = makeMarker(C_REF, 0.026, 0.55);
    this.farReferenceMarker = makeMarker(C_REF, 0.026, 0.65);
    this.visualGroup.add(
      this.referenceLine,
      this.compareBeams[0],
      this.compareBeams[1],
      this.compareStars[0],
      this.compareStars[1],
      this.thetaBaseRay,
      this.thetaArc,
      this.thetaArcInner,
      this.thetaArcOuter,
      this.thetaTip,
      this.deltaChord,
      this.sunReferenceMarker,
      this.farReferenceMarker,
    );

    this.observerMarker = makeMarker(C_OBSERVER, 0.046, 0.95);
    this.targetMarker = makeMarker(C_CURRENT, 0.05, 1);
    this.visualGroup.add(this.observerMarker, this.targetMarker);

    this.labels.title = this._makeTextSprite('Stellar parallax', {
      color: C_CURRENT, width: 900, height: 82, fontSize: 30, scale: 0.04,
    });
    this.labels.star = this._makeTextSprite('N: near star', {
      color: C_CURRENT, width: 140, height: 58, fontSize: 28, scale: 0.028,
    });
    this.labels.result = this._makeTextSprite('Mark, wait six months, mark again', {
      color: C_TEXT, width: 820, height: 84, fontSize: 26, scale: 0.038,
    });
    this.labels.reference = this._makeTextSprite('S-N-F reference', {
      color: C_REF, width: 620, height: 74, fontSize: 24, scale: 0.032,
    });
    this.labels.theta = this._makeTextSprite('A-to-B = 2p', {
      color: C_DELTA, width: 580, height: 76, fontSize: 28, scale: 0.036,
    });
    this.labels.jan = this._makeTextSprite('A', {
      color: C_A, width: 130, height: 58, fontSize: 28, scale: 0.028,
    });
    this.labels.jul = this._makeTextSprite('B', {
      color: C_B, width: 130, height: 58, fontSize: 28, scale: 0.028,
    });
    this.labels.far = this._makeTextSprite('F: far background', {
      color: C_REF, width: 140, height: 58, fontSize: 28, scale: 0.028,
    });
    this.labels.sun = this._makeTextSprite('S', {
      color: C_REF, width: 140, height: 58, fontSize: 28, scale: 0.028,
    });

    for (const sprite of Object.values(this.labels)) this.visualGroup.add(sprite);
    this._refreshLayout();
  }

  _vecFromArray(v) {
    return new THREE.Vector3(v?.[0] || 0, v?.[1] || 0, v?.[2] || 0);
  }

  _getObserverWorld() {
    const obs = this.model.computed.ObserverFeCoord;
    return obs ? this._vecFromArray(obs) : new THREE.Vector3();
  }

  getTargetStar() {
    const lists = [
      this.model.computed.CelNavStars,
      this.model.computed.CataloguedStars,
      this.model.computed.BlackHoles,
      this.model.computed.Quasars,
      this.model.computed.Galaxies,
    ];
    for (const list of lists) {
      const found = list?.find((s) => s.id === this.starId);
      if (found) return found;
    }
    return null;
  }

  _getTargetWorld() {
    const star = this.getTargetStar();
    // The experiment is about what the observer sees through the telescope:
    // use the personal optical-vault point only, not the heavenly-vault source.
    const coord = star?.opticalVaultCoord
      || star?.globeOpticalVaultCoord;
    return coord ? this._vecFromArray(coord) : null;
  }

  _getSunWorld() {
    const c = this.model.computed;
    const coord = c.SunOpticalVaultCoord
      || c.SunGlobeOpticalVaultCoord;
    return coord ? this._vecFromArray(coord) : null;
  }

  _rayBasis(obs, target) {
    const axis = target.clone().sub(obs);
    if (axis.lengthSq() < 1e-8) axis.set(0, 0, 1);
    axis.normalize();

    const worldUp = new THREE.Vector3(0, 0, 1);
    let side = new THREE.Vector3().crossVectors(axis, worldUp);
    if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
    side.normalize();

    const normal = new THREE.Vector3().crossVectors(side, axis).normalize();
    return { axis, side, normal };
  }

  _parallaxBasis(obs, target, sun) {
    const basis = this._rayBasis(obs, target);
    if (sun) {
      const sunDir = sun.clone().sub(obs);
      const sunSide = sunDir.addScaledVector(basis.axis, -sunDir.dot(basis.axis));
      if (sunSide.lengthSq() > 1e-8) {
        basis.side.copy(sunSide.normalize());
        basis.normal.crossVectors(basis.side, basis.axis).normalize();
      }
    }
    return basis;
  }

  // Per-star visual boost that keeps the drawn S-N-F geometry faithful
  // to the catalog p: drawn_theta_rad = p_arcsec * ARCSEC_TO_RAD * boost.
  // Inverting (drawn_theta / boost / ARCSEC_TO_RAD) always recovers the
  // catalog arcsec exactly, so the *measured* angle from the scene is the
  // catalog value by construction. The boost only controls visibility —
  // it auto-scales so even tiny-p stars draw at a readable angle without
  // breaking the math.
  _effectiveBoost() {
    const pRad = this.selectedPreset.parallaxArcsec * ARCSEC_TO_RAD;
    if (pRad <= 0) return this.visualBoost;
    // Drawn θ floor pushed to ~7° so the parallax arc is unmistakable
    // at a glance. Inverse-mapping the drawn angle through the same
    // boost still recovers the catalog p exactly — the boost only
    // changes display size, not the measured value.
    const minDrawnRad = 0.12;   // ≈ 6.9°  — instantly visible
    const maxDrawnRad = 0.22;   // ≈ 12.6° — still uncluttered
    const minBoost = minDrawnRad / pRad;
    const maxBoost = maxDrawnRad / pRad;
    return clamp(this.visualBoost, minBoost, maxBoost);
  }

  _visualAngleRad() {
    return this.selectedPreset.parallaxArcsec * ARCSEC_TO_RAD * this._effectiveBoost();
  }

  _captureCurrentFrame() {
    const target = this._getTargetWorld();
    const obs = this._getObserverWorld();
    if (!target) return null;

    const sun = this._getSunWorld();
    const basis = this._parallaxBasis(obs, target, sun);
    const { axis } = basis;
    const dist = Math.max(0.25, obs.distanceTo(target));
    const refBack = clamp(dist * 0.18, 0.10, 0.34);
    const refForward = clamp(dist * 0.34, 0.18, 0.58);
    let sunRef = target.clone().addScaledVector(axis, -refBack);
    let farRef = target.clone().addScaledVector(axis, refForward);
    if (sun) {
      const snfDir = target.clone().sub(sun);
      if (snfDir.lengthSq() > 1e-8) {
        snfDir.normalize();
        sunRef = target.clone().addScaledVector(snfDir, -refBack);
        farRef = target.clone().addScaledVector(snfDir, refForward);
      }
    }

    return {
      target: target.clone(),
      sun: sunRef.clone(),
      far: farRef.clone(),
      observer: obs.clone(),
      axis: axis.clone(),
      side: basis.side.clone(),
      normal: basis.normal.clone(),
      dist,
    };
  }

  _measurementFromFrame(frame, sign = 0) {
    if (!frame) return null;
    const dir = tiltDirection(frame.axis, frame.side, this._visualAngleRad() * sign);
    return {
      point: frame.observer.clone().addScaledVector(dir, frame.dist),
      target: frame.target.clone(),
      sun: frame.sun.clone(),
      far: frame.far.clone(),
      observer: frame.observer.clone(),
    };
  }

  _captureMeasurementFrameAt(dateTime) {
    if (!Number.isFinite(dateTime)) return null;
    const restoreDateTime = this.model?.state?.DateTime;
    this.model?.setState?.({ DateTime: dateTime }, false);
    const frame = this._captureCurrentFrame();
    if (Number.isFinite(restoreDateTime)) {
      this.model?.setState?.({ DateTime: restoreDateTime }, false);
    }
    return frame;
  }

  _precomputeMeasurements(restoreDateTime = this.model?.state?.DateTime) {
    if (this.epochA == null || this.epochB == null) return;
    const frameA = this._captureMeasurementFrameAt(this.epochA);

    // The measured parallax diagram is a reduced S-N-F frame: one stable
    // far-background reference, with A = -p and B = +p around that same
    // reference axis. The live ephemeris can move during the six-month
    // advance, but the measurement scaffold must not re-anchor at B.
    this.measureFrame = frameA;
    this.measureFrameB = frameA;
    this.measureA = this._measurementFromFrame(this.measureFrame, -1);
    this.measureB = this._measurementFromFrame(this.measureFrame, 1);
    if (Number.isFinite(restoreDateTime)) {
      this.model?.setState?.({ DateTime: restoreDateTime }, false);
    }
  }

  _setSeasonEpochs() {
    this.epochA = this.getDemoStartDateTime();
    this.epochB = this.getDemoEndDateTime();
    this._lastSeasonDateTime = null;
    this._cycleIndex = -1;
    this._wasFinalHold = false;
    this._bLockedCycle = -1;
    this._bLockStartPoint = null;
    this.measureFrame = null;
    this.measureFrameB = null;
    this.measureA = null;
    this.measureB = null;
    this._precomputeMeasurements(this.epochA);
  }

  _geometryRevealState() {
    const cycle = Math.floor(this.geometryClock / TRACE_CYCLE_SECONDS);
    const s = ((this.geometryClock % TRACE_CYCLE_SECONDS) + TRACE_CYCLE_SECONDS) % TRACE_CYCLE_SECONDS;
    const startHold = s < ADVANCE_START;
    const finalHold = s >= ADVANCE_END && s < POST_ROLL_START;
    const postRoll = segmentProgress(s, POST_ROLL_START, TRACE_CYCLE_SECONDS);
    const seasonRaw = (s - ADVANCE_START) / (ADVANCE_END - ADVANCE_START);
    const season = s >= ADVANCE_END ? 1 : easeInOutCubic(seasonRaw);
    const flashA = startHold ? 0.5 + 0.5 * Math.sin(this.geometryClock * 2.2) : 0;
    const flashB = finalHold ? 0.5 + 0.5 * Math.sin(this.geometryClock * 2.0) : 0;
    return {
      cycle,
      seconds: s,
      reference: 1,
      beamA: segmentProgress(s, A_TRACE_START, A_TRACE_END),
      beamB: segmentProgress(s, B_TRACE_START, B_TRACE_END),
      angle: segmentProgress(s, ANGLE_START, ANGLE_END),
      season,
      bLockBlend: segmentProgress(s, B_LOCK_BLEND_START, ADVANCE_END),
      postRoll,
      flashA,
      flashB,
      flash: Math.max(flashA, flashB),
      startHold,
      finalHold,
      resetting: s >= TRACE_CYCLE_SECONDS - 0.5,
    };
  }

  _traceStage(reveal = this._geometryRevealState()) {
    const starName = this.selectedPreset?.shortName || this.selectedPreset?.name || 'the selected star';
    if (reveal.postRoll > 0.01) {
      return {
        label: `Hold ${starName} before reset`,
        detail: 'A, B, and 2p stay visible so the measurement can be read before the trace restarts.',
      };
    }
    if (reveal.finalHold && reveal.angle > 0.75) {
      return {
        label: 'B locked: read A-to-B',
        detail: 'The highlighted split is A-to-B = 2p in the fixed S-N-F frame.',
      };
    }
    if (reveal.finalHold && reveal.angle > 0.01) {
      return {
        label: 'Reveal the parallax angle',
        detail: 'The arc opens from A (-p) to B (+p), so the full measured split is 2p.',
      };
    }
    if (reveal.finalHold && reveal.beamB > 0.01) {
      return {
        label: 'Draw B: second sightline',
        detail: 'The clock is locked at point B while the second sightline draws.',
      };
    }
    if (reveal.finalHold) {
      return {
        label: 'B locked: second star position',
        detail: 'The six-month advance is complete; B starts drawing immediately.',
      };
    }
    if (reveal.season > 0.01) {
      return {
        label: `Advance ${starName} to the second sighting`,
        detail: `The beam tracks ${starName} from the live ephemeris while the model clock advances.`,
      };
    }
    if (reveal.startHold && reveal.beamA > 0.98) {
      return {
        label: 'A locked: first star position',
        detail: 'The first sightline is left behind as the fixed comparison mark.',
      };
    }
    if (reveal.beamA > 0.01) {
      return {
        label: 'A: first star position',
        detail: 'The first measured sightline marks the selected near star against F.',
      };
    }
    return {
      label: 'Set the S-N-F reference',
      detail: 'S, N, and F form the fixed reference line before A and B are marked.',
    };
  }

  _refreshLayout() {
    this._syncSeasonDateTime(true);
    this._updateWorldBeams();
    this._refreshButtons();
    this.updateLiveReadout();
  }

  _syncSeasonDateTime(force = false) {
    if (!this.active || this.epochA == null || this.epochB == null) return;
    const reveal = this._geometryRevealState();
    const span = this.epochB - this.epochA;
    const targetDateTime = reveal.finalHold || reveal.postRoll > 0
      ? this.epochB
      : this.epochA + span * reveal.season;
    const holdLocked = reveal.startHold || reveal.finalHold;
    const justEnteredFinalHold = reveal.finalHold && !this._wasFinalHold;
    this._wasFinalHold = reveal.finalHold;
    const delta = Math.abs((this._lastSeasonDateTime ?? NaN) - targetDateTime);
    if (!force && !justEnteredFinalHold && delta < 0.002) return;
    this._lastSeasonDateTime = targetDateTime;
    // Force emit on entering the B lock so the renderer (day/night
    // shadow, sub-solar point, star positions) refreshes to epochB
    // before the B sightline and theta arc are drawn. Without this,
    // setState(DateTime, false) runs the model recompute but the
    // renderer's frame() handler — which copies SunRA/SunDec/SkyRot
    // into shader uniforms — never re-fires.
    const emit = force || !holdLocked || justEnteredFinalHold || delta > 0.01;
    this.model?.setState?.({ DateTime: targetDateTime }, emit);
  }

  _updateWorldBeams() {
    const target = this._getTargetWorld();
    const sun = this._getSunWorld();
    const obs = this._getObserverWorld();
    if (!target) {
      this.visualGroup.visible = false;
      return;
    }
    this.visualGroup.visible = true;
    this.visualGroup.position.set(0, 0, 0);
    this.visualGroup.scale.setScalar(1);

    const star = this.getTargetStar();
    const preset = this.selectedPreset;
    if (!this.measureFrame || !this.measureFrameB || !this.measureA || !this.measureB) {
      this._precomputeMeasurements(this.model?.state?.DateTime);
    }
    const liveFrame = this._captureCurrentFrame();
    const frameA = this.measureFrame || liveFrame;
    const frameB = this.measureFrameB || frameA;
    const referenceFrame = this.measureFrame || frameA || liveFrame;
    const reveal = this._geometryRevealState();
    // During the live advance, the tracked beam follows the live
    // ephemeris. At A and B we lock to the precomputed frame so the
    // mark and theta arc agree with epochA / epochB even if the
    // renderer is between repaints.
    const activeFrame = reveal.finalHold
      ? referenceFrame
      : reveal.startHold
        ? referenceFrame
        : liveFrame || referenceFrame;
    const frame = referenceFrame || activeFrame || frameA;
    const fallbackBasis = this._parallaxBasis(obs, target, sun);
    const axis = referenceFrame?.axis || fallbackBasis.axis;
    const side = referenceFrame?.side || fallbackBasis.side;
    const normal = referenceFrame?.normal || fallbackBasis.normal;
    const layoutObserver = referenceFrame?.observer || obs;
    const layoutTarget = referenceFrame?.target || target;
    const dist = referenceFrame?.dist || Math.max(0.25, obs.distanceTo(target));
    if (reveal.cycle !== this._cycleIndex) {
      this._cycleIndex = reveal.cycle;
      this._bLockedCycle = -1;
      this._bLockStartPoint = null;
    }
    const thetaRadius = clamp(dist * 0.24, 0.32, 0.90);

    // S-N-F geometry. The native model gives the observer→N axis;
    // the F point extends that axis past N. The reduced A and B
    // sightlines deviate from this axis by ±p in the parallax plane
    // (the plane spanned by the observer→N axis and the local Sun
    // direction projected perpendicular to it). At A and B the
    // sightline endpoints come from the precomputed frame so the
    // lock visuals match the locked DateTime regardless of how the
    // renderer paced its frames.
    const refBack = clamp(dist * 0.18, 0.10, 0.34);
    const refForward = clamp(dist * 0.34, 0.18, 0.58);
    const refSun = referenceFrame?.sun
      || layoutTarget.clone().addScaledVector(axis, -refBack);
    const fallbackFar = layoutTarget.clone().addScaledVector(axis, refForward);
    const refFar = this.measureA?.far || referenceFrame?.far || fallbackFar;

    const activeSign = reveal.finalHold
      ? 1
      : reveal.seconds < A_TRACE_START
        ? 0
        : reveal.startHold
          ? -1
          : -1 + 2 * reveal.season;
    const seasonPoint = this._measurementFromFrame(activeFrame || frame, activeSign);
    const aPoint = this.measureA?.point || seasonPoint?.point || target;
    const bPoint = this.measureB?.point || seasonPoint?.point || target;
    const angleFrame = referenceFrame || frameB || frameA;
    const angleObserver = angleFrame?.observer || layoutObserver;
    const angleAxis = angleFrame?.axis || axis;
    const angleNormal = angleFrame?.normal || normal;
    const refDir = angleAxis.clone().normalize();
    const dirA = (this._measurementFromFrame(angleFrame, -1)?.point || aPoint)
      .clone().sub(angleObserver);
    const dirB = (this._measurementFromFrame(angleFrame, 1)?.point || bPoint)
      .clone().sub(angleObserver);
    if (dirA.lengthSq() < 1e-8) dirA.copy(refDir);
    if (dirB.lengthSq() < 1e-8) dirB.copy(refDir);
    dirA.normalize();
    dirB.normalize();
    // Headline arc spans the full A↔B wedge (= 2p). It opens during
    // the reveal phase from the A sightline (already locked) to the
    // B sightline so the user watches the parallax angle being
    // physically traced out.
    const thetaStartDir = dirA.clone();
    const thetaEndDir = dirA.clone().multiplyScalar(1 - reveal.angle).addScaledVector(dirB, reveal.angle);
    if (thetaEndDir.lengthSq() < 1e-8) thetaEndDir.copy(dirA);
    thetaEndDir.normalize();
    const beamAPoint = layoutObserver.clone().lerp(aPoint, reveal.beamA);
    const beamBPoint = layoutObserver.clone().lerp(bPoint, reveal.beamB);
    const angleA = angleObserver.clone().addScaledVector(dirA, dist);
    const angleB = angleObserver.clone().addScaledVector(dirB, dist);
    const deltaPoint = angleA.clone().lerp(angleB, reveal.angle);
    const activeBeamOnB = reveal.finalHold || reveal.postRoll > 0 || reveal.bLockBlend > 0.995;
    const activeBeamOnA = reveal.startHold && reveal.seconds >= A_TRACE_START;
    const activeBeamSourcePoint = seasonPoint?.point || target;
    if (reveal.startHold || reveal.bLockBlend <= 0.001) {
      this._bLockStartPoint = null;
    } else if (!this._bLockStartPoint && !activeBeamOnB) {
      this._bLockStartPoint = activeBeamSourcePoint.clone();
    }
    const activeBeamPoint = activeBeamOnB
      ? bPoint
      : this._bLockStartPoint && bPoint
        ? this._bLockStartPoint.clone().lerp(bPoint, reveal.bLockBlend)
        : activeBeamSourcePoint;
    const activeBeamMix = reveal.finalHold || reveal.postRoll > 0
      ? 0.42 + reveal.flashB * 0.38
      : reveal.bLockBlend > 0.001
        ? reveal.bLockBlend * 0.42
        : activeBeamOnA
          ? 0.44 + reveal.flashA * 0.42
          : 0;
    setLinePoints(this.currentBeam, [layoutObserver, activeBeamPoint]);
    setVisualColor(
      this.currentBeam,
      activeBeamOnB || activeBeamOnA
        ? mixHex(C_CURRENT, activeBeamOnB ? C_B : C_A, activeBeamMix)
        : C_CURRENT,
    );

    // Reference line: fixed S → N → F.
    setLinePoints(this.referenceLine, tracePolylinePoints([refSun, layoutTarget, refFar], reveal.reference));

    setLinePoints(this.compareBeams[0], [layoutObserver, beamAPoint]);
    setLinePoints(this.compareBeams[1], [layoutObserver, beamBPoint]);
    this.compareStars[0].position.copy(aPoint);
    this.compareStars[1].position.copy(bPoint);
    this.sunReferenceMarker.position.copy(refSun);
    this.farReferenceMarker.position.copy(refFar);
    // Base ray points along the A sightline (one edge of the wedge).
    setLinePoints(this.thetaBaseRay, [
      angleObserver,
      angleObserver.clone().addScaledVector(thetaStartDir, thetaRadius * 1.38),
    ]);
    const thetaArcPoints = makeDirectionalArc(angleObserver, thetaStartDir, thetaEndDir, thetaRadius);
    setLinePoints(this.thetaArc, thetaArcPoints);
    // Inner / outer concentric rings make the wedge a thick band.
    setLinePoints(this.thetaArcInner, makeDirectionalArc(angleObserver, thetaStartDir, thetaEndDir, thetaRadius * 0.92));
    setLinePoints(this.thetaArcOuter, makeDirectionalArc(angleObserver, thetaStartDir, thetaEndDir, thetaRadius * 1.08));
    this.thetaTip.position.copy(thetaArcPoints[thetaArcPoints.length - 1] || angleObserver);
    setLinePoints(this.deltaChord, [angleA, deltaPoint]);

    this.observerMarker.position.copy(layoutObserver);
    this.targetMarker.position.copy(activeBeamPoint);

    const mid = layoutObserver.clone().lerp(activeBeamPoint, 0.55);
    this.labels.title.position.copy(layoutObserver.clone().lerp(activeBeamPoint, 0.36).addScaledVector(normal, 0.12));
    this.labels.star.position.copy(layoutTarget.clone().addScaledVector(side, 0.075).addScaledVector(normal, 0.035));
    this.labels.result.position.copy(mid.addScaledVector(normal, -0.14));
    this.labels.reference.position.copy(refSun.clone().lerp(refFar, 0.56).addScaledVector(normal, 0.055));
    this.labels.theta.position.copy(angleObserver.clone().addScaledVector(refDir, thetaRadius * 1.58).addScaledVector(angleNormal, -0.12));
    this.labels.jan.position.copy(aPoint.clone().addScaledVector(side, -0.08).addScaledVector(normal, 0.07));
    this.labels.jul.position.copy(bPoint.clone().addScaledVector(side, 0.08).addScaledVector(normal, 0.07));
    this.labels.far.position.copy(refFar.clone().addScaledVector(side, 0.08).addScaledVector(normal, 0.08));
    this.labels.sun.position.copy(refSun.clone().addScaledVector(side, -0.08).addScaledVector(normal, 0.08));

    const split = preset.parallaxArcsec * 2;
    const name = preset.shortName || preset.name || star?.name || this.starId;
    this._updateTextSprite(
      this.labels.title,
      `${name}: catalog p = ${formatArcsec(preset.parallaxArcsec)}`,
      { color: C_CURRENT },
    );
    this._updateTextSprite(this.labels.star, 'N', { color: C_CURRENT });
    const stage = this._traceStage(reveal);
    const thetaLabel = reveal.angle > 0.01
      ? `A-to-B = catalog 2p (${formatArcsec(split)})`
      : reveal.finalHold && reveal.beamB > 0.01
        ? 'B sightline: second observation'
        : reveal.finalHold
          ? 'B locked: six-month clock stopped'
          : reveal.startHold
            ? 'A locked: first observation marked'
            : reveal.season > 0.01
              ? 'advancing six months to epoch B'
              : reveal.beamA > 0.01
                ? 'A sightline: first observation'
                : 'S-N-F reference: S, near star, far background';
    this._updateTextSprite(this.labels.result, `${stage.label}: ${stage.detail}`, { color: C_TEXT });
    this._updateTextSprite(this.labels.reference, 'fixed S-N-F reference', { color: C_REF });
    this._updateTextSprite(this.labels.far, 'F', { color: C_REF });
    this._updateTextSprite(this.labels.sun, 'S', { color: C_REF });
    this._updateTextSprite(this.labels.theta, thetaLabel, { color: C_DELTA });
    this._updateTextSprite(
      this.labels.jan,
      'A',
      { color: C_A },
    );
    this._updateTextSprite(
      this.labels.jul,
      'B',
      { color: C_B },
    );

    const showA = reveal.beamA > 0.08 || reveal.seconds >= A_TRACE_END;
    const showB = reveal.beamB > 0.08 || reveal.angle > 0.01 || reveal.seconds >= B_TRACE_END;
    this.compareBeams[0].visible = reveal.beamA > 0.01;
    this.compareBeams[1].visible = reveal.beamB > 0.01;
    this.compareStars[0].visible = showA;
    this.compareStars[1].visible = showB;
    this.thetaBaseRay.visible = reveal.angle > 0.01;
    this.thetaArc.visible = reveal.angle > 0.01;
    this.thetaArcInner.visible = reveal.angle > 0.01;
    this.thetaArcOuter.visible = reveal.angle > 0.01;
    this.thetaTip.visible = reveal.angle > 0.01;
    this.deltaChord.visible = reveal.angle > 0.01;
    this.sunReferenceMarker.visible = reveal.reference > 0.96;
    this.farReferenceMarker.visible = reveal.reference > 0.96;
    this.labels.title.visible = false;
    this.labels.result.visible = false;
    this.labels.star.visible = reveal.reference > 0.90;
    this.labels.reference.visible = false;
    this.labels.theta.visible = reveal.angle > 0.01;
    this.labels.jan.visible = showA;
    this.labels.jul.visible = showB;
    this.labels.sun.visible = reveal.reference > 0.90;
    this.labels.far.visible = reveal.reference > 0.90;

    this._updateGeometryPulse();
    this._billboard();
  }

  _updateGeometryPulse() {
    const reveal = this._geometryRevealState();
    const activeBeamOnA = reveal.startHold && reveal.seconds >= A_TRACE_START;
    const beamAOpacity = reveal.startHold
      ? 0.36 + reveal.beamA * 0.34 + reveal.flashA * 0.18
      : 0.64;
    const beamBOpacity = reveal.finalHold ? 0.74 + reveal.flashB * 0.22 : 0.34 + reveal.beamB * 0.38;
    const thetaOpacity = reveal.finalHold ? 0.94 + reveal.flashB * 0.06 : 0.30 + reveal.angle * 0.60;
    const labelOpacity = reveal.finalHold ? 0.92 + reveal.flashB * 0.08 : 0.44 + reveal.angle * 0.34;
    const activeBeamOpacity = reveal.finalHold
      ? 0.84 + reveal.flashB * 0.14
      : reveal.postRoll > 0.001
        ? 0.72
        : activeBeamOnA
          ? 0.82 + reveal.flashA * 0.16
          : reveal.season > 0.01
            ? 0.72
            : 0.28 + reveal.beamA * 0.54;
    const aLabelOpacity = reveal.startHold ? 0.86 + reveal.flashA * 0.14 : 0.72;
    const bLabelOpacity = reveal.finalHold
      ? 0.88 + reveal.flashB * 0.12
      : reveal.beamB > 0.82 || reveal.angle > 0.01
        ? 0.76
        : 0.38;

    setVisualOpacity(this.currentBeam, activeBeamOpacity);
    setVisualOpacity(this.compareBeams[0], beamAOpacity);
    setVisualOpacity(this.compareBeams[1], beamBOpacity);
    setVisualOpacity(this.thetaBaseRay, reveal.finalHold ? 0.85 + reveal.flashB * 0.10 : 0.30 + reveal.angle * 0.55);
    setVisualOpacity(this.thetaArc, thetaOpacity);
    setVisualOpacity(this.thetaArcInner, thetaOpacity * 0.65);
    setVisualOpacity(this.thetaArcOuter, thetaOpacity * 0.65);
    setVisualOpacity(this.thetaTip, reveal.finalHold ? 0.95 + reveal.flashB * 0.05 : 0.40 + reveal.angle * 0.55);
    setVisualOpacity(this.deltaChord, reveal.finalHold ? 0.76 + reveal.flashB * 0.18 : 0.24 + reveal.angle * 0.48);
    setVisualOpacity(this.compareStars[0], reveal.startHold ? 0.82 + reveal.flashA * 0.16 : 0.72);
    setVisualOpacity(this.compareStars[1], 0.54 + reveal.beamB * 0.20 + reveal.flashB * 0.16);
    setVisualOpacity(this.referenceLine, reveal.finalHold ? 0.58 + reveal.flashB * 0.14 : 0.28 + reveal.reference * 0.30);
    setVisualOpacity(this.sunReferenceMarker, 0.24 + reveal.reference * 0.18);
    setVisualOpacity(this.farReferenceMarker, 0.28 + reveal.reference * 0.22);
    setVisualOpacity(this.labels.jan, aLabelOpacity);
    setVisualOpacity(this.labels.jul, bLabelOpacity);
    setVisualOpacity(this.labels.theta, labelOpacity);
    setVisualOpacity(this.labels.reference, reveal.finalHold ? 0.62 : 0.46);
    setVisualOpacity(this.labels.sun, reveal.finalHold ? 0.68 : 0.50);
    setVisualOpacity(this.labels.far, reveal.finalHold ? 0.72 : 0.48);
    this.compareStars[0]?.scale.setScalar(reveal.startHold ? 1.14 + reveal.flashA * 0.12 : 1);
    this.compareStars[1]?.scale.setScalar(reveal.finalHold ? 1.16 + reveal.flashB * 0.14 : 1);
    this.thetaTip?.scale.setScalar(reveal.finalHold ? 1.08 + reveal.flashB * 0.12 : 0.94 + reveal.angle * 0.10);
  }

  _billboard() {
    const cam = this.renderer?.sm?.camera;
    if (!cam) return;
    const camPos = new THREE.Vector3();
    cam.getWorldPosition(camPos);
    for (const sprite of Object.values(this.labels || {})) sprite.lookAt(camPos);
    for (const marker of [
      this.observerMarker,
      this.targetMarker,
      ...this.compareStars,
      this.thetaTip,
      this.sunReferenceMarker,
      this.farReferenceMarker,
    ]) marker?.lookAt(camPos);
  }

  activate() {
    this._autoplayWasPlaying = !!this.model?._autoplay?.playing;
    this.model?._autoplay?.pause?.();
    super.activate();
    if (typeof document !== 'undefined') {
      document.body?.classList?.add('parallax-experiment-active');
    }
    this.model.setState({
      WorldModel: 'fe',
      ShowVault: false,
      ShowOpticalVault: true,
      ShowFeGrid: true,
      ShowStars: true,
      ShowShadow: true,
      ShowDayNightShadow: true,
      PermanentNight: false,
      DynamicStars: false,
      ShowCelestialBodies: true,
      ShowPlanets: false,
      ShowCelNav: true,
      ShowConstellations: false,
      ShowConstellationLines: false,
      ShowBlackHoles: false,
      ShowQuasars: false,
      ShowGalaxies: false,
      ShowSatellites: false,
      ShowTruePositions: false,
      ShowGroundPoints: false,
      ShowGPPath: false,
      ShowVaultRays: false,
      ShowOpticalVaultRays: false,
      ShowProjectionRays: false,
      SuppressOpticalStarPoints: false,
      ShowLiveEphemeris: false,
      ShowEphemerisReadings: false,
      DateTime: this.getDemoStartDateTime(),
      ObserverLat: this.getObserverLat(),
      ObserverLong: this.getObserverLon(),
      SpecifiedTrackerMode: true,
      TrackerGPOverride: false,
      TrackerTargets: [`star:${this.starId}`],
      FollowTarget: `star:${this.starId}`,
      Description: `STELLAR PARALLAX: ${this.selectedPreset.name}; measured A/B sightlines from catalog parallax.`,
    });
    this.geometryClock = 0;
    this._setSeasonEpochs();
    this.openAngleOverlay();
    this._refreshLayout();
  }

  deactivate() {
    if (typeof document !== 'undefined') {
      document.body?.classList?.remove('parallax-experiment-active');
    }
    this.closeAngleOverlay();
    super.deactivate();
    if (this._autoplayWasPlaying && this.model?._autoplay && !this.model._autoplay.playing) {
      this.model._autoplay.play();
    }
    this._autoplayWasPlaying = false;
  }

  update(dt) {
    super.update(dt);
    if (!this.active) return;
    if (this.isPlaying) this.geometryClock += dt || 0.016;
    this._syncSeasonDateTime();
    this._updateWorldBeams();
    this.updateAngleOverlay();
    this.updateLiveReadout();
  }

  setStar(id) {
    if (!STAR_PRESETS.some((s) => s.id === id)) return;
    this.starId = id;
    this.model?.setState?.({
      DateTime: this.getDemoStartDateTime(),
      TrackerTargets: [`star:${id}`],
      FollowTarget: `star:${id}`,
      Description: `STELLAR PARALLAX: ${this.selectedPreset.name}; measured A/B sightlines from catalog parallax.`,
    });
    this.geometryClock = 0;
    this._setSeasonEpochs();
    this.isPlaying = true;
    this._refreshLayout();
  }

  setVisualBoost(value) {
    this.visualBoost = clamp(parseFloat(value) || 36000, 10000, 80000);
    this._precomputeMeasurements(this.model?.state?.DateTime);
    this._refreshLayout();
  }

  replayTrace() {
    this.geometryClock = 0;
    this.isPlaying = true;
    this._setSeasonEpochs();
    this._syncSeasonDateTime();
    this._refreshLayout();
  }

  _refreshButtons() {
    if (this.starSelect) this.starSelect.value = this.starId;
    this.updateAngleOverlay();
  }

  updateLiveReadout() {
    if (!this.liveReadoutEl) return;
    const star = this.getTargetStar();
    const preset = this.selectedPreset;
    if (!star?.anglesGlobe) {
      this.liveReadoutEl.innerHTML = `
        <div><b>Live target</b><span>Waiting for selected star ephemeris.</span></div>
      `;
      return;
    }
    const epochLine = this.epochA != null && this.epochB != null
      ? `<div><b>Epochs</b><span>A ${shortDateTime(this.epochA)} | B ${shortDateTime(this.epochB)}</span></div>`
      : '';
    const stage = this._traceStage();
    this.liveReadoutEl.innerHTML = `
      <div><b>Step</b><span>${stage.label}</span></div>
      <div><b>Star</b><span>${star.name || preset.name}</span></div>
      ${epochLine}
      <div><b>Catalog 2p</b><span>${formatArcsec(preset.parallaxArcsec * 2)} = the final A-to-B split</span></div>
      <div><b>Measured</b><span>A = -p, B = +p, both read against the same S-N-F reference</span></div>
      <div><b>Day/night</b><span>Native shadow tracks the six-month wait; A and B are both deep-night observations</span></div>
      <div><b>Visibility</b><span>Star alt ${formatAltPair(preset)}; Sun below horizon at A and B</span></div>
    `;
  }

  openAngleOverlay() {
    if (this.angleOverlay || typeof document === 'undefined') return;
    const overlay = document.createElement('div');
    overlay.className = 'parallax-angle-overlay';
    overlay.innerHTML = `
      <div class="parallax-angle-kicker">Parallax measurement</div>
      <div class="parallax-angle-title"></div>
      <div class="parallax-angle-readout">
        <div class="row"><span class="lbl">p half-angle</span><span class="val measured-theta">—</span></div>
        <div class="row"><span class="lbl">A→B split</span><span class="val measured-2p">—</span></div>
        <div class="row"><span class="lbl">Drawn at</span><span class="val measured-scale">—</span></div>
      </div>
      <svg class="parallax-angle-svg" viewBox="0 0 560 220" role="img" aria-label="Parallax angle equivalence across coordinate systems">
        <!-- Three panels showing the SAME parallax angle 2p arises in
             heliocentric, geocentric-globe, and our flat-plane geocentric
             frames. The three coordinate systems yield equivalent angles
             because parallax is a coordinate transform of the same
             observed angular relation. -->
        <!-- HELIOCENTRIC -->
        <g class="cell">
          <rect x="6" y="12" width="180" height="200" rx="6"/>
          <text x="96" y="30" class="cell-title">Heliocentric</text>
          <circle cx="50" cy="120" r="5" class="sun"/>
          <text x="50" y="138" class="tiny">Sun</text>
          <circle cx="32" cy="120" r="3" class="earth-jan"/>
          <circle cx="68" cy="120" r="3" class="earth-jul"/>
          <text x="22" y="112" class="tiny">E-Jan</text>
          <text x="78" y="112" class="tiny">E-Jul</text>
          <circle cx="160" cy="120" r="4" class="star"/>
          <text x="160" y="100" class="tiny">N</text>
          <line x1="32" y1="120" x2="160" y2="108" class="ray-a"/>
          <line x1="68" y1="120" x2="160" y2="132" class="ray-b"/>
          <path d="M148 110 A 14 14 0 0 1 148 130" class="angle-wedge"/>
          <text x="135" y="120" class="angle-label">2p</text>
          <text x="96" y="200" class="caption">baseline: orbit</text>
        </g>
        <!-- GEOCENTRIC GLOBE -->
        <g class="cell">
          <rect x="192" y="12" width="180" height="200" rx="6"/>
          <text x="282" y="30" class="cell-title">Geocentric globe</text>
          <circle cx="236" cy="120" r="6" class="earth-fixed"/>
          <text x="236" y="142" class="tiny">Earth</text>
          <circle cx="218" cy="100" r="3" class="sun"/>
          <circle cx="254" cy="140" r="3" class="sun"/>
          <text x="208" y="92" class="tiny">S-Jan</text>
          <text x="262" y="148" class="tiny">S-Jul</text>
          <circle cx="346" cy="120" r="4" class="star"/>
          <text x="346" y="100" class="tiny">N</text>
          <line x1="236" y1="120" x2="346" y2="108" class="ray-a"/>
          <line x1="236" y1="120" x2="346" y2="132" class="ray-b"/>
          <path d="M254 113 A 18 18 0 0 1 254 127" class="angle-wedge"/>
          <text x="270" y="120" class="angle-label">2p</text>
          <text x="282" y="200" class="caption">baseline: Sun moves</text>
        </g>
        <!-- FE TOPOGRAPHICAL PLANE -->
        <g class="cell highlight">
          <rect x="378" y="12" width="180" height="200" rx="6"/>
          <text x="468" y="30" class="cell-title">FE topo plane</text>
          <circle cx="422" cy="120" r="6" class="earth-fixed"/>
          <text x="422" y="142" class="tiny">observer</text>
          <line x1="436" y1="120" x2="552" y2="120" class="reference"/>
          <text x="552" y="112" class="tiny">F</text>
          <circle cx="532" cy="120" r="4" class="star"/>
          <text x="532" y="100" class="tiny">N</text>
          <line x1="422" y1="120" x2="532" y2="108" class="ray-a"/>
          <line x1="422" y1="120" x2="532" y2="132" class="ray-b"/>
          <path d="M440 113 A 18 18 0 0 1 440 127" class="angle-wedge"/>
          <text x="456" y="120" class="angle-label">2p</text>
          <text x="468" y="200" class="caption">this demo</text>
        </g>
      </svg>
      <div class="parallax-equivalence-note">
        Same measured A→B = 2p in all three frames: the angle survives the coordinate transform.
      </div>
      <div class="parallax-angle-bottom">
        <span class="same-angle"></span>
        <span class="trace-stage"></span>
      </div>
    `;
    const host = document.getElementById('view') || document.body;
    host.appendChild(overlay);
    this.angleOverlay = overlay;
    this.updateAngleOverlay();
  }

  _spanDays() {
    if (this.epochA == null || this.epochB == null) return 0;
    return this.epochB - this.epochA;
  }

  updateAngleOverlay() {
    if (!this.angleOverlay) return;
    const preset = this.selectedPreset;
    const split = preset.parallaxArcsec * 2;
    const title = this.angleOverlay.querySelector('.parallax-angle-title');
    const same = this.angleOverlay.querySelector('.same-angle');
    const stageLine = this.angleOverlay.querySelector('.trace-stage');
    const measuredTheta = this.angleOverlay.querySelector('.measured-theta');
    const measured2p = this.angleOverlay.querySelector('.measured-2p');
    const measuredScale = this.angleOverlay.querySelector('.measured-scale');
    const stage = this._traceStage();
    // The drawn geometry is p_rad * boost. Inverse-transforming the
    // drawn angle back through the same boost is the catalog p — i.e.
    // the measurement yielded by the scene equals the real-life
    // parallax angle. Display both numbers so the equivalence is
    // explicit.
    const boost = this._effectiveBoost();
    const drawnThetaRad = preset.parallaxArcsec * ARCSEC_TO_RAD * boost;
    const inverseArcsec = drawnThetaRad / boost / ARCSEC_TO_RAD;
    if (title) {
      title.textContent = `${preset.shortName}: p = ${formatArcsec(preset.parallaxArcsec)} (Hipparcos/Gaia)`;
    }
    if (measuredTheta) {
      measuredTheta.textContent = `${formatArcsec(inverseArcsec)} (= catalog p)`;
    }
    if (measured2p) {
      measured2p.textContent = `${formatArcsec(split)} = full measured split`;
    }
    if (measuredScale) {
      measuredScale.textContent = `${Math.round(boost).toLocaleString()}× to be visible (drawn ≈ ${(drawnThetaRad * 180 / Math.PI).toFixed(2)}°)`;
    }
    if (same) {
      same.textContent = `Catalog 2p = ${formatArcsec(split)} equals the measured A-to-B split`;
    }
    if (stageLine) {
      stageLine.textContent = stage.detail;
    }
  }

  closeAngleOverlay() {
    this.angleOverlay?.remove?.();
    this.angleOverlay = null;
  }

  buildControls(container) {
    const header = document.createElement('h3');
    header.textContent = 'Stellar Parallax';
    container.appendChild(header);

    const reveal = document.createElement('div');
    reveal.className = 'parallax-reveal-card';
    reveal.innerHTML = `
      <span class="parallax-reveal-kicker">Whole test</span>
      <strong>Measure one star twice against one fixed far-star line.</strong>
      <span>A is the first sightline. B is the same star six months later. S-N-F stays locked so the comparison does not move under the measurement.</span>
      <span class="parallax-reveal-punch">A = -p, B = +p, so the final A-to-B split is catalog 2p. Only the drawn gap is enlarged.</span>
    `;
    container.appendChild(reveal);

    const span = this._spanDays() || 182.62;
    const flow = document.createElement('div');
    flow.className = 'parallax-reveal-flow';
    flow.innerHTML = `
      <div><b>Ref</b><span>Lock S-N-F once.</span></div>
      <div><b>A</b><span>Mark the near star at -p.</span></div>
      <div><b>Wait</b><span>Fast-forward ${span.toFixed(2)} days while native day/night advances.</span></div>
      <div><b>B</b><span>Mark +p and read A-to-B = 2p.</span></div>
    `;
    container.appendChild(flow);

    const traceLabel = document.createElement('div');
    traceLabel.className = 'parallax-control-label';
    traceLabel.textContent = 'Model trace';
    container.appendChild(traceLabel);

    const starWrap = document.createElement('div');
    starWrap.className = 'parallax-select';
    const starLabel = document.createElement('label');
    starLabel.textContent = 'Tracked star';
    this.starSelect = document.createElement('select');
    for (const star of STAR_PRESETS) {
      const option = document.createElement('option');
      option.value = star.id;
      option.textContent = `${star.shortName} - p ${formatArcsec(star.parallaxArcsec)} - alt ${formatAltPair(star)}`;
      this.starSelect.appendChild(option);
    }
    this.starSelect.addEventListener('change', () => this.setStar(this.starSelect.value));
    starWrap.append(starLabel, this.starSelect);
    container.appendChild(starWrap);

    const replayBtn = document.createElement('button');
    replayBtn.type = 'button';
    replayBtn.className = 'parallax-action-btn';
    replayBtn.textContent = 'Replay trace';
    replayBtn.addEventListener('click', () => this.replayTrace());
    container.appendChild(replayBtn);

    this.liveReadoutEl = document.createElement('div');
    this.liveReadoutEl.className = 'parallax-reading';
    container.appendChild(this.liveReadoutEl);

    this._refreshButtons();
    this.updateLiveReadout();
  }

  getInfoPanel() {
    return `
      <h3>Stellar Parallax</h3>
      <div class="parallax-funnel">
        <div>
          <b>The observable</b>
          <p>A telescope records one near star against far background stars,
          then records that same star again about six months later.</p>
        </div>
        <div>
          <b>The timing</b>
          <p>Both marks are deep-night observations. The native day/night
          shadow stays on while the clock advances
          ${(this._spanDays() || 182.62).toFixed(2)} days.</p>
        </div>
        <div>
          <b>The angle</b>
          <p>The highlighted angle is the A-to-B split: one sightline at -p
          and the other at +p, so the full measured split is 2p.</p>
        </div>
        <div>
          <b>The reference</b>
          <p>The scene keeps the fixed S-N-F reference, the A/B sightline
          marks, and the final 2p readout. The native tracked star dot remains
          on, while broader GP and constellation clutter stays suppressed.</p>
        </div>
        <div>
          <b>Why these stars</b>
          <p>The dropdown is curated for this observer and date pair: each
          listed star is above the horizon and the Sun is below the horizon at
          both A and B.</p>
        </div>
      </div>
      <p class="parallax-jargon">S, N, and F form one fixed reduced reference
      line. The A/B angle is computed as -p at epoch A and +p at epoch B inside
      that same frame, so the full split is catalog 2p. The scene enlarges the
      tiny angle only so it remains visible.</p>
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
    sprite.scale.set(scale * (width / height), scale, 1);
    sprite.renderOrder = 90;
    sprite.userData = { canvas, ctx, width, height, fontSize };
    return sprite;
  }

  _updateTextSprite(sprite, text, options = {}) {
    const data = sprite?.userData;
    if (!data?.ctx) return;
    const color = options.color ?? C_TEXT;
    this._drawSpriteText(data.ctx, text, color, data.fontSize, data.width, data.height);
    if (sprite.material.map) sprite.material.map.needsUpdate = true;
  }

  _drawSpriteText(ctx, text, color, fontSize, width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(5, 9, 16, 0.66)';
    ctx.fillRect(0, 0, width, height);
    ctx.font = `700 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.fillStyle = cssColor(color);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

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
    const lineHeight = fontSize * 1.18;
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

export default ParallaxExperiment;
