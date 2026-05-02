// All visible scene objects for the FE dome model. Each object exposes an
// update(model) method called per frame after the model's state recompute.

import * as THREE from 'three';
import { V } from '../math/vect3.js';
import { M } from '../math/mat3.js';
import { ToRad } from '../math/utils.js';
import { FE_RADIUS, GEOMETRY } from '../core/constants.js';
import {
  pointOnFE, celestLatLongToVaultCoord, feLatLongToGlobalFeCoord,
} from '../core/feGeometry.js';
import { canonicalLatLongToDisc } from '../core/canonical.js';
import { R_LI, TANG_CIRCUMFERENCE_LI } from '../core/units.js';
import { STELLARIUM_TRACES } from '../data/stellariumTraces.js';
import {
  besselian2024Apr08Path, besselian2024Apr08Bands,
  eclipseShadowBandsFromPath,
} from '../core/besselianEclipse.js';
import { generateGeArtTexture } from './geArt.js';
import { CONSTELLATIONS } from '../core/constellations.js';

// Cel-nav star ids that are also members of a constellation
// (referenced via the `celnav: 'id'` link in CONSTELLATIONS). The
// tracked-GP override needs this so flipping
// `GPOverrideConstellations` covers Alnilam / Betelgeuse / Rigel /
// etc. — they sit in the cel-nav cohort by data origin, but they
// also belong to a constellation and the user expects the
// constellation override to drive their GP visibility.
const CONSTELLATION_CELNAV_IDS = new Set();
for (const _con of CONSTELLATIONS) {
  for (const _st of _con.stars) {
    if (_st && _st.celnav) CONSTELLATION_CELNAV_IDS.add(_st.celnav);
  }
}
import {
  latLongToCoord, coordToLatLong, vaultCoordToGlobalFeCoord,
} from '../core/transforms.js';
// (vaultCoordToGlobalFeCoord is re-exported here for the Stars class below.)

const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

// Canvas-textured sprite used for in-scene text labels. Canvas size
// tracks the measured text width so 3- and 4-character labels like
// "30°" / "120°" / "330°" don't clip. Callers should use
// setSpriteScale(sp, heightScale) to size the sprite — that keeps text
// height consistent across labels while width follows the content.
function makeTextSprite(text, color = '#ffffff') {
  const fontPx = 44;
  const padX = 12;
  const padY = 10;
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = `bold ${fontPx}px sans-serif`;
  const textWidth = Math.ceil(probe.measureText(text).width);

  const canvas = document.createElement('canvas');
  canvas.width  = textWidth + padX * 2;
  canvas.height = fontPx + padY * 2;
  const ctx = canvas.getContext('2d');
  ctx.font = `bold ${fontPx}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true, depthTest: false, depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.renderOrder = 65;
  sprite.userData.aspect = canvas.width / canvas.height;
  return sprite;
}

// Scale a sprite produced by makeTextSprite by a target text height —
// width is derived from the sprite's canvas aspect so labels of
// different character counts render at a consistent height.
function setSpriteScale(sprite, height) {
  const a = sprite.userData.aspect || 1;
  sprite.scale.set(height * a, height, height);
}

// Update a sprite's texture in place: redraws the canvas with new
// text / colour. Preserves pool sprite slots without allocating new
// Sprite / material instances.
//
// two fixes over the previous -era implementation:
//
//  1. Skip work entirely when the text is unchanged. The pool is
//     repainted on every cache miss, but heading often moves without
//     the visible label set changing (same integer degrees in view),
//     so most calls are redundant. userData.lastText gates the no-op.
//
//  2. When the text HAS changed, dispose the old CanvasTexture and
//     install a fresh one backed by the same canvas. Without this,
//     some browsers / driver paths skip the GPU re-upload when a
//     CanvasTexture's backing canvas is resized (which happens every
//     time the text's pixel width changes), producing the stale-
//     glyph artefacts a reported — duplicate "0°" slots and
//     trailing "° °" ghosts around narrow labels. Rebuilding the
//     texture forces three.js to treat it as new.
function repaintTextSprite(sprite, text, color) {
  if (sprite.userData.lastText === text
      && sprite.userData.lastColor === color) {
    return;
  }

  const fontPx = 44;
  const padX = 12;
  const padY = 10;
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = `bold ${fontPx}px sans-serif`;
  const textWidth = Math.ceil(probe.measureText(text).width);

  const canvas = sprite.material.map.image;
  canvas.width  = textWidth + padX * 2;
  canvas.height = fontPx + padY * 2;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `bold ${fontPx}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  sprite.material.map.dispose();
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  sprite.material.map = tex;
  sprite.material.needsUpdate = true;
  sprite.userData.aspect = canvas.width / canvas.height;
  sprite.userData.lastText = text;
  sprite.userData.lastColor = color;
}

// Pick tick / label cadence for the visible FOV. Returns:
//   layer      — always 'degree' in the revised scope
//   majorArc   — meridian arc spacing in degrees (= major)
//   minorArc   — set equal to majorArc so no minor arcs draw
//   labelEvery — label stride in degrees
//   fmt        — always 'deg' in the revised scope
//
// three-layer refined cadence with the
// intermediate 5° band restored. dropped the 5° band because of
// texture-reupload artefacts; those were fixed in 's rewritten
// `repaintTextSprite`, so the 5° layer is safe to bring back. The
// ladder now reads:
//   • FOV ≥ 30°         →  static 15° wire handles it (null)
//   • 8°  ≤ FOV < 30°   →  refined 5° meridians + 5° labels
//   • FOV < 8°          →  refined 1° meridians + 1° labels
// The OpticalZoom clamp in app.js still caps FOV at 1°, so sub-degree
// cadences never appear.
function refinedAzCadenceForFov(fovDeg) {
  if (fovDeg >= 30) return null; // coarse 15° wire handles this range
  if (fovDeg >= 8) {
    return {
      layer: 'degree-5',
      majorArc: 5, minorArc: 5,
      major: 5, minor: 5,
      labelEvery: 5, fmt: 'deg',
    };
  }
  return {
    layer: 'degree-1',
    majorArc: 1, minorArc: 1,
    major: 1, minor: 1,
    labelEvery: 1, fmt: 'deg',
  };
}

// always whole degrees. `% 360` on the rounded value
// prevents the `Math.round(359.7) = 360` → `"360°"` edge case where a
// wrap-around label would collide with the `0°` label at the same
// screen position. `fmt` is retained for call-site shape but ignored.
function formatAzimuthLabel(azDeg /* fmt */) {
  const a = ((azDeg % 360) + 360) % 360;
  return (Math.round(a) % 360) + '°';
}

// elevation label cadence mirrors the azimuth ladder so the
// right-side scale stays synchronised with the bottom band:
//   FOV ≥ 30°        → 15° (coarse)
//   8° ≤ FOV < 30°  →  5° (refined 5°)
//   FOV <  8°        →  1° (refined 1°)
function elevCadenceForFov(fovDeg) {
  if (fovDeg >= 30) return 15;
  if (fovDeg >= 8)  return 5;
  return 1;
}

// Upper hemisphere grid as line segments: parallels (latitude rings) plus
// meridians (longitude arcs from horizon to pole). No diagonal triangle
// edges — used for the optical-vault wireframe so it reads as a clean sky
// grid instead of a triangulated mesh.
function buildLatLongHemisphereGeom(radius = 1, latRings = 6, lonRays = 24, ringRes = 64, overshootRad = 0) {
  const positions = [];
  // Parallels — skip the pole (i=0) and the horizon ring (i=latRings); the
  // horizon will sit at the disc clip plane already.
  for (let i = 1; i < latRings; i++) {
    const polar = (i / latRings) * (Math.PI / 2);
    const z = Math.cos(polar) * radius;
    const ringR = Math.sin(polar) * radius;
    for (let k = 0; k < ringRes; k++) {
      const a1 = (k / ringRes) * 2 * Math.PI;
      const a2 = ((k + 1) / ringRes) * 2 * Math.PI;
      positions.push(
        ringR * Math.cos(a1), ringR * Math.sin(a1), z,
        ringR * Math.cos(a2), ringR * Math.sin(a2), z,
      );
    }
  }
  // Meridians — half-arcs from horizon up to the pole. `overshootRad`
  // extends each meridian past the rim into negative z so the cap
  // visually meets the terrestrial sphere surface in GE (depth-test
  // culls the part that ends up inside the sphere).
  const arcRes = Math.max(8, Math.floor(ringRes / 2));
  const polarMax = Math.PI / 2 + Math.max(0, overshootRad);
  for (let j = 0; j < lonRays; j++) {
    const az = (j / lonRays) * 2 * Math.PI;
    const cosAz = Math.cos(az), sinAz = Math.sin(az);
    for (let k = 0; k < arcRes; k++) {
      const p1 = (k / arcRes) * polarMax;
      const p2 = ((k + 1) / arcRes) * polarMax;
      positions.push(
        Math.sin(p1) * cosAz * radius, Math.sin(p1) * sinAz * radius, Math.cos(p1) * radius,
        Math.sin(p2) * cosAz * radius, Math.sin(p2) * sinAz * radius, Math.cos(p2) * radius,
      );
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geom;
}


// --- helpers ---------------------------------------------------------------

function makeLine(positions, color, opts = {}) {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: opts.opacity != null && opts.opacity < 1,
    opacity: opts.opacity ?? 1,
  });
  return new THREE.Line(geom, mat);
}

function makeLineSegments(positions, color, opts = {}) {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: opts.opacity != null && opts.opacity < 1,
    opacity: opts.opacity ?? 1,
  });
  return new THREE.LineSegments(geom, mat);
}

function bezierQuad(p0, p1, p2, samples = 32) {
  const out = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const u = 1 - t;
    out.push(
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
      u * u * p0[2] + 2 * u * t * p1[2] + t * t * p2[2],
    );
  }
  return out;
}

// --- Heavenly-vault 360° longitude ring -----------------------------------
//
// A canonical ring around the FE disc rim that shows the 360° longitude
// reference. Built once from canonicalLatLongToDisc; projection-
// independent. This is the "outer circumference" azimuth-style marker
// the Heavenly view reads against.
//
// Tick cadence is 10° minor / 30° major, with numeric labels every 30°.
// Labels carry the longitude value of the meridian that meets the rim
// at that point.
// LongitudeRing labels are placed clockwise starting from the 0°
// anchor (offset 180° so "0°" lands opposite world +x, aligning with
// the observer's N direction when ObserverLong = 0). The clockwise
// sweep matches compass / azimuth convention: 0° → 90° → 180° → 270°
// going CW viewed from above.
const LONGITUDE_RING_ANCHOR_DEG = 180;

function ringAngleRad(d) {
  // Anchor at LONGITUDE_RING_ANCHOR_DEG, advance clockwise with d.
  return (LONGITUDE_RING_ANCHOR_DEG - d) * Math.PI / 180;
}

function buildDegreeTicks(radius, tickInner, tickOuter, stepDeg, color, opacity, z) {
  const pts = [];
  for (let d = 0; d < 360; d += stepDeg) {
    const r = ringAngleRad(d);
    const cos = Math.cos(r), sin = Math.sin(r);
    pts.push(tickInner * cos, tickInner * sin, z,
             tickOuter * cos, tickOuter * sin, z);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(
    geom,
    new THREE.LineBasicMaterial({
      color, transparent: opacity < 1, opacity,
      depthTest: false, depthWrite: false,
    }),
  );
}
function buildDegreeLabels(labelRadius, stepDeg, color, z, scale) {
  const group = new THREE.Group();
  for (let d = 0; d < 360; d += stepDeg) {
    const r = ringAngleRad(d);
    const sp = makeTextSprite(String(d) + '°', color);
    sp.position.set(labelRadius * Math.cos(r), labelRadius * Math.sin(r), z);
    setSpriteScale(sp, scale);
    // stamp label value + current colour so the dark-bg
    // toggle can repaint without rebuilding geometry.
    sp.userData.text      = String(d) + '°';
    sp.userData.textColor = color;
    group.add(sp);
  }
  return group;
}

export class LongitudeRing {
  constructor(feRadius = FE_RADIUS) {
    this.group = new THREE.Group();
    this.group.name = 'longitude-ring';
    this.minorTicks = buildDegreeTicks(
      feRadius, feRadius * 1.025, feRadius * 1.04,
      10, 0x556677, 0.55, 4e-4,
    );
    this.majorTicks = buildDegreeTicks(
      feRadius, feRadius * 1.025, feRadius * 1.065,
      30, 0x334455, 0.85, 4e-4,
    );
    this.labels = buildDegreeLabels(
      feRadius * 1.09, 30, '#334455', 4e-4, 0.09,
    );
    this.group.add(this.minorTicks);
    this.group.add(this.majorTicks);
    this.group.add(this.labels);
    // current palette. Light palette = hand-tuned grays that
    // read on the pale-blue Heavenly background. Dark palette =
    // white / pale grey that reads on the near-black DarkBackground.
    // `_currentPalette` tracks which is active so `update()` can skip
    // repainting when nothing changed.
    this._palettes = {
      light: { minor: 0x556677, major: 0x334455, label: '#334455' },
      dark:  { minor: 0xb8c4d4, major: 0xe0e8f0, label: '#ffffff' },
    };
    this._currentPalette = null;
    this._applyPalette('light');
  }

  _applyPalette(which) {
    if (this._currentPalette === which) return;
    const p = this._palettes[which];
    this.minorTicks.material.color.setHex(p.minor);
    this.majorTicks.material.color.setHex(p.major);
    for (const sp of this.labels.children) {
      repaintTextSprite(sp, sp.userData.text, p.label);
      sp.userData.textColor = p.label;
    }
    this._currentPalette = which;
  }

  update(model) {
    // Hidden in GE (no flat disc rim) and in Optical-vault first-
    // person mode (the cap-attached azi ring takes over).
    const s = model.state;
    const ge = s.WorldModel === 'ge';
    const inVault = !!s.InsideVault;
    this.group.visible = !ge && !inVault && (s.ShowLongitudeRing !== false);

    this._applyPalette(s.DarkBackground ? 'dark' : 'light');

    // Heavenly azi rotation:
    //   FE / AE — `ToRad(ObserverLong)` lines 0° up with the
    //   observer's compass-north (toward the disc centre).
    //   DP — locked at `−π/2` so 0° pins to world +y. The
    //   InsideVault camera + figure use the same world-fixed
    //   axes (S692, S695); at the projection centre this matches
    //   the gradient too, so the optical cap and the heavenly
    //   ring agree there. Off-centre, the heavenly ring stays
    //   put while the optical cap follows the observer's local
    //   compass — by design.
    const angle = s.WorldModel === 'dp'
      ? -Math.PI / 2
      : ToRad(s.ObserverLong || 0);
    this.group.rotation.set(0, 0, angle);
  }
}

// --- FE disc + grid --------------------------------------------------------

// Dome-caustic peak overlay: reads c.DomeCausticPeaks (the ray
// tracer's binned local-maxima list) and renders each as a sphere
// sized + brightened by its relative intensity. The brightest peak on
// the side of the disc opposite the sun's GP — the candidate
// antipodal "ghost sun" — gets a halo highlight.
export class DomeCausticOverlay {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'dome-caustic';
    this.group.visible = false;
    this._meshes = [];

    // One reserved highlight marker for the antipodal peak.
    this.highlight = new THREE.Mesh(
      new THREE.RingGeometry(0.018, 0.028, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffe060, transparent: true, opacity: 0.85,
        depthTest: false, depthWrite: false,
      }),
    );
    this.highlight.renderOrder = 122;
    this.highlight.visible = false;
    this.group.add(this.highlight);

    // Orange "ghost sun" spheres rendered ON the observer's optical
    // vault when a caustic peak projects above the local horizon.
    // Distinct colour from the real sun so the two read separately.
    this._opticalMeshes = [];
  }

  _ensure(i) {
    while (this._meshes.length <= i) {
      const m = new THREE.Mesh(
        new THREE.CircleGeometry(1, 24),
        new THREE.MeshBasicMaterial({
          color: 0xffe060, transparent: true,
          depthTest: false, depthWrite: false,
        }),
      );
      m.renderOrder = 121;
      this.group.add(m);
      this._meshes.push(m);
    }
    return this._meshes[i];
  }

  _ensureOptical(i) {
    while (this._opticalMeshes.length <= i) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 12),
        new THREE.MeshBasicMaterial({
          color: 0xff8a00, transparent: true,
          depthTest: false, depthWrite: false,
        }),
      );
      m.renderOrder = 124;
      this.group.add(m);
      this._opticalMeshes.push(m);
    }
    return this._opticalMeshes[i];
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    const on = !!s.ShowDomeCaustic;
    this.group.visible = on && s.WorldModel !== 'ge';
    if (!this.group.visible) {
      this.highlight.visible = false;
      for (const m of this._meshes) m.visible = false;
      return;
    }
    const peaks = Array.isArray(c.DomeCausticPeaks) ? c.DomeCausticPeaks : [];
    for (let i = 0; i < peaks.length; i++) {
      const p = peaks[i];
      const m = this._ensure(i);
      const r = 0.006 + 0.020 * p.intensity;
      m.scale.set(r, r, 1);
      m.position.set(p.x, p.y, 0.003);
      m.material.opacity = 0.4 + 0.55 * p.intensity;
      m.visible = true;
    }
    for (let i = peaks.length; i < this._meshes.length; i++) {
      this._meshes[i].visible = false;
    }

    const sunPeak = c.DomeCausticPeakSun;
    if (sunPeak) {
      this.highlight.visible = true;
      this.highlight.position.set(sunPeak.x, sunPeak.y, 0.0035);
      const r = 0.024 + 0.030 * sunPeak.intensity;
      this.highlight.scale.set(r, r, 1);
    } else {
      this.highlight.visible = false;
    }

    // Optical-vault ghost suns: only when ShowOpticalVault is on and
    // the observer can plausibly see them.
    const opticalShow = on && (s.ShowOpticalVault !== false)
                        && Array.isArray(c.DomeCausticOpticalPeaks);
    const opticals = opticalShow ? c.DomeCausticOpticalPeaks : [];
    for (let i = 0; i < opticals.length; i++) {
      const op = opticals[i];
      const m = this._ensureOptical(i);
      m.position.set(op.x, op.y, op.z);
      const r = 0.0025 + 0.006 * op.intensity;
      m.scale.set(r, r, r);
      m.material.opacity = 0.55 + 0.40 * op.intensity;
      m.visible = true;
    }
    for (let i = opticals.length; i < this._opticalMeshes.length; i++) {
      this._opticalMeshes[i].visible = false;
    }
  }
}

// Globe heavenly vault: a translucent shell concentric with the
// terrestrial globe at `c.GlobeVaultRadius`. Visible only in GE
// mode. True positions of celestial bodies (sun/moon/planets) live
// on this shell — the GE analogue of the FE flat-disc dome.
export class GlobeHeavenlyVault {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'globe-heavenly-vault';
    this.group.visible = false;

    this._radius = 1;
    // Three.js SphereGeometry's poles default to ±y. Rotate so the
    // poles align with ±z, matching the rest of this scene's z-up
    // convention (celestial north pole = +z) — otherwise the shell
    // graticule and the body globe-vault coords would disagree on
    // which axis is "the pole".
    const geom = new THREE.SphereGeometry(1, 96, 64);
    geom.rotateX(Math.PI / 2);
    this.shell = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({
      color: 0x88a4c8, transparent: true, opacity: 0.06,
      side: THREE.BackSide, depthWrite: false,
    }));
    this.group.position.set(0, 0, 0);
    this.group.add(this.shell);

    // Wireframe graticule so the shell reads as 3D rather than a
    // diffuse glow.
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x88a4c8, transparent: true, opacity: 0.18,
    });
    for (let lat = -75; lat <= 75; lat += 15) {
      const phi = ToRad(lat);
      const rr = Math.cos(phi);
      const z = Math.sin(phi);
      const segs = 96;
      const pts = new Float32Array((segs + 1) * 3);
      for (let i = 0; i <= segs; i++) {
        const t = (i / segs) * Math.PI * 2;
        pts[i * 3    ] = rr * Math.cos(t);
        pts[i * 3 + 1] = rr * Math.sin(t);
        pts[i * 3 + 2] = z;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      this.group.add(new THREE.LineLoop(g, wireMat));
    }
    for (let lon = 0; lon < 360; lon += 30) {
      const t = ToRad(lon);
      const ct = Math.cos(t), st = Math.sin(t);
      const segs = 48;
      const pts = new Float32Array((segs + 1) * 3);
      for (let i = 0; i <= segs; i++) {
        const phi = -Math.PI / 2 + (i / segs) * Math.PI;
        const rr = Math.cos(phi);
        pts[i * 3    ] = rr * ct;
        pts[i * 3 + 1] = rr * st;
        pts[i * 3 + 2] = Math.sin(phi);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      this.group.add(new THREE.Line(g, wireMat));
    }
  }

  update(model) {
    const s = model.state;
    const ge = s.WorldModel === 'ge';
    // `ShowVault` is the master heavenly-vault toggle in both modes;
    // unchecked, the GE celestial sphere shell + graticule disappear
    // exactly like the FE dome does.
    this.group.visible = ge && (s.ShowVault !== false);
    if (!ge) return;
    const r = model.computed.GlobeVaultRadius || 1;
    this.group.scale.set(r, r, r);
  }
}

// Globe-Earth: a unit sphere of radius `radius` (matching FE_RADIUS so
// the orbital camera scale is consistent across world models). Visible
// only when state.WorldModel === 'ge'. Adds a faint lat/lon graticule
// so the user can read placement.
export class WorldGlobe {
  constructor(radius = FE_RADIUS) {
    this.group = new THREE.Group();
    this.group.name = 'world-globe';
    this.group.visible = false;

    // SphereGeometry's default UV puts `u = 0.5` on the world `+x`
    // axis after `rotateX(π/2)` aligns the poles with `±z`, which is
    // exactly where lon=0° sits in a standard equirect texture
    // (lon=-180° at u=0, lon=180° at u=1). No offset is needed for
    // the prime meridian to land on world `+x`.
    const sphereGeom = new THREE.SphereGeometry(radius, 96, 64);
    sphereGeom.rotateX(Math.PI / 2);
    // Day/night shader. World-space surface normal is dotted against
    // the subsolar direction every frame; result is smoothstepped
    // through a soft terminator and used to mix between the lit
    // texture/colour and a dimmed night version.
    const sphereMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap:        { value: null },
        uHasMap:     { value: 0.0 },
        uColor:      { value: new THREE.Color(0x1a3a5e) },
        uMapOffset:  { value: new THREE.Vector2(0.0, 0.0) },
        uSunDir:     { value: new THREE.Vector3(1, 0, 0) },
        uOpacity:    { value: 0.85 },
        uTermSoft:   { value: 0.12 },
        uNightDim:   { value: 0.18 },
        uDayNightOn: { value: 1.0 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormalWorld;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vNormalWorld = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        uniform float uHasMap;
        uniform vec3 uColor;
        uniform vec2 uMapOffset;
        uniform vec3 uSunDir;
        uniform float uOpacity;
        uniform float uTermSoft;
        uniform float uNightDim;
        uniform float uDayNightOn;
        varying vec3 vNormalWorld;
        varying vec2 vUv;
        void main() {
          vec3 base = uColor;
          if (uHasMap > 0.5) {
            base = texture2D(uMap, vec2(vUv.x + uMapOffset.x, vUv.y + uMapOffset.y)).rgb;
          }
          float lit = 1.0;
          if (uDayNightOn > 0.5) {
            float dotL = dot(normalize(vNormalWorld), normalize(uSunDir));
            lit = smoothstep(-uTermSoft, uTermSoft, dotL);
          }
          vec3 night = base * uNightDim + vec3(0.01, 0.01, 0.02);
          vec3 col = mix(night, base, lit);
          gl_FragColor = vec4(col, uOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
    this.sphere = new THREE.Mesh(sphereGeom, sphereMat);
    this.group.position.set(0, 0, 0);
    this.group.add(this.sphere);
    // Texture cache keyed by image asset URL so toggling between
    // map projections doesn't refetch the same file.
    this._textureCache = new Map();
    // Separate cache for procedural ge_art canvases keyed by
    // projection id; entries depend on `_landGeo` so they're
    // invalidated when GeoJSON arrives.
    this._geArtCache = new Map();
    this._landGeo = null;
    this._activeProjId = null;

    // Center-of-sphere marker — a small bright dot at the origin.
    // Useful as a visual reference when verifying that the observer's
    // local-zenith axis aligns with the line from the observer
    // through the centre of the terrestrial sphere.
    this.center = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.012, 12, 10),
      new THREE.MeshBasicMaterial({
        color: 0xff8040, transparent: true, opacity: 0.95,
        depthTest: false, depthWrite: false,
      }),
    );
    this.center.renderOrder = 70;
    this.group.add(this.center);

    const gridMat = new THREE.LineBasicMaterial({
      color: 0x88a4c8, transparent: true, opacity: 0.45,
    });
    const lineRadius = radius * 1.0005;

    // Parallels every 15°.
    for (let lat = -75; lat <= 75; lat += 15) {
      const phi = ToRad(lat);
      const r = lineRadius * Math.cos(phi);
      const z = lineRadius * Math.sin(phi);
      const segs = 128;
      const pts = new Float32Array((segs + 1) * 3);
      for (let i = 0; i <= segs; i++) {
        const t = (i / segs) * Math.PI * 2;
        pts[i * 3    ] = r * Math.cos(t);
        pts[i * 3 + 1] = r * Math.sin(t);
        pts[i * 3 + 2] = z;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      this.group.add(new THREE.LineLoop(g, gridMat));
    }
    // Meridians every 15°.
    for (let lon = 0; lon < 360; lon += 15) {
      const t = ToRad(lon);
      const ct = Math.cos(t), st = Math.sin(t);
      const segs = 64;
      const pts = new Float32Array((segs + 1) * 3);
      for (let i = 0; i <= segs; i++) {
        const phi = -Math.PI / 2 + (i / segs) * Math.PI;
        const r = lineRadius * Math.cos(phi);
        pts[i * 3    ] = r * ct;
        pts[i * 3 + 1] = r * st;
        pts[i * 3 + 2] = lineRadius * Math.sin(phi);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      this.group.add(new THREE.Line(g, gridMat));
    }
  }

  update(model) {
    this.group.visible = model.state.WorldModel === 'ge';
    // Inner globe-centre dot only shows when the fictitious
    // observer is at the centre — it represents the centre-
    // observer's position, not the axis-line endpoint. The
    // axis-line endpoint is a separate top-level dot rendered at
    // (lat 90°, lon 0°) of whichever projection is active.
    if (this.center) {
      // Hide the inner centre dot while the camera is parked at the
      // globe centre in Optical view — the marker would otherwise
      // dominate the foreground at the camera's eye.
      const camAtOrigin = !!model.state.ObserverAtCenter && !!model.state.InsideVault;
      this.center.visible = !!model.state.ShowAxisLine
        && !!model.state.ObserverAtCenter
        && model.state.WorldModel === 'ge'
        && !camAtOrigin;
    }
    const c = model && model.computed;
    const u = this.sphere.material.uniforms;
    if (c && c.SunCelestLatLong && Number.isFinite(c.SunRA) && Number.isFinite(c.SkyRotAngle)) {
      const latDeg = c.SunCelestLatLong.lat;
      const lonDeg = (c.SunRA * 180 / Math.PI) - c.SkyRotAngle;
      const phi = latDeg * Math.PI / 180;
      const lam = lonDeg * Math.PI / 180;
      const cp = Math.cos(phi);
      u.uSunDir.value.set(cp * Math.cos(lam), cp * Math.sin(lam), Math.sin(phi));
    }
    const flag = model && model.state && model.state.ShowDayNightShadow;
    u.uDayNightOn.value = (flag === false) ? 0.0 : 1.0;
  }

  // Apply a map texture to the terrestrial sphere when the active
  // GE projection is a raster equirectangular map. Other projection
  // styles (orthographic, gleason's, AE-polar, etc.) draw a
  // flat-disc image; sticking those onto a sphere wraps oddly so
  // they fall back to plain shading.
  applyMapTexture(projId, getProjection) {
    if (this._activeProjId === projId) return;
    this._activeProjId = projId;
    const proj = getProjection ? getProjection(projId) : null;
    const asset = proj && proj.imageAsset;
    const generatedStyle = proj && proj.generatedGeTexture;
    const isEquirect = !!asset && /equirect|world_shaded/i.test(projId);
    const u = this.sphere.material.uniforms;
    // Per-projection sphere opacity. Default 0.85 (matches the shell's
    // standard look); a projection can declare `geOpacity` to render
    // the globe more or less translucent.
    u.uOpacity.value = (proj && typeof proj.geOpacity === 'number')
      ? proj.geOpacity
      : 0.85;
    if (generatedStyle) {
      let tex = this._geArtCache.get(projId);
      if (!tex) {
        tex = generateGeArtTexture(generatedStyle, this._landGeo);
        if (this._landGeo) this._geArtCache.set(projId, tex);
      }
      u.uMap.value = tex;
      u.uHasMap.value = 1.0;
      u.uMapOffset.value.set(tex.offset.x, tex.offset.y);
      u.uColor.value.setHex(0xffffff);
    } else if (isEquirect) {
      let tex = this._textureCache.get(asset);
      if (!tex) {
        tex = new THREE.TextureLoader().load(asset);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        // No shift: the rotated SphereGeometry's UV already puts
        // u=0.5 (= equirect lon=0°) on world +x.
        tex.offset.set(0, 0);
        this._textureCache.set(asset, tex);
      }
      u.uMap.value = tex;
      u.uHasMap.value = 1.0;
      u.uMapOffset.value.set(tex.offset.x, tex.offset.y);
      u.uColor.value.setHex(0xffffff);
    } else {
      u.uMap.value = null;
      u.uHasMap.value = 0.0;
      u.uColor.value.setHex(0x1a3a5e);
    }
  }

  // Hand the land GeoJSON to the globe once the renderer has loaded
  // it. Wipes the procedural ge_art cache so any active art texture
  // regenerates with real continent paths on the next applyMapTexture
  // call (forced by clearing _activeProjId).
  setLandGeo(geoJson) {
    this._landGeo = geoJson || null;
    for (const tex of this._geArtCache.values()) tex.dispose();
    this._geArtCache.clear();
    this._activeProjId = null;
  }
}

export class DiscBase {
  constructor(feRadius = FE_RADIUS) {
    this.group = new THREE.Group();
    this.group.name = 'disc-base';

    // Ocean fill: flat circle at z=0.
    const circGeom = new THREE.CircleGeometry(feRadius, 128);
    const circMat = new THREE.MeshBasicMaterial({ color: 0xb3d6f2 });
    const circ = new THREE.Mesh(circGeom, circMat);
    this.group.add(circ);

    // Outer rim ring (subtle).
    const rim = new THREE.Mesh(
      new THREE.RingGeometry(feRadius * 0.995, feRadius * 1.02, 128),
      new THREE.MeshBasicMaterial({ color: 0xc8c8c8 }),
    );
    rim.position.z = 1e-4;
    this.group.add(rim);
  }
  update() {}
}

// --- Named latitude circles on the disc ----------------------------------
//
// Equator, tropics (± obliquity of ecliptic), polar circles (90° − obliquity).
// Visualises where the sub-solar and sub-lunar points live and migrate over
// the year: at summer solstice the sun's GP sits on the Tropic of Cancer,
// at winter solstice on the Tropic of Capricorn; the moon's GP oscillates
// around a similar band offset by the lunar node precession.
function makeCharSprite(ch, hexColor) {
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.font = 'bold 44px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = hexColor;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 6;
  ctx.fillText(ch, 32, 32);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true,
    depthTest: false, depthWrite: false,
  });
  const sp = new THREE.Sprite(mat);
  sp.renderOrder = 31;
  return sp;
}

export class LatitudeLines {
  constructor(feRadius = FE_RADIUS) {
    this.group = new THREE.Group();
    this.group.name = 'latitude-lines';
    this._feRadius = feRadius;
    // `flag` field maps each ring to an individual visibility flag
    // in `state` so the user can toggle Cancer / Equator / Capricorn
    // independently. `kind` survives only for the existing polar /
    // antarctic rings, gated on `ShowPolarCircles`.
    this._circles = [
      { lat:  66.5636, color: 0x66ccff, label: 'Arctic Circle',     kind: 'polar', flag: 'ShowPolarCircles'    },
      { lat:  23.4392, color: 0xffc844, label: 'Tropic of Cancer',  kind: 'tropic', flag: 'ShowTropicCancer'    },
      { lat:   0.0,    color: 0xff4040, label: 'Equator',           kind: 'tropic', flag: 'ShowEquator'         },
      { lat: -23.4392, color: 0xffc844, label: 'Tropic of Capricorn', kind: 'tropic', flag: 'ShowTropicCapricorn' },
      { lat: -66.5636, color: 0x66ccff, label: 'Antarctic Circle',  kind: 'polar', flag: 'ShowPolarCircles'    },
    ];
    this._lines = [];
    this._labelGroups = [];
    this._infoGroups = [];
    // li dimensions of each ring (cached at constructor time
    // since latitudes are fixed). The disc-radius value is the
    // arc length from the N-pole-centred AE origin (= great-
    // circle arc to the ring); the ring-circumference is the
    // Tang sphere's parallel circle (= 2π · R_LI · cos lat).
    const HALF_GC = TANG_CIRCUMFERENCE_LI / 2;     // 64,150.13 li
    const fmtLi = (n) => Math.round(n).toLocaleString();
    for (const c of this._circles) {
      const geo = new THREE.BufferGeometry();
      const mat = new THREE.LineBasicMaterial({
        color: c.color,
        transparent: true, opacity: 1.0,
        depthTest: false, depthWrite: false,
      });
      const line = new THREE.Line(geo, mat);
      line.renderOrder = 30;
      line.name = c.label;
      this.group.add(line);
      this._lines.push(line);
      // Per-character sprites laid along each named ring's arc.
      // Each sprite carries its `charLat` / `charLon` in `userData`
      // so `_rebuild` can reposition the row when projection
      // changes. Both tropic / equator and polar / antarctic rings
      // get labels; text always renders white so the label stays
      // legible against any backdrop and reads as a separate piece
      // of UI rather than blending with the ring itself.
      // Per-ring longitude-spacing scale so character runs stay
      // visually even on small (high-latitude) rings. The disc
      // ring radius collapses as `(90 − |lat|) / 180`, so a
      // fixed Δlon translates to ~4× shorter linear arc on the
      // Arctic / Antarctic circles than on the equator —
      // clumping the letters. Scaling Δlon by `equator_radius /
      // ring_radius` keeps each character's arc length constant.
      // Cap at 4× so polar rings don't end up wrapping the
      // entire circumference.
      const ringRadiusFrac = Math.max(0.05, (90 - Math.abs(c.lat)) / 180);
      const arcSpacingScale = Math.min(4, 0.5 / ringRadiusFrac);

      const lg = new THREE.Group();
      lg.name = `label-${c.label}`;
      lg.visible = false;
      const text = c.label.toUpperCase();
      const charSize = 0.028;
      const charDegSpacing = 4.5 * arcSpacingScale;
      const span = text.length * charDegSpacing;
      const startLon = -span / 2;
      for (let i = 0; i < text.length; i++) {
        const sp = makeCharSprite(text[i], '#ffffff');
        sp.scale.set(charSize, charSize, 1);
        sp.userData.charLon = startLon + (i + 0.5) * charDegSpacing;
        sp.userData.charLat = c.lat;
        lg.add(sp);
      }
      this._labelGroups.push(lg);
      this.group.add(lg);

      // Secondary "info" label — shows the ring's li dimensions.
      // Hidden until `state.ShowLatLineInfo` is on AND the ring
      // itself is visible. Centred on the antimeridian (lon =
      // 180°) so it sits on the opposite side of the AE disc
      // from the name label.
      //
      // Shrink-to-fit: with arc-spacing scaled per ring, the
      // info string can still overrun the polar circles
      // (Arctic / Antarctic at lat ±66.56° have a ring radius
      // ~13 % of the equator's, so even the 4× cap leaves the
      // text wrapping the entire ring). When the natural Δlon
      // would push the string past `MAX_ARC_DEG` of the ring,
      // tighten the spacing and shrink the per-character size
      // to match so letters don't overlap each other.
      const ringCircLi = TANG_CIRCUMFERENCE_LI * Math.cos(c.lat * Math.PI / 180);
      const infoText = `${fmtLi(ringCircLi)} LI`;
      const infoGroup = new THREE.Group();
      infoGroup.name = `info-${c.label}`;
      infoGroup.visible = false;
      const MAX_ARC_DEG = 280;
      const naturalInfoSpacing = 3.0 * arcSpacingScale;
      const fitInfoSpacing = MAX_ARC_DEG / Math.max(1, infoText.length);
      const infoCharSpacing = Math.min(naturalInfoSpacing, fitInfoSpacing);
      const infoSizeScale = naturalInfoSpacing > 0
        ? Math.min(1, infoCharSpacing / naturalInfoSpacing)
        : 1;
      const infoCharSize = 0.020 * infoSizeScale;
      const infoSpan = infoText.length * infoCharSpacing;
      const infoStartLon = -infoSpan / 2;
      for (let i = 0; i < infoText.length; i++) {
        const sp = makeCharSprite(infoText[i], '#ffffff');
        sp.scale.set(infoCharSize, infoCharSize, 1);
        sp.userData.charLon = 180 + infoStartLon + (i + 0.5) * infoCharSpacing;
        sp.userData.charLat = c.lat;
        infoGroup.add(sp);
      }
      this._infoGroups.push(infoGroup);
      this.group.add(infoGroup);
    }
    this._lastProj = null;
    this._rebuild();
  }
  _rebuild(ge = false) {
    const feRadius = this._feRadius;
    // Slight outward lift on GE so the circles sit just above the
    // globe shader surface and don't z-fight with it.
    const Rge = feRadius * 1.0008;
    for (let i = 0; i < this._circles.length; i++) {
      const c = this._circles[i];
      const pts = [];
      if (ge) {
        const phi = c.lat * Math.PI / 180;
        const cp = Math.cos(phi), sp = Math.sin(phi);
        const z = Rge * sp;
        const r = Rge * cp;
        for (let k = 0; k <= 256; k++) {
          const lam = (-180 + k * (360 / 256)) * Math.PI / 180;
          pts.push(r * Math.cos(lam), r * Math.sin(lam), z);
        }
      } else {
        for (let k = 0; k <= 256; k++) {
          const lon = -180 + k * (360 / 256);
          const p = canonicalLatLongToDisc(c.lat, lon, feRadius);
          pts.push(p[0], p[1], 8e-4);
        }
      }
      const line = this._lines[i];
      line.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      line.geometry.attributes.position.needsUpdate = true;
      line.geometry.computeBoundingSphere();
      // GE lines need depthTest so they get occluded by the front
      // half of the globe; FE lines stay always-visible since the
      // disc has no front-back ambiguity.
      const m = line.material;
      const wantDT = ge;
      if (m.depthTest !== wantDT) { m.depthTest = wantDT; m.needsUpdate = true; }
      // Reposition each label sprite along the arc — applies to
      // both the main name label and the secondary info label.
      const placeSprites = (group) => {
        if (!group) return;
        for (const sp of group.children) {
          const cLat = sp.userData.charLat;
          const cLon = sp.userData.charLon;
          if (ge) {
            const phi = cLat * Math.PI / 180;
            const lam = cLon * Math.PI / 180;
            const cp = Math.cos(phi);
            const r = Rge * 1.005;
            sp.position.set(
              r * cp * Math.cos(lam),
              r * cp * Math.sin(lam),
              r * Math.sin(phi),
            );
            const matSp = sp.material;
            if (matSp.depthTest !== true) { matSp.depthTest = true; matSp.needsUpdate = true; }
          } else {
            const p = canonicalLatLongToDisc(cLat, cLon, feRadius);
            sp.position.set(p[0], p[1], 1.5e-3);
            const matSp = sp.material;
            if (matSp.depthTest !== false) { matSp.depthTest = false; matSp.needsUpdate = true; }
          }
        }
      };
      placeSprites(this._labelGroups[i]);
      placeSprites(this._infoGroups[i]);
    }
  }
  update(model) {
    const s = model.state;
    const showInfo = !!s.ShowLatLineInfo;
    let anyOn = false;
    for (let i = 0; i < this._circles.length; i++) {
      const c = this._circles[i];
      const on = !!s[c.flag];
      this._lines[i].visible = on;
      const lg = this._labelGroups[i];
      if (lg) lg.visible = on;
      const ig = this._infoGroups[i];
      if (ig) ig.visible = on && showInfo;
      if (on) anyOn = true;
    }
    this.group.visible = anyOn;
    const ge = s.WorldModel === 'ge';
    // Active-projection dispatch lives in canonical.js, so the
    // rebuild only needs a key sensitive to FE↔GE↔DP transitions.
    const key = ge ? 'ge' : `fe:${s.WorldModel === 'dp' ? 'dp' : (s.MapProjection || 'ae')}`;
    if (key !== this._lastProj) {
      this._rebuild(ge);
      this._lastProj = key;
    }
  }
}

// --- Tang-sphere dimensions overlay -------------------------------------
//
// Dimension annotations sized to match the live optical vault.
// Reads `computed.OpticalVaultRadius` and
// `computed.OpticalVaultHeightEffective`, rebuilds geometry when
// either changes, and re-derives the li labels from the canonical
// size each rebuild.
//
// Canonical-disc scale: `FE_RADIUS = 1` represents the meridian
// arc from N pole to S pole, i.e. one canonical unit ≈ 64,150 li
// (= TANG_CIRCUMFERENCE_LI / 2). A dome at the Tang-sphere radius
// `R_LI / (TANG_CIRC / 2) = 1 / π` lands on the published
// 20,419.45 li. Default `OpticalVaultSize = 0.5` ⇒ the overlay
// reads ~32,075 li out of the box; pulling the slider down to
// ~0.318 makes the labels read 20,419 li and the dome footprint
// coincide with the Tang sphere.
//
// Hidden in GE — the dome here is an FE-disc construct.
const TANG_DIM_COLOR = 0xffd060;
const TANG_DIM_LI_PER_UNIT = TANG_CIRCUMFERENCE_LI / 2;  // 64,150.13 li / canonical
function _tangFmtLi(canonical) {
  const n = canonical * TANG_DIM_LI_PER_UNIT;
  return (Math.round(n * 100) / 100).toLocaleString();
}

export class TangSphereDimensions {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'tang-sphere-dimensions';
    this.group.visible = false;
    this._cachedR = -1;
    this._cachedH = -1;
  }

