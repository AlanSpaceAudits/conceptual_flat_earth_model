// Airy's Failure (1871) - immersive Greenwich/Eltanin line-of-sight demo.
//
// Modeled directly on the slide deck:
//   1. Stationary aether + stationary telescope - no tilt.
//   2. Stationary aether + moving telescope (heliocentric):
//      tilt = 5 deg in air, must grow to 10 deg with water to keep
//      catching the photon as the column sweeps through space.
//   3. Moving aether carrying starlight + stationary telescope
//      (geocentric): 5 deg tilt with or without water.
//   4. Greenwich data: only 0.8" spring/autumn difference, not
//      Klinkerfues's predicted 30".
//
// The visualization aims at the observer's optical Eltanin coordinate: the
// star Airy could place on the eyepiece crosshair. The red ghost path shows
// the moving-Earth/water expectation that Airy did not observe.

import * as THREE from 'three';
import { BaseExperiment } from '../baseExperiment.js';

const ARCSEC_TO_RAD = Math.PI / (180 * 3600);
const ANG_AIR_ARCSEC   = 20.5;
const ANG_WATER_ARCSEC = 27.3;
const ANG_DELTA_ARCSEC = ANG_WATER_ARCSEC - ANG_AIR_ARCSEC; // 6.8"
const KLINKERFUES_DISAGREE_ARCSEC = 30;
const GREENWICH_DIFF_ARCSEC = 0.8;
const OBSERVED_RESIDUAL_RATIO = GREENWICH_DIFF_ARCSEC / KLINKERFUES_DISAGREE_ARCSEC;

// Schematic tilts (Bennett uses 5 deg / 10 deg for legibility - real
// aberration is arcseconds; we exaggerate for the diagram and label
// the true arcseconds.)
const TILT_AIR_DEG   = 5;
const TILT_WATER_DEG = 10;
const TILT_AIR_RAD   = TILT_AIR_DEG  * Math.PI / 180;
const TILT_WATER_RAD = TILT_WATER_DEG * Math.PI / 180;

const AIRY_TARGET_ID      = 'star:eltanin';
const AIRY_TARGET_STAR_ID = 'eltanin';
const AIRY_TARGET_NAME    = 'gamma Draconis / Eltanin';
const AIRY_SITE_LAT       = 51 + 28 / 60 + 34.4 / 3600;
const AIRY_SITE_LON       = 0;
const AIRY_TRANSIT_UTC    = '1871-02-28 07:22:50 UTC';

const C_TUBE      = 0xdcecff;
const C_WATER     = 0x63b8ff;
const C_RAY       = 0xfff3c6;
const C_AETHER    = 0xff8d6a;
const C_OBSERVED  = 0x42ffd0;
const C_PREDICTED = 0xff5a54;
const C_AMBER     = 0xf4a640;
const C_GROUND    = 0x88a0b8;
const C_GHOST     = 0xff5a54;

function cssColor(hex) { return `#${hex.toString(16).padStart(6, '0')}`; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function lineMaterial(color, opacity = 1, dashed = false) {
  return dashed
    ? new THREE.LineDashedMaterial({
        color, transparent: opacity < 1, opacity,
        dashSize: 0.04, gapSize: 0.03,
      })
    : new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
}

function makeLine(points, color, opacity = 1, dashed = false) {
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geo, lineMaterial(color, opacity, dashed));
  if (dashed) line.computeLineDistances();
  return line;
}

function makeWorldLine(color, opacity = 1, dashed = false) {
  const line = makeLine([new THREE.Vector3(), new THREE.Vector3()], color, opacity, dashed);
  line.material.depthTest = false;
  line.material.depthWrite = false;
  line.renderOrder = 88;
  return line;
}

function setLinePoints(line, points) {
  if (!line) return;
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry().setFromPoints(points);
  line.computeLineDistances?.();
}

function makeArrow(from, to, color, opacity = 1, headSize = 0.07) {
  const group = new THREE.Group();
  group.add(makeLine([from, to], color, opacity));
  const ang = Math.atan2(to.y - from.y, to.x - from.x);
  const left = new THREE.Vector3(
    to.x - Math.cos(ang - 0.55) * headSize,
    to.y - Math.sin(ang - 0.55) * headSize,
    to.z,
  );
  const right = new THREE.Vector3(
    to.x - Math.cos(ang + 0.55) * headSize,
    to.y - Math.sin(ang + 0.55) * headSize,
    to.z,
  );
  group.add(makeLine([left, to, right], color, opacity));
  return group;
}

export class AiryFailureExperiment extends BaseExperiment {
  static get id() { return 'airy-failure'; }
  static get name() { return "Airy's Failure (1871)"; }
  static get category() { return 'aether'; }
  static get description() {
    return 'Stationary Earth with carried aether predicts no water-driven miss; Airy saw only a tiny residual.';
  }

  init() {
    this.experimentScale = 1;
    this.followObserver = false;
    this.mode = 'compare';      // stationary | helio | geo | compare
    this.waterFilled = true;
    this.textures = [];
    this.eyepieceOverlay = null;
    this.liveReadoutEl = null;
    this.modeButtons = null;
    this.waterToggle = null;
    this.labels = {};

    this._buildVisualization();
  }

