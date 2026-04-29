// three.js scene / camera / renderer bootstrap for the FE model.
// World coordinates match the FE frame directly (z-up, x forward, y east).
// The camera's `up` vector is set to +z so all math stays in FE coords.

import * as THREE from 'three';
import { ToRad } from '../math/utils.js';
import { canonicalLatLongToDisc } from '../core/canonical.js';
import { FE_RADIUS } from '../core/constants.js';

// Resolve a tracker target id to its ground-point { lat, lon } in
// degrees using the same formulas `app.update()` applies to
// TrackerInfos. Returns null if the id can't be found in the current
// computed snapshot.
function resolveTargetGp(targetId, c) {
  if (!targetId) return null;
  const wrapLon = (x) => ((x + 180) % 360 + 360) % 360 - 180;
  if (targetId === 'sun' && c.SunCelestLatLong) {
    return {
      lat: c.SunCelestLatLong.lat,
      lon: wrapLon(c.SunRA * 180 / Math.PI - c.SkyRotAngle),
    };
  }
  if (targetId === 'moon' && c.MoonCelestLatLong) {
    return {
      lat: c.MoonCelestLatLong.lat,
      lon: wrapLon(c.MoonRA * 180 / Math.PI - c.SkyRotAngle),
    };
  }
  if (c.Planets && c.Planets[targetId]) {
    const p = c.Planets[targetId];
    return {
      lat: p.celestLatLong.lat,
      lon: wrapLon(p.ra * 180 / Math.PI - c.SkyRotAngle),
    };
  }
  if (targetId.startsWith('star:')) {
    const id = targetId.slice(5);
    for (const list of [
      c.CelNavStars, c.CataloguedStars, c.BlackHoles, c.Quasars, c.Galaxies,
      c.Satellites,
    ]) {
      if (!list) continue;
      const f = list.find((x) => x.id === id);
      if (f) {
        return {
          lat: f.celestLatLong.lat,
          lon: wrapLon(f.ra * 180 / Math.PI - c.SkyRotAngle),
        };
      }
    }
  }
  return null;
}