  // Drop every child mesh / line / sprite + free its GPU buffers
  // before a rebuild. Per-axis label groups are nested groups of
  // sprites, so dispose recurses.
  _disposeChildren(node) {
    while (node.children.length > 0) {
      const c = node.children[0];
      this._disposeChildren(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (c.material.map) c.material.map.dispose();
        c.material.dispose();
      }
      node.remove(c);
    }
  }

  _rebuild(R, H) {
    this._disposeChildren(this.group);

    // Helper: dashed line segments along a polyline.
    const mkDashed = (pts, dashSize = 0.015, gapSize = 0.008) => {
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const mat = new THREE.LineDashedMaterial({
        color: TANG_DIM_COLOR,
        dashSize, gapSize,
        transparent: true, opacity: 0.95,
        depthTest: false, depthWrite: false,
      });
      const line = new THREE.Line(geom, mat);
      line.computeLineDistances();
      line.renderOrder = 50;
      line.frustumCulled = false;
      return line;
    };

    // Dashed dimension lines: vertical height (along z), ground
    // radius (along +x), ground diameter (perpendicular to the
    // radius along the y-axis from -R to +R) so the two ground
    // measurements don't overlap.
    this.group.add(mkDashed([0, 0, 1e-3,  0, 0, H]));
    this.group.add(mkDashed([0, 0, 1e-3,  R, 0, 1e-3]));
    this.group.add(mkDashed([0, -R, 8e-4, 0, R, 8e-4], 0.020, 0.010));

    // Solid wireframe of the dome: ground circle + two great-
    // circle arcs in the y=0 and x=0 vertical planes (height
    // scaled by H so a flatter cap renders correctly).
    const SEGS = 64;
    const ring = [];
    for (let k = 0; k <= SEGS; k++) {
      const a = (k / SEGS) * Math.PI * 2;
      ring.push(R * Math.cos(a), R * Math.sin(a), 5e-4);
    }
    const ringGeom = new THREE.BufferGeometry();
    ringGeom.setAttribute('position', new THREE.Float32BufferAttribute(ring, 3));
    const ringLine = new THREE.Line(ringGeom, new THREE.LineBasicMaterial({
      color: TANG_DIM_COLOR, transparent: true, opacity: 0.55,
      depthTest: false, depthWrite: false,
    }));
    ringLine.renderOrder = 49;
    ringLine.frustumCulled = false;
    this.group.add(ringLine);

    const arcY = []; const arcX = [];
    for (let k = 0; k <= SEGS / 2; k++) {
      const a = (k / (SEGS / 2)) * Math.PI;
      arcY.push(R * Math.cos(a), 0, H * Math.sin(a));
      arcX.push(0, R * Math.cos(a), H * Math.sin(a));
    }
    const arcMat = new THREE.LineBasicMaterial({
      color: TANG_DIM_COLOR, transparent: true, opacity: 0.45,
      depthTest: false, depthWrite: false,
    });
    const arcYGeom = new THREE.BufferGeometry();
    arcYGeom.setAttribute('position', new THREE.Float32BufferAttribute(arcY, 3));
    const arcYLine = new THREE.Line(arcYGeom, arcMat);
    arcYLine.renderOrder = 49;
    arcYLine.frustumCulled = false;
    this.group.add(arcYLine);
    const arcXGeom = new THREE.BufferGeometry();
    arcXGeom.setAttribute('position', new THREE.Float32BufferAttribute(arcX, 3));
    const arcXLine = new THREE.Line(arcXGeom, arcMat.clone());
    arcXLine.renderOrder = 49;
    arcXLine.frustumCulled = false;
    this.group.add(arcXLine);

    // Celestial arc: solid quarter-arc on the dome surface from
    // zenith (0, 0, R) sweeping to the +x ground rim (R, 0, 0).
    // Length = π/2 × R_LI ≈ 32,075 li — the radial-sweep value
    // observers measure from zenith down to the ground equator
    // along a meridian. Solid cyan to set it apart from the
    // dashed yellow Tang dimensions.
    const ARC_SEGS = 48;
    const celArcPts = [];
    for (let k = 0; k <= ARC_SEGS; k++) {
      const a = (k / ARC_SEGS) * (Math.PI / 2);
      celArcPts.push(R * Math.sin(a), 0, R * Math.cos(a));
    }
    const celArcGeom = new THREE.BufferGeometry();
    celArcGeom.setAttribute('position', new THREE.Float32BufferAttribute(celArcPts, 3));
    const celArcLine = new THREE.Line(celArcGeom, new THREE.LineBasicMaterial({
      color: 0x40c8ff, transparent: true, opacity: 0.95,
      depthTest: false, depthWrite: false,
    }));
    celArcLine.renderOrder = 50;
    celArcLine.frustumCulled = false;
    this.group.add(celArcLine);

    // Single-canvas labels — one image per name / value, always
    // facing the camera, never gibberish from oblique angles.
    // All values hard-coded from R_LI so HEIGHT, RADIUS,
    // DIAMETER, CIRCUMFERENCE, CELESTIAL ARC stay consistent
    // with the Tang sphere math regardless of canonical scale.
    const nameColor  = '#ffffff';
    const valueColor = '#ffe080';
    const arcColor   = '#a8e8ff';
    const labelHeight = 0.040;
    const fmtLi = (n) => `LI ${(Math.round(n * 100) / 100).toLocaleString()}`;
    const place = (text, color, x, y, z) => {
      const sp = makeTextSprite(text, color);
      setSpriteScale(sp, labelHeight);
      sp.position.set(x, y, z);
      sp.renderOrder = 252;
      this.group.add(sp);
    };

    // HEIGHT — vertical line midpoint = (0, 0, R/2). Name on +x
    // of the line, value on -x.
    place('HEIGHT',          nameColor,   R * 0.10, 0, R / 2);
    place(fmtLi(R_LI),       valueColor, -R * 0.10, 0, R / 2);

    // RADIUS — radial line midpoint = (R/2, 0). Name on +y,
    // value on -y.
    place('RADIUS',          nameColor,  R / 2,  R * 0.08, 1.5e-3);
    place(fmtLi(R_LI),       valueColor, R / 2, -R * 0.08, 1.5e-3);

    // DIAMETER — along y axis (perpendicular to the radius),
    // midpoint at origin. Name on +x, value on -x.
    place('DIAMETER',        nameColor,   R * 0.10, 0, 1.5e-3);
    place(fmtLi(2 * R_LI),   valueColor, -R * 0.10, 0, 1.5e-3);

    // CIRCUMFERENCE — anchored just past the ground ring at +y
    // (clear of the diameter / radius labels). Same camera-
    // facing sprite style.
    place('CIRCUMFERENCE',   nameColor,   0,  R * 1.18, 1.5e-3);
    place(fmtLi(2 * Math.PI * R_LI), valueColor, 0,  R * 1.10, 1.5e-3);

    // CELESTIAL ARC — anchored at the arc's midpoint
    // (45° up the dome, +x side).
    const arcMidA = Math.PI / 4;
    const arcMid  = [R * Math.sin(arcMidA), 0, R * Math.cos(arcMidA)];
    place('CELESTIAL ARC',   arcColor,   arcMid[0] + 0.06, arcMid[1], arcMid[2] + 0.04);
    place(fmtLi(Math.PI / 2 * R_LI), valueColor, arcMid[0] + 0.06, arcMid[1], arcMid[2] - 0.02);
  }

  update(model) {
    const s = model.state;
    const ge = s.WorldModel === 'ge';
    this.group.visible = !!s.ShowTangSphereDims && !ge;
    if (!this.group.visible) return;
    // Geometry locked to the canonical Tang sphere
    // (R = R_LI / (TANG_CIRC / 2) = 1/π) so HEIGHT, RADIUS,
    // DIAMETER, CIRCUMFERENCE all read the same canonical Tang
    // values regardless of the live OpticalVaultSize slider —
    // the overlay represents the Tang sphere itself, not the
    // movable observer dome.
    const R = R_LI / (TANG_CIRCUMFERENCE_LI / 2);
    const H = R;
    if (R !== this._cachedR || H !== this._cachedH) {
      this._rebuild(R, H);
      this._cachedR = R;
      this._cachedH = H;
    }
  }
}

// --- Sub-solar / sub-lunar ground points ---------------------------------
//
// Small disc-surface markers at the current lat/lon where the sun / moon are
// directly overhead. The sub-solar point traces an analemma-like path over
// the year; by turning on the tropic lines you can watch it pass through
// them at the solstices and cross the equator at the equinoxes.
export class GroundPoint {
  constructor(color) {
    this.group = new THREE.Group();
    this.group.name = 'gp';
    // Small flat disc lying on the ground. The shadow overlay writes no
    // depth, so depthTest: true still lets this be seen through the
    // shadow while being properly occluded by opaque geometry (observer
    // figures, Yggdrasil, Mt Meru, etc.) in front of it.
    this.dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.006, 20),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true, opacity: 0.85,
        depthTest: true, depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.dot.renderOrder = 40;
    this.group.add(this.dot);
  }
  updateAt(latDeg, lonDeg, feRadius = FE_RADIUS, visible = true, ge = false) {
    this.group.visible = visible;
    if (!visible) return;
    if (ge) {
      // Globe-Earth: project onto sphere surface at (lat, lon).
      // Tiny outward lift avoids z-fight with the terrestrial mesh.
      const phi = latDeg * Math.PI / 180;
      const lam = lonDeg * Math.PI / 180;
      const cp = Math.cos(phi);
      const r = feRadius * 1.001;
      this.dot.position.set(r * cp * Math.cos(lam), r * cp * Math.sin(lam), r * Math.sin(phi));
      // Orient the disc so its face points radially outward.
      this.dot.lookAt(0, 0, 0);
      this.dot.rotateY(Math.PI);
    } else {
      // Flat disc — sub-solar / sub-lunar dot lands at the geographic
      // lat/long via AE disc coords regardless of the map art.
      const p = canonicalLatLongToDisc(latDeg, lonDeg, feRadius);
      this.dot.position.set(p[0], p[1], 1e-3);
      this.dot.rotation.set(0, 0, 0);
    }
  }
}

// --- Day / night shadow on the disc --------------------------------------
//
// A transparent overlay on the disc that darkens regions far from the sun's
// foot-point. The sun sits on the vault of the heavens at (x, y, z>0); its
// foot-point on the disc is (x, y, 0). Fragments beyond a configurable
// illumination radius from that foot-point fade to dark.
//
// This is a rendering approximation, not a physical claim. It tracks the
// sun's real-sky position (driven by the real ephemeris) so the terminator
// sweeps across the disc at the correct rate for the current date / time.

const SHADOW_VERT = `
varying vec2 vXY;
void main() {
  vXY = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Real-sky day/night with twilight bands. Every fragment runs the full
// sun-elevation formula (elev = asin(sin φ sin δ + cos φ cos δ cos H)) using
// the current GMST + sun RA/Dec, so the terminator is geometrically correct
// and sweeps around the AE map in real proportion to where the sun is.
//
// The alpha ramp follows the astronomical twilight bands:
//   elev >   0°  : full day (no shadow)
//   0° to  -6°   : civil twilight  (warm glow at the rim)
//   -6° to -12°  : nautical twilight
//   -12° to -18° : astronomical twilight
//   elev < -18°  : full night
// Twilight palette chosen after the "Belt of Venus" — the rose/pink arch
// opposite a setting sun, sitting atop Earth's own shadow (deep blue).
// Real-terminator shape and size vary with the sun's declination; winter-
// hemisphere night caps get wider while summer-hemisphere caps shrink, so
// the shape of the shaded region visibly shifts across the year.
const SHADOW_FRAG = `
precision highp float;
uniform float uSunRA;
uniform float uSunDec;
uniform float uGMSTRad;
uniform float uDiscRadius;
uniform float uMaxDarkness;
uniform float uIsDp;
varying vec2  vXY;
const float PI      = 3.14159265358979;
const float HALF_PI = 1.57079632679489;
const float RAD2DEG = 57.2957795;

