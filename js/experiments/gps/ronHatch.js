// Ron Hatch GPS Analysis
// GPS engineer's analysis of timing corrections and their implications.

import { BaseExperiment } from '../baseExperiment.js';

export class RonHatchExperiment extends BaseExperiment {
  static get id() { return 'ron-hatch'; }
  static get name() { return 'Ron Hatch GPS Analysis'; }
  static get category() { return 'gps'; }
  static get description() { return 'GPS engineer analysis of timing corrections.'; }

  init() {
    // GPS parameters
    this.satelliteAltitude = 20200;     // km
    this.satelliteVelocity = 3.87;      // km/s
    this.earthRotationVelocity = 0.465; // km/s at equator
    this.orbitalVelocity = 30;          // km/s (alleged)

    // Timing corrections applied in GPS
    this.sagnacCorrectionApplied = true;
    this.relativisticCorrectionApplied = true;
    this.orbitalCorrectionApplied = false;  // Key point!

    this.animationPhase = 0;
  }

  activate() {
    super.activate();

    this.model.setState({
      ShowVault: false,
      ShowFeGrid: false,
      Description: 'GPS: Corrections for rotation but NOT orbital motion.',
    });
  }

  update(dt) {
    if (!this.active) return;
    this.animationPhase += dt;
  }

  buildControls(container) {
    const header = document.createElement('h3');
    header.textContent = 'Ron Hatch GPS Analysis';
    container.appendChild(header);

    // Ron Hatch credentials
    const credDiv = document.createElement('div');
    credDiv.className = 'experiment-credentials';
    credDiv.innerHTML = `
      <p><strong>Ron Hatch</strong> (1938-2016)</p>
      <ul>
        <li>30+ years GPS engineering experience</li>
        <li>30+ GPS-related patents</li>
        <li>Former Director of Navigation Systems, NavCom Technology</li>
        <li>IEEE Fellow</li>
      </ul>
    `;
    container.appendChild(credDiv);

    // Corrections table
    const tableDiv = document.createElement('div');
    tableDiv.className = 'experiment-table';
    tableDiv.innerHTML = `
      <h4>GPS Timing Corrections</h4>
      <table>
        <tr>
          <th>Effect</th>
          <th>Velocity</th>
          <th>Correction Applied?</th>
        </tr>
        <tr class="applied">
          <td>Earth Rotation (Sagnac)</td>
          <td>0.465 km/s</td>
          <td>✓ YES</td>
        </tr>
        <tr class="applied">
          <td>Satellite Motion</td>
          <td>3.87 km/s</td>
          <td>✓ YES</td>
        </tr>
        <tr class="applied">
          <td>Gravitational Time Dilation</td>
          <td>—</td>
          <td>✓ YES</td>
        </tr>
        <tr class="not-applied">
          <td>Earth Orbital Motion</td>
          <td>30 km/s</td>
          <td>✗ NO</td>
        </tr>
        <tr class="not-applied">
          <td>Solar System Motion</td>
          <td>230 km/s</td>
          <td>✗ NO</td>
        </tr>
      </table>
    `;
    container.appendChild(tableDiv);

    // Key question
    const questionDiv = document.createElement('div');
    questionDiv.className = 'experiment-question';
    questionDiv.innerHTML = `
      <h4>The Critical Question</h4>
      <p>If GPS can detect and correct for Earth's rotation (0.465 km/s),
      why doesn't it need to correct for Earth's orbital motion (30 km/s)?</p>
      <p>The orbital velocity is <strong>65× larger</strong> than the
      rotational velocity. If it existed, it would dominate the corrections.</p>
    `;
    container.appendChild(questionDiv);

    // Comparison panel
    this.createComparisonPanel(
      container,
      `<strong>Mainstream claim:</strong> Orbital motion doesn't need
       correction because it affects all satellites and receivers equally.<br><br>
       <strong>Problem:</strong> This doesn't explain why Sagnac correction
       IS needed for rotation. Both are "common mode" in the same sense.`,
      `<strong>Geocentric explanation:</strong> Earth is stationary.
       Rotation is real and needs correction. Orbital motion doesn't
       exist, so no correction is needed.<br><br>
       GPS works perfectly because it's designed for a stationary Earth.`
    );
  }

  getInfoPanel() {
    return `
      <h3>Ron Hatch GPS Analysis</h3>

      <p><strong>Who was Ron Hatch?</strong></p>
      <p>Ron Hatch was one of the pioneers of GPS technology, with over 30 years
      of experience and 30+ patents in GPS navigation systems. IEEE Fellow,
      Director of Navigation Systems at NavCom Technology.</p>

      <h4>GPS Refutes Relativity of Simultaneity</h4>
      <p>GPS establishes an <strong>absolute timeline</strong> (GPS Time) from which
      all distances are derived. This violates SR's core postulate:</p>
      <ul>
        <li>Moving and stationary receivers get correct output</li>
        <li>No Lorentz transformations used to re-establish spacetime symmetry</li>
        <li>Physical measurements based on c show it's measured differently for observers in relative motion</li>
      </ul>

      <h4>Einstein Clock Sync Protocol — Falsified</h4>
      <p>The 1/2 timing correction predicted by SR was shown false by:</p>
      <ul>
        <li>Sadeh et al. (1968). "Synchronization of remote clocks." <em>Science</em> 162:897-898</li>
        <li>Saburi et al. (1976). "Relativistic time drift." <em>IEEE Trans.</em> IM25, 473-7</li>
        <li>Kelly, A.G. "The Sagnac Effect and the GPS Synchronization of Clock-Stations"</li>
      </ul>
      <p>The Sagnac effect was required — a timing correction proportional to velocity.</p>

      <h4>The Sagnac Correction IS the "Relativistic" Correction</h4>
      <p>Each claimed relativistic correction is governed by classical equations
      identical to the Sagnac effect (relative motion between source and emitter):</p>
      <p style="font-family:monospace; color:#f4a640;">Δt = 2Aω/c² = 2vl/c²</p>

      <h4>From Fliegel & DiEsposti (1996)</h4>
      <blockquote style="border-left:2px solid #f4a640; padding-left:10px; color:#aaa;">
        "c as a constant is not used in GPS as of 1996... SR and GR cancel each
        other out and accounting for them only improves a few millimeters."
      </blockquote>

      <h4>The Medium</h4>
      <p>All corrections indicate that <strong>relative velocity through a medium</strong>
      is what's being accounted for. The medium has a velocity component — "Earth rotation"
      and aether wind timing offset are the same. Every hour, the angular velocity of
      the aether wind changes, producing the 15°/h readings on RLG and FOG systems.</p>

      <h4>Citations</h4>
      <ul>
        <li>Fliegel & DiEsposti (1996). "GPS and Relativity: An Engineering Overview"</li>
        <li>Marmet, P. (2000). "The GPS and the Constant Velocity of Light." <em>Acta Scientiarum</em></li>
        <li>Galaev, Y.M. (2002). "Measuring Ether-Drift Velocity"</li>
      </ul>

      <p style="margin-top:12px; font-size:11px; color:#888;">
        <a href="https://publish.obsidian.md/spaceaudits/99_Old/Notes/GPS+and+the+Mythology+of+Relativistic+Corrections" target="_blank" style="color:#f4a640;">
          📚 GPS Research Notes →
        </a>
      </p>
    `;
  }
}

export default RonHatchExperiment;
