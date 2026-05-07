// Wang Fiber Optic Experiments (2003-2004)
// Ruyong Wang: Linear Sagnac effect in fiber optic cable.

import { BaseExperiment } from '../baseExperiment.js';

export class WangFiberExperiment extends BaseExperiment {
  static get id() { return 'wang-fiber'; }
  static get name() { return 'Wang Fiber Optic (2003-2004)'; }
  static get category() { return 'aether'; }
  static get description() { return 'Ruyong Wang: linear Sagnac in fiber optic cable.'; }

  init() {
    this.fiberLength = 1000;        // meters
    this.earthRotationRate = 15;    // degrees per hour
    this.detectedRotation = true;
    this.detectedOrbital = false;
    this.animationPhase = 0;
  }

  activate() {
    super.activate();
    this.model.setState({
      ShowVault: false,
      ShowFeGrid: false,
      Description: 'Wang 2003-2004: Linear Sagnac detects rotation, not orbital motion.',
    });
  }

  update(dt) {
    if (!this.active) return;
    this.animationPhase += dt;
  }

  buildControls(container) {
    const header = document.createElement('h3');
    header.textContent = 'Wang Fiber Optic Experiments';
    container.appendChild(header);

    // Background
    const bgDiv = document.createElement('div');
    bgDiv.className = 'experiment-background';
    bgDiv.innerHTML = `
      <p><strong>Researcher:</strong> Ruyong Wang, St. Cloud State University</p>
      <p><strong>Published:</strong> Physics Letters A (2003, 2004)</p>
      <p><strong>Innovation:</strong> Extended Sagnac effect to linear (non-rotating) segments</p>
    `;
    container.appendChild(bgDiv);

    // Key finding
    const findingDiv = document.createElement('div');
    findingDiv.className = 'experiment-finding';
    findingDiv.innerHTML = `
      <h4>Key Finding</h4>
      <p>A straight fiber optic cable oriented East-West shows a Sagnac-type
      phase shift due to Earth's rotation — even though the fiber itself
      is not rotating in a closed loop.</p>
      <p>This proves the Sagnac effect detects motion relative to an
      <strong>inertial reference frame</strong>, not just mechanical rotation.</p>
    `;
    container.appendChild(findingDiv);

    // Detection results
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'experiment-results';
    resultsDiv.innerHTML = `
      <h4>What Was Detected</h4>
      <table>
        <tr class="detected">
          <td>Earth's rotation (15°/hr)</td>
          <td><strong>✓ DETECTED</strong></td>
        </tr>
        <tr class="not-detected">
          <td>Orbital motion (30 km/s)</td>
          <td><strong>✗ NOT DETECTED</strong></td>
        </tr>
        <tr class="not-detected">
          <td>Galactic motion (230 km/s)</td>
          <td><strong>✗ NOT DETECTED</strong></td>
        </tr>
      </table>
    `;
    container.appendChild(resultsDiv);

    // Comparison
    this.createComparisonPanel(
      container,
      `<strong>Problem:</strong> If Earth orbits the Sun at 30 km/s,
       Wang's apparatus should detect this motion — it's far larger
       than the rotational velocity detected.<br><br>
       Mainstream has no explanation for why only rotation is detected.`,
      `<strong>Explanation:</strong> Earth rotates within a local aether
       frame but does not translate through space.<br><br>
       Rotation is real and detectable. Orbital motion doesn't exist,
       so it's not detected.`
    );
  }

  getInfoPanel() {
    return `
      <h3>Wang Fiber Optic Experiments (2003-2004)</h3>

      <p><strong>Researcher:</strong> Ruyong Wang, Physics Department,
      St. Cloud State University, Minnesota</p>

      <h4>The Innovation</h4>
      <p>Traditional Sagnac experiments use rotating platforms with closed
      light paths. Wang demonstrated that the Sagnac effect also works in
      <strong>linear fiber segments</strong> that are stationary relative
      to Earth's surface.</p>

      <h4>Experimental Setup</h4>
      <p>A fiber optic cable oriented East-West on Earth's surface. Light
      traveling East (with Earth's rotation) and light traveling West
      (against rotation) show a measurable phase difference.</p>

      <h4>Results</h4>
      <ul>
        <li><strong>Earth's rotation:</strong> Clearly detected at the
            expected magnitude for 15°/hour</li>
        <li><strong>Orbital motion:</strong> Not detected (would be
            ~65× larger than rotation signal)</li>
        <li><strong>Galactic motion:</strong> Not detected (would be
            ~500× larger than rotation signal)</li>
      </ul>

      <h4>Significance</h4>
      <p>Wang's work proves that the Sagnac effect is not limited to
      mechanical rotation of the apparatus. It detects motion relative
      to an inertial reference frame — what classical physics would
      call the "aether frame."</p>

      <h4>The Paradox</h4>
      <p>If the apparatus can detect Earth's rotation (a relatively small
      velocity), why can't it detect Earth's orbital motion (a much larger
      velocity)? The mainstream answer — that orbital motion is "inertial"
      and therefore undetectable — doesn't hold up, because:</p>
      <ul>
        <li>Orbital motion is curved (accelerating toward the Sun)</li>
        <li>The Sagnac effect should detect any motion relative to the
            light-carrying medium</li>
      </ul>

      <h4>Geocentric Interpretation</h4>
      <p>Earth rotates within a local aether frame, and this rotation is
      detectable. Earth does not orbit the Sun, so there is no orbital
      motion to detect. The results are exactly what the geocentric
      model predicts.</p>
    `;
  }
}

export default WangFiberExperiment;