void main() {
  float r = length(vXY);
  if (r > uDiscRadius) discard;

  float lat;
  float lon;
  if (uIsDp > 0.5) {
    // Dual-pole AE inverse, centred at (0°, 0°). c = π·ρ/R; the
    // disc-rim sits at c = π. Singular at the centre — return the
    // projection's centre coords (0, 0) there.
    float rho = r;
    if (rho < 1e-6) {
      lat = 0.0;
      lon = 0.0;
    } else {
      float cAng = PI * rho / uDiscRadius;
      float sinC = sin(cAng);
      float cosC = cos(cAng);
      lat = asin(clamp(vXY.y * sinC / rho, -1.0, 1.0));
      lon = atan(vXY.x * sinC, rho * cosC);
    }
  } else {
    lat = HALF_PI - (r / uDiscRadius) * PI;
    lon = atan(vXY.y, vXY.x);
  }

  float lha = uGMSTRad + lon - uSunRA;
  float sinElev = sin(lat) * sin(uSunDec)
                + cos(lat) * cos(uSunDec) * cos(lha);
  float elev = asin(clamp(sinElev, -1.0, 1.0)) * RAD2DEG;

  // Belt of Venus palette:
  //   rose (~255, 180, 185) sits just above horizon opposite the sun,
  //   earth's shadow (~75, 95, 135) is the blue band below,
  //   deep night is a dark indigo far from the terminator.
  vec3 roseColor   = vec3(0.98, 0.70, 0.72);   // Belt of Venus crest
  vec3 shadowColor = vec3(0.28, 0.36, 0.55);   // Earth's shadow band
  vec3 nightColor  = vec3(0.02, 0.03, 0.09);   // full-night indigo

  // Blend through the three zones as elevation drops below the horizon.
  // Rose persists deeper into the shadow side so the sunset/sunrise gradient
  // visibly bleeds across the terminator instead of cutting off at -10°.
  vec3 color = roseColor;
  color = mix(color, shadowColor, smoothstep(-2.0, -16.0, elev));
  color = mix(color, nightColor,  smoothstep(-14.0, -22.0, elev));

  // Alpha: base night darkness ramps in through twilight, plus a wide rose
  // highlight band that runs from above the horizon all the way through the
  // shadow zone (sunset / sunrise glow).
  float night = 1.0 - smoothstep(-22.0, 0.0, elev);
  float arch  = smoothstep(-16.0, -2.0, elev)
              * (1.0 - smoothstep(-2.0, 4.0, elev));
  float alpha = max(night * uMaxDarkness, arch * 0.65);
  gl_FragColor = vec4(color, alpha);
}
`;

// --- Solar-eclipse ground shadow ----------------------------------
//
// Derives the umbra and penumbra footprint on the ground each frame
// from the actual sun and moon 3D positions in the FE scene. No
// decorative follower — the boundary comes from ray-projected cone
// geometry:
//
//   1. Treat sun and moon as disks (perpendicular to the sun-moon
//      axis) with physical radii r_s and r_m in FE units.
//   2. Sample N=48 points around the sun-disk edge.
//   3. For the **umbra boundary**, each sun-edge point projects
//      through the *same-side* moon-edge point; that ray extended
//      to z=0 lands on the umbra boundary on the ground.
//   4. For the **penumbra boundary**, the sun-edge point projects
//      through the *opposite-side* moon-edge point.
//   5. Umbra is suppressed (no ground totality spot) when the cone
//      apex sits above the ground — annular / partial regime.
//
// Because the axis from sun through moon is generally tilted with
// respect to the disc normal (0, 0, 1), the intersection of each
// cone with the z=0 plane is an **ellipse**, not a circle, whenever
// sun and moon aren't directly overhead. As the eclipse progresses
// the sun + moon positions change and the ellipse stretches /
// rotates / slides across the disc — which is the true eclipse path
// behaviour that 's circular decal could not produce.
//
// Sun / moon physical radii default to FE-scale constants chosen so
// the typical shadow is visible (umbra a few percent of the FE
// radius; penumbra an order of magnitude larger). They can be
// overridden via state (`EclipseSunRadiusFE`, `EclipseMoonRadiusFE`)
// — the demo registry may set these per-event if a future serial
// wants to scale shadow by actual Espenak magnitude data.
//
// Observer occupancy is a proper point-in-polygon test against the
// derived footprint, not a point-in-circle test. Full darkness inside
// the umbra, partial across the penumbra.
export class EclipseShadow {
  constructor(feRadius = FE_RADIUS) {
    this.group = new THREE.Group();
    this.group.name = 'eclipseShadow';
    this.feRadius = feRadius;

    this.penumbraMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true, opacity: 0.32,
      depthTest: true, depthWrite: false, side: THREE.DoubleSide,
    });
    this.penumbraMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.penumbraMat);
    this.penumbraMesh.position.z = 4e-4;
    this.penumbraMesh.renderOrder = 8;
    this.group.add(this.penumbraMesh);

    this.umbraMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true, opacity: 0.90,
      depthTest: true, depthWrite: false, side: THREE.DoubleSide,
    });
    this.umbraMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.umbraMat);
    this.umbraMesh.position.z = 5e-4;
    this.umbraMesh.renderOrder = 9;
    this.group.add(this.umbraMesh);

    this.group.visible = false;
    this._umbraPoly    = null;
    this._penumbraPoly = null;
  }

  update(model) {
    const s = model.state, c = model.computed;
    const active = !!s.EclipseActive && s.EclipseKind === 'solar';
    this.group.visible = active;
    if (!active) {
      this._umbraPoly = null;
      this._penumbraPoly = null;
      return;
    }

    const S = c.SunVaultCoord, M = c.MoonVaultCoord;
    if (!S || !M) return;

    // Default FE-scale body radii. Chosen so the umbra cone
    // actually reaches the disc at typical vault heights:
    // umbra reaches ground iff  Mz/Sz < r_m/r_s  (derivation in
    // changelog). With default SunVaultHeight = 0.5 and
    // MoonVaultHeight = 0.4, Mz/Sz = 0.8 — so we pick r_m/r_s
    // slightly above that threshold.
    const r_s = s.EclipseSunRadiusFE  ?? 0.030;
    const r_m = s.EclipseMoonRadiusFE ?? 0.025;

    const footprint = this._computeFootprint(S, M, r_s, r_m, 48);
    this._umbraPoly    = footprint.umbraPoly;
    this._penumbraPoly = footprint.penumbraPoly;

    // Penumbra — always draw if derived geometry yields one.
    if (this._penumbraPoly && this._penumbraPoly.length >= 3) {
      this._rebuildShapeMesh(this.penumbraMesh, this._penumbraPoly);
      this.penumbraMesh.visible = true;
    } else {
      this.penumbraMesh.visible = false;
    }

    // Umbra — only when the derived geometry supports it AND the
    // tabulated magnitude says it's a central eclipse.
    const mag = s.EclipseMagnitude ?? 1;
    if (footprint.umbraExists && mag >= 0.99 && this._umbraPoly && this._umbraPoly.length >= 3) {
      this._rebuildShapeMesh(this.umbraMesh, this._umbraPoly);
      this.umbraMesh.visible = true;
    } else {
      this.umbraMesh.visible = false;
    }
  }

  // Ray-sampled cone-ground intersection. Returns arrays of [x, y]
  // ground points for the umbra and penumbra boundaries.
  _computeFootprint(S, M, r_s, r_m, N) {
    const Sx = S[0], Sy = S[1], Sz = S[2];
    const Mx = M[0], My = M[1], Mz = M[2];
    const dx = Mx - Sx, dy = My - Sy, dz = Mz - Sz;
    const D  = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (D < 1e-6) return { umbraPoly: null, penumbraPoly: null, umbraExists: false };

    // Unit direction from sun → moon.
    const dhx = dx / D, dhy = dy / D, dhz = dz / D;

    // Perpendicular basis (e1, e2) spanning the sun/moon disk planes.
    // Pick a seed not parallel to dhat, then Gram-Schmidt.
    const seed = Math.abs(dhz) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    // e1 = normalize(cross(dhat, seed))
    let e1x = dhy * seed[2] - dhz * seed[1];
    let e1y = dhz * seed[0] - dhx * seed[2];
    let e1z = dhx * seed[1] - dhy * seed[0];
    const e1n = Math.sqrt(e1x * e1x + e1y * e1y + e1z * e1z);
    if (e1n < 1e-9) return { umbraPoly: null, penumbraPoly: null, umbraExists: false };
    e1x /= e1n; e1y /= e1n; e1z /= e1n;
    // e2 = cross(dhat, e1)
    const e2x = dhy * e1z - dhz * e1y;
    const e2y = dhz * e1x - dhx * e1z;
    const e2z = dhx * e1y - dhy * e1x;

    // Umbra cone apex: A_u = S + (D · r_s / (r_s − r_m)) · dhat
    // Only meaningful if r_s > r_m; apex z must be below ground for
    // the umbra to reach z=0 as an ellipse (otherwise annular-style).
    const rsmDiff = r_s - r_m;
    const D_u  = rsmDiff > 1e-9 ? D * r_s / rsmDiff : Infinity;
    const apexZ = Sz + dhz * D_u;
    const umbraExists = Number.isFinite(D_u) && apexZ < 0;

    const umbraPoly = [];
    const penumbraPoly = [];

    for (let k = 0; k < N; k++) {
      const phi = (k / N) * 2 * Math.PI;
      const cp = Math.cos(phi), sp = Math.sin(phi);

      // Sun-disk edge at angle phi.
      const psx = Sx + r_s * (cp * e1x + sp * e2x);
      const psy = Sy + r_s * (cp * e1y + sp * e2y);
      const psz = Sz + r_s * (cp * e1z + sp * e2z);

      // Moon-disk edge at SAME angle (for the umbra tangent ray).
      const pmux = Mx + r_m * (cp * e1x + sp * e2x);
      const pmuy = My + r_m * (cp * e1y + sp * e2y);
      const pmuz = Mz + r_m * (cp * e1z + sp * e2z);

      // Moon-disk edge at OPPOSITE angle (for the penumbra tangent).
      const pmpx = Mx - r_m * (cp * e1x + sp * e2x);
      const pmpy = My - r_m * (cp * e1y + sp * e2y);
      const pmpz = Mz - r_m * (cp * e1z + sp * e2z);

      // Umbra ray: sun-edge → same-side moon-edge, extend to z=0.
      if (umbraExists) {
        const denom = pmuz - psz;
        if (Math.abs(denom) > 1e-9) {
          const t = -psz / denom;
          if (t > 1) {   // ray actually reaches ground beyond the moon
            umbraPoly.push([psx + t * (pmux - psx), psy + t * (pmuy - psy)]);
          }
        }
      }

      // Penumbra ray: sun-edge → opposite-side moon-edge, extend to z=0.
      const denomP = pmpz - psz;
      if (Math.abs(denomP) > 1e-9) {
        const t = -psz / denomP;
        if (t > 1) {
          penumbraPoly.push([psx + t * (pmpx - psx), psy + t * (pmpy - psy)]);
        }
      }
    }

    return {
      umbraPoly:    umbraPoly.length    >= 3 ? umbraPoly    : null,
      penumbraPoly: penumbraPoly.length >= 3 ? penumbraPoly : null,
      umbraExists,
    };
  }

  _rebuildShapeMesh(mesh, points2D) {
    if (mesh.geometry) mesh.geometry.dispose();
    const shape = new THREE.Shape();
    shape.moveTo(points2D[0][0], points2D[0][1]);
    for (let i = 1; i < points2D.length; i++) {
      shape.lineTo(points2D[i][0], points2D[i][1]);
    }
    shape.closePath();
    mesh.geometry = new THREE.ShapeGeometry(shape);
  }

  // Observer occupancy via point-in-polygon against the derived
  // footprint. Full dark inside umbra; inside penumbra, smooth
  // distance-to-edge ramp using the barycentric distance to the
  // polygon centroid so observers near the centre darken more than
  // those near the penumbra rim.
  computeObserverDarkFactor(model) {
    const s = model.state;
    if (!s.EclipseActive || s.EclipseKind !== 'solar') return 0;
    const obs = model.computed.ObserverFeCoord;
    const p = [obs[0], obs[1]];

    if (this._umbraPoly && this._pointInPoly(p, this._umbraPoly)) {
      return 1.0;
    }
    if (this._penumbraPoly && this._pointInPoly(p, this._penumbraPoly)) {
      // Linear falloff: 1 at centroid, 0 at polygon edge (approx).
      const c = this._polyCentroid(this._penumbraPoly);
      const dToC = Math.hypot(p[0] - c[0], p[1] - c[1]);
      const rEdge = this._approxPolyRadiusInDir(this._penumbraPoly, c, [p[0] - c[0], p[1] - c[1]]);
      const ratio = rEdge > 1e-9 ? Math.max(0, 1 - dToC / rEdge) : 0;
      const peak  = (s.EclipseMagnitude ?? 1) >= 0.99 ? 1.0 : 0.6;
      return ratio * peak;
    }
    return 0;
  }

  _pointInPoly(p, poly) {
    let inside = false;
    const [x, y] = p;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      const crosses = ((yi > y) !== (yj > y))
                    && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (crosses) inside = !inside;
    }
    return inside;
  }

  _polyCentroid(poly) {
    let sx = 0, sy = 0;
    for (const pt of poly) { sx += pt[0]; sy += pt[1]; }
    return [sx / poly.length, sy / poly.length];
  }

  // Approx distance from `centre` to the polygon edge along direction
  // `dir` (unnormalised). Walks each edge, finds the intersection of
  // the ray centre+t·dir with the segment, returns the smallest t>0.
  _approxPolyRadiusInDir(poly, centre, dir) {
    const dx = dir[0], dy = dir[1];
    const L = Math.hypot(dx, dy);
    if (L < 1e-9) return 0;
    const nx = dx / L, ny = dy / L;
    let best = Infinity;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const ax = poly[j][0] - centre[0], ay = poly[j][1] - centre[1];
      const bx = poly[i][0] - centre[0], by = poly[i][1] - centre[1];
      // Solve centre + t·(nx,ny) = a + s·(b − a) for 0 ≤ s ≤ 1, t ≥ 0.
      const dbx = bx - ax, dby = by - ay;
      const det = nx * (-dby) - ny * (-dbx);
      if (Math.abs(det) < 1e-12) continue;
      const t = (ax * (-dby) - ay * (-dbx)) / det;
      const sParam = (nx * ay - ny * ax) / det;
      if (t >= 0 && sParam >= 0 && sParam <= 1 && t < best) best = t;
    }
    return Number.isFinite(best) ? best : 0;
  }
}

export class Shadow {
  constructor(feRadius = FE_RADIUS) {
    this.group = new THREE.Group();
    this.group.name = 'shadow';
    // Geometry is a disc slightly larger than the FE disc (the fragment
    // shader discards outside radius == feRadius).
    const geom = new THREE.CircleGeometry(feRadius * 1.02, 128);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uSunRA:       { value: 0 },
        uSunDec:      { value: 0 },
        uGMSTRad:     { value: 0 },
        uDiscRadius:  { value: feRadius },
        uMaxDarkness: { value: 0.7 },
        uIsDp:        { value: 0 },
      },
      vertexShader: SHADOW_VERT,
      fragmentShader: SHADOW_FRAG,
      transparent: true,
      // depthTest off so the log-depth buffer (S744) can't z-fight
      // the shadow away from the disc base — the renderOrder pass
      // is enough to keep it above land / grid without depth
      // comparison. depthWrite stays off so transparent layers
      // above (vault dots, markers) still composite correctly.
      depthTest: false,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geom, this.material);
    this.mesh.position.z = 0.0015; // well clear of land + grid
    this.mesh.renderOrder = 5;     // after opaque land, before vault dots
    this.group.add(this.mesh);
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    // GE has its own sphere day/night shader (`uDayNightOn` in
    // WorldGlobe); the AE shadow disc is FE / DP only and would
    // otherwise paint a pink ring through the sphere shell.
    const ge = s.WorldModel === 'ge';
    this.group.visible = !!s.ShowShadow && !ge;
    if (!this.group.visible) return;
    const u = this.material.uniforms;
    u.uSunRA.value   = c.SunRA;
    u.uSunDec.value  = c.SunDec;
    u.uGMSTRad.value = c.SkyRotAngle * Math.PI / 180;
    u.uIsDp.value    = s.WorldModel === 'dp' ? 1 : 0;
  }
}

export class DiscGrid {
  constructor(feRadius = FE_RADIUS) {
    this.group = new THREE.Group();
    this.group.name = 'disc-grid';
    this._feRadius = feRadius;
    this.lines = makeLineSegments([], 0x556677, { opacity: 0.4 });
    this.group.add(this.lines);
    this._lastProj = null;
    this._rebuild();
  }
  _rebuild() {
    const feRadius = this._feRadius;
    const segs = [];
    for (let lat = -90 + 15; lat <= 75; lat += 15) {
      const ringPts = [];
      for (let k = 0; k <= 120; k++) {
        const lon = -180 + k * 3;
        const p = canonicalLatLongToDisc(lat, lon, feRadius);
        ringPts.push(p[0], p[1], 2e-4);
      }
      for (let k = 0; k < ringPts.length - 3; k += 3) {
        segs.push(ringPts[k], ringPts[k + 1], ringPts[k + 2],
                  ringPts[k + 3], ringPts[k + 4], ringPts[k + 5]);
      }
    }
    // Meridians as polylines so non-AE projections (e.g. DP) render
    // them as curves rather than chords from pole to pole.
    for (let lon = -180; lon < 180; lon += 15) {
      let prev = null;
      for (let k = 0; k <= 60; k++) {
        const lat = -90 + k * 3;
        const p = canonicalLatLongToDisc(lat, lon, feRadius);
        if (prev) {
          segs.push(prev[0], prev[1], 2e-4, p[0], p[1], 2e-4);
        }
        prev = p;
      }
    }
    const attr = new THREE.Float32BufferAttribute(segs, 3);
    this.lines.geometry.setAttribute('position', attr);
    this.lines.geometry.attributes.position.needsUpdate = true;
    this.lines.geometry.computeBoundingSphere();
  }
  update(model) {
    const s = model.state;
    this.group.visible = s.ShowFeGrid;
    const proj = s.WorldModel === 'dp' ? 'dp' : (s.MapProjection || 'ae');
    if (proj !== this._lastProj) {
      this._rebuild();
      this._lastProj = proj;
    }
  }
}

// --- Dome ------------------------------------------------------------------

export class VaultOfHeavens {
  constructor(clippingPlanes = []) {
    this.group = new THREE.Group();
    this.group.name = 'dome';

    // three.js SphereGeometry defaults to a +y pole. Our scene is z-up, so
    // rotate the geometry so its pole points along +z. Otherwise the
    // hemisphere ends up lying on its side (half of it below the disc).
    const shellGeom = new THREE.SphereGeometry(1, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    shellGeom.rotateX(Math.PI / 2);

    this.shell = new THREE.Mesh(
      shellGeom,
      new THREE.MeshBasicMaterial({
        color: 0xa0b8d0, transparent: true, opacity: 0.12,
        side: THREE.DoubleSide, depthWrite: false,
        clippingPlanes,
      }),
    );
    this.group.add(this.shell);

    this.grid = new THREE.Group();
    this.group.add(this.grid);
  }

  _rebuildGrid(domeSize, domeHeight) {
    // Dispose previous children.
    while (this.grid.children.length) {
      const c = this.grid.children.pop();
      c.geometry?.dispose();
      c.material?.dispose();
    }

    const segs = [];
    // Latitude rings (in celestial frame dome projection).
    for (let lat = 0; lat <= 75; lat += 15) {
      for (let k = 0; k < 120; k++) {
        const lon1 = -180 + k * 3;
        const lon2 = -180 + (k + 1) * 3;
        const a = celestLatLongToVaultCoord(lat, lon1, domeSize, domeHeight);
        const b = celestLatLongToVaultCoord(lat, lon2, domeSize, domeHeight);
        segs.push(a[0], a[1], a[2], b[0], b[1], b[2]);
      }
    }
    // Longitude rays (from horizon to zenith).
    for (let lon = 0; lon < 360; lon += 15) {
      for (let lat = 0; lat < 90; lat += 3) {
        const a = celestLatLongToVaultCoord(lat, lon, domeSize, domeHeight);
        const b = celestLatLongToVaultCoord(lat + 3, lon, domeSize, domeHeight);
        segs.push(a[0], a[1], a[2], b[0], b[1], b[2]);
      }
    }
    const g = makeLineSegments(segs, 0x6088c0, { opacity: 0.6 });
    this.grid.add(g);
    this._lastSize = domeSize;
    this._lastHeight = domeHeight;
  }

  update(model) {
    const s = model.state;
    const domeRadius = s.VaultSize * FE_RADIUS;
    this.shell.scale.set(domeRadius, domeRadius, s.VaultHeight);
    if (this._lastSize !== s.VaultSize || this._lastHeight !== s.VaultHeight) {
      this._rebuildGrid(s.VaultSize, s.VaultHeight);
    }
    this.shell.visible = s.ShowVault !== false;
    this.grid.visible = !!s.ShowVaultGrid;
  }
}

// --- Inner celestial sphere (observer-local wireframe globe) ---------------

export class ObserversOpticalVault {
  constructor(clippingPlanes = []) {
    this.group = new THREE.Group();
    this.group.name = 'inner-sphere';

    // Upper hemisphere with pole rotated onto +z (scene is z-up).
    // The rim sits exactly in the tangent plane at the observer:
    // 90° from the optical-vault's pole (zenith) lines up with the
    // local horizon, which is where the terrestrial sphere's
    // curvature begins to occlude bodies (Polaris drops below this
    // line for southern-hemisphere observers).
    const meshGeom = new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    meshGeom.rotateX(Math.PI / 2);
    // Day/night-aware sky cap. Color and opacity lerp between a
    // bright sky-blue (NightFactor = 0) and a near-invisible dim
    // grey (NightFactor = 1) so the cap behaves like a blue sky
    // during the day (visually masking heavenly-vault objects) and
    // fades out at night so the projected starfield reads cleanly.
    // Backside-only render so the dome is invisible from orbit;
    // shows up only when the camera sits inside the hemisphere.
    this._capDayColor   = new THREE.Color(0x88b8e8);
    this._capNightColor = new THREE.Color(0x4a4a4a);
    this.mesh = new THREE.Mesh(
      meshGeom,
      new THREE.MeshBasicMaterial({
        color: this._capDayColor.clone(), transparent: true, opacity: 0.35,
        side: THREE.BackSide, depthWrite: false,
        clippingPlanes,
      }),
    );
    this.group.add(this.mesh);

    // Stellarium-style alt/az grid on the optical vault: altitude
    // rings every 15° (at 15°/30°/45°/60°/75°) and azimuth meridians
    // every 15° (24 of them). Same geometry viewed from inside
    // (first-person) or outside (orbit) — azimuth and altitude cells
    // therefore read identically in both modes.
    this.wire = new THREE.LineSegments(
      buildLatLongHemisphereGeom(1, 6, 24),
      new THREE.LineBasicMaterial({
        color: 0x7a8499, transparent: true, opacity: 0.55,
        clippingPlanes,
      }),
    );
    this.group.add(this.wire);

    // Axes to indicate local north/east/up.
    //   +x north → green, +y east → blue, +z up (zenith) → red.
    // Red marks "perpendicular to the ground" so it reads consistently
    // on both the FE disc and the GE sphere; green/blue stay tangent.
    const axisLen = 1;
    const axes = [
      0, 0, 0, axisLen, 0, 0, // +x north
      0, 0, 0, 0, axisLen, 0, // +y east
      0, 0, 0, 0, 0, axisLen, // +z up (zenith)
    ];
    const axisColors = [
      0, 0.6, 0, 0, 0.6, 0,   // north → green
      0, 0, 1, 0, 0, 1,       // east  → blue
      1, 0, 0, 1, 0, 0,       // up    → red
    ];
    const axisGeom = new THREE.BufferGeometry();
    axisGeom.setAttribute('position', new THREE.Float32BufferAttribute(axes, 3));
    axisGeom.setAttribute('color', new THREE.Float32BufferAttribute(axisColors, 3));
    this.axes = new THREE.LineSegments(
      axisGeom,
      new THREE.LineBasicMaterial({ vertexColors: true }),
    );
    this.group.add(this.axes);

    // Cardinal direction labels (N/E/S/W). Live on a sub-group that scales
    // with the optical vault radius so the letters sit just outside the rim.
    // FE-disc convention: north = toward the disc centre (the pole), so for
    // an observer whose local-frame +x points radially outward (away from
    // the pole), local -x is north and local +x is south. East then sits at
    // local +y (compass clockwise from north), west at local -y.
    // Colour pairs (N+S red, E+W green) keep opposite cardinals legible
    // against day/ocean backgrounds where blues used to disappear.
    this.cardinalsGroup = new THREE.Group();
    this.cardinalsGroup.name = 'cardinals';
    // unit-direction recorded on each sprite so
    // update() can re-home the label between the coarse radius (1.14,
    // floating above the rim) and the refined radius (1.00, sitting
    // on its own meridian ray as a compact anchor).
    const cardinalDefs = [
      { letter: 'N', dir: [-1,  0], color: '#ff6868' },
      { letter: 'S', dir: [ 1,  0], color: '#ff6868' },
      { letter: 'E', dir: [ 0,  1], color: '#7fe39a' },
      { letter: 'W', dir: [ 0, -1], color: '#7fe39a' },
    ];
    this._cardinalSprites = [];
    for (const d of cardinalDefs) {
      const sp = makeTextSprite(d.letter, d.color);
      sp.userData.baseDir = d.dir;
      sp.position.set(1.14 * d.dir[0], 1.14 * d.dir[1], 0.02);
      setSpriteScale(sp, 0.10);
      this.cardinalsGroup.add(sp);
      this._cardinalSprites.push(sp);
    }
    this.group.add(this.cardinalsGroup);

    // Compass-azimuth ring on the vault rim. Ticks at 5° minor / 15°
    // major, numeric labels every 15° (skipping the four cardinal
    // slots since N/E/S/W own those). Shares the 1.14 label radius
    // with the cardinals, so azimuth 0 / 30 / 60 / 90 / ... and the
    // N/E/S/W letters all sit on a single ring — this is the
    // canonical heading scale that persists between Optical and
    // Heavenly views.
    this.azimuthGroup = new THREE.Group();
    this.azimuthGroup.name = 'azimuth-ring';
    const azPts = [];
    const addTicks = (step, inner, outer) => {
      for (let az = 0; az < 360; az += step) {
        // az=0 → local-FE −x; az=90 → +y; az=180 → +x; az=270 → −y.
        const phi = Math.atan2(Math.sin(az * Math.PI / 180),
                              -Math.cos(az * Math.PI / 180));
        const cos = Math.cos(phi), sin = Math.sin(phi);
        azPts.push(inner * cos, inner * sin, 0.01,
                   outer * cos, outer * sin, 0.01);
      }
    };
    addTicks(15, 1.00, 1.08);
    addTicks(5,  1.00, 1.04);
    const azGeom = new THREE.BufferGeometry();
    azGeom.setAttribute('position', new THREE.Float32BufferAttribute(azPts, 3));
    this.azimuthTicks = new THREE.LineSegments(
      azGeom,
      new THREE.LineBasicMaterial({
        color: 0xf4a640, transparent: true, opacity: 0.9,
        depthTest: false, depthWrite: false,
      }),
    );
    this.azimuthGroup.add(this.azimuthTicks);
    // collect the coarse 15° azimuth labels into a list so
    // update() can re-home them onto the pitch-driven reading band
    // each frame. `basePhi` is stashed on each sprite so we don't
    // recompute atan2 every frame.
    this._azimuthLabels = [];
    for (let az = 0; az < 360; az += 15) {
      if (az % 90 === 0) continue;
      const phi = Math.atan2(Math.sin(az * Math.PI / 180),
                            -Math.cos(az * Math.PI / 180));
      const sp = makeTextSprite(String(az) + '°', '#f4a640');
      sp.userData.basePhi = phi;
      sp.position.set(1.14 * Math.cos(phi), 1.14 * Math.sin(phi), 0.01);
      const labelScale = az % 30 === 0 ? 0.09 : 0.075;
      setSpriteScale(sp, labelScale);
      this.azimuthGroup.add(sp);
      this._azimuthLabels.push(sp);
    }
    this.group.add(this.azimuthGroup);

    // ----- : refined DMS azimuth scale ---------------------------
    // When the Optical-vault mousewheel narrows the camera FOV, this
    // overlay rebuilds ticks / labels at a cadence appropriate to the
    // visible window. Tick positions come from the same canonical
    // compass-azimuth axis the coarse ring uses, so the reading
    // under the camera centre is always `ObserverHeading` — zoom is
    // pure angular refinement, not a reinterpretation.
    //
    // Cadences (visible-FOV driven):
    //   FOV ≥ 30°     : coarse ring only (this overlay empty).
    //   FOV ≥ 8°      : 5° major, 1° minor, label every 5°.
    //   FOV ≥ 2°      : 1° major, 5' minor, label every 1°.
    //   FOV ≥ 0.5°    : 10' major, 1' minor, label every 10'.
    //   FOV ≥ 0.1°    : 1' major, 6" minor, label every 1'.
    //   FOV ≥ 0.02°   : 10" major, 1" minor, label every 10".
    //   FOV <  0.02°  : 1" major, 0.1" minor, label every 1".
    this.refinedAzGroup = new THREE.Group();
    this.refinedAzGroup.name = 'refined-azimuth';
    // Pool up to REFINED_MAX_TICKS tick segments; draw range clamps
    // to how many we actually emit per frame.
    const REFINED_MAX_TICKS = 512;
    this._refinedPos = new Float32Array(REFINED_MAX_TICKS * 6);
    const refGeom = new THREE.BufferGeometry();
    refGeom.setAttribute('position', new THREE.BufferAttribute(this._refinedPos, 3));
    refGeom.setDrawRange(0, 0);
    this.refinedTicks = new THREE.LineSegments(
      refGeom,
      new THREE.LineBasicMaterial({
        color: 0xf4a640, transparent: true, opacity: 0.95,
        depthTest: false, depthWrite: false,
      }),
    );
    this.refinedAzGroup.add(this.refinedTicks);
    // Label pool — sprites whose canvas texture we rewrite on demand.
    // bumped 24 → 64. With labelEvery always = 1° in refined,
    // the widest refined FOV (just under 30°) emits up to ~43 labels;
    // 64 gives headroom so we never hit the pool-length cap and lose
    // labels at the edges of the window.
    this._refinedLabelPool = [];
    const REFINED_MAX_LABELS = 64;
    for (let i = 0; i < REFINED_MAX_LABELS; i++) {
      const sp = makeTextSprite(' ', '#f4a640');
      sp.visible = false;
      setSpriteScale(sp, 0.085);
      this.refinedAzGroup.add(sp);
      this._refinedLabelPool.push(sp);
    }
    this._refineKey = null;   // cache key: (fov, heading, mode) rounded
    // initialise the refined-state flags so the first call to
    // _updateRefinedScale always sees a clean transition edge. Without
    // this, _refinedActive is undefined on the first frame after
    // entering Optical, which defeats the transition-invalidation
    // logic below and can leave the active-meridian arc un-emitted.
    this._refinedActive   = false;
    this._refinedActiveAz = null;
    this.group.add(this.refinedAzGroup);

    // ----- : right-side elevation (latitude) scale -----------------
    // The algebraic DUAL of the azimuth reading band. Where azimuth
    // labels sit at FIXED azimuths and VARIABLE elevation (pitch-
    // driven), elevation labels sit at VARIABLE azimuth (heading-
    // driven, offset to the right side of the view) and FIXED
    // elevation values. Cadence ladder mirrors refinedAzCadenceForFov:
    // 15° at coarse (FOV ≥ 30°), 5° at refined 5° (8° ≤ FOV < 30°),
    // 1° at refined 1° (FOV < 8°). Colour `#8ed4ff` (light blue)
    // visually distinguishes the altitude axis from the orange-yellow
    // azimuth axis.
    //
    // replaced the original 20-slot dynamic-repaint pool
    // with one pre-painted sprite per integer elevation 0°–85° (86
    // sprites). The earlier pool windowed emission to the visible
    // vertical band; at 1° cadence with vFov ≤ 8° that emitted at
    // most ~8 labels and the higher cadence multiples were never in
    // the scene graph, so a couldn't see the scale extend
    // toward zenith even when the lower portion was rendered. Now
    // every cadence-multiple is in the scene at all times; the
    // per-frame work is just a visibility toggle + position update,
    // and three.js frustum culling handles which sprites actually
    // render. Each sprite carries `userData.elev = e` so
    // _updateElevScale can decide visibility purely from that.
    this.elevLabelsGroup = new THREE.Group();
    this.elevLabelsGroup.name = 'elevation-scale';
    this._elevLabels = [];
    for (let e = 0; e <= 85; e++) {
      const sp = makeTextSprite(e + '°', '#8ed4ff');
      sp.visible = false;
      setSpriteScale(sp, 0.02);
      sp.userData.elev = e;
      this.elevLabelsGroup.add(sp);
      this._elevLabels.push(sp);
    }
    this.group.add(this.elevLabelsGroup);

    // ----- : refined meridian-arc grid -----------------------------
    // The "refined longitudinal grid" — full meridian arcs from horizon
    // to zenith emitted at the cadence's majorArc / minorArc strides,
    // windowed to the visible heading range. This subgroup is scaled
    // (r, r, h) at render time so arcs sit on the optical-vault
    // hemisphere exactly like the static wire does.
    this.refinedMeridiansGroup = new THREE.Group();
    this.refinedMeridiansGroup.name = 'refined-meridians';
    // Each arc tessellates into ARC_SEGS line segments between horizon
    // and zenith. Pre-allocate buffers big enough for the worst-case
    // visible-window arc count at the finest cadence.
    const ARC_SEGS = 16;
    this._arcSegs  = ARC_SEGS;
    this._majorMeridianBuf = new Float32Array(800 * ARC_SEGS * 6);   // up to 800 major arcs
    this._minorMeridianBuf = new Float32Array(2400 * ARC_SEGS * 6);  // up to 2400 minor arcs
    const majGeom = new THREE.BufferGeometry();
    majGeom.setAttribute('position', new THREE.BufferAttribute(this._majorMeridianBuf, 3));
    majGeom.setDrawRange(0, 0);
    // meridians rendered white so the active-meridian highlight
    // (orange-yellow #ffd24a, same colour as the heading arrow) reads
    // cleanly against the grid instead of fighting the old steel-blue
    // palette. Majors are solid-ish (0.7); minors sit back at 0.3.
    this.refinedMajorMeridians = new THREE.LineSegments(
      majGeom,
      new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.7,
        depthTest: false, depthWrite: false, clippingPlanes,
      }),
    );
    const minGeom = new THREE.BufferGeometry();
    minGeom.setAttribute('position', new THREE.BufferAttribute(this._minorMeridianBuf, 3));
    minGeom.setDrawRange(0, 0);
    this.refinedMinorMeridians = new THREE.LineSegments(
      minGeom,
      new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.3,
        depthTest: false, depthWrite: false, clippingPlanes,
      }),
    );
    // active-meridian overlay. A single meridian arc drawn at
    // the nearest major-cadence azimuth to ObserverHeading, in the same
    // yellow as the heading arrow / ray so a can see which
    // longitude line they are inspecting. One arc × arcSegs line
    // segments × 2 endpoints × 3 coords = arcSegs·6 floats.
    this._activeMeridianBuf = new Float32Array(ARC_SEGS * 6);
    const actGeom = new THREE.BufferGeometry();
    actGeom.setAttribute('position', new THREE.BufferAttribute(this._activeMeridianBuf, 3));
    actGeom.setDrawRange(0, 0);
    this.refinedActiveMeridian = new THREE.LineSegments(
      actGeom,
      new THREE.LineBasicMaterial({
        color: 0xffd24a, transparent: true, opacity: 1.0,
        depthTest: false, depthWrite: false, clippingPlanes,
      }),
    );
    this.refinedActiveMeridian.renderOrder = 62;
    this.refinedMeridiansGroup.add(this.refinedMinorMeridians);
    this.refinedMeridiansGroup.add(this.refinedMajorMeridians);
    this.refinedMeridiansGroup.add(this.refinedActiveMeridian);

    // refined altitude rings, the horizontal
    // counterpart to refinedMajorMeridians. Lives inside
    // refinedMeridiansGroup so it inherits the (r, r, h) flattened
    // vault scale and lands on the same surface the static wire's
    // rings do. Buffer pre-sized for the worst case at 1° cadence
    // (86 rings × ALT_RING_SEGS segments × 6 floats per segment).
    // Cadence cache `_refinedAltRingsCadence` avoids re-emission per
    // frame — only when the regime changes (5° ↔ 1° ↔ coarse-hidden)
    // does the buffer get rewritten.
    const ALT_RING_SEGS = 32;
    const ALT_RING_MAX  = 86;
    this._refinedAltRingSegs = ALT_RING_SEGS;
    this._refinedAltRingBuf  = new Float32Array(ALT_RING_MAX * ALT_RING_SEGS * 6);
    const altRingGeom = new THREE.BufferGeometry();
    altRingGeom.setAttribute('position', new THREE.BufferAttribute(this._refinedAltRingBuf, 3));
    altRingGeom.setDrawRange(0, 0);
    this.refinedAltRings = new THREE.LineSegments(
      altRingGeom,
      new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.30,
        depthTest: false, depthWrite: false, clippingPlanes,
      }),
    );
    this._refinedAltRingsCadence = -1;
    this.refinedMeridiansGroup.add(this.refinedAltRings);

    this.group.add(this.refinedMeridiansGroup);

    // Observer's facing arrow: a flat triangle lying near z=0, pointing along
    // -x in its local frame (toward N at heading 0). The headingGroup is
    // rotated about z by -heading so the arrow tracks ObserverHeading
    // clockwise (compass convention): 0 = N, 90 = E, 180 = S, 270 = W.
    // shrunk ~3.5× (tip at -0.035 instead of -0.12).
    // Arrow is now a compact origin cue; the heading ray takes over as
    // the dominant directional indicator.
    this.headingGroup = new THREE.Group();
    this.headingGroup.name = 'heading-arrow';
    const ARROW_TIP_X = -0.035;   // exposed as this._arrowTipX below
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(ARROW_TIP_X, 0);
    arrowShape.lineTo(-0.022, 0.008);
    arrowShape.lineTo(-0.022, 0.003);
    arrowShape.lineTo(-0.006, 0.003);
    arrowShape.lineTo(-0.006, -0.003);
    arrowShape.lineTo(-0.022, -0.003);
    arrowShape.lineTo(-0.022, -0.008);
    arrowShape.lineTo(ARROW_TIP_X, 0);
    this._arrowTipX = ARROW_TIP_X;
    const arrowGeom = new THREE.ShapeGeometry(arrowShape);
    this.headingArrow = new THREE.Mesh(
      arrowGeom,
      new THREE.MeshBasicMaterial({
        color: 0xffd24a, transparent: true, opacity: 0.85,
        side: THREE.DoubleSide, depthTest: false, depthWrite: false,
      }),
    );
    this.headingArrow.renderOrder = 64;
    // lay the arrow flat on the horizon plane (z = 0)
    // so its tip is geometrically coincident with the start of the
    // ground-line segment and the active meridian arc's base, which
    // also live at z = 0. The material keeps depthTest off, so there's
    // no z-fight with the disc underneath.
    this.headingArrow.position.z = 0;
    this.headingGroup.add(this.headingArrow);
    this.group.add(this.headingGroup);

    // Heading ray: a thin yellow line from the observer extending in the
    // heading direction to the appropriate edge — optical vault rim in
    // first-person, disc rim (world) in orbit. Lives in a NON-scaled
    // subgroup so the Heavenly-mode length (which depends on observer
    // position) doesn't ride the vault scale.
    this.headingLineGroup = new THREE.Group();
    this.headingLineGroup.name = 'heading-ray';
    const rayGeom = new THREE.BufferGeometry();
    rayGeom.setAttribute('position', new THREE.Float32BufferAttribute(
      [0, 0, 0.018, 0, 0, 0.018], 3));
    this.headingLine = new THREE.Line(
      rayGeom,
      new THREE.LineBasicMaterial({
        color: 0xffd24a, transparent: true, opacity: 0.95,
        depthTest: false, depthWrite: false,
      }),
    );
    this.headingLine.renderOrder = 63;
    this.headingLineGroup.add(this.headingLine);
    this.group.add(this.headingLineGroup);
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    const r = c.OpticalVaultRadius;
    // use the mode-dependent effective height (hemisphere in
    // Optical, flat cap in Heavenly) so the cap mesh and its graticule
    // match the object-projection math. The `OpticalVaultHeight`
    // slider is honoured only when viewing from Heavenly.
    const h = c.OpticalVaultHeightEffective;
    const ge = s.WorldModel === 'ge';
    const obs = ge ? c.GlobeObserverCoord : c.ObserverFeCoord;

    this.group.position.set(obs[0], obs[1], obs[2]);
    // Globe-Earth mode: rotate the vault group so its local +z axis
    // aligns with the radial-outward direction at the observer's
    // surface point (instead of world +z, which is what the FE flat
    // disc expects). The local +x = north and +y = east axes follow
    // the GlobeObserverFrame computed in app.js.
    if (ge && c.GlobeObserverFrame) {
      // Right-handed columns [-north, east, up]: local +x = "outward"
      // along the surface tangent (matches FE), +y = east, +z = up.
      // Plain `[north, east, up]` is left-handed (det -1) and
      // confuses `setFromRotationMatrix`.
      const f = c.GlobeObserverFrame;
      const m = new THREE.Matrix4();
      m.set(
        -f.northX, f.eastX, f.upX, 0,
        -f.northY, f.eastY, f.upY, 0,
        -f.northZ, f.eastZ, f.upZ, 0,
         0,        0,       0,     1,
      );
      this.group.quaternion.setFromRotationMatrix(m);
    } else {
      this.group.quaternion.identity();
    }
    // Optical vault: x/y by R, z by effective H. Hemisphere (H=R) in
    // Optical mode; configurable flattened cap in Heavenly.
    this.mesh.scale.set(r, r, h);
    this.wire.scale.set(r, r, h);
    this.axes.scale.set(r, r, h);
    // Day/night sky cap colour + opacity. GE-only: lerps between
    // sky-blue (day) and dim grey (night) keyed off NightFactor so
    // the dome visually masks heavenly-vault objects when the sun
    // is up, then drops away at night. FE keeps the original
    // static dim grey at 0.10 opacity so daytime stars on the FE
    // optical vault remain visible. Honours optional
    // ShowDayNightSky flag (undefined = on).
    const skyOn = ge && s.ShowDayNightSky !== false;
    if (skyOn) {
      const nf = Math.max(0, Math.min(1, c.NightFactor || 0));
      const day = 1 - nf;
      this.mesh.material.color
        .copy(this._capNightColor)
        .lerp(this._capDayColor, day);
      this.mesh.material.opacity = 0.05 + 0.30 * day;
    } else {
      this.mesh.material.color.copy(this._capNightColor);
      this.mesh.material.opacity = 0.10;
    }
    // refined meridian arcs live on the same hemisphere as the
    // static wire, so they share its (r, r, h) scale.
    this.refinedMeridiansGroup.scale.set(r, r, h);
    // Cardinal labels, heading arrow, and azimuth ring live near z=0
    // on the rim, so they only need the horizontal scale.
    this.cardinalsGroup.scale.set(r, r, r);
    this.headingGroup.scale.set(r, r, r);
    this.azimuthGroup.scale.set(r, r, r);

    // Heading rotation about z. ObserverHeading is compass degrees
    // (0 = N at -x_local, 90 = E at +y_local, 180 = S at +x_local,
    // 270 = W at -y_local). Compass increments clockwise viewed from above,
    // which is a NEGATIVE rotation about +z, so rotate by -heading.
    this.headingGroup.rotation.set(0, 0, -ToRad(s.ObserverHeading || 0));
    this.headingGroup.visible = s.ShowFacingVector !== false;
    // optical vault grid toggle. When off, the cap surface
    // stays visible but the wire / axes / refined meridian arcs
    // are hidden, and the cardinal + azimuth + elevation labels are
    // forced off even if `ShowAzimuthRing` is still on, so the
    // clutter-free cap reads clean.
    // Each visibility toggle controls only its own object — no
    // cascading dependencies. Grid, axes, and azimuth ring are all
    // independent.
    const gridOn = s.ShowOpticalVaultGrid !== false;
    this.wire.visible = gridOn;
    this.axes.visible = gridOn;
    this.refinedMeridiansGroup.visible = gridOn;
    const azOn = s.ShowAzimuthRing !== false;
    this.cardinalsGroup.visible = azOn;
    // refined DMS scale only appears in Optical mode when the
    // has zoomed past the coarse-ring threshold; below that FOV
    // the coarse 15° ring is hidden so the refined cadence owns the
    // visual field.
    this._updateRefinedScale(s, c);
    // emit the right-side 0°–90° elevation scale each frame.
    // Companion to the bottom azimuth band; shares colour-distinct
    // palette, same ringR, same eyeH compensation, same cadence
    // ladder (15° / 5° / 1°).
    this._updateElevScale(s, c);
    // Coarse ring is hidden in Optical when the refined scale takes
    // over — otherwise both rings would overlap at fine cadences.
    const coarseHidden = s.InsideVault && this._refinedActive;
    this.azimuthGroup.visible = azOn && !coarseHidden;

    // ground-to-sky directional guide.
    //
    // The guide is a single connected geometric path:
    //   1. arrow tip on the horizon plane (z = 0, arrow lies flat)
    //   2. ground line from arrow tip to the horizon foot (radius r,
    //      still z = 0)
    //   3. active meridian arc from that same horizon foot up to
    //      zenith (refinedActiveMeridian, already emitted elsewhere)
    //
    // For the line end to sit exactly on the arc base, three things
    // must match:
    //   • direction    — use `activeAz` (the snapped meridian) when
    //                    the refined overlay is active; the coarse
    //                    view has no arc to meet, so follow heading
    //                    there to keep the line aligned with the arrow.
    //   • end radius   — `r`, not `r·1.08` (the arc base sits at `r`,
    //                    not the outer tick-ring radius).
    //   • end z        — `0`, not `0.018` (the arc base is at z = 0
    //                    after the `(r, r, h)` scale collapses the
    //                    unit horizon onto the horizon plane).
    //
    // In Heavenly there is no refined arc to connect to, so the line
    // keeps its original disc-rim geometry and z = 0.018 offset.
    const hRad = ToRad(s.ObserverHeading || 0);
    const hCos = Math.cos(hRad);
    const hSin = Math.sin(hRad);
    let dirCos, dirSin, hLen, lineZ, tipOffset;
    if (s.InsideVault) {
      // gate on `_refinedActiveAz != null` instead of
      // `_refinedActive`, so the ground line snaps to the highlighted
      // meridian in BOTH the coarse (15°) and refined (5° / 1°)
      // regimes. `_refinedActiveAz` is set whenever the active-meridian
      // arc is drawn; it's cleared to null when refined is inactive
      // (Heavenly or ShowAzimuthRing off), in which case we fall back
      // to raw heading.
      const dirAz = (this._refinedActiveAz != null)
        ? this._refinedActiveAz
        : (s.ObserverHeading || 0);
      const dRad = ToRad(dirAz);
      dirCos  = Math.cos(dRad);
      dirSin  = Math.sin(dRad);
      tipOffset = -this._arrowTipX * r;   // ground distance, observer → arrow tip
      hLen      = r;                      // meet the arc base exactly
      lineZ     = 0;                      // match the arc base z
    } else {
      dirCos = hCos;
      dirSin = hSin;
      tipOffset = 0;
      const rObs = Math.hypot(obs[0], obs[1]);
      hLen = rObs * hCos
           + Math.sqrt(Math.max(0, 1 - rObs * rObs * hSin * hSin));
      lineZ = 0.018;
    }
    const rayPos = this.headingLine.geometry.attributes.position.array;
    rayPos[0] = -dirCos * tipOffset;
    rayPos[1] =  dirSin * tipOffset;
    rayPos[2] = lineZ;
    rayPos[3] = -dirCos * hLen;
    rayPos[4] =  dirSin * hLen;
    rayPos[5] = lineZ;
    this.headingLine.geometry.attributes.position.needsUpdate = true;
    this.headingLineGroup.visible = s.ShowFacingVector !== false;

    // fade the arrow as FOV narrows into the refined
    // 1° regime so the straight line becomes the primary directional
    // indicator. Full opacity at FOV ≥ 30° (coarse view), linear ramp
    // down to 0 at FOV ≤ 8° (inside the refined regime, where labels
    // have already switched to 1° cadence). Heavenly leaves the arrow
    // at full opacity — orbit view doesn't have the zoom-in problem.
    if (s.InsideVault) {
      const fov = Math.max(1, Math.min(75, 75 / Math.max(0.2, s.OpticalZoom || 5.09)));
      const t = Math.max(0, Math.min(1, (fov - 8) / (30 - 8)));
      this.headingArrow.material.opacity = 0.85 * t;
    } else {
      this.headingArrow.material.opacity = 0.85;
    }

    // when refined is active the cardinals shrink and
    // sit right on their meridian rays (radius 1.00 vs coarse 1.14)
    // so they read as line-attached anchors, not floating headers.
    //
    // the refined cardinal height is now
    // FOV-scaled (screen-fraction target) instead of a fixed world
    // height, because a fixed world size that reads as a 15%-of-view
    // letter at FOV 14.7° reads as a 230%-of-view billboard at FOV 1°,
    // dominating the tight-zoom view.
    //
    // halved across the board. Coarse cardH 0.10 → 0.05;
    // refined screen-fraction target 0.12 → 0.06 with upper clamp
    // 0.10 → 0.05. N / E / S / W now read as small anchors, not
    // dominant letters, at every Optical zoom level.
    //
    // cardinals AND coarse azimuth labels now ride the pitch-
    // driven reading band. Shared `labelElev` from `_labelBandElevRad`
    // puts them just above the horizon at low pitch and slides them
    // up with the view as a tilts. Because cardinalsGroup and
    // azimuthGroup are both scaled by (r, r, r), the local positions
    // are divided by `r` so the resulting WORLD position matches the
    // refined labels' world position (both end up on the same ring
    // of radius 1.14 from the observer). `+ eyeH/r` on local z
    // compensates for the camera's 0.012 z-offset over the observer
    // so the label appears at elevation `labelElev` from the camera
    // rather than slightly below.
    const refined = s.InsideVault && this._refinedActive;
    let cardR, cardH;
    if (refined) {
      cardR = 1.00;
      const cFov = Math.max(1, Math.min(75, 75 / Math.max(0.2, s.OpticalZoom || 5.09)));
      const cFovRad = cFov * Math.PI / 180;
      // halved from /(was min(0.05, 0.06·cFovRad)).
      // N / E / S / W at 5° and 1° are now subtle anchors, not visual
      // competitors for the degree labels. Coarse (15°) cardinal size
      // stays at 0.05 so the jump from coarse to refined is an
      // explicit size change, not a silent regression.
      cardH = Math.min(0.025, 0.03 * cFovRad);
    } else {
      cardR = 1.14;
      cardH = 0.05;
    }
    const bandFovDeg = Math.max(0.005, Math.min(75, 75 / Math.max(0.2, s.OpticalZoom || 5.09)));
    // gate the Optical pitch-tracking / lowest-visible-ring
    // rule on first-person mode. In Heavenly (orbit camera) mode
    // `state.CameraHeight` is the ORBIT elevation above the disc,
    // not a first-person pitch. Feeding it into `_labelBandElevRad`
    // as if it were pitch pushes the azimuth-degree ring far up the
    // cap (e.g. CameraHeight = 25° → bandElev snaps to 20°), which
    // looks like labels "spreading out" when a returns from
    // Optical to Heavenly. In Heavenly the correct behaviour is
    // horizon-hug: small fixed elevation offset so the degree ring
    // sits on the cap's rim as it does in Optical at pitch 0.
    const bandElev = s.InsideVault
      ? this._labelBandElevRad(s, bandFovDeg)
      : 0.03;
    const cosE = Math.cos(bandElev);
    const sinE = Math.sin(bandElev);
    const eyeH = 0.012;
    const rSafe = Math.max(1e-6, r);
    // snap cardinals + coarse azimuth labels to
    // the optical-vault cap surface in Heavenly. The Optical reading-
    // band sits at world radius 1.14 (inside the cap, floats around
    // the observer) which is correct first-person but produces a
    // giant outer ring orbiting the small cap when viewed from
    // outside. In Heavenly we instead use the cap's flattened-vault
    // projection (e' = atan((h/r)·tan E)) to land the label on the
    // cap surface at the same azimuth, so the degree ring snaps to
    // the visible rim of the cap rather than floating beyond it.
    let posXY, posZ;
    if (s.InsideVault) {
      posXY = cardR * cosE;
      posZ  = cardR * sinE + eyeH;
    } else {
      const ePrime = Math.atan((h / Math.max(1e-9, r)) * Math.tan(bandElev));
      posXY = r * Math.cos(ePrime);
      posZ  = h * Math.sin(ePrime);
    }
    for (const sp of this._cardinalSprites) {
      const b = sp.userData.baseDir;
      sp.position.set(
        (posXY / rSafe) * b[0],
        (posXY / rSafe) * b[1],
        posZ / rSafe,
      );
      setSpriteScale(sp, cardH);
    }
    // Coarse 15° azimuth labels share the band with the cardinals.
    let aziXY, aziZ;
    if (s.InsideVault) {
      aziXY = 1.14 * cosE;
      aziZ  = 1.14 * sinE + eyeH;
    } else {
      aziXY = posXY;
      aziZ  = posZ;
    }
    for (const sp of this._azimuthLabels) {
      const phi = sp.userData.basePhi;
      sp.position.set(
        (aziXY / rSafe) * Math.cos(phi),
        (aziXY / rSafe) * Math.sin(phi),
        aziZ / rSafe,
      );
    }

    if (!ge) {
      // FE: rotate so local +x (south) lines up with the disc's south
      // direction at the observer. AE polar uses
      // `RotatingZ(ObserverLong)` (south = radial outward at angle λ);
      // DP samples the projection gradient because its meridians curve
      // and don't sit where AE's do.
      let angle;
      if (s.WorldModel === 'dp') {
        const lat = s.ObserverLat || 0;
        const lon = s.ObserverLong || 0;
        const eps = 1e-3;
        const pHere = canonicalLatLongToDisc(lat, lon, 1);
        const latProbe = lat >= 90 - eps ? lat - eps : lat + eps;
        const sign = lat >= 90 - eps ? -1 : 1;
        const pN = canonicalLatLongToDisc(latProbe, lon, 1);
        const dnx = (pN[0] - pHere[0]) * sign;
        const dny = (pN[1] - pHere[1]) * sign;
        const nLen = Math.hypot(dnx, dny);
        angle = nLen < 1e-9
          ? ToRad(lon)
          : Math.atan2(-dny / nLen, -dnx / nLen);
      } else {
        angle = ToRad(s.ObserverLong);
      }
      this.group.rotation.set(0, 0, angle);
    }

    this.group.visible = s.ShowOpticalVault;
  }

  // rebuild the refined azimuth tick / label layer. Reads the
  // current state.Zoom to recover FOV (fov = 75° / Zoom), picks a
  // cadence from refinedAzCadenceForFov, then emits ticks and labels
  // only inside a window around ObserverHeading so the line count
  // stays bounded even at arcsecond cadence. Cached by (mode, fov
  // cadence, heading bucket) so it only rebuilds when necessary.
  // /e — compute the elevation (radians) at which the degree
  // labels should sit this frame. Shared by coarse labels, refined
  // labels, and cardinals so the entire "reading band" stays
  // horizon-anchored at low pitch and follows the view up as the
  // tilts.
  //
  // reformulation: the previous additive formula
  //   labelElev = max(0, pitch − fov/2) + 0.05·fov
  // only started tracking once pitch crossed fov/2 and then sat at
  // 5 % of the FOV above the view's bottom edge. Both numbers were
  // too weak — the band felt detached from the view as the view
  // tilted, and when it did track it hugged the bottom edge
  // uncomfortably. Replaced with a "floor or track, whichever is
  // higher" formula:
  //
  //   floorElev = 0.03 · fov
  //     keeps labels at a tiny elevation above the horizon when
  //     pitch is low enough that the horizon is still in view
  //   trackElev = pitch − 0.35 · fov
  //     puts labels at 15 % above the view's bottom edge
  //     (bottom_of_view = pitch − fov/2; 15 % above that =
  //      pitch − fov/2 + 0.15·fov = pitch − 0.35·fov)
  //   labelElev = min(85°, max(floorElev, trackElev))
  //
  // Handoff from floor to tracking happens at `pitch ≈ 0.38 · fov`
  // (where trackElev equals floorElev) — substantially earlier than
  // the old `pitch = fov/2` crossover. At FOV 37.5° that's pitch
  // ~14.3° instead of 18.75°; at FOV 1° it's pitch 0.38° instead of
  // 0.5°. Tracking mode then sits at 15 % above the view's bottom
  // edge — three times the old 5 % margin — so the band reads as a
  // comfortable reading strip rather than an edge-hugging line.
  // 85° cap still prevents zenith pile-up.
  _labelBandElevRad(s, fovDeg) {
    // anchor the horizontal band to the LOWEST VISIBLE
    // altitude ring on the current cadence grid, replacing the
    // continuous `max(floor, track)` formula. Rule:
    //   • bottomView = pitch − fov/2, clamped ≥ 0
    //   • elevCadence from `elevCadenceForFov(fov)`: 15° / 5° / 1°
    //   • lowestRingE = smallest cadence multiple ≥ bottomView
    //     (so the ring is actually inside the view, not below it)
    //   • labelElev   = lowestRingE + 0.5 % of FOV
    // When the horizon is in view (pitch < fov/2 → bottomView ≤ 0),
    // `lowestRingE` is 0 and labels sit just above the horizon, which
    // is the existing behaviour. When a tilts up past the
    // horizon, labels snap to ride just above the next cadence-
    // multiple elevation ring instead of floating at a loose 5%-of-
    // FOV offset — a true "just above the lowest visible longitude
    // band" anchor. 85° cap still prevents zenith pile-up.
    // drop the small 0.5%-of-FOV margin so the bottom label
    // strip sits EXACTLY on the lowest visible elevation ring rather
    // than a hair above it. With the grid now extending to the
    // horizontal screen edges (the other half of ), the strip
    // reads as a proper row along the ring rather than floating
    // above a truncated grid segment.
    const pitchDeg = Math.max(0, Math.min(90, s.CameraHeight || 0));
    const bottomView = Math.max(0, pitchDeg - fovDeg / 2);
    const elevCad = elevCadenceForFov(fovDeg);
    const lowestRingE = Math.ceil(bottomView / elevCad) * elevCad;
    const elevDeg  = Math.min(85, lowestRingE);
    return elevDeg * Math.PI / 180;
  }

  // /a — emit the right-side 0°–85° elevation scale. Labels sit
  // at FIXED world elevations on the right-side meridian (azimuth =
  // heading + rightBandAz). Pre-painted sprites in `_elevLabels`,
  // one per integer elevation 0°–85°; per frame we toggle visibility
  // by cadence:
  //
  //   FOV ≥ 30°        →  cadence 15°, cap 75° (labels: 0,15,30,45,60,75)
  //   8° ≤ FOV < 30°   →  cadence  5°, cap 85° (labels: 0,5,…,85)
  //   FOV <  8°        →  cadence  1°, cap 85° (labels: 0,1,…,85)
  //
  // Every cadence-multiple at or below the cap is in the scene graph
  // at all times — three.js frustum culling decides what actually
  // renders. So as a tilts up, the higher labels are already
  // there waiting; the scale isn't constrained to the narrow
  // `[pitch − vFov/2, pitch + vFov/2]` window the previous version
  // emitted into.
  //
  // Right-edge azimuth offset uses the camera's exact aspect ratio
  // (`c.ViewAspect`, set each frame by SceneManager) so labels land
  // at 80 % of the way from view-centre to the right edge regardless
  // of window shape.
  _updateElevScale(s, c) {
    const labels = this._elevLabels;
    const active = !!s.InsideVault && (s.ShowAzimuthRing !== false);
    if (!active) {
      for (const sp of labels) sp.visible = false;
      return;
    }

    const zoom = Math.max(0.2, s.OpticalZoom || 5.09);
    const fov  = Math.max(0.005, Math.min(75, 75 / zoom));
    const fovRad = fov * Math.PI / 180;
    const aspect = Math.max(0.5, Math.min(4, c && c.ViewAspect ? c.ViewAspect : 16 / 9));
    const hFovRad = 2 * Math.atan(Math.tan(fovRad / 2) * aspect);
    const hFovHalfDeg = (hFovRad / 2) * 180 / Math.PI;

    // approaching-meridian anchor + per-label
    // inverse-projection solve.
    //
    // Column snaps to the meridian CLOSEST to the right edge of the
    // viewport on the current cadence grid. For each elevation
    // label, the azimuth is solved so the projected screen-X matches
    // the approaching meridian's screen-X; labels whose geometry
    // can't reach the target X at the current pitch clamp to the
    // nearest achievable azimuth (instead of vanishing). Fixed 75°
    // ceiling prevents near-zenith instability.
    const heading = ((s.ObserverHeading || 0) % 360 + 360) % 360;
    const refined = refinedAzCadenceForFov(fov);
    const cadenceAz = refined ? refined.labelEvery : 15;
    const rightEdgeAz = heading + hFovHalfDeg;
    const approachingAz = Math.round(rightEdgeAz / cadenceAz) * cadenceAz;

    // Target screen-X as tan(horizontal-angle). Clamp just inside
    // the frustum so the column stays visible while the meridian
    // is still approaching from outside.
    const tanHalfH = Math.tan(hFovRad / 2);
    const rawT = Math.tan((approachingAz - heading) * Math.PI / 180);
    const maxT = 0.98 * tanHalfH;
    const T    = Math.max(-maxT, Math.min(maxT, rawT));

    const P = Math.max(0, Math.min(90, s.CameraHeight || 0)) * Math.PI / 180;
    const cosP = Math.cos(P), sinP = Math.sin(P);
    const R    = Math.sqrt(1 + T * T * cosP * cosP);
    const delta = Math.atan2(T * cosP, 1);

    const cadDeg = elevCadenceForFov(fov);
    const cap = 75;   // fixed elevation ceiling across cadences
    const r = (c && c.OpticalVaultRadius != null) ? c.OpticalVaultRadius : 0.5;
    // this routine only paints labels inside Optical mode
    // (guarded above by `s.InsideVault`); in that mode the vault is a
    // strict hemisphere (H = R), so the flattened `ePrime` transform
    // collapses to the identity (e' = e). Drop it — labels sit on the
    // hemisphere at `(r·cos e, r·sin e)` directly. The inverse-
    // projection solve for the right-edge azimuth also uses `tan e`
    // instead of `tan e'` now.
    const HARD_MIN = 1e-6;

    for (const sp of labels) {
      const e = sp.userData.elev;
      if (e > cap || (e % cadDeg) !== 0) {
        sp.visible = false;
        continue;
      }
      const eRad = e * Math.PI / 180;
      const cosE = Math.cos(eRad);
      const sinE = Math.sin(eRad);

      const tanE = Math.tan(eRad);
      // Clamp sinArg to [-1, 1]: labels whose rings can't reach the
      // target screen-X at the current pitch land at the closest
      // achievable azimuth rather than vanishing.
      const sinArgRaw = T * tanE * sinP / R;
      const sinArg = Math.max(-1, Math.min(1, sinArgRaw));
      const A_rel = Math.asin(sinArg) + delta;
      const labelAz = heading * Math.PI / 180 + A_rel;
      const phi = Math.atan2(Math.sin(labelAz), -Math.cos(labelAz));
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);
      const labelXY = r * cosE;
      const labelZ  = r * sinE;
      sp.position.set(
        labelXY * cosPhi,
        labelXY * sinPhi,
        labelZ + 0.002,
      );
      const dist = Math.sqrt(labelXY * labelXY + labelZ * labelZ);
      const labelH = Math.max(HARD_MIN, 0.04 * dist * fovRad);
      setSpriteScale(sp, labelH);
      sp.visible = true;
    }
  }

  // emit the active-meridian arc as a single arcSegs-segment
  // LineSegments at the snapped azimuth. Called from both coarse and
  // refined branches so the highlighted meridian is visible from the
  // moment a enters Optical, not only after zooming past
  // FOV 30°. Writes into `_activeMeridianBuf` (sized ARC_SEGS * 6),
  // sets the draw range, and records the snapped azimuth on
  // `_refinedActiveAz` so the heading-line direction logic can use it.
  _emitActiveMeridian(activeAz) {
    const arcSegs = this._arcSegs;
    const buffer  = this._activeMeridianBuf;
    const phi = Math.atan2(Math.sin(activeAz * Math.PI / 180),
                          -Math.cos(activeAz * Math.PI / 180));
    const cos = Math.cos(phi), sin = Math.sin(phi);
    for (let k = 0; k < arcSegs; k++) {
      const p1 = (k / arcSegs) * (Math.PI / 2);
      const p2 = ((k + 1) / arcSegs) * (Math.PI / 2);
      const o = k * 6;
      buffer[o    ] = Math.sin(p1) * cos;
      buffer[o + 1] = Math.sin(p1) * sin;
      buffer[o + 2] = Math.cos(p1);
      buffer[o + 3] = Math.sin(p2) * cos;
      buffer[o + 4] = Math.sin(p2) * sin;
      buffer[o + 5] = Math.cos(p2);
    }
    this.refinedActiveMeridian.geometry.setDrawRange(0, arcSegs * 2);
    this.refinedActiveMeridian.geometry.attributes.position.needsUpdate = true;
    this._refinedActiveAz = activeAz;
  }

  _updateRefinedScale(s, c) {
    const active = !!s.InsideVault && (s.ShowAzimuthRing !== false);
    if (!active) {
      this.refinedAzGroup.visible = false;
      this.refinedMeridiansGroup.visible = false;
      // Keep the geometry cache warm. Cache key already includes FOV
      // so any change while we're inactive will still miss and rebuild
      // on re-entry; clearing on transition out forced a rebuild every
      // Heavenly→Optical toggle even when nothing relevant changed.
      this._refinedActive = false;
      // clear the snapped-azimuth record so the heading-line
      // logic falls back to raw heading when we're not in Optical
      // (or ShowAzimuthRing is toggled off).
      this._refinedActiveAz = null;
      // hide refined altitude rings when refined overlay is
      // off entirely. Cadence cache stays so re-entry doesn't re-emit
      // the same buffer.
      this.refinedAltRings.visible = false;
      return;
    }
    // refined overlay reads the mode-local OpticalZoom, so
    // Heavenly's orbit Zoom can't accidentally drive the refined
    // cadence (and vice versa). Default 5.09 on entry matches app.js.
    const zoom = Math.max(0.2, s.OpticalZoom || 5.09);
    const fov  = Math.max(0.005, Math.min(75, 75 / zoom));
    const cad  = refinedAzCadenceForFov(fov);
    const headingNow = ((s.ObserverHeading || 0) % 360 + 360) % 360;

    // active-meridian highlight is drawn in BOTH coarse and
    // refined regimes. Snap cadence: 15° in coarse (matches the
    // static wire), cad.majorArc in refined (5° or 1°). Emitting
    // every frame is cheap (one 16-segment arc) and keeps the
    // heading-line snapping consistent.
    const snapDeg  = cad ? cad.majorArc : 15;
    const activeAz = Math.round(headingNow / snapDeg) * snapDeg;
    this._emitActiveMeridian(activeAz);
    this.refinedActiveMeridian.visible = true;
    this.refinedMeridiansGroup.visible = true;

    if (!cad) {
      // Coarse 15° regime — refined-grid pieces hidden (the static
      // wire's 5 latitude rings at 15°/30°/45°/60°/75° suffice here);
      // the active-meridian highlight stays visible. Refined altitude
      // rings also hidden — there's no 15° ring to add that the
      // static wire doesn't already provide.
      this.refinedAzGroup.visible = false;
      this.refinedMajorMeridians.visible = false;
      this.refinedMinorMeridians.visible = false;
      this.refinedAltRings.visible = false;
      if (this._refinedActive) this._refineKey = null;
      this._refinedActive = false;
      return;
    }
    this._refinedActive = true;
    this.refinedAzGroup.visible = true;
    this.refinedMajorMeridians.visible = true;
    this.refinedMinorMeridians.visible = true;

    // emit refined horizontal altitude rings at the same
    // cadence as the meridians so the lat/long box grid is complete:
    //   5° regime  → 18 rings (0°, 5°, 10°, …, 85°)
    //   1° regime  → 86 rings (0°, 1°, 2°, …, 85°)
    // Lives in refinedMeridiansGroup so the (r, r, h) flattened
    // vault scale applies; emitting in unit-frame coords lets that
    // scale do all the work. Cached by cadence — only the regime
    // change (5° ↔ 1°) triggers a re-emission.
    const ringCad = cad.majorArc;
    if (this._refinedAltRingsCadence !== ringCad) {
      const ringBuf = this._refinedAltRingBuf;
      const segsPerRing = this._refinedAltRingSegs;
      const ringBudget = ringBuf.length / 6;
      let ringSegCursor = 0;
      for (let e = 0; e <= 85; e += ringCad) {
        if (ringSegCursor + segsPerRing > ringBudget) break;
        const ringRu = Math.cos(e * Math.PI / 180);
        const ringZu = Math.sin(e * Math.PI / 180);
        for (let k = 0; k < segsPerRing; k++) {
          const t1 = (k / segsPerRing) * 2 * Math.PI;
          const t2 = ((k + 1) / segsPerRing) * 2 * Math.PI;
          const o = ringSegCursor * 6;
          ringBuf[o    ] = ringRu * Math.cos(t1);
          ringBuf[o + 1] = ringRu * Math.sin(t1);
          ringBuf[o + 2] = ringZu;
          ringBuf[o + 3] = ringRu * Math.cos(t2);
          ringBuf[o + 4] = ringRu * Math.sin(t2);
          ringBuf[o + 5] = ringZu;
          ringSegCursor++;
        }
      }
      this.refinedAltRings.geometry.setDrawRange(0, ringSegCursor * 2);
      this.refinedAltRings.geometry.attributes.position.needsUpdate = true;
      this._refinedAltRingsCadence = ringCad;
    }
    this.refinedAltRings.visible = true;

    // lift refined label pool onto the pitch-driven reading
    // band every frame, even on cache hit. The cache gates the heavier
    // tick / grid / repaint work below, but the LABELS must follow
    // CameraHeight continuously (not just on heading or FOV changes),
    // so we reposition their visible sprites here using the stored
    // `basePhi` from the last emission.
    const rLabelRingR = 1.14;
    const rLabelElev  = this._labelBandElevRad(s, fov);
    const rLabelCosE  = Math.cos(rLabelElev);
    const rLabelSinE  = Math.sin(rLabelElev);
    const rLabelEyeH  = 0.012;
    for (const sp of this._refinedLabelPool) {
      if (!sp.visible) continue;
      const phi = sp.userData.basePhi;
      if (phi == null) continue;
      sp.position.set(
        rLabelRingR * rLabelCosE * Math.cos(phi),
        rLabelRingR * rLabelCosE * Math.sin(phi),
        rLabelRingR * rLabelSinE + rLabelEyeH,
      );
    }

    // reuse `headingNow` computed above (the branch used to
    // have its own `const heading = ...`). Cache key at a resolution
    // finer than the current major cadence so a nudge within one
    // tick doesn't trigger a rebuild.
    const hKey = Math.round(headingNow / cad.minor) * cad.minor;
    const fKey = Math.round(fov * 1000);
    const key  = `${fKey}|${hKey.toFixed(7)}`;
    if (key === this._refineKey) return;
    this._refineKey = key;

    // windowing driven by HORIZONTAL FOV (viewport width),
    // not vertical FOV. At 16:9 hFov ≈ 1.78·vFov; the old
    // `fov·0.7 + cad.major` formula fell short of the viewport's right
    // edge in the 5°–8° vertical-FOV band (cadence 1°) and at the top
    // of the 5° cadence band, leaving the refined grid short of the
    // screen edges — so the right-edge labels tried to anchor to
    // meridians that weren't actually emitted. Fix: use `hFov/2` plus
    // a two-cadence-multiple margin so the grid provably extends past
    // the viewport in every FOV + aspect combination.
    const fovRadLocal = fov * Math.PI / 180;
    const aspectLocal = Math.max(0.5, Math.min(4, c && c.ViewAspect ? c.ViewAspect : 16 / 9));
    const hFovDegLocal = 2 * Math.atan(Math.tan(fovRadLocal / 2) * aspectLocal) * 180 / Math.PI;
    const halfWindow = Math.min(180, hFovDegLocal / 2 + 2 * cad.major);
    const minAz = headingNow - halfWindow;
    const maxAz = headingNow + halfWindow;

    // --- ticks --------------------------------------------------------
    const pos = this._refinedPos;
    let seg = 0;
    const maxSeg = pos.length / 6;
    const emitTick = (az, inner, outer) => {
      if (seg >= maxSeg) return;
      const phi = Math.atan2(Math.sin(az * Math.PI / 180),
                            -Math.cos(az * Math.PI / 180));
      const cos = Math.cos(phi), sin = Math.sin(phi);
      const o = seg * 6;
      pos[o    ] = inner * cos;
      pos[o + 1] = inner * sin;
      pos[o + 2] = 0.015;
      pos[o + 3] = outer * cos;
      pos[o + 4] = outer * sin;
      pos[o + 5] = 0.015;
      seg++;
    };
    // Minor ticks — iterate with floor-aligned start so they land on
    // exact multiples of cad.minor rather than drifting with heading.
    const minorStart = Math.ceil(minAz / cad.minor) * cad.minor;
    for (let az = minorStart; az <= maxAz; az += cad.minor) {
      // Skip anywhere a major tick will be drawn (avoids double lines).
      const nearMajor = Math.abs(az / cad.major - Math.round(az / cad.major)) < 1e-6;
      if (nearMajor) continue;
      emitTick(az, 1.00, 1.03);
    }
    // Major ticks — longer.
    const majorStart = Math.ceil(minAz / cad.major) * cad.major;
    for (let az = majorStart; az <= maxAz; az += cad.major) {
      emitTick(az, 1.00, 1.08);
    }
    this.refinedTicks.geometry.setDrawRange(0, seg * 2);
    this.refinedTicks.geometry.attributes.position.needsUpdate = true;

    // --- refined meridian grid -------------------------------
    // A meridian at compass azimuth `az` is an arc from (sinφ·cos,
    // sinφ·sin, cosφ) for polar φ sweeping 0 (zenith) → π/2 (horizon).
    // `phi` here is the LOCAL-FE angle for a compass azimuth so the
    // arcs land on the same rays the horizon-ring ticks and
    // cardinals use.
    const arcSegs = this._arcSegs;
    const emitArc = (buffer, budget, segCursor, az) => {
      if (segCursor + arcSegs > budget) return segCursor;
      const phi = Math.atan2(Math.sin(az * Math.PI / 180),
                            -Math.cos(az * Math.PI / 180));
      const cos = Math.cos(phi), sin = Math.sin(phi);
      for (let k = 0; k < arcSegs; k++) {
        const p1 = (k / arcSegs) * (Math.PI / 2);
        const p2 = ((k + 1) / arcSegs) * (Math.PI / 2);
        const o = segCursor * 6;
        buffer[o    ] = Math.sin(p1) * cos;
        buffer[o + 1] = Math.sin(p1) * sin;
        buffer[o + 2] = Math.cos(p1);
        buffer[o + 3] = Math.sin(p2) * cos;
        buffer[o + 4] = Math.sin(p2) * sin;
        buffer[o + 5] = Math.cos(p2);
        segCursor++;
      }
      return segCursor;
    };

    // Minor meridians — dimmer, fill between majors.
    const majBudget = this._majorMeridianBuf.length / 6;
    const minBudget = this._minorMeridianBuf.length / 6;
    let minSeg = 0;
    if (cad.minorArc > 0) {
      const startMin = Math.ceil(minAz / cad.minorArc) * cad.minorArc;
      for (let az = startMin; az <= maxAz; az += cad.minorArc) {
        // Skip where a major meridian will be drawn.
        const nearMajor = Math.abs(az / cad.majorArc - Math.round(az / cad.majorArc)) < 1e-6;
        if (nearMajor) continue;
        const nxt = emitArc(this._minorMeridianBuf, minBudget, minSeg, az);
        if (nxt === minSeg) break; // buffer full
        minSeg = nxt;
      }
    }
    this.refinedMinorMeridians.geometry.setDrawRange(0, minSeg * 2);
    this.refinedMinorMeridians.geometry.attributes.position.needsUpdate = true;

    // Major meridians — brighter, primary longitudinal grid.
    let majSeg = 0;
    const startMaj = Math.ceil(minAz / cad.majorArc) * cad.majorArc;
    for (let az = startMaj; az <= maxAz; az += cad.majorArc) {
      const nxt = emitArc(this._majorMeridianBuf, majBudget, majSeg, az);
      if (nxt === majSeg) break; // buffer full
      majSeg = nxt;
    }
    this.refinedMajorMeridians.geometry.setDrawRange(0, majSeg * 2);
    this.refinedMajorMeridians.geometry.attributes.position.needsUpdate = true;

    // (— active meridian arc was already emitted at the top of
    // _updateRefinedScale, before the coarse/refined split, so it
    // shows in both regimes. Nothing to do here.)

    // --- labels -------------------------------------------------------
    // fine-scale labels were still visually huge because the
    // old sizer used an absolute MIN_LABEL_HEIGHT floor of 0.028
    // world units. At arcsecond cadence the natural widthBudget-based
    // height is ~2e-5, so the floor was ~1400× too large and the
    // labels filled a third of the screen.
    //
    // New sizer: explicit screen-fraction target per cadence regime.
    // Coarse labels still look like readable annotations; fine labels
    // shrink to precise coordinate text sitting right on their tick.
    //
    //   targetFrac  = fraction of screen height the label should take
    //                 in the current regime. Shrinks at DMS:
    //                   deg       → 8% of screen
    //                   degmin    → 5% of screen
    //                   degminsec → 3% of screen
    //
    //   h_screen    = targetFrac · ringR · FOV_rad (world height at
    //                 vault distance that subtends targetFrac of the
    //                 screen at the current camera FOV).
    //
    //   h_arc       = widthBudget / aspect (arc-budget limit from ,
    //                 prevents overlap between adjacent labels).
    //
    //   h = min(h_screen, h_arc) — arc-budget still caps at coarse
    //       FOV where screen-target would blow up; screen-target caps
    //       at fine FOV where arc-budget would still allow a label
    //       much larger than the screen.
    const pool = this._refinedLabelPool;
    const ringR = 1.14;
    const LABEL_WIDTH_FRAC = 0.55;
    const arcBetweenLabels = ringR * cad.labelEvery * Math.PI / 180;
    const widthBudget = arcBetweenLabels * LABEL_WIDTH_FRAC;
    const targetFrac  = cad.fmt === 'degminsec' ? 0.03
                      : cad.fmt === 'degmin'    ? 0.05
                      : 0.08;
    const fovRad = Math.max(1e-6, fov * Math.PI / 180);
    const hScreen = targetFrac * ringR * fovRad;
    const HARD_MIN = 1e-6;   // avoid genuinely zero-sized sprites

    // refined labels share the pitch-driven reading band with
    // the coarse labels and cardinals. Reuse the lift constants
    // computed above the cache check (`rLabelRingR`, `rLabelCosE`,
    // `rLabelSinE`, `rLabelEyeH`). refinedAzGroup is unscaled so the
    // local position IS the world offset from the observer; the
    // `+ eyeH` on z compensates for the camera's 0.012 z-offset over
    // the observer so the label projects at `labelElev` from the
    // camera rather than slightly below. `basePhi` is stashed on each
    // visible sprite so the per-frame lift above the cache check can
    // track pitch without re-running this emission.

    let labelI = 0;
    const labelStart = Math.ceil(minAz / cad.labelEvery) * cad.labelEvery;
    for (let az = labelStart; az <= maxAz; az += cad.labelEvery) {
      if (labelI >= pool.length) break;
      const sp = pool[labelI];
      const phi = Math.atan2(Math.sin(az * Math.PI / 180),
                            -Math.cos(az * Math.PI / 180));
      sp.userData.basePhi = phi;
      sp.position.set(
        rLabelRingR * rLabelCosE * Math.cos(phi),
        rLabelRingR * rLabelCosE * Math.sin(phi),
        rLabelRingR * rLabelSinE + rLabelEyeH,
      );
      repaintTextSprite(sp, formatAzimuthLabel(az, cad.fmt), '#f4a640');
      const aspect = sp.userData.aspect || 1;
      const hArc = widthBudget / aspect;
      let h = Math.min(hArc, hScreen);
      if (h < HARD_MIN) h = HARD_MIN;
      setSpriteScale(sp, h);
      sp.visible = true;
      labelI++;
    }
    for (; labelI < pool.length; labelI++) pool[labelI].visible = false;
  }
}

