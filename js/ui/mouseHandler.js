import * as THREE from 'three';

// Pointer + wheel events -> FE model mutations.
//
// Orbit (default):
//   drag        -> CameraDirection / CameraHeight
//   ctrl + drag -> ObserverLat / ObserverLong
//   wheel       -> Zoom (multiplicative)
//
// First-person (InsideVault):
//   drag        -> ObserverHeading (yaw) / CameraHeight (pitch 0..90°)
//   ctrl + drag -> ObserverLat / ObserverLong
//   wheel       -> OpticalZoom (unit-stepped by active cadence)
//   click       -> snap heading/pitch to nearest celestial body;
//                  set FollowTarget so subsequent time-advances keep
//                  the camera trained on it. Drag clears FollowTarget.

const ROT_INCR = 200;
const FP_LOOK_INCR = 180;
const POS_INCR = 300;
const ZOOM_STEP   = 1.1;
const FP_ZOOM_MIN = 0.2;
const FP_ZOOM_MAX = 75;      // fov_min = 75/75 = 1°
const CLICK_DRAG_PX   = 4;    // pointer movement below this counts as click
const CLICK_EPS_DEG   = 0.01; // heading/pitch diff for follow setState skip
const HEAVENLY_HIT_PX = 40;   // screen-space hover radius in Heavenly / free-cam

function opticalCadenceStepDeg(fovDeg) {
  if (fovDeg >= 8) return 5;
  return 1;
}

function zoomFromFov(fovDeg) {
  return Math.max(FP_ZOOM_MIN, Math.min(FP_ZOOM_MAX, 75 / fovDeg));
}

function opticalWheelStep(currentZoom, dir) {
  const fov = Math.max(0.005, Math.min(75, 75 / currentZoom));
  const step = opticalCadenceStepDeg(fov);
  let nextFov = fov - dir * step;
  nextFov = Math.max(0.005, Math.min(75, nextFov));
  return zoomFromFov(nextFov);
}

function canvasToSkyAngles(canvas, offsetX, offsetY, state) {
  const w = canvas.clientWidth || 1;
  const h = canvas.clientHeight || 1;
  const xNdc = (offsetX / w) * 2 - 1;
  const yNdc = 1 - (offsetY / h) * 2;
  const zoom = Math.max(0.2, state.OpticalZoom || 1);
  const fovV = Math.max(0.005, Math.min(75, 75 / zoom));
  const aspect = w / h;
  const fovVRad = fovV * Math.PI / 180;
  const fovHRad = 2 * Math.atan(Math.tan(fovVRad / 2) * aspect);
  const kx = xNdc * Math.tan(fovHRad / 2);
  const ky = yNdc * Math.tan(fovVRad / 2);
  const pitchRad = (state.CameraHeight || 0) * Math.PI / 180;
  const headingDeg = state.ObserverHeading || 0;
  const cosP = Math.cos(pitchRad);
  const sinP = Math.sin(pitchRad);
  const c = cosP - ky * sinP;
  const vert = sinP + ky * cosP;
  const horizLen = Math.sqrt(c * c + kx * kx);
  const elDeg = Math.atan2(vert, horizLen) * 180 / Math.PI;
  let azDeg = headingDeg + Math.atan2(kx, c) * 180 / Math.PI;
  azDeg = ((azDeg % 360) + 360) % 360;
  return { az: azDeg, el: Math.max(-90, Math.min(90, elDeg)), fovV };
}

function angularDistance(az1, el1, az2, el2) {
  const a1 = az1 * Math.PI / 180;
  const e1 = el1 * Math.PI / 180;
  const a2 = az2 * Math.PI / 180;
  const e2 = el2 * Math.PI / 180;
  const cosA = Math.sin(e1) * Math.sin(e2)
             + Math.cos(e1) * Math.cos(e2) * Math.cos(a1 - a2);
  return Math.acos(Math.max(-1, Math.min(1, cosA))) * 180 / Math.PI;
}

