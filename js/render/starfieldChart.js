// Textured starfield: two copies of a polar star-chart texture.
//
// 1. Heavenly-vault disc: flat circle at the FE disc centre, radius
//    FE_RADIUS, lifted to the starfield altitude. Rotates with sidereal
//    time. Visible from orbital and first-person views alike.
//
// 2. Observer-local dome: a unit hemisphere scaled to the observer's
//    optical-vault dimensions (OpticalVaultRadius × OpticalVaultRadius ×
//    OpticalVaultHeight). A ShaderMaterial samples the chart by
//    back-projecting each fragment's local-globe direction through the
//    inverse of TransMatCelestToGlobe, so the chart is astronomically
//    correct: NCP stays near the zenith at high latitudes and rotates
//    toward the horizon as the observer moves south.

import * as THREE from 'three';
import { FE_RADIUS } from '../core/constants.js';
import { ToRad } from '../math/utils.js';

const VERT_SHADER = `
  varying vec3 vLocalGlobe;

  void main() {
    // Vertex is a point on a unit hemisphere in local-FE frame:
    //   x = radial outward (away from disc centre)
    //   y = east
    //   z = up
    // Convert to local-globe (x = zenith, y = east, z = north).
    //   zenith = up       = z
    //   east   = east     = y
    //   north  = -radial  = -x   (north is TOWARD the pole on an FE disc)
    vLocalGlobe = normalize(vec3(position.z, position.y, -position.x));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG_SHADER = `
  precision highp float;

  uniform sampler2D uChart;
  uniform mat3      uGlobeToCelest;   // inverse of TransMatCelestToGlobe
  uniform vec2      uTexRepeat;       // chart crop, horizontal
  uniform vec2      uTexOffset;
  uniform float     uOpacity;

  varying vec3 vLocalGlobe;

  const float RAD2DEG = 57.2957795;

  void main() {
    vec3 celest = normalize(uGlobeToCelest * vLocalGlobe);
    float dec = asin(clamp(celest.z, -1.0, 1.0));   // radians, +π/2 = NCP
    float ra  = atan(celest.y, celest.x);            // radians

    // Polar AE: chart centre (UV 0.5,0.5) = NCP, UV radius 0.5 = SCP.
    float rUV = (90.0 - dec * RAD2DEG) / 360.0;      // 0..0.5
    vec2 uvRaw = vec2(0.5 + rUV * cos(ra), 0.5 + rUV * sin(ra));

    vec2 uv = uvRaw * uTexRepeat + uTexOffset;
    vec4 samp = texture2D(uChart, uv);
    gl_FragColor = vec4(samp.rgb, samp.a * uOpacity);
  }
`;

// Unit hemisphere in local-FE frame: radial-outward +x, east +y, up +z.
function buildHemisphereGeom(rings = 32, segs = 96) {
  const positions = [];
  const indices = [];
  for (let i = 0; i <= rings; i++) {
    const phi = (i / rings) * Math.PI / 2;    // 0 at zenith, π/2 at horizon
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    for (let j = 0; j <= segs; j++) {
      const theta = (j / segs) * 2 * Math.PI;
      positions.push(sinPhi * Math.cos(theta), sinPhi * Math.sin(theta), cosPhi);
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * (segs + 1) + j;
      const b = a + segs + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);
  return geom;
}

export class StarfieldChart {
  constructor(clippingPlanes = []) {
    this.group = new THREE.Group();
    this.group.name = 'starfield-chart';
    this.group.visible = false;

    const loader = new THREE.TextureLoader();
    this.texDark  = loader.load('assets/starfield_dark.png');
    this.texLight = loader.load('assets/starfield_light.png');
    // Source PNGs are 1920×1080 with the chart inscribed in the 1080×1080
    // centre. Crop so the chart fills the disc edge-to-edge.
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

    // Heavenly-vault disc.
    const domeGeom = new THREE.CircleGeometry(FE_RADIUS, 128);
    this.domeMat = new THREE.MeshBasicMaterial({
      map: this.texDark,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      clippingPlanes,
    });
    this.mesh = new THREE.Mesh(domeGeom, this.domeMat);
    this.mesh.renderOrder = 52;
    this.group.add(this.mesh);

    // Observer-local dome: unit hemisphere, ShaderMaterial, scaled to
    // OpticalVaultRadius / OpticalVaultHeight each frame. No clippingPlanes
    // here — ShaderMaterial needs explicit GLSL chunks for clipping
    // support, and the hemisphere already has z ≥ 0 at every vertex so the
    // clip-below-disc plane would never activate anyway.
    const localGeom = buildHemisphereGeom(32, 96);
    this.localMat = new THREE.ShaderMaterial({
      uniforms: {
        uChart:         { value: this.texDark },
        uGlobeToCelest: { value: new THREE.Matrix3() },
        uTexRepeat:     { value: new THREE.Vector2(cropX, 1) },
        uTexOffset:     { value: new THREE.Vector2(offX, 0) },
        uOpacity:       { value: 1 },
      },
      vertexShader: VERT_SHADER,
      fragmentShader: FRAG_SHADER,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.localGroup = new THREE.Group();
    this.localMesh = new THREE.Mesh(localGeom, this.localMat);
    this.localMesh.renderOrder = 53;
    this.localGroup.add(this.localMesh);
    this.group.add(this.localGroup);
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    const type = s.StarfieldType || 'random';
    const isChart = type === 'chart-dark' || type === 'chart-light';

    this.group.visible = isChart && (s.ShowStars !== false);
    if (!this.group.visible) return;

    const tex = type === 'chart-light' ? this.texLight : this.texDark;
    if (this.domeMat.map !== tex) {
      this.domeMat.map = tex;
      this.domeMat.needsUpdate = true;
    }
    this.localMat.uniforms.uChart.value = tex;

    const nightAlpha = s.DynamicStars ? c.NightFactor : 1.0;
    this.domeMat.opacity = nightAlpha;
    this.localMat.uniforms.uOpacity.value = nightAlpha;

    // Heavenly-vault disc: origin, starfield altitude, spins with the sky.
    this.mesh.position.set(0, 0, s.StarfieldVaultHeight);
    this.mesh.rotation.z = -c.SkyRotAngle * Math.PI / 180;

    // Observer-local dome: placed at the observer, rotated into the
    // observer's local-FE frame (by observer longitude about z), scaled by
    // the current OpticalVault dimensions so resizing the vault in the UI
    // flows through automatically.
    const obs = c.ObserverFeCoord;
    this.localGroup.position.set(obs[0], obs[1], obs[2]);
    this.localGroup.rotation.set(0, 0, ToRad(s.ObserverLong || 0));
    this.localMesh.scale.set(
      c.OpticalVaultRadius,
      c.OpticalVaultRadius,
      c.OpticalVaultHeight,
    );
    this.localGroup.visible = s.ShowOpticalVault !== false;

    // Upload the inverse (= transpose) of TransMatCelestToGlobe. The stored
    // matrix is a row-indexed [3][3] array; Matrix3.set takes row-major
    // args, so the transpose rows are the original's columns.
    const mr = c.TransMatCelestToGlobe.r;
    this.localMat.uniforms.uGlobeToCelest.value.set(
      mr[0][0], mr[1][0], mr[2][0],
      mr[0][1], mr[1][1], mr[2][1],
      mr[0][2], mr[1][2], mr[2][2],
    );
  }
}
