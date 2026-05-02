// Fresnel Drag / Fizeau Experiment (1851)
// Light speed in moving water shows partial aether drag.

import { BaseExperiment } from '../baseExperiment.js';

export class FresnelDragExperiment extends BaseExperiment {
  static get id() { return 'fresnel-drag'; }
  static get name() { return 'Fresnel Drag (Fizeau 1851)'; }
  static get category() { return 'aether'; }
  static get description() { return 'Light speed in moving water shows partial aether drag.'; }

  init() {
    // Physical constants
    this.c = 299792;                    // km/s (speed of light in vacuum)
    this.waterRefractiveIndex = 1.33;   // n for water
    this.waterVelocity = 7;             // m/s (Fizeau's water flow speed)

    // Fresnel drag coefficient
    this.fresnelCoefficient = 1 - (1 / (this.waterRefractiveIndex ** 2));

    this.animationPhase = 0;
    this.showWithFlow = true;
    this.showAgainstFlow = true;
  }

  activate() {
    super.activate();

    this.model.setState({
      ShowVault: false,
      ShowFeGrid: false,
      Description: 'Fizeau 1851: Partial aether drag in moving water.',
    });
  }

  update(dt) {
    if (!this.active) return;
    this.animationPhase += dt;
  }

  // Calculate light speed in moving medium
  calculateLightSpeed(mediumVelocity, withFlow = true) {
    const n = this.waterRefractiveIndex;
    const c = this.c * 1000;  // convert to m/s
    const v = mediumVelocity;
    const f = this.fresnelCoefficient;

    // Speed of light in stationary medium
    const cMedium = c / n;

    // With Fresnel drag: c' = c/n ± v(1 - 1/n²)
    if (withFlow) {
      return cMedium + v * f;
    } else {
      return cMedium - v * f;
    }
  }

  buildControls(container) {
    const header = document.createElement('h3');
    header.textContent = 'Fresnel Drag (Fizeau 1851)';
    container.appendChild(header);

    // Experiment setup
    const setupDiv = document.createElement('div');
    setupDiv.className = 'experiment-setup';
    setupDiv.innerHTML = `
      <h4>Experimental Setup</h4>
      <p>Fizeau sent light beams through tubes of flowing water:</p>
      <ul>
        <li>One beam traveling <strong>with</strong> the water flow</li>
        <li>One beam traveling <strong>against</strong> the water flow</li>
      </ul>
      <p>He measured the interference pattern to detect speed differences.</p>
    `;
    container.appendChild(setupDiv);

    // Water velocity slider
    this.createSlider(
      container,
      'Water velocity (m/s)',
      1, 15, this.waterVelocity, 0.5,
      (v) => { this.waterVelocity = v; this.updateCalculations(); }
    );

    // Calculations display
    const calcDiv = document.createElement('div');
    calcDiv.className = 'experiment-calculations';
    calcDiv.id = 'fresnel-calc';
    container.appendChild(calcDiv);
    this.calcDiv = calcDiv;
    this.updateCalculations();

    // Predictions comparison
    const predictDiv = document.createElement('div');
    predictDiv.className = 'experiment-predictions';
    predictDiv.innerHTML = `
      <h4>Three Possible Predictions</h4>
      <table>
        <tr>
          <th>Model</th>
          <th>Prediction</th>
          <th>Result</th>
        </tr>
        <tr>
          <td>No aether drag</td>
          <td>No speed difference</td>
          <td>✗ Wrong</td>
        </tr>
        <tr>
          <td>Full aether drag</td>
          <td>Δv = water velocity</td>
          <td>✗ Wrong</td>
        </tr>
        <tr class="correct">
          <td>Partial drag (Fresnel)</td>
          <td>Δv = v(1 - 1/n²)</td>
          <td>✓ Correct!</td>
        </tr>
      </table>
    `;
    container.appendChild(predictDiv);

    // Toggles
    this.createToggle(container, 'Show With-Flow Beam', this.showWithFlow, (v) => {
      this.showWithFlow = v;
    });

    this.createToggle(container, 'Show Against-Flow Beam', this.showAgainstFlow, (v) => {
      this.showAgainstFlow = v;
    });

    // Comparison panel
    this.createComparisonPanel(
      container,
      `<strong>Special Relativity explanation:</strong> Relativistic
       velocity addition formula happens to produce the same result
       as Fresnel's coefficient.<br><br>
       This is presented as SR "predicting" the result, but Fresnel
       derived it 54 years before Einstein.`,
      `<strong>Aether explanation:</strong> Moving water partially
       drags the local aether with it. The drag coefficient depends
       on the medium's refractive index.<br><br>
       This is exactly what a stationary Earth in local aether predicts.`
    );
  }

