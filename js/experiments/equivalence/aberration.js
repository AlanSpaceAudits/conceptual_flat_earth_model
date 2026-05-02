// Stellar Aberration — kinematic-equivalence demo.
//
// Bradley (1727) discovered every star traces an identical 20.5"
// elliptical wobble each year. Two physical pictures predict the same
// angle:
//
//   κ = arctan(v / c) ≈ 20.5"   with v = 30 km/s, c = 299,792 km/s
//
//   Heliocentric: Earth flies through still aether at 30 km/s; the
//      telescope must tilt forward by kappa to catch the starlight.
//
//   FE topographical plane: Earth is stationary; the local aether
//      sweeps past at 30 km/s; light entering the telescope is
//      deflected by kappa: same number, no Earth motion required.
//
// Airy's water-telescope test (1871) settles which picture is more
// viable: a water-filled telescope did NOT change the aberration
// angle. If Earth were moving through still aether, the slower light
// inside water should have raised κ by the refractive index n. It
// didn't. That null is the natural prediction of a stationary Earth
// inside locally co-moving aether, and an awkward problem for the
// moving-Earth picture.

import * as THREE from 'three';
import { BaseExperiment } from '../baseExperiment.js';

const EARTH_V_KMPS = 30;
const C_KMPS = 299792;
const KAPPA_ARCSEC = Math.atan(EARTH_V_KMPS / C_KMPS) * 206264.806; // ≈ 20.6"

// Sightline visualisation. The visible cel-nav star dots in normal /
// first-person view live on the *optical* vault (the small sphere
// around the observer's eye, populated from `star.opticalVaultCoord`).
// The heavenly-vault `vaultCoord` is far above the disc and is hidden
// unless ShowTruePositions is on. Beams therefore terminate at
// `opticalVaultCoord`, which is exactly where each visible dot is
// rendered. The native pipeline already applies real ~20.5″ aberration
// to that position each frame, so the beam tips inherit the κ wobble
// automatically and stay glued to the visible dots.
const MAX_BEAMS = 1024;

// Pixel size of the κ-aberration ellipse drawn around each star in
// the SVG HUD. Real κ ≈ 20.5″ is sub-pixel at any sane FOV; this
// constant boosts it to a subtle, readable hint.
const KAPPA_RING_PX = 6;

// Catalog id-prefix filter — these render in their own Points groups
// and aren't true fixed stars, so they don't get sightline beams.
const NON_FIXED_STAR_PREFIX = /^(sat|bh|q|gal)_/;

export class AberrationExperiment extends BaseExperiment {
  static get id() { return 'aberration'; }
  static get name() { return 'Stellar Aberration'; }
  static get category() { return 'equivalence'; }
  static get description() { return "Bradley 1727: 20.6 arcsec wobble. Same kappa = arctan(v/c) in both frames; Airy's failure favours stationary Earth."; }

  init() {
    this.equivalenceOverlay = null;
    this.followObserver = false;
    this.experimentScale = 1;
    this.wobbleOn = true;          // toggle: observer→star sightline beams
    this.vortexOn = true;          // toggle: native aether vortex tunnel
    this.showBelowHorizon = false; // toggle: beams to sub-horizon stars too
    this.wobbleGroup = new THREE.Group();
    this.wobbleGroup.name = 'aberration-sightline-beams';
    this.visualGroup.add(this.wobbleGroup);
    // Live Three.js objects.
    this.beamSegments = null;
    this.beamBuf = null;            // 2*MAX_BEAMS × 3
    this.activeBeamCount = 0;
    this._toggleButtons = null;
  }