  // ---------------------------------------------------------------------------
  // Historical setup - same as before so URL state and presets keep working.
  // ---------------------------------------------------------------------------

  getHistoricalSetup() {
    return {
      state: {
        ObserverLat: AIRY_SITE_LAT,
        ObserverLong: AIRY_SITE_LON,
        TimezoneOffsetMinutes: 0,
        DateTime: AiryFailureExperiment.utcDateTime(1871, 2, 28, 7, 22, 50),
        BodySource: 'vsop87',
        StarfieldType: 'celnav',
        StarTrepidation: true,
        ShowStars: true,
        ShowCelNav: true,
        ShowTruePositions: true,
        ShowOpticalVault: true,
        ShowLiveEphemeris: true,
        ShowEphemerisReadings: true,
        SpecifiedTrackerMode: true,
        TrackerGPOverride: true,
        TrackerTargets: [AIRY_TARGET_ID],
        FollowTarget: AIRY_TARGET_ID,
        FreeCameraMode: false,
        FreeCamActive: false,
        InsideVault: false,
        CameraDirection: -38,
        CameraHeight: 26,
        CameraDistance: 10,
        Zoom: 4.9,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Scene construction
  // ---------------------------------------------------------------------------

  _buildVisualization() {
    this.visualGroup.name = 'Airy visible Eltanin line of sight';
    this.visualGroup.position.set(0, 0, 0);
    this.visualGroup.scale.setScalar(1);

    this.observedBeam = makeWorldLine(C_OBSERVED, 0.95);
    this.expectedBeam = makeWorldLine(C_GHOST, 0.85, true);
    this.expectedBeam.material.dashSize = 0.025;
    this.expectedBeam.material.gapSize = 0.018;
    this.visualGroup.add(this.observedBeam, this.expectedBeam);

    this.observedTube = this._makeTubeLines(C_OBSERVED, 0.95);
    this.expectedTube = this._makeTubeLines(C_GHOST, 0.82, true);
    this.visualGroup.add(this.observedTube.group, this.expectedTube.group);

    this.starHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.018, 0.024, 48),
      new THREE.MeshBasicMaterial({
        color: C_AMBER, transparent: true, opacity: 0.85,
        depthTest: false, depthWrite: false, side: THREE.DoubleSide,
      }),
    );
    this.starHalo.renderOrder = 91;
    this.visualGroup.add(this.starHalo);

    // No freestanding velocity arrows in the immersive scene. The comparison
    // is carried by the observed/predicted sightlines and eyepiece marks.
    this.earthArrow = null;
    this.aetherArrow = null;

    this.labels.context = this._makeTextSprite('Airy aims at visible Eltanin', {
      color: C_AMBER, scale: 0.042, width: 900, fontSize: 30,
    });
    this.labels.observed = this._makeTextSprite('Observed: Eltanin remains on the crosshair', {
      color: C_OBSERVED, scale: 0.036, width: 900, fontSize: 28,
    });
    this.labels.expected = this._makeTextSprite('Moving Earth prediction: adding water requires new aim', {
      color: C_PREDICTED, scale: 0.036, width: 900, fontSize: 28,
    });
    this.labels.result = this._makeTextSprite(`Airy table: observed ${GREENWICH_DIFF_ARCSEC.toFixed(1)}" split, not ${KLINKERFUES_DISAGREE_ARCSEC}"`, {
      color: C_AMBER, scale: 0.038, width: 900, fontSize: 30,
    });
    this.labels.star = this._makeTextSprite('Visible Eltanin', {
      color: C_AMBER, scale: 0.032, width: 260, height: 64, fontSize: 28,
    });
    for (const label of Object.values(this.labels)) this.visualGroup.add(label);

    this._refreshLayout();
  }

  // Build a single scene group: telescope + light path + labels.
  // 'kind' is 'stationary' | 'helio' | 'geo'.
  _buildScene(kind) {
    const g = new THREE.Group();
    g.name = `airy-scene-${kind}`;
    g.userData = { kind };

    // ------------------- ground line + aether-frame label -------------------
    g.add(makeLine([
      new THREE.Vector3(-0.55, -0.42, 0),
      new THREE.Vector3( 0.55, -0.42, 0),
    ], C_GROUND, 0.55));

    // Scene title - stays inside the scene so layout stays compact.
    const titleText = ({
      stationary: 'Stationary aether + stationary scope',
      helio:      'Aether stationary, telescope moves',
      geo:        'Aether moves, telescope stationary',
    })[kind];
    const titleColor = ({
      stationary: 0xc4cbd7,
      helio: C_PREDICTED,
      geo: C_OBSERVED,
    })[kind];
    const sceneTitle = this._makeTextSprite(titleText, {
      color: titleColor, scale: 0.05, width: 760, fontSize: 26,
    });
    sceneTitle.position.set(0, 0.5, 0.01);
    g.add(sceneTitle);

    // ------------------- telescope group (tilts) -------------------
    const tilt = new THREE.Group();
    tilt.name = `tilt-${kind}`;
    tilt.position.set(0, -0.42, 0); // pivot at base
    g.userData.tilt = tilt;
    g.add(tilt);

    const tube = this._makeTelescopeOutline();
    tube.userData.role = 'tube';
    tilt.add(tube);
    g.userData.tube = tube;

    // Wheels for moving-Earth scene only.
    if (kind === 'helio') {
      const wheels = this._makeWheels();
      tilt.add(wheels);
      g.userData.wheels = wheels;
    }

    // Water column (initially hidden - toggled by setWaterFilled).
    const water = this._makeWaterColumn();
    water.visible = false;
    tilt.add(water);
    g.userData.water = water;

    // Tilt angle label that hovers next to the tube.
    const tiltLabel = this._makeTextSprite('5 deg', {
      color: C_AMBER, scale: 0.052, width: 220, fontSize: 30, height: 80,
    });
    tiltLabel.position.set(-0.32, 0.18, 0.01);
    g.add(tiltLabel);
    g.userData.tiltLabel = tiltLabel;

    // ------------------- starlight ray -------------------
    // For stationary and helio scenes the light comes straight down.
    // For geo scene the light rides the aether wind in at the same
    // angle the telescope is tilted - so it slides into the scope
    // from the side without re-tilting.
    const ray = makeLine([
      new THREE.Vector3(0, 0.95, -0.002),
      new THREE.Vector3(0, -0.42, -0.002),
    ], C_RAY, 0.85, true);
    g.add(ray);
    g.userData.ray = ray;

    // Star dot.
    const star = this._makeStar();
    star.position.set(0, 0.95, 0.01);
    g.add(star);
    g.userData.star = star;

    const starLabel = this._makeTextSprite('Eltanin', {
      color: 0xffd9aa, scale: 0.04, width: 200, fontSize: 22, height: 64,
    });
    starLabel.position.set(0.16, 0.95, 0.01);
    g.add(starLabel);

    // ------------------- ground/aether arrows -------------------
    if (kind === 'helio') {
      // "Earth moves ->" arrow under the wheels.
      const arrow = makeArrow(
        new THREE.Vector3(-0.18, -0.55, 0),
        new THREE.Vector3( 0.32, -0.55, 0),
        C_PREDICTED, 0.95, 0.07,
      );
      g.add(arrow);
      const lab = this._makeTextSprite('Earth velocity', {
        color: C_PREDICTED, scale: 0.045, width: 320, fontSize: 24, height: 64,
      });
      lab.position.set(0.07, -0.65, 0.01);
      g.add(lab);
    } else if (kind === 'geo') {
      // "Aether wind <-" arrow above the scope, sweeping starlight in.
      const arrow = makeArrow(
        new THREE.Vector3( 0.5, 0.78, 0),
        new THREE.Vector3(-0.05, 0.78, 0),
        C_AETHER, 0.95, 0.07,
      );
      g.add(arrow);
      const lab = this._makeTextSprite('Aether carries starlight', {
        color: C_AETHER, scale: 0.05, width: 480, fontSize: 26, height: 64,
      });
      lab.position.set(0.18, 0.66, 0.01);
      g.add(lab);
    }

    // ------------------- per-scene caption (bottom) -------------------
    const captionText = ({
      stationary: 'No motion - no aberration. Reference baseline.',
      helio:      'With water: tilt MUST grow 5deg -> 10deg.',
      geo:        'With water: tilt unchanged at 5deg.',
    })[kind];
    const captionColor = ({
      stationary: 0xb8c0cc,
      helio: C_PREDICTED,
      geo: C_OBSERVED,
    })[kind];
    const caption = this._makeTextSprite(captionText, {
      color: captionColor, scale: 0.05, width: 760, fontSize: 25, height: 72,
    });
    caption.position.set(0, -0.56, 0.01);
    g.add(caption);
    g.userData.caption = caption;
    g.userData.captionTexts = {
      airText: ({
        stationary: 'No motion - no aberration. Reference baseline.',
        helio: 'Air: 5deg tilt to catch the photon (20.5").',
        geo:   'Air: 5deg tilt - aether wind delivers starlight (20.5").',
      })[kind],
      waterText: ({
        stationary: `Water adds only a tiny ${GREENWICH_DIFF_ARCSEC.toFixed(1)}" residual.`,
        helio: `Water: must tilt 10deg = 27.3" (predicted +${ANG_DELTA_ARCSEC.toFixed(1)}").`,
        geo:   `Water: still centered; residual only ${GREENWICH_DIFF_ARCSEC.toFixed(1)}".`,
      })[kind],
    };

    return g;
  }

  _makeTelescopeOutline() {
    const W = 0.07;
    const H = 0.84;
    const points = [
      new THREE.Vector3(-W, 0,    0),
      new THREE.Vector3(-W, H,    0),
      new THREE.Vector3( W, H,    0),
      new THREE.Vector3( W, 0,    0),
      new THREE.Vector3(-W, 0,    0),
    ];
    const tube = makeLine(points, C_TUBE, 0.96);
    // Eyepiece bar at base.
    const cap = makeLine([
      new THREE.Vector3(-W * 1.5, 0,     0),
      new THREE.Vector3(-W * 1.5, -0.07, 0),
      new THREE.Vector3( W * 1.5, -0.07, 0),
      new THREE.Vector3( W * 1.5, 0,     0),
    ], C_TUBE, 0.96);
    const grp = new THREE.Group();
    grp.add(tube);
    grp.add(cap);
    return grp;
  }

  _makeWaterColumn() {
    const W = 0.066;
    const H = 0.78;
    const fill = new THREE.Mesh(
      new THREE.PlaneGeometry(W * 2, H),
      new THREE.MeshBasicMaterial({
        color: C_WATER, transparent: true, opacity: 0.32,
        side: THREE.DoubleSide, depthWrite: false,
      }),
    );
    fill.position.set(0, 0.02 + H / 2, -0.001);
    const meniscus = makeLine([
      new THREE.Vector3(-W, H + 0.02, 0),
      new THREE.Vector3( W, H + 0.02, 0),
    ], C_WATER, 0.85);
    const g = new THREE.Group();
    g.add(fill);
    g.add(meniscus);
    return g;
  }

  _makeWheels() {
    const g = new THREE.Group();
    const r = 0.04;
    for (const x of [-0.1, 0.1]) {
      const ring = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2;
            return new THREE.Vector3(
              x + Math.cos(a) * r,
              -0.07 - r + Math.sin(a) * r,
              0,
            );
          }),
        ),
        new THREE.LineBasicMaterial({ color: 0xb8c0cc }),
      );
      g.add(ring);
    }
    return g;
  }

  _makeStar() {
    const g = new THREE.Group();
    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.045, 24),
      new THREE.MeshBasicMaterial({ color: 0xff5a54 }),
    );
    g.add(dot);
    const halo = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 32 }, (_, i) => {
          const a = (i / 32) * Math.PI * 2;
          return new THREE.Vector3(
            Math.cos(a) * 0.07, Math.sin(a) * 0.07, 0,
          );
        }),
      ),
      new THREE.LineBasicMaterial({
        color: 0xffaa9c, transparent: true, opacity: 0.55,
      }),
    );
    g.add(halo);
    return g;
  }

  _makeTubeLines(color, opacity = 1, dashed = false) {
    const group = new THREE.Group();
    const lines = {
      left: makeWorldLine(color, opacity, dashed),
      right: makeWorldLine(color, opacity, dashed),
      top: makeWorldLine(color, opacity, dashed),
      base: makeWorldLine(color, opacity, dashed),
      axis: makeWorldLine(color, Math.min(1, opacity + 0.05), dashed),
      water: makeWorldLine(C_WATER, 0.8),
    };
    lines.water.material.opacity = 0.7;
    for (const line of Object.values(lines)) group.add(line);
    return { group, lines };
  }

  _vecFromArray(v) {
    return new THREE.Vector3(v?.[0] || 0, v?.[1] || 0, v?.[2] || 0);
  }

  _getObserverWorld() {
    const obs = this.model.computed.ObserverFeCoord;
    return obs ? this._vecFromArray(obs) : new THREE.Vector3();
  }

  _getAimWorld() {
    const star = this.getTargetStar();
    const coord = star?.opticalVaultCoord
      || star?.globeOpticalVaultCoord
      || star?.vaultCoord
      || star?.globeVaultCoord;
    return coord ? this._vecFromArray(coord) : null;
  }

  _rayBasis(obs, star) {
    const axis = star.clone().sub(obs);
    if (axis.lengthSq() < 1e-8) axis.set(0, 0, 1);
    axis.normalize();

    const worldUp = new THREE.Vector3(0, 0, 1);
    let side = new THREE.Vector3().crossVectors(axis, worldUp);
    if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
    side.normalize();

    const normal = new THREE.Vector3().crossVectors(side, axis).normalize();
    return { axis, side, normal };
  }

  _updateTube(tube, base, dir, side, length, width, waterOn) {
    const top = base.clone().addScaledVector(dir, length);
    const leftBase = base.clone().addScaledVector(side, -width);
    const rightBase = base.clone().addScaledVector(side, width);
    const leftTop = top.clone().addScaledVector(side, -width);
    const rightTop = top.clone().addScaledVector(side, width);
    const waterStart = base.clone().addScaledVector(dir, length * 0.08);
    const waterEnd = base.clone().addScaledVector(dir, length * 0.92);

    setLinePoints(tube.lines.left, [leftBase, leftTop]);
    setLinePoints(tube.lines.right, [rightBase, rightTop]);
    setLinePoints(tube.lines.top, [leftTop, rightTop]);
    setLinePoints(tube.lines.base, [leftBase, rightBase]);
    setLinePoints(tube.lines.axis, [base, top]);
    setLinePoints(tube.lines.water, [waterStart, waterEnd]);
    tube.lines.water.visible = waterOn;
  }

  _billboardSprites() {
    const cam = this.renderer?.sm?.camera;
    if (!cam) return;
    const camPos = new THREE.Vector3();
    cam.getWorldPosition(camPos);
    for (const sprite of Object.values(this.labels || {})) {
      sprite.lookAt(camPos);
    }
    this.starHalo?.lookAt(camPos);
  }

  // ---------------------------------------------------------------------------
  // Layout: one visible line of sight plus optional red moving-Earth ghost.
  // ---------------------------------------------------------------------------

  _refreshLayout() {
    this._updateWorldRay();
    this._updateEyepieceOverlay();
  }

  _updateWorldRay() {
    const star = this._getAimWorld();
    const obs = this._getObserverWorld();
    if (!star) {
      this.visualGroup.visible = false;
      return;
    }
    this.visualGroup.visible = true;
    this.visualGroup.position.set(0, 0, 0);
    this.visualGroup.scale.setScalar(1);

    const { axis, side, normal } = this._rayBasis(obs, star);
    const dist = Math.max(0.2, obs.distanceTo(star));
    const tubeLen = clamp(dist * 0.18, 0.18, 0.32);
    const tubeWidth = 0.012;
    const base = obs.clone().addScaledVector(axis, 0.018);
    const exa = 1.0;
    const waterSplit = this.waterFilled ? (TILT_WATER_RAD - TILT_AIR_RAD) * exa : 0;
    const observedSplit = this.waterFilled ? waterSplit * OBSERVED_RESIDUAL_RATIO : 0;
    const observedDir = axis.clone().applyAxisAngle(normal, -observedSplit);
    const observedAim = base.clone().addScaledVector(observedDir, dist);
    const observedTop = base.clone().addScaledVector(observedDir, tubeLen);

    setLinePoints(this.observedBeam, [base, observedAim]);
    this._updateTube(this.observedTube, base, observedDir, side, tubeLen, tubeWidth, this.waterFilled);

    const expectedDir = axis.clone().applyAxisAngle(normal, -waterSplit);
    const expectedAim = base.clone().addScaledVector(expectedDir, dist);
    const expectedTop = base.clone().addScaledVector(expectedDir, tubeLen);
    const showExpected = (this.mode === 'helio' || this.mode === 'compare') && this.waterFilled;
    const showObserved = this.mode !== 'helio' || !this.waterFilled || this.mode === 'compare';

    setLinePoints(this.expectedBeam, [base, expectedAim]);
    this._updateTube(this.expectedTube, base, expectedDir, side, tubeLen, tubeWidth, this.waterFilled);
    this.expectedBeam.visible = showExpected;
    this.expectedTube.group.visible = showExpected;
    this.observedBeam.visible = showObserved || this.mode === 'helio';
    this.observedTube.group.visible = showObserved || this.mode === 'helio';

    this.starHalo.position.copy(star);
    this.starHalo.visible = true;

    if (this.earthArrow) this.earthArrow.visible = false;
    if (this.aetherArrow) this.aetherArrow.visible = false;

    const contextPos = obs.clone().lerp(star, 0.62).addScaledVector(normal, 0.06);
    const observedPos = observedTop.clone().addScaledVector(normal, 0.05).addScaledVector(side, -0.07);
    const expectedPos = expectedTop.clone().addScaledVector(normal, -0.055).addScaledVector(side, 0.08);
    const resultPos = base.clone().addScaledVector(normal, -0.14).addScaledVector(side, 0.13);
    const starLabelPos = star.clone().addScaledVector(side, 0.045).addScaledVector(axis, -0.025);

    this.labels.context.position.copy(contextPos);
    this.labels.observed.position.copy(observedPos);
    this.labels.expected.position.copy(expectedPos);
    this.labels.result.position.copy(resultPos);
    this.labels.star.position.copy(starLabelPos);

    this._updateTextSprite(this.labels.observed, this.waterFilled
      ? `Observed: tiny ${GREENWICH_DIFF_ARCSEC.toFixed(1)}" residual, still on the crosshair`
      : `Air baseline: ${TILT_AIR_DEG} deg (${ANG_AIR_ARCSEC.toFixed(1)}")`, { color: C_OBSERVED });
    this._updateTextSprite(this.labels.expected, this.waterFilled
      ? `Moving Earth prediction: new ${TILT_WATER_DEG} deg aim required`
      : `Air: moving-Earth and observed paths coincide`, { color: C_PREDICTED });
    this._updateTextSprite(this.labels.result,
      `Airy success here: tiny ${GREENWICH_DIFF_ARCSEC.toFixed(1)}" residual, not ${KLINKERFUES_DISAGREE_ARCSEC}"`,
      { color: C_AMBER });

    this.labels.expected.visible = this.mode === 'helio' || this.mode === 'compare';
    this.labels.observed.visible = this.mode === 'geo' || this.mode === 'compare' || this.mode === 'stationary';
    this.labels.result.visible = this.waterFilled;
    this.labels.context.visible = true;
    this.labels.star.visible = true;

    this._billboardSprites();
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  activate() {
    super.activate();
    if (typeof document !== 'undefined') {
      document.body?.classList?.add('airy-experiment-active');
    }
    this.model.setState({
      WorldModel: 'fe',
      ShowVault: false,
      ShowOpticalVault: true,
      ShowFeGrid: true,
      ShowStars: true,
      ShowCelNav: true,
      ShowTruePositions: true,
      Description: `AIRY WATER TELESCOPE: Greenwich, ${AIRY_TRANSIT_UTC}; ${AIRY_TARGET_NAME} at transit.`,
    });
    this.waterFilled = true;
    this.mode = 'compare';
    this._refreshLayout();
    this.updateLiveReadout();
    this.openEyepiece();
  }

  deactivate() {
    if (typeof document !== 'undefined') {
      document.body?.classList?.remove('airy-experiment-active');
    }
    this.closeEyepiece();
    super.deactivate();
  }

  update(dt) {
    super.update(dt);
    if (!this.active) return;
    this._updateWorldRay();
    this.updateLiveReadout();
  }

  // ---------------------------------------------------------------------------
  // Mode + water setters
  // ---------------------------------------------------------------------------

  setMode(mode) {
    if (!['stationary', 'helio', 'geo', 'compare'].includes(mode)) return;
    this.mode = mode;
    this._refreshLayout();
    this._refreshButtons();
  }

  setWaterFilled(on) {
    this.waterFilled = !!on;
    this._refreshLayout();
    this._refreshButtons();
  }

  _refreshButtons() {
    if (this.modeButtons) {
      for (const [m, btn] of this.modeButtons) {
        const active = m === this.mode;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
    }
    if (this.waterToggle) {
      this.waterToggle.dataset.state = this.waterFilled ? 'on' : 'off';
      this.waterToggle.textContent = `Add water to telescope: ${this.waterFilled ? 'ON' : 'OFF'}`;
    }
  }

  // ---------------------------------------------------------------------------
  // Side panel UI
  // ---------------------------------------------------------------------------

  buildControls(container) {
    const header = document.createElement('h3');
    header.textContent = "Airy's Failure";
    container.appendChild(header);

    const reveal = document.createElement('div');
    reveal.className = 'airy-reveal-card';
    reveal.innerHTML = `
      <span class="airy-reveal-kicker">Airy's question</span>
      <strong>Does adding water to a moving telescope make the eyepiece lose the star?</strong>
      <span>Airy put visible Eltanin on the eyepiece crosshair. If Earth is
      carrying the telescope sideways through a fixed aether, replacing air
      with water should require a new tilt.</span>
      <span class="airy-reveal-punch">It did not move off-center. In the stationary-Earth model that is the prediction: only ${GREENWICH_DIFF_ARCSEC.toFixed(1)}" residual versus ${KLINKERFUES_DISAGREE_ARCSEC}" predicted.</span>
    `;
    container.appendChild(reveal);

    const flow = document.createElement('div');
    flow.className = 'airy-reveal-flow';
    flow.innerHTML = `
      <div><b>1. Air</b><span>Visible Eltanin is placed on the eyepiece crosshair.</span></div>
      <div><b>2. Water</b><span>Moving Earth predicts the same tilt should now miss clearly.</span></div>
      <div><b>3. Result</b><span>Stationary-Earth success: null, not zero; ${GREENWICH_DIFF_ARCSEC.toFixed(1)}" residual, not ${KLINKERFUES_DISAGREE_ARCSEC}".</span></div>
    `;
    container.appendChild(flow);

    // Mode buttons
    const modeLabel = document.createElement('div');
    modeLabel.className = 'airy-control-label';
    modeLabel.textContent = 'Choose the view';
    container.appendChild(modeLabel);

    const modeWrap = document.createElement('div');
    modeWrap.className = 'airy-mode-buttons four';
    this.modeButtons = new Map();
    for (const [mode, label] of [
      ['stationary', 'Air baseline'],
      ['helio',      'Moving Earth'],
      ['geo',        'Stationary Earth'],
      ['compare',    'Compare'],
    ]) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'airy-mode-btn';
      btn.textContent = label;
      btn.addEventListener('click', () => this.setMode(mode));
      modeWrap.appendChild(btn);
      this.modeButtons.set(mode, btn);
    }
    container.appendChild(modeWrap);

    // Water toggle - the killer interactive control.
    const water = document.createElement('button');
    water.type = 'button';
    water.className = 'airy-water-toggle';
    water.textContent = 'Add water to telescope: ON';
    water.dataset.state = 'on';
    water.addEventListener('click', () => this.setWaterFilled(!this.waterFilled));
    container.appendChild(water);
    this.waterToggle = water;

    // Action row: eyepiece + reset.
    const actions = document.createElement('div');
    actions.className = 'airy-actions';
    const eyeBtn = document.createElement('button');
    eyeBtn.type = 'button';
    eyeBtn.className = 'experiment-btn airy-action-btn';
    eyeBtn.textContent = 'Look Through Eyepiece';
    eyeBtn.addEventListener('click', () => this.toggleEyepiece());
    actions.appendChild(eyeBtn);

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'experiment-btn airy-action-btn';
    playBtn.textContent = this.isPlaying ? 'Pause' : 'Play';
    playBtn.addEventListener('click', () => {
      const playing = this.togglePlay();
      playBtn.textContent = playing ? 'Pause' : 'Play';
    });
    actions.appendChild(playBtn);
    container.appendChild(actions);

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'experiment-btn airy-reset-btn';
    resetBtn.textContent = 'Reset Greenwich 1871';
    resetBtn.addEventListener('click', () => {
      this.applyActivationPatch();
      this.positionAtObserver();
      this.setWaterFilled(true);
      this.setMode('compare');
      this.updateLiveReadout();
    });
    container.appendChild(resetBtn);

    // Reading card.
    const reading = document.createElement('div');
    reading.className = 'airy-reading';
    reading.innerHTML = `
      <div><b>Setup</b><span>Air telescope: Eltanin on the crosshair.</span></div>
      <div><b>Prediction</b><span>Moving Earth + water: old aim should miss; new aim ${TILT_WATER_DEG} deg / ${ANG_WATER_ARCSEC.toFixed(1)}".</span></div>
      <div><b>Observed</b><span>Still centered: same ${TILT_AIR_DEG} deg / ${ANG_AIR_ARCSEC.toFixed(1)}" aim, with only ${GREENWICH_DIFF_ARCSEC.toFixed(1)}" residual.</span></div>
      <div><b>Reading</b><span>Stationary telescope plus carried starlight predicts Airy's failure directly.</span></div>
    `;
    container.appendChild(reading);

    const site = document.createElement('div');
    site.className = 'airy-site-card';
    site.innerHTML = `
      <b>Historical preset</b>
      <span>Royal Observatory Greenwich, South Grounds</span>
      <span>${AIRY_TRANSIT_UTC}</span>
      <span>${AIRY_TARGET_NAME}</span>
    `;
    container.appendChild(site);

    this.liveReadoutEl = document.createElement('div');
    this.liveReadoutEl.className = 'airy-live-readout';
    container.appendChild(this.liveReadoutEl);
    this.updateLiveReadout();

    this._refreshButtons();
  }

  getInfoPanel() {
    return `
      <h3>Airy's Water Check</h3>
      <div class="airy-funnel">
        <div>
          <b>Setup</b>
          <p>The Greenwich telescope places visible Eltanin on the eyepiece
          crosshair.</p>
        </div>
        <div>
          <b>Prediction</b>
          <p>If the telescope is moving sideways through a fixed aether,
          water should make that same aim miss.</p>
        </div>
        <div>
          <b>Result</b>
          <p>Eltanin stayed on the crosshair. A tiny residual remains in the
          historical numbers, but the predicted water shift did not appear.</p>
        </div>
      </div>
      <div class="info-result-summary airy-outcome-grid">
        <div class="result-fail">
          <strong>Moving-Earth expectation</strong>
          <p>Off-crosshair unless re-tilted to ${TILT_WATER_DEG} deg / ${ANG_WATER_ARCSEC.toFixed(1)}"; about ${KLINKERFUES_DISAGREE_ARCSEC}" spring/autumn separation.</p>
        </div>
        <div class="result-success">
          <strong>Stationary-Earth prediction met</strong>
          <p>Still on-crosshair at ${TILT_AIR_DEG} deg / ${ANG_AIR_ARCSEC.toFixed(1)}"; measured residual only ${GREENWICH_DIFF_ARCSEC.toFixed(1)}".</p>
        </div>
      </div>
      <h4>How to read the scene</h4>
      <ul class="airy-legend-list">
        <li><strong>Green:</strong> Airy's observed position: a tiny residual shift that remains practically on the crosshair.</li>
        <li><strong>Red:</strong> moving-Earth prediction. With air it overlaps; with water it separates.</li>
        <li><strong>Toggle water:</strong> the prediction moves off-crosshair; the observation only nudges within the center mark.</li>
      </ul>
      <p class="airy-jargon">In a fixed-aether moving-Earth frame, water
      demands a new aim. In the geocentric/stationary-earth reading, the
      telescope remains stationary with respect to the carrying aether, so
      adding water does not create the predicted off-crosshair shift. Airy's
      "failure" is therefore the successful prediction of this model.</p>
    `;
  }

  // ---------------------------------------------------------------------------
  // Live readout for the active target
  // ---------------------------------------------------------------------------

  getTargetStar() {
    return this.model.computed.CelNavStars?.find((s) => s.id === AIRY_TARGET_STAR_ID) || null;
  }

  updateLiveReadout() {
    if (!this.liveReadoutEl) return;
    const star = this.getTargetStar();
    if (!star?.anglesGlobe) {
      this.liveReadoutEl.textContent = 'Live target: waiting for ephemeris.';
      return;
    }
    const az = ((star.anglesGlobe.azimuth % 360) + 360) % 360;
    const el = star.anglesGlobe.elevation;
    const raHours = (((star.ra * 12 / Math.PI) % 24) + 24) % 24;
    const decDeg = star.dec * 180 / Math.PI;
    this.liveReadoutEl.innerHTML = `
      <b>Live target</b>
      <span>Alt ${el.toFixed(3)} deg &middot; Az ${az.toFixed(3)} deg</span>
      <span>RA ${raHours.toFixed(3)} h &middot; Dec ${decDeg.toFixed(3)} deg</span>
    `;
  }

  // ---------------------------------------------------------------------------
  // Eyepiece HTML/SVG overlay - kept lightweight and slide-friendly
  // ---------------------------------------------------------------------------

  toggleEyepiece() {
    if (this.eyepieceOverlay) this.closeEyepiece();
    else this.openEyepiece();
  }

  openEyepiece() {
    if (this.eyepieceOverlay || typeof document === 'undefined') return;
    const overlay = document.createElement('div');
    overlay.className = 'airy-eyepiece-overlay';
    overlay.innerHTML = `
      <button class="airy-eyepiece-close" type="button" aria-label="Close eyepiece view">x</button>
      <div class="airy-eyepiece-title">Eyepiece Crosshair Test</div>
      <svg class="airy-eyepiece-svg" viewBox="0 0 320 320" role="img" aria-label="Observed and predicted reticle positions">
        <defs>
          <radialGradient id="airyFieldGlow" cx="50%" cy="50%" r="52%">
            <stop offset="0%" stop-color="#14293a"/>
            <stop offset="62%" stop-color="#07131d"/>
            <stop offset="100%" stop-color="#010305"/>
          </radialGradient>
        </defs>
        <circle cx="160" cy="160" r="144" fill="url(#airyFieldGlow)" stroke="#7fb8da" stroke-width="2"/>
        <circle cx="160" cy="160" r="104" fill="none" stroke="#476f8a" stroke-width="1"/>
        <circle cx="160" cy="160" r="58"  fill="none" stroke="#476f8a" stroke-width="1"/>
        <line x1="34"  y1="160" x2="286" y2="160" stroke="#9fc7de" stroke-width="1" opacity="0.62"/>
        <line x1="160" y1="34"  x2="160" y2="286" stroke="#9fc7de" stroke-width="1" opacity="0.62"/>
        <circle class="airy-observed-residual" cx="160" cy="160" r="12" fill="none" stroke="#42ffd0" stroke-width="2" opacity="0.42"/>
        <circle class="airy-observed-dot" cx="160" cy="160" r="8" fill="#42ffd0"/>
        <g class="airy-expected-mark" stroke="#ff5a54" stroke-width="4" stroke-linecap="round">
          <line x1="-11" y1="-11" x2="11"  y2="11"/>
          <line x1="-11" y1="11"  x2="11"  y2="-11"/>
        </g>
      </svg>
      <div class="airy-eyepiece-legend">
        <span class="observed">Observed: null within a tiny residual</span>
        <span class="expected">Moving Earth + water: predicted off-crosshair</span>
      </div>
      <div class="airy-eyepiece-note">Moving Earth says water should push the star off the crosshair. The stationary-Earth prediction is the observed null with only a tiny residual.</div>
    `;
    overlay.querySelector('.airy-eyepiece-close')?.addEventListener('click', () => this.closeEyepiece());
    const host = document.getElementById('view') || document.body;
    host.appendChild(overlay);
    this.eyepieceOverlay = overlay;
    this._updateEyepieceOverlay();
  }

  closeEyepiece() {
    if (!this.eyepieceOverlay) return;
    this.eyepieceOverlay.remove();
    this.eyepieceOverlay = null;
  }

  _updateEyepieceOverlay() {
    if (!this.eyepieceOverlay) return;
    const expected = this.eyepieceOverlay.querySelector('.airy-expected-mark');
    const observed = this.eyepieceOverlay.querySelector('.airy-observed-dot');
    const residual = this.eyepieceOverlay.querySelector('.airy-observed-residual');
    const note = this.eyepieceOverlay.querySelector('.airy-eyepiece-note');
    const predictedOffset = this.waterFilled ? 82 : 0;
    if (expected) expected.setAttribute('transform', `translate(${160 + predictedOffset} 160)`);
    if (observed) observed.setAttribute('cx', '160');
    if (residual) residual.setAttribute('r', this.waterFilled ? '12' : '8');
    if (note) {
      note.textContent = this.waterFilled
        ? `Water on - red is the schematic moving-Earth miss; green stays centered. The ${GREENWICH_DIFF_ARCSEC.toFixed(1)}" residual is too small to treat as an opposite-direction eyepiece shift.`
        : `Water off - red overlaps the crosshair. Add water to expose the predicted shift.`;
    }
    // Show observed dot for stationary/geo/compare; show predicted mark
    // for helio (and compare).
    const showObserved = this.mode !== 'helio';
    const showPredicted = this.mode === 'helio' || this.mode === 'compare';
    this.eyepieceOverlay.classList.toggle('show-observed', showObserved);
    this.eyepieceOverlay.classList.toggle('show-expected', showPredicted);
  }

  // ---------------------------------------------------------------------------
  // Text sprite helpers (lightweight - canvas textures shared via cache)
  // ---------------------------------------------------------------------------

  _makeTextSprite(text, options = {}) {
    const width   = options.width   || 512;
    const height  = options.height  || 96;
    const fontSize = options.fontSize || 28;
    const color   = options.color   ?? C_AMBER;
    const canvas  = document.createElement('canvas');
    canvas.width  = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    this._drawSpriteText(ctx, text, color, fontSize, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    this.textures.push(texture);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture, transparent: true, depthWrite: false, depthTest: false,
    }));
    const scale = options.scale || 0.1;
    sprite.scale.set(scale * (width / height), scale, 1);
    sprite.renderOrder = 90;
    sprite.userData = { canvas, ctx, width, height, fontSize };
    return sprite;
  }

  _updateTextSprite(sprite, text, options = {}) {
    const data = sprite.userData;
    if (!data?.ctx) return;
    const color = options.color ?? C_AMBER;
    this._drawSpriteText(data.ctx, text, color, data.fontSize, data.width, data.height);
    if (sprite.material.map) sprite.material.map.needsUpdate = true;
  }

  _drawSpriteText(ctx, text, color, fontSize, width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(5, 9, 16, 0.62)';
    ctx.fillRect(0, 0, width, height);
    ctx.font = `700 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.fillStyle = cssColor(color);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2 + 1, width - 16);
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  dispose() {
    this.closeEyepiece();
    for (const tex of this.textures) tex.dispose?.();
    this.textures = [];
    super.dispose();
  }
}

export default AiryFailureExperiment;
