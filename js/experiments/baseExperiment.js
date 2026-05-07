// Base class for all interactive experiments.
// Experiment visualizations live in the shared scene but do not own
// the camera. The viewer remains free to orbit, zoom, and reposition
// after selecting an experiment.

import * as THREE from 'three';
import { TIME_ORIGIN } from '../core/constants.js';

function copyStateValue(value) {
  return Array.isArray(value) ? [...value] : value;
}

export class BaseExperiment {
  constructor(model, renderer, experimentGroup) {
    this.model = model;
    this.renderer = renderer;
    this.experimentGroup = experimentGroup;
    this.active = false;
    this.isPlaying = false;
    this.animationTime = 0;
    this.sceneObjects = [];
    this.originalState = {};
    this.visualGroup = new THREE.Group();

    // Animation phase for storytelling
    this.phase = 0; // 0=intro, 1=helio prediction, 2=actual result, 3=conclusion
    this.phaseTime = 0;
    this.phaseDuration = 3; // seconds per phase

    // Scale for experiment (relative to the model scene)
    this.experimentScale = 0.15; // Size relative to view
    this.followObserver = true;
  }

  static utcDateTime(year, month, day, hour = 0, minute = 0, second = 0) {
    const ms = Date.UTC(year, month - 1, day, hour, minute, second, 0);
    return ms / TIME_ORIGIN.msPerDay - TIME_ORIGIN.ZeroDate;
  }

  getSceneHost() {
    return this.renderer?.sm?.world || this.renderer?.sm?.scene || this.renderer?.scene || null;
  }