// --- Sun / Moon markers ----------------------------------------------------

export class CelestialMarker {
  // `vaultSize` and `opticalSize` are the solid-dot radii on the vault of
  // the heavens and the observer's optical vault respectively. Halos are
  // the soft glow; disable for planets so they don't look like mini-suns.
  constructor(color, {
    vaultSize = 0.02, opticalSize = 0.006, haloScale = 2.0, showHalo = true,
  } = {}, clippingPlanes = []) {
    this.group = new THREE.Group();
    this._showHalo = showHalo;

    // --- Vault of the heavens (true source) ---------------------------
    // Must render AFTER the translucent vault shell so it isn't hidden
    // behind the shell's blend. Staying in the transparent pass with high
    // renderOrder is the reliable way to do that.
    // depthTest on so opaque objects between the camera and the marker
    // (observer figures, Yggdrasil, Mt Meru, land) correctly occlude it
    // instead of the marker leaking through their silhouettes.
    this.domeDot = new THREE.Mesh(
      new THREE.SphereGeometry(vaultSize, 20, 16),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true, opacity: 1.0,
        depthTest: true, depthWrite: false,
      }),
    );
    this.domeDot.renderOrder = 100;

    this.domeHalo = new THREE.Mesh(
      new THREE.SphereGeometry(vaultSize * haloScale, 20, 14),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true, opacity: 0.25,
        depthTest: true, depthWrite: false,
      }),
    );
    this.domeHalo.renderOrder = 99;

    // --- Observer's optical vault (what the observer sees) -----------
    // Both dot and halo are in the transparent pass so we can force render
    // order: halo first (renderOrder 50), solid dot after (renderOrder 51).
    // Otherwise the halo sphere's near face passes the dot's depth test and
    // occludes the dot's centre — the sun/moon would appear off-centre
    // within their glow.
    this.sphereDot = new THREE.Mesh(
      new THREE.SphereGeometry(opticalSize, 16, 12),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true, opacity: 1.0,
        depthTest: false, depthWrite: false,
        clippingPlanes,
      }),
    );
    this.sphereDot.renderOrder = 51;

    this.sphereHalo = new THREE.Mesh(
      new THREE.SphereGeometry(opticalSize * haloScale, 16, 12),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true, opacity: 0.25,
        depthTest: false, depthWrite: false,
        clippingPlanes,
      }),
    );
    this.sphereHalo.renderOrder = 50;

    if (showHalo) this.group.add(this.domeHalo);
    this.group.add(this.domeDot);
    if (showHalo) this.group.add(this.sphereHalo);
    this.group.add(this.sphereDot);
  }

  // The vault-of-the-heavens dot is the "true source" position on the
  // celestial vault and stays visible regardless of elevation. The optical-
  // vault dot fades smoothly near the horizon instead of popping off, so
  // the transition is continuous when autoplay is running fast.
  // opticalAlphaMult scales the optical-vault dot's opacity on top of the
  // normal elevation fade. Planets pass NightFactor so they only show in
  // the observer's sky at night (matching how faint naked-eye planets
  // disappear in daylight). Sun / moon leave it at 1.0.
  update(vaultPos, opticalVaultPos, showVault, showOpticalVault, elevation,
         opticalAlphaMult = 1) {
    this.domeDot.position.set(vaultPos[0], vaultPos[1], vaultPos[2]);
    this.sphereDot.position.set(opticalVaultPos[0], opticalVaultPos[1], opticalVaultPos[2]);
    this.domeDot.visible = showVault;
    if (this._showHalo) {
      this.domeHalo.position.set(vaultPos[0], vaultPos[1], vaultPos[2]);
      this.domeHalo.visible = showVault;
    }

    const elevFade = Math.max(0, Math.min(1, (elevation + 3) / 5));
    const fade = elevFade * opticalAlphaMult;
    const visibleByShow = showOpticalVault && fade > 0.001;
    this.sphereDot.visible = visibleByShow;
    this.sphereDot.material.opacity = fade;
    if (this._showHalo) {
      this.sphereHalo.position.set(opticalVaultPos[0], opticalVaultPos[1], opticalVaultPos[2]);
      this.sphereHalo.visible = visibleByShow;
      this.sphereHalo.material.opacity = 0.25 * fade;
    }
  }
}

// Underlined-digit canvas for the Sun / Moon "9" overlay. Underline
// disambiguates 9 from 6 once perspective rotates the glyph.
function makeUnderlinedDigitCanvas(text, color) {
  const W = 256, H = 256;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.font = 'bold 200px sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, H / 2 - 8);
  const m = ctx.measureText(text);
  ctx.lineWidth = 14;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(W / 2 - m.width / 2, H / 2 + 92);
  ctx.lineTo(W / 2 + m.width / 2, H / 2 + 92);
  ctx.stroke();
  return cv;
}

// Lunar surface texture: base grey + a three-crater triangle in the
// top-left quadrant (small crater on top, two larger ones of
// different sizes underneath, northern-hemisphere observer view).
// Drawn once at module load; reused as the unshaded base for the
// per-frame phase composite.
function _drawMoonCrater(ctx, cx, cy, r) {
  ctx.fillStyle = 'rgba(220, 215, 200, 0.32)';
  ctx.beginPath(); ctx.arc(cx, cy, r * 1.45, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(60, 55, 50, 0.7)';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(35, 30, 25, 0.55)';
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, 2 * Math.PI); ctx.fill();
}
function makeMoonCraterCanvas() {
  const W = 256, H = 256;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const baseGrad = ctx.createRadialGradient(W * 0.45, H * 0.4, W * 0.1, W * 0.5, H * 0.5, W * 0.6);
  baseGrad.addColorStop(0, '#dcd4c4');
  baseGrad.addColorStop(0.6, '#c8bfae');
  baseGrad.addColorStop(1, '#a89e8c');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, W, H);
  // Three-crater triangle, top-left quadrant. Top crater is the
  // smallest; the two beneath are larger and of different sizes.
  _drawMoonCrater(ctx, W * 0.30, H * 0.22, 5);   // top   — small
  _drawMoonCrater(ctx, W * 0.21, H * 0.34, 7);   // bot-L — medium
  _drawMoonCrater(ctx, W * 0.36, H * 0.36, 11);  // bot-R — large
  return cv;
}

// Repaint the per-frame moon composite: clipped crater base + a
// shadow lune positioned by phase / rot. `phase` ∈ [0, π] (0=full,
// π=new); `rot` rotates the terminator around the line of sight.
function drawMoonBodyToCanvas(ctx, W, H, craterCanvas, phase, rot) {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(rot);
  const r = Math.min(W, H) / 2 - 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, 2 * Math.PI);
  ctx.clip();
  ctx.drawImage(craterCanvas, -r, -r, 2 * r, 2 * r);
  ctx.restore();
  const frac = 0.5 * (1 + Math.cos(phase));
  if (frac < 0.999) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, 2 * Math.PI);
    ctx.clip();
    ctx.fillStyle = 'rgba(8, 12, 18, 0.85)';
    if (frac < 0.001) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      const e = Math.abs(1 - 2 * frac) * r;
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI / 2, -Math.PI / 2, false);
      ctx.ellipse(0, 0, e, r, 0, -Math.PI / 2, Math.PI / 2, frac >= 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  // Always-visible rim so the moon stays distinct from the sun even
  // at new-moon (sun + moon at same sky position).
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(190, 185, 175, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// Optical-vault moon body: billboarded plane mesh whose canvas
// texture is repainted per (phase, rot) change. Crater base is
// generated once; phase shading rebuilds the composite when MoonPhase
// or MoonRotation changes.
export class MoonOpticalBody {
  constructor(clippingPlanes = []) {
    this._craterCanvas = makeMoonCraterCanvas();
    this._composite = document.createElement('canvas');
    this._composite.width = 256;
    this._composite.height = 256;
    this._compCtx = this._composite.getContext('2d');
    this.tex = new THREE.CanvasTexture(this._composite);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.minFilter = THREE.LinearMipMapLinearFilter;
    this.tex.magFilter = THREE.LinearFilter;
    this.tex.anisotropy = 4;
    const geom = new THREE.PlaneGeometry(1, 1);
    this.material = new THREE.MeshBasicMaterial({
      map: this.tex,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      clippingPlanes,
    });
    this.mesh = new THREE.Mesh(geom, this.material);
    this.mesh.renderOrder = 52;
    this.group = new THREE.Group();
    this.group.add(this.mesh);
    this._lastPhase = -999;
    this._lastRot = -999;
    drawMoonBodyToCanvas(this._compCtx, 256, 256, this._craterCanvas, 0, 0);
    this.tex.needsUpdate = true;
  }

  update(opticalPos, size, show, phase, rot, camera, alpha = 1) {
    this.group.visible = !!show;
    if (!show) return;
    this.mesh.position.set(opticalPos[0], opticalPos[1], opticalPos[2]);
    this.mesh.scale.set(size, size, 1);
    // Camera-aligned (canvas-up = screen-up) instead of
    // lookAt(camera.position): preserves perceived moon orientation
    // across FE / GE since both modes share the same camera
    // up-vector in optical view.
    if (camera) this.mesh.quaternion.copy(camera.quaternion);
    this.material.opacity = alpha;
    if (phase !== this._lastPhase || rot !== this._lastRot) {
      this._lastPhase = phase;
      this._lastRot = rot;
      drawMoonBodyToCanvas(this._compCtx, 256, 256, this._craterCanvas, phase, rot);
      this.tex.needsUpdate = true;
    }
  }
}

// Sun face canvas: warm yellow disc with a few sunspots scattered
// across the surface. Drawn once at module load.
function makeSunFaceCanvas() {
  const W = 256, H = 256;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const r = Math.min(W, H) / 2 - 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, r, 0, 2 * Math.PI);
  ctx.clip();
  const g = ctx.createRadialGradient(W * 0.5, H * 0.5, r * 0.1, W * 0.5, H * 0.5, r);
  g.addColorStop(0, '#fff8b0');
  g.addColorStop(0.65, '#ffd24a');
  g.addColorStop(1, '#ffa840');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Sunspots — small darker patches with soft falloff. Seeded so the
  // pattern is reproducible.
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < 7; i++) {
    const cx = W * 0.5 + (rnd() - 0.5) * r * 1.3;
    const cy = H * 0.5 + (rnd() - 0.5) * r * 1.3;
    const sr = 4 + rnd() * 5;
    const dist = Math.hypot(cx - W * 0.5, cy - H * 0.5);
    if (dist + sr > r) continue;
    const sg = ctx.createRadialGradient(cx, cy, sr * 0.3, cx, cy, sr);
    sg.addColorStop(0, 'rgba(50, 28, 8, 0.7)');
    sg.addColorStop(1, 'rgba(120, 70, 30, 0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(cx, cy, sr, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.restore();
  return cv;
}

// Sun halo canvas: bright ring outside the sun's edge, fading
// outward. Used as an additive-blend overlay so the corona stays
// visible during a solar eclipse when the moon body covers the face.
function makeSunHaloCanvas() {
  const W = 256, H = 256;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const r = Math.min(W, H) / 2 - 2;
  const g = ctx.createRadialGradient(W * 0.5, H * 0.5, r * 0.35, W * 0.5, H * 0.5, r);
  g.addColorStop(0, 'rgba(255, 230, 130, 0)');
  g.addColorStop(0.42, 'rgba(255, 230, 130, 0.55)');
  g.addColorStop(0.7, 'rgba(255, 200, 90, 0.30)');
  g.addColorStop(1, 'rgba(255, 180, 60, 0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(W * 0.5, H * 0.5, r, 0, 2 * Math.PI); ctx.fill();
  return cv;
}

// Optical-vault sun body: face plane (yellow disc + sunspots) +
// halo plane (additive corona). Sized to match the moon's optical
// body so eclipses overlap cleanly. Render orders are layered so
// halo (49) draws first, sun face (51.5) on top, and the moon body
// (52) eclipses the face while the halo's outer ring stays visible
// as a corona.
export class SunOpticalBody {
  constructor(clippingPlanes = []) {
    const geom = new THREE.PlaneGeometry(1, 1);

    this._haloCanvas = makeSunHaloCanvas();
    this._haloTex = new THREE.CanvasTexture(this._haloCanvas);
    this._haloTex.colorSpace = THREE.SRGBColorSpace;
    this._haloTex.minFilter = THREE.LinearMipMapLinearFilter;
    this._haloTex.magFilter = THREE.LinearFilter;
    this._haloMat = new THREE.MeshBasicMaterial({
      map: this._haloTex,
      transparent: true, side: THREE.DoubleSide,
      depthTest: false, depthWrite: false,
      blending: THREE.AdditiveBlending,
      clippingPlanes,
    });
    this._haloMesh = new THREE.Mesh(geom, this._haloMat);
    this._haloMesh.renderOrder = 49;

    this._faceCanvas = makeSunFaceCanvas();
    this._faceTex = new THREE.CanvasTexture(this._faceCanvas);
    this._faceTex.colorSpace = THREE.SRGBColorSpace;
    this._faceTex.minFilter = THREE.LinearMipMapLinearFilter;
    this._faceTex.magFilter = THREE.LinearFilter;
    this._faceMat = new THREE.MeshBasicMaterial({
      map: this._faceTex,
      transparent: true, side: THREE.DoubleSide,
      depthTest: false, depthWrite: false,
      clippingPlanes,
    });
    this._faceMesh = new THREE.Mesh(geom, this._faceMat);
    this._faceMesh.renderOrder = 51.5;

    this.group = new THREE.Group();
    this.group.add(this._haloMesh);
    this.group.add(this._faceMesh);
    this._zAxis = new THREE.Vector3(0, 0, 1);
  }

  update(opticalPos, size, show, rot, camera, alpha = 1) {
    this.group.visible = !!show;
    if (!show) return;
    this._faceMesh.position.set(opticalPos[0], opticalPos[1], opticalPos[2]);
    this._haloMesh.position.set(opticalPos[0], opticalPos[1], opticalPos[2]);
    this._faceMesh.scale.set(size, size, 1);
    this._haloMesh.scale.set(size * 2.5, size * 2.5, 1);
    if (camera) {
      // Halo stays camera-aligned (symmetric, no rotation needed).
      // Face camera-aligns then rotates around the local view axis
      // so the sunspot pattern reads as a real surface marking that
      // tilts with observer latitude — same convention the moon
      // canvas uses via ctx.rotate(c.MoonRotation).
      this._haloMesh.quaternion.copy(camera.quaternion);
      this._faceMesh.quaternion.copy(camera.quaternion);
      this._faceMesh.rotateOnAxis(this._zAxis, rot);
    }
    this._faceMat.opacity = alpha;
    this._haloMat.opacity = alpha;
  }
}

export class SunMoonGlyph {
  constructor(text, color, clippingPlanes = []) {
    const tex = new THREE.CanvasTexture(makeUnderlinedDigitCanvas(text, color));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter  = THREE.LinearMipMapLinearFilter;
    tex.magFilter  = THREE.LinearFilter;
    tex.anisotropy = 4;
    this.tex = tex;

    const geom = new THREE.PlaneGeometry(1, 1);

    this.vaultMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: false,
    });
    this.vaultMesh = new THREE.Mesh(geom, this.vaultMat);
    this.vaultMesh.renderOrder = 102;

    this.opticalMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      clippingPlanes,
    });
    this.opticalMesh = new THREE.Mesh(geom, this.opticalMat);
    this.opticalMesh.renderOrder = 54;

    this.group = new THREE.Group();
    this.group.add(this.vaultMesh);
    this.group.add(this.opticalMesh);
  }

  update(vaultPos, opticalPos, vaultSize, opticalSize, show) {
    this.group.visible = !!show;
    if (!show) return;
    this.vaultMesh.position.set(vaultPos[0], vaultPos[1], vaultPos[2]);
    this.vaultMesh.scale.set(vaultSize, vaultSize, 1);
    this.opticalMesh.position.set(opticalPos[0], opticalPos[1], opticalPos[2]);
    this.opticalMesh.scale.set(opticalSize, opticalSize, 1);
  }
}

// Filled-circle disc texture, used by MonthMarkers.
function _circleDiscCanvas(color) {
  const W = 64, H = 64;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, W / 2 - 2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 20, 20, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  return cv;
}

// Per-month sun position notches drawn as billboarded sprites on the
// observer's optical vault. Markers store observer-local offsets, so a
// sub-group anchored to ObserverFeCoord re-renders them at the current
// observer position each frame (mirrors GPTracer's sky behaviour).
export class MonthMarkers {
  constructor({
    color = '#ffe680',
    size = 0.011,
    clippingPlanes = [],
    markersKey = 'SunMonthMarkers',
    worldSpaceKey = 'SunMonthMarkersWorldSpace',
    worldSpace = false,
    noLoop = false,
    maxLoopPts = 64,
    name = 'month-markers',
  } = {}) {
    this.group = new THREE.Group();
    this.group.name = name;

    this.skyGroup = new THREE.Group();
    this.group.add(this.skyGroup);

    const tex = new THREE.CanvasTexture(_circleDiscCanvas(color));
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    this._tex = tex;
    this._size = size;
    this._clippingPlanes = clippingPlanes;
    this._sprites = [];
    this._markersKey = markersKey;
    this._worldSpaceKey = worldSpaceKey;
    this._forceWorldSpace = !!worldSpace;
    this._noLoop = !!noLoop;

    // Closed-loop polyline through every marker, in append order. The
    // closing segment from the last back to the first is what makes
    // the analemma read as a figure-8 / loop instead of an open chain.
    // Skipped entirely when `noLoop` is set (e.g. eclipse-position
    // markers, which are independent events with no meaningful order).
    if (!this._noLoop) {
      this._loopBuf = new Float32Array(maxLoopPts * 3);
      const loopGeo = new THREE.BufferGeometry();
      loopGeo.setAttribute('position', new THREE.BufferAttribute(this._loopBuf, 3));
      loopGeo.setDrawRange(0, 0);
      const loopMat = new THREE.LineBasicMaterial({
        color, transparent: true, opacity: 0.7,
        depthTest: false, depthWrite: false,
      });
      this._loop = new THREE.LineLoop(loopGeo, loopMat);
      this._loop.frustumCulled = false;
      this._loop.renderOrder = 59;
      this.skyGroup.add(this._loop);
      this._loopMaxPts = maxLoopPts;
    }
  }

  _ensureSprite(i) {
    while (this._sprites.length <= i) {
      const mat = new THREE.SpriteMaterial({
        map: this._tex, transparent: true,
        depthTest: false, depthWrite: false,
      });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(this._size, this._size, 1);
      sp.renderOrder = 60;
      this.skyGroup.add(sp);
      this._sprites.push(sp);
    }
    return this._sprites[i];
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    const arr = Array.isArray(s[this._markersKey]) ? s[this._markersKey] : [];
    const worldSpace = this._forceWorldSpace || !!s[this._worldSpaceKey];
    // World-space markers don't need ShowOpticalVault since they live
    // on the heavenly vault, not the observer's optical vault.
    const visible = arr.length > 0
      && (worldSpace || s.ShowOpticalVault !== false);
    this.group.visible = visible;
    if (!visible) return;

    if (worldSpace) {
      this.skyGroup.position.set(0, 0, 0);
    } else {
      const obs = c.ObserverFeCoord || [0, 0, 0];
      this.skyGroup.position.set(obs[0], obs[1], obs[2]);
    }

    for (let i = 0; i < arr.length; i++) {
      const m = arr[i];
      const sp = this._ensureSprite(i);
      sp.visible = true;
      sp.position.set(m[0], m[1], m[2]);
    }
    for (let i = arr.length; i < this._sprites.length; i++) {
      this._sprites[i].visible = false;
    }

    if (this._loop) {
      const n = Math.min(arr.length, this._loopMaxPts);
      for (let i = 0; i < n; i++) {
        const m = arr[i];
        this._loopBuf[i * 3    ] = m[0];
        this._loopBuf[i * 3 + 1] = m[1];
        this._loopBuf[i * 3 + 2] = m[2];
      }
      // LineLoop closes on its own once it has ≥ 2 points; keep it
      // hidden at a single point so we don't draw a degenerate edge.
      this._loop.geometry.setDrawRange(0, n >= 2 ? n : 0);
      this._loop.geometry.attributes.position.needsUpdate = true;
    }
  }
}

// --- Rays from observer to a target ---------------------------------------

