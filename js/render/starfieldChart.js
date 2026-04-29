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

// Build the Alpabeta Field chart at runtime: three concentric rings
// of glyphs at celestial latitudes -60°, 0°, +60°. Outer ring carries
// A-M, mid ring carries N-Z, inner ring carries 1234567890. Polar AE
// UV layout matches the chart shader (UV centre = NCP, edge = SCP).
function makeAlphabetaCanvas() {
  const W = 1080, H = 1080;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#0a0e16';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = 1;
  for (const lat of [-60, 0, 60]) {
    const r = (90 - lat) / 360;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.5, r * W, 0, 2 * Math.PI);
    ctx.stroke();
  }

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const placeRing = (glyphs, lat, fontSize) => {
    ctx.font = `bold ${fontSize}px sans-serif`;
    const r = (90 - lat) / 360;
    const n = glyphs.length;
    for (let i = 0; i < n; i++) {
      const lon = (i / n) * 2 * Math.PI;
      const u = 0.5 + r * Math.cos(lon);
      const v = 0.5 + r * Math.sin(lon);
      const x = u * W;
      const y = (1 - v) * H;
      const g = glyphs[i];
      ctx.fillText(g, x, y);
      if (g === '6' || g === '9') {
        const m = ctx.measureText(g);
        ctx.beginPath();
        ctx.moveTo(x - m.width * 0.5, y + fontSize * 0.5);
        ctx.lineTo(x + m.width * 0.5, y + fontSize * 0.5);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  };

  placeRing('ABCDEFGHIJKLM'.split(''), -60, 56);
  placeRing('NOPQRSTUVWXYZ'.split(''),   0, 56);
  placeRing('1234567890'.split(''),    +60, 56);

  return cv;
}

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
    // Each entry: { url | generator, width, height }. Inscribed-
    // circle crop is computed per-entry so charts with different
    // source aspect ratios all map onto the disc edge-to-edge.
    // WebP variants (lossless, ~30 % smaller than PNG) are the
    // primary asset; the original PNGs stay in `assets/` as a
    // fallback served by the texture loader's error callback for
    // browsers without WebP decode support (effectively pre-iOS 14).
    const CHART_DEFS = {
      'chart-dark':  { url: 'assets/starfield_dark.webp',        fallback: 'assets/starfield_dark.png',        width: 1920, height: 1080 },
      'chart-light': { url: 'assets/starfield_light.webp',       fallback: 'assets/starfield_light.png',       width: 1920, height: 1080 },
      'ae_aries':    { url: 'assets/starfield_ae_aries.webp',    fallback: 'assets/starfield_ae_aries.png',    width: 1920, height: 1080 },
      'ae_aries_2':  { url: 'assets/starfield_ae_aries_2.webp',  fallback: 'assets/starfield_ae_aries_2.png',  width: 2476, height: 1246 },
      'ae_aries_3':  { url: 'assets/starfield_ae_aries_3.webp',  fallback: 'assets/starfield_ae_aries_3.png',  width: 1920, height: 1080 },
      'alphabeta':   { generator: makeAlphabetaCanvas,           width: 1080, height: 1080 },
    };
    this.charts = {};
    for (const [type, def] of Object.entries(CHART_DEFS)) {
      let tex;
      if (def.generator) {
        tex = new THREE.CanvasTexture(def.generator());
      } else {
        // Try the WebP first; on error swap to the PNG fallback.
        tex = loader.load(def.url, undefined, undefined, def.fallback ? () => {
          loader.load(def.fallback, (loaded) => {
            tex.image = loaded.image;
            tex.needsUpdate = true;
          });
        } : undefined);
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter  = THREE.LinearMipMapLinearFilter;
      tex.magFilter  = THREE.LinearFilter;
      tex.anisotropy = 4;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      const cropX = def.height / def.width;
      const offX  = (1 - cropX) / 2;
      tex.repeat.set(cropX, 1);
      tex.offset.set(offX, 0);
      this.charts[type] = { tex, cropX, offX };
    }
    this.texDark  = this.charts['chart-dark'].tex;
    this.texLight = this.charts['chart-light'].tex;

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
    const initChart = this.charts['chart-dark'];
    this.localMat = new THREE.ShaderMaterial({
      uniforms: {
        uChart:         { value: this.texDark },
        uGlobeToCelest: { value: new THREE.Matrix3() },
        uTexRepeat:     { value: new THREE.Vector2(initChart.cropX, 1) },
        uTexOffset:     { value: new THREE.Vector2(initChart.offX, 0) },
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
    const chart = this.charts[type];

    this.group.visible = !!chart && (s.ShowStars !== false);
    if (!this.group.visible) return;

    if (this.domeMat.map !== chart.tex) {
      this.domeMat.map = chart.tex;
      this.domeMat.needsUpdate = true;
    }
    this.localMat.uniforms.uChart.value = chart.tex;
    this.localMat.uniforms.uTexRepeat.value.set(chart.cropX, 1);
    this.localMat.uniforms.uTexOffset.value.set(chart.offX, 0);

    const dynamic = s.DynamicStars || s.WorldModel === 'ge';
    const nightAlpha = dynamic ? (c.NightFactor || 0) : 1.0;
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
