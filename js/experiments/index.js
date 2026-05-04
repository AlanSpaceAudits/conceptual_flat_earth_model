// Experiment Manager: handles loading, activation, and lifecycle of interactive experiments.
// Mirrors the Demos pattern but for standalone interactive simulations.

import * as THREE from 'three';
import { EXPERIMENTS, EXPERIMENT_CATEGORIES } from './registry.js';

export class ExperimentManager {
  constructor(model, renderer = null) {
    this.model = model;
    this.renderer = null;
    this.experiments = EXPERIMENTS;
    this.categories = EXPERIMENT_CATEGORIES;
    this.activeExperiment = null;
    this.loadedModules = new Map();  // id -> experiment instance
    this._panelHost = null;
    this._rafId = null;
    this._lastFrameTime = 0;

    // Create a dedicated group for experiment visualizations
    this.experimentGroup = new THREE.Group();
    this.experimentGroup.name = 'experiments';

    if (renderer) this.attachRenderer(renderer);
  }

  attachRenderer(renderer) {
    this.renderer = renderer || null;
    if (this.renderer?.sm?.world && this.experimentGroup.parent !== this.renderer.sm.world) {
      this.renderer.sm.world.add(this.experimentGroup);
    }
    for (const experiment of this.loadedModules.values()) {
      experiment.renderer = this.renderer;
      experiment.experimentGroup = this.experimentGroup;
    }
  }

  _startLoop() {
    if (this._rafId != null || typeof requestAnimationFrame !== 'function') return;
    this._lastFrameTime = performance.now();
    const tick = (now) => {
      this._rafId = null;
      const dt = Math.min(0.1, Math.max(0, (now - this._lastFrameTime) / 1000));
      this._lastFrameTime = now;
      this.update(dt);
      if (this.activeExperiment) {
        this._rafId = requestAnimationFrame(tick);
      }
    };
    this._rafId = requestAnimationFrame(tick);
  }

  _stopLoop() {
    if (this._rafId == null || typeof cancelAnimationFrame !== 'function') return;
    cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }

  // Lazy-load and activate an experiment by id
  async activate(id) {
    const meta = this.experiments.find(e => e.id === id);
    if (!meta) {
      console.warn(`Experiment not found: ${id}`);
      return;
    }

    // Deactivate current experiment if any
    if (this.activeExperiment) {
      await this.deactivate();
    }

    // Lazy load the module if not already loaded
    if (!this.loadedModules.has(id)) {
      try {
        const module = await meta.module();
        const ExperimentClass = module.default || Object.values(module)[0];
        const instance = new ExperimentClass(this.model, this.renderer, this.experimentGroup);
        instance.init();
        this.loadedModules.set(id, instance);
      } catch (err) {
        console.error(`Failed to load experiment ${id}:`, err);
        return;
      }
    }

    const experiment = this.loadedModules.get(id);
    experiment.activate();
    this.activeExperiment = experiment;
    this.model.setState({ ActiveExperiment: id });
    this._startLoop();
    this._refreshPanel();
  }

  async deactivate() {
    if (this.activeExperiment) {
      this.activeExperiment.deactivate();
      this.activeExperiment = null;
      this.model.setState({ ActiveExperiment: null });
      this._stopLoop();
      this._refreshPanel();
    }
  }

  // Driven by the internal RAF loop in _startLoop while an experiment
  // is active. Forwards the per-frame dt to the active experiment so
  // it can animate its own visuals.
  update(dt) {
    if (this.activeExperiment) {
      this.activeExperiment.update(dt);
    }
  }

  // Build the experiments panel UI
  renderInto(panel) {
    this._panelHost = panel;
    panel.replaceChildren();

    // Back button (visible when experiment is active)
    const backBtn = document.createElement('button');
    backBtn.className = 'experiment-back-btn';
    backBtn.textContent = 'Back to List';
    backBtn.style.display = 'none';
    backBtn.addEventListener('click', () => this.deactivate());
    panel.appendChild(backBtn);
    this._backBtn = backBtn;

    // Experiment controls container (populated when experiment is active)
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'experiment-controls';
    controlsContainer.style.display = 'none';
    panel.appendChild(controlsContainer);
    this._controlsContainer = controlsContainer;

    // Category list
    const listContainer = document.createElement('div');
    listContainer.className = 'experiment-list';
    panel.appendChild(listContainer);
    this._listContainer = listContainer;

    this._buildCategoryList();
  }

  _buildCategoryList() {
    if (!this._listContainer) return;
    this._listContainer.replaceChildren();

    const overview = document.createElement('section');
    overview.className = 'experiment-overview';
    overview.innerHTML = `
      <div class="experiment-overview-kicker">Kinematics vs dynamics</div>
      <h3>Same sky map. Different physical cause.</h3>
      <p>Heliocentric, globe-geocentric, and topographical plane coordinates can all map the same observed angles. That is kinematic equivalence.</p>
      <p class="experiment-overview-punch">Dynamics asks the stronger question: which frame makes the experiments work directly? These demos keep observation first and favor the observer-first explanation where measurement and law meet with fewer added assumptions.</p>
    `;
    this._listContainer.appendChild(overview);

    for (const category of this.categories) {
      const categoryExperiments = this.experiments.filter(e => e.category === category.id);
      if (categoryExperiments.length === 0) continue;

      const header = document.createElement('div');
      header.className = 'experiment-category-header';
      header.textContent = `${category.icon || ''} ${category.label}`;
      this._listContainer.appendChild(header);

      for (const exp of categoryExperiments) {
        const btn = document.createElement('button');
        btn.className = 'experiment-btn';
        const name = document.createElement('strong');
        name.textContent = exp.name;
        const desc = document.createElement('small');
        desc.textContent = exp.description || '';
        btn.append(name, document.createElement('br'), desc);
        btn.addEventListener('click', () => this.activate(exp.id));
        this._listContainer.appendChild(btn);
      }
    }
  }

  _resetPanelScroll() {
    const roots = new Set([
      this._panelHost,
      this._panelHost?.closest?.('.tab-popup'),
      this._listContainer,
      this._controlsContainer,
    ].filter(Boolean));

    const reset = () => {
      for (const el of roots) {
        el.scrollTop = 0;
        el.scrollLeft = 0;
      }
    };

    reset();
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(reset);
    }
  }

  _refreshPanel() {
    if (!this._panelHost) return;

    const isActive = !!this.activeExperiment;

    if (this._backBtn) {
      this._backBtn.style.display = isActive ? '' : 'none';
    }
    if (this._listContainer) {
      this._listContainer.style.display = isActive ? 'none' : '';
    }
    if (this._controlsContainer) {
      this._controlsContainer.style.display = isActive ? '' : 'none';
      if (isActive) {
        this._controlsContainer.replaceChildren();
        this.activeExperiment.buildControls(this._controlsContainer);

        // Add info panel
        const info = this.activeExperiment.getInfoPanel();
        if (info) {
          const infoDiv = document.createElement('div');
          infoDiv.className = 'experiment-info';
          infoDiv.innerHTML = info;
          this._controlsContainer.appendChild(infoDiv);
        }
      }
    }
    this._resetPanelScroll();
  }

  // Dispose all loaded experiments
  dispose() {
    this._stopLoop();
    if (this.activeExperiment) this.activeExperiment.deactivate();
    for (const experiment of this.loadedModules.values()) {
      experiment.dispose();
    }
    this.loadedModules.clear();
    this.activeExperiment = null;
  }
}
