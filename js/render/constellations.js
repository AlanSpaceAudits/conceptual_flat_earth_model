// Constellation renderer. Draws the catalogued bright stars (larger,
// brighter points than the random starfield) and an optional stick-figure
// outline connecting them. Every star and every line is drawn twice: once
// on the heavenly vault (AE-projected at the starfield altitude) and once
// on the observer's optical vault hemisphere, with horizon culling so
// below-horizon pieces don't leak across.

import * as THREE from 'three';
import { M } from '../math/mat3.js';
import { latLongToCoord, vaultCoordToGlobalFeCoord } from '../core/transforms.js';
import { FE_RADIUS } from '../core/constants.js';
import { CONSTELLATIONS } from '../core/constellations.js';

export class Constellations {
  constructor(clippingPlanes = []) {
    this.group = new THREE.Group();
    this.group.name = 'constellations';

    // Flatten every star in every constellation into one array. Track the
    // (constellation, local index) so the line list can resolve to global
    // star indices.
    //
    // `_celnavDup[i]` is true when star i carries a `celnav` id,
    // meaning it's already plotted by the cel-nav starfield renderer
    // (which applies precession/nutation/aberration corrections). For
    // those stars we still store a position — lines use it as an
    // endpoint — but we skip writing a point into the star-point
    // buffers so the sprite doesn't paint on top of (slightly
    // displaced from) the cel-nav star and show up as a double.
    this._stars = [];       // [lat, lon]
    this._starVect = [];    // unit celestial direction
    this._lines = [];       // [globalIdxA, globalIdxB]
    this._celnavDup = [];   // bool per star
    // star-id per star for Specified Tracker Mode lookups.
    // Cel-nav duplicates use the `celnav` id so the tracker check
    // still matches when the tracks e.g. Betelgeuse; non-cel-nav
    // stars carry their own `id` field. Nullable (no id → never
    // visible in specified mode; in practice every tracked-eligible
    // star carries either a `celnav` or an `id`).
    this._starId = [];

    for (const con of CONSTELLATIONS) {
      const offset = this._stars.length;
      for (const s of con.stars) {
        this._stars.push([s.dec, s.ra]);
        this._starVect.push(latLongToCoord(s.dec, s.ra, 1));
        this._celnavDup.push(!!s.celnav);
        this._starId.push(s.celnav || s.id || null);
      }
      for (const [a, b] of con.lines) {
        this._lines.push([offset + a, offset + b]);
      }
    }
    this._nStars = this._stars.length;
    this._nLines = this._lines.length;

    // Dome (heavenly-vault) star points.
    this._domeStarPos = new Float32Array(this._nStars * 3);
    const domeStarGeom = new THREE.BufferGeometry();
    domeStarGeom.setAttribute('position', new THREE.BufferAttribute(this._domeStarPos, 3));
    this.domeStars = new THREE.Points(
      domeStarGeom,
      new THREE.PointsMaterial({
        // colour swap: constellations now render in the cel-
        // nav white `0xffffff`; the cel-nav layer took the warm-yellow
        // `0xffe8a0` that used to live here.
        color: 0xffffff, size: 4, sizeAttenuation: false,
        transparent: true, opacity: 1,
        clippingPlanes,
      }),
    );
    this.domeStars.renderOrder = 56;
    this.domeStars.frustumCulled = false;
    this.group.add(this.domeStars);

    // Optical-vault star points.
    this._sphStarPos = new Float32Array(this._nStars * 3);
    const sphStarGeom = new THREE.BufferGeometry();
    sphStarGeom.setAttribute('position', new THREE.BufferAttribute(this._sphStarPos, 3));
    // Below-horizon endpoints are parked at z=-1000 in the update()
    // loop; no clipping plane needed here, and leaving it out avoids
    // per-fragment clip artefacts on the optical-vault line segments.
    this.sphereStars = new THREE.Points(
      sphStarGeom,
      new THREE.PointsMaterial({
        color: 0xffffff, size: 3, sizeAttenuation: false,
        transparent: true, opacity: 1,
        depthTest: false, depthWrite: false,
      }),
    );
    this.sphereStars.renderOrder = 57;
    this.sphereStars.frustumCulled = false;
    this.group.add(this.sphereStars);

    // Dome outline LineSegments — 6 floats per segment.
    this._domeLinePos = new Float32Array(this._nLines * 6);
    const domeLineGeom = new THREE.BufferGeometry();
    domeLineGeom.setAttribute('position', new THREE.BufferAttribute(this._domeLinePos, 3));
    this.domeLines = new THREE.LineSegments(
      domeLineGeom,
      new THREE.LineBasicMaterial({
        color: 0x88ccff, transparent: true, opacity: 0.7,
        clippingPlanes,
      }),
    );
    this.domeLines.renderOrder = 55;
    this.domeLines.frustumCulled = false;
    this.group.add(this.domeLines);

    // Optical-vault outline LineSegments.
    this._sphLinePos = new Float32Array(this._nLines * 6);
    const sphLineGeom = new THREE.BufferGeometry();
    sphLineGeom.setAttribute('position', new THREE.BufferAttribute(this._sphLinePos, 3));
    this.sphereLines = new THREE.LineSegments(
      sphLineGeom,
      new THREE.LineBasicMaterial({
        color: 0x88ccff, transparent: true, opacity: 0.75,
        depthTest: false, depthWrite: false,
      }),
    );
    this.sphereLines.renderOrder = 56;
    this.sphereLines.frustumCulled = false;
    this.group.add(this.sphereLines);
  }