  activate() {
    super.activate();
    if (typeof document !== 'undefined') {
      document.body?.classList?.add('aberration-experiment-active');
    }
    this.model.setState({
      WorldModel: 'fe',
      ShowVault: true,
      // Keep the native personal-dome star dots visible — the beams
      // are an overlay anchored to those dots, not a replacement.
      ShowStars: true,
      ShowOpticalVault: true,
      ShowFeGrid: true,
      ShowShadow: true,
      ShowDayNightShadow: true,
      PermanentNight: false,
      DynamicStars: true,
      ShowCelestialBodies: true,
      // Trepidation master forces precession + nutation + aberration
      // through the apparent-of-date pipeline so the apparent-of-date
      // star positions actually carry the 20.5″ aberration κ.
      StarTrepidation: true,
      StarApplyAberration: true,
      Description: `Stellar Aberration: sightlines from observer to each native dome star wobble by κ ≈ ${KAPPA_ARCSEC.toFixed(2)}\" (boosted for visibility).`,
    });
    // The setState above is a one-shot on activation — the native
    // toolbar toggles still flip these freely after the demo starts.
    this._buildBeams();
    // Default ON for the vortex per the user's spec ("transparent
    // aether wind"). Use the existing native vortex2 cosmology.
    this.model.setState({ Cosmology: this.vortexOn ? 'vortex2' : 'none' });
    this.openEquivalenceOverlay();
  }

  deactivate() {
    if (typeof document !== 'undefined') {
      document.body?.classList?.remove('aberration-experiment-active');
    }
    // Always reset cosmology when leaving so the rest of the app
    // gets a clean state regardless of toggle.
    this.model?.setState?.({ Cosmology: 'none' });
    this._clearBeams();
    this._removeOpticalHud();
    this.closeEquivalenceOverlay();
    super.deactivate();
  }