export class Ray {
  constructor(color, opts = {}) {
    this.group = new THREE.Group();
    this.mat = new THREE.LineBasicMaterial({
      color, transparent: (opts.opacity ?? 1) < 1, opacity: opts.opacity ?? 1,
    });
    this.geom = new THREE.BufferGeometry();
    this.line = new THREE.Line(this.geom, this.mat);
    this.group.add(this.line);
  }

  // Draw a quadratic Bezier from observer -> target with a control point
  // offset along the observer's local up direction (Walter's RayParameter).
  updateCurve(observerCoord, targetCoord, controlCoord) {
    const pts = bezierQuad(observerCoord, controlCoord, targetCoord, 48);
    this.geom.dispose();
    this.geom = new THREE.BufferGeometry();
    this.geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.line.geometry = this.geom;
  }
}

// --- Observer marker -------------------------------------------------------

export class Observer {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'observer';
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xff2020 });
    this.marker = new THREE.Mesh(new THREE.SphereGeometry(0.004, 12, 10), markerMat);
    this.group.add(this.marker);

    // Small cross on the disc (still the precise location mark).
    const sSize = 0.012;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute([
      -sSize, 0, 0,  sSize, 0, 0,
       0, -sSize, 0,  0, sSize, 0,
    ], 3));
    this.cross = new THREE.LineSegments(
      geom, new THREE.LineBasicMaterial({ color: 0xff2020 })
    );
    this.group.add(this.cross);

    // Figure container — populated / rebuilt when the ObserverFigure state
    // changes ('male', 'female', or 'none').
    this.figureGroup = new THREE.Group();
    this.figureGroup.name = 'observer-figure';
    this.group.add(this.figureGroup);
    this._currentFigure = null;

    // Zenith-through-centre reference line — drawn in world space
    // from the observer's surface point to the origin (centre of
    // the terrestrial sphere). Lives on its own so the observer-frame
    // rotation can't bend its direction. Endpoints rewritten each
    // frame in `update()`. GE-only.
    const zcGeom = new THREE.BufferGeometry();
    zcGeom.setAttribute('position', new THREE.Float32BufferAttribute(
      [0, 0, 0, 0, 0, 0], 3,
    ));
    this.zenithToCenter = new THREE.Line(
      zcGeom,
      new THREE.LineBasicMaterial({
        color: 0xff8040, transparent: true, opacity: 0.85,
        depthTest: false, depthWrite: false,
      }),
    );
    this.zenithToCenter.renderOrder = 60;
    this.zenithToCenter.frustumCulled = false;
  }

  _buildFigure(kind) {
    // Clear previous
    while (this.figureGroup.children.length) {
      const c = this.figureGroup.children.pop();
      c.geometry?.dispose();
      c.material?.dispose();
    }
    if (kind === 'none') return;

    // Colours.
    const skin = new THREE.MeshBasicMaterial({ color: 0xd0a17c });
    const dark = new THREE.MeshBasicMaterial({ color: 0x1e2230 });
    const topMale   = new THREE.MeshBasicMaterial({ color: 0x2761c2 });
    const topFemale = new THREE.MeshBasicMaterial({ color: 0xc04870 });

    // Three.js cylinders default to +y axis; our scene is z-up so rotate each
    // cylinder's geometry once before wrapping into a mesh.
    const vertCyl = (rTop, rBot, h) => {
      const g = new THREE.CylinderGeometry(rTop, rBot, h, 16);
      g.rotateX(Math.PI / 2);
      return g;
    };
    const horzCyl = (r, h, axis) => {
      const g = new THREE.CylinderGeometry(r, r, h, 12);
      // Default cylinder is along +y. Re-orient depending on the requested
      // axis: 'x' rotates into the x direction, 'y' keeps, 'z' stands upright.
      if (axis === 'x') g.rotateZ(Math.PI / 2);
      else if (axis === 'z') g.rotateX(Math.PI / 2);
      return g;
    };

    const add = (mesh, x, y, z) => {
      mesh.position.set(x, y, z);
      this.figureGroup.add(mesh);
    };

    // Human head — only for the male / female variants. The other
    // characters build their own heads in their branches.
    if (kind === 'male' || kind === 'female') {
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.005, 16, 12), skin);
      add(head, 0, 0, 0.035);
    }

    if (kind === 'male') {
      // Torso: a slightly tapered box approximated with a short cylinder
      const torso = new THREE.Mesh(vertCyl(0.005, 0.005, 0.016), topMale);
      add(torso, 0, 0, 0.022);
      // Shoulders
      const sh = new THREE.Mesh(horzCyl(0.002, 0.014, 'x'), topMale);
      add(sh, 0, 0, 0.028);
      // Arms (hanging)
      const armGeo = vertCyl(0.0015, 0.0015, 0.013);
      const armL = new THREE.Mesh(armGeo, topMale);
      const armR = new THREE.Mesh(armGeo, topMale);
      add(armL, -0.0075, 0, 0.0215);
      add(armR,  0.0075, 0, 0.0215);
      // Legs
      const legGeo = vertCyl(0.0022, 0.0022, 0.013);
      add(new THREE.Mesh(legGeo, dark), -0.0025, 0, 0.0065);
      add(new THREE.Mesh(legGeo, dark),  0.0025, 0, 0.0065);
    } else if (kind === 'female') {
      // Narrower torso
      const torso = new THREE.Mesh(vertCyl(0.0035, 0.0045, 0.012), topFemale);
      add(torso, 0, 0, 0.024);
      // Shoulders (narrower than male)
      const sh = new THREE.Mesh(horzCyl(0.0018, 0.011, 'x'), topFemale);
      add(sh, 0, 0, 0.029);
      // Arms
      const armGeo = vertCyl(0.0013, 0.0013, 0.013);
      add(new THREE.Mesh(armGeo, topFemale), -0.006, 0, 0.0225);
      add(new THREE.Mesh(armGeo, topFemale),  0.006, 0, 0.0225);
      // Skirt: truncated cone (narrow at waist, wide at hem)
      const skirt = new THREE.Mesh(vertCyl(0.0035, 0.008, 0.012), dark);
      add(skirt, 0, 0, 0.012);
      // Short legs peeking below the hem
      const legGeo = vertCyl(0.0016, 0.0016, 0.006);
      add(new THREE.Mesh(legGeo, skin), -0.0025, 0, 0.003);
      add(new THREE.Mesh(legGeo, skin),  0.0025, 0, 0.003);
    } else if (kind === 'turtle') {
      // Shane St. Pierre — turtle. Flattened dome shell, stretched neck
      // with a small round head, four short legs, short tail. +x is
      // "forward" (same convention as the human figures).
      const shell    = new THREE.MeshBasicMaterial({ color: 0x4a7030 });
      const shellRim = new THREE.MeshBasicMaterial({ color: 0x3a5722 });
      const hide     = new THREE.MeshBasicMaterial({ color: 0x7ea350 });
      const eyeMat   = new THREE.MeshBasicMaterial({ color: 0x0c0c0c });

      // Shell: half-sphere flattened vertically.
      const shellGeo = new THREE.SphereGeometry(
        0.011, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2,
      );
      shellGeo.rotateX(Math.PI / 2);
      const shellMesh = new THREE.Mesh(shellGeo, shell);
      shellMesh.scale.set(1.15, 1.0, 0.65);
      add(shellMesh, 0, 0, 0.005);
      // Thin rim ring along the shell's lower edge.
      const rimGeo = new THREE.TorusGeometry(0.0125, 0.0011, 8, 32);
      add(new THREE.Mesh(rimGeo, shellRim), 0, 0, 0.005);

      // Neck + head out the front.
      const neck = new THREE.Mesh(horzCyl(0.0028, 0.007, 'x'), hide);
      add(neck, 0.0135, 0, 0.010);
      add(new THREE.Mesh(new THREE.SphereGeometry(0.0045, 14, 10), hide),
          0.0185, 0, 0.011);
      // Eyes
      add(new THREE.Mesh(new THREE.SphereGeometry(0.00075, 8, 6), eyeMat),
          0.0215, -0.0022, 0.0125);
      add(new THREE.Mesh(new THREE.SphereGeometry(0.00075, 8, 6), eyeMat),
          0.0215,  0.0022, 0.0125);

      // Four short legs at shell corners.
      const legGeo = vertCyl(0.0022, 0.0022, 0.006);
      const legs = [
        [ 0.0075,  0.0075], [ 0.0075, -0.0075],
        [-0.0075,  0.0075], [-0.0075, -0.0075],
      ];
      for (const [x, y] of legs) add(new THREE.Mesh(legGeo, hide), x, y, 0.003);

      // Short tail out the back.
      const tail = new THREE.Mesh(horzCyl(0.0013, 0.004, 'x'), hide);
      add(tail, -0.013, 0, 0.009);
    } else if (kind === 'bear') {
      // Voxel bear — a small Minecraft-style figure built from
      // unit cubes. Each cube is `vox` wide; the figure stands so
      // its feet anchor at `z = 0`. Palette: dark-brown shadow
      // pass, rich brown body, light-tan snout, black eyes /
      // nose, white claws.
      const vox = 0.0025;
      const bodyM   = new THREE.MeshBasicMaterial({ color: 0x6b3a1c });
      const shadowM = new THREE.MeshBasicMaterial({ color: 0x4a2810 });
      const snoutM  = new THREE.MeshBasicMaterial({ color: 0xc89870 });
      const eyeM    = new THREE.MeshBasicMaterial({ color: 0x121212 });
      const clawM   = new THREE.MeshBasicMaterial({ color: 0xf0e8d0 });
      const cubeGeom = new THREE.BoxGeometry(vox, vox, vox);
      const placeCube = (mat, ix, iy, iz) => {
        const m = new THREE.Mesh(cubeGeom, mat);
        m.position.set(ix * vox, iy * vox, iz * vox + vox / 2);
        this.figureGroup.add(m);
      };
      // legs (z = 0..2)
      for (const [ix, iy] of [[-1, -2], [-1, 2], [2, -2], [2, 2]]) {
        for (let iz = 0; iz < 2; iz++) placeCube(bodyM, ix, iy, iz);
        placeCube(clawM, ix, iy, 0);
      }
      // belly underside shadow
      for (let ix = -1; ix <= 2; ix++) for (let iy = -2; iy <= 2; iy++) placeCube(shadowM, ix, iy, 2);
      // body block (z = 3..6)
      for (let ix = -1; ix <= 2; ix++) {
        for (let iy = -2; iy <= 2; iy++) {
          for (let iz = 3; iz <= 6; iz++) placeCube(bodyM, ix, iy, iz);
        }
      }
      // head (z = 6..9, slightly raised at front)
      for (let ix = 1; ix <= 4; ix++) {
        for (let iy = -2; iy <= 2; iy++) {
          for (let iz = 7; iz <= 10; iz++) placeCube(bodyM, ix, iy, iz);
        }
      }
      // snout
      for (let iy = -1; iy <= 1; iy++) {
        for (let iz = 7; iz <= 8; iz++) placeCube(snoutM, 5, iy, iz);
      }
      placeCube(eyeM, 5, 0, 7);            // nose
      placeCube(eyeM, 4, -2, 9);           // left eye
      placeCube(eyeM, 4,  2, 9);           // right eye
      // ears
      placeCube(bodyM, 2, -3, 10);
      placeCube(bodyM, 2,  3, 10);
      // tail
      placeCube(bodyM, -2, 0, 5);
    } else if (kind === 'llama') {
      // Llamazing — white llama. Long-legged body, long curving neck,
      // small head with tall ears, tiny dark eyes and nose.
      const wool  = new THREE.MeshBasicMaterial({ color: 0xf4f0e8 });
      const muz   = new THREE.MeshBasicMaterial({ color: 0xd0b090 });
      const eyeMt = new THREE.MeshBasicMaterial({ color: 0x141414 });

      // Torso.
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.011, 20, 14), wool);
      body.scale.set(1.3, 0.9, 0.85);
      add(body, -0.002, 0, 0.034);

      // Neck: rising from front of torso, leaning forward.
      const neckGeo = new THREE.CylinderGeometry(0.0028, 0.004, 0.022, 12);
      const neck = new THREE.Mesh(neckGeo, wool);
      neck.rotation.x = Math.PI / 2;
      neck.rotation.z = -0.4;                 // tilt forward (+x)
      add(neck, 0.010, 0, 0.048);

      // Head.
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.005, 16, 12), wool);
      add(head, 0.018, 0, 0.058);
      // Muzzle.
      const muzzleMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.0028, 12, 9), muz,
      );
      muzzleMesh.scale.set(1.2, 1.0, 0.8);
      add(muzzleMesh, 0.022, 0, 0.056);

      // Tall pointy ears.
      const earGeo = new THREE.ConeGeometry(0.0012, 0.006, 8);
      earGeo.rotateX(Math.PI / 2);
      const earL = new THREE.Mesh(earGeo, wool);
      const earR = new THREE.Mesh(earGeo, wool);
      earL.rotation.z = -0.3;
      earR.rotation.z =  0.3;
      add(earL, 0.017, -0.002, 0.063);
      add(earR, 0.017,  0.002, 0.063);

      // Eyes.
      const eyeGeo = new THREE.SphereGeometry(0.00085, 8, 6);
      add(new THREE.Mesh(eyeGeo, eyeMt), 0.020, -0.003, 0.060);
      add(new THREE.Mesh(eyeGeo, eyeMt), 0.020,  0.003, 0.060);

      // Long legs.
      const legGeo = vertCyl(0.0018, 0.0018, 0.022);
      const legs = [
        [ 0.008,  0.006], [ 0.008, -0.006],
        [-0.010,  0.006], [-0.010, -0.006],
      ];
      for (const [x, y] of legs) add(new THREE.Mesh(legGeo, wool), x, y, 0.013);

      // Short fluffy tail.
      add(new THREE.Mesh(new THREE.SphereGeometry(0.003, 10, 8), wool),
          -0.016, 0, 0.034);
    } else if (kind === 'goose') {
      // Goose with a French beret. White plump body, long curved neck,
      // orange beak, orange webbed feet, and a tilted black beret.
      const feather = new THREE.MeshBasicMaterial({ color: 0xf8f8f4 });
      const beak    = new THREE.MeshBasicMaterial({ color: 0xff9a20 });
      const feet    = new THREE.MeshBasicMaterial({ color: 0xe07a10 });
      const beret   = new THREE.MeshBasicMaterial({ color: 0x181820 });
      const eyeMt   = new THREE.MeshBasicMaterial({ color: 0x0c0c0c });

      // Plump teardrop body.
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.013, 22, 16), feather);
      body.scale.set(1.2, 0.95, 0.9);
      add(body, -0.004, 0, 0.016);

      // Neck — arched cylinder.
      const neckGeo = new THREE.CylinderGeometry(0.0028, 0.0035, 0.020, 12);
      const neck = new THREE.Mesh(neckGeo, feather);
      neck.rotation.x = Math.PI / 2;
      neck.rotation.z = -0.7;
      add(neck, 0.007, 0, 0.030);

      // Head.
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 16, 12), feather);
      add(head, 0.018, 0, 0.038);

      // Beak — pointed cone extending forward.
      const beakGeo = new THREE.ConeGeometry(0.0018, 0.008, 10);
      beakGeo.rotateZ(-Math.PI / 2);
      add(new THREE.Mesh(beakGeo, beak), 0.025, 0, 0.037);

      // Eyes.
      const eyeGeo = new THREE.SphereGeometry(0.0009, 8, 6);
      add(new THREE.Mesh(eyeGeo, eyeMt), 0.019, -0.0038, 0.040);
      add(new THREE.Mesh(eyeGeo, eyeMt), 0.019,  0.0038, 0.040);

      // Beret — flat-ish disc perched on top of the head, tilted a bit.
      const beretGeo = new THREE.CylinderGeometry(0.0055, 0.0055, 0.0014, 24);
      const beretMesh = new THREE.Mesh(beretGeo, beret);
      beretMesh.rotation.x = Math.PI / 2;
      beretMesh.rotation.y = 0.15;
      beretMesh.position.set(0.017, 0, 0.0435);
      this.figureGroup.add(beretMesh);
      // Beret stem — the little cloth button.
      add(new THREE.Mesh(new THREE.SphereGeometry(0.0008, 8, 6), beret),
          0.015, 0, 0.045);

      // Webbed feet (short flat ovals).
      const footGeo = new THREE.SphereGeometry(0.0022, 10, 6);
      const footL = new THREE.Mesh(footGeo, feet);
      const footR = new THREE.Mesh(footGeo, feet);
      footL.scale.set(1.4, 0.9, 0.4);
      footR.scale.set(1.4, 0.9, 0.4);
      add(footL, -0.002, -0.003, 0.003);
      add(footR, -0.002,  0.003, 0.003);

      // Short pointed tail.
      add(new THREE.Mesh(new THREE.SphereGeometry(0.002, 8, 6), feather),
          -0.016, 0, 0.018);
    } else if (kind === 'cat') {
      // Black cat. Sleek body, pointy ears, arched tail curling up.
      const inky   = new THREE.MeshBasicMaterial({ color: 0x0a0a0d });
      const eyeMt  = new THREE.MeshBasicMaterial({ color: 0xa0cf40 });
      const noseMt = new THREE.MeshBasicMaterial({ color: 0x4a2028 });

      // Elongated body.
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.010, 20, 14), inky);
      body.scale.set(1.5, 0.85, 0.80);
      add(body, -0.002, 0, 0.012);

      // Head.
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.007, 18, 14), inky);
      add(head, 0.012, 0, 0.020);

      // Pointy ears (cones).
      const earGeo = new THREE.ConeGeometry(0.0022, 0.005, 8);
      earGeo.rotateX(Math.PI / 2);
      const earL = new THREE.Mesh(earGeo, inky);
      const earR = new THREE.Mesh(earGeo, inky);
      add(earL, 0.010, -0.004, 0.026);
      add(earR, 0.010,  0.004, 0.026);

      // Eyes — yellow-green slits.
      const eyeGeo = new THREE.SphereGeometry(0.0011, 10, 8);
      const eyeL = new THREE.Mesh(eyeGeo, eyeMt);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMt);
      eyeL.scale.set(1.2, 0.5, 1.0);
      eyeR.scale.set(1.2, 0.5, 1.0);
      add(eyeL, 0.017, -0.003, 0.022);
      add(eyeR, 0.017,  0.003, 0.022);

      // Tiny nose.
      add(new THREE.Mesh(new THREE.SphereGeometry(0.0008, 8, 6), noseMt),
          0.019, 0, 0.019);

      // Four thin legs.
      const legGeo = vertCyl(0.0017, 0.0017, 0.011);
      const legs = [
        [ 0.008,  0.006], [ 0.008, -0.006],
        [-0.008,  0.006], [-0.008, -0.006],
      ];
      for (const [x, y] of legs) add(new THREE.Mesh(legGeo, inky), x, y, 0.006);

      // Curving tail — approximated by three small cylinders rising up.
      const tailSegs = [
        [[-0.012, 0, 0.012], [-0.018, 0, 0.018]],
        [[-0.018, 0, 0.018], [-0.018, 0, 0.026]],
        [[-0.018, 0, 0.026], [-0.014, 0, 0.030]],
      ];
      for (const [a, b] of tailSegs) {
        const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
        const L = Math.hypot(dx, dy, dz);
        const g = new THREE.CylinderGeometry(0.0013, 0.0013, L, 8);
        const m = new THREE.Mesh(g, inky);
        m.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(dx / L, dy / L, dz / L),
        );
        m.position.set((a[0]+b[0])/2, (a[1]+b[1])/2, (a[2]+b[2])/2);
        this.figureGroup.add(m);
      }
    } else if (kind === 'drmike') {
      // Dr Mike — Great Pyrenees. Big fluffy white dog with a heavy
      // coat, broad chest, floppy ears, and a thick plumed tail.
      const coat    = new THREE.MeshBasicMaterial({ color: 0xf6f3ec });
      const offWhite = new THREE.MeshBasicMaterial({ color: 0xe7e1d2 });
      const nose    = new THREE.MeshBasicMaterial({ color: 0x141414 });
      const eyeMt   = new THREE.MeshBasicMaterial({ color: 0x2a1a0c });

      // Deep barrel chest + body.
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.014, 22, 16), coat);
      body.scale.set(1.4, 1.0, 0.95);
      add(body, -0.002, 0, 0.028);

      // Shoulder / chest puff — extra fluff at the front.
      const ruff = new THREE.Mesh(new THREE.SphereGeometry(0.010, 18, 14), offWhite);
      ruff.scale.set(1.1, 1.15, 0.9);
      add(ruff, 0.011, 0, 0.030);

      // Head — broad, rounded.
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.010, 20, 14), coat);
      head.scale.set(1.15, 1.0, 0.95);
      add(head, 0.021, 0, 0.042);

      // Muzzle.
      const muzzleGeo = new THREE.SphereGeometry(0.0052, 14, 10);
      const muzzle = new THREE.Mesh(muzzleGeo, coat);
      muzzle.scale.set(1.3, 0.9, 0.85);
      add(muzzle, 0.030, 0, 0.040);
      // Black nose.
      add(new THREE.Mesh(new THREE.SphereGeometry(0.0016, 10, 8), nose),
          0.0355, 0, 0.041);

      // Floppy triangular ears hanging down beside the head.
      const earGeo = new THREE.ConeGeometry(0.0035, 0.009, 10);
      const earL = new THREE.Mesh(earGeo, coat);
      const earR = new THREE.Mesh(earGeo, coat);
      earL.rotation.x = Math.PI;           // point down
      earR.rotation.x = Math.PI;
      earL.rotation.z = -0.15;
      earR.rotation.z =  0.15;
      add(earL, 0.019, -0.0095, 0.044);
      add(earR, 0.019,  0.0095, 0.044);

      // Dark button eyes.
      const eyeGeo = new THREE.SphereGeometry(0.0011, 10, 8);
      add(new THREE.Mesh(eyeGeo, eyeMt), 0.027, -0.004, 0.045);
      add(new THREE.Mesh(eyeGeo, eyeMt), 0.027,  0.004, 0.045);

      // Sturdy legs.
      const legGeo = vertCyl(0.003, 0.003, 0.016);
      const legs = [
        [ 0.010,  0.009], [ 0.010, -0.009],
        [-0.012,  0.009], [-0.012, -0.009],
      ];
      for (const [x, y] of legs) add(new THREE.Mesh(legGeo, coat), x, y, 0.010);

      // Plumed tail — a large fluffy sphere trailing behind, lifted a bit.
      const tail = new THREE.Mesh(new THREE.SphereGeometry(0.006, 14, 10), offWhite);
      tail.scale.set(1.3, 0.9, 1.1);
      add(tail, -0.019, 0, 0.034);
    } else if (kind === 'owl') {
      // Owl — plump round body with a big flat face, tufted ears, large
      // yellow eyes, a curved beak, and a white chest.
      const featherT = new THREE.MeshBasicMaterial({ color: 0x7e5838 });
      const featherD = new THREE.MeshBasicMaterial({ color: 0x5a3e22 });
      const chest    = new THREE.MeshBasicMaterial({ color: 0xe8d8bc });
      const beak     = new THREE.MeshBasicMaterial({ color: 0xc08430 });
      const eyeBig   = new THREE.MeshBasicMaterial({ color: 0xf6c020 });
      const pupil    = new THREE.MeshBasicMaterial({ color: 0x141414 });

      // Barrel body.
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.013, 22, 16), featherT);
      body.scale.set(1.0, 1.0, 1.2);
      add(body, 0, 0, 0.020);
      // Pale chest patch.
      const chestMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.010, 16, 12), chest,
      );
      chestMesh.scale.set(0.8, 0.4, 1.1);
      add(chestMesh, 0.006, 0, 0.020);

      // Head — big round sphere sitting atop.
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.011, 20, 14), featherT);
      add(head, 0, 0, 0.038);

      // Flat face disc.
      const face = new THREE.Mesh(
        new THREE.SphereGeometry(0.009, 18, 12), chest,
      );
      face.scale.set(0.4, 1.0, 1.0);
      add(face, 0.007, 0, 0.038);

      // Tufted ears — small cones on top of the head.
      const tuftGeo = new THREE.ConeGeometry(0.0018, 0.005, 8);
      tuftGeo.rotateX(Math.PI / 2);
      const tuftL = new THREE.Mesh(tuftGeo, featherT);
      const tuftR = new THREE.Mesh(tuftGeo, featherT);
      tuftL.rotation.z = -0.3;
      tuftR.rotation.z =  0.3;
      add(tuftL, -0.002, -0.006, 0.046);
      add(tuftR, -0.002,  0.006, 0.046);

      // Big round yellow eyes with black pupils.
      const eyeGeo = new THREE.SphereGeometry(0.0032, 14, 10);
      add(new THREE.Mesh(eyeGeo, eyeBig), 0.008, -0.0045, 0.040);
      add(new THREE.Mesh(eyeGeo, eyeBig), 0.008,  0.0045, 0.040);
      const pupilGeo = new THREE.SphereGeometry(0.0014, 10, 8);
      add(new THREE.Mesh(pupilGeo, pupil), 0.0103, -0.0045, 0.040);
      add(new THREE.Mesh(pupilGeo, pupil), 0.0103,  0.0045, 0.040);

      // Curved beak (cone pointing forward).
      const beakGeo = new THREE.ConeGeometry(0.0016, 0.005, 8);
      beakGeo.rotateZ(-Math.PI / 2);
      add(new THREE.Mesh(beakGeo, beak), 0.013, 0, 0.037);

      // Wings — two darker flattened spheres at the sides, tucked in.
      const wingGeo = new THREE.SphereGeometry(0.007, 14, 10);
      const wingL = new THREE.Mesh(wingGeo, featherD);
      const wingR = new THREE.Mesh(wingGeo, featherD);
      wingL.scale.set(0.5, 0.4, 1.3);
      wingR.scale.set(0.5, 0.4, 1.3);
      add(wingL, 0, -0.010, 0.020);
      add(wingR, 0,  0.010, 0.020);

      // Small feet.
      const footGeo = new THREE.SphereGeometry(0.0022, 10, 6);
      const footL = new THREE.Mesh(footGeo, beak);
      const footR = new THREE.Mesh(footGeo, beak);
      footL.scale.set(1.2, 0.9, 0.4);
      footR.scale.set(1.2, 0.9, 0.4);
      add(footL, 0.001, -0.004, 0.003);
      add(footR, 0.001,  0.004, 0.003);
    } else if (kind === 'frog') {
      // Frog — wide low body squatting on the ground with bulging eyes,
      // a broad mouth, short forelegs and long folded hind legs.
      const skinG   = new THREE.MeshBasicMaterial({ color: 0x3fa04a });
      const skinD   = new THREE.MeshBasicMaterial({ color: 0x2a7033 });
      const belly   = new THREE.MeshBasicMaterial({ color: 0xd8e8a8 });
      const pupil   = new THREE.MeshBasicMaterial({ color: 0x141414 });
      const mouthM  = new THREE.MeshBasicMaterial({ color: 0x4a2028 });

      // Wide squat body.
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.014, 22, 16), skinG);
      body.scale.set(1.1, 1.15, 0.6);
      add(body, 0, 0, 0.008);
      // Pale belly beneath.
      const bellyMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 16, 12), belly,
      );
      bellyMesh.scale.set(1.0, 1.0, 0.3);
      add(bellyMesh, 0, 0, 0.004);

      // Eye bumps — bulge out of the top of the head.
      const eyeBase = new THREE.SphereGeometry(0.0035, 14, 10);
      add(new THREE.Mesh(eyeBase, skinG), 0.008, -0.006, 0.016);
      add(new THREE.Mesh(eyeBase, skinG), 0.008,  0.006, 0.016);
      // Pupil domes.
      const pupilGeo = new THREE.SphereGeometry(0.0016, 10, 8);
      add(new THREE.Mesh(pupilGeo, pupil), 0.010, -0.006, 0.018);
      add(new THREE.Mesh(pupilGeo, pupil), 0.010,  0.006, 0.018);

      // Wide closed-mouth line — a thin darker strip across the front.
      const mouthGeo = new THREE.BoxGeometry(0.001, 0.012, 0.0008);
      add(new THREE.Mesh(mouthGeo, mouthM), 0.013, 0, 0.008);

      // Short forelegs under the chest.
      const foreGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.005, 10);
      foreGeo.rotateX(Math.PI / 2);
      add(new THREE.Mesh(foreGeo, skinG),  0.009, -0.008, 0.004);
      add(new THREE.Mesh(foreGeo, skinG),  0.009,  0.008, 0.004);

      // Long folded hind legs — approximate with an L-shape of two
      // scaled spheres (thigh + shin) on each side.
      const thighGeo = new THREE.SphereGeometry(0.004, 12, 10);
      const thighL = new THREE.Mesh(thighGeo, skinD);
      const thighR = new THREE.Mesh(thighGeo, skinD);
      thighL.scale.set(1.2, 0.7, 0.7);
      thighR.scale.set(1.2, 0.7, 0.7);
      add(thighL, -0.008, -0.010, 0.006);
      add(thighR, -0.008,  0.010, 0.006);
      const shinGeo = new THREE.SphereGeometry(0.003, 12, 10);
      const shinL = new THREE.Mesh(shinGeo, skinG);
      const shinR = new THREE.Mesh(shinGeo, skinG);
      shinL.scale.set(1.4, 0.7, 0.5);
      shinR.scale.set(1.4, 0.7, 0.5);
      add(shinL, -0.002, -0.013, 0.003);
      add(shinR, -0.002,  0.013, 0.003);
    } else if (kind === 'kangaroo') {
      // Kangaroo — upright stance, big rear legs and tail, small fore
      // arms, long ears on a narrow head.
      const fur    = new THREE.MeshBasicMaterial({ color: 0x8b6a4a });
      const fawn   = new THREE.MeshBasicMaterial({ color: 0xc2a079 });
      const nose   = new THREE.MeshBasicMaterial({ color: 0x141414 });
      const eyeMt  = new THREE.MeshBasicMaterial({ color: 0x141414 });

      // Upright body — elongated vertically.
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.012, 20, 14), fur);
      body.scale.set(0.95, 0.85, 1.6);
      add(body, 0, 0, 0.028);
      // Pale belly stripe.
      const bellyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.010, 16, 12), fawn);
      bellyMesh.scale.set(0.45, 0.75, 1.6);
      add(bellyMesh, 0.006, 0, 0.028);

      // Neck + head — head leans forward.
      const neckGeo = new THREE.CylinderGeometry(0.0035, 0.0045, 0.010, 12);
      const neck = new THREE.Mesh(neckGeo, fur);
      neck.rotation.x = Math.PI / 2;
      neck.rotation.z = -0.4;
      add(neck, 0.006, 0, 0.048);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.006, 16, 12), fur);
      head.scale.set(1.6, 1.0, 1.0);
      add(head, 0.014, 0, 0.054);

      // Nose tip.
      add(new THREE.Mesh(new THREE.SphereGeometry(0.0013, 10, 8), nose),
          0.0205, 0, 0.053);

      // Tall pointed ears.
      const earGeo = new THREE.ConeGeometry(0.0015, 0.008, 8);
      earGeo.rotateX(Math.PI / 2);
      const earL = new THREE.Mesh(earGeo, fur);
      const earR = new THREE.Mesh(earGeo, fur);
      earL.rotation.z = -0.2;
      earR.rotation.z =  0.2;
      add(earL, 0.010, -0.003, 0.062);
      add(earR, 0.010,  0.003, 0.062);

      // Small dark eyes.
      const eyeGeo = new THREE.SphereGeometry(0.0009, 8, 6);
      add(new THREE.Mesh(eyeGeo, eyeMt), 0.0155, -0.0035, 0.055);
      add(new THREE.Mesh(eyeGeo, eyeMt), 0.0155,  0.0035, 0.055);

      // Boxing stance: upper arms slope out and down from the shoulders,
      // forearms angle up and forward into a guard, with red gloves at
      // the fists. Built by orienting two cylinder segments per arm.
      const segment = (a, b, r, mat) => {
        const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
        const L = Math.hypot(dx, dy, dz);
        const g = new THREE.CylinderGeometry(r, r, L, 10);
        const m = new THREE.Mesh(g, mat);
        m.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(dx / L, dy / L, dz / L),
        );
        m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
        return m;
      };
      const shL = [0.004, -0.007, 0.042];
      const shR = [0.004,  0.007, 0.042];
      const elL = [0.011, -0.009, 0.036];
      const elR = [0.011,  0.009, 0.036];
      const fistL = [0.018, -0.005, 0.050];
      const fistR = [0.018,  0.005, 0.050];
      this.figureGroup.add(segment(shL, elL, 0.0022, fur));   // upper arm L
      this.figureGroup.add(segment(shR, elR, 0.0022, fur));   // upper arm R
      this.figureGroup.add(segment(elL, fistL, 0.002,  fur)); // forearm L
      this.figureGroup.add(segment(elR, fistR, 0.002,  fur)); // forearm R
      // Red boxing gloves at the fists.
      const glove = new THREE.MeshBasicMaterial({ color: 0xc22020 });
      const gloveGeo = new THREE.SphereGeometry(0.0038, 14, 10);
      add(new THREE.Mesh(gloveGeo, glove), fistL[0], fistL[1], fistL[2]);
      add(new THREE.Mesh(gloveGeo, glove), fistR[0], fistR[1], fistR[2]);

      // Big powerful hind legs — oriented thighs, diagonal feet.
      const thighGeo = new THREE.CylinderGeometry(0.0045, 0.0055, 0.016, 12);
      thighGeo.rotateX(Math.PI / 2);
      const thighL = new THREE.Mesh(thighGeo, fur);
      const thighR = new THREE.Mesh(thighGeo, fur);
      thighL.rotation.y = -0.3;
      thighR.rotation.y = -0.3;
      add(thighL, -0.004, -0.006, 0.018);
      add(thighR, -0.004,  0.006, 0.018);
      // Long flat feet.
      const footGeo = new THREE.BoxGeometry(0.014, 0.004, 0.003);
      const footL = new THREE.Mesh(footGeo, fur);
      const footR = new THREE.Mesh(footGeo, fur);
      add(footL, 0.002, -0.006, 0.0025);
      add(footR, 0.002,  0.006, 0.0025);

      // Thick tapered tail lying on the ground behind.
      const tailGeo = new THREE.CylinderGeometry(0.0045, 0.0015, 0.026, 12);
      tailGeo.rotateZ(Math.PI / 2);
      const tail = new THREE.Mesh(tailGeo, fur);
      tail.rotation.y = 0.25;
      add(tail, -0.018, 0, 0.008);
    } else if (kind === 'nikki') {
      // Voxel "Nikki" — small humanoid built from unit cubes.
      // Stands at the disc with feet anchored at z = 0 to match
      // the other figures. Palette: skin, dark hair, hot-pink top
      // and skirt, dark legs, white shoes. Head, hair, torso,
      // arms, legs and shoes laid out as discrete voxel blocks.
      const vox = 0.0025;
      const skinM   = new THREE.MeshBasicMaterial({ color: 0x4a2c1a });
      const hairM   = new THREE.MeshBasicMaterial({ color: 0x2a1a14 });
      const eyeM    = new THREE.MeshBasicMaterial({ color: 0x121212 });
      const lipM    = new THREE.MeshBasicMaterial({ color: 0xc04060 });
      const topM    = new THREE.MeshBasicMaterial({ color: 0xe04080 });
      const skirtM  = new THREE.MeshBasicMaterial({ color: 0xb02060 });
      const legM    = new THREE.MeshBasicMaterial({ color: 0x40384a });
      const shoeM   = new THREE.MeshBasicMaterial({ color: 0xf0e8e0 });
      const cubeGeom = new THREE.BoxGeometry(vox, vox, vox);
      const placeCube = (mat, ix, iy, iz) => {
        const m = new THREE.Mesh(cubeGeom, mat);
        m.position.set(ix * vox, iy * vox, iz * vox + vox / 2);
        this.figureGroup.add(m);
      };
      // shoes (z = 0)
      for (const ix of [-1, 0]) for (const iy of [-1, 0]) placeCube(shoeM, ix, iy, 0);
      // legs (z = 1..5)
      for (let iz = 1; iz <= 5; iz++) {
        placeCube(legM, -1, -1, iz);
        placeCube(legM, -1,  0, iz);
        placeCube(legM,  0, -1, iz);
        placeCube(legM,  0,  0, iz);
      }
      // skirt flare (z = 6, wider than torso)
      for (let ix = -2; ix <= 1; ix++) for (let iy = -2; iy <= 1; iy++) placeCube(skirtM, ix, iy, 6);
      for (let ix = -1; ix <= 0; ix++) for (let iy = -1; iy <= 0; iy++) placeCube(skirtM, ix, iy, 5);
      // torso (z = 7..10) — pink top
      for (let ix = -1; ix <= 0; ix++) {
        for (let iy = -1; iy <= 0; iy++) {
          for (let iz = 7; iz <= 10; iz++) placeCube(topM, ix, iy, iz);
        }
      }
      // arms hanging at sides (z = 7..9)
      for (let iz = 7; iz <= 9; iz++) {
        placeCube(skinM, -1, -2, iz);
        placeCube(skinM,  0,  1, iz);
      }
      // head (z = 11..13)
      for (let ix = -1; ix <= 0; ix++) {
        for (let iy = -1; iy <= 0; iy++) {
          for (let iz = 11; iz <= 13; iz++) placeCube(skinM, ix, iy, iz);
        }
      }
      // long hair behind head + flowing past shoulders
      for (let iy = -2; iy <= 1; iy++) {
        for (let iz = 8; iz <= 14; iz++) placeCube(hairM, -2, iy, iz);
      }
      for (let ix = -1; ix <= 0; ix++) for (let iy = -1; iy <= 0; iy++) placeCube(hairM, ix, iy, 14);
      // facial features (face = +iy direction)
      placeCube(eyeM, -1,  0, 12);
      placeCube(eyeM,  0,  0, 12);
      placeCube(lipM, -1,  0, 11);
    }

    // Paint the figure after the celestial markers (sun/moon/planet dots
    // and their halos sit at renderOrder ≤ 100 with depthTest: false, so
    // they leak through any figure at the default renderOrder of 0). A
    // high renderOrder combined with normal depth testing makes the
    // figure occlude markers that happen to overlap it in screen space.
    this.figureGroup.traverse((o) => {
      if (o.isMesh) o.renderOrder = 110;
    });

    this._currentFigure = kind;
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    const ge = s.WorldModel === 'ge';
    const p = ge ? c.GlobeObserverCoord : c.ObserverFeCoord;
    this.group.position.set(p[0], p[1], p[2]);
    // Hide the figure at the fictitious observer position
    // (globe centre in GE, AE pole at disc centre in FE).
    this.group.visible = !s.ObserverAtCenter;

    const kind = s.ObserverFigure || 'male';
    if (kind !== this._currentFigure) this._buildFigure(kind);
    // Marker dot + crosshair stay hidden in every mode. `none`
    // therefore reads as a fully invisible observer (the placement
    // is still real, the on-screen mark just isn't drawn).
    this.marker.visible = false;
    this.cross.visible  = false;

    const headingRad = ToRad(s.ObserverHeading || 0);
    if (ge && c.GlobeObserverFrame) {
      // Stand the figure tangent to the sphere: local +z = radial
      // outward; +x = -north = "outward" from sphere centre on a
      // tangent (matches the FE convention where local +x is
      // outward from the disc centre); +y = east. Columns of the
      // matrix are [-north, east, up], which is right-handed
      // (det = +1) so `setFromRotationMatrix` extracts a valid
      // quaternion.
      const f = c.GlobeObserverFrame;
      const m = new THREE.Matrix4();
      m.set(
        -f.northX, f.eastX, f.upX, 0,
        -f.northY, f.eastY, f.upY, 0,
        -f.northZ, f.eastZ, f.upZ, 0,
         0,        0,       0,     1,
      );
      this.group.quaternion.setFromRotationMatrix(m);
      // Spin the figure about local +z (zenith) so its +x face points
      // along the compass-heading direction (heading 0 = north,
      // heading 90 = east, …). Derivation: local +x → -north under
      // the GE basis; we want the post-rotation direction to equal
      // (cos H · north + sin H · east), so figureGroup rotates by
      // (π − H).
      this.figureGroup.rotation.set(0, 0, Math.PI - headingRad);
    } else {
      this.group.quaternion.identity();
      // Keep the figure facing the heading direction. In FE the
      // local frame is world-aligned, so we add the longitude angle
      // (atan2(p[1], p[0])) to the (π − H) baseline so heading 0
      // points the figure toward the disc centre (north) regardless
      // of where on the disc the observer stands.
      const ang = Math.atan2(p[1], p[0]);
      this.figureGroup.rotation.set(0, 0, ang + Math.PI - headingRad);
    }

    // Axis line — observer position → origin. In GE this is the
    // radial line from the surface observer down to the globe
    // centre; in FE it lies on the disc plane from the observer
    // to (lat=90, lon=0) at the AE pole. When the GE observer is
    // at the globe centre, both endpoints would coincide; instead
    // anchor the line from origin out to the original surface
    // position stored in `LastObserver*` so the user keeps a
    // visual tie back to where they came from.
    if (this.zenithToCenter) {
      this.zenithToCenter.visible = !!s.ShowAxisLine;
      if (this.zenithToCenter.visible) {
        const arr = this.zenithToCenter.geometry.attributes.position.array;
        if (s.ObserverAtCenter) {
          // At the fictitious observer: line from world origin out
          // to the live surface lat/lon (= anchor dot). Moves with
          // slider adjustments.
          let q;
          if (ge) {
            const lat = s.ObserverLat * Math.PI / 180;
            const lon = s.ObserverLong * Math.PI / 180;
            const cl = Math.cos(lat), sl = Math.sin(lat);
            const co = Math.cos(lon), so = Math.sin(lon);
            q = [FE_RADIUS * cl * co, FE_RADIUS * cl * so, FE_RADIUS * sl];
          } else {
            q = feLatLongToGlobalFeCoord(s.ObserverLat, s.ObserverLong, FE_RADIUS);
          }
          arr[0] = 0; arr[1] = 0; arr[2] = 0;
          arr[3] = q[0]; arr[4] = q[1]; arr[5] = q[2];
        } else {
          arr[0] = p[0]; arr[1] = p[1]; arr[2] = p[2];
          arr[3] = 0;    arr[4] = 0;    arr[5] = 0;
        }
        this.zenithToCenter.geometry.attributes.position.needsUpdate = true;
      }
    }
  }
}