  updateCalculations() {
    if (!this.calcDiv) return;

    const n = this.waterRefractiveIndex;
    const v = this.waterVelocity;
    const f = this.fresnelCoefficient;
    const cWater = this.c * 1000 / n;  // m/s

    const speedWith = this.calculateLightSpeed(v, true);
    const speedAgainst = this.calculateLightSpeed(v, false);
    const difference = speedWith - speedAgainst;

    this.calcDiv.innerHTML = `
      <h4>Calculations</h4>
      <div class="calc-row">
        <span>Fresnel coefficient (1 - 1/n²):</span>
        <strong>${f.toFixed(4)}</strong>
      </div>
      <div class="calc-row">
        <span>Light speed in stationary water:</span>
        <strong>${(cWater/1000).toFixed(0)} km/s</strong>
      </div>
      <div class="calc-row">
        <span>Effective drag velocity:</span>
        <strong>${(v * f).toFixed(2)} m/s</strong>
      </div>
      <div class="calc-row">
        <span>Speed with flow:</span>
        <strong>${(speedWith/1000).toFixed(6)} km/s</strong>
      </div>
      <div class="calc-row">
        <span>Speed against flow:</span>
        <strong>${(speedAgainst/1000).toFixed(6)} km/s</strong>
      </div>
      <div class="calc-row highlight">
        <span>Measured difference:</span>
        <strong>${difference.toFixed(2)} m/s</strong>
      </div>
    `;
  }

  getInfoPanel() {
    return `
      <h3>Fresnel Drag / Fizeau Experiment (1851)</h3>

      <p><strong>Historical Context:</strong> In 1818, Augustin Fresnel proposed
      that transparent media partially drag the aether with them when moving.
      He derived a "drag coefficient" based on the medium's refractive index.</p>

      <h4>Fresnel's Drag Coefficient</h4>
      <p>f = 1 - 1/n²</p>
      <p>For water (n = 1.33): f ≈ 0.434</p>
      <p>This means moving water drags about 43% of the aether with it.</p>

      <h4>Fizeau's Experiment (1851)</h4>
      <p>Hippolyte Fizeau tested Fresnel's prediction by sending light through
      tubes of rapidly flowing water. He measured the interference between
      beams traveling with and against the water flow.</p>

      <p><strong>Result:</strong> The measured speed difference matched
      Fresnel's prediction exactly — partial drag, not full drag.</p>

      <h4>Why This Matters</h4>
      <p>Three possibilities existed:</p>
      <ol>
        <li><strong>No drag:</strong> Light speed unaffected by water motion
            → Would show no interference shift</li>
        <li><strong>Full drag:</strong> Aether completely carried by water
            → Would show shift equal to water velocity</li>
        <li><strong>Partial drag:</strong> Fresnel coefficient applies
            → Would show shift of v(1-1/n²)</li>
      </ol>
      <p>Fizeau confirmed option 3 — partial drag.</p>

      <h4>Modern Interpretation</h4>
      <p>Special relativity claims to "explain" this result through
      relativistic velocity addition. However:</p>
      <ul>
        <li>Fresnel derived the coefficient in 1818</li>
        <li>Fizeau confirmed it in 1851</li>
        <li>Einstein published SR in 1905</li>
      </ul>
      <p>SR was fitted to match an already-known result, not a prediction.</p>

      <h4>Geocentric Interpretation</h4>
      <p>The partial drag coefficient is a natural property of how media
      interact with the local aether. A stationary Earth sits in a local
      aether frame; moving media partially drag this aether with them.</p>

      <p>This interpretation requires no relativistic framework — just
      classical aether physics as Fresnel originally conceived it.</p>
    `;
  }
}

export default FresnelDragExperiment;