  update(model) {
    const s = model.state;
    const c = model.computed;
    // Constellation star dots follow the global Stars master so the
    // user doesn't need a separate per-category Show toggle to turn
    // them on. Lines (outlines) follow their own toggle, independent
    // of the dots — checking Outlines does not require the dots to be
    // on.
    const showStars = !!s.ShowStars;
    const showLines = !!s.ShowConstellationLines;

    // Honour the same DynamicStars / day-night fade the random starfield
    // uses so the constellations emerge smoothly at twilight instead of
    // popping on.
    const nightAlpha = s.DynamicStars ? c.NightFactor : 1.0;
    const canShow = s.DynamicStars ? nightAlpha > 0.01 : true;
    // heavenly-vault constellation dots hide in Optical so
    // the same star isn't painted both on the dome (visible through
    // the transparent cap) and on the cap surface projection.
    const showTrueVault = showStars && canShow && (s.ShowTruePositions !== false)
                        && !s.InsideVault;
    const showOptical   = showStars && canShow && s.ShowOpticalVault;

    // Specified Tracker Mode kills the constellation stick-
    // figure lines entirely (keeping them would connect tracked
    // stars through invisible endpoints and read as stray segments).
    // Per-star points are filtered below in the buffer loop.
    const stm = !!s.SpecifiedTrackerMode;
    const effShowLines = showLines && !stm;

    this.domeStars.visible   = showTrueVault;
    this.sphereStars.visible = showOptical;
    this.domeLines.visible   = effShowLines && (s.ShowTruePositions !== false);
    this.sphereLines.visible = effShowLines && s.ShowOpticalVault;

    this.domeStars.material.opacity   = nightAlpha;
    this.sphereStars.material.opacity = nightAlpha;
    this.domeLines.material.opacity   = nightAlpha * 0.75;
    this.sphereLines.material.opacity = nightAlpha * 0.85;

    // Bail only when there's nothing to draw at all — lines need the
    // per-star positions computed below even when the dot layer is off.
    if ((!showStars && !showLines) || !canShow) return;

    const opticalR = c.OpticalVaultRadius;
    // use the mode-dependent effective height so
    // constellation stars and their stick-figure lines project onto
    // the strict hemisphere in Optical (reported elevation = rendered
    // elevation) and onto the flattened cap in Heavenly.
    const opticalH = c.OpticalVaultHeightEffective;

    // Cache per-star projections for use by the line builder.
    const domePos = new Array(this._nStars);
    const sphPos  = new Array(this._nStars);
    const aboveHorizon = new Array(this._nStars);

    // Tracker-as-source-of-truth: constellation stars always filter
    // by TrackerTargets membership. When STM is on the effective set
    // is narrowed to just FollowTarget (focus mode) — same rule the
    // other renderers apply.
    const targetArr = Array.isArray(s.TrackerTargets) ? s.TrackerTargets : [];
    const trackerSet = stm
      ? new Set(s.FollowTarget ? [s.FollowTarget] : [])
      : new Set(targetArr);
    if (!stm && s.FollowTarget) trackerSet.add(s.FollowTarget);
    const ge = s.WorldModel === 'ge';
    const Rgv = c.GlobeVaultRadius || 0;
    const skyRotDeg = c.SkyRotAngle || 0;

    for (let i = 0; i < this._nStars; i++) {
      const [lat, lon] = this._stars[i];
      const vect = this._starVect[i];
      // cel-nav duplicates get their POINT sprite parked off
      // screen so the cel-nav renderer owns the visible star. Line
      // endpoints still use the computed positions below — the lines
      // are written into `domePos` / `sphPos` below regardless, and
      // the line-builder reads those, not the point buffer.
      const starId = this._starId[i];
      const untracked = !starId || !trackerSet.has(`star:${starId}`);
      const skipPoint = this._celnavDup[i] || untracked;

      // Heavenly-vault projection. GE places the star on the celestial
      // sphere at radius GlobeVaultRadius (longitude folded by
      // SkyRotAngle so the sphere co-rotates with Earth); FE keeps the
      // flat-disc AE projection.
      let gd;
      if (ge) {
        const phi = lat * Math.PI / 180;
        const lam = (lon - skyRotDeg) * Math.PI / 180;
        const cp = Math.cos(phi);
        gd = [Rgv * cp * Math.cos(lam), Rgv * cp * Math.sin(lam), Rgv * Math.sin(phi)];
      } else {
        const discR = FE_RADIUS * (90 - lat) / 180;
        const lo = lon * Math.PI / 180;
        const diskLocal = [discR * Math.cos(lo), discR * Math.sin(lo), s.StarfieldVaultHeight];
        gd = vaultCoordToGlobalFeCoord(diskLocal, c.TransMatVaultToFe);
      }
      domePos[i] = gd;
      if (skipPoint) {
        this._domeStarPos[i * 3]     = 0;
        this._domeStarPos[i * 3 + 1] = 0;
        this._domeStarPos[i * 3 + 2] = -1000;
      } else {
        this._domeStarPos[i * 3]     = gd[0];
        this._domeStarPos[i * 3 + 1] = gd[1];
        this._domeStarPos[i * 3 + 2] = gd[2];
      }

      // Optical vault. GE keeps sub-horizon stars on the lower half
      // of the cap (no clip); FE parks them below the disc so the
      // clip plane hides them.
      const localGlobe = M.Trans(c.TransMatCelestToGlobe, vect);
      if (ge && c.GlobeObserverFrame && c.GlobeObserverCoord) {
        aboveHorizon[i] = true;
        const f = c.GlobeObserverFrame;
        const obsG = c.GlobeObserverCoord;
        const ax = localGlobe[2], ay = localGlobe[1], az = localGlobe[0];
        const gs = [
          obsG[0] + opticalR * (ax * f.northX + ay * f.eastX + az * f.upX),
          obsG[1] + opticalR * (ax * f.northY + ay * f.eastY + az * f.upY),
          obsG[2] + opticalR * (ax * f.northZ + ay * f.eastZ + az * f.upZ),
        ];
        sphPos[i] = gs;
        if (skipPoint) {
          this._sphStarPos[i * 3]     = 0;
          this._sphStarPos[i * 3 + 1] = 0;
          this._sphStarPos[i * 3 + 2] = -1000;
        } else {
          this._sphStarPos[i * 3]     = gs[0];
          this._sphStarPos[i * 3 + 1] = gs[1];
          this._sphStarPos[i * 3 + 2] = gs[2];
        }
      } else if (localGlobe[0] <= 0) {
        aboveHorizon[i] = false;
        sphPos[i] = [0, 0, -1000];
        this._sphStarPos[i * 3]     = 0;
        this._sphStarPos[i * 3 + 1] = 0;
        this._sphStarPos[i * 3 + 2] = -1000;
      } else {
        aboveHorizon[i] = true;
        const feLocal = [-localGlobe[2] * opticalR, localGlobe[1] * opticalR, localGlobe[0] * opticalH];
        const gs = M.Trans(c.TransMatLocalFeToGlobalFe, feLocal);
        sphPos[i] = gs;
        if (skipPoint) {
          this._sphStarPos[i * 3]     = 0;
          this._sphStarPos[i * 3 + 1] = 0;
          this._sphStarPos[i * 3 + 2] = -1000;
        } else {
          this._sphStarPos[i * 3]     = gs[0];
          this._sphStarPos[i * 3 + 1] = gs[1];
          this._sphStarPos[i * 3 + 2] = gs[2];
        }
      }
    }
    this.domeStars.geometry.attributes.position.needsUpdate   = true;
    this.sphereStars.geometry.attributes.position.needsUpdate = true;

    if (showLines) {
      for (let k = 0; k < this._nLines; k++) {
        const [a, b] = this._lines[k];
        const o = k * 6;

        const da = domePos[a], db = domePos[b];
        this._domeLinePos[o]     = da[0];
        this._domeLinePos[o + 1] = da[1];
        this._domeLinePos[o + 2] = da[2];
        this._domeLinePos[o + 3] = db[0];
        this._domeLinePos[o + 4] = db[1];
        this._domeLinePos[o + 5] = db[2];

        // Hide optical-vault line segments where either endpoint is below
        // the observer's horizon — collapse to a single point so the
        // segment doesn't shoot off to the parked -1000 position.
        if (!aboveHorizon[a] || !aboveHorizon[b]) {
          for (let j = 0; j < 6; j++) this._sphLinePos[o + j] = 0;
          // park the segment below the clip plane
          this._sphLinePos[o + 2] = -1000;
          this._sphLinePos[o + 5] = -1000;
          continue;
        }
        const sa = sphPos[a], sb = sphPos[b];
        this._sphLinePos[o]     = sa[0];
        this._sphLinePos[o + 1] = sa[1];
        this._sphLinePos[o + 2] = sa[2];
        this._sphLinePos[o + 3] = sb[0];
        this._sphLinePos[o + 4] = sb[1];
        this._sphLinePos[o + 5] = sb[2];
      }
      this.domeLines.geometry.attributes.position.needsUpdate   = true;
      this.sphereLines.geometry.attributes.position.needsUpdate = true;
    }
  }
}
