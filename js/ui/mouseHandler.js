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
      c.CelNavStars, c.CataloguedStars, c.BlackHoles, c.Quasars, c.Galaxies,
    ]) {
      if (!list) continue;
      const found = list.find((x) => x.id === id);
      if (found) return found.anglesGlobe || null;
    }
  }
  return null;
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
  if (state.ShowStars) {
    for (const list of [
      c.CelNavStars, c.CataloguedStars, c.BlackHoles, c.Quasars, c.Galaxies,
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
  const threshold = Math.max(0.4, Math.min(5, fovV / 15));
  const candidates = collectClickables(c, state);
  let best = null, bestD = threshold;
  for (const opt of candidates) {
    if (!opt.angles || opt.angles.elevation < 0) continue;
    const d = angularDistance(clickAz, clickEl, opt.angles.azimuth, opt.angles.elevation);
    if (d < bestD) { bestD = d; best = opt; }
  }
  return best;
}

export function attachMouseHandler(canvas, model) {
  let dragging = false;
  let lastX = 0, lastY = 0;
  let downX = 0, downY = 0;
  let dragDist = 0;

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    lastX = e.offsetX; lastY = e.offsetY;
    downX = e.offsetX; downY = e.offsetY;
    dragDist = 0;
  });

  canvas.addEventListener('pointerup', (e) => {
    const wasClick = dragging && dragDist < CLICK_DRAG_PX;
    dragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
    if (!wasClick) return;
    if (!model.state.InsideVault) return;
    const click = canvasToSkyAngles(canvas, e.offsetX, e.offsetY, model.state);
    const best = findNearestCelestial(
      click.az, click.el, model.computed, model.state, click.fovV,
    );
    if (!best) return;
    // Snap heading + pitch to the object. Clamp pitch to 0 so a
    // below-horizon target (shouldn't be clickable, but guard
    // anyway) keeps the camera level.
    const targetHeading = ((best.angles.azimuth % 360) + 360) % 360;
    const targetPitch = Math.max(0, Math.min(89.9, best.angles.elevation));
    model.setState({
      FollowTarget: best.id,
      ObserverHeading: targetHeading,
      CameraHeight:    targetPitch,
    });
  });

  canvas.addEventListener('pointerleave', () => {
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
    }

    // Cursor elevation + azimuth readouts (Optical only).
    if (model.state.InsideVault) {
      const { az, el } = canvasToSkyAngles(canvas, e.offsetX, e.offsetY, model.state);
      if (model.state.MouseElevation !== el
          || model.state.MouseAzimuth !== az) {
        model.setState({ MouseElevation: el, MouseAzimuth: az });
      }
    } else if (model.state.MouseElevation !== null
               || model.state.MouseAzimuth !== null) {
      model.setState({ MouseElevation: null, MouseAzimuth: null });
    }

    if (!dragging) return;
    const dx = e.offsetX - lastX;
    const dy = e.offsetY - lastY;
    lastX = e.offsetX; lastY = e.offsetY;

    if (e.ctrlKey || e.metaKey) {
      model.setState({
        ObserverLat: model.state.ObserverLat - (dy / w) * POS_INCR,
        ObserverLong: model.state.ObserverLong + (dx / h) * POS_INCR,
        Description: '',
      });
      return;
    }

    if (dragDist >= CLICK_DRAG_PX && model.state.FollowTarget) {
      // Any real drag breaks the follow — user is steering manually.
      model.setState({ FollowTarget: null });
    }

    if (model.state.InsideVault) {
      // Drag right: heading+. Drag up: pitch+. Pitch clamped 0..90°.
      const heading = model.state.ObserverHeading || 0;
      const pitch   = model.state.CameraHeight || 0;
      model.setState({
        ObserverHeading: ((heading + (dx / w) * FP_LOOK_INCR) % 360 + 360) % 360,
        CameraHeight: Math.max(0, Math.min(90,
          pitch - (dy / h) * FP_LOOK_INCR)),
      });
      return;
    }

    model.setState({
      CameraDirection: model.state.CameraDirection - (dx / w) * ROT_INCR,
      CameraHeight: Math.max(0, Math.min(89.9,
        model.state.CameraHeight + (dy / h) * ROT_INCR)),
    });
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const inVault = !!model.state.InsideVault;
    if (inVault) {
      const cur = model.state.OpticalZoom || 5.09;
      const dir = e.deltaY > 0 ? -1 : 1;
      model.setState({ OpticalZoom: opticalWheelStep(cur, dir) });
    } else {
      const factor = e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
      model.setState({ Zoom: model.state.Zoom * factor });
    }
  }, { passive: false });

  // Continuous follow: whenever the model state changes (time tick,
  // observer move, etc.), re-aim the camera at FollowTarget. Below-
  // horizon targets pin pitch to 0 so the camera keeps facing their
  // azimuth along the horizon instead of looking underground.
  model.addEventListener('update', () => {
    const s = model.state;
    if (!s.FollowTarget || !s.InsideVault) return;
    const angles = resolveTargetAngles(s.FollowTarget, model.computed);
    if (!angles) return;
    const targetHeading = ((angles.azimuth % 360) + 360) % 360;
    const targetPitch = Math.max(0, Math.min(89.9, angles.elevation));
    const curHeading = ((s.ObserverHeading || 0) % 360 + 360) % 360;
    const curPitch = s.CameraHeight || 0;
    if (Math.abs(targetHeading - curHeading) < CLICK_EPS_DEG
        && Math.abs(targetPitch - curPitch) < CLICK_EPS_DEG) return;
    model.setState({
      ObserverHeading: targetHeading,
      CameraHeight: targetPitch,
    }, false);
  });
}