function resolveTargetAngles(targetId, c) {
  if (!targetId) return null;
  if (targetId === 'sun')  return c.SunAnglesGlobe  || null;
  if (targetId === 'moon') return c.MoonAnglesGlobe || null;
  if (c.Planets && c.Planets[targetId]) return c.Planets[targetId].anglesGlobe || null;
  if (targetId.startsWith('star:')) {
    const id = targetId.slice(5);
    for (const list of [
      c.CelNavStars, c.CataloguedStars, c.BlackHoles, c.Quasars, c.Galaxies, c.CelTheoStars, c.Satellites,
    ]) {
      if (!list) continue;
      const found = list.find((x) => x.id === id);
      if (found) return found.anglesGlobe || null;
    }
  }
  return null;
}

// Mirrors the renderer's NightFactor gate (DynamicStars or GE forces
// dynamic fade): when stars are faded out by daytime, hover/click
// pickers skip them too.
function starsVisible(c, state) {
  if (!state.ShowStars) return false;
  const dynamic = state.DynamicStars || state.WorldModel === 'ge';
  if (!dynamic) return true;
  return (c.NightFactor || 0) > 0.01;
}

function collectClickables(c, state) {
  const out = [];
  if (c.SunAnglesGlobe)  out.push({ id: 'sun',  angles: c.SunAnglesGlobe });
  if (c.MoonAnglesGlobe) out.push({ id: 'moon', angles: c.MoonAnglesGlobe });
  if (state.ShowPlanets && c.Planets) {
    for (const [name, p] of Object.entries(c.Planets)) {
      if (p && p.anglesGlobe) out.push({ id: name, angles: p.anglesGlobe });
    }
  }
  if (starsVisible(c, state)) {
    for (const list of [
      c.CelNavStars, c.CataloguedStars, c.BlackHoles, c.Quasars, c.Galaxies, c.CelTheoStars,
    ]) {
      if (!list) continue;
      for (const s of list) {
        if (s.anglesGlobe) {
          out.push({ id: `star:${s.id}`, angles: s.anglesGlobe });
        }
      }
    }
  }
  return out;
}

// Pick nearest *visible* body to the click direction within a
// FOV-scaled angular threshold. Ignores below-horizon objects since
// they aren't drawn in Optical mode (nothing to click).
function findNearestCelestial(clickAz, clickEl, c, state, fovV) {
  const threshold = Math.max(1, Math.min(8, fovV / 10));
  const candidates = collectClickables(c, state);
  const followId = state.FollowTarget || null;
  let best = null, bestD = threshold;
  for (const opt of candidates) {
    if (!opt.angles || opt.angles.elevation < 0) continue;
    const d = angularDistance(clickAz, clickEl, opt.angles.azimuth, opt.angles.elevation);
    const dEff = (followId && opt.id === followId) ? d - 0.05 : d;
    if (dEff < bestD) { bestD = dEff; best = opt; }
  }
  return best;
}

const DISPLAY_NAMES = {
  sun: 'Sun', moon: 'Moon',
  mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter',
  saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
};

function displayNameFor(id, c) {
  if (DISPLAY_NAMES[id]) return DISPLAY_NAMES[id];
  if (id.startsWith('star:')) {
    const starId = id.slice(5);
    for (const list of [
      c.CelNavStars, c.CataloguedStars, c.BlackHoles, c.Quasars, c.Galaxies, c.CelTheoStars,
    ]) {
      if (!list) continue;
      const f = list.find((x) => x.id === starId);
      if (f && f.name) return f.name;
    }
    return starId;
  }
  return id;
}