// --- Sun/Moon tracks (path over one day / one orbit) ----------------------

export class Track {
  constructor(color, opacity = 0.6) {
    this.group = new THREE.Group();
    this.mat = new THREE.LineBasicMaterial({
      color, transparent: opacity < 1, opacity,
    });
    this.line = new THREE.Line(new THREE.BufferGeometry(), this.mat);
    this.group.add(this.line);
  }

  _setPoints(pts) {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.line.geometry.dispose();
    this.line.geometry = geom;
  }
}

// --- Analemma trace ------------------------------------------------------
// Renders a polyline through accumulated optical-vault positions for sun
// or moon. Points are appended in `app.update()` one per integer
// day-of-year while the corresponding state flag is on.
export class AnalemmaLine {
  constructor(color, opacity = 0.85) {
    this.group = new THREE.Group();
    this.group.name = 'analemma';
    this.mat = new THREE.LineBasicMaterial({
      color, transparent: opacity < 1, opacity,
      depthTest: false, depthWrite: false,
    });
    this.line = new THREE.Line(new THREE.BufferGeometry(), this.mat);
    this.line.renderOrder = 35;
    this.group.add(this.line);
  }
  update(pts, visible) {
    this.group.visible = !!visible && pts && pts.length >= 6;
    if (!this.group.visible) return;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.line.geometry.dispose();
    this.line.geometry = geom;
  }
}

// --- Stars --------------------------------------------------------------
//
// A single fixed set of celestial directions (lat/lon in the rotating sky
// frame) is used to render TWO clouds:
//   * on the dome — the stars' physical positions on the celestial shell
//   * on the inner vision sphere — projected toward the observer at a unit
//     direction, matching where the stars *appear* from the observer's
//     viewpoint (the globe-model projection)
// The dome stars use the sky rotation (TransMatVaultToFe); the inner-sphere
// stars use the celest-to-globe transform and are placed at the observer.
export class Stars {
  constructor(count = 1200, clippingPlanes = []) {
    this.group = new THREE.Group();
    this.group.name = 'stars';

    // Fixed celestial directions, plus their precomputed unit vectors.
    this._celest = [];
    this._celestVect = [];
    for (let i = 0; i < count; i++) {
      const u = Math.random(), v = Math.random();
      const phi = Math.acos(2 * v - 1);
      const lon = -180 + 360 * u;
      const lat = 90 - (180 * phi / Math.PI);
      this._celest.push([lat, lon]);
      this._celestVect.push(latLongToCoord(lat, lon, 1));
    }
    this._count = count;

    // Dome cloud (positions updated each frame as the sky rotates).
    this._domePositions = new Float32Array(count * 3);
    this._domeAttr = new THREE.BufferAttribute(this._domePositions, 3);
    const domeGeom = new THREE.BufferGeometry();
    domeGeom.setAttribute('position', this._domeAttr);
    this.domePoints = new THREE.Points(
      domeGeom,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2, sizeAttenuation: false,
        transparent: true, opacity: 1,
        clippingPlanes,
      }),
    );
    this.domePoints.frustumCulled = false;
    this.group.add(this.domePoints);

    // Inner-sphere projected cloud (observer-local).
    this._spherePositions = new Float32Array(count * 3);
    this._sphereAttr = new THREE.BufferAttribute(this._spherePositions, 3);
    const sphGeom = new THREE.BufferGeometry();
    sphGeom.setAttribute('position', this._sphereAttr);
    this.spherePoints = new THREE.Points(
      sphGeom,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.5, sizeAttenuation: false,
        transparent: true, opacity: 1,
        depthTest: false, depthWrite: false,
        clippingPlanes,
      }),
    );
    this.spherePoints.renderOrder = 55;
    this.spherePoints.frustumCulled = false;
    this.group.add(this.spherePoints);
  }

  update(model) {
    const s = model.state;
    const c = model.computed;

    // Starfield opacity. With DynamicStars on (default) the cloud fades
    // with the sun's elevation so it behaves like a real sky. With it off,
    // stars stay at full brightness regardless of day / night. GE mode
    // simulates real spherical astronomy, so the day-fade is always on
    // there regardless of the flag.
    const dynamic = s.DynamicStars || s.WorldModel === 'ge';
    const nightAlpha = dynamic ? (c.NightFactor || 0) : 1.0;
    const visibilityGate = dynamic ? nightAlpha > 0.01 : true;
    const showStars = s.ShowStars && visibilityGate;
    // Dome starfield is a true-source mimic — gate it on ShowTruePositions
    // so toggling "True Positions" off also hides the heavenly starfield.
    // also gate on `!InsideVault` so the random cloud doesn't
    // render twice in Optical (dome + cap both painted through the
    // transparent cap).
    this.domePoints.visible   = showStars && (s.ShowTruePositions !== false) && !s.InsideVault;
    this.domePoints.material.opacity   = nightAlpha;
    // Optical-vault star projection: each above-horizon star is placed on
    // the observer's optical hemisphere (radius OpticalVaultRadius), the
    // same way planet markers project. Sub-horizon stars are parked far
    // below the disc so the clip plane hides them — without that, they'd
    // bunch onto the lower hemisphere and read as a downward vortex.
    this.spherePoints.visible = showStars && s.ShowOpticalVault;
    this.spherePoints.material.opacity = nightAlpha;
    if (!showStars) return;

    const domePos = this._domePositions;
    const sphPos = this._spherePositions;
    const opticalR = c.OpticalVaultRadius;
    const opticalH = c.OpticalVaultHeightEffective;
    const ge = s.WorldModel === 'ge';
    const Rgv = c.GlobeVaultRadius || (FE_RADIUS * 1.6);
    const skyRotDeg = c.SkyRotAngle || 0;

    for (let i = 0; i < this._celest.length; i++) {
      const [lat, lon] = this._celest[i];
      const celestV = this._celestVect[i];

      let feVault = null;
      if (ge) {
        // Globe heavenly-vault projection: place each star on the
        // celestial sphere at radius GlobeVaultRadius, with longitude
        // folded by SkyRotAngle so the sphere co-rotates with Earth.
        const phi = lat * Math.PI / 180;
        const lam = (lon - skyRotDeg) * Math.PI / 180;
        const cp = Math.cos(phi);
        domePos[i * 3]     = Rgv * cp * Math.cos(lam);
        domePos[i * 3 + 1] = Rgv * cp * Math.sin(lam);
        domePos[i * 3 + 2] = Rgv * Math.sin(phi);
      } else {
        // FE flat starfield disk: stars sit at a single constant
        // altitude (StarfieldVaultHeight). Apply sky rotation to the
        // celestial longitude *before* projecting so DP (no rotational
        // symmetry) lands stars directly above their disc GPs. AE
        // collapses to the previous post-rotation result by symmetry.
        const disc = canonicalLatLongToDisc(lat, lon - skyRotDeg, FE_RADIUS);
        feVault = [disc[0], disc[1], s.StarfieldVaultHeight];
        domePos[i * 3]     = feVault[0];
        domePos[i * 3 + 1] = feVault[1];
        domePos[i * 3 + 2] = feVault[2];
      }

      // --- Inner-sphere projection -----------------------------------
      // celest unit dir -> observer's local-globe -> fe-local (axis swap)
      // -> global-fe (rotate by observer long, translate to observer).
      const localGlobe = M.Trans(c.TransMatCelestToGlobe, celestV);
      if (ge && c.GlobeObserverFrame && c.GlobeObserverCoord) {
        // GE optical-vault projection: hemisphere of FE_RADIUS tangent
        // at the observer. Sub-horizon stars (zenith ≤ 0) park below
        // the sphere so they disappear as elevation crosses 0°.
        if (localGlobe[0] <= 0) {
          sphPos[i * 3]     = 0;
          sphPos[i * 3 + 1] = 0;
          sphPos[i * 3 + 2] = -1000;
          continue;
        }
        const f = c.GlobeObserverFrame;
        const obsG = c.GlobeObserverCoord;
        const ax = localGlobe[2], ay = localGlobe[1], az = localGlobe[0];
        sphPos[i * 3]     = obsG[0] + opticalR * (ax * f.northX + ay * f.eastX + az * f.upX);
        sphPos[i * 3 + 1] = obsG[1] + opticalR * (ax * f.northY + ay * f.eastY + az * f.upY);
        sphPos[i * 3 + 2] = obsG[2] + opticalR * (ax * f.northZ + ay * f.eastZ + az * f.upZ);
      } else if (localGlobe[0] <= 0) {
        // FE: below-horizon stars get parked far below the disc; the
        // disc clip plane then hides them.
        sphPos[i * 3]     = 0;
        sphPos[i * 3 + 1] = 0;
        sphPos[i * 3 + 2] = -1000;
        continue;
      } else {
        // FE: ellipsoidal optical vault: x/y scaled by horizontal
        // radius (opticalR), z by vertical height (opticalH). Same
        // flattened cap the sun / moon / planet markers project onto.
        // swap (x-zenith, y-east, z-north) -> (x-out, y-east, z-up): [-z, y, x]
        const feLocal = [-localGlobe[2] * opticalR, localGlobe[1] * opticalR, localGlobe[0] * opticalH];
        const gs = M.Trans(c.TransMatLocalFeToGlobalFe, feLocal);
        sphPos[i * 3]     = gs[0];
        sphPos[i * 3 + 1] = gs[1];
        sphPos[i * 3 + 2] = gs[2];
      }
    }
    // BufferAttributes need an explicit flag to re-upload to the GPU each
    // frame. Without this the stars stay pinned at their initial zeros and
    // nothing visible shows up, which is exactly what "starfield isn't
    // coming back" looks like.
    this._domeAttr.needsUpdate   = true;
    this._sphereAttr.needsUpdate = true;
  }
}

// --- Declination guide circles --------------------------------------------
//
// Constant-Dec circles on the celestial sphere projected onto the optical
// vault via the same celest→local-globe transform the stars use. They make
// the lat-dependent convergence pattern visually unmistakable:
//
//   lat = +90°N → all circles centred on zenith; +Dec circles are concentric
//                 around the NCP at the apex (Polaris-style polar view).
//   lat = +45°N → circles tilt; high-Dec ones cluster around the NCP at
//                 45° elev north, the celestial equator arcs through the
//                 southern sky.
//   lat =   0°  → NCP on north rim, SCP on south rim, equator passes
//                 overhead — the two diverging fields.
//   lat = −45°S → mirror of +45°N around SCP.
export class DeclinationCircles {
  constructor(clippingPlanes = []) {
    this.group = new THREE.Group();
    this.group.name = 'declination-circles';

    // One ring per declination band. Dec values in degrees; +60/-60 hug the
    // poles; 0 is the celestial equator (great circle).
    this._decRings = [];
    const RING_RES = 96;
    // Standard 15° grid + tight rings near the poles (80°, 85°) so the
    // polar convergence is visually emphasised. The closer to the pole,
    // the smaller the ring radius, which makes the wheel-around effect
    // pop in observer mode.
    const decs = [0, 15, 30];
    for (const dec of decs) {
      const absD = Math.abs(dec);
      const isEquator = dec === 0;
      const isHighPolar = absD >= 75;     // tightest rings around the pole
      const isPolar     = absD >= 45;
      // Pole-side rings get a brighter colour with sign coding (warm for N,
      // cool for S) so the convergence direction is unambiguous.
      const color = isEquator
        ? 0xff8844
        : isHighPolar
          ? (dec > 0 ? 0xff5050 : 0x4090ff)
          : isPolar
            ? (dec > 0 ? 0xffa090 : 0x80b0ff)
            : 0x6e7280;
      // High-polar rings stand out so the apparent wheel around the pole
      // reads strongly at any latitude.
      const opacity = isEquator ? 0.6 : isHighPolar ? 0.7 : isPolar ? 0.45 : 0.25;
      const positions = new Float32Array(RING_RES * 2 * 3);   // line segments
      const attr = new THREE.BufferAttribute(positions, 3);
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', attr);
      const mat = new THREE.LineBasicMaterial({
        color, transparent: true, opacity,
        depthTest: false, depthWrite: false,
        clippingPlanes,
      });
      const segs = new THREE.LineSegments(geom, mat);
      segs.renderOrder = 58;
      this.group.add(segs);
      // Pre-compute the celestial-frame unit vectors for this ring.
      const decR = dec * Math.PI / 180;
      const cd = Math.cos(decR), sd = Math.sin(decR);
      const celestVects = [];
      for (let k = 0; k <= RING_RES; k++) {
        const ra = (k / RING_RES) * 2 * Math.PI;
        celestVects.push([cd * Math.cos(ra), cd * Math.sin(ra), sd]);
      }
      this._decRings.push({ dec, segs, attr, positions, celestVects });
    }
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    const opticalR = c.OpticalVaultRadius;
    const opticalH = c.OpticalVaultHeightEffective;

    this.group.visible = !!s.ShowDecCircles && !!s.ShowOpticalVault;
    if (!this.group.visible) return;

    for (const ring of this._decRings) {
      const positions = ring.positions;
      const cv = ring.celestVects;
      let segIdx = 0;
      for (let k = 0; k < cv.length - 1; k++) {
        const a = M.Trans(c.TransMatCelestToGlobe, cv[k]);
        const b = M.Trans(c.TransMatCelestToGlobe, cv[k + 1]);
        // Skip segment if either endpoint is below horizon — the segment
        // must stay on the visible cap. This crops circles that dip below
        // the horizon (e.g. equator from a polar observer).
        if (a[0] <= 0 || b[0] <= 0) continue;
        const aFe = [-a[2] * opticalR, a[1] * opticalR, a[0] * opticalH];
        const bFe = [-b[2] * opticalR, b[1] * opticalR, b[0] * opticalH];
        const aGs = M.Trans(c.TransMatLocalFeToGlobalFe, aFe);
        const bGs = M.Trans(c.TransMatLocalFeToGlobalFe, bFe);
        positions[segIdx * 6 + 0] = aGs[0];
        positions[segIdx * 6 + 1] = aGs[1];
        positions[segIdx * 6 + 2] = aGs[2];
        positions[segIdx * 6 + 3] = bGs[0];
        positions[segIdx * 6 + 4] = bGs[1];
        positions[segIdx * 6 + 5] = bGs[2];
        segIdx++;
      }
      // Park unused segments far below the disc so the clip plane hides them.
      for (let i = segIdx; i < cv.length - 1; i++) {
        for (let j = 0; j < 6; j++) positions[i * 6 + j] = (j % 3 === 2) ? -1000 : 0;
      }
      ring.segs.geometry.setDrawRange(0, segIdx * 2);
      ring.attr.needsUpdate = true;
    }
  }
}

// --- Celestial pole markers ------------------------------------------------
//
// Two markers pinned at celestial Dec = ±90°. They're transformed through
// the same `TransMatCelestToGlobe` the stars use, so their position on the
// observer's optical vault shifts with latitude automatically:
//
//   lat = +45°N → NCP at 45° elevation in the north (above horizon),
//                 SCP at 45° below the southern horizon (hidden).
//   lat =   0°  → NCP on the northern rim, SCP on the southern rim.
//   lat = −45°S → SCP at 45° elev south, NCP hidden below.
//
// Also drawn on the dome (flat starfield disc) via the same AE projection
// the stars use, so it's visible from the orbit view too.
export class CelestialPoles {
  constructor(clippingPlanes = []) {
    this.group = new THREE.Group();
    this.group.name = 'celestial-poles';

    const mk = (color) => {
      const g = new THREE.Group();
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.0025, 16, 12),
        new THREE.MeshBasicMaterial({
          color, transparent: true, opacity: 1,
          depthTest: false, depthWrite: false,
        }),
      );
      dot.renderOrder = 67;
      g.add(dot);
      return { group: g, dot };
    };

    this.ncpSphere = mk(0xff4040);   // NCP red (Polaris-side)
    this.scpSphere = mk(0x40a0ff);   // SCP blue

    this.group.add(this.ncpSphere.group);
    this.group.add(this.scpSphere.group);
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    const obs = c.ObserverFeCoord;
    const opticalR = c.OpticalVaultRadius;
    const opticalH = c.OpticalVaultHeightEffective;

    // master visibility for the two pole dots. When it
    // switches them off, the parent group hides and the per-sphere
    // visibility logic below short-circuits harmlessly.
    const polesOn = s.ShowCelestialPoles !== false;
    this.group.visible = polesOn;
    if (!polesOn) return;

    const place = (groupObj, celestV) => {
      // Optical-vault position from observer's local frame.
      const lg = M.Trans(c.TransMatCelestToGlobe, celestV);
      if (lg[0] <= 0) {
        // Pole is below the observer's horizon — hide the optical-vault
        // marker entirely.
        groupObj.group.visible = false;
        return;
      }
      groupObj.group.visible = s.ShowOpticalVault;
      const feLocal = [-lg[2] * opticalR, lg[1] * opticalR, lg[0] * opticalH];
      const gs = M.Trans(c.TransMatLocalFeToGlobalFe, feLocal);
      groupObj.group.position.set(gs[0], gs[1], gs[2]);
    };

    place(this.ncpSphere, [0, 0,  1]);
    place(this.scpSphere, [0, 0, -1]);
  }
}

// --- Cosmology centerpieces ------------------------------------------------
//
// Mythic axis-mundi features for the center of the disc. In this model the
// disc centre (r = 0 on the AE projection) corresponds to the geographic
// north pole — the classical location of the world axis in both Norse and
// Dharmic cosmologies. Each class renders a THREE.Group that is shown only
// when `state.Cosmology` matches its key; both auto-scale with VaultHeight
// so the top of the tree / mountain always kisses the heavenly dome.

const COSMOLOGY_DEFAULT_VAULT_H = 0.75;  // matches GEOMETRY.VaultHeightDefault

// Yggdrasil — Norse world-tree. Massive tapered trunk with eight great
// outward-and-upward branches, each tipped with a dense leaf cluster;
// secondary twigs sprout off each branch; the canopy swells into a
// multi-layered crown; heavy named roots and tendrils radiate across the
// disc. Scaled to brush the underside of the dome.
export class Yggdrasil {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'yggdrasil';

    // Solid materials throughout — the tree is a physical occluder. Leaves
    // are opaque (no alpha blending) so they write to the depth buffer and
    // hide any celestial marker that ends up behind them.
    const bark       = new THREE.MeshBasicMaterial({ color: 0x6b4423 });
    const darkBark   = new THREE.MeshBasicMaterial({ color: 0x4e2f17 });
    const leaf       = new THREE.MeshBasicMaterial({ color: 0x3e8e41 });
    const leafBright = new THREE.MeshBasicMaterial({ color: 0x6ec77a });
    const leafDeep   = new THREE.MeshBasicMaterial({ color: 0x2a6d33 });

    // Helper: place an oriented cylinder from point a to point b with
    // radii (rA at a, rB at b). Three.js cylinder defaults to the +y
    // axis, so we rotate it to align with (b − a).
    const bough = (a, b, rA, rB, mat, radialSegs = 10) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (len < 1e-9) return null;
      const geo = new THREE.CylinderGeometry(rB, rA, len, radialSegs);
      const mesh = new THREE.Mesh(geo, mat);
      const up = new THREE.Vector3(0, 1, 0);
      const dir = new THREE.Vector3(dx / len, dy / len, dz / len);
      mesh.quaternion.setFromUnitVectors(up, dir);
      mesh.position.set(
        (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2,
      );
      return mesh;
    };

    // ----- Main trunk (tapered) --------------------------------------
    const trunkTop = 0.58;
    const trunk = bough([0, 0, 0], [0, 0, trunkTop], 0.055, 0.022, bark, 24);
    this.group.add(trunk);
    // Dark bark ring at the base for a hint of gnarled root flare.
    this.group.add(bough([0, 0, 0], [0, 0, 0.05], 0.075, 0.055, darkBark, 24));

    // ----- Primary branches -------------------------------------------
    // Eight main branches radiating outward from mid-trunk, angling upward.
    const N_MAIN = 8;
    const leafCluster = (x, y, z, scale = 1) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.add(new THREE.Mesh(
        new THREE.SphereGeometry(0.075 * scale, 18, 14), leaf,
      ));
      g.add(new THREE.Mesh(
        new THREE.SphereGeometry(0.045 * scale, 14, 10), leafBright,
      ));
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2;
        const s = new THREE.Mesh(
          new THREE.SphereGeometry(0.035 * scale, 12, 9),
          k % 2 === 0 ? leaf : leafDeep,
        );
        s.position.set(
          Math.cos(a) * 0.06 * scale,
          Math.sin(a) * 0.06 * scale,
          0.02 * scale + (k % 2) * 0.025 * scale,
        );
        g.add(s);
      }
      return g;
    };

    for (let i = 0; i < N_MAIN; i++) {
      const a = (i / N_MAIN) * Math.PI * 2;
      const start = [0, 0, 0.30];
      const outR  = 0.26;
      const endZ  = 0.55;
      const end   = [Math.cos(a) * outR, Math.sin(a) * outR, endZ];
      this.group.add(bough(start, end, 0.018, 0.009, bark, 12));

      // Two secondary twigs off this main branch — fork off at ~70% of
      // its length, one slightly up, one slightly down.
      const forkT = 0.68;
      const fork = [
        start[0] + (end[0] - start[0]) * forkT,
        start[1] + (end[1] - start[1]) * forkT,
        start[2] + (end[2] - start[2]) * forkT,
      ];
      const spread = 0.08;
      const twigUp = [
        end[0] + Math.cos(a + 0.4) * spread,
        end[1] + Math.sin(a + 0.4) * spread,
        endZ + 0.05,
      ];
      const twigDn = [
        end[0] + Math.cos(a - 0.4) * spread,
        end[1] + Math.sin(a - 0.4) * spread,
        endZ - 0.03,
      ];
      this.group.add(bough(fork, twigUp, 0.010, 0.004, bark, 8));
      this.group.add(bough(fork, twigDn, 0.010, 0.004, bark, 8));

      // Leaf clusters at branch tip + both twig tips.
      this.group.add(leafCluster(end[0], end[1], end[2], 1.0));
      this.group.add(leafCluster(twigUp[0], twigUp[1], twigUp[2], 0.65));
      this.group.add(leafCluster(twigDn[0], twigDn[1], twigDn[2], 0.65));
    }

    // ----- Crown canopy on top of the trunk --------------------------
    const crown = new THREE.Group();
    crown.position.z = trunkTop;
    crown.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 28, 20), leaf));
    crown.add(new THREE.Mesh(new THREE.SphereGeometry(0.08,  22, 16), leafBright));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 16, 12),
        i % 3 === 0 ? leafDeep : leaf,
      );
      orb.position.set(
        Math.cos(a) * 0.09,
        Math.sin(a) * 0.09,
        0.03 + (i % 2) * 0.04,
      );
      crown.add(orb);
    }
    const crownTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 18, 14), leafBright,
    );
    crownTop.position.z = 0.11;
    crown.add(crownTop);
    this.group.add(crown);

    // Render the tree after the celestial markers (which use depthTest:
    // false and renderOrder up to 100) so it paints over any sun/moon/
    // planet marker that would otherwise show through the trunk or canopy.
    this.group.traverse((o) => {
      if (o.isMesh) o.renderOrder = 110;
    });

    this.group.visible = false;
  }

  update(model) {
    const on = model.state.Cosmology === 'yggdrasil';
    this.group.visible = on;
    if (!on) return;
    // Scale vertically with the heavenly vault height so the crown always
    // brushes the dome interior regardless of the VaultHeight slider.
    const k = (model.state.VaultHeight || COSMOLOGY_DEFAULT_VAULT_H)
            / COSMOLOGY_DEFAULT_VAULT_H;
    this.group.scale.set(1, 1, k);
  }
}

// Mt Meru — Hindu / Buddhist / Jain cosmic mountain. Stepped terraces of
// alternating stone tones rising to a gilded spire. Four-sided frustums
// give the faceted look traditional iconography uses; a rotation of 45°
// orients two faces to each cardinal axis. Surrounded by a pair of faint
// rings representing the concentric cosmic oceans that circle it.
export class MtMeru {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'mt-meru';

    const topZ = 0.7;
    const baseR = 0.13;
    const topR  = 0.022;
    const levels = 6;
    // Warm earth → gold gradient up the terraces.
    const palette = [0x6e4a2a, 0x8a5a34, 0xa6703e, 0xc38a4a, 0xdca85a, 0xf0c768];

    for (let i = 0; i < levels; i++) {
      const t0 = i / levels;
      const t1 = (i + 1) / levels;
      const r0 = baseR + (topR - baseR) * t0;
      const r1 = baseR + (topR - baseR) * t1;
      const z0 = topZ * t0;
      const z1 = topZ * t1;
      // Four-sided frustum — reads as a pyramidal terrace from any angle.
      const geo = new THREE.CylinderGeometry(r1, r0, z1 - z0, 4, 1);
      geo.rotateX(Math.PI / 2);
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({ color: palette[i] }),
      );
      mesh.position.z = (z0 + z1) / 2;
      mesh.rotation.z = Math.PI / 4;   // faces toward cardinals
      this.group.add(mesh);
    }

    // Gilded spire at the summit — the brahmaloka crowning the axis.
    const spireGeo = new THREE.ConeGeometry(0.012, 0.07, 16);
    spireGeo.rotateX(-Math.PI / 2);
    const spire = new THREE.Mesh(
      spireGeo,
      new THREE.MeshBasicMaterial({ color: 0xffdf6a }),
    );
    spire.position.z = topZ + 0.035;
    this.group.add(spire);

    // Two concentric sea rings around the base — the cosmological oceans.
    for (const [radius, opacity] of [[0.18, 0.55], [0.26, 0.35]]) {
      const N = 96;
      const pts = new Float32Array(N * 3);
      for (let k = 0; k < N; k++) {
        const a = (k / N) * Math.PI * 2;
        pts[k * 3 + 0] = Math.cos(a) * radius;
        pts[k * 3 + 1] = Math.sin(a) * radius;
        pts[k * 3 + 2] = 0.003;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      const ring = new THREE.LineLoop(
        g,
        new THREE.LineBasicMaterial({
          color: 0x7aa6c2, transparent: true, opacity,
        }),
      );
      this.group.add(ring);
    }

    // Solid terraces and spire render after celestial markers so they
    // occlude any sun/moon/planet that would otherwise show through the
    // mountain. Decorative ocean rings keep their default order.
    this.group.traverse((o) => {
      if (o.isMesh) o.renderOrder = 110;
    });

    this.group.visible = false;
  }

  update(model) {
    const on = model.state.Cosmology === 'meru';
    this.group.visible = on;
    if (!on) return;
    const k = (model.state.VaultHeight || COSMOLOGY_DEFAULT_VAULT_H)
            / COSMOLOGY_DEFAULT_VAULT_H;
    this.group.scale.set(1, 1, k);
  }
}

// Discworld cosmology: Great A'Tuin the star turtle swimming through
// space, with four elephants (Berilia, Tubul, Great T'Phon, Jerakeen)
// arranged in a cross on its back holding the FE disc aloft. Nod to
// Terry Pratchett's *The Colour of Magic*. Materials are left without
// clipping planes so the whole assembly renders below z = 0 (under
// the disc) where the user can orbit around to see it.
export class Discworld {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'discworld';

    const shellColor  = 0x3a6a3a;   // turtle shell — mottled green
    const skinColor   = 0x5a8a55;   // softer body green
    const elephantCol = 0x8c8c94;   // slate-grey elephants
    const ivoryCol    = 0xeeeadf;   // tusks

    // --- A'Tuin the turtle ------------------------------------------
    // Shell: squashed hemisphere sitting just under the disc.
    const shellGeo = new THREE.SphereGeometry(0.7, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    shellGeo.scale(1, 1, 0.45);
    shellGeo.translate(0, 0, -0.55);
    const shellMat = new THREE.MeshBasicMaterial({ color: shellColor });
    this.group.add(new THREE.Mesh(shellGeo, shellMat));

    // Belly: matching hemisphere flipped over, slightly smaller.
    const bellyGeo = new THREE.SphereGeometry(0.65, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    bellyGeo.scale(1, 1, 0.35);
    bellyGeo.translate(0, 0, -0.55);
    this.group.add(new THREE.Mesh(bellyGeo, new THREE.MeshBasicMaterial({ color: skinColor })));

    // Four legs at the corners of the shell, splayed outward.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const legGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.45, 10);
      legGeo.translate(0, -0.22, 0);
      legGeo.rotateX(Math.PI / 2);
      const leg = new THREE.Mesh(legGeo, new THREE.MeshBasicMaterial({ color: skinColor }));
      leg.position.set(Math.cos(a) * 0.6, Math.sin(a) * 0.6, -0.55);
      leg.rotation.z = a;
      this.group.add(leg);
    }

    // Turtle head + neck poking out the front.
    const neckGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.35, 12);
    neckGeo.rotateX(Math.PI / 2);
    const neck = new THREE.Mesh(neckGeo, new THREE.MeshBasicMaterial({ color: skinColor }));
    neck.position.set(0.85, 0, -0.55);
    neck.rotation.z = Math.PI / 2;
    this.group.add(neck);
    const headGeo = new THREE.SphereGeometry(0.13, 16, 12);
    const head = new THREE.Mesh(headGeo, new THREE.MeshBasicMaterial({ color: skinColor }));
    head.position.set(1.05, 0, -0.52);
    this.group.add(head);

    // Stubby tail.
    const tailGeo = new THREE.ConeGeometry(0.06, 0.2, 8);
    tailGeo.rotateZ(Math.PI / 2);
    const tail = new THREE.Mesh(tailGeo, new THREE.MeshBasicMaterial({ color: skinColor }));
    tail.position.set(-0.85, 0, -0.57);
    tail.rotation.z = Math.PI;
    this.group.add(tail);

    // --- Four elephants in a cross on the turtle's back -------------
    // Each elephant's head points outward (radial), so their butts
    // meet at the disc centre — matches Pratchett's cross arrangement.
    const buildElephant = () => {
      const g = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({ color: elephantCol });
      // Body
      const bodyGeo = new THREE.SphereGeometry(0.16, 14, 10);
      bodyGeo.scale(1.3, 0.9, 0.9);
      const body = new THREE.Mesh(bodyGeo, mat);
      body.position.z = 0.13;
      g.add(body);
      // Head
      const hGeo = new THREE.SphereGeometry(0.11, 14, 10);
      const h = new THREE.Mesh(hGeo, mat);
      h.position.set(0.18, 0, 0.17);
      g.add(h);
      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.22, 10);
      trunkGeo.rotateX(Math.PI / 2);
      trunkGeo.rotateY(-Math.PI / 2);
      const trunk = new THREE.Mesh(trunkGeo, mat);
      trunk.position.set(0.28, 0, 0.11);
      g.add(trunk);
      // Two tusks
      for (const dy of [0.045, -0.045]) {
        const tuskGeo = new THREE.ConeGeometry(0.018, 0.12, 8);
        tuskGeo.rotateZ(-Math.PI / 2);
        const tusk = new THREE.Mesh(tuskGeo, new THREE.MeshBasicMaterial({ color: ivoryCol }));
        tusk.position.set(0.26, dy, 0.14);
        g.add(tusk);
      }
      // Ears
      for (const dy of [0.12, -0.12]) {
        const earGeo = new THREE.SphereGeometry(0.07, 10, 8);
        earGeo.scale(0.3, 1, 1);
        const ear = new THREE.Mesh(earGeo, mat);
        ear.position.set(0.13, dy, 0.19);
        g.add(ear);
      }
      // Four legs
      for (const [dx, dy] of [[0.1, 0.08], [0.1, -0.08], [-0.1, 0.08], [-0.1, -0.08]]) {
        const legG = new THREE.CylinderGeometry(0.03, 0.03, 0.14, 8);
        legG.translate(0, -0.07, 0);
        legG.rotateX(Math.PI / 2);
        const leg = new THREE.Mesh(legG, mat);
        leg.position.set(dx, dy, 0.05);
        g.add(leg);
      }
      // Tail
      const tGeo = new THREE.CylinderGeometry(0.01, 0.02, 0.11, 6);
      tGeo.rotateX(Math.PI / 2);
      tGeo.rotateY(Math.PI / 2);
      const t = new THREE.Mesh(tGeo, mat);
      t.position.set(-0.22, 0, 0.12);
      g.add(t);
      return g;
    };

    const elephants = [];
    for (let i = 0; i < 4; i++) {
      const e = buildElephant();
      const theta = (i / 4) * Math.PI * 2;
      const rad = 0.22;
      e.position.set(Math.cos(theta) * rad, Math.sin(theta) * rad, -0.22);
      e.rotation.z = theta;
      this.group.add(e);
      elephants.push(e);
    }

    // All meshes render before the disc so occlusion reads correctly
    // when the orbit camera drops below the horizon line.
    this.group.traverse((o) => { if (o.isMesh) o.renderOrder = 85; });

    this.group.visible = false;
  }

  update(model) {
    this.group.visible = model.state.Cosmology === 'discworld';
  }
}