  _disposeGroup(group) {
    if (!group) return;
    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      child.geometry?.dispose?.();
      const mats = Array.isArray(child.material) ? child.material : (child.material ? [child.material] : []);
      for (const m of mats) m.dispose?.();
    }
  }

  _clearBeams() {
    this._disposeGroup(this.wobbleGroup);
    this.beamSegments = null;
    this.beamBuf = null;
    this.activeBeamCount = 0;
  }

  // 2D HUD overlay used only in optical / first-person view.
  // 3D lines from the camera's exact eye-position to a star are
  // along the view ray and project to a single pixel, so first-person
  // beams cannot be rendered as 3D LineSegments. Instead we draw an
  // SVG overlay above the canvas: every visible cel-nav star gets a
  // line from the screen center (= the eye) to its projected pixel
  // position. The κ aberration that already lives in opticalVaultCoord
  // shifts each star's screen position frame by frame, so the HUD
  // lines visibly wobble like laser-tracking reticles.
  _ensureOpticalHud() {
    if (this._opticalHud || typeof document === 'undefined') return;
    const canvas = this.renderer?.canvas;
    const parent = canvas?.parentElement || document.body;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'aberration-optical-hud');
    Object.assign(svg.style, {
      position: 'absolute',
      left: '0', top: '0',
      width: '100%', height: '100%',
      pointerEvents: 'none',
      overflow: 'visible',
      zIndex: '5',
    });
    parent.appendChild(svg);
    this._opticalHud = svg;
    this._opticalHudLines = [];
    this._opticalHudRings = [];
  }
  _removeOpticalHud() {
    this._opticalHud?.remove?.();
    this._opticalHud = null;
    this._opticalHudLines = null;
    this._opticalHudRings = null;
  }
  _setOpticalHudVisible(on) {
    if (this._opticalHud) this._opticalHud.style.display = on ? '' : 'none';
  }

  // World-space position of the wobbleGroup → visualGroup parent,
  // used to convert world coords into local-space ones for the
  // LineSegments buffer. Cached in a single Vector3 to avoid
  // per-frame allocation. (BaseExperiment anchors visualGroup at the
  // observer with a small +0.01 z lift on activation.)
  _visualGroupOffset() {
    const tmp = this._tmpVisualOff || (this._tmpVisualOff = new THREE.Vector3());
    const v = this.visualGroup?.position;
    return v ? tmp.set(v.x, v.y, v.z) : tmp.set(0, 0, 0);
  }

  // Beam start anchor in heavenly view. The user sees the Nikki
  // figure on the disc; its eye voxels sit at world z ≈ 0.03125, so
  // beams converge at the figure's head when viewed from outside.
  // visualGroup is anchored at world (obs.x, obs.y, obs.z + 0.01),
  // so the local z is 0.03125 − 0.01 = 0.02125. (Optical/first-person
  // view doesn't use this — its start is computed per-beam from the
  // live camera position in _updateOpticalHud.)
  _heavenlyEyeLocal() {
    return this._heavenlyStart
      || (this._heavenlyStart = new THREE.Vector3(0, 0, 0.02125));
  }

  // Should this star get a sightline beam? Filters non-fixed-star
  // catalogs (sats/black holes/quasars/galaxies) and below-horizon
  // entries (matching the renderer's parking of those dots). Toggle
  // `showBelowHorizon` bypasses the horizon check.
  _isEligibleStar(star) {
    if (!star) return false;
    if (typeof star.id === 'string' && NON_FIXED_STAR_PREFIX.test(star.id)) return false;
    if (this.showBelowHorizon) return true;
    return (star.anglesGlobe?.elevation ?? 1) > 0;
  }

  // Allocate a max-sized LineSegments buffer once. Each frame the
  // update() method fills slot i with observer→star.vaultCoord for
  // the i-th eligible cel-nav star, and collapses any unused slots
  // to zero-length segments at the observer.
  _buildBeams() {
    if (!this.model) return;
    this._clearBeams();
    this.beamBuf = new Float32Array(MAX_BEAMS * 2 * 3);
    const beamGeom = new THREE.BufferGeometry();
    const beamAttr = new THREE.BufferAttribute(this.beamBuf, 3);
    beamAttr.usage = THREE.DynamicDrawUsage;
    beamGeom.setAttribute('position', beamAttr);
    beamGeom.setDrawRange(0, 0);
    const beamMat = new THREE.LineBasicMaterial({
      color: 0x66ffff,
      transparent: true,
      opacity: 0.85,
      depthTest: false,
      depthWrite: false,
    });
    this.beamSegments = new THREE.LineSegments(beamGeom, beamMat);
    this.beamSegments.renderOrder = 9999;
    this.beamSegments.frustumCulled = false;
    this.beamSegments.visible = !!this.wobbleOn;
    this.wobbleGroup.add(this.beamSegments);
  }

  // Each frame: connect the observer to every eligible cel-nav star's
  // current vaultCoord. The native star dots already have ~20.5″
  // aberration baked in, so the beam tips inherit that κ wobble
  // automatically and stay glued to the dots.
  update(dt) {
    super.update(dt);
    if (!this.active) return;
    if (!this.beamSegments || !this.beamBuf) return;

    // Every visible fixed-star catalog: nav stars + the broader
    // constellation set (Big Dipper / Little Dipper extras live there).
    // Sats / black holes / quasars / galaxies stay excluded — they
    // render as separate Points groups and aren't true fixed stars.
    const c = this.model.computed || {};
    const stars = (this._tmpStarList || (this._tmpStarList = []));
    stars.length = 0;
    if (Array.isArray(c.CelNavStars))     for (const s of c.CelNavStars)     stars.push(s);
    if (Array.isArray(c.CataloguedStars)) for (const s of c.CataloguedStars) stars.push(s);
    const off = this._visualGroupOffset();
    const inside = !!this.model?.state?.InsideVault;
    const buf = this.beamBuf;

    // SVG HUD is used in BOTH views: optical needs eye→star lines
    // (3D lines along the view ray would collapse to a pixel) AND
    // the κ-ellipse rings; heavenly only needs the rings overlaid on
    // the 3D cone. The same _updateOpticalHud() handles both — pass
    // the view mode so it knows whether to draw the lines.
    this._ensureOpticalHud();
    this._setOpticalHudVisible(this.wobbleOn);
    if (this.wobbleOn) this._updateOpticalHud(stars, inside);

    // ── Optical / first-person view: hide the 3D LineSegments. ──────
    if (inside) {
      this.beamSegments.visible = false;
      return;
    }

    // ── Heavenly view: 3D beams from Nikki's head to each star. ─────
    this.beamSegments.visible = !!this.wobbleOn;
    const heavenStart = this._heavenlyEyeLocal();
    let n = 0;
    for (const star of stars) {
      if (n >= MAX_BEAMS) break;
      if (!this._isEligibleStar(star)) continue;
      const v = star.opticalVaultCoord || star.vaultCoord;
      if (!v) continue;
      buf[n * 6 + 0] = heavenStart.x;
      buf[n * 6 + 1] = heavenStart.y;
      buf[n * 6 + 2] = heavenStart.z;
      buf[n * 6 + 3] = v[0] - off.x;
      buf[n * 6 + 4] = v[1] - off.y;
      buf[n * 6 + 5] = v[2] - off.z;
      n++;
    }
    this.activeBeamCount = n;
    this.beamSegments.geometry.setDrawRange(0, n * 2);
    this.beamSegments.geometry.attributes.position.needsUpdate = true;
  }

  // Project each visible cel-nav star to screen pixels and update the
  // SVG <line> elements going from screen-center (the eye) to the
  // star's pixel position. Lines for stars behind the camera or
  // outside the canvas viewport are hidden.
  _updateOpticalHud(stars, drawLines) {
    const cam = this.renderer?.sm?.camera;
    const canvas = this.renderer?.canvas;
    const svg = this._opticalHud;
    if (!cam || !canvas || !svg) return;

    const w = canvas.clientWidth || canvas.width || 1;
    const h = canvas.clientHeight || canvas.height || 1;
    const cx = w / 2, cy = h / 2;
    const ndc = (this._tmpNdc || (this._tmpNdc = new THREE.Vector3()));
    const lines = this._opticalHudLines;
    const rings = this._opticalHudRings;
    let i = 0;

    for (const star of stars) {
      if (!this._isEligibleStar(star)) continue;
      const v = star.opticalVaultCoord || star.vaultCoord;
      if (!v) continue;

      ndc.set(v[0], v[1], v[2]).project(cam);
      // Skip points behind the camera or outside the visible NDC box.
      if (ndc.z < -1 || ndc.z > 1) continue;
      if (ndc.x < -1.05 || ndc.x > 1.05 || ndc.y < -1.05 || ndc.y > 1.05) continue;

      const sx = (ndc.x * 0.5 + 0.5) * w;
      const sy = (1 - (ndc.y * 0.5 + 0.5)) * h;

      // Eye→star laser line — only in optical/first-person view.
      // In heavenly view the 3D LineSegments cone already shows the
      // sightlines, so we leave SVG lines hidden to avoid double draw.
      if (drawLines) {
        let line = lines[i];
        if (!line) {
          line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('stroke', '#66ffff');
          line.setAttribute('stroke-width', '2');
          line.setAttribute('stroke-opacity', '0.85');
          line.setAttribute('stroke-linecap', 'round');
          svg.appendChild(line);
          lines[i] = line;
        }
        line.setAttribute('x1', cx);
        line.setAttribute('y1', cy);
        line.setAttribute('x2', sx);
        line.setAttribute('y2', sy);
        line.style.display = '';
      } else if (lines[i]) {
        lines[i].style.display = 'none';
      }

      // κ-aberration trace ring: ellipse axes (κ, κ·|sin dec|) — the
      // path the star walks over a year due to 20.5″ aberration.
      let ring = rings[i];
      if (!ring) {
        ring = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', '#66ffff');
        ring.setAttribute('stroke-width', '1');
        ring.setAttribute('stroke-opacity', '0.45');
        svg.appendChild(ring);
        rings[i] = ring;
      }
      const decRad = (typeof star.dec === 'number') ? star.dec : 0;
      const minor = KAPPA_RING_PX * Math.max(0.15, Math.abs(Math.sin(decRad)));
      ring.setAttribute('cx', sx);
      ring.setAttribute('cy', sy);
      ring.setAttribute('rx', KAPPA_RING_PX);
      ring.setAttribute('ry', minor);
      ring.style.display = '';

      i++;
    }
    // Hide any leftover lines/rings from previous frames that no
    // longer have a corresponding visible star.
    for (let j = i; j < lines.length; j++) {
      if (lines[j]) lines[j].style.display = 'none';
    }
    for (let j = i; j < rings.length; j++) {
      if (rings[j]) rings[j].style.display = 'none';
    }
  }

  setWobbleOn(on) {
    this.wobbleOn = !!on;
    if (this.beamSegments) this.beamSegments.visible = this.wobbleOn;
    this._setOpticalHudVisible(this.wobbleOn);
    this._refreshToggleStyles?.();
  }

  setVortexOn(on) {
    this.vortexOn = !!on;
    this.model?.setState?.({ Cosmology: this.vortexOn ? 'vortex2' : 'none' });
    this._refreshToggleStyles?.();
  }

  buildControls(container) {
    const header = document.createElement('h3');
    header.textContent = 'Stellar Aberration';
    container.appendChild(header);

    const intro = document.createElement('div');
    intro.className = 'aberration-reveal-card';
    intro.innerHTML = `
      <span class="aberration-kicker">Kinematic equivalence</span>
      <strong>Same annual aberration angle. Two coordinate stories.</strong>
      <p class="aberration-formula">kappa = arctan(v / c) = ${KAPPA_ARCSEC.toFixed(2)} arcsec
        <span>(v = 30 km/s, c = 299,792 km/s)</span></p>
      <div class="kin-vs">
        <div class="kin-vs-helio">
          <div class="kin-vs-tag">Heliocentric</div>
          <p>Earth races through still aether at 30 km/s. The
          telescope must tilt forward by kappa to catch the light. As
          Earth's direction rotates over the year, every star traces
          the same 20.6 arcsec ellipse.</p>
          <p class="kin-vs-cost"><b>Cost:</b> requires a 30 km/s motion
          nobody can feel, plus an extra patch when Airy's water
          telescope (1871) refused to change the angle.</p>
        </div>
        <div class="kin-vs-fe">
          <div class="kin-vs-tag">Stationary topo plane</div>
          <p>Earth is still. The local aether sweeps past at 30 km/s.
          Light entering the telescope is deflected by exactly the
          same kappa. Same wobble, same 20.6 arcsec ellipse; no Earth motion
          invoked.</p>
          <p class="kin-vs-cost"><b>Bonus:</b> Airy 1871 is the natural
          prediction. Water inside the telescope doesn't change kappa
          because the wind, not Earth, is what's moving, and the
          aether co-moves with the water.</p>
        </div>
      </div>
      <span class="aberration-punch">Both frames yield the same kappa. The topo reading starts from the observer's measured sky and adds fewer hidden motions.</span>
    `;
    container.appendChild(intro);

    const facts = document.createElement('div');
    facts.className = 'aberration-facts';
    facts.innerHTML = `
      <div><b>Discoverer</b><span>James Bradley, 1727</span></div>
      <div><b>Observed</b><span>Every star traces the same ${KAPPA_ARCSEC.toFixed(2)} arcsec annual ellipse.</span></div>
      <div><b>Shared signal</b><span>The measured annual tilt is kappa = arctan(v / c), the same in both coordinate stories.</span></div>
      <div><b>Airy's failure</b><span>1871: water-filled telescope, kappa unchanged within the reported residual. That is the stationary-aether test the moving-Earth story struggled with.</span></div>
    `;
    container.appendChild(facts);

    // Native overlay toggles
    const toggles = document.createElement('div');
    toggles.className = 'aberration-toggles';

    const mkBtn = (label, key, getter, setter) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'aberration-toggle-btn';
      btn.dataset.key = key;
      const refresh = () => {
        const on = getter();
        btn.classList.toggle('on', !!on);
        btn.textContent = `${label}: ${on ? 'ON' : 'OFF'}`;
      };
      btn.addEventListener('click', () => {
        setter(!getter());
        refresh();
      });
      btn._refresh = refresh;
      refresh();
      return btn;
    };

    const wobbleBtn = mkBtn(
      'Wobbling sightlines to dome stars',
      'wobble',
      () => this.wobbleOn,
      (v) => this.setWobbleOn(v),
    );
    const vortexBtn = mkBtn(
      'Aether vortex tunnel',
      'vortex',
      () => this.vortexOn,
      (v) => this.setVortexOn(v),
    );
    const belowBtn = mkBtn(
      'Show below-horizon beams',
      'below',
      () => this.showBelowHorizon,
      (v) => { this.showBelowHorizon = !!v; },
    );
    toggles.append(wobbleBtn, vortexBtn, belowBtn);
    container.appendChild(toggles);

    this._toggleButtons = [wobbleBtn, vortexBtn, belowBtn];
    this._refreshToggleStyles = () => {
      for (const b of this._toggleButtons || []) b._refresh?.();
    };
  }

  // Side overlay: 2-panel SVG matching Bennett's slide framing.
  // Both panels show the SAME telescope tilt direction (left) — what
  // differs is which entity is moving:
  //   Helio: "Aether stationary, moving telescope" - telescope
  //             physically translates to the left, so it must be
  //             tilted left by κ to keep falling light inside the tube.
  //   FE: "Aether moving, stationary telescope" - aether (and
  //             the light it carries) sweeps leftward past a fixed
  //             telescope; the apparent source is shifted left, so
  //             the tube tilts left by exactly the same κ.
  // The visible κ in the SVG is exaggerated (~12°) so the geometry
  // reads at a glance; the real catalog κ is annotated.
  openEquivalenceOverlay() {
    if (this.equivalenceOverlay || typeof document === 'undefined') return;
    const overlay = document.createElement('div');
    overlay.className = 'aberration-equivalence-overlay';
    overlay.innerHTML = `
      <div class="aberration-equivalence-kicker">Kinematic equivalence (Bradley 1727)</div>
      <div class="aberration-equivalence-title">Same kappa = ${KAPPA_ARCSEC.toFixed(2)} arcsec: the telescope tilt matches in both frames</div>
      <svg class="aberration-equivalence-svg" viewBox="0 0 540 240" role="img" aria-label="Stellar aberration: aether stationary moving telescope vs aether moving stationary telescope">
        <!-- HELIO: Aether stationary, moving telescope -->
        <g class="cell helio">
          <rect x="6" y="10" width="258" height="220" rx="6"/>
          <text x="135" y="26" class="cell-title helio-text">Aether stationary / moving telescope</text>
          <!-- Star -->
          <circle cx="170" cy="48" r="4" class="star"/>
          <text x="170" y="38" class="tiny">star</text>
          <!-- Vertical light rays through still aether -->
          <line x1="150" y1="54" x2="150" y2="194" class="ray-still"/>
          <line x1="170" y1="54" x2="170" y2="194" class="ray-still"/>
          <line x1="190" y1="54" x2="190" y2="194" class="ray-still"/>
          <text x="222" y="120" class="tiny">light falls<tspan x="222" dy="11">vertically</tspan></text>
          <!-- Tilted telescope (top to upper-left, base at Earth).
               Tube tilts in the SAME direction as Earth's motion. -->
          <line x1="170" y1="195" x2="135" y2="120" class="telescope"/>
          <text x="118" y="115" class="tiny tilt-label">kappa tilt</text>
          <!-- κ arc between vertical and tube -->
          <path d="M 170 165 A 30 30 0 0 0 158 167" class="kappa-arc"/>
          <!-- Earth (moving leftward) -->
          <circle cx="170" cy="200" r="8" class="earth-moving"/>
          <!-- Velocity arrow LEFTWARD on Earth -->
          <line x1="170" y1="200" x2="128" y2="200" class="vel-arrow"/>
          <polygon points="128,196 120,200 128,204" class="vel-arrow-head"/>
          <text x="105" y="218" class="tiny" style="text-anchor:start;">Earth ← 30 km/s</text>
        </g>
        <!-- FE: Aether moving, stationary telescope -->
        <g class="cell fe">
          <rect x="270" y="10" width="264" height="220" rx="6"/>
          <text x="402" y="26" class="cell-title fe-text">Aether moving / stationary telescope</text>
          <!-- Star -->
          <circle cx="437" cy="48" r="4" class="star"/>
          <text x="437" y="38" class="tiny">star</text>
          <!-- Aether wind arrows pointing LEFT across the panel -->
          <g class="wind">
            <line x1="510" y1="78" x2="468" y2="78"/>
            <polygon points="468,74 460,78 468,82"/>
            <line x1="510" y1="118" x2="468" y2="118"/>
            <polygon points="468,114 460,118 468,122"/>
            <line x1="510" y1="158" x2="468" y2="158"/>
            <polygon points="468,154 460,158 468,162"/>
          </g>
          <text x="510" y="66" class="tiny" style="text-anchor:end;">aether wind ← 30 km/s</text>
          <!-- Light path: starts vertically above star, then is dragged
               leftward by the aether wind on its way down. The
               apparent source direction is therefore upper-LEFT. -->
          <path d="M 437 54 Q 433 120 405 195" class="ray-bent"/>
          <text x="350" y="100" class="tiny" style="text-anchor:end;">light dragged by<tspan x="350" dy="11">aether wind</tspan></text>
          <!-- Earth (stationary) -->
          <circle cx="405" cy="200" r="8" class="earth-still"/>
          <text x="405" y="219" class="tiny">Earth (still)</text>
          <!-- Telescope tilted upper-LEFT, SAME κ as helio panel -->
          <line x1="405" y1="195" x2="370" y2="120" class="telescope"/>
          <text x="353" y="115" class="tiny tilt-label">kappa tilt</text>
          <path d="M 405 165 A 30 30 0 0 0 393 167" class="kappa-arc"/>
        </g>
      </svg>
      <div class="aberration-equivalence-note">
        <b>Airy 1871:</b> filling the telescope with water did NOT
        change kappa. Moving-Earth predicts kappa should scale by the refractive
        index n. Stationary Earth + co-moving aether (the right panel)
        predicts no meaningful change, which is what Airy actually measured.
        Bradley's 0.8 arcsec residual stays far below the competing
        30 arcsec disagreement.
      </div>
      <div class="aberration-equivalence-foot">
        Drawn kappa is exaggerated so the tilt is legible. Real
        catalog kappa = ${KAPPA_ARCSEC.toFixed(2)} arcsec in both panels.
      </div>
    `;
    const host = document.getElementById('view') || document.body;
    host.appendChild(overlay);
    this.equivalenceOverlay = overlay;
  }

  closeEquivalenceOverlay() {
    this.equivalenceOverlay?.remove?.();
    this.equivalenceOverlay = null;
  }

  getInfoPanel() {
    return `
      <h3>Stellar Aberration - kinematic equivalence</h3>
      <p class="aberration-info-lede">Bradley (1727): every star traces the
      same ${KAPPA_ARCSEC.toFixed(2)} arcsec annual ellipse. The
      kinematic question is which relative motion carries that angle:
      Earth moving through the medium, or the local medium moving past
      a stationary observer.</p>
      <div class="aberration-info-vs">
        <div class="aberration-info-card aberration-info-helio">
          <div class="aberration-info-tag">Heliocentric explanation</div>
          <ul>
            <li>Earth orbits the Sun at v = 30 km/s through still aether or empty space.</li>
            <li>To catch starlight, the telescope is tilted forward by kappa = arctan(v/c) = ${KAPPA_ARCSEC.toFixed(2)} arcsec.</li>
            <li>As Earth's velocity vector rotates over the year, the apparent star position traces the annual ellipse.</li>
            <li><b>Airy 1871 problem:</b> water inside the telescope should change kappa. The measured angle did not follow that prediction.</li>
          </ul>
        </div>
        <div class="aberration-info-card aberration-info-fe">
          <div class="aberration-info-tag">Stationary geocentric topo plane</div>
          <ul>
            <li>Earth is still. Local aether sweeps past at v = 30 km/s.</li>
            <li>Light traversing that wind is deflected by kappa = arctan(v/c) = ${KAPPA_ARCSEC.toFixed(2)} arcsec, the identical formula.</li>
            <li>The annual ellipse comes from the wind direction rotating with the year (not Earth doing the moving).</li>
            <li><b>Airy 1871 prediction:</b> the aether co-moves with the water inside the telescope, so kappa stays the same apart from tiny residuals. That matches the measured result.</li>
          </ul>
        </div>
      </div>
      <p class="aberration-info-punch">Both frames yield kappa = ${KAPPA_ARCSEC.toFixed(2)} arcsec.
      Only the stationary-Earth frame predicts Airy's null result without
      patching. Aberration is consistent with, and more cleanly explained by,
      a stationary Earth inside locally co-moving aether.</p>
    `;
  }
}

export default AberrationExperiment;
