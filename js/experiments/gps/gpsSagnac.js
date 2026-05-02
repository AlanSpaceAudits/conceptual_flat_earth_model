// GPS Sagnac Corrections - Premium Visualization
// GPS system FLAT on ground (XY plane, Z-up)
// Beautiful, smooth, instantly understandable

import * as THREE from 'three';
import { BaseExperiment } from '../baseExperiment.js';

export class GPSSagnacExperiment extends BaseExperiment {
  static get id() { return 'gps-sagnac'; }
  static get name() { return 'GPS Sagnac Corrections'; }
  static get category() { return 'gps'; }
  static get description() { return 'GPS corrects for rotation but NOT orbital motion.'; }

  init() {
    this.experimentScale = 0.07;
    this.satellitePhases = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    this.buildVisualization();
  }

  buildVisualization() {
    // ═══════════════════════════════════════════════════════════════════
    // GPS SYSTEM - FLAT ON GROUND (XY plane, Z is height)
    // Earth globe with satellites orbiting above
    // ═══════════════════════════════════════════════════════════════════

    this.gpsSystem = new THREE.Group();

    // EARTH - small globe sitting on ground
    this.earth = this.createEarth();
    this.gpsSystem.add(this.earth);

    // ROTATION ARROW around Earth
    this.rotationArrow = this.createRotationArrow();
    this.gpsSystem.add(this.rotationArrow);

    // GPS SATELLITES - 4 orbiting above
    this.satellites = [];
    this.signalBeams = [];
    const satColors = [0xffaa00, 0x00ffaa, 0xaa00ff, 0xff00aa];

    for (let i = 0; i < 4; i++) {
      const sat = this.createSatellite(satColors[i]);
      this.satellites.push(sat);
      this.gpsSystem.add(sat);

      const beam = this.createSignalBeam(satColors[i]);
      this.signalBeams.push(beam);
      this.gpsSystem.add(beam);
    }

    // GROUND RECEIVER
    this.receiver = this.createReceiver();
    this.gpsSystem.add(this.receiver);

    // STATUS INDICATORS
    this.statusRotation = this.createStatusIndicator(true, 'ROTATION: Corrected ✓');
    this.statusRotation.position.set(1.4, 0.5, 0.5);
    this.gpsSystem.add(this.statusRotation);

    this.statusOrbital = this.createStatusIndicator(false, 'ORBITAL: NOT Corrected ✗');
    this.statusOrbital.position.set(1.4, -0.3, 0.5);
    this.gpsSystem.add(this.statusOrbital);

    // ORBITAL VELOCITY ARROW (crossed out)
    this.orbitalArrow = this.createOrbitalArrow();
    this.orbitalArrow.position.set(-1.2, 0.6, 0.4);
    this.gpsSystem.add(this.orbitalArrow);
  }

