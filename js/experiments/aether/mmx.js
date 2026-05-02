// Michelson-Morley Experiment
// Lightweight reveal: predicted moving-Earth fringe shift vs observed null.

import * as THREE from 'three';
import { BaseExperiment } from '../baseExperiment.js';

const SITE = {
  lat: 41.504,
  lon: -81.608,
  label: 'Adelbert Dormitory basement, Cleveland',
  window: 'July 8-12, 1887',
  session: 'July 8, 1887 noon session',
};

const EXPECTED_FRINGE = 0.40;
const OBSERVED_DISPLACEMENT_RATIO = 1 / 20;
const VELOCITY_LIMIT_RATIO = 1 / 6;
const ARM_LENGTH_M = 11;
const ORBITAL_SPEED_KMS = 30;
const READING_COUNT = 16;
const READING_STEP_DEG = 360 / READING_COUNT;
const READING_HOLD_SECONDS = 1.65;
const READING_PIVOT_SECONDS = 0.55;
const READING_STEP_SECONDS = READING_HOLD_SECONDS + READING_PIVOT_SECONDS;
const WIND_DIRECTION_RAD = 0;
const OBSERVATION_UTC = [1887, 7, 8, 17, 0, 0];
const OBSERVED_LIMIT_FRINGE = EXPECTED_FRINGE * OBSERVED_DISPLACEMENT_RATIO;
const VELOCITY_LIMIT_KMS = ORBITAL_SPEED_KMS * VELOCITY_LIMIT_RATIO;

const C = {
  table: 0x29313d,
  tableEdge: 0x5f6f86,
  beamA: 0xffaa33,
  beamB: 0x42d9ff,
  observed: 0x42ffd0,
  expected: 0xff6b5f,
  amber: 0xf4a640,
  glass: 0x9fc9ff,
  white: 0xe8eef8,
};

function makeLine(points, color, opacity = 1, width = 1) {
  const geom = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    linewidth: width,
    depthTest: false,
    depthWrite: false,
  });
  const line = new THREE.Line(geom, mat);
  line.frustumCulled = false;
  line.renderOrder = 50;
  return line;
}

function makeDisc(radius, color, opacity = 1) {
  const geom = new THREE.CircleGeometry(radius, 96);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.renderOrder = 30;
  return mesh;
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawSpriteText(ctx, text, color, width, height, baseFontSize = 42) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(5, 9, 16, 0.84)';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(220, 236, 255, 0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';

  const maxWidth = width - 42;
  let fontSize = baseFontSize;
  let lines = [];
  let lineHeight = fontSize * 1.14;
  while (fontSize >= 28) {
    ctx.font = `800 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
    lines = wrapCanvasText(ctx, text, maxWidth);
    lineHeight = fontSize * 1.14;
    if (lines.length * lineHeight <= height - 22) break;
    fontSize -= 2;
  }

  ctx.font = `800 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.lineWidth = Math.max(6, fontSize * 0.15);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.62)';
  ctx.shadowBlur = 7;
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    const y = startY + i * lineHeight + 1;
    ctx.strokeText(line, width / 2, y, maxWidth);
    ctx.fillText(line, width / 2, y, maxWidth);
  });
}

function makeTextSprite(text, color = '#ffffff', width = 760, height = 150, fontSize = 42, spriteHeight = 0.16) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawSpriteText(ctx, text, color, width, height, fontSize);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  }));
  sprite.scale.set(spriteHeight * (width / height), spriteHeight, 1);
  sprite.renderOrder = 88;
  sprite.userData = { canvas, ctx, width, height, fontSize };
  return sprite;
}

function setSpriteText(sprite, text, color = '#ffffff') {
  const texture = sprite?.material?.map;
  const data = sprite?.userData || {};
  const canvas = data.canvas || texture?.image;
  if (!canvas) return;
  const ctx = data.ctx || canvas.getContext('2d');
  drawSpriteText(ctx, text, color, data.width || canvas.width, data.height || canvas.height, data.fontSize || 42);
  texture.needsUpdate = true;
}