// Toroidal vortex — a proper donut-shaped wireframe of a toroidal field,
// centered on the disc axis. Built as a spindle torus (tube radius r >
// axial distance R) so the inner hole pinches down to two points on the
// z-axis near the top and bottom, matching the classic "toroidal field"
// diagram. Drawn as a dense grid of latitude rings (constant u, big
// circles around the z-axis) and poloidal rings (constant v, small
// circles through the hole).
//
// Parametrization:
//   x(u, v) = (R + r·cos u) · cos v
//   y(u, v) = (R + r·cos u) · sin v
//   z(u, v) = r · sin u + zOffset
// Pinch points sit on the z-axis at z = zOffset ± √(r² − R²) where
// R + r·cos u = 0.
//
// Two variants (chosen by state.Cosmology):
//   'vortex'  — one large blue torus reaching the dome circumference
//   'vortex2' — stacked dual vortex, an upper "inner" donut reaching the
//               equator circle and a lower "outer" donut reaching the
//               dome circumference; brighter + softer amber tones so the
//               two read as distinct fields, with the flat earth
//               suspended at z = 0 between them
export class ToroidalVortex {
  constructor(variant = 'single', clippingPlanes = []) {
    this.group = new THREE.Group();
    this.group.name = `toroidal-vortex-${variant}`;
    this._variant   = variant;
    this._stateKey  = variant === 'dual' ? 'vortex2' : 'vortex';
    this._clipPlanes = clippingPlanes;
    this._materials = [];

    const N_U = 36;
    const N_V = 60;

    // Geometry definitions per variant. Each entry is one donut.
    //   R       — axial distance from z-axis to tube centre
    //   r       — tube radius (r > R ⇒ spindle torus with two pinches)
    //   z       — vertical offset of tube centre
    //   color   — line colour
    //   opacity — material opacity
    const tori = variant === 'dual'
      ? [
          // Upper donut: smaller, brighter — inner horn-like torus whose
          // outer circumference kisses the equator circle (r = 0.5).
          { R: 0.25, r: 0.25, z: +0.25, color: 0xffc870, opacity: 0.70 },
          // Outer donut: larger, softer — raised so its tube midline sits
          // on the flat-earth plane. The disc then bisects this torus at
          // its equator, and its outer circumference reaches the dome
          // edge (r ≈ 0.95).
          { R: 0.55, r: 0.40, z: 0, color: 0xa8652c, opacity: 0.50 },
        ]
      : [
          // Single large spindle torus — outer ≈ 0.95 reaches dome rim,
          // vertical extent ±0.70 fits under default VaultHeight (0.75).
          { R: 0.25, r: 0.70, z: 0, color: 0x4080ff, opacity: 0.55 },
        ];

    for (const t of tori) {
      // depthTest enabled so the opaque disc occludes the below-disc half
      // of the torus when the camera is above the disc plane. depthWrite
      // stays off so line pixels don't leave z-fighting artefacts against
      // later overlapping torus segments.
      const mat = new THREE.LineBasicMaterial({
        color: t.color, transparent: true, opacity: t.opacity,
        depthTest: true, depthWrite: false,
      });
      this._materials.push(mat);

      const point = (u, v) => {
        const rho = t.R + t.r * Math.cos(u);
        return [rho * Math.cos(v), rho * Math.sin(v), t.r * Math.sin(u) + t.z];
      };

      // Latitude rings — hold u constant, sweep v.
      for (let i = 0; i < N_U; i++) {
        const u = (i / N_U) * Math.PI * 2;
        const pts = new Float32Array((N_V + 1) * 3);
        for (let j = 0; j <= N_V; j++) {
          const v = (j / N_V) * Math.PI * 2;
          const p = point(u, v);
          pts[j * 3 + 0] = p[0];
          pts[j * 3 + 1] = p[1];
          pts[j * 3 + 2] = p[2];
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
        const line = new THREE.Line(g, mat);
        line.renderOrder = 48;
        this.group.add(line);
      }

      // Poloidal rings — hold v constant, sweep u.
      for (let j = 0; j < N_V; j++) {
        const v = (j / N_V) * Math.PI * 2;
        const pts = new Float32Array((N_U + 1) * 3);
        for (let i = 0; i <= N_U; i++) {
          const u = (i / N_U) * Math.PI * 2;
          const p = point(u, v);
          pts[i * 3 + 0] = p[0];
          pts[i * 3 + 1] = p[1];
          pts[i * 3 + 2] = p[2];
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
        const line = new THREE.Line(g, mat);
        line.renderOrder = 48;
        this.group.add(line);
      }
    }

    // Dual variant: cyan boundary ring at z = 0 around the outer donut —
    // marks the flat-earth plane suspended between the two fields.
    if (variant === 'dual') {
      const R_BOUND = 0.97;
      const N_RING = 128;
      const pts = new Float32Array((N_RING + 1) * 3);
      for (let k = 0; k <= N_RING; k++) {
        const a = (k / N_RING) * Math.PI * 2;
        pts[k * 3 + 0] = R_BOUND * Math.cos(a);
        pts[k * 3 + 1] = R_BOUND * Math.sin(a);
        pts[k * 3 + 2] = 0;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      const ringMat = new THREE.LineBasicMaterial({
        color: 0x4fc0ff, transparent: true, opacity: 0.9,
        depthTest: true, depthWrite: false,
      });
      this._materials.push(ringMat);
      const ring = new THREE.Line(g, ringMat);
      ring.renderOrder = 49;
      this.group.add(ring);
    }

    this.group.visible = false;
    this._rotate = 0;
  }

  // Slow rotation around the z-axis so the circulation reads as motion.
  tick(dt) {
    if (!this.group.visible) return;
    this._rotate += dt * 0.15;
    this.group.rotation.z = this._rotate;
  }

  update(model) {
    const on = model.state.Cosmology === this._stateKey;
    this.group.visible = on;
    if (!on) return;
    const k = (model.state.VaultHeight || COSMOLOGY_DEFAULT_VAULT_H)
            / COSMOLOGY_DEFAULT_VAULT_H;
    this.group.scale.set(1, 1, k);
    // Inside-the-optical-vault (first-person) mode: clip anything below
    // the disc so the vortex's lower half doesn't leak into the
    // observer's hemisphere of vision.
    const clip = model.state.InsideVault ? this._clipPlanes : [];
    for (const m of this._materials) m.clippingPlanes = clip;
  }
}

// --- Tracked-object ground points --------------------------------
//
// One disc-surface dot per entry in `c.TrackerInfos`. Colour keyed by
// category so sun-tracking reads yellow, moon white, planets warm, stars
// pale blue. Pool is fixed-size and reused across frames; unused slots
// hide. Tracked GPs are always visible while the target is in
// TrackerTargets — independent of ShowGroundPoints (which only gates
// sun/moon GPs). Hidden in first-person (Optical) mode so they don't
// clutter the observer's view of the ground they're standing on.
// star GP colour bumped from 0x8ed4ff (pale blue) to 0xffffff
// (white) so tracked-star ground points read as the same pigment the
// cel-nav starfield paints overhead, not a distinct "tracker-blue"
// category.
const TRACKED_GP_COLORS = {
  sun: 0xffc844, moon: 0xf4f4f4,
  planet: 0xff8c66, star: 0xffffff,
};

export class TrackedGroundPoints {
  constructor(max = 16) {
    this.group = new THREE.Group();
    this.group.name = 'tracked-gps';
    this._pool  = [];
    this._lines = [];
    this._radialLines = [];
    for (let i = 0; i < max; i++) {
      const gp = new GroundPoint(0xffffff);
      this._pool.push(gp);
      this.group.add(gp.group);

      // Parallel pool of solid vertical lines from the object's vault
      // coord straight down to the disc GP. Same pattern sunGPLine /
      // moonGPLine use — makes the GP legible as "this dot on the
      // ground corresponds to that point in the sky".
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
      const mat = new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.45,
        depthTest: false, depthWrite: false,
      });
      const line = new THREE.Line(geo, mat);
      line.renderOrder = 45;
      this._lines.push(line);
      this.group.add(line);

      // Second per-GP line (GE-only): dashed radial from the GP on
      // the surface down to the globe centre. Surfaces the radial
      // direction visually so the GP reads as "the spot directly
      // beneath the body" along a true centre-line. Hidden in FE
      // mode (the disc has no centre to drop to).
      const rgeo = new THREE.BufferGeometry();
      rgeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
      const rmat = new THREE.LineDashedMaterial({
        color: 0xffffff, transparent: true, opacity: 0.55,
        dashSize: 0.022, gapSize: 0.014,
        depthTest: false, depthWrite: false,
      });
      const rline = new THREE.Line(rgeo, rmat);
      rline.renderOrder = 45;
      this._radialLines.push(rline);
      this.group.add(rline);
    }
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    const infos = c.TrackerInfos || [];
    // Tracker GPs follow the master `ShowGroundPoints` toggle by
    // default. `TrackerGPOverride` bypasses the master so every
    // tracked target paints its GP regardless. In Heavenly mode,
    // follow-only entries (the synthesised `FollowTarget` row that
    // isn't also in `TrackerTargets`) always render their GP so the
    // user can see where the tracked body sits on the ground.
    const baseShow = !s.InsideVault && (!!s.ShowGroundPoints || !!s.TrackerGPOverride);
    const heavenly = !s.InsideVault;
    const followId = s.FollowTarget;

    const OVERRIDE_BY_SUBCAT = {
      celnav:     'GPOverrideCelNav',
      catalogued: 'GPOverrideConstellations',
      blackhole:  'GPOverrideBlackHoles',
      quasar:     'GPOverrideQuasars',
      galaxy:     'GPOverrideGalaxies',
      satellite:  'GPOverrideSatellites',
    };
    const categoryOverride = (info) => {
      if (!info) return false;
      if (info.category === 'luminary' || info.category === 'planet') {
        return !!s.GPOverridePlanets;
      }
      if (info.category === 'star' && info.subCategory) {
        // Celnav stars that are also constellation members (e.g.
        // Alnilam in Orion's belt) should track the constellation
        // override too — toggling Constellations on shouldn't leave
        // a hole where one of the belt stars has no GP because
        // it's data-origin-tagged 'celnav'.
        if (info.subCategory === 'celnav' && info.target
            && info.target.startsWith('star:')
            && CONSTELLATION_CELNAV_IDS.has(info.target.slice(5))
            && !!s.GPOverrideConstellations) {
          return true;
        }
        const k = OVERRIDE_BY_SUBCAT[info.subCategory];
        return !!(k && s[k]);
      }
      return false;
    };

    for (let i = 0; i < this._pool.length; i++) {
      const slot = this._pool[i];
      const line = this._lines[i];
      const radial = this._radialLines[i];
      const info = infos[i];
      const isFollow = info && followId && info.target === followId;
      const catOv = categoryOverride(info);
      const showThis = info
        && (baseShow
            || (heavenly && info._followOnly)
            || (heavenly && isFollow)
            || (heavenly && catOv));
      if (!showThis) {
        slot.group.visible = false;
        line.visible = false;
        if (radial) radial.visible = false;
        continue;
      }
      const key = info.target === 'sun'  ? 'sun'
               :  info.target === 'moon' ? 'moon'
               :  info.category;
      // `info.gpColor` (if present, set by the tracker
      // star-branch in `app.update()`) overrides the category
      // default so cel-nav and catalogued stars can use distinct
      // pigments matching their respective starfield layers.
      const color = (info.gpColor != null)
        ? info.gpColor
        : (TRACKED_GP_COLORS[key] || 0xffffff);
      const ge = s.WorldModel === 'ge';
      slot.dot.material.color.setHex(color);
      slot.updateAt(info.gpLat, info.gpLon, FE_RADIUS, true, ge);

      // Drop-line from the body's celestial position down to its
      // GP. FE: vertical fall from `info.vaultCoord` to the disc
      // plane (z = 0.0015). GE: radial fall from the body's spot
      // on the celestial sphere down to the globe-surface GP at
      // the same direction. The GE celestial sphere sits at
      // `c.GlobeVaultRadius` and the globe at `FE_RADIUS`, so the
      // surface point is just the celestial point scaled by
      // `FE_RADIUS / GlobeVaultRadius`.
      if (s.ShowTruePositions !== false) {
        line.material.color.setHex(color);
        if (ge) {
          const Rv = c.GlobeVaultRadius || (FE_RADIUS * 2);
          const phi = (info.gpLat || 0) * Math.PI / 180;
          const lam = (info.gpLon || 0) * Math.PI / 180;
          const cp = Math.cos(phi), sp = Math.sin(phi);
          const tx = Rv * cp * Math.cos(lam);
          const ty = Rv * cp * Math.sin(lam);
          const tz = Rv * sp;
          const k = FE_RADIUS / Rv;
          const bx = tx * k, by = ty * k, bz = tz * k;
          const pts = [tx, ty, tz, bx, by, bz];
          line.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
          line.visible = true;
        } else if (info.vaultCoord) {
          const top = info.vaultCoord;
          const pts = [top[0], top[1], top[2], top[0], top[1], 0.0015];
          line.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
          line.visible = true;
        } else {
          line.visible = false;
        }
      } else {
        line.visible = false;
      }

      // GE-only radial dashed line: GP → globe centre. Same colour
      // and visibility gate as the body→GP line above. The GP
      // surface point shares its direction with the body's
      // celestial-sphere coord, so we can scale the celestial coord
      // by `FE_RADIUS / GlobeVaultRadius` to get the GP and use
      // `[gp, origin]` as the segment.
      if (radial) {
        if (ge && s.ShowTruePositions !== false) {
          const Rv = c.GlobeVaultRadius || (FE_RADIUS * 2);
          const phi = (info.gpLat || 0) * Math.PI / 180;
          const lam = (info.gpLon || 0) * Math.PI / 180;
          const cp = Math.cos(phi), sp = Math.sin(phi);
          const tx = Rv * cp * Math.cos(lam);
          const ty = Rv * cp * Math.sin(lam);
          const tz = Rv * sp;
          const k = FE_RADIUS / Rv;
          const bx = tx * k, by = ty * k, bz = tz * k;
          radial.material.color.setHex(color);
          radial.geometry.setAttribute('position',
            new THREE.Float32BufferAttribute([bx, by, bz, 0, 0, 0], 3));
          radial.computeLineDistances();
          radial.visible = true;
        } else {
          radial.visible = false;
        }
      }
    }
  }
}

// Halo ring as a plain `THREE.Mesh` with `RingGeometry`. Bypasses
// the Sprite + CanvasTexture pipeline entirely — sprite-based ring
// outlines were collapsing invisible at small render sizes (and on
// at least one user setup, every variant failed to render at all).
// A solid ring mesh is unambiguous: it renders the same way every
// other Mesh in the scene does.
//
// Geometry: outer radius 1.0, inner 0.86 → 14% band width. Per
// slot, `mesh.scale = (R, R, 1)` so outer radius in world space
// equals `R` (the apparent↔true 3D distance) and the rendered
// circumference passes through the true marker. `lookAt(camera)`
// keeps the ring face-on to the camera.

// True / apparent position ghost markers. Pairs with
// `Refraction !== 'off'` and `ShowGeocentricPosition`. Three layers:
//   • cyan point cloud at every tracker target's UNREFRACTED
//     optical-vault coord (true / geocentric position),
//   • orange point cloud at the REFRACTED coord (apparent),
//   • per-slot orange ring mesh centred on the apparent point with
//     world radius equal to the apparent↔true distance, billboarded
//     to face the camera so the true marker sits exactly on the
//     circumference. As the body drops toward the horizon the
//     refraction lift grows and the ring expands; near zenith it
//     shrinks.
// Both dot clouds use `sizeAttenuation: false` and 3 px size — the
// same size the cel-nav star sprite renders — so the apparent ghost
// overlays the regular star sprite cleanly and the true ghost reads
// at the same scale rather than dwarfing the body. The halo uses a
// thin `RingGeometry` annulus (1.5 % stroke band) so the line stays
// readable at any distance without smearing into a fill.
export class GeocentricMarkers {
  constructor(max = 64) {
    this.group = new THREE.Group();
    this.group.name = 'geocentric-markers';
    this._max = max;
    this._truePos = new Float32Array(max * 3);
    this._appPos  = new Float32Array(max * 3);

    const trueGeom = new THREE.BufferGeometry();
    trueGeom.setAttribute('position', new THREE.BufferAttribute(this._truePos, 3));
    trueGeom.setDrawRange(0, 0);
    const trueMat = new THREE.PointsMaterial({
      color: 0x40e0d0, size: 3, sizeAttenuation: false,
      transparent: true, opacity: 1.0,
      depthTest: false, depthWrite: false,
    });
    this._truePoints = new THREE.Points(trueGeom, trueMat);
    this._truePoints.renderOrder = 60;
    this._truePoints.frustumCulled = false;
    this.group.add(this._truePoints);

    const appGeom = new THREE.BufferGeometry();
    appGeom.setAttribute('position', new THREE.BufferAttribute(this._appPos, 3));
    appGeom.setDrawRange(0, 0);
    const appMat = new THREE.PointsMaterial({
      color: 0xff8c00, size: 3, sizeAttenuation: false,
      transparent: true, opacity: 1.0,
      depthTest: false, depthWrite: false,
    });
    this._appPoints = new THREE.Points(appGeom, appMat);
    this._appPoints.renderOrder = 60;
    this._appPoints.frustumCulled = false;
    this.group.add(this._appPoints);

    // Shared ring geometry: outer radius 1.0, inner 0.7 — 30 % band
    // width — split into 64 segments. The wide band ensures the
    // ring stays a visibly thick annulus even when the per-slot
    // scale shrinks to small refractions; thinner bands collapsed
    // sub-pixel and the rasteriser dropped them.
    // Halo as `THREE.LineLoop` over a 32-vertex unit circle. WebGL
    // rasterises lines at 1 px regardless of mesh scale, so the
    // outline stays a thin always-visible ring at any per-slot
    // world radius.
    const SEG = 32;
    const ringPos = new Float32Array(SEG * 3);
    for (let i = 0; i < SEG; i++) {
      const t = (i / SEG) * Math.PI * 2;
      ringPos[i * 3]     = Math.cos(t);
      ringPos[i * 3 + 1] = Math.sin(t);
      ringPos[i * 3 + 2] = 0;
    }
    const ringGeom = new THREE.BufferGeometry();
    ringGeom.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
    this._halos = [];
    for (let i = 0; i < max; i++) {
      const m = new THREE.LineLoop(ringGeom, new THREE.LineBasicMaterial({
        color: 0xffffff,
        depthTest: false, depthWrite: false,
      }));
      m.frustumCulled = false;
      m.renderOrder = 250;
      m.visible = false;
      this._halos.push(m);
      this.group.add(m);
    }
  }

  update(model, camera) {
    const s = model.state;
    const c = model.computed;
    const on = s.Refraction && s.Refraction !== 'off'
      && !!s.ShowGeocentricPosition;
    if (!on) {
      this._truePoints.geometry.setDrawRange(0, 0);
      this._appPoints.geometry.setDrawRange(0, 0);
      for (const m of this._halos) m.visible = false;
      return;
    }
    const ge = s.WorldModel === 'ge';
    const infos = c.TrackerInfos || [];
    let n = 0;
    for (const info of infos) {
      if (Number.isFinite(info.elevation) && info.elevation < 0) continue;
      const coordTrue = ge
        ? (info.globeOpticalVaultCoordTrue || info.opticalVaultCoordTrue)
        : info.opticalVaultCoordTrue;
      const coordAppRaw = ge
        ? (info.globeOpticalVaultCoord || info.opticalVaultCoord)
        : info.opticalVaultCoord;
      if (!coordTrue || coordTrue[2] === -1000) continue;
      if (n >= this._max) break;
      this._truePos[n * 3]     = coordTrue[0];
      this._truePos[n * 3 + 1] = coordTrue[1];
      this._truePos[n * 3 + 2] = coordTrue[2];
      const ac = (coordAppRaw && coordAppRaw[2] !== -1000) ? coordAppRaw : coordTrue;
      this._appPos[n * 3]     = ac[0];
      this._appPos[n * 3 + 1] = ac[1];
      this._appPos[n * 3 + 2] = ac[2];
      const dx = ac[0] - coordTrue[0];
      const dy = ac[1] - coordTrue[1];
      const dz = ac[2] - coordTrue[2];
      const r  = Math.hypot(dx, dy, dz);
      const halo = this._halos[n];
      // Strict apparent↔true geometry: world radius = `r`. No floor
      // — the ring's circumference lands exactly on the true marker
      // at any zoom or camera distance.
      if (r > 1e-9) {
        halo.position.set(ac[0], ac[1], ac[2]);
        halo.scale.set(r, r, r);
        if (camera) halo.lookAt(camera.position);
        halo.visible = true;
      } else {
        halo.visible = false;
      }
      n++;
    }
    for (let i = n; i < this._halos.length; i++) this._halos[i].visible = false;
    this._truePoints.geometry.attributes.position.needsUpdate = true;
    this._truePoints.geometry.setDrawRange(0, n);
    this._appPoints.geometry.attributes.position.needsUpdate  = true;
    this._appPoints.geometry.setDrawRange(0, n);
  }
}

// Distance-compass pair markers + connector. Renders a yellow pin
// at `DistancePairFrom*` and `DistancePairTo*` plus a connecting
// line on the disc (FE / DP) or great-circle arc on the globe
// (GE). Visible whenever `DistanceCompassMode` is on OR when a
// completed pair sits in state — both cases are useful: live mode
// for picking, persistent state for re-reading the last pair.
export class DistanceCompassPair {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'distance-compass-pair';

    // Two pin points, single shared buffer (max 2 verts).
    this._pinPos = new Float32Array(2 * 3);
    const pinGeom = new THREE.BufferGeometry();
    pinGeom.setAttribute('position', new THREE.BufferAttribute(this._pinPos, 3));
    pinGeom.setDrawRange(0, 0);
    this._pins = new THREE.Points(pinGeom, new THREE.PointsMaterial({
      color: 0xffe040, size: 9, sizeAttenuation: false,
      depthTest: false, depthWrite: false,
    }));
    this._pins.renderOrder = 252;
    this._pins.frustumCulled = false;
    this.group.add(this._pins);

    // Connector line. Up to 64 segments to render a smooth
    // great-circle arc on the globe; FE / DP use just 2 endpoints.
    const SEG = 64;
    this._linePos = new Float32Array((SEG + 1) * 3);
    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', new THREE.BufferAttribute(this._linePos, 3));
    lineGeom.setDrawRange(0, 0);
    this._line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({
      color: 0xffe040,
      depthTest: false, depthWrite: false,
    }));
    this._line.renderOrder = 251;
    this._line.frustumCulled = false;
    this.group.add(this._line);
    this._SEG = SEG;

    // Radii P1 → centre and P2 → centre — the two sides of the
    // central angle. Centre = sphere origin (0, 0, 0) on GE,
    // N pole (also disc origin) on FE / DP. Drawn as a single
    // 4-vertex line buffer (P1-O-P2-O so the two radii share a
    // line strip without an extra geometry); the disconnected
    // segment between O and P2 lays back on top of itself so it
    // doesn't show as a stray line. Slightly dimmer than the
    // arc so the eye treats them as supporting geometry.
    this._radiiPos = new Float32Array(4 * 3);
    const radiiGeom = new THREE.BufferGeometry();
    radiiGeom.setAttribute('position', new THREE.BufferAttribute(this._radiiPos, 3));
    radiiGeom.setDrawRange(0, 0);
    this._radii = new THREE.LineSegments(radiiGeom, new THREE.LineDashedMaterial({
      color: 0xffe040, transparent: true, opacity: 0.65,
      dashSize: 0.020, gapSize: 0.012,
      depthTest: false, depthWrite: false,
    }));
    this._radii.renderOrder = 250;
    this._radii.frustumCulled = false;
    this.group.add(this._radii);
  }

  update(model) {
    const s = model.state;
    // Pair source: compass-pin pair takes priority when its
    // coords are set (live drawing during DistanceCompassMode).
    // Fall back to the View → Distance Calc panel's manual
    // (Lat 1 / Lon 1 / Lat 2 / Lon 2) entries so the central-
    // angle arc + pins also render when the calculator is the
    // input. Either pathway feeds the same renderer below.
    const hasCompass =
      Number.isFinite(s.DistancePairFromLat) || Number.isFinite(s.DistancePairToLat);
    let fromLat, fromLon, toLat, toLon;
    if (hasCompass) {
      fromLat = s.DistancePairFromLat;
      fromLon = s.DistancePairFromLon;
      toLat   = s.DistancePairToLat;
      toLon   = s.DistancePairToLon;
    } else {
      fromLat = s.DistCalcLat1;
      fromLon = s.DistCalcLon1;
      toLat   = s.DistCalcLat2;
      toLon   = s.DistCalcLon2;
    }
    const haveFrom = Number.isFinite(fromLat) && Number.isFinite(fromLon);
    const haveTo   = Number.isFinite(toLat)   && Number.isFinite(toLon);
    if (!haveFrom && !haveTo) {
      this._pins.geometry.setDrawRange(0, 0);
      this._line.geometry.setDrawRange(0, 0);
      return;
    }
    const ge = s.WorldModel === 'ge';
    const pts = [];
    if (haveFrom) pts.push([fromLat, fromLon]);
    if (haveTo)   pts.push([toLat,   toLon]);

    // Pin world positions.
    for (let i = 0; i < pts.length; i++) {
      const [lat, lon] = pts[i];
      let x, y, z;
      if (ge) {
        const phi = lat * Math.PI / 180;
        const lam = lon * Math.PI / 180;
        const cp = Math.cos(phi);
        const Rg = FE_RADIUS * 1.001;
        x = Rg * cp * Math.cos(lam);
        y = Rg * cp * Math.sin(lam);
        z = Rg * Math.sin(phi);
      } else {
        const [dx, dy] = canonicalLatLongToDisc(lat, lon, FE_RADIUS);
        x = dx; y = dy; z = 0.005;
      }
      this._pinPos[i * 3]     = x;
      this._pinPos[i * 3 + 1] = y;
      this._pinPos[i * 3 + 2] = z;
    }
    this._pins.geometry.attributes.position.needsUpdate = true;
    this._pins.geometry.setDrawRange(0, pts.length);

    // Connector line.
    if (haveFrom && haveTo) {
      const φ1 = fromLat * Math.PI / 180;
      const λ1 = fromLon * Math.PI / 180;
      const φ2 = toLat   * Math.PI / 180;
      const λ2 = toLon   * Math.PI / 180;
      const N = this._SEG;
      if (ge) {
        // Great-circle arc via slerp on unit vectors.
        const cp1 = Math.cos(φ1), cp2 = Math.cos(φ2);
        const a = [cp1 * Math.cos(λ1), cp1 * Math.sin(λ1), Math.sin(φ1)];
        const b = [cp2 * Math.cos(λ2), cp2 * Math.sin(λ2), Math.sin(φ2)];
        let dot = a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
        dot = Math.max(-1, Math.min(1, dot));
        const ω = Math.acos(dot);
        const sω = Math.sin(ω);
        const Rg = FE_RADIUS * 1.001;
        for (let i = 0; i <= N; i++) {
          const t = i / N;
          let p;
          if (sω < 1e-9) {
            p = a;
          } else {
            const c1 = Math.sin((1 - t) * ω) / sω;
            const c2 = Math.sin(t * ω) / sω;
            p = [c1 * a[0] + c2 * b[0], c1 * a[1] + c2 * b[1], c1 * a[2] + c2 * b[2]];
          }
          this._linePos[i * 3]     = Rg * p[0];
          this._linePos[i * 3 + 1] = Rg * p[1];
          this._linePos[i * 3 + 2] = Rg * p[2];
        }
      } else {
        // Disc projection: straight line between two
        // canonical-projected points. Each interior sample is
        // re-projected through `canonicalLatLongToDisc` so the line
        // follows the projection's curvature in DP.
        for (let i = 0; i <= N; i++) {
          const t = i / N;
          const lat = fromLat + t * (toLat - fromLat);
          // Longitude lerp wraps via shortest path.
          let dλ = toLon - fromLon;
          if (dλ > 180) dλ -= 360;
          if (dλ < -180) dλ += 360;
          const lon = fromLon + t * dλ;
          const [dx, dy] = canonicalLatLongToDisc(lat, lon, FE_RADIUS);
          this._linePos[i * 3]     = dx;
          this._linePos[i * 3 + 1] = dy;
          this._linePos[i * 3 + 2] = 0.004;
        }
      }
      this._line.geometry.attributes.position.needsUpdate = true;
      this._line.geometry.setDrawRange(0, N + 1);

      // Two radii at the centre — the two sides of the central
      // angle. Centre = (0, 0, 0): sphere origin on GE, disc
      // origin (= N pole) on FE / DP. Each radius is a single
      // line segment between the corresponding pin world
      // position and the origin. LineSegments expects vertex
      // pairs, so we lay (P1, O, P2, O) back-to-back.
      const p1x = this._pinPos[0], p1y = this._pinPos[1], p1z = this._pinPos[2];
      const p2x = this._pinPos[3], p2y = this._pinPos[4], p2z = this._pinPos[5];
      this._radiiPos[0]  = p1x;  this._radiiPos[1]  = p1y;  this._radiiPos[2]  = p1z;
      this._radiiPos[3]  = 0;    this._radiiPos[4]  = 0;    this._radiiPos[5]  = 0;
      this._radiiPos[6]  = p2x;  this._radiiPos[7]  = p2y;  this._radiiPos[8]  = p2z;
      this._radiiPos[9]  = 0;    this._radiiPos[10] = 0;    this._radiiPos[11] = 0;
      this._radii.geometry.attributes.position.needsUpdate = true;
      this._radii.geometry.setDrawRange(0, 4);
      // LineDashedMaterial needs `lineDistances` recomputed
      // whenever the geometry changes so the dash pattern paces
      // from the new endpoints.
      this._radii.computeLineDistances();
    } else {
      this._line.geometry.setDrawRange(0, 0);
      this._radii.geometry.setDrawRange(0, 0);
    }
  }
}

// Central-angle / inscribed-angle helper for GE mode.
//
// Per `c.TrackerInfos` entry, draws a great-circle arc on the
// globe surface from the observer's GP (`ObserverLat / Long`) to
// the body's GP (`info.gpLat / Long`). The arc length in radians
// equals the central angle obs↔GP. A short dashed tick pops out
// radially at the arc midpoint, marking the inscribed-angle
// vertex (= central / 2 from each endpoint by the inscribed-angle
// theorem). Both layers gate on `ShowCentralAngle` /
// `ShowInscribedAngle` and only run in GE mode.
export class CentralAngleArcs {
  constructor(max = 16) {
    this.group = new THREE.Group();
    this.group.name = 'central-angle-arcs';
    this._arcs = [];
    this._ticks = [];
    const ARC_PTS = 64;
    for (let i = 0; i < max; i++) {
      const ag = new THREE.BufferGeometry();
      ag.setAttribute('position',
        new THREE.BufferAttribute(new Float32Array((ARC_PTS + 1) * 3), 3));
      ag.setDrawRange(0, 0);
      const am = new THREE.LineBasicMaterial({
        color: 0xffe680, transparent: true, opacity: 0.85,
        depthTest: true, depthWrite: false,
      });
      const aline = new THREE.Line(ag, am);
      aline.frustumCulled = false;
      aline.renderOrder = 46;
      this._arcs.push({ line: aline, maxPts: ARC_PTS + 1 });
      this.group.add(aline);

      const tg = new THREE.BufferGeometry();
      tg.setAttribute('position',
        new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
      const tm = new THREE.LineDashedMaterial({
        color: 0xffe680, transparent: true, opacity: 0.95,
        dashSize: 0.014, gapSize: 0.010,
        depthTest: false, depthWrite: false,
      });
      const tline = new THREE.Line(tg, tm);
      tline.frustumCulled = false;
      tline.renderOrder = 47;
      this._ticks.push(tline);
      this.group.add(tline);
    }
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    const ge = s.WorldModel === 'ge';
    const showArc = !!s.ShowCentralAngle && !s.InsideVault;
    const showTick = !!s.ShowInscribedAngle && !s.InsideVault;
    this.group.visible = showArc || showTick;
    if (!this.group.visible) {
      for (const a of this._arcs) a.line.visible = false;
      for (const t of this._ticks) t.visible = false;
      return;
    }

    const oLat = (s.ObserverLat || 0) * Math.PI / 180;
    const oLon = (s.ObserverLong || 0) * Math.PI / 180;
    const cLat = Math.cos(oLat), sLat = Math.sin(oLat);
    const cLon = Math.cos(oLon), sLon = Math.sin(oLon);
    const Ohat = [cLat * cLon, cLat * sLon, sLat];
    const Rsurf = FE_RADIUS * 1.0006;
    const infos = c.TrackerInfos || [];

    // FE-mode disc projection of the observer's surface point so
    // the planar (circle) version of the central-angle arc has a
    // start point in the same coordinate frame as `info.gpLat /
    // gpLon` projected via `canonicalLatLongToDisc`.
    const observerDisc = canonicalLatLongToDisc(
      s.ObserverLat || 0, s.ObserverLong || 0, FE_RADIUS,
    );
    const FE_LIFT = 8e-4;

    for (let i = 0; i < this._arcs.length; i++) {
      const arc = this._arcs[i];
      const tick = this._ticks[i];
      const info = infos[i];
      if (!info
          || !Number.isFinite(info.gpLat)
          || !Number.isFinite(info.gpLon)) {
        arc.line.visible = false;
        tick.visible = false;
        continue;
      }
      const gLat = info.gpLat * Math.PI / 180;
      const gLon = info.gpLon * Math.PI / 180;
      const cgL = Math.cos(gLat), sgL = Math.sin(gLat);
      const cgO = Math.cos(gLon), sgO = Math.sin(gLon);
      const Ghat = [cgL * cgO, cgL * sgO, sgL];
      const dot = Ohat[0] * Ghat[0] + Ohat[1] * Ghat[1] + Ohat[2] * Ghat[2];
      const theta = Math.acos(Math.max(-1, Math.min(1, dot)));
      const sinTheta = Math.sin(theta);
      if (sinTheta < 1e-6) {
        arc.line.visible = false;
        tick.visible = false;
        continue;
      }
      const buf = arc.line.geometry.attributes.position.array;
      const N = arc.maxPts - 1;

      // Make the arc material flip depthTest based on mode — GE
      // arc gets occluded by the back of the globe; FE arc stays
      // flat on the disc and reads better with depthTest off so
      // it doesn't z-fight the projection.
      const wantDT = ge;
      const am = arc.line.material;
      if (am.depthTest !== wantDT) { am.depthTest = wantDT; am.needsUpdate = true; }

      if (ge) {
        // GE: slerp Ô → Ĝ on the surface at radius Rsurf.
        for (let k = 0; k <= N; k++) {
          const t = k / N;
          const k1 = Math.sin((1 - t) * theta) / sinTheta;
          const k2 = Math.sin(t * theta) / sinTheta;
          buf[k * 3]     = Rsurf * (k1 * Ohat[0] + k2 * Ghat[0]);
          buf[k * 3 + 1] = Rsurf * (k1 * Ohat[1] + k2 * Ghat[1]);
          buf[k * 3 + 2] = Rsurf * (k1 * Ohat[2] + k2 * Ghat[2]);
        }
      } else {
        // FE: the disc is the planar (circle) analogue of the
        // sphere; the central-angle arc collapses to the chord on
        // the disc between observer's AE-projected point and the
        // body's GP disc point. Sample as a straight segment so
        // longer central angles still look proportional.
        const gpDisc = canonicalLatLongToDisc(
          info.gpLat, info.gpLon, FE_RADIUS,
        );
        const ox = observerDisc[0], oy = observerDisc[1];
        const gx = gpDisc[0], gy = gpDisc[1];
        for (let k = 0; k <= N; k++) {
          const t = k / N;
          buf[k * 3]     = ox + (gx - ox) * t;
          buf[k * 3 + 1] = oy + (gy - oy) * t;
          buf[k * 3 + 2] = FE_LIFT;
        }
      }
      arc.line.geometry.attributes.position.needsUpdate = true;
      arc.line.geometry.setDrawRange(0, N + 1);
      arc.line.visible = showArc;

      // Inscribed-angle tick: perpendicular to the arc at its
      // midpoint, length scales with the central angle so a tiny
      // sweep gets a small tick and a half-globe sweep gets a
      // tall one.
      if (showTick) {
        const tickLen = FE_RADIUS * (0.05 + 0.10 * (theta / Math.PI));
        let baseX, baseY, baseZ, tipX, tipY, tipZ;
        if (ge) {
          // GE: radial outward at the great-circle midpoint M̂.
          const km = Math.sin(0.5 * theta) / sinTheta;
          const Mx = km * (Ohat[0] + Ghat[0]);
          const My = km * (Ohat[1] + Ghat[1]);
          const Mz = km * (Ohat[2] + Ghat[2]);
          const Mlen = Math.hypot(Mx, My, Mz) || 1;
          const mx = Mx / Mlen, my = My / Mlen, mz = Mz / Mlen;
          baseX = Rsurf * mx;
          baseY = Rsurf * my;
          baseZ = Rsurf * mz;
          tipX = baseX + mx * tickLen;
          tipY = baseY + my * tickLen;
          tipZ = baseZ + mz * tickLen;
        } else {
          // FE: midpoint of the disc-chord, tick straight up
          // (+z) — the disc is the "horizontal of the arc length"
          // and +z is perpendicular to it.
          const gpDisc = canonicalLatLongToDisc(
            info.gpLat, info.gpLon, FE_RADIUS,
          );
          baseX = (observerDisc[0] + gpDisc[0]) * 0.5;
          baseY = (observerDisc[1] + gpDisc[1]) * 0.5;
          baseZ = FE_LIFT;
          tipX = baseX;
          tipY = baseY;
          tipZ = baseZ + tickLen;
        }
        tick.geometry.setAttribute('position',
          new THREE.Float32BufferAttribute([
            baseX, baseY, baseZ, tipX, tipY, tipZ,
          ], 3));
        tick.computeLineDistances();
        tick.visible = true;
      } else {
        tick.visible = false;
      }
    }
  }
}

// --- Cel Nav starfield --------------------------------------------
//
// Replacement for the procedural / chart star layers when
// `StarfieldType === 'celnav'`. Unlike `Stars` (2000 random points), this
// renders the 58 real navigational stars from the Nautical Almanac; unlike
// `StarfieldChart` (texture with baked-in stars), each star is an
// individually-positioned selectable object — driving the Tracker HUD and
// letting future serials add click / hover interactions.
//
// Two layers, matching the pattern the existing Stars class uses:
//   • `domePoints`   — stars on the heavenly vault (seen from orbital view
//                      and also from inside the vault looking outward).
//   • `spherePoints` — stars projected onto the observer's optical vault,
//                      with sub-horizon stars parked below the disc so the
//                      clip plane hides them.
//
// Both layers consume `c.CelNavStars`, populated every frame in
// `FeModel.update()` via the sun/moon/planet projection pipeline. That
// guarantees these stars track sidereal time, observer lat/long, and
// Optical-vault shape exactly the way the ephemeris-driven bodies do.
//
// Star size is driven by the catalogue's `mag` so naked-eye-brightness
// cues carry through; Sirius (mag -1.46) sits at ~5 px, dimmest
// navigational stars (~mag 3) at ~1.5 px.
export class CelNavStars {
  constructor(clippingPlanes = []) {
    this.group = new THREE.Group();
    this.group.name = 'cel-nav-stars';

    const MAX_STARS = 64;   // 58 nav stars + headroom
    this._maxStars = MAX_STARS;
    this._domePositions   = new Float32Array(MAX_STARS * 3);
    this._domeSizes       = new Float32Array(MAX_STARS);
    this._spherePositions = new Float32Array(MAX_STARS * 3);
    this._sphereSizes     = new Float32Array(MAX_STARS);

    const domeGeom = new THREE.BufferGeometry();
    domeGeom.setAttribute('position', new THREE.BufferAttribute(this._domePositions, 3));
    domeGeom.setAttribute('size',     new THREE.BufferAttribute(this._domeSizes,     1));
    domeGeom.setDrawRange(0, 0);
    this.domePoints = new THREE.Points(
      domeGeom,
      new THREE.PointsMaterial({
        color: 0xffe8a0,
        size: 3, sizeAttenuation: false,
        transparent: true, opacity: 1,
        clippingPlanes,
      }),
    );
    this.domePoints.frustumCulled = false;
    this.group.add(this.domePoints);

    const sphGeom = new THREE.BufferGeometry();
    sphGeom.setAttribute('position', new THREE.BufferAttribute(this._spherePositions, 3));
    sphGeom.setAttribute('size',     new THREE.BufferAttribute(this._sphereSizes,     1));
    sphGeom.setDrawRange(0, 0);
    this.spherePoints = new THREE.Points(
      sphGeom,
      new THREE.PointsMaterial({
        color: 0xffe8a0,
        size: 2.5, sizeAttenuation: false,
        transparent: true, opacity: 1,
        depthTest: false, depthWrite: false,
        clippingPlanes,
      }),
    );
    this.spherePoints.renderOrder = 55;
    this.spherePoints.frustumCulled = false;
    this.group.add(this.spherePoints);
  }