// Candidates for Heavenly / free-cam hover testing. Each entry
// carries the tracker id, its 3D vault position (world coords), and
// its angles so the tooltip still shows az/el. STM hides anything not
// in the allow-set (TrackerTargets ∪ FollowTarget) to match the
// render-layer visibility rules.
// Each candidate carries up to two world-space hit-test coordinates:
// `domeCoord` (vault-of-heavens true-source position — only valid when
// ShowTruePositions is on) and `opticalCoord` (the observer's optical
// vault projection — only valid when ShowOpticalVault is on and the
// body is above the horizon). findNearestInHeavenly projects whichever
// is available and picks the closer screen-space match, so users can
// click either layer in Heavenly / free-cam mode.
function collectHeavenlyCandidates(c, state) {
  const stm = !!state.SpecifiedTrackerMode;
  const allow = stm
    ? new Set(Array.isArray(state.TrackerTargets) ? state.TrackerTargets : [])
    : null;
  if (stm && state.FollowTarget) allow.add(state.FollowTarget);
  const passes = (id) => !stm || allow.has(id);
  const domeOn    = state.ShowTruePositions !== false;
  const opticalOn = !!state.ShowOpticalVault;
  if (!domeOn && !opticalOn) return [];

  const pushBody = (out, id, domeCoord, opticalCoord, angles) => {
    if (!passes(id)) return;
    const above = angles && angles.elevation > 0;
    const dome = domeOn ? domeCoord : null;
    const optical = (opticalOn && above) ? opticalCoord : null;
    if (!dome && !optical) return;
    out.push({ id, domeCoord: dome, opticalCoord: optical, angles });
  };

  const out = [];
  if (c.SunVaultCoord) {
    pushBody(out, 'sun', c.SunVaultCoord, c.SunOpticalVaultCoord, c.SunAnglesGlobe);
  }
  if (c.MoonVaultCoord) {
    pushBody(out, 'moon', c.MoonVaultCoord, c.MoonOpticalVaultCoord, c.MoonAnglesGlobe);
  }
  if (state.ShowPlanets && c.Planets) {
    for (const [name, p] of Object.entries(c.Planets)) {
      if (!p || !p.vaultCoord) continue;
      pushBody(out, name, p.vaultCoord, p.opticalVaultCoord, p.anglesGlobe);
    }
  }
  if (starsVisible(c, state)) {
    for (const list of [
      c.CelNavStars, c.CataloguedStars, c.BlackHoles, c.Quasars, c.Galaxies, c.CelTheoStars, c.Satellites,
    ]) {
      if (!list) continue;
      for (const s of list) {
        const id = `star:${s.id}`;
        if (!s.vaultCoord) continue;
        pushBody(out, id, s.vaultCoord, s.opticalVaultCoord, s.anglesGlobe);
      }
    }
  }
  return out;
}

// Project a world-space point through the active Three.js camera and
// return the canvas-pixel coordinates. Returns null if the point is
// behind the near plane or off-NDC outside [-1.2, 1.2]. Forces a
// matrixWorldInverse refresh so hover keeps working even when the
// RAF render loop hasn't ticked yet.
function projectToCanvasPixels(coord, camera, canvas) {
  if (!camera) return null;
  const w = canvas.clientWidth || 1;
  const h = canvas.clientHeight || 1;
  camera.updateMatrixWorld();
  if (camera.matrixWorldInverse && camera.matrixWorldInverse.copy) {
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  }
  const x = coord[0], y = coord[1], z = coord[2];
  const m = camera.matrixWorldInverse.elements;
  const p = camera.projectionMatrix.elements;
  const vx = m[0]*x + m[4]*y + m[8]*z  + m[12];
  const vy = m[1]*x + m[5]*y + m[9]*z  + m[13];
  const vz = m[2]*x + m[6]*y + m[10]*z + m[14];
  const vw = m[3]*x + m[7]*y + m[11]*z + m[15];
  const cx = p[0]*vx + p[4]*vy + p[8]*vz  + p[12]*vw;
  const cy = p[1]*vx + p[5]*vy + p[9]*vz  + p[13]*vw;
  const cz = p[2]*vx + p[6]*vy + p[10]*vz + p[14]*vw;
  const cw = p[3]*vx + p[7]*vy + p[11]*vz + p[15]*vw;
  if (cw <= 0) return null;
  const ndcX = cx / cw, ndcY = cy / cw, ndcZ = cz / cw;
  if (ndcZ >= 1 || Math.abs(ndcX) > 1.2 || Math.abs(ndcY) > 1.2) return null;
  return { x: (ndcX + 1) * 0.5 * w, y: (1 - ndcY) * 0.5 * h };
}

function findNearestInHeavenly(mouseX, mouseY, canvas, c, state, camera) {
  const candidates = collectHeavenlyCandidates(c, state);
  // Prefer the followed target on tie/near-tie so coincident bodies
  // (e.g. sun + moon at new moon) hover-pick the body the user is
  // tracking, not whichever was first in the candidate list.
  const followId = state.FollowTarget || null;
  let best = null, bestD = HEAVENLY_HIT_PX;
  const test = (cand, pt) => {
    if (!pt) return;
    const d = Math.hypot(pt.x - mouseX, pt.y - mouseY);
    const isFollow = followId && cand.id === followId;
    const dEff = isFollow ? d - 0.5 : d;
    if (dEff < bestD) { bestD = dEff; best = { id: cand.id, angles: cand.angles }; }
  };
  for (const cand of candidates) {
    if (cand.domeCoord) test(cand, projectToCanvasPixels(cand.domeCoord, camera, canvas));
    if (cand.opticalCoord) test(cand, projectToCanvasPixels(cand.opticalCoord, camera, canvas));
  }
  return best;
}

