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
import {
  latLongToCoord, coordToLatLong, vaultCoordToGlobalFeCoord,
} from '../core/transforms.js';
// (vaultCoordToGlobalFeCoord is re-exported here for the Stars class below.)

const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

// Canvas-textured sprite used for in-scene text labels (N/E/S/W cardinals).
function makeTextSprite(text, color = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 44px sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 32, 32);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true, depthTest: false, depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.renderOrder = 65;
  return sprite;
}

// Upper hemisphere grid as line segments: parallels (latitude rings) plus
// meridians (longitude arcs from horizon to pole). No diagonal triangle
// edges — used for the optical-vault wireframe so it reads as a clean sky
// grid instead of a triangulated mesh.
function buildLatLongHemisphereGeom(radius = 1, latRings = 6, lonRays = 12, ringRes = 64) {
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
  // Meridians — half-arcs from horizon up to the pole.
  const arcRes = Math.max(8, Math.floor(ringRes / 2));
  for (let j = 0; j < lonRays; j++) {
    const az = (j / lonRays) * 2 * Math.PI;
    const cosAz = Math.cos(az), sinAz = Math.sin(az);
    for (let k = 0; k < arcRes; k++) {
      const p1 = (k / arcRes) * (Math.PI / 2);
      const p2 = ((k + 1) / arcRes) * (Math.PI / 2);
      positions.push(
        Math.sin(p1) * cosAz, Math.sin(p1) * sinAz, Math.cos(p1) * radius,
        Math.sin(p2) * cosAz, Math.sin(p2) * sinAz, Math.cos(p2) * radius,
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

// --- FE disc + grid --------------------------------------------------------

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
export class LatitudeLines {
  constructor(feRadius = FE_RADIUS) {
    this.group = new THREE.Group();
    this.group.name = 'latitude-lines';
    const circles = [
      { lat:  66.5636, color: 0x66ccff, label: 'Arctic Circle' },
      { lat:  23.4392, color: 0xffc844, label: 'Tropic of Cancer' },
      { lat:   0.0,    color: 0xff4040, label: 'Equator' },
      { lat: -23.4392, color: 0xffc844, label: 'Tropic of Capricorn' },
      { lat: -66.5636, color: 0x66ccff, label: 'Antarctic Circle' },
    ];
    for (const c of circles) {
      const pts = [];
      for (let k = 0; k <= 256; k++) {
        const lon = -180 + k * (360 / 256);
        const p = pointOnFE(c.lat, lon, feRadius);
        pts.push(p[0], p[1], 8e-4);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      // depthTest off + high renderOrder so the shadow / land can't wash
      // the colours out. LineBasicMaterial is limited to 1px line width in
      // most WebGL browsers, so saturating the colours and drawing on top
      // is the reliable way to make them read as "Equator / Tropic / Polar".
      const mat = new THREE.LineBasicMaterial({
        color: c.color,
        transparent: true, opacity: 1.0,
        depthTest: false, depthWrite: false,
      });
      const line = new THREE.Line(geo, mat);
      line.renderOrder = 30;
      line.name = c.label;
      this.group.add(line);
    }
  }
  update(model) {
    this.group.visible = !!model.state.ShowLatitudeLines;
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
    // Small flat disc lying on the ground. Secondary annotation rather than
    // a prominent 3D marker. depthTest: false + high renderOrder so it's
    // still visible under the shadow overlay when glanced at from above.
    this.dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.006, 20),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true, opacity: 0.85,
        depthTest: false, depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.dot.renderOrder = 40;
    this.group.add(this.dot);
  }
  updateAt(latDeg, lonDeg, feRadius = FE_RADIUS, visible = true) {
    this.group.visible = visible;
    if (!visible) return;
    const p = pointOnFE(latDeg, lonDeg, feRadius);
    this.dot.position.set(p[0], p[1], 1e-3);
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
varying vec2  vXY;
const float PI      = 3.14159265358979;
const float HALF_PI = 1.57079632679489;
const float RAD2DEG = 57.2957795;

void main() {
  float r = length(vXY);
  if (r > uDiscRadius) discard;

  float lat = HALF_PI - (r / uDiscRadius) * PI;
  float lon = atan(vXY.y, vXY.x);

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
      },
      vertexShader: SHADOW_VERT,
      fragmentShader: SHADOW_FRAG,
      transparent: true,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geom, this.material);
    this.mesh.position.z = 3e-4; // just above land + grid
    this.mesh.renderOrder = 5;   // after opaque land, before vault dots
    this.group.add(this.mesh);
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    this.group.visible = !!s.ShowShadow;
    if (!s.ShowShadow) return;
    const u = this.material.uniforms;
    u.uSunRA.value   = c.SunRA;
    u.uSunDec.value  = c.SunDec;
    u.uGMSTRad.value = c.SkyRotAngle * Math.PI / 180;
  }
}

export class DiscGrid {
  constructor(feRadius = FE_RADIUS) {
    this.group = new THREE.Group();
    this.group.name = 'disc-grid';

    const segs = [];
    // Lat circles every 15deg (lat from -90 to +75).
    for (let lat = -90 + 15; lat <= 75; lat += 15) {
      const ringPts = [];
      for (let k = 0; k <= 120; k++) {
        const lon = -180 + k * 3;
        const p = pointOnFE(lat, lon, feRadius);
        ringPts.push(p[0], p[1], 2e-4);
      }
      for (let k = 0; k < ringPts.length - 3; k += 3) {
        segs.push(ringPts[k], ringPts[k + 1], ringPts[k + 2],
                  ringPts[k + 3], ringPts[k + 4], ringPts[k + 5]);
      }
    }
    // Lon radii every 15deg.
    for (let lon = 0; lon < 360; lon += 15) {
      const a = pointOnFE(90, lon, feRadius);
      const b = pointOnFE(-90, lon, feRadius);
      segs.push(a[0], a[1], 2e-4, b[0], b[1], 2e-4);
    }
    this.lines = makeLineSegments(segs, 0x556677, { opacity: 0.4 });
    this.group.add(this.lines);
  }
  update(model) {
    this.group.visible = model.state.ShowFeGrid;
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
  }

  update(model) {
    const s = model.state;
    const domeRadius = s.VaultSize * FE_RADIUS;
    this.shell.scale.set(domeRadius, domeRadius, s.VaultHeight);
    this._rebuildGrid(s.VaultSize, s.VaultHeight);
    this.shell.visible = s.ShowVault !== false;
    this.grid.visible = s.ShowVaultGrid && (s.ShowVault !== false);
  }
}

// --- Inner celestial sphere (observer-local wireframe globe) ---------------

export class ObserversOpticalVault {
  constructor(clippingPlanes = []) {
    this.group = new THREE.Group();
    this.group.name = 'inner-sphere';

    // Upper hemisphere with pole rotated onto +z (scene is z-up).
    const meshGeom = new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    meshGeom.rotateX(Math.PI / 2);
    this.mesh = new THREE.Mesh(
      meshGeom,
      new THREE.MeshBasicMaterial({
        color: 0x4a4a4a, transparent: true, opacity: 0.1,
        side: THREE.BackSide, depthWrite: false,
        clippingPlanes,
      }),
    );
    this.group.add(this.mesh);

    // Latitude/longitude grid only — no triangle diagonals. WireframeGeometry
    // would emit every triangle edge (including diagonals across each quad);
    // we want a clean parallel-and-meridian grid instead, so build the line
    // segments directly.
    this.wire = new THREE.LineSegments(
      buildLatLongHemisphereGeom(1),
      new THREE.LineBasicMaterial({
        color: 0x555555, transparent: true, opacity: 0.5,
        clippingPlanes,
      }),
    );
    this.group.add(this.wire);

    // Axes to indicate local north/east/up.
    const axisLen = 1;
    const axes = [
      0, 0, 0, axisLen, 0, 0, // +x north (red)
      0, 0, 0, 0, axisLen, 0, // +y east (blue)
      0, 0, 0, 0, 0, axisLen, // +z up (green)
    ];
    const axisColors = [
      1, 0, 0, 1, 0, 0,
      0, 0, 1, 0, 0, 1,
      0, 0.6, 0, 0, 0.6, 0,
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
    const cardinalDefs = [
      { letter: 'N', pos: [-1.08,  0.00, 0.02], color: '#ff6868' },
      { letter: 'S', pos: [ 1.08,  0.00, 0.02], color: '#ff6868' },
      { letter: 'E', pos: [ 0.00,  1.08, 0.02], color: '#7fe39a' },
      { letter: 'W', pos: [ 0.00, -1.08, 0.02], color: '#7fe39a' },
    ];
    const SPRITE_SCALE = 0.18;
    for (const d of cardinalDefs) {
      const sp = makeTextSprite(d.letter, d.color);
      sp.position.set(d.pos[0], d.pos[1], d.pos[2]);
      sp.scale.set(SPRITE_SCALE, SPRITE_SCALE, SPRITE_SCALE);
      this.cardinalsGroup.add(sp);
    }
    this.group.add(this.cardinalsGroup);

    // Observer's facing arrow: a flat triangle lying near z=0, pointing along
    // -x in its local frame (toward N at heading 0). The headingGroup is
    // rotated about z by -heading so the arrow tracks ObserverHeading
    // clockwise (compass convention): 0 = N, 90 = E, 180 = S, 270 = W.
    this.headingGroup = new THREE.Group();
    this.headingGroup.name = 'heading-arrow';
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(-0.95, 0);
    arrowShape.lineTo(-0.55, 0.10);
    arrowShape.lineTo(-0.55, 0.04);
    arrowShape.lineTo(-0.10, 0.04);
    arrowShape.lineTo(-0.10, -0.04);
    arrowShape.lineTo(-0.55, -0.04);
    arrowShape.lineTo(-0.55, -0.10);
    arrowShape.lineTo(-0.95, 0);
    const arrowGeom = new THREE.ShapeGeometry(arrowShape);
    this.headingArrow = new THREE.Mesh(
      arrowGeom,
      new THREE.MeshBasicMaterial({
        color: 0xffd24a, transparent: true, opacity: 0.85,
        side: THREE.DoubleSide, depthTest: false, depthWrite: false,
      }),
    );
    this.headingArrow.renderOrder = 64;
    this.headingArrow.position.z = 0.012;
    this.headingGroup.add(this.headingArrow);
    this.group.add(this.headingGroup);
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    const r = c.OpticalVaultRadius;
    const h = c.OpticalVaultHeight;
    const obs = c.ObserverFeCoord;

    this.group.position.set(obs[0], obs[1], obs[2]);
    // Optical vault is a flattened cap: x/y by R, z by H (H < R).
    this.mesh.scale.set(r, r, h);
    this.wire.scale.set(r, r, h);
    this.axes.scale.set(r, r, h);
    // Cardinal labels and heading arrow live near z=0 on the rim, so they
    // only need the horizontal scale.
    this.cardinalsGroup.scale.set(r, r, r);
    this.headingGroup.scale.set(r, r, r);

    // Heading rotation about z. ObserverHeading is compass degrees
    // (0 = N at -x_local, 90 = E at +y_local, 180 = S at +x_local,
    // 270 = W at -y_local). Compass increments clockwise viewed from above,
    // which is a NEGATIVE rotation about +z, so rotate by -heading.
    this.headingGroup.rotation.set(0, 0, -ToRad(s.ObserverHeading || 0));
    this.headingGroup.visible = s.ShowFacingVector !== false;
    this.cardinalsGroup.visible = s.ShowFacingVector !== false;

    // Orient axes to the observer's local globe frame via its lat/long swap.
    // Axes x=north, y=east, z=up are already aligned in fe-local frame; we
    // rotate by the observer longitude about z to match global-fe frame.
    this.group.rotation.set(0, 0, ToRad(s.ObserverLong));

    this.group.visible = s.ShowOpticalVault;
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
    this.domeDot = new THREE.Mesh(
      new THREE.SphereGeometry(vaultSize, 20, 16),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true, opacity: 1.0,
        depthTest: false, depthWrite: false,
      }),
    );
    this.domeDot.renderOrder = 100;

    this.domeHalo = new THREE.Mesh(
      new THREE.SphereGeometry(vaultSize * haloScale, 20, 14),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true, opacity: 0.25,
        depthTest: false, depthWrite: false,
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

    // Head (both variants)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.005, 16, 12), skin);
    add(head, 0, 0, 0.035);

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
    }

    this._currentFigure = kind;
  }

  update(model) {
    const p = model.computed.ObserverFeCoord;
    this.group.position.set(p[0], p[1], p[2]);

    const kind = model.state.ObserverFigure || 'male';
    if (kind !== this._currentFigure) this._buildFigure(kind);
    // Keep the figure facing "outward" from disc centre so the observer's
    // body orientation feels stable as lat/long changes. We rotate about z
    // to point the figure's +x (forward) along the observer's radial direction.
    const ang = Math.atan2(p[1], p[0]);
    this.figureGroup.rotation.set(0, 0, ang);
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
        // Stars on the far side of the optical vault hemisphere were being
        // occluded by the wireframe lines (which write depth), so the cloud
        // looked like it only covered the camera-facing front. Disable depth
        // testing and render after the vault so points show on every side.
        depthTest: false, depthWrite: false,
        clippingPlanes,
      }),
    );
    this.spherePoints.renderOrder = 55;
    this.group.add(this.spherePoints);
  }

  update(model) {
    const s = model.state;
    const c = model.computed;

    // Starfield opacity. With DynamicStars on (default) the cloud fades
    // with the sun's elevation so it behaves like a real sky. With it off,
    // stars stay at full brightness regardless of day / night.
    const nightAlpha = s.DynamicStars ? c.NightFactor : 1.0;
    const visibilityGate = s.DynamicStars ? nightAlpha > 0.01 : true;
    const showStars = s.ShowStars && visibilityGate;
    this.domePoints.visible   = showStars;
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
    const opticalH = c.OpticalVaultHeight;

    for (let i = 0; i < this._celest.length; i++) {
      const [lat, lon] = this._celest[i];
      const celestV = this._celestVect[i];

      // --- Flat starfield disk ---------------------------------------
      // Stars sit at a single constant altitude (StarfieldVaultHeight),
      // projected across the disc via the same azimuthal-equidistant
      // formula the earth uses. Circumpolar (high-Dec) stars cluster at
      // the centre, equatorial stars form a mid-disc ring, and southern-
      // Dec stars fall near the rim. The whole disk spins about +z as the
      // sky rotates (TransMatVaultToFe handles that).
      const discR = FE_RADIUS * (90 - lat) / 180;
      const lo = lon * Math.PI / 180;
      const diskLocal = [discR * Math.cos(lo), discR * Math.sin(lo), s.StarfieldVaultHeight];
      const gd = vaultCoordToGlobalFeCoord(diskLocal, c.TransMatVaultToFe);
      domePos[i * 3]     = gd[0];
      domePos[i * 3 + 1] = gd[1];
      domePos[i * 3 + 2] = gd[2];

      // --- Inner-sphere projection -----------------------------------
      // celest unit dir -> observer's local-globe -> fe-local (axis swap)
      // -> global-fe (rotate by observer long, translate to observer).
      const localGlobe = M.Trans(c.TransMatCelestToGlobe, celestV);
      // Below-horizon stars (zenith component <= 0) get parked far below
      // the disc; the disc clip plane then hides them. This matches the
      // elevation gate the planet markers use in CelestialMarker.update.
      if (localGlobe[0] <= 0) {
        sphPos[i * 3]     = 0;
        sphPos[i * 3 + 1] = 0;
        sphPos[i * 3 + 2] = -1000;
        continue;
      }
      // Ellipsoidal optical vault: x/y scaled by horizontal radius
      // (opticalR), z by vertical height (opticalH). Same flattened cap
      // the sun / moon / planet markers project onto.
      // swap (x-zenith, y-east, z-north) -> (x-out, y-east, z-up): [-z, y, x]
      const feLocal = [-localGlobe[2] * opticalR, localGlobe[1] * opticalR, localGlobe[0] * opticalH];
      const gs = M.Trans(c.TransMatLocalFeToGlobalFe, feLocal);
      sphPos[i * 3]     = gs[0];
      sphPos[i * 3 + 1] = gs[1];
      sphPos[i * 3 + 2] = gs[2];
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
    const opticalH = c.OpticalVaultHeight;

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
      // Small "pole star" sphere — anchors the apparent rotation pattern
      // without a glowing halo around it.
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.006, 16, 12),
        new THREE.MeshBasicMaterial({
          color, transparent: true, opacity: 1,
          depthTest: false, depthWrite: false,
        }),
      );
      dot.renderOrder = 67;
      const crossGeo = new THREE.BufferGeometry();
      const s = 0.018;
      crossGeo.setAttribute('position', new THREE.Float32BufferAttribute([
        -s, 0, 0,  s, 0, 0,
         0, -s, 0, 0, s, 0,
         0, 0, -s, 0, 0, s,
      ], 3));
      const cross = new THREE.LineSegments(
        crossGeo,
        new THREE.LineBasicMaterial({
          color, transparent: true, opacity: 0.85,
          depthTest: false, depthWrite: false,
          clippingPlanes,
        }),
      );
      cross.renderOrder = 68;
      g.add(dot);
      g.add(cross);
      return { group: g, dot, cross };
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
    const opticalH = c.OpticalVaultHeight;

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

