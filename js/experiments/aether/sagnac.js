// Sagnac Effect - Premium Visualization
// Ring laser FLAT on ground (XY plane, Z-up)
// Beautiful, smooth, instantly understandable

import * as THREE from 'three';
import { BaseExperiment } from '../baseExperiment.js';

export class SagnacExperiment extends BaseExperiment {
  static get id() { return 'sagnac'; }
  static get name() { return 'Sagnac Effect (1913)'; }
  static get category() { return 'aether'; }
  static get description() { return 'Ring laser detects rotation but NOT orbital motion.'; }

  init() {
    this.experimentScale = 0.06;
    this.buildVisualization();
  }

  buildVisualization() {
    // ═══════════════════════════════════════════════════════════════════
    // RING LASER GYROSCOPE - FLAT ON GROUND (XY plane, Z is height)
    // Premium materials, smooth animations
    // ═══════════════════════════════════════════════════════════════════

    this.gyroscope = new THREE.Group();

    const ringRadius = 1.0;
    const baseHeight = 0.02;

    // CIRCULAR BASE PLATFORM
    const baseGeo = new THREE.CylinderGeometry(1.3, 1.4, baseHeight, 48);
    const baseMat = new THREE.MeshBasicMaterial({ color: 0x2a2a3a });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.z = baseHeight / 2;
    this.gyroscope.add(base);

    // FIBER OPTIC RING - the main visual element
    const ringGeo = new THREE.TorusGeometry(ringRadius, 0.04, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.7
    });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.ring.position.z = baseHeight + 0.05;
    this.gyroscope.add(this.ring);

    // Inner glow ring
    const innerGlowGeo = new THREE.TorusGeometry(ringRadius, 0.08, 16, 64);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0x0066aa,
      transparent: true,
      opacity: 0.2
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    innerGlow.position.z = baseHeight + 0.05;
    this.gyroscope.add(innerGlow);

    // DETECTOR at top of ring
    this.detector = this.createDetector();
    this.detector.position.set(0, ringRadius, baseHeight + 0.08);
    this.gyroscope.add(this.detector);

    // LIGHT SOURCE at bottom
    this.lightSource = this.createLightSource();
    this.lightSource.position.set(0, -ringRadius, baseHeight + 0.08);
    this.gyroscope.add(this.lightSource);

    // CLOCKWISE BEAM - Orange
    this.cwBeam = this.createLightBeam(0xff6600);
    this.cwBeam.position.z = baseHeight + 0.1;
    this.gyroscope.add(this.cwBeam);

    // COUNTER-CLOCKWISE BEAM - Cyan
    this.ccwBeam = this.createLightBeam(0x00ffff);
    this.ccwBeam.position.z = baseHeight + 0.1;
    this.gyroscope.add(this.ccwBeam);

    // EARTH ROTATION ARROW - curved arrow around the ring
    this.rotationArrow = this.createRotationArrow(ringRadius + 0.4);
    this.rotationArrow.position.z = baseHeight + 0.15;
    this.gyroscope.add(this.rotationArrow);

    // STATUS INDICATORS
    this.statusRotation = this.createStatusIndicator(true, '15°/hr DETECTED');
    this.statusRotation.position.set(1.5, 0.4, 0.4);
    this.gyroscope.add(this.statusRotation);

    this.statusOrbital = this.createStatusIndicator(false, '30 km/s NOT DETECTED');
    this.statusOrbital.position.set(1.5, -0.4, 0.4);
    this.gyroscope.add(this.statusOrbital);