function ensureHoverTooltip() {
  let el = document.getElementById('celestial-hover');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'celestial-hover';
  el.style.cssText = [
    'position: absolute',
    'pointer-events: none',
    'padding: 4px 8px',
    'font: 12px/1.3 ui-monospace, Menlo, monospace',
    'color: #f4f6fa',
    'background: rgba(10, 14, 22, 0.92)',
    'border: 1px solid rgba(244, 166, 64, 0.55)',
    'border-radius: 4px',
    'z-index: 40',
    'white-space: nowrap',
    'text-shadow: 0 0 2px rgba(0, 0, 0, 0.9)',
    'display: none',
  ].join(';');
  // Name line sits in accent orange; az/alt lines stack below.
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    #celestial-hover .celestial-hover-name { color: #f4a640; font-weight: 600; margin-bottom: 2px; }
    #celestial-hover div { line-height: 1.3; }
  `;
  document.head.appendChild(styleTag);
  const view = document.getElementById('view') || document.body;
  view.appendChild(el);
  return el;
}

export function attachMouseHandler(canvas, model, renderer = null) {
  let dragging = false;
  let lastX = 0, lastY = 0;
  let downX = 0, downY = 0;
  let dragDist = 0;
  const hoverTip = ensureHoverTooltip();

  // rAF-coalesced setState for pointer-move work. Touch / trackpad
  // pointermove events fire at 90–144 Hz on modern devices; each
  // setState triggers the full `app.update` pass which dominates
  // INP on mobile. Buffering the latest patch and flushing once
  // per `requestAnimationFrame` caps the rate at the display's
  // refresh and merges sequential patches under the same key
  // (last-write-wins). Behaviour is unchanged at the visible
  // frame boundary; only sub-frame work is dropped.
  let _pendingMovePatch = null;
  let _moveRafScheduled = false;
  const scheduleMovePatch = (patch) => {
    _pendingMovePatch = { ..._pendingMovePatch, ...patch };
    if (_moveRafScheduled) return;
    _moveRafScheduled = true;
    requestAnimationFrame(() => {
      _moveRafScheduled = false;
      if (_pendingMovePatch) {
        model.setState(_pendingMovePatch);
        _pendingMovePatch = null;
      }
    });
  };
  // Id of the celestial body currently under the cursor (whatever the
  // hover tooltip is showing). Used by the pointer-up click handler so
  // the selected target is exactly the one whose info box the user
  // was looking at, rather than recomputed from a slightly different
  // click position.
  let hoveredHit = null;
  const hideHover = () => {
    hoverTip.style.display = 'none';
    hoveredHit = null;
  };

  // Press-and-move on the orange origin / anchor dot drags the
  // observer's lat / lon under the cursor; a clean click (press +
  // release without crossing CLICK_DRAG_PX) toggles ObserverAtCenter.
  // pressedOnDot arms both gestures on pointerdown; dotDragging only
  // turns on once the cursor has moved past the click threshold.
  let pressedOnDot = false;
  let dotDragging = false;
  const _ray = new THREE.Raycaster();
  const _ndc = new THREE.Vector2();

  const cancelDotDrag = () => {
    pressedOnDot = false;
    dotDragging = false;
  };

  // Project a canvas pixel to a world hit on the disc plane (FE)
  // or globe sphere (GE), then convert to lat / lon.
  const cursorToLatLon = (offsetX, offsetY) => {
    if (!renderer || !renderer.sm || !renderer.sm.camera) return null;
    const cam = renderer.sm.camera;
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    _ndc.set((offsetX / w) * 2 - 1, -((offsetY / h) * 2 - 1));
    _ray.setFromCamera(_ndc, cam);
    const isGe = model.state.WorldModel === 'ge';
    const hit = new THREE.Vector3();
    if (isGe) {
      const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
      if (!_ray.ray.intersectSphere(sphere, hit)) return null;
      const r = Math.hypot(hit.x, hit.y, hit.z) || 1;
      const lat = Math.asin(Math.max(-1, Math.min(1, hit.z / r))) * 180 / Math.PI;
      const lon = Math.atan2(hit.y, hit.x) * 180 / Math.PI;
      return { lat, lon };
    }
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    if (!_ray.ray.intersectPlane(plane, hit)) return null;
    const r = Math.hypot(hit.x, hit.y);
    const lat = Math.max(-90, Math.min(90, 90 - 180 * r));
    const lon = Math.atan2(hit.y, hit.x) * 180 / Math.PI;
    return { lat, lon };
  };

  // True if the cursor is within hit radius of either the origin
  // or anchor dot.
  const overOrangeDot = (offsetX, offsetY) => {
    if (!model.state.ShowAxisLine) return false;
    if (!renderer || !renderer.sm || !renderer.sm.camera) return false;
    const cam = renderer.sm.camera;
    const ptOrigin = projectToCanvasPixels([0, 0, 0], cam, canvas);
    if (ptOrigin && Math.hypot(ptOrigin.x - offsetX, ptOrigin.y - offsetY) < 22) return true;
    if (renderer._lastDotWorld) {
      const ptLast = projectToCanvasPixels(renderer._lastDotWorld, cam, canvas);
      if (ptLast && Math.hypot(ptLast.x - offsetX, ptLast.y - offsetY) < 22) return true;
    }
    return false;
  };

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    lastX = e.offsetX; lastY = e.offsetY;
    downX = e.offsetX; downY = e.offsetY;
    dragDist = 0;
    // Arm the orange-dot gesture. Drag promotes to dotDragging on
    // first move past CLICK_DRAG_PX; a release without crossing the
    // threshold counts as a click and toggles ObserverAtCenter.
    if (overOrangeDot(e.offsetX, e.offsetY)) {
      pressedOnDot = true;
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    const wasClick = dragging && dragDist < CLICK_DRAG_PX;
    const wasDotDrag = dotDragging;
    const wasDotClick = pressedOnDot && wasClick;
    dragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
    cancelDotDrag();
    if (wasDotDrag) return;
    if (wasDotClick) {
      model.setState({
        ObserverAtCenter: !model.state.ObserverAtCenter,
        FollowTarget: null, FreeCamActive: false,
      });
      return;
    }
    if (!wasClick) return;
    // Prefer the hovered hit (the body whose tooltip is currently
    // shown) over a fresh nearest-search — the user clicked the info
    // box they could see, even if another body is slightly nearer
    // the click pixel.
    let best = hoveredHit;
    if (!best && model.state.InsideVault) {
      const click = canvasToSkyAngles(canvas, e.offsetX, e.offsetY, model.state);
      best = findNearestCelestial(
        click.az, click.el, model.computed, model.state, click.fovV,
      );
    }
    if (!best) return;
    if (model.state.InsideVault) {
      const targetHeading = ((best.angles.azimuth % 360) + 360) % 360;
      const targetPitch = Math.max(0, Math.min(89.9, best.angles.elevation));
      model.setState({
        FollowTarget: best.id,
        ObserverHeading: targetHeading,
        CameraHeight:    targetPitch,
      });
    } else {
      // Heavenly / free-cam click: lock on without touching Optical
      // pitch; scene.js recenters the orbit around the body's GP
      // because FreeCamActive is on. ObserverHeading still snaps to
      // the target's azimuth so the avatar figure faces it
      // immediately instead of waiting for the next update tick.
      const targetHeading = ((best.angles.azimuth % 360) + 360) % 360;
      model.setState({
        FollowTarget:    best.id,
        FreeCamActive:   true,
        ObserverHeading: targetHeading,
        CameraHeight:    80.3,
        CameraDistance:  10,
        Zoom:            4.67,
      });
    }
  });

  canvas.addEventListener('pointerleave', () => {
    hideHover();
    if (model.state.MouseElevation !== null
        || model.state.MouseAzimuth !== null) {
      model.setState({ MouseElevation: null, MouseAzimuth: null });
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;

    if (dragging) {
      dragDist = Math.max(dragDist, Math.hypot(e.offsetX - downX, e.offsetY - downY));
      // Promote an armed orange-dot press to drag mode the moment
      // motion crosses the click threshold.
      if (pressedOnDot && !dotDragging && dragDist > CLICK_DRAG_PX) {
        dotDragging = true;
      }
    }

    // Orange-dot drag — project the cursor onto the disc plane /
    // globe sphere and update the observer's lat / lon. Anchor dot
    // follows in real time via the existing renderer logic.
    if (dotDragging) {
      const ll = cursorToLatLon(e.offsetX, e.offsetY);
      if (ll) {
        scheduleMovePatch({ ObserverLat: ll.lat, ObserverLong: ll.lon });
      }
      return;
    }

    // Orange-dot hover tooltip ("Fictitious Teleport") — checked
    // before the mode-specific celestial-hover branches so it
    // wins regardless of Optical / Heavenly view.
    if (!dragging && model.state.ShowAxisLine
        && renderer && renderer.sm && renderer.sm.camera) {
      const cam = renderer.sm.camera;
      const ptOrigin = projectToCanvasPixels([0, 0, 0], cam, canvas);
      let near = ptOrigin && Math.hypot(ptOrigin.x - e.offsetX, ptOrigin.y - e.offsetY) < 22;
      if (!near && renderer._lastDotWorld) {
        const ptLast = projectToCanvasPixels(renderer._lastDotWorld, cam, canvas);
        near = ptLast && Math.hypot(ptLast.x - e.offsetX, ptLast.y - e.offsetY) < 22;
      }
      if (near) {
        hoverTip.innerHTML = `<div class="celestial-hover-name">Fictitious Teleport</div>`
          + `<div>Click to swap · hold + drag to move</div>`;
        hoverTip.style.left = `${e.offsetX + 14}px`;
        hoverTip.style.top  = `${e.offsetY + 14}px`;
        hoverTip.style.display = '';
        return;
      }
    }

    // Cursor elevation + azimuth readouts (Optical only).
    if (model.state.InsideVault) {
      const sky = canvasToSkyAngles(canvas, e.offsetX, e.offsetY, model.state);
      if (model.state.MouseElevation !== sky.el
          || model.state.MouseAzimuth !== sky.az) {
        scheduleMovePatch({ MouseElevation: sky.el, MouseAzimuth: sky.az });
      }
      // Hover tooltip: when cursor is within the click-hit threshold
      // of a celestial body, float its name + az/el next to the
      // cursor. Skip while dragging so the tooltip doesn't chase pans.
      if (!dragging) {
        const hit = findNearestCelestial(
          sky.az, sky.el, model.computed, model.state, sky.fovV,
        );
        if (hit) {
          hoveredHit = hit;
          const name = displayNameFor(hit.id, model.computed);
          const az = ((hit.angles.azimuth % 360) + 360) % 360;
          const el = hit.angles.elevation;
          hoverTip.innerHTML =
            `<div class="celestial-hover-name">${name}</div>`
            + `<div>Azi: ${az.toFixed(2)}°</div>`
            + `<div>Alt: ${(el >= 0 ? '+' : '') + el.toFixed(2)}°</div>`;
          hoverTip.style.left = `${e.offsetX + 14}px`;
          hoverTip.style.top  = `${e.offsetY + 14}px`;
          hoverTip.style.display = '';
        } else {
          hideHover();
        }
      } else {
        hideHover();
      }
    } else {
      // Heavenly / free-cam hover: use screen-space projection of each
      // body's world-space vault position, not pinhole az/el.
      if (model.state.MouseElevation !== null
          || model.state.MouseAzimuth !== null) {
        scheduleMovePatch({ MouseElevation: null, MouseAzimuth: null });
      }
      if (!dragging) {
        const camera = window.renderer?.sm?.camera || null;
        const hit = findNearestInHeavenly(
          e.offsetX, e.offsetY, canvas, model.computed, model.state, camera,
        );
        if (hit) {
          hoveredHit = hit;
          const name = displayNameFor(hit.id, model.computed);
          const az = ((hit.angles.azimuth % 360) + 360) % 360;
          const el = hit.angles.elevation;
          hoverTip.innerHTML =
            `<div class="celestial-hover-name">${name}</div>`
            + `<div>Azi: ${az.toFixed(2)}°</div>`
            + `<div>Alt: ${(el >= 0 ? '+' : '') + el.toFixed(2)}°</div>`;
          hoverTip.style.left = `${e.offsetX + 14}px`;
          hoverTip.style.top  = `${e.offsetY + 14}px`;
          hoverTip.style.display = '';
        } else {
          hideHover();
        }
      } else {
        hideHover();
      }
    }

    if (!dragging) return;
    // While an orange-dot press is armed (sub-threshold motion), keep
    // the cursor pinned so the camera doesn't pan a few pixels before
    // the gesture promotes to drag mode.
    if (pressedOnDot) {
      lastX = e.offsetX; lastY = e.offsetY;
      return;
    }
    const dx = e.offsetX - lastX;
    const dy = e.offsetY - lastY;
    lastX = e.offsetX; lastY = e.offsetY;

    if (e.ctrlKey || e.metaKey) {
      scheduleMovePatch({
        ObserverLat: model.state.ObserverLat - (dy / w) * POS_INCR,
        ObserverLong: model.state.ObserverLong + (dx / h) * POS_INCR,
        Description: '',
      });
      return;
    }

    // Drag / zoom no longer clears tracking — users can pan and zoom
    // freely while a body is locked. End tracking explicitly via the
    // End Tracking button, Escape, or a cardinal quick-button.

    if (model.state.InsideVault && !model.state.FreeCameraMode) {
      // Drag right: heading+. Drag up: pitch+. Pitch clamped 0..90°.
      const heading = model.state.ObserverHeading || 0;
      const pitch   = model.state.CameraHeight || 0;
      scheduleMovePatch({
        ObserverHeading: ((heading + (dx / w) * FP_LOOK_INCR) % 360 + 360) % 360,
        CameraHeight: Math.max(0, Math.min(90,
          pitch - (dy / h) * FP_LOOK_INCR)),
      });
      return;
    }

    // GE mode lets the orbit camera dip below the horizon plane so
    // the underside of the globe is reachable; FE keeps its 0°
    // floor since the disc has no underside to inspect.
    const minPitch = model.state.WorldModel === 'ge' ? -89.9 : 0;
    scheduleMovePatch({
      CameraDirection: model.state.CameraDirection - (dx / w) * ROT_INCR,
      CameraHeight: Math.max(minPitch, Math.min(89.9,
        model.state.CameraHeight + (dy / h) * ROT_INCR)),
    });
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const inVault = !!model.state.InsideVault;
    if (inVault && !model.state.FreeCameraMode) {
      const cur = model.state.OpticalZoom || 5.09;
      const dir = e.deltaY > 0 ? -1 : 1;
      model.setState({ OpticalZoom: opticalWheelStep(cur, dir) });
    } else {
      const factor = e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
      model.setState({ Zoom: model.state.Zoom * factor });
    }
  }, { passive: false });

  // Continuous follow: whenever the model state changes (time tick,
  // observer move, etc.), re-aim toward FollowTarget. ObserverHeading
  // (= avatar facing) updates in both Optical and Heavenly views so
  // the figure rotates with the tracked body. CameraHeight pitch
  // only auto-recentres inside Optical (Heavenly camera pitch stays
  // user-controlled). Below-horizon targets pin pitch to 0.
  model.addEventListener('update', () => {
    const s = model.state;
    if (!s.FollowTarget) return;
    if (s.FreeCameraMode) return;
    if (dragging) return;
    const angles = resolveTargetAngles(s.FollowTarget, model.computed);
    if (!angles) return;
    const targetHeading = ((angles.azimuth % 360) + 360) % 360;
    const curHeading = ((s.ObserverHeading || 0) % 360 + 360) % 360;
    const patch = {};
    if (Math.abs(targetHeading - curHeading) >= CLICK_EPS_DEG) {
      patch.ObserverHeading = targetHeading;
    }
    if (s.InsideVault) {
      const targetPitch = Math.max(0, Math.min(89.9, angles.elevation));
      const curPitch = s.CameraHeight || 0;
      if (Math.abs(targetPitch - curPitch) >= CLICK_EPS_DEG) {
        patch.CameraHeight = targetPitch;
      }
    }
    if (Object.keys(patch).length > 0) model.setState(patch, false);
  });
}