  update(model) {
    const s = model.state;
    const c = model.computed;

    const active = (s.StarfieldType === 'celnav')
                && (c.CelNavStars != null)
                && (s.ShowCelNav !== false);
    // Same fade rules as Stars: dynamic fade by NightFactor unless the
    // disables `DynamicStars`, hard-gated on `ShowStars`. GE forces
    // dynamic fade so the daytime sky doesn't show stars on the globe.
    const dynamic = s.DynamicStars || s.WorldModel === 'ge';
    const nightAlpha = dynamic ? (c.NightFactor || 0) : 1.0;
    const visibilityGate = dynamic ? nightAlpha > 0.01 : true;
    const showStars = active && s.ShowStars && visibilityGate;

    // hide the heavenly-vault star dots in Optical mode so
    // cel-nav stars don't render twice (once on the dome through
    // the transparent cap, once on the cap surface projection). The
    // `CelestialMarker` class already gates its true-source dots on
    // `!InsideVault` for the same reason (see render/index.js ~321);
    // star classes were missing that gate.
    this.domePoints.visible   = showStars && (s.ShowTruePositions !== false) && !s.InsideVault;
    this.domePoints.material.opacity   = nightAlpha;
    this.spherePoints.visible = showStars && s.ShowOpticalVault;
    this.spherePoints.material.opacity = nightAlpha;

    if (!showStars) {
      this.domePoints.geometry.setDrawRange(0, 0);
      this.spherePoints.geometry.setDrawRange(0, 0);
      return;
    }

    const stars = c.CelNavStars;
    const n = Math.min(stars.length, this._maxStars);
    const dp = this._domePositions;
    const sp = this._spherePositions;
    // Tracker-as-source-of-truth: membership always required inside
    // an active category. STM narrows to FollowTarget only when on.
    const stm = !!s.SpecifiedTrackerMode;
    const targetArr = Array.isArray(s.TrackerTargets) ? s.TrackerTargets : [];
    const trackerSet = stm
      ? new Set(s.FollowTarget ? [s.FollowTarget] : [])
      : new Set(targetArr);
    if (!stm && s.FollowTarget) trackerSet.add(s.FollowTarget);
    const ge = s.WorldModel === 'ge';

    for (let i = 0; i < n; i++) {
      const star = stars[i];
      const isTracked = trackerSet.has(`star:${star.id}`);
      if (!isTracked) {
        dp[i * 3    ] = 0;
        dp[i * 3 + 1] = 0;
        dp[i * 3 + 2] = -1000;
        sp[i * 3    ] = 0;
        sp[i * 3 + 1] = 0;
        sp[i * 3 + 2] = -1000;
        continue;
      }
      // Heavenly vault position. GE mode reads the globe-sphere
      // projection (`globeVaultCoord`); FE reads the flat-dome AE
      // projection (`vaultCoord`).
      const dome = (ge && star.globeVaultCoord) ? star.globeVaultCoord : star.vaultCoord;
      dp[i * 3    ] = dome[0];
      dp[i * 3 + 1] = dome[1];
      dp[i * 3 + 2] = dome[2];
      // Optical vault. GE uses precomputed `globeOpticalVaultCoord`
      // (no horizon clip — sub-horizon stars project to the lower
      // half of the cap). FE parks below-horizon entries below the
      // disc so the clip plane hides them.
      if (ge && star.globeOpticalVaultCoord) {
        sp[i * 3    ] = star.globeOpticalVaultCoord[0];
        sp[i * 3 + 1] = star.globeOpticalVaultCoord[1];
        sp[i * 3 + 2] = star.globeOpticalVaultCoord[2];
      } else {
        const localGlobe = M.Trans(c.TransMatCelestToGlobe, star.celestCoord);
        if (localGlobe[0] <= 0) {
          sp[i * 3    ] = 0;
          sp[i * 3 + 1] = 0;
          sp[i * 3 + 2] = -1000;
        } else {
          sp[i * 3    ] = star.opticalVaultCoord[0];
          sp[i * 3 + 1] = star.opticalVaultCoord[1];
          sp[i * 3 + 2] = star.opticalVaultCoord[2];
        }
      }
    }

    this.domePoints.geometry.setDrawRange(0, n);
    this.domePoints.geometry.attributes.position.needsUpdate = true;
    this.spherePoints.geometry.setDrawRange(0, n);
    this.spherePoints.geometry.attributes.position.needsUpdate = true;
  }
}

// Generic catalogue renderer for exotic bodies (black holes, quasars).
// Reads `computed[sourceKey]` (populated by app.update() via projectStar)
// and paints two layers using the same dome + sphere pattern as
// CelNavStars. Not gated on StarfieldType — these always show when
// ShowStars is on; STM mode filters to TrackerTargets.
export class CatalogPointStars {
  constructor({
    sourceKey,
    idPrefix = 'star',
    color = 0xffffff,
    domeSize = 4,
    sphereSize = 3.5,
    maxCount = 64,
    clippingPlanes = [],
    // When true the layer paints only entries whose id is in
    // TrackerTargets (plus FollowTarget). Used by satellites so a
    // single "Show Satellites" master toggle doesn't dump all 12
    // birds into the sky at once.
    requireMembership = false,
    // Optional state key that gates the whole layer on/off. When the
    // matching boolean in `model.state` is false the layer renders
    // nothing regardless of other toggles — this is the Tracker
    // sub-menu's "Show <category>" checkbox.
    showKey = null,
    // When true, each entry's `.color` field drives a per-vertex
    // color attribute. Used by the union catalog so a quasar entry
    // paints cyan, a galaxy pink, etc., in the same layer.
    perVertexColors = false,
    // State field that holds the array of tracked target ids this
    // layer reads from. Defaults to the global `TrackerTargets`; the
    // Bright Star Catalog layer overrides with its own key so its
    // selections are isolated from the native sub-menus.
    trackerKey = 'TrackerTargets',
  } = {}) {
    this.sourceKey  = sourceKey;
    this.idPrefix   = idPrefix;
    this._maxStars  = maxCount;
    this._requireMembership = requireMembership;
    this._showKey   = showKey;
    this._perVertexColors = perVertexColors;
    this._trackerKey = trackerKey;

    this.group = new THREE.Group();
    this.group.name = `catalog-${sourceKey.toLowerCase()}`;

    this._domePositions   = new Float32Array(maxCount * 3);
    this._spherePositions = new Float32Array(maxCount * 3);
    if (perVertexColors) {
      this._domeColors   = new Float32Array(maxCount * 3);
      this._sphereColors = new Float32Array(maxCount * 3);
    }

    const domeGeom = new THREE.BufferGeometry();
    domeGeom.setAttribute('position', new THREE.BufferAttribute(this._domePositions, 3));
    if (perVertexColors) {
      domeGeom.setAttribute('color', new THREE.BufferAttribute(this._domeColors, 3));
    }
    domeGeom.setDrawRange(0, 0);
    this.domePoints = new THREE.Points(
      domeGeom,
      new THREE.PointsMaterial({
        color: perVertexColors ? 0xffffff : color,
        vertexColors: !!perVertexColors,
        size: domeSize, sizeAttenuation: false,
        transparent: true, opacity: 1,
        clippingPlanes,
      }),
    );
    this.domePoints.frustumCulled = false;
    this.group.add(this.domePoints);

    const sphGeom = new THREE.BufferGeometry();
    sphGeom.setAttribute('position', new THREE.BufferAttribute(this._spherePositions, 3));
    if (perVertexColors) {
      sphGeom.setAttribute('color', new THREE.BufferAttribute(this._sphereColors, 3));
    }
    sphGeom.setDrawRange(0, 0);
    this.spherePoints = new THREE.Points(
      sphGeom,
      new THREE.PointsMaterial({
        color: perVertexColors ? 0xffffff : color,
        vertexColors: !!perVertexColors,
        size: sphereSize, sizeAttenuation: false,
        transparent: true, opacity: 1,
        depthTest: false, depthWrite: false,
        clippingPlanes,
      }),
    );
    this.spherePoints.renderOrder = 55;
    this.spherePoints.frustumCulled = false;
    this.group.add(this.spherePoints);
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    const entries = c[this.sourceKey];

    const dynamic = s.DynamicStars || s.WorldModel === 'ge';
    const nightAlpha = dynamic ? (c.NightFactor || 0) : 1.0;
    const visibilityGate = dynamic ? nightAlpha > 0.01 : true;
    const categoryShown = !this._showKey || !!s[this._showKey];
    const showStars = !!entries && s.ShowStars && visibilityGate && categoryShown;

    this.domePoints.visible   = showStars && (s.ShowTruePositions !== false) && !s.InsideVault;
    this.domePoints.material.opacity   = nightAlpha;
    this.spherePoints.visible = showStars && s.ShowOpticalVault;
    this.spherePoints.material.opacity = nightAlpha;

    if (!showStars) {
      this.domePoints.geometry.setDrawRange(0, 0);
      this.spherePoints.geometry.setDrawRange(0, 0);
      return;
    }

    const n = Math.min(entries.length, this._maxStars);
    const dp = this._domePositions;
    const sp = this._spherePositions;
    // Tracker is the single source of truth: Show gates the category,
    // TrackerTargets membership decides entries. STM narrows the set
    // further — when on, only FollowTarget survives (focus mode).
    const stm = !!s.SpecifiedTrackerMode;
    const targetArr = Array.isArray(s[this._trackerKey]) ? s[this._trackerKey] : [];
    const trackerSet = stm
      ? new Set(s.FollowTarget ? [s.FollowTarget] : [])
      : new Set(targetArr);
    if (!stm && s.FollowTarget) trackerSet.add(s.FollowTarget);

    const dc = this._domeColors;
    const sc = this._sphereColors;
    const ge = s.WorldModel === 'ge';
    for (let i = 0; i < n; i++) {
      const star = entries[i];
      const isTracked = trackerSet.has(`${this.idPrefix}:${star.id}`);
      if (!isTracked) {
        dp[i * 3    ] = 0;
        dp[i * 3 + 1] = 0;
        dp[i * 3 + 2] = -1000;
        sp[i * 3    ] = 0;
        sp[i * 3 + 1] = 0;
        sp[i * 3 + 2] = -1000;
        continue;
      }
      const dome = (ge && star.globeVaultCoord) ? star.globeVaultCoord : star.vaultCoord;
      dp[i * 3    ] = dome[0];
      dp[i * 3 + 1] = dome[1];
      dp[i * 3 + 2] = dome[2];
      if (ge && star.globeOpticalVaultCoord) {
        // GE: no horizon clip; below-horizon entries land on the
        // lower half of the cap.
        sp[i * 3    ] = star.globeOpticalVaultCoord[0];
        sp[i * 3 + 1] = star.globeOpticalVaultCoord[1];
        sp[i * 3 + 2] = star.globeOpticalVaultCoord[2];
      } else {
        const localGlobe = M.Trans(c.TransMatCelestToGlobe, star.celestCoord);
        if (localGlobe[0] <= 0) {
          sp[i * 3    ] = 0;
          sp[i * 3 + 1] = 0;
          sp[i * 3 + 2] = -1000;
        } else {
          sp[i * 3    ] = star.opticalVaultCoord[0];
          sp[i * 3 + 1] = star.opticalVaultCoord[1];
          sp[i * 3 + 2] = star.opticalVaultCoord[2];
        }
      }
      if (this._perVertexColors && star.color != null) {
        const r = ((star.color >> 16) & 0xff) / 255;
        const g = ((star.color >>  8) & 0xff) / 255;
        const b = ( star.color        & 0xff) / 255;
        dc[i * 3] = r; dc[i * 3 + 1] = g; dc[i * 3 + 2] = b;
        sc[i * 3] = r; sc[i * 3 + 1] = g; sc[i * 3 + 2] = b;
      }
    }

    this.domePoints.geometry.setDrawRange(0, n);
    this.domePoints.geometry.attributes.position.needsUpdate = true;
    this.spherePoints.geometry.setDrawRange(0, n);
    this.spherePoints.geometry.attributes.position.needsUpdate = true;
    if (this._perVertexColors) {
      this.domePoints.geometry.attributes.color.needsUpdate = true;
      this.spherePoints.geometry.attributes.color.needsUpdate = true;
    }
  }
}

// Per-entry ground-point path overlay. `computed.GPPaths` is a flat
// map `{ key → { pts, color } }` built in app.update() from whichever
// GPPath<Category> flags are on. Lines get lazily created per id and
// hidden (drawRange 0) when their key disappears from the map.
export class GPPathOverlay {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'gp-path-overlay';
    this._lines = new Map();
  }

  _ensureLine(key, color) {
    let rec = this._lines.get(key);
    if (rec) {
      if (rec.color !== color) {
        rec.line.material.color.setHex(color);
        rec.color = color;
      }
      return rec;
    }
    const MAX_PTS = 64;
    const buf = new Float32Array(MAX_PTS * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(buf, 3));
    geo.setDrawRange(0, 0);
    const mat = new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0.6,
      depthTest: false, depthWrite: false,
    });
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    line.renderOrder = 41;
    this.group.add(line);
    rec = { line, buf, maxPts: MAX_PTS, color };
    this._lines.set(key, rec);
    return rec;
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    this.group.visible = !s.InsideVault;
    const paths = c.GPPaths || {};
    const seen = new Set();
    const ge = s.WorldModel === 'ge';
    // Slight outward lift in GE so the path line clears the
    // textured globe shader without z-fighting; FE keeps the
    // disc-plane lift it already used.
    const Rge = FE_RADIUS * 1.0008;
    for (const [key, entry] of Object.entries(paths)) {
      if (!entry) continue;
      const haveLatLon = Array.isArray(entry.latLon) && entry.latLon.length;
      const havePts    = Array.isArray(entry.pts)    && entry.pts.length;
      if (!havePts && !haveLatLon) continue;
      const rec = this._ensureLine(key, entry.color || 0xffffff);
      const len = ge && haveLatLon ? entry.latLon.length : entry.pts.length;
      const n = Math.min(len, rec.maxPts);
      for (let i = 0; i < n; i++) {
        if (ge && haveLatLon) {
          const [lat, lon] = entry.latLon[i];
          const phi = lat * Math.PI / 180;
          const lam = lon * Math.PI / 180;
          const cp = Math.cos(phi);
          rec.buf[i * 3    ] = Rge * cp * Math.cos(lam);
          rec.buf[i * 3 + 1] = Rge * cp * Math.sin(lam);
          rec.buf[i * 3 + 2] = Rge * Math.sin(phi);
        } else {
          rec.buf[i * 3    ] = entry.pts[i][0];
          rec.buf[i * 3 + 1] = entry.pts[i][1];
          rec.buf[i * 3 + 2] = 0.002;
        }
      }
      // GE lines need depthTest so the back half of the trace
      // gets occluded by the globe; FE lines stay always-visible
      // (no front/back ambiguity on the disc).
      const wantDT = ge;
      const m = rec.line.material;
      if (m.depthTest !== wantDT) { m.depthTest = wantDT; m.needsUpdate = true; }
      rec.line.geometry.setDrawRange(0, n);
      rec.line.geometry.attributes.position.needsUpdate = true;
      seen.add(key);
    }
    for (const [key, rec] of this._lines) {
      if (!seen.has(key)) rec.line.geometry.setDrawRange(0, 0);
    }
  }
}

const GP_TRACER_COLORS = {
  sun: 0xffc844, moon: 0xf4f4f4,
  mercury: 0xd0b090, venus: 0xfff0c8, mars: 0xd05040,
  jupiter: 0xffa060, saturn: 0xe4c888,
  uranus: 0xa8d8e0, neptune: 0x7fa6e8,
};

// External-data overlay: Stellarium-exported (RA, Dec) traces.
// Read from `js/data/stellariumTraces.js`. Per-body line built once
// at construction; visibility gates on `state.ShowStellariumOverlay`.
// The renderer projects each (RA, Dec) row through the same
// `canonicalLatLongToDisc` AE math the FE-model GP tracer uses, so
// the overlay sits in the same coordinate frame as the rest of the
// disc geometry.
export class StellariumTraceOverlay {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'stellarium-traces';
    this.group.visible = false;
    this._lines = [];
    for (const [body, rows] of Object.entries(STELLARIUM_TRACES || {})) {
      if (!Array.isArray(rows) || rows.length === 0) continue;
      const positions = [];
      let lastRa = null;
      for (const row of rows) {
        const ra = +row.ra;
        const dec = +row.dec;
        if (!Number.isFinite(ra) || !Number.isFinite(dec)) continue;
        // Pen-up across the 0/360 RA wrap so the polyline doesn't
        // stitch a chord across the disc when consecutive samples
        // sit on opposite sides of the prime meridian.
        if (lastRa != null && Math.abs(ra - lastRa) > 180) {
          positions.push(NaN, NaN, NaN);
        }
        const p = canonicalLatLongToDisc(dec, ra, FE_RADIUS);
        positions.push(p[0], p[1], 0.004);
        lastRa = ra;
      }
      if (positions.length === 0) continue;
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: GP_TRACER_COLORS[body] || 0xffffff,
        transparent: true, opacity: 0.85,
        depthTest: false, depthWrite: false,
      });
      const line = new THREE.Line(geom, mat);
      line.renderOrder = 44;
      line.frustumCulled = false;
      this._lines.push(line);
      this.group.add(line);
    }
  }

  update(model) {
    this.group.visible = !!model.state.ShowStellariumOverlay && !model.state.InsideVault;
  }
}

// Besselian-element shadow path overlay for the 2024-04-08 total
// solar eclipse. Renders the NASA-published central-line samples
// plus five nested magnitude bands (totality / 75 / 50 / 25 / 0%)
// — the same gradient the published flat-earth and globe maps
// show. Each frame the cached (lat, lon) data reprojects through
// `canonicalLatLongToDisc` (FE / DP) or the unit-sphere mapping
// (GE), so the same data drives every world model. Visibility is
// gated on `state.ShowBesselianEclipsePath` and `!InsideVault`
// (overlay only makes sense from heavenly / orbit view).
export class BesselianEclipsePath {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'besselian-eclipse-path';
    this.group.visible = false;

    // Central line samples: { t, lat, lon, l1, l2, ... }
    // Default samples = the hand-baked Apr 8 2024 path (high
    // accuracy, NASA central-line table). State-driven demos
    // override this by setting `state.EclipseShadowPath` —
    // `_rebuildFromPath` then swaps in the new samples + bands
    // and regrows the mesh buffers as needed.
    this._samples = besselian2024Apr08Path();
    this._bands = besselian2024Apr08Bands();
    this._activePathRef = null;     // identity check: detect path swaps
    this._bandMeshes = [];
    this._renderOrderBase = 220;
    this._buildBandMeshes();

    // Central line on top of the bands. Buffer grows on demand
    // when a state-driven path with more samples comes through.
    const centralBuf = new Float32Array(Math.max(2, this._samples.length + 1) * 3);
    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', new THREE.BufferAttribute(centralBuf, 3));
    lineGeom.setDrawRange(0, 0);
    this._lineBuf = centralBuf;
    this._line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({
      color: 0xff2030, transparent: true, opacity: 0.95,
      depthTest: false, depthWrite: false,
    }));
    this._line.renderOrder = this._renderOrderBase + this._bands.length;
    this._line.frustumCulled = false;
    this.group.add(this._line);

    // Greatest-eclipse marker (yellow point at smallest-|t|).
    this._markerBuf = new Float32Array(3);
    const mGeom = new THREE.BufferGeometry();
    mGeom.setAttribute('position', new THREE.BufferAttribute(this._markerBuf, 3));
    this._marker = new THREE.Points(mGeom, new THREE.PointsMaterial({
      color: 0xffe040, size: 9, sizeAttenuation: false,
      depthTest: false, depthWrite: false,
    }));
    this._marker.renderOrder = this._renderOrderBase + this._bands.length + 1;
    this._marker.frustumCulled = false;
    this.group.add(this._marker);
  }

  // (Re)build the triangle-strip meshes for the current set of
  // bands. Called from the constructor and again whenever a
  // state-driven path swap arrives so each band's geometry matches
  // its new (N − 1) quad count.
  _buildBandMeshes() {
    // Drop any existing meshes from the group + dispose buffers
    // before allocating new ones.
    for (const entry of this._bandMeshes) {
      this.group.remove(entry.mesh);
      entry.mesh.geometry.dispose();
      entry.mesh.material.dispose();
    }
    this._bandMeshes = [];
    let r = this._renderOrderBase;
    for (const band of this._bands) {
      const N = band.edgeNorth.length;
      const positions = new Float32Array(Math.max(6, (N - 1) * 6 * 3));
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setDrawRange(0, 0);
      const mat = new THREE.MeshBasicMaterial({
        color: band.color,
        transparent: true,
        opacity: band.opacity,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.renderOrder = r++;
      mesh.frustumCulled = false;
      this._bandMeshes.push({ mesh, band, positions });
      this.group.add(mesh);
    }
  }

  // Swap to a state-supplied (lat, lon, t) path, rebuild bands,
  // grow line buffer if needed.
  _rebuildFromPath(path) {
    if (!Array.isArray(path) || path.length < 2) return;
    this._samples = path;
    this._bands = eclipseShadowBandsFromPath(path);
    this._buildBandMeshes();
    const need = (path.length + 1) * 3;
    if (!this._lineBuf || this._lineBuf.length < need) {
      this._lineBuf = new Float32Array(need);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(this._lineBuf, 3));
      g.setDrawRange(0, 0);
      this._line.geometry.dispose();
      this._line.geometry = g;
    }
    // Restack renderOrder so line + marker stay above bands.
    this._line.renderOrder = this._renderOrderBase + this._bands.length;
    this._marker.renderOrder = this._renderOrderBase + this._bands.length + 1;
  }

  // Project a single (lat, lon) to scene coords for the active
  // world model. GE uses the unit-sphere mapping; FE / DP use
  // `canonicalLatLongToDisc` so AE / DP inherit the active
  // projection. Caller passes `radiusBoost`: the GE sphere lives
  // at FE_RADIUS, so the band mesh sits at FE_RADIUS · (1 + boost)
  // — boost ≈ 0.02 keeps the chord-plane midpoints outside the
  // globe even between widely-spaced samples (10° apart sags by
  // ~0.4 % of the radius).
  _project(lat, lon, ge, z, radiusBoost = 0.02) {
    if (ge) {
      const phi = lat * Math.PI / 180;
      const lam = lon * Math.PI / 180;
      const cp = Math.cos(phi);
      const Rg = FE_RADIUS * (1 + radiusBoost);
      return [Rg * cp * Math.cos(lam), Rg * cp * Math.sin(lam), Rg * Math.sin(phi)];
    }
    const p = canonicalLatLongToDisc(lat, lon, FE_RADIUS);
    return [p[0], p[1], z];
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    // Live-detected eclipse path takes the renderer through the
    // same state-driven code path the demos do — solid when the
    // simulator clock sits inside the ±2 h window around an
    // Espenak event during free play.
    const livePath = c && c.LiveEclipseShadowPath;
    const liveAnchor = c && c.LiveEclipseShadowAnchorDt;
    const liveHalfWindow = c && c.LiveEclipseShadowHalfWindowDays;
    const visible =
      (
        !!s.ShowBesselianEclipsePath
        || !!s.ShowEclipseShadowPath
        || !!livePath
      )
      && !s.InsideVault;
    this.group.visible = visible;
    if (!visible) return;

    // Pick the active path: explicit demo state wins, then the
    // live free-play detector, otherwise keep whatever was last
    // active (defaults to the hardcoded Apr 8 2024 NASA table).
    const activePath = Array.isArray(s.EclipseShadowPath) && s.EclipseShadowPath.length >= 2
      ? s.EclipseShadowPath
      : (Array.isArray(livePath) && livePath.length >= 2 ? livePath : null);
    if (activePath && activePath !== this._activePathRef) {
      this._activePathRef = activePath;
      this._rebuildFromPath(activePath);
    }
    if (!this._samples.length) return;

    const ge = s.WorldModel === 'ge';
    // Sweep progress source: explicit `BesselianEclipseProgress`
    // wins (used by the standalone Apr-08-2024 demo and any
    // future hand-driven sweep). Otherwise, when the
    // state-driven demos are active and they expose an anchor
    // DateTime + half-window, derive progress from the current
    // simulator clock so the path sweeps in lockstep with the
    // existing eclipse timeline. Falls back to 1 (full path) for
    // the static view.
    let progress;
    const anchor = Number.isFinite(s.EclipseShadowAnchorDt)
      ? s.EclipseShadowAnchorDt
      : (Number.isFinite(liveAnchor) ? liveAnchor : null);
    const halfW = Number.isFinite(s.EclipseShadowHalfWindowDays)
      ? s.EclipseShadowHalfWindowDays
      : (Number.isFinite(liveHalfWindow) ? liveHalfWindow : null);
    if (Number.isFinite(anchor) && Number.isFinite(halfW) && halfW > 0
        && Number.isFinite(s.DateTime)) {
      // Anchor-driven sweep: progress derives from the current
      // simulator clock so the shadow paints in lockstep with
      // the active eclipse moment (works for both demo intros
      // and the live-detected free-play case).
      const tFromAnchor = s.DateTime - anchor;
      progress = (tFromAnchor + halfW) / (2 * halfW);
    } else if (Number.isFinite(s.BesselianEclipseProgress)) {
      progress = s.BesselianEclipseProgress;
    } else {
      progress = 1;
    }
    progress = Math.max(0, Math.min(1, progress));

    // Per-band quad count active at this progress — at least
    // one quad while progress > 0 so the very first sliver of
    // shadow paints something rather than nothing.
    const N = this._samples.length;
    const quadProgress = Math.max(0, Math.min(N - 1, progress * (N - 1)));
    const fullQuads    = Math.floor(quadProgress);
    const partialFrac  = quadProgress - fullQuads;
    const lineSamples  = Math.max(progress > 0 ? 2 : 0, Math.ceil(quadProgress) + 1);

    // Magnitude bands — fill triangle strips by projecting each
    // edge-pair sample through the active projection. The last
    // partial quad is interpolated so the leading edge of the
    // shadow advances smoothly between samples.
    const lerp = (a, b, t) => a + (b - a) * t;
    const lerpEdge = (e0, e1, t) => ({
      lat: lerp(e0.lat, e1.lat, t),
      lon: lerp(e0.lon, e1.lon, t),
    });
    for (let b = 0; b < this._bandMeshes.length; b++) {
      const { mesh, band, positions } = this._bandMeshes[b];
      let p = 0;
      const z = 0.0011 + b * 0.00005;
      for (let i = 0; i < fullQuads; i++) {
        const nN0 = band.edgeNorth[i];
        const nS0 = band.edgeSouth[i];
        const nN1 = band.edgeNorth[i + 1];
        const nS1 = band.edgeSouth[i + 1];
        const aN0 = this._project(nN0.lat, nN0.lon, ge, z);
        const aS0 = this._project(nS0.lat, nS0.lon, ge, z);
        const aN1 = this._project(nN1.lat, nN1.lon, ge, z);
        const aS1 = this._project(nS1.lat, nS1.lon, ge, z);
        positions[p++] = aN0[0]; positions[p++] = aN0[1]; positions[p++] = aN0[2];
        positions[p++] = aS0[0]; positions[p++] = aS0[1]; positions[p++] = aS0[2];
        positions[p++] = aN1[0]; positions[p++] = aN1[1]; positions[p++] = aN1[2];
        positions[p++] = aS0[0]; positions[p++] = aS0[1]; positions[p++] = aS0[2];
        positions[p++] = aS1[0]; positions[p++] = aS1[1]; positions[p++] = aS1[2];
        positions[p++] = aN1[0]; positions[p++] = aN1[1]; positions[p++] = aN1[2];
      }
      // Partial trailing quad — only when progress isn't on a
      // sample boundary.
      if (partialFrac > 0 && fullQuads < band.edgeNorth.length - 1) {
        const i = fullQuads;
        const nN0 = band.edgeNorth[i];
        const nS0 = band.edgeSouth[i];
        const nN1 = lerpEdge(band.edgeNorth[i], band.edgeNorth[i + 1], partialFrac);
        const nS1 = lerpEdge(band.edgeSouth[i], band.edgeSouth[i + 1], partialFrac);
        const aN0 = this._project(nN0.lat, nN0.lon, ge, z);
        const aS0 = this._project(nS0.lat, nS0.lon, ge, z);
        const aN1 = this._project(nN1.lat, nN1.lon, ge, z);
        const aS1 = this._project(nS1.lat, nS1.lon, ge, z);
        positions[p++] = aN0[0]; positions[p++] = aN0[1]; positions[p++] = aN0[2];
        positions[p++] = aS0[0]; positions[p++] = aS0[1]; positions[p++] = aS0[2];
        positions[p++] = aN1[0]; positions[p++] = aN1[1]; positions[p++] = aN1[2];
        positions[p++] = aS0[0]; positions[p++] = aS0[1]; positions[p++] = aS0[2];
        positions[p++] = aS1[0]; positions[p++] = aS1[1]; positions[p++] = aS1[2];
        positions[p++] = aN1[0]; positions[p++] = aN1[1]; positions[p++] = aN1[2];
      }
      mesh.geometry.attributes.position.needsUpdate = true;
      mesh.geometry.setDrawRange(0, p / 3);
    }

    // Central line (drawn up to progress, with the trailing
    // partial sample interpolated so the head advances smoothly).
    const buf = this._lineBuf;
    let n = 0;
    const wholeSamples = Math.min(N, fullQuads + 1);
    for (let i = 0; i < wholeSamples; i++) {
      const sample = this._samples[i];
      const a = this._project(sample.lat, sample.lon, ge, 0.0025);
      buf[n * 3]     = a[0];
      buf[n * 3 + 1] = a[1];
      buf[n * 3 + 2] = a[2];
      n++;
    }
    if (partialFrac > 0 && fullQuads < N - 1) {
      const s0 = this._samples[fullQuads];
      const s1 = this._samples[fullQuads + 1];
      const lat = lerp(s0.lat, s1.lat, partialFrac);
      const lon = lerp(s0.lon, s1.lon, partialFrac);
      const a = this._project(lat, lon, ge, 0.0025);
      buf[n * 3]     = a[0];
      buf[n * 3 + 1] = a[1];
      buf[n * 3 + 2] = a[2];
      n++;
    }
    this._line.geometry.attributes.position.needsUpdate = true;
    this._line.geometry.setDrawRange(0, n);

    // Marker rides the leading edge of the shadow during the
    // sweep, then snaps to greatest eclipse once progress
    // reaches the matching sample.
    const headIdx = Math.min(N - 1, Math.floor(quadProgress));
    const headFrac = quadProgress - headIdx;
    const m0 = this._samples[headIdx];
    const m1 = this._samples[Math.min(N - 1, headIdx + 1)];
    const mLat = lerp(m0.lat, m1.lat, headFrac);
    const mLon = lerp(m0.lon, m1.lon, headFrac);
    const ma = this._project(mLat, mLon, ge, 0.003);
    this._markerBuf[0] = ma[0];
    this._markerBuf[1] = ma[1];
    this._markerBuf[2] = ma[2];
    this._marker.geometry.attributes.position.needsUpdate = true;
  }
}

const GP_TRACER_MAX_PTS = 8192;
const _wrapLon = (x) => ((x + 180) % 360 + 360) % 360 - 180;

export class GPTracer {
  constructor(clippingPlanes = []) {
    this.group = new THREE.Group();
    this.group.name = 'gp-tracer';

    // Disc lines live directly under group; their buffers store global FE
    // disc coords. Sky lines live under skyGroup, which is re-anchored to
    // the observer each frame, so their buffers store observer-local
    // optical-vault offsets.
    this.discGroup = new THREE.Group();
    this.skyGroup  = new THREE.Group();
    this.group.add(this.discGroup);
    this.group.add(this.skyGroup);

    this._clippingPlanes = clippingPlanes;
    this._lines = new Map();
    this._wasOn = false;
    this._lastTargetsKey = '';
    this._lastClearN = 0;
  }

  _ensureRec(key, color) {
    let rec = this._lines.get(key);
    if (rec) return rec;

    const makeLine = (parent, renderOrder, depthTest, clipPlanes) => {
      const buf = new Float32Array(GP_TRACER_MAX_PTS * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(buf, 3));
      geo.setDrawRange(0, 0);
      const mat = new THREE.LineBasicMaterial({
        color, transparent: true, opacity: 0.85,
        depthTest, depthWrite: false,
        clippingPlanes: clipPlanes,
      });
      const line = new THREE.Line(geo, mat);
      line.frustumCulled = false;
      line.renderOrder = renderOrder;
      parent.add(line);
      return { line, buf, n: 0, lastX: NaN, lastY: NaN, lastZ: NaN };
    };

    rec = {
      disc: makeLine(this.discGroup, 42, false, []),
      sky:  makeLine(this.skyGroup,  43, false, this._clippingPlanes),
    };
    this._lines.set(key, rec);
    return rec;
  }

  _resetSub(sub) {
    sub.n = 0;
    sub.lastX = NaN; sub.lastY = NaN; sub.lastZ = NaN;
    sub.line.geometry.setDrawRange(0, 0);
  }

  _resetRec(rec) {
    this._resetSub(rec.disc);
    this._resetSub(rec.sky);
  }

  _resetAll() {
    for (const rec of this._lines.values()) this._resetRec(rec);
  }

  _appendPoint(sub, x, y, z) {
    const dx = x - sub.lastX;
    const dy = y - sub.lastY;
    const dz = z - sub.lastZ;
    const moved = !(dx * dx + dy * dy + dz * dz < 1e-8);
    if (!moved && sub.n > 0) return;

    if (sub.n >= GP_TRACER_MAX_PTS) {
      const keep = Math.floor(GP_TRACER_MAX_PTS * 0.75);
      const drop = sub.n - keep;
      sub.buf.copyWithin(0, drop * 3, sub.n * 3);
      sub.n = keep;
    }
    sub.buf[sub.n * 3    ] = x;
    sub.buf[sub.n * 3 + 1] = y;
    sub.buf[sub.n * 3 + 2] = z;
    sub.n++;
    sub.lastX = x; sub.lastY = y; sub.lastZ = z;
    sub.line.geometry.setDrawRange(0, sub.n);
    sub.line.geometry.attributes.position.needsUpdate = true;
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    const traceGP      = !!s.ShowGPTracer;
    const traceOptical = !!s.ShowOpticalVaultTrace;
    const on = traceGP || traceOptical;
    this.group.visible = on;
    this.discGroup.visible = traceGP && !s.InsideVault;
    this.skyGroup.visible  = traceOptical && (s.ShowOpticalVault !== false);

    const skyClip = s.ShowTraceUnder ? [] : this._clippingPlanes;
    for (const rec of this._lines.values()) {
      if (rec.sky.line.material.clippingPlanes !== skyClip) {
        rec.sky.line.material.clippingPlanes = skyClip;
        rec.sky.line.material.needsUpdate = true;
      }
    }

    if (on && !this._wasOn) this._resetAll();
    this._wasOn = on;
    const clearN = s.ClearTraceCount | 0;
    if (clearN !== this._lastClearN) {
      this._resetAll();
      this._lastClearN = clearN;
    }
    if (!on) return;

    const trackerArr = Array.isArray(s.TrackerTargets) ? s.TrackerTargets : [];
    const targets    = [...new Set(trackerArr)];
    const key = targets.slice().sort().join(',');
    if (key !== this._lastTargetsKey) {
      const want = new Set(targets);
      for (const k of [...this._lines.keys()]) {
        if (!want.has(k)) this._resetRec(this._lines.get(k));
      }
    }
    this._lastTargetsKey = key;

    const ge = s.WorldModel === 'ge';
    const obs = ge
      ? (c.GlobeObserverCoord || [0, 0, 0])
      : (c.ObserverFeCoord    || [0, 0, 0]);
    this.skyGroup.position.set(obs[0], obs[1], obs[2]);

    // Earth-fixed (default): subtract GMST so the trace is the
    // body's GP on the rotating Earth. Celestial-frame trace skips
    // the subtraction, so over a year the planet traces its
    // apparent ecliptic motion (Mercury's 4 retrograde loops, etc.)
    // instead of 365 nested daily circles.
    const skyRot = (s.TraceCelestialFrame === true) ? 0 : (c.SkyRotAngle || 0);
    for (const name of targets) {
      let lat, lon, optical, color;
      if (name === 'sun') {
        lat = c.SunCelestLatLong.lat;
        lon = _wrapLon(c.SunRA * 180 / Math.PI - skyRot);
        optical = ge ? c.SunGlobeOpticalVaultCoord : c.SunOpticalVaultCoord;
        color = GP_TRACER_COLORS.sun;
      } else if (name === 'moon') {
        lat = c.MoonCelestLatLong.lat;
        lon = _wrapLon(c.MoonRA * 180 / Math.PI - skyRot);
        optical = ge ? c.MoonGlobeOpticalVaultCoord : c.MoonOpticalVaultCoord;
        color = GP_TRACER_COLORS.moon;
      } else if (c.Planets && c.Planets[name]) {
        const p = c.Planets[name];
        lat = p.celestLatLong.lat;
        lon = _wrapLon(p.ra * 180 / Math.PI - skyRot);
        optical = ge ? (p.globeOpticalVaultCoord || p.opticalVaultCoord) : p.opticalVaultCoord;
        color = GP_TRACER_COLORS[name] || 0xffffff;
      } else if (name.startsWith('star:')) {
        const starId = name.slice(5);
        let entry = null;
        let starColor = 0xffffff;
        if (c.CelNavStars && (entry = c.CelNavStars.find((x) => x.id === starId))) {
          starColor = 0xffe8a0;
        } else if (c.CataloguedStars && (entry = c.CataloguedStars.find((x) => x.id === starId))) {
          starColor = 0xffffff;
        } else if (c.BlackHoles && (entry = c.BlackHoles.find((x) => x.id === starId))) {
          starColor = 0x9966ff;
        } else if (c.Quasars && (entry = c.Quasars.find((x) => x.id === starId))) {
          starColor = 0x40e0d0;
        } else if (c.Galaxies && (entry = c.Galaxies.find((x) => x.id === starId))) {
          starColor = 0xff80c0;
        } else if (c.CelTheoStars && (entry = c.CelTheoStars.find((x) => x.id === starId))) {
          starColor = 0xff8c00;
        } else if (c.Satellites && (entry = c.Satellites.find((x) => x.id === starId))) {
          starColor = 0x66ff88;
        }
        if (!entry) continue;
        lat = entry.celestLatLong.lat;
        lon = _wrapLon(entry.ra * 180 / Math.PI - skyRot);
        optical = ge ? (entry.globeOpticalVaultCoord || entry.opticalVaultCoord) : entry.opticalVaultCoord;
        color = starColor;
      } else {
        continue;
      }
      const rec = this._ensureRec(name, color);

      // Disc / ground trace. FE projects via AE onto the disc; GE
      // projects onto the terrestrial sphere surface at the body's
      // GP `(lat, lon)` with a tiny outward lift to avoid z-fight.
      if (ge) {
        const phi = lat * Math.PI / 180;
        const lam = lon * Math.PI / 180;
        const cp = Math.cos(phi);
        const Rg = FE_RADIUS * 1.001;
        this._appendPoint(rec.disc, Rg * cp * Math.cos(lam), Rg * cp * Math.sin(lam), Rg * Math.sin(phi));
      } else {
        const [dx, dy] = canonicalLatLongToDisc(lat, lon, FE_RADIUS);
        this._appendPoint(rec.disc, dx, dy, 0.003);
      }

      if (optical) {
        const lx = optical[0] - obs[0];
        const ly = optical[1] - obs[1];
        const lz = optical[2] - obs[2];
        this._appendPoint(rec.sky, lx, ly, lz);
      }
    }
  }
}
