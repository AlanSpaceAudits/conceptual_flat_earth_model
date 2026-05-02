// Speed of Light: Independence from Motion
// Demonstrates that c derives from the medium (ε₀μ₀), not from Einstein's postulates.

import { BaseExperiment } from '../baseExperiment.js';

export class SpeedOfLightExperiment extends BaseExperiment {
  static get id() { return 'speed-of-light'; }
  static get name() { return 'Speed of Light: Independence from Motion'; }
  static get category() { return 'aether'; }
  static get description() { return 'c derives from ε₀μ₀, not from relativistic postulates.'; }

  init() {
    // Physical constants
    this.epsilon0 = 8.854e-12;  // F/m (vacuum permittivity)
    this.mu0 = 1.257e-6;        // H/m (vacuum permeability)
    this.c = 299792458;         // m/s (defined since 1983)

    // Calculated c from Maxwell
    this.cFromMaxwell = 1 / Math.sqrt(this.epsilon0 * this.mu0);

    this.showEinsteinDerivation = true;
    this.showMaxwellDerivation = true;
    this.animationPhase = 0;
  }

  activate() {
    super.activate();
    this.model.setState({
      ShowVault: false,
      ShowFeGrid: false,
      Description: 'Speed of Light: Maxwell derived c from the medium in 1865.',
    });
  }

  update(dt) {
    if (!this.active) return;
    this.animationPhase += dt;
  }

  buildControls(container) {
    const header = document.createElement('h3');
    header.textContent = 'Speed of Light: Independence from Motion';
    container.appendChild(header);

    // The question
    const questionDiv = document.createElement('div');
    questionDiv.className = 'experiment-question';
    questionDiv.innerHTML = `
      <h4>The Question</h4>
      <p>Can the speed of light be derived independent of motion?</p>
    `;
    container.appendChild(questionDiv);

    // Null hypothesis
    const nullDiv = document.createElement('div');
    nullDiv.className = 'experiment-hypothesis';
    nullDiv.innerHTML = `
      <h4>Null Hypothesis</h4>
      <p><strong>H₁:</strong> Einstein successfully derived c independent of a medium
      and relative motion as asserted by his 2nd postulate.</p>
      <p><strong>H₀:</strong> Einstein failed to derive c independent of a medium
      and relative motion as asserted by his 2nd postulate.</p>
    `;
    container.appendChild(nullDiv);

    // Maxwell's derivation
    const maxwellDiv = document.createElement('div');
    maxwellDiv.className = 'experiment-maxwell';
    maxwellDiv.innerHTML = `
      <h4>Maxwell's Derivation (1865)</h4>
      <p class="formula">c = 1/√(ε₀μ₀)</p>
      <table>
        <tr><td>ε₀ (vacuum permittivity)</td><td>${this.epsilon0.toExponential(3)} F/m</td></tr>
        <tr><td>μ₀ (vacuum permeability)</td><td>${this.mu0.toExponential(3)} H/m</td></tr>
        <tr><td>Calculated c</td><td><strong>${Math.round(this.cFromMaxwell).toLocaleString()} m/s</strong></td></tr>
      </table>
      <p><strong>No v. No frames. No relative motion.</strong></p>
      <p>The speed of propagation is a property of the medium.</p>
    `;
    container.appendChild(maxwellDiv);

    // Toggles
    this.createToggle(container, 'Show Einstein Derivation', this.showEinsteinDerivation, (v) => {
      this.showEinsteinDerivation = v;
    });
    this.createToggle(container, 'Show Maxwell Derivation', this.showMaxwellDerivation, (v) => {
      this.showMaxwellDerivation = v;
    });

    // Comparison
    this.createComparisonPanel(
      container,
      `<strong>Einstein (1905):</strong><br>
       Uses c±v in Section 3 to derive Lorentz transformation.<br>
       "the ray moves relatively to the initial point of k... with the velocity c - v"<br><br>
       <strong>Problem:</strong> Assumes c is independent of motion, then uses c±v.`,
      `<strong>Maxwell (1865):</strong><br>
       c = 1/√(ε₀μ₀)<br>
       Measured from capacitance and inductance experiments.<br><br>
       <strong>No motion involved.</strong> c is a property of the medium.`
    );
  }