// Yggdrasil — Norse world-tree. A tapered trunk rising from a web of
// spreading roots, crowned by a cluster of leafy spheres that brush the
// underside of the dome. The roots fan out across the disc hinting at the
// three realms they reach in the myth.
export class Yggdrasil {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'yggdrasil';

    const trunkH = 0.65;
    const trunkMat = new THREE.MeshBasicMaterial({ color: 0x6b4423 });

    // Tapered trunk — wider at the base, narrower where the canopy sits.
    const trunkGeo = new THREE.CylinderGeometry(0.014, 0.028, trunkH, 20);
    trunkGeo.rotateX(Math.PI / 2);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.z = trunkH / 2;
    this.group.add(trunk);

    // Canopy — a cluster of leafy orbs at the top. One central orb plus six
    // satellite orbs at varying heights gives a fuller, asymmetric silhouette.
    const leaf = new THREE.MeshBasicMaterial({
      color: 0x3e8e41, transparent: true, opacity: 0.9,
    });
    const canopy = new THREE.Group();
    canopy.position.z = trunkH;
    canopy.add(new THREE.Mesh(new THREE.SphereGeometry(0.085, 22, 16), leaf));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), leaf);
      orb.position.set(Math.cos(a) * 0.07, Math.sin(a) * 0.07,
                       0.025 + (i % 2) * 0.025);
      canopy.add(orb);
    }
    // Highlight orb — slightly brighter to catch the eye at the crown.
    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x6ec77a, transparent: true, opacity: 0.95 }),
    );
    crown.position.z = 0.06;
    canopy.add(crown);
    this.group.add(canopy);

    // Roots — thick line segments radiating across the disc. Three long
    // "named" roots (Urðarbrunnr / Hvergelmir / Mímisbrunnr in myth) plus
    // smaller tendrils filling the space between.
    const rootPts = [];
    const big = 3;
    const total = 12;
    for (let i = 0; i < total; i++) {
      const a = (i / total) * Math.PI * 2;
      const len = (i % (total / big) === 0) ? 0.22 : 0.09;
      rootPts.push(0, 0, 0.003);
      rootPts.push(Math.cos(a) * len, Math.sin(a) * len, 0.003);
    }
    const rootGeo = new THREE.BufferGeometry();
    rootGeo.setAttribute('position', new THREE.Float32BufferAttribute(rootPts, 3));
    const roots = new THREE.LineSegments(
      rootGeo,
      new THREE.LineBasicMaterial({ color: 0x5a3a1c, transparent: true, opacity: 0.85 }),
    );
    this.group.add(roots);

    this.group.visible = false;
  }

  update(model) {
    const on = model.state.Cosmology === 'yggdrasil';
    this.group.visible = on;
    if (!on) return;
    // Scale vertically with the heavenly vault height so the crown always
    // just reaches the dome interior regardless of the VaultHeight slider.
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