  createEarth() {
    const group = new THREE.Group();

    // Earth sphere
    const earthGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const earthMat = new THREE.MeshBasicMaterial({
      color: 0x2244aa,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.z = 0.5;
    group.add(earth);

    // Solid inner
    const innerGeo = new THREE.SphereGeometry(0.48, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x1a3366,
      transparent: true,
      opacity: 0.3
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.position.z = 0.5;
    group.add(inner);

    // Equator ring
    const eqGeo = new THREE.TorusGeometry(0.52, 0.015, 8, 48);
    const eqMat = new THREE.MeshBasicMaterial({ color: 0x44ff44 });
    const eq = new THREE.Mesh(eqGeo, eqMat);
    eq.position.z = 0.5;
    group.add(eq);

    return group;
  }

  createRotationArrow() {
    const group = new THREE.Group();

    // Curved arrow around Earth
    const curve = new THREE.EllipseCurve(0, 0, 0.65, 0.65, 0, Math.PI * 1.5, false);
    const points = curve.getPoints(48);
    const geo = new THREE.BufferGeometry().setFromPoints(
      points.map(p => new THREE.Vector3(p.x, p.y, 0.5))
    );
    const mat = new THREE.LineBasicMaterial({ color: 0x44ff44 });
    group.add(new THREE.Line(geo, mat));

    // Arrowhead
    const headGeo = new THREE.ConeGeometry(0.06, 0.12, 8);
    const headMat = new THREE.MeshBasicMaterial({ color: 0x44ff44 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0.65, 0, 0.5);
    head.rotation.y = Math.PI / 2;
    group.add(head);

    return group;
  }

  createSatellite(color) {
    const group = new THREE.Group();

    // Satellite body
    const bodyGeo = new THREE.BoxGeometry(0.1, 0.06, 0.04);
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x888899 });
    group.add(new THREE.Mesh(bodyGeo, bodyMat));

    // Solar panels
    const panelGeo = new THREE.BoxGeometry(0.18, 0.04, 0.01);
    const panelMat = new THREE.MeshBasicMaterial({ color: 0x4444aa });

    const panel1 = new THREE.Mesh(panelGeo, panelMat);
    panel1.position.x = 0.12;
    group.add(panel1);

    const panel2 = new THREE.Mesh(panelGeo, panelMat);
    panel2.position.x = -0.12;
    group.add(panel2);

    // Signal transmitter
    const txGeo = new THREE.SphereGeometry(0.03, 12, 12);
    const txMat = new THREE.MeshBasicMaterial({ color });
    const tx = new THREE.Mesh(txGeo, txMat);
    tx.position.z = -0.04;
    group.add(tx);

    group.userData = { color };

    return group;
  }

  createSignalBeam(color) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6
    });