function rounded(n, digits = 2) {
  return Number(n).toFixed(digits);
}

function angleDeg(rad) {
  const deg = THREE.MathUtils.radToDeg(rad) % 360;
  return deg < 0 ? deg + 360 : deg;
}

export class MMXExperiment extends BaseExperiment {
  static get id() { return 'mmx'; }
  static get name() { return 'Michelson-Morley (1887)'; }
  static get category() { return 'aether'; }
  static get description() { return 'Sixteen MMX readings compare the orbital-wind fringe prediction to the observed null.'; }

  init() {
    this.experimentScale = 0.105;
    this.followObserver = true;
    this.mode = 'compare';
    this.autoReadings = true;
    this.readingIndex = 0;
    this.procedureTime = 0;
    this.pivoting = false;
    this.turnPosition = 0;
    this.turnAngle = 0;
    this.fringeOverlay = null;
    this.modeButtons = new Map();
    this.liveEl = null;
    this.nextButton = null;
    this.localAetherFlow = null;
    this.readingMarks = [];
    this.experimentDateTime = this.observationDateTime();
    this.wasAutoplayPlaying = null;
    this.buildVisualization();
  }

  observationDateTime() {
    return this.constructor.utcDateTime(...OBSERVATION_UTC);
  }

  getHistoricalSetup() {
    return {
      state: {
        WorldModel: 'fe',
        DateTime: this.observationDateTime(),
        ObserverLat: SITE.lat,
        ObserverLong: SITE.lon,
        ShowVault: false,
        ShowOpticalVault: false,
        ShowFeGrid: true,
        ShowStars: false,
        ShowCelNav: false,
        ShowTruePositions: false,
        ShowGroundPoints: false,
        PermanentNight: false,
        CameraHeight: 52,
        CameraDistance: 4.6,
        Zoom: 4.6,
        Description: `MMX 1887: ${SITE.label}; ${SITE.session}.`,
      },
    };
  }

