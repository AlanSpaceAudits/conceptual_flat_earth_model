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
    for (const t of [this.texDark, this.texLight]) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter  = THREE.LinearMipMapLinearFilter;
      t.magFilter  = THREE.LinearFilter;
      t.anisotropy = 4;
    }

    const geom = new THREE.CircleGeometry(FE_RADIUS, 128);
    this.material = new THREE.MeshBasicMaterial({
      map: this.texDark,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      clippingPlanes,
    });
    this.mesh = new THREE.Mesh(geom, this.material);
    this.mesh.renderOrder = 52;   // above shadow / dome shell, below markers
    this.group.add(this.mesh);
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

    // Park the disc at the starfield altitude and spin it with the sky.
    this.mesh.position.z = s.StarfieldVaultHeight;
    this.mesh.rotation.z = -c.SkyRotAngle * Math.PI / 180;
  }
}