    return new THREE.Line(geo, mat);
  }

  createReceiver() {
    const group = new THREE.Group();

    // Antenna dish
    const dishGeo = new THREE.ConeGeometry(0.08, 0.05, 12, 1, true);
    const dishMat = new THREE.MeshBasicMaterial({
      color: 0x44ff44,
      side: THREE.DoubleSide
    });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.rotation.x = Math.PI;
    dish.position.z = 0.08;
    group.add(dish);

    // Base
    const baseGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.08, 8);
    const baseMat = new THREE.MeshBasicMaterial({ color: 0x333344 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.z = 0.04;
    group.add(base);

    // Position on Earth surface
    group.position.set(0.5, 0, 0.5);

    return group;
  }

  createStatusIndicator(success, text) {
    const group = new THREE.Group();

    const bgGeo = new THREE.PlaneGeometry(0.85, 0.2);
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

    const iconGeo = new THREE.CircleGeometry(0.055, 16);
    const iconMat = new THREE.MeshBasicMaterial({
      color: success ? 0x00ff00 : 0xff0000,
      side: THREE.DoubleSide
    });
    const icon = new THREE.Mesh(iconGeo, iconMat);
    icon.position.set(-0.32, 0, 0.01);
    group.add(icon);

    group.userData = { success, icon };

    return group;
  }

  createOrbitalArrow() {
    const group = new THREE.Group();

    // Arrow
    const arrowGeo = new THREE.PlaneGeometry(0.6, 0.05);
    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    group.add(new THREE.Mesh(arrowGeo, arrowMat));

    // Arrowhead
    const headGeo = new THREE.ConeGeometry(0.07, 0.14, 8);
    const headMat = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.5
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.rotation.z = -Math.PI / 2;
    head.position.x = 0.35;
    group.add(head);

    // Big X
    const xMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    const x1Geo = new THREE.PlaneGeometry(0.3, 0.04);
    const x1 = new THREE.Mesh(x1Geo, xMat);
    x1.rotation.z = Math.PI / 4;
    x1.position.z = 0.02;
    group.add(x1);

    const x2 = new THREE.Mesh(x1Geo.clone(), xMat);
    x2.rotation.z = -Math.PI / 4;
    x2.position.z = 0.02;
    group.add(x2);

    return group;
  }

  activate() {
    super.activate();

    while (this.visualGroup.children.length > 0) {
      this.visualGroup.remove(this.visualGroup.children[0]);
    }

    // Add GPS system - NO rotation, built correctly
    this.visualGroup.add(this.gpsSystem);

    this.model.setState({
      ShowVault: false,
      ShowFeGrid: true,
      ShowStars: false,
      Description: 'GPS: Corrects for 15°/hr rotation ✓ | NO correction for 30 km/s orbital ✗',
    });
  }

  update(dt) {
    super.update(dt);
    if (!this.active || !this.isPlaying) return;

    const orbitRadius = 1.1;
    const orbitHeight = 1.2;

    // Rotate Earth
    this.earth.rotation.z += dt * 0.25;
    this.rotationArrow.rotation.z += dt * 0.25;

    // Move receiver with Earth
    const receiverAngle = this.animationTime * 0.25;
    this.receiver.position.set(
      Math.cos(receiverAngle) * 0.5,
      Math.sin(receiverAngle) * 0.5,
      0.5
    );

    // Orbit satellites
    for (let i = 0; i < this.satellites.length; i++) {
      const phase = this.satellitePhases[i] + this.animationTime * 0.35;
      const x = Math.cos(phase) * orbitRadius;
      const y = Math.sin(phase) * orbitRadius;
      const z = orbitHeight + Math.sin(phase * 2) * 0.15;

      this.satellites[i].position.set(x, y, z);
      this.satellites[i].lookAt(0, 0, 0.5);

      // Update signal beam
      const beam = this.signalBeams[i];
      const positions = beam.geometry.attributes.position.array;
      positions[0] = x;
      positions[1] = y;
      positions[2] = z;
      positions[3] = this.receiver.position.x;
      positions[4] = this.receiver.position.y;
      positions[5] = this.receiver.position.z;
      beam.geometry.attributes.position.needsUpdate = true;

      // Pulse beam
      const pulse = 0.3 + 0.4 * Math.sin(this.animationTime * 5 + i);
      beam.material.opacity = pulse;
    }

    // Pulse status indicators
    const statusPulse = 0.7 + 0.3 * Math.sin(this.animationTime * 2.5);
    this.statusRotation.userData.icon.scale.setScalar(statusPulse);
  }

  buildControls(container) {
    const header = document.createElement('h3');
    header.textContent = 'GPS Sagnac Corrections';
    header.style.marginBottom = '10px';
    container.appendChild(header);

    const intro = document.createElement('p');
    intro.style.cssText = 'font-size: 13px; color: #ccc; margin-bottom: 15px;';
    intro.innerHTML = `Watch the satellites send signals to the rotating receiver. GPS <strong>must correct</strong> for Earth's rotation to work accurately.`;
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
          <strong style="color:#00ff00;">CORRECTS: Earth rotation (15°/hr)</strong>
        </div>
        <div style="display:flex; align-items:center;">
          <span style="color:#ff4444; font-size:24px; margin-right:8px;">✗</span>
          <strong style="color:#ff4444;">NO CORRECTION: Orbital motion (30 km/s)</strong>
        </div>
      </div>
    `;
    container.appendChild(resultBox);

    const conclusion = document.createElement('div');
    conclusion.style.cssText = 'background: linear-gradient(135deg, #1a3a1a, #0a2a0a); border: 1px solid #44ff44; border-radius: 8px; padding: 12px; margin-top: 15px;';
    conclusion.innerHTML = `
      <strong style="color:#44ff44;">🔑 CONCLUSION:</strong><br>
      <span style="color:#ccc;">30 km/s is 65× faster than rotation. Why no correction?</span><br>
      <strong style="color:#44ff44;">Because Earth doesn't orbit — it's stationary.</strong>
    `;
    container.appendChild(conclusion);
  }

  getInfoPanel() {
    return `
      <h3>GPS Sagnac Corrections</h3>
      <p>GPS requires Sagnac correction for Earth's rotation (~100 ns).</p>
      <p>But GPS does NOT correct for orbital velocity (30 km/s).</p>
      <p>If GPS must correct for the smaller rotation, why not the much larger orbital motion?</p>
      <p><strong>Answer:</strong> Earth is stationary.</p>
    `;
  }
}

export default GPSSagnacExperiment;