  buildVisualization() {
    this.scene = new THREE.Group();
    this.scene.name = 'mmx-lightweight-reveal';

    this.windGroup = this.createWindLayer();
    this.scene.add(this.windGroup);

    this.localAetherGroup = this.createLocalAetherLayer();
    this.scene.add(this.localAetherGroup);

    this.readingMarksGroup = this.createReadingMarks();
    this.scene.add(this.readingMarksGroup);

    this.turntable = new THREE.Group();
    this.turntable.name = 'mmx-rotating-interferometer';
    this.scene.add(this.turntable);

    const base = makeDisc(1.18, C.table, 0.94);
    base.position.z = 0.01;
    this.turntable.add(base);

    const edge = new THREE.Mesh(
      new THREE.RingGeometry(1.17, 1.20, 96),
      new THREE.MeshBasicMaterial({
        color: C.tableEdge,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
      }),
    );
    edge.position.z = 0.014;
    edge.renderOrder = 31;
    this.turntable.add(edge);

    this.turntable.add(makeLine([
      new THREE.Vector3(-1.0, 0, 0.035),
      new THREE.Vector3(1.0, 0, 0.035),
    ], C.beamA, 0.85));
    this.turntable.add(makeLine([
      new THREE.Vector3(0, -1.0, 0.038),
      new THREE.Vector3(0, 1.0, 0.038),
    ], C.beamB, 0.85));

    const center = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.14, 0.07),
      new THREE.MeshBasicMaterial({
        color: C.glass,
        transparent: true,
        opacity: 0.76,
        depthTest: false,
        depthWrite: false,
      }),
    );
    center.position.z = 0.08;
    center.rotation.z = Math.PI / 4;
    center.renderOrder = 60;
    this.turntable.add(center);

    this.addMirror(1.0, 0, 0);
    this.addMirror(-1.0, 0, Math.PI);
    this.addMirror(0, 1.0, Math.PI / 2);
    this.addMirror(0, -1.0, -Math.PI / 2);

    this.beamA = this.createBeamPulse(C.beamA);
    this.beamB = this.createBeamPulse(C.beamB);
    this.turntable.add(this.beamA);
    this.turntable.add(this.beamB);

    this.delayGhost = makeLine([
      new THREE.Vector3(0.0, -0.06, 0.075),
      new THREE.Vector3(0.42, -0.06, 0.075),
    ], C.expected, 0.9);
    this.turntable.add(this.delayGhost);

    this.statusLabel = makeTextSprite('16 reading marks: compare prediction to centered fringes', '#f4a640', 820, 170, 42, 0.30);
    this.statusLabel.position.set(-1.88, 0.02, 1.0);
    this.scene.add(this.statusLabel);
  }

  createWindLayer() {
    const group = new THREE.Group();
    group.name = 'mmx-orbital-wind-prediction';
    const y = 0.0;
    const z = 0.16;
    group.add(makeLine([
      new THREE.Vector3(-1.45, y, z),
      new THREE.Vector3(1.45, y, z),
    ], C.expected, 0.62));

    const head = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.18, 16),
      new THREE.MeshBasicMaterial({
        color: C.expected,
        transparent: true,
        opacity: 0.74,
        depthTest: false,
        depthWrite: false,
      }),
    );
    head.position.set(1.50, y, z);
    head.rotation.z = -Math.PI / 2;
    head.renderOrder = 61;
    group.add(head);

    this.windDashes = [];
    for (let i = 0; i < 7; i++) {
      const dash = makeLine([
        new THREE.Vector3(-0.09, 0, 0),
        new THREE.Vector3(0.09, 0, 0),
      ], C.expected, 0.48);
      dash.position.set(-1.2 + i * 0.4, -0.15, z + 0.015);
      group.add(dash);
      this.windDashes.push(dash);
    }

    const label = makeTextSprite('Moving Earth incorrectly predicts fringe shift corresponding to alleged 30 km/s', '#ff9086', 780, 190, 38, 0.27);
    label.position.set(-1.43, -0.82, 0.84);
    group.add(label);
    return group;
  }

  createLocalAetherLayer() {
    const group = new THREE.Group();
    group.name = 'mmx-dynamic-local-aether';

    const ringPts = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(a) * 1.55, Math.sin(a) * 1.55, 0.11));
    }
    group.add(makeLine(ringPts, C.observed, 0.22));

    const flow = new THREE.Group();
    flow.name = 'mmx-local-aether-flow';
    group.add(flow);
    this.localAetherFlow = flow;
    this.localAetherDashes = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = 1.55;
      const dash = makeLine([
        new THREE.Vector3(-0.055, 0, 0),
        new THREE.Vector3(0.055, 0, 0),
      ], C.observed, 0.42);
      dash.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.12);
      dash.rotation.z = a + Math.PI / 2;
      flow.add(dash);
      this.localAetherDashes.push(dash);
    }

    const label = makeTextSprite('Observed null: no orbital headwind', '#42ffd0', 660, 150, 40, 0.27);
    label.position.set(-1.43, 0.45, 0.84);
    group.add(label);
    return group;
  }

  createReadingMarks() {
    const group = new THREE.Group();
    group.name = 'mmx-sixteen-reading-marks';
    this.readingMarks = [];
    for (let i = 0; i < READING_COUNT; i++) {
      const a = THREE.MathUtils.degToRad(i * READING_STEP_DEG);
      const mark = makeDisc(i % 4 === 0 ? 0.035 : 0.025, C.amber, i === 0 ? 0.95 : 0.34);
      mark.position.set(Math.cos(a) * 1.32, Math.sin(a) * 1.32, 0.07);
      mark.renderOrder = 65;
      group.add(mark);
      this.readingMarks.push(mark);
    }
    return group;
  }

  addMirror(x, y, rotation) {
    const mirror = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.22, 0.11),
      new THREE.MeshBasicMaterial({
        color: C.white,
        transparent: true,
        opacity: 0.92,
        depthTest: false,
        depthWrite: false,
      }),
    );
    mirror.position.set(x, y, 0.09);
    mirror.rotation.z = rotation;
    mirror.renderOrder = 62;
    this.turntable.add(mirror);
  }

  createBeamPulse(color) {
    const group = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 16, 16),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.95,
        depthTest: false,
        depthWrite: false,
      }),
    );
    core.renderOrder = 80;
    group.add(core);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 16, 16),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.24,
        depthTest: false,
        depthWrite: false,
      }),
    );
    glow.renderOrder = 79;
    group.add(glow);
    group.position.z = 0.105;
    return group;
  }

  activate() {
    super.activate();
    this.wasAutoplayPlaying = !!this.model?._autoplay?.playing;
    this.model?._autoplay?.pause?.();
    this.freezeHistoricalClock();
    if (typeof document !== 'undefined') {
      document.body?.classList?.add('mmx-experiment-active');
    }
    while (this.visualGroup.children.length) {
      this.visualGroup.remove(this.visualGroup.children[0]);
    }
    this.visualGroup.add(this.scene);
    this.mode = 'compare';
    this.autoReadings = true;
    this.readingIndex = 0;
    this.procedureTime = 0;
    this.pivoting = false;
    this.turnPosition = 0;
    this.turnAngle = 0;
    this.openFringeOverlay();
    this.updateReadingMarks();
    this.refreshLayout();
    this.updateLiveReadout();
  }

  deactivate() {
    if (typeof document !== 'undefined') {
      document.body?.classList?.remove('mmx-experiment-active');
    }
    this.closeFringeOverlay();
    super.deactivate();
    if (this.wasAutoplayPlaying) {
      this.model?._autoplay?.play?.();
    }
    this.wasAutoplayPlaying = null;
  }

  update(dt) {
    super.update(dt);
    if (!this.active) return;
    this.freezeHistoricalClock();
    const t = this.animationTime;

    if (this.autoReadings && this.isPlaying) {
      this.advanceProcedure(dt);
    }

    this.turnAngle = this.tableAngle();
    this.turntable.rotation.z = this.turnAngle;
    if (this.localAetherFlow && this.isPlaying) {
      this.localAetherFlow.rotation.z -= dt * 0.18;
    }

    const pulse = (t * 0.55) % 1;
    const armPos = this.pathPulse(pulse);
    this.beamA.position.set(armPos, 0, 0.105);
    this.beamB.position.set(0, armPos, 0.108);

    const expected = this.currentExpectedShift();
    this.delayGhost.visible = this.mode === 'prediction' || this.mode === 'compare';
    this.delayGhost.scale.x = 0.35 + Math.abs(expected) * 1.8;
    this.delayGhost.position.x = expected > 0 ? 0.18 : -0.18;

    for (let i = 0; i < this.windDashes.length; i++) {
      const x = -1.45 + (((t * 0.35 + i * 0.18) % 1) * 2.9);
      this.windDashes[i].position.x = x;
      this.windDashes[i].material.opacity = this.mode === 'observed' ? 0.16 : 0.48;
    }

    this.windGroup.visible = this.mode === 'prediction' || this.mode === 'compare';
    this.localAetherGroup.visible = this.mode === 'observed' || this.mode === 'stationary' || this.mode === 'compare';
    this.updateReadingMarks();
    this.refreshLayout();
    this.updateLiveReadout();
  }

  freezeHistoricalClock() {
    if (!this.model?.state) return;
    const current = this.model.state.DateTime;
    if (Math.abs((current ?? 0) - this.experimentDateTime) > 1e-8) {
      this.model.setState({ DateTime: this.experimentDateTime }, false);
    }
  }

  advanceProcedure(dt) {
    this.procedureTime += dt;
    while (this.procedureTime >= READING_STEP_SECONDS) {
      this.procedureTime -= READING_STEP_SECONDS;
      this.readingIndex = (this.readingIndex + 1) % READING_COUNT;
    }

    const nextIndex = (this.readingIndex + 1) % READING_COUNT;
    if (this.procedureTime < READING_HOLD_SECONDS) {
      this.pivoting = false;
      this.turnPosition = this.readingIndex;
      return;
    }

    this.pivoting = true;
    const raw = (this.procedureTime - READING_HOLD_SECONDS) / READING_PIVOT_SECONDS;
    const eased = this.easeInOutCubic(Math.min(1, Math.max(0, raw)));
    const target = nextIndex === 0 ? READING_COUNT : nextIndex;
    this.turnPosition = (this.readingIndex + (target - this.readingIndex) * eased) % READING_COUNT;
  }

  pathPulse(p) {
    if (p < 0.5) return p * 2;
    return 1 - (p - 0.5) * 2;
  }

  currentExpectedShift() {
    if (this.mode === 'observed' || this.mode === 'stationary') return 0;
    return this.predictedOrbitalShift(this.turnAngle);
  }

  predictedOrbitalShift(angle) {
    // A Michelson interferometer gives a two-lobed signal during a full turn:
    // after 90 degrees the arms have swapped roles, so the predicted offset reverses.
    return (EXPECTED_FRINGE / 2) * Math.cos(2 * (angle - WIND_DIRECTION_RAD));
  }

  tableAngle() {
    return THREE.MathUtils.degToRad(this.turnPosition * READING_STEP_DEG);
  }

  advanceReading(step = 1) {
    const currentMark = this.readingIndex;
    const nextMark = (currentMark + step + READING_COUNT) % READING_COUNT;
    this.procedureTime = 0;
    this.pivoting = false;
    this.turnPosition = nextMark;
    this.readingIndex = nextMark;
    this.turnAngle = this.tableAngle();
    if (this.turntable) {
      this.turntable.rotation.z = this.turnAngle;
    }
    this.refreshLayout();
    this.updateLiveReadout();
  }

  updateReadingMarks() {
    if (!this.readingMarks) return;
    for (let i = 0; i < this.readingMarks.length; i++) {
      const mark = this.readingMarks[i];
      const active = i === this.readingIndex;
      const target = this.pivoting && i === ((this.readingIndex + 1) % READING_COUNT);
      mark.material.opacity = active ? 0.96 : (target ? 0.72 : (i % 4 === 0 ? 0.44 : 0.26));
      mark.scale.setScalar(active ? 1.45 : (target ? 1.22 : 1));
    }
  }

  setMode(mode) {
    if (!['prediction', 'observed', 'stationary', 'compare'].includes(mode)) return;
    this.mode = mode;
    this.refreshLayout();
    this.refreshButtons();
  }

  setAutoReadings(on) {
    this.autoReadings = !!on;
    this.refreshButtons();
  }

  refreshLayout() {
    const shift = this.currentExpectedShift();
    const showExpected = this.mode === 'prediction' || this.mode === 'compare';
    const showObserved = this.mode === 'observed' || this.mode === 'stationary' || this.mode === 'compare';
    const action = this.pivoting
      ? `pivot ${this.readingIndex + 1}->${((this.readingIndex + 1) % READING_COUNT) + 1}`
      : `hold mark ${this.readingIndex + 1}/${READING_COUNT}`;
    this.windGroup.visible = showExpected;
    this.localAetherGroup.visible = showObserved;
    setSpriteText(
      this.statusLabel,
      showExpected
        ? `${action}: ${EXPECTED_FRINGE.toFixed(1)}-fringe moving-Earth prediction`
        : `${action}: observed null stays below ${rounded(OBSERVED_LIMIT_FRINGE)} fringe`,
      showExpected ? '#ff9086' : '#42ffd0',
    );
    this.updateFringeOverlay(shift, showExpected, showObserved);
  }

  refreshButtons() {
    for (const [mode, btn] of this.modeButtons) {
      const active = mode === this.mode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    if (this.rotateButton) {
      this.rotateButton.dataset.state = this.autoReadings ? 'on' : 'off';
      this.rotateButton.textContent = `Auto tested pivots: ${this.autoReadings ? 'ON' : 'OFF'}`;
    }
    if (this.nextButton) {
      this.nextButton.disabled = this.autoReadings;
    }
  }

  buildControls(container) {
    const header = document.createElement('h3');
    header.textContent = 'Michelson-Morley';
    container.appendChild(header);

    const reveal = document.createElement('div');
    reveal.className = 'mmx-reveal-card';
    reveal.innerHTML = `
      <span class="mmx-reveal-kicker">Whole test</span>
      <strong>Moving Earth predicted a large periodic fringe shift. MMX did not see it.</strong>
      <span>A 30 km/s orbital wind predicts a ${EXPECTED_FRINGE.toFixed(1)}-fringe pattern as the apparatus pivots through the tested angles.</span>
      <span class="mmx-reveal-punch">The null was not exact zero: the bound was below ${rounded(OBSERVED_LIMIT_FRINGE)} fringe, under 1/20 of the prediction.</span>
    `;
    container.appendChild(reveal);

    const flow = document.createElement('div');
    flow.className = 'mmx-reveal-flow';
    flow.innerHTML = `
      <div><b>1. Predict</b><span>Moving Earth through a fixed background gives a ${ORBITAL_SPEED_KMS} km/s orbital-wind signal.</span></div>
      <div><b>2. Test</b><span>Hold a reading mark, compare fringes, then pivot to the next tested angle.</span></div>
      <div><b>3. Result</b><span>Null: no matching periodic shift; residual below ${rounded(OBSERVED_LIMIT_FRINGE)} fringe, or ${rounded(VELOCITY_LIMIT_KMS, 1)} km/s equivalent drift.</span></div>
    `;
    container.appendChild(flow);

    const modeLabel = document.createElement('div');
    modeLabel.className = 'mmx-control-label';
    modeLabel.textContent = 'Choose the view';
    container.appendChild(modeLabel);

    const modes = document.createElement('div');
    modes.className = 'mmx-mode-buttons';
    this.modeButtons = new Map();
    for (const [mode, label] of [
      ['prediction', '30 km/s Prediction'],
      ['observed', 'Observed Null'],
      ['stationary', 'Stationary Earth'],
      ['compare', 'Compare'],
    ]) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mmx-mode-btn';
      btn.textContent = label;
      btn.addEventListener('click', () => this.setMode(mode));
      modes.appendChild(btn);
      this.modeButtons.set(mode, btn);
    }
    container.appendChild(modes);

    const actions = document.createElement('div');
    actions.className = 'mmx-actions';
    const fringeBtn = document.createElement('button');
    fringeBtn.type = 'button';
    fringeBtn.className = 'mmx-action-btn';
    fringeBtn.textContent = 'Fringe viewer';
    fringeBtn.addEventListener('click', () => this.fringeOverlay ? this.closeFringeOverlay() : this.openFringeOverlay());
    actions.appendChild(fringeBtn);

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'mmx-action-btn active';
    playBtn.textContent = 'Pause';
    playBtn.addEventListener('click', () => {
      const playing = this.togglePlay();
      playBtn.textContent = playing ? 'Pause' : 'Play';
      playBtn.classList.toggle('active', playing);
    });
    actions.appendChild(playBtn);

    this.nextButton = document.createElement('button');
    this.nextButton.type = 'button';
    this.nextButton.className = 'mmx-action-btn';
    this.nextButton.textContent = 'Next mark';
    this.nextButton.addEventListener('click', () => this.advanceReading());
    actions.appendChild(this.nextButton);
    container.appendChild(actions);

    this.rotateButton = document.createElement('button');
    this.rotateButton.type = 'button';
    this.rotateButton.className = 'mmx-rotate-toggle';
    this.rotateButton.addEventListener('click', () => this.setAutoReadings(!this.autoReadings));
    container.appendChild(this.rotateButton);

    this.liveEl = document.createElement('div');
    this.liveEl.className = 'mmx-reading';
    container.appendChild(this.liveEl);

    const site = document.createElement('div');
    site.className = 'mmx-site-card';
    site.innerHTML = `
      <div><b>Site</b><span>${SITE.label}</span></div>
      <div><b>Dates</b><span>${SITE.window}: noon sessions Jul 8, 9, 11; evening sessions Jul 8, 9, 12.</span></div>
      <div><b>Apparatus</b><span>Effective light path about ${ARM_LENGTH_M} m; one turn used ${READING_COUNT} reading marks.</span></div>
    `;
    container.appendChild(site);

    this.refreshButtons();
    this.updateLiveReadout();
  }

  updateLiveReadout() {
    if (!this.liveEl) return;
    const predictedPhase = this.predictedOrbitalShift(this.turnAngle);
    const theta = angleDeg(this.turnAngle);
    const markDeg = this.readingIndex * READING_STEP_DEG;
    const nextMark = ((this.readingIndex + 1) % READING_COUNT) + 1;
    const action = this.pivoting ? `Pivoting to mark ${nextMark}` : 'Holding for fringe reading';
    this.liveEl.innerHTML = `
      <div><b>Mode</b><span>${this.mode}</span></div>
      <div><b>Action</b><span>${action}</span></div>
      <div><b>Mark</b><span>${this.readingIndex + 1}/${READING_COUNT} (${rounded(markDeg, 1)} deg)</span></div>
      <div><b>Angle</b><span>${rounded(theta, 1)} deg live turn</span></div>
      <div><b>Expected</b><span>${EXPECTED_FRINGE.toFixed(1)}-fringe cycle from ${ORBITAL_SPEED_KMS} km/s orbit</span></div>
      <div><b>Red phase</b><span>${rounded(predictedPhase)} fringe at this angle</span></div>
      <div><b>Observed</b><span>null band: &lt;${rounded(OBSERVED_LIMIT_FRINGE)} fringe, &lt;1/20 expected</span></div>
      <div><b>Bound</b><span>&lt;${rounded(VELOCITY_LIMIT_KMS, 1)} km/s, about &lt;1/6 orbital speed</span></div>
      <div><b>Clock</b><span>${SITE.session}; sky time pinned during the lab test</span></div>
    `;
  }

  getInfoPanel() {
    return `
      <div class="mmx-info-grid">
        <div>
          <b>Moving-Earth prediction</b>
          <p>A ${ORBITAL_SPEED_KMS} km/s orbital wind across the lab should create a ${EXPECTED_FRINGE.toFixed(1)}-fringe periodic displacement. After 90 degrees the predicted offset reverses.</p>
        </div>
        <div>
          <b>Observed null</b>
          <p>The null was a bound, not a claim of exact zero. Any observed displacement stayed below ${rounded(OBSERVED_LIMIT_FRINGE)} fringe, less than 1/20 of the predicted displacement.</p>
        </div>
        <div>
          <b>Stationary-earth reading</b>
          <p>The lab is fixed in the Earth frame. A dynamic local aether can be present, but the experiment has no ${ORBITAL_SPEED_KMS} km/s orbital headwind to rotate against, so the near-baseline bands are direct.</p>
        </div>
      </div>
    `;
  }

  openFringeOverlay() {
    if (this.fringeOverlay || typeof document === 'undefined') return;
    const overlay = document.createElement('div');
    overlay.className = 'mmx-fringe-overlay';
    overlay.innerHTML = `
      <button class="mmx-fringe-close" type="button" aria-label="Close fringe viewer">x</button>
      <div class="mmx-fringe-title">Fringe Shift Test</div>
      <svg class="mmx-fringe-svg" viewBox="0 0 420 220" role="img" aria-label="Predicted and observed interference fringes">
        <rect x="10" y="12" width="400" height="196" rx="8"></rect>
        <g class="mmx-fringe-center">
          <line x1="210" y1="24" x2="210" y2="196"></line>
          <text x="210" y="204">center</text>
        </g>
        <g class="mmx-baseline-fringes"></g>
        <g class="mmx-observed-fringes"></g>
        <g class="mmx-expected-fringes"></g>
        <text class="mmx-baseline-label" x="82" y="30">baseline</text>
        <text class="mmx-observed-label" x="210" y="30">green null band</text>
        <text class="mmx-expected-label" x="330" y="30">30 km/s prediction</text>
      </svg>
      <div class="mmx-fringe-legend">
        <span class="baseline">Blue: baseline reading marks</span>
        <span class="observed">Green: observed null band, less than ${rounded(OBSERVED_LIMIT_FRINGE)} fringe</span>
        <span class="expected">Red: moving-Earth ${EXPECTED_FRINGE.toFixed(1)}-fringe 90 deg swap from ${ORBITAL_SPEED_KMS} km/s</span>
      </div>
      <div class="mmx-fringe-note">Blue is the baseline. Green stays inside the historical null band. Red is the predicted orbital signal.</div>
    `;
    overlay.querySelector('.mmx-fringe-close')?.addEventListener('click', () => this.closeFringeOverlay());
    const base = overlay.querySelector('.mmx-baseline-fringes');
    const obs = overlay.querySelector('.mmx-observed-fringes');
    const exp = overlay.querySelector('.mmx-expected-fringes');
    for (let i = -4; i <= 4; i++) {
      const x = 210 + i * 34;
      const baseLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      baseLine.setAttribute('x1', String(x));
      baseLine.setAttribute('x2', String(x));
      baseLine.setAttribute('y1', '42');
      baseLine.setAttribute('y2', '190');
      baseLine.setAttribute('class', 'baseline-line');
      base?.appendChild(baseLine);

      const obsLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      obsLine.setAttribute('x1', String(x));
      obsLine.setAttribute('x2', String(x));
      obsLine.setAttribute('y1', '62');
      obsLine.setAttribute('y2', '170');
      obsLine.setAttribute('class', 'observed-line');
      obs?.appendChild(obsLine);

      const expLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      expLine.setAttribute('x1', String(x));
      expLine.setAttribute('x2', String(x));
      expLine.setAttribute('y1', '48');
      expLine.setAttribute('y2', '184');
      expLine.setAttribute('class', 'expected-line');
      exp?.appendChild(expLine);
    }
    const host = document.getElementById('view') || document.body;
    host.appendChild(overlay);
    this.fringeOverlay = overlay;
    this.refreshLayout();
  }

  closeFringeOverlay() {
    if (!this.fringeOverlay) return;
    this.fringeOverlay.remove();
    this.fringeOverlay = null;
  }

  updateFringeOverlay(expectedShift, showExpected, showObserved) {
    if (!this.fringeOverlay) return;
    const pxPerFringe = 86;
    const expected = this.fringeOverlay.querySelector('.mmx-expected-fringes');
    const observed = this.fringeOverlay.querySelector('.mmx-observed-fringes');
    const note = this.fringeOverlay.querySelector('.mmx-fringe-note');
    const observedShift = showObserved ? Math.sign(expectedShift || 1) * OBSERVED_LIMIT_FRINGE : 0;
    if (expected) {
      expected.setAttribute('transform', `translate(${expectedShift * pxPerFringe} 0)`);
      expected.style.display = showExpected ? '' : 'none';
    }
    if (observed) {
      observed.setAttribute('transform', `translate(${observedShift * pxPerFringe} 0)`);
      observed.style.display = showObserved ? '' : 'none';
    }
    if (note) {
      const action = this.pivoting
        ? `Pivoting toward mark ${((this.readingIndex + 1) % READING_COUNT) + 1}`
        : `Reading mark ${this.readingIndex + 1}/${READING_COUNT}`;
      note.textContent = showExpected
        ? `${action}: red is ${rounded(expectedShift)} fringe here in the ${EXPECTED_FRINGE.toFixed(1)}-fringe 30 km/s cycle; green remains inside the <${rounded(OBSERVED_LIMIT_FRINGE)} null band.`
        : `${action}: green stays within <${rounded(OBSERVED_LIMIT_FRINGE)} fringe of the blue baseline, less than 1/20 of the 30 km/s prediction.`;
    }
  }

  dispose() {
    this.closeFringeOverlay();
    super.dispose();
  }
}

export default MMXExperiment;