export class SceneManager {
  constructor(canvas, model) {
    this.canvas = canvas;
    this.model = model;

    this.scene = new THREE.Scene();
    // Day-time sky colour (used as background when not inside the vault and
    // during full daylight). At night while in first-person mode, the
    // background fades to `nightColor` so stars and planets have contrast.
    this.dayColor   = new THREE.Color(0xdcecfb);
    this.nightColor = new THREE.Color(0x040810);
    this.scene.background = this.dayColor.clone();

    this.camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.01, 1000);
    this.camera.up.set(0, 0, 1);

    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: false,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);

    // Clip everything below the disc (z = 0). Anything "below the horizon"
    // gets hidden automatically, so the inner celestial sphere and stars
    // don't bleed through the disc.
    this.renderer.localClippingEnabled = true;
    this.clipBelowDisc = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    this.ambient = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(this.ambient);
    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.world = new THREE.Group();
    this.scene.add(this.world);

    // Size pipeline: ResizeObserver delivers updates without
    // forcing layout flushes, but is asynchronous — the first
    // observation fires only after the next layout. To avoid a
    // 0×0 first-frame render, seed the renderer + camera
    // synchronously with a `getBoundingClientRect` read once on
    // construction; the RO then takes over for subsequent
    // resizes. Net forced-reflow cost: a single read at startup,
    // not one per `window.resize` event as before.
    this._applyCanvasSize = (w, h) => {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / Math.max(1, h);
      this.camera.updateProjectionMatrix();
    };
    {
      const r = this.canvas.getBoundingClientRect();
      this._applyCanvasSize(r.width, r.height);
    }
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver((entries) => {
        const cr = entries[0]?.contentRect;
        if (!cr) return;
        this._applyCanvasSize(cr.width, cr.height);
      });
      this._resizeObserver.observe(this.canvas);
    } else {
      // Pre-RO browsers: keep the resize-listener path, with
      // rAF-deferred reads so the bbox query runs in a layout-
      // clean phase rather than synchronously inside the event.
      let _resizeRaf = 0;
      const handle = () => {
        if (_resizeRaf) return;
        _resizeRaf = requestAnimationFrame(() => {
          _resizeRaf = 0;
          const r = this.canvas.getBoundingClientRect();
          this._applyCanvasSize(r.width, r.height);
        });
      };
      window.addEventListener('resize', handle);
    }
  }

  updateCamera() {
    const s = this.model.state;
    const c = this.model.computed;
    const ge = s.WorldModel === 'ge';
    const obs = ge ? (c.GlobeObserverCoord || c.ObserverFeCoord) : c.ObserverFeCoord;
    // ObserverAtCenter drops the camera to the world origin while
    // leaving `obs` (the optical-vault anchor) at the surface lat /
    // lon. Camera math uses `camObs`; vault placement still uses
    // `obs` everywhere else.
    const camObs = s.ObserverAtCenter ? [0, 0, 0] : obs;
    // Disc clip plane is FE-specific (cuts world z < 0 to hide
    // anything beneath the FE disc). GE has no flat ground plane, so
    // toggle clipping off — sub-horizon bodies, the lower half of
    // the optical cap, and the back side of the celestial sphere
    // all need to render.
    this.renderer.localClippingEnabled = !ge;
    // GE InsideVault sits the camera a hair above the sphere
    // surface. The horizon-dip angle from a camera at altitude h
    // above radius R is √(2h/R), so smaller h ⇒ smaller residual
    // gap between the cap rim and the visible sphere edge. Drop
    // the near-plane far below the eye-height so the sphere
    // continues to render at point-blank range.
    const nearTarget = (ge && s.InsideVault) ? 1e-7 : 0.01;
    if (Math.abs(this.camera.near - nearTarget) > 1e-9) {
      this.camera.near = nearTarget;
      this.camera.updateProjectionMatrix();
    }
    // expose the current camera aspect on model.computed so
    // worldObjects code can compute horizontal FOV (for placing the
    // right-side elevation scale at the correct angular offset)
    // without importing the camera directly. Updated every frame so
    // window resizes flow through.
    this.model.computed.ViewAspect = this.camera.aspect;

    // First-person mode: camera at observer's eye height, looking along the
    // ObserverHeading compass direction. CameraHeight is reused as look
    // pitch in this mode so the can tilt up toward the zenith.
    if (s.InsideVault && !s.FreeCameraMode) {
      // Optical FOV reads the mode-local `OpticalZoom` scalar,
      // NOT `Zoom`. Mode switches therefore don't leak: the Heavenly
      // orbit camera never sees OpticalZoom, and Optical never sees
      // the orbit Zoom. fov = 75° / OpticalZoom, clamped.
      const FOV_BASE = 75;
      const FOV_MIN  = 0.005;
      const zoom = Math.max(0.2, s.OpticalZoom || 5.09);
      const fov  = Math.max(FOV_MIN, Math.min(FOV_BASE, FOV_BASE / zoom));
      if (Math.abs(this.camera.fov - fov) > 1e-6) {
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
      }
      // Local north / east / up. In GE, take them from
      // GlobeObserverFrame (great-circle tangents + radial-outward up).
      // In FE, "up" is world +z and "north" points toward the disc
      // centre; at the pole the radial is undefined so fall back to
      // the meridian picked by ObserverLong.
      let northX, northY, northZ, eastX, eastY, eastZ, upX, upY, upZ;
      if (ge && c.GlobeObserverFrame) {
        const f = c.GlobeObserverFrame;
        northX = f.northX; northY = f.northY; northZ = f.northZ;
        eastX  = f.eastX;  eastY  = f.eastY;  eastZ  = f.eastZ;
        upX    = f.upX;    upY    = f.upY;    upZ    = f.upZ;
      } else if (s.WorldModel === 'dp') {
        // DP: heading is measured against the local meridian tangent
        // (compass-N for the observer in DP) — same axis the
        // sphere-model `AnglesGlobe.azimuth` lives in via the S681
        // TransMatLocalFeToGlobalFe, so trackers that set
        // `ObserverHeading = body_az` aim the camera at the body.
        // The heading line traces a diagonal across the disc
        // naturally because DP's meridians curve.
        const lat = s.ObserverLat || 0;
        const lon = s.ObserverLong || 0;
        const eps = 1e-3;
        const pHere = canonicalLatLongToDisc(lat, lon, 1);
        const latProbe = lat >= 90 - eps ? lat - eps : lat + eps;
        const sign = lat >= 90 - eps ? -1 : 1;
        const pN = canonicalLatLongToDisc(latProbe, lon, 1);
        let dnx = (pN[0] - pHere[0]) * sign;
        let dny = (pN[1] - pHere[1]) * sign;
        let nLen = Math.hypot(dnx, dny);
        if (nLen < 1e-9) {
          const longR = ToRad(lon);
          dnx = -Math.cos(longR);
          dny = -Math.sin(longR);
          nLen = 1;
        }
        northX = dnx / nLen;
        northY = dny / nLen;
        northZ = 0;
        eastX  =  northY;
        eastY  = -northX;
        eastZ  = 0;
        upX = 0; upY = 0; upZ = 1;
      } else {
        const ox = obs[0], oy = obs[1];
        const obsLen = Math.hypot(ox, oy);
        if (obsLen > 1e-6) {
          northX = -ox / obsLen;
          northY = -oy / obsLen;
        } else {
          const longR = ToRad(s.ObserverLong || 0);
          northX = -Math.cos(longR);
          northY = -Math.sin(longR);
        }
        northZ = 0;
        eastX  =  northY;
        eastY  = -northX;
        eastZ  = 0;
        upX = 0; upY = 0; upZ = 1;
      }

      // `ObserverElevation` lifts the camera along the local-up
      // direction. `eyeH` adds the standing-eye-height offset. In GE
      // the camera sits on the sphere surface (eyeH ≈ 1e-6) so the
      // horizon-dip √(2·eyeH/R) is below the visual threshold and
      // sky meets ground. `ObserverElevation` is a FE-disc concept
      // (lifts the camera off the disc), so it's ignored in GE.
      const eyeH = ge ? 1e-6 : 0.012;
      const elev = ge ? 0 : Math.max(0, Math.min(0.5, s.ObserverElevation || 0));
      const lift = eyeH + elev;
      this.camera.position.set(
        camObs[0] + lift * upX,
        camObs[1] + lift * upY,
        camObs[2] + lift * upZ,
      );

      const h = ToRad(s.ObserverHeading || 0);
      const fx = Math.cos(h) * northX + Math.sin(h) * eastX;
      const fy = Math.cos(h) * northY + Math.sin(h) * eastY;
      const fz = Math.cos(h) * northZ + Math.sin(h) * eastZ;
      // At the centre the fictitious observer has no horizon
      // obstruction — allow negative pitch so they can look down
      // and track southern-hemi bodies too.
      const pitchMin = s.ObserverAtCenter ? -89 : 0;
      const pitch = ToRad(Math.max(pitchMin, Math.min(90, s.CameraHeight || 0)));
      const cP = Math.cos(pitch), sP = Math.sin(pitch);
      const pd = 2;
      const tx = camObs[0] + eyeH * upX + (cP * fx + sP * upX) * pd;
      const ty = camObs[1] + eyeH * upY + (cP * fy + sP * upY) * pd;
      const tz = camObs[2] + eyeH * upZ + (cP * fz + sP * upZ) * pd;
      this.camera.up.set(upX, upY, upZ);
      this.camera.lookAt(tx, ty, tz);
      return;
    }

    if (this.camera.fov !== 35) {
      this.camera.fov = 35;
      this.camera.updateProjectionMatrix();
    }
    // Reset camera up for orbit mode so re-entry from InsideVault GE
    // (which set up to GlobeObserverFrame radial-outward) doesn't
    // leave the orbit view tilted.
    this.camera.up.set(0, 0, 1);

    const dir = ToRad(s.CameraDirection);
    const hgt = ToRad(s.CameraHeight);
    const dist = s.CameraDistance / Math.max(0.1, s.Zoom);

    // Free-cam: orbit the tracked body's ground point instead of the
    // disc origin. Same spherical offset (dir / hgt / dist), applied
    // around (gp_x, gp_y, 0), with the look-at pinned on the GP so the
    // body stays in screen centre. Falls back to the normal orbit math
    // if the target can't be resolved.
    if (s.FreeCamActive && s.FollowTarget && !s.FreeCameraMode) {
      const gp = resolveTargetGp(s.FollowTarget, this.model.computed);
      if (gp) {
        const gpXY = canonicalLatLongToDisc(gp.lat, gp.lon, FE_RADIUS);
        const cx = gpXY[0] + dist * Math.cos(hgt) * Math.cos(dir);
        const cy = gpXY[1] + dist * Math.cos(hgt) * Math.sin(dir);
        const cz = 0       + dist * Math.sin(hgt);
        this.camera.position.set(cx, cy, cz);
        this.camera.lookAt(gpXY[0], gpXY[1], 0);
        return;
      }
    }

    const x = dist * Math.cos(hgt) * Math.cos(dir);
    const y = dist * Math.cos(hgt) * Math.sin(dir);
    const z = dist * Math.sin(hgt);
    this.camera.position.set(x, y, z);

    if (s.FreeCameraMode) {
      // In InsideVault, orbit the observer so the optical-vault dome
      // stays in frame; in Heavenly, orbit the disc origin.
      if (s.InsideVault) {
        this.camera.position.set(camObs[0] + x, camObs[1] + y, camObs[2] + z);
        this.camera.lookAt(camObs[0], camObs[1], camObs[2]);
      } else {
        this.camera.lookAt(0, 0, 0);
      }
      return;
    }

    const domeH = s.VaultHeight;
    const zoomParam = Math.max(0, Math.min(1, (s.Zoom - 1) / (10 - 1)));
    const tx = camObs[0] + (0 - camObs[0]) * zoomParam;
    const ty = camObs[1] + (0 - camObs[1]) * zoomParam;
    const tz = camObs[2] + (domeH * 0.5 - camObs[2]) * zoomParam;
    this.camera.lookAt(tx, ty, tz);
  }

  updateLight() {
    const s = this.model.computed.SunCelestCoord;
    this.sunLight.position.set(s[0] * 10, s[1] * 10, s[2] * 10);
    this.sunLight.target.position.set(0, 0, 0);
  }

  // eclipse-path observer darkening. Renderer pushes the
  // computed factor (0 = unaffected, 1 = fully inside umbra) every
  // frame; `render()` folds it into ambient, sunLight, and the
  // background colour so the observer "loses the sun" visually when
  // they're inside the shadow path.
  setEclipseDarkFactor(f) {
    this._eclipseDarkFactor = Math.max(0, Math.min(1, f || 0));
  }

  render() {
    this.updateCamera();
    this.updateLight();
    const darken = this._eclipseDarkFactor || 0;
    // Fold the darken factor into ambient + sun intensities. Base
    // intensities (0.9 and 0.5) multiplied by (1 − 0.85·darken) so
    // the scene never goes pitch black — the sun's corona is still
    // dimly lit during totality.
    const dimAmbient = 0.9 * (1 - 0.85 * darken);
    const dimSun     = 0.5 * (1 - 0.90 * darken);
    if (Math.abs(this.ambient.intensity - dimAmbient) > 1e-4) {
      this.ambient.intensity = dimAmbient;
    }
    if (Math.abs(this.sunLight.intensity - dimSun) > 1e-4) {
      this.sunLight.intensity = dimSun;
    }
    // Inside-vault background fades to night based on NightFactor so the
    // projected starfield has dark sky behind it.: eclipse darken
    // pushes toward night colour regardless of NightFactor.
    // when `DarkBackground` is on the scene sits at the same
    // near-black `nightColor` the Optical vault uses at night,
    // regardless of view mode or NightFactor. Eclipse darken still
    // applies on top (lerping back toward day when the eclipse
    // fades out would look weird anyway, since the scene is already
    // dark).
    const forceDark = !!this.model.state.DarkBackground;
    if (forceDark) {
      this.scene.background.copy(this.nightColor);
    } else if (this.model.state.InsideVault) {
      const nf = Math.max(this.model.computed.NightFactor || 0, darken);
      this.scene.background.copy(this.dayColor).lerp(this.nightColor, nf);
    } else {
      // Heavenly vault mode — lerp background toward night during eclipse
      // darken so the shadow's effect is visible on scene lighting too.
      this.scene.background.copy(this.dayColor).lerp(this.nightColor, darken * 0.6);
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this._resizeObserver) this._resizeObserver.disconnect();
    this.renderer.dispose();
  }
}
