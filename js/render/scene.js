// three.js scene / camera / renderer bootstrap for the FE model.
// World coordinates match the FE frame directly (z-up, x forward, y east).
// The camera's `up` vector is set to +z so all math stays in FE coords.

import * as THREE from 'three';
import { ToRad } from '../math/utils.js';

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

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
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

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
    this.onResize();
  }

  onResize() {
    const r = this.canvas.getBoundingClientRect();
    this.renderer.setSize(r.width, r.height, false);
    this.camera.aspect = r.width / Math.max(1, r.height);
    this.camera.updateProjectionMatrix();
  }

  updateCamera() {
    const s = this.model.state;
    const obs = this.model.computed.ObserverFeCoord;
    // S007 — expose the current camera aspect on model.computed so
    // worldObjects code can compute horizontal FOV (for placing the
    // right-side elevation scale at the correct angular offset)
    // without importing the camera directly. Updated every frame so
    // window resizes flow through.
    this.model.computed.ViewAspect = this.camera.aspect;

    // First-person mode: camera at observer's eye height, looking along the
    // ObserverHeading compass direction. CameraHeight is reused as look
    // pitch in this mode so the user can tilt up toward the zenith.
    if (s.InsideVault) {
      // S002 — Optical FOV reads the mode-local `OpticalZoom` scalar,
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
      // S007 — `ObserverElevation` lifts the camera (and only the
      // camera) above the disc. `ObserverFeCoord` is still at z = 0
      // so all downstream geometry (arrow, line, cardinals, labels)
      // keeps its ground-anchored math unchanged; the user just
      // looks down from a higher vantage.
      const eyeH = 0.012;
      const elev = Math.max(0, Math.min(0.5, s.ObserverElevation || 0));
      this.camera.position.set(obs[0], obs[1], obs[2] + eyeH + elev);

      // Local north (toward disc centre) for an observer at (ox, oy). At
      // the pole obsLen → 0 and the radial direction is undefined; use
      // ObserverLong to pick the meridian that "south" runs along, so the
      // observer can still pan a full 360° around the zenith. Convention:
      // facing south along longitude L means facing the global FE direction
      // (cos L, sin L) — i.e. north is (-cos L, -sin L) at the pole.
      const ox = obs[0], oy = obs[1];
      const obsLen = Math.hypot(ox, oy);
      let northX, northY;
      if (obsLen > 1e-6) {
        northX = -ox / obsLen;
        northY = -oy / obsLen;
      } else {
        const longR = ToRad(s.ObserverLong || 0);
        northX = -Math.cos(longR);
        northY = -Math.sin(longR);
      }
      // East is 90° clockwise from north viewed from above: (ny, -nx).
      const eastX  =  northY;
      const eastY  = -northX;
      const h = ToRad(s.ObserverHeading || 0);
      const fx = Math.cos(h) * northX + Math.sin(h) * eastX;
      const fy = Math.cos(h) * northY + Math.sin(h) * eastY;
      // First-person pitch: 0° = horizon, 90° = straight up at zenith.
      const pitch = ToRad(Math.max(0, Math.min(90, s.CameraHeight || 0)));
      const pd = 2;
      const tx = obs[0] + fx * Math.cos(pitch) * pd;
      const ty = obs[1] + fy * Math.cos(pitch) * pd;
      const tz = obs[2] + eyeH + Math.sin(pitch) * pd;
      this.camera.lookAt(tx, ty, tz);
      return;
    }

    if (this.camera.fov !== 35) {
      this.camera.fov = 35;
      this.camera.updateProjectionMatrix();
    }

    const dir = ToRad(s.CameraDirection);
    const hgt = ToRad(s.CameraHeight);
    const dist = s.CameraDistance / Math.max(0.1, s.Zoom);

    const x = dist * Math.cos(hgt) * Math.cos(dir);
    const y = dist * Math.cos(hgt) * Math.sin(dir);
    const z = dist * Math.sin(hgt);
    this.camera.position.set(x, y, z);

    const domeH = s.VaultHeight;
    const zoomParam = Math.max(0, Math.min(1, (s.Zoom - 1) / (10 - 1)));
    const tx = obs[0] + (0 - obs[0]) * zoomParam;
    const ty = obs[1] + (0 - obs[1]) * zoomParam;
    const tz = obs[2] + (domeH * 0.5 - obs[2]) * zoomParam;
    this.camera.lookAt(tx, ty, tz);
  }

  updateLight() {
    const s = this.model.computed.SunCelestCoord;
    this.sunLight.position.set(s[0] * 10, s[1] * 10, s[2] * 10);
    this.sunLight.target.position.set(0, 0, 0);
  }

  // S201 — eclipse-path observer darkening. Renderer pushes the
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
    // projected starfield has dark sky behind it. S201 — eclipse darken
    // pushes toward night colour regardless of NightFactor.
    // S226 — when `DarkBackground` is on the scene sits at the same
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
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