  disposeObject3D(obj) {
    obj.traverse?.((child) => {
      child.geometry?.dispose?.();
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) material.dispose?.();
      }
    });
  }

  // Get observer's current position in world coordinates
  getObserverPosition() {
    const obs = this.model.computed.ObserverFeCoord;
    if (obs) {
      return { x: obs[0], y: obs[1], z: obs[2] + 0.01 };
    }
    return { x: 0, y: 0, z: 0.01 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POSITION AT OBSERVER
  // ═══════════════════════════════════════════════════════════════════════════

  // Place the experiment at the observer's current location.
  // Called on activation only; after that the user can move freely.
  positionAtObserver() {
    const obs = this.getObserverPosition();
    this.visualGroup.position.set(obs.x, obs.y, obs.z);
    this.visualGroup.scale.setScalar(this.experimentScale);
  }

  // Easing function for smooth animation
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA (override in subclasses)
  // ═══════════════════════════════════════════════════════════════════════════

  static get id() { return 'base'; }
  static get name() { return 'Base Experiment'; }
  static get category() { return 'general'; }
  static get description() { return ''; }

  getHistoricalSetup() {
    return null;
  }

  getActivationPatch() {
    const setup = this.getHistoricalSetup?.() || null;
    const state = setup?.state || setup || {};
    return {
      FreeCameraMode: false,
      FreeCamActive: false,
      FollowTarget: null,
      ...state,
    };
  }

  snapshotState(keys) {
    const snapshot = {};
    for (const key of keys) {
      snapshot[key] = copyStateValue(this.model.state[key]);
    }
    return snapshot;
  }

  applyActivationPatch(emit = true) {
    const patch = this.getActivationPatch();
    if (!patch || Object.keys(patch).length === 0) return {};
    this.model.setState(patch, emit);
    return patch;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE HOOKS
  // ═══════════════════════════════════════════════════════════════════════════

  // Called once when experiment module is first loaded.
  // Use for heavy initialization: building geometries, loading textures.
  init() {}

  // Called when user selects this experiment.
  // Add objects to scene, modify model state, start animations.
  activate() {
    this.active = true;
    this.isPlaying = true; // Auto-play for immersive experience
    this.animationTime = 0;
    this.phase = 0;
    this.phaseTime = 0;

    const activationPatch = this.getActivationPatch();

    // Snapshot the state this activation will touch so leaving the
    // experiment returns the user to their prior observing context.
    this.originalState = this.snapshotState(new Set([
      'ShowVault',
      'ShowFeGrid',
      'ShowOpticalVault',
      'ShowStars',
      'ShowPlanets',
      'Description',
      ...Object.keys(activationPatch),
    ]));

    this.model.setState(activationPatch, false);

    // Add this experiment's visual group to the parent
    if (this.experimentGroup) {
      this.experimentGroup.add(this.visualGroup);
    }

    this.positionAtObserver();
  }

  // Toggle play/pause for animation
  togglePlay() {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  // Called when user leaves this experiment.
  // Remove objects from scene, restore model state.
  deactivate() {
    this.active = false;

    // Remove this experiment's visual group
    if (this.experimentGroup) {
      this.experimentGroup.remove(this.visualGroup);
    }

    // Restore original state
    this.model.setState(this.originalState);
  }

  // Called each frame while experiment is active.
  // dt = delta time in seconds since last frame.
  update(dt) {
    if (!this.active) return;
    if (this.followObserver) this.positionAtObserver();

    // Update animation time if playing
    if (this.isPlaying) {
      this.animationTime += dt;
      this.phaseTime += dt;

      // Advance phase after duration
      if (this.phaseTime >= this.phaseDuration && this.phase < 3) {
        this.phase++;
        this.phaseTime = 0;
        this.onPhaseChange(this.phase);
      }
    }
  }

  // Called when animation phase changes - override in subclass
  onPhaseChange(newPhase) {
    // Subclasses implement phase-specific behavior
  }

  // Called when experiment is unloaded (e.g., page unload).
  // Dispose Three.js geometries, materials, textures.
  dispose() {
    for (const obj of this.sceneObjects) {
      this.disposeObject3D(obj);
    }
    this.sceneObjects = [];
    while (this.visualGroup.children.length > 0) {
      const child = this.visualGroup.children[0];
      this.visualGroup.remove(child);
      this.disposeObject3D(child);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UI HOOKS
  // ═══════════════════════════════════════════════════════════════════════════

  // Build experiment-specific controls (sliders, buttons, toggles).
  // container is a DOM element to append controls to.
  buildControls(container) {
    // Override in subclass
  }

  // Return HTML string for the info panel overlay.
  getInfoPanel() {
    return '';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  // Add a Three.js object to be managed by this experiment.
  // It will be added to scene on activate() and removed on deactivate().
  addSceneObject(obj) {
    this.sceneObjects.push(obj);
    const host = this.getSceneHost();
    if (this.active && host) host.add(obj);
  }

  // Remove a managed scene object.
  removeSceneObject(obj) {
    const idx = this.sceneObjects.indexOf(obj);
    if (idx !== -1) {
      this.sceneObjects.splice(idx, 1);
      const host = this.getSceneHost();
      if (host) host.remove(obj);
    }
  }

  // Create a labeled slider control.
  createSlider(container, label, min, max, value, step, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'experiment-slider';

    const labelEl = document.createElement('label');
    labelEl.textContent = label;

    const valueEl = document.createElement('span');
    valueEl.className = 'experiment-slider-value';
    valueEl.textContent = value.toFixed(2);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;
    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      valueEl.textContent = v.toFixed(2);
      onChange(v);
    });

    wrapper.append(labelEl, input, valueEl);
    container.appendChild(wrapper);
    return input;
  }

  // Create a toggle button.
  createToggle(container, label, initialState, onChange) {
    const btn = document.createElement('button');
    btn.className = 'experiment-toggle';
    btn.textContent = `${label}: ${initialState ? 'ON' : 'OFF'}`;
    btn.dataset.state = initialState ? 'on' : 'off';
    btn.addEventListener('click', () => {
      const newState = btn.dataset.state !== 'on';
      btn.dataset.state = newState ? 'on' : 'off';
      btn.textContent = `${label}: ${newState ? 'ON' : 'OFF'}`;
      onChange(newState);
    });
    container.appendChild(btn);
    return btn;
  }

  // Create an action button.
  createButton(container, label, onClick) {
    const btn = document.createElement('button');
    btn.className = 'experiment-btn';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    container.appendChild(btn);
    return btn;
  }

  // Create a comparison panel showing both model interpretations.
  createComparisonPanel(container, helioText, geoText) {
    const panel = document.createElement('div');
    panel.className = 'experiment-comparison';
    panel.innerHTML = `
      <div class="comparison-col helio">
        <h4>Heliocentric Interpretation</h4>
        <p>${helioText}</p>
      </div>
      <div class="comparison-col geo">
        <h4>Geocentric Interpretation</h4>
        <p>${geoText}</p>
      </div>
    `;
    container.appendChild(panel);
    return panel;
  }
}
