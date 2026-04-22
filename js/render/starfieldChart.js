// Textured starfield: a flat circular mesh at the starfield altitude that
// carries a polar star-chart image instead of the procedural point cloud.
// Two texture variants are provided (dark and light background). The disc
// rotates with the sky so stars track real time exactly like the random
// cloud does.

import * as THREE from 'three';
import { FE_RADIUS } from '../core/constants.js';

export class StarfieldChart {
  constructor(clippingPlanes = []) {
    this.group = new THREE.Group();
    this.group.name = 'starfield-chart';
    this.group.visible = false;

    const loader = new THREE.TextureLoader();
    this.texDark  = loader.load('assets/starfield_dark.png');
    this.texLight = loader.load('assets/starfield_light.png');
    // Source PNGs are 1920×1080 with the circular chart inscribed in the
    // centre 1080×1080 region; crop the texture UVs so the chart fills the
    // disc geometry instead of leaving black bars around it.
    const cropX = 1080 / 1920;
    const offX  = (1 - cropX) / 2;
    for (const t of [this.texDark, this.texLight]) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter  = THREE.LinearMipMapLinearFilter;
      t.magFilter  = THREE.LinearFilter;
      t.anisotropy = 4;
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.repeat.set(cropX, 1);
      t.offset.set(offX, 0);
    }

    // Heavenly-vault disc: flat circle at the north-pole origin, same
    // radius as the FE map so it aligns with the land top-down.
    const domeGeom = new THREE.CircleGeometry(FE_RADIUS, 128);
    this.material = new THREE.MeshBasicMaterial({
      map: this.texDark,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      clippingPlanes,
    });
    this.mesh = new THREE.Mesh(domeGeom, this.material);
    this.mesh.renderOrder = 52;
    this.group.add(this.mesh);

    // Observer-local disc: same texture and radius as the heavenly-vault
    // copy, but positioned directly above the observer at the optical-
    // vault altitude so the chart stays centred over the first-person view
    // regardless of observer latitude.
    const localGeom = new THREE.CircleGeometry(FE_RADIUS, 128);
    this.localMesh = new THREE.Mesh(localGeom, this.material);
    this.localMesh.renderOrder = 53;
    this.group.add(this.localMesh);
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    const type = s.StarfieldType || 'random';
    const isChart = type === 'chart-dark' || type === 'chart-light';

    // Visible whenever the chart option is active and stars aren't globally
    // disabled. Stays visible in first-person too — the observer looking up
    // sees the chart directly overhead at the starfield altitude.
    this.group.visible = isChart && (s.ShowStars !== false);
    if (!this.group.visible) return;

    const tex = type === 'chart-light' ? this.texLight : this.texDark;
    if (this.material.map !== tex) {
      this.material.map = tex;
      this.material.needsUpdate = true;
    }

    // Fade with the sun just like the random starfield.
    const nightAlpha = s.DynamicStars ? c.NightFactor : 1.0;
    this.material.opacity = nightAlpha;

    // Heavenly-vault disc: park at the disc origin + starfield altitude,
    // rotating with the sky.
    this.mesh.position.set(0, 0, s.StarfieldVaultHeight);
    this.mesh.rotation.z = -c.SkyRotAngle * Math.PI / 180;

    // Observer-local disc: sits directly over the observer at their
    // optical-vault altitude. Hidden when the optical vault itself is
    // hidden or when the user is in the orbital view — the heavenly-vault
    // copy is still visible there.
    const obs = c.ObserverFeCoord;
    this.localMesh.position.set(obs[0], obs[1], obs[2] + c.OpticalVaultHeight);
    this.localMesh.rotation.z = -c.SkyRotAngle * Math.PI / 180;
    this.localMesh.visible = s.ShowOpticalVault !== false;
  }
}