  getInfoPanel() {
    return `
      <h3>Speed of Light: Independence from Motion</h3>

      <h4>Einstein's Claim (1905)</h4>
      <blockquote style="border-left:2px solid #88a; padding-left:10px; color:#aaa;">
        <strong>Postulate 2:</strong> "Any ray of light moves in the 'stationary' system
        of co-ordinates with the determined velocity c, whether the ray be emitted by
        a stationary or by a moving body."
      </blockquote>
      <p>Einstein also states that a "luminiferous aether" is superfluous — no medium,
      no preferred frame. All frames are equivalent and c is the same in all of them.</p>

      <h4>The Contradiction</h4>
      <p>In Section 3, Einstein writes the travel times:</p>
      <p class="formula">t₁ = x'/(c - v)&nbsp;&nbsp;&nbsp;&nbsp;t₂ = x'/(c + v)</p>
      <p>He explicitly states on p.7:</p>
      <blockquote style="border-left:2px solid #c66; padding-left:10px; color:#aaa;">
        "the ray moves relatively to the initial point of k, when measured in the
        stationary system, with the velocity <strong>c - v</strong>"
      </blockquote>

      <h4>The Logical Structure</h4>
      <ol>
        <li><strong>Assume</strong> c is independent of motion (Postulate 2)</li>
        <li><strong>Write</strong> travel times using c±v (light speed depends on motion)</li>
        <li><strong>Derive</strong> the Lorentz transformation from c±v</li>
        <li><strong>Apply</strong> the transformation to the wave equation</li>
        <li><strong>Conclude</strong> c is invariant (matches the assumption)</li>
      </ol>
      <p><strong>Step 2 contradicts Step 1.</strong> The derivation of motion-independence
      requires motion-dependence. The conclusion is guaranteed by construction, not physics.</p>

      <h4>Maxwell's Alternative (1865)</h4>
      <p class="formula">c = 1/√(ε₀μ₀) = 299,792,458 m/s</p>
      <ul>
        <li>ε₀ measured from capacitance experiments (static charges, no motion)</li>
        <li>μ₀ measured from inductance experiments (steady currents)</li>
        <li>No v, no frames, no relative motion</li>
      </ul>
      <p>The speed emerges from two laboratory-measured constants of the medium.
      It is genuinely independent of motion because <strong>motion never enters the derivation</strong>.</p>

      <h4>The Lorentz Factor is Classical Geometry</h4>
      <p>The factor γ = 1/√(1 - v²/c²) is presented as relativistic spacetime. It is Pythagoras:</p>
      <p class="formula">cτ = √((ct)² - (vt)²)</p>
      <p>If ct is the hypotenuse and vt is one leg, cτ is the other leg. Voigt had this
      in 1887, Lorentz in 1895 — both before Einstein.</p>

      <h4>c is a Defined Conversion Factor</h4>
      <p>Since 1983, the meter is defined as the distance light travels in 1/299,792,458
      of a second. The value is exact by definition — a conversion factor between space
      and time units, not a measured speed.</p>

      <h4>Result</h4>
      <table>
        <tr><th>Derivation</th><th>Uses v?</th><th>Assumes c constant?</th><th>Derives c from?</th></tr>
        <tr><td>Einstein (1905)</td><td>Yes (c±v)</td><td>Yes (Postulate 2)</td><td>Relative motion</td></tr>
        <tr><td>Maxwell (1865)</td><td>No</td><td>No</td><td>Medium properties</td></tr>
      </table>

      <h4>Conclusion</h4>
      <p><strong>H₀ stands.</strong> Einstein's derivation depends on c±v. The Lorentz
      transformation returns c as invariant by algebraic construction, not physical demonstration.</p>
      <p>Maxwell derived c = 1/√(ε₀μ₀) in 1865 from the medium Einstein claimed was superfluous.
      The medium was sufficient.</p>

      <h4>Citations</h4>
      <ul>
        <li>Einstein, A. (1905). "Zur Elektrodynamik bewegter Körper." <em>Annalen der Physik</em>, 17, 891-921</li>
        <li>Maxwell, J.C. (1865). "A Dynamical Theory of the Electromagnetic Field." <em>Phil. Trans.</em>, 155, 459-512</li>
        <li>Gerber, P. (1898). "Die räumliche und zeitliche Ausbreitung der Gravitation." <em>Z. Math. Phys.</em>, 43, 93-104</li>
        <li>Debono, F. (2025). "Lacunae in the Philosophical Foundations of Special Relativity." <em>Open Astronomy</em>, 34(1)</li>
      </ul>

      <p style="margin-top:12px; font-size:11px; color:#888;">
        <a href="https://publish.obsidian.md/spaceaudits/Null_Hypothesis/Speed_of_Light/Speed_of_Light_Null" target="_blank" style="color:#f4a640;">
          📚 Speed of Light Null Hypothesis →
        </a>
      </p>
    `;
  }
}

export default SpeedOfLightExperiment;