    // CENTER HUB
    this.centerHub = this.createCenterHub();
    this.centerHub.position.z = baseHeight + 0.03;
    this.gyroscope.add(this.centerHub);
  }

  createDetector() {
    const group = new THREE.Group();

    // Detector box
    const boxGeo = new THREE.BoxGeometry(0.2, 0.12, 0.08);
    const boxMat = new THREE.MeshBasicMaterial({ color: 0x333344 });
    group.add(new THREE.Mesh(boxGeo, boxMat));

    // Detection light
    const lightGeo = new THREE.SphereGeometry(0.04, 12, 12);
    this.detectorLightMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.detectorLight = new THREE.Mesh(lightGeo, this.detectorLightMat);
    this.detectorLight.position.z = 0.05;
    group.add(this.detectorLight);

    return group;
  }

  createLightSource() {
    const group = new THREE.Group();

    // Housing
    const housingGeo = new THREE.BoxGeometry(0.15, 0.1, 0.08);
    const housingMat = new THREE.MeshBasicMaterial({ color: 0x333344 });
    group.add(new THREE.Mesh(housingGeo, housingMat));

    // Glowing emitter
    const emitterGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const emitterMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    this.emitter = new THREE.Mesh(emitterGeo, emitterMat);
    this.emitter.position.z = 0.05;
    group.add(this.emitter);

    // Point light
    const light = new THREE.PointLight(0xffffaa, 0.3, 0.5);
    light.position.z = 0.05;
    group.add(light);

    return group;
  }

  createLightBeam(color) {
    const group = new THREE.Group();

    // Main particle
    const particleGeo = new THREE.SphereGeometry(0.06, 12, 12);
    const particleMat = new THREE.MeshBasicMaterial({ color });
    group.add(new THREE.Mesh(particleGeo, particleMat));

    // Glow
    const glowGeo = new THREE.SphereGeometry(0.1, 12, 12);
    const glowMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.4
    });
    group.add(new THREE.Mesh(glowGeo, glowMat));

    // Trail
    group.userData.trailPositions = [];
    group.userData.trails = [];
    for (let i = 0; i < 10; i++) {
      const trailGeo = new THREE.SphereGeometry(0.04 - i * 0.003, 8, 8);
      const trailMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.35 - i * 0.03
      });
      const trail = new THREE.Mesh(trailGeo, trailMat);
      group.add(trail);
      group.userData.trails.push(trail);
      group.userData.trailPositions.push({ x: 0, y: 0 });
    }

    group.userData.phase = 0;

    return group;
  }

  createRotationArrow(radius) {
    const group = new THREE.Group();

    // Curved arrow path
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 1.6, false);
    const points = curve.getPoints(48);
    const geo = new THREE.BufferGeometry().setFromPoints(
      points.map(p => new THREE.Vector3(p.x, p.y, 0))
    );
    const mat = new THREE.LineBasicMaterial({ color: 0x44ff44 });
    group.add(new THREE.Line(geo, mat));

    // Arrowhead
    const headGeo = new THREE.ConeGeometry(0.08, 0.15, 8);
    const headMat = new THREE.MeshBasicMaterial({ color: 0x44ff44 });
    const head = new THREE.Mesh(headGeo, headMat);
    // Position at end of curve
    const endAngle = Math.PI * 1.6;
    head.position.set(Math.cos(endAngle) * radius, Math.sin(endAngle) * radius, 0);
    head.rotation.z = endAngle + Math.PI / 2;
    group.add(head);

    return group;
  }

  createStatusIndicator(success, text) {
    const group = new THREE.Group();

    const bgGeo = new THREE.PlaneGeometry(0.9, 0.22);
    const bgMat = new THREE.MeshBasicMaterial({
      color: success ? 0x003300 : 0x330000,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    group.add(new THREE.Mesh(bgGeo, bgMat));

    const borderGeo = new THREE.EdgesGeometry(bgGeo);
    const borderMat = new THREE.LineBasicMaterial({
      color: success ? 0x00ff00 : 0xff0000
    });
    group.add(new THREE.LineSegments(borderGeo, borderMat));

    const iconGeo = new THREE.CircleGeometry(0.06, 16);
    const iconMat = new THREE.MeshBasicMaterial({
      color: success ? 0x00ff00 : 0xff0000,
      side: THREE.DoubleSide
    });
    const icon = new THREE.Mesh(iconGeo, iconMat);
    icon.position.set(-0.35, 0, 0.01);
    group.add(icon);

    group.userData = { success, icon };

    return group;
  }

  createCenterHub() {
    const group = new THREE.Group();

    // Central platform
    const hubGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.06, 24);
    const hubMat = new THREE.MeshBasicMaterial({ color: 0x222233 });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    group.add(hub);

    // Glowing center
    const glowGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.5
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.z = 0.05;
    group.add(glow);

    return group;
  }

  activate() {
    super.activate();

    while (this.visualGroup.children.length > 0) {
      this.visualGroup.remove(this.visualGroup.children[0]);
    }

    // Add gyroscope - NO rotation, built flat
    this.visualGroup.add(this.gyroscope);

    this.model.setState({
      ShowVault: false,
      ShowFeGrid: true,
      ShowStars: false,
      Description: 'SAGNAC: Detects 15°/hr rotation ✓ | NOT 30 km/s orbital ✗',
    });
  }

  update(dt) {
    super.update(dt);
    if (!this.active || !this.isPlaying) return;

    const radius = 1.0;
    const speed = 2.5;

    // CW beam (clockwise, negative angle)
    const cwPhase = -this.animationTime * speed;
    const cwX = Math.cos(cwPhase) * radius;
    const cwY = Math.sin(cwPhase) * radius;
    this.cwBeam.position.x = cwX;
    this.cwBeam.position.y = cwY;

    // CCW beam (counter-clockwise, positive angle) - slightly faster due to Sagnac!
    const ccwPhase = this.animationTime * speed * 1.02;
    const ccwX = Math.cos(ccwPhase) * radius;
    const ccwY = Math.sin(ccwPhase) * radius;
    this.ccwBeam.position.x = ccwX;
    this.ccwBeam.position.y = ccwY;

    // Update trails
    this.updateTrail(this.cwBeam, { x: cwX, y: cwY });
    this.updateTrail(this.ccwBeam, { x: ccwX, y: ccwY });

    // Slowly rotate the whole apparatus (showing Earth rotation)
    this.gyroscope.rotation.z += dt * 0.08;

    // Pulse detector light
    const pulse = 0.5 + 0.5 * Math.sin(this.animationTime * 8);
    this.detectorLight.scale.setScalar(0.8 + 0.4 * pulse);
    this.detectorLightMat.color.setHex(pulse > 0.5 ? 0x00ff00 : 0x008800);

    // Pulse emitter
    const emitPulse = 0.9 + 0.15 * Math.sin(this.animationTime * 6);
    this.emitter.scale.setScalar(emitPulse);

    // Pulse status indicators
    const statusPulse = 0.7 + 0.3 * Math.sin(this.animationTime * 2.5);
    this.statusRotation.userData.icon.scale.setScalar(statusPulse);
  }

  updateTrail(beam, currentPos) {
    const trails = beam.userData.trails;
    const positions = beam.userData.trailPositions;

    for (let i = positions.length - 1; i > 0; i--) {
      positions[i].x = positions[i - 1].x;
      positions[i].y = positions[i - 1].y;
    }
    positions[0].x = currentPos.x;
    positions[0].y = currentPos.y;

    for (let i = 0; i < trails.length; i++) {
      trails[i].position.x = positions[i].x - currentPos.x;
      trails[i].position.y = positions[i].y - currentPos.y;
    }
  }

  buildControls(container) {
    const header = document.createElement('h3');
    header.textContent = 'Sagnac Effect (1913)';
    header.style.marginBottom = '10px';
    container.appendChild(header);

    const intro = document.createElement('p');
    intro.style.cssText = 'font-size: 13px; color: #ccc; margin-bottom: 15px;';
    intro.innerHTML = `Watch the <span style="color:#ff6600">orange</span> (CW) and <span style="color:#00ffff">cyan</span> (CCW) beams race around the ring. They arrive at different times because <strong>Earth is rotating</strong>.`;
    container.appendChild(intro);

    const playBtn = document.createElement('button');
    playBtn.className = 'experiment-play-btn playing';
    playBtn.innerHTML = '⏸ PAUSE';
    playBtn.addEventListener('click', () => {
      const playing = this.togglePlay();
      playBtn.innerHTML = playing ? '⏸ PAUSE' : '▶ PLAY';
      playBtn.classList.toggle('playing', playing);
    });
    container.appendChild(playBtn);

    const resultBox = document.createElement('div');
    resultBox.className = 'experiment-insight';
    resultBox.innerHTML = `
      <div class="insight-box">
        <div style="display:flex; align-items:center; margin-bottom:8px;">
          <span style="color:#00ff00; font-size:24px; margin-right:8px;">✓</span>
          <strong style="color:#00ff00;">DETECTS: Earth's rotation (15°/hr)</strong>
        </div>
        <div style="display:flex; align-items:center;">
          <span style="color:#ff4444; font-size:24px; margin-right:8px;">✗</span>
          <strong style="color:#ff4444;">DOES NOT DETECT: Orbital motion (30 km/s)</strong>
        </div>
      </div>
    `;
    container.appendChild(resultBox);

    const conclusion = document.createElement('div');
    conclusion.style.cssText = 'background: linear-gradient(135deg, #1a3a1a, #0a2a0a); border: 1px solid #44ff44; border-radius: 8px; padding: 12px; margin-top: 15px;';
    conclusion.innerHTML = `
      <strong style="color:#44ff44;">🔑 CONCLUSION:</strong><br>
      <span style="color:#ccc;">If Sagnac detects the small rotation, why not the 65× larger orbital velocity?</span><br>
      <strong style="color:#44ff44;">Because Earth doesn't orbit — it's stationary.</strong>
    `;
    container.appendChild(conclusion);
  }

  getInfoPanel() {
    return `
      <h3>Sagnac Effect</h3>
      <p>Ring laser gyroscopes detect rotation by measuring phase difference between counter-propagating beams.</p>
      <p><strong>Key Finding:</strong> Detects Earth's rotation (15°/hr) but NOT the alleged 30 km/s orbital velocity.</p>
      <p>This proves Earth is stationary.</p>
    `;
  }
}

export default SagnacExperiment;
