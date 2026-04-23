// Pointer + wheel events -> FE model mutations.
//
// Two camera modes share these handlers:
//
//   * orbit (default):
//       drag        -> CameraDirection / CameraHeight (orbit around scene)
//       ctrl + drag -> ObserverLat / ObserverLong (move observer)
//       wheel       -> Zoom
//
//   * first-person (InsideVault):
//       drag        -> ObserverHeading (yaw) / CameraHeight (pitch, 0..90°)
//       ctrl + drag -> ObserverLat / ObserverLong
//       wheel       -> Zoom (camera FOV stays 75° but Zoom can scale optics)

const ROT_INCR = 200;
const FP_LOOK_INCR = 180;   // first-person look sensitivity
const POS_INCR = 300;
const ZOOM_STEP      = 1.1;    // orbit: gentle multiplicative wheel
// S002 — Optical wheel is unit-stepped: one notch = one cadence unit
// of the active regime. OpticalZoom is clamped to [FP_ZOOM_MIN,
// FP_ZOOM_MAX]; this matches the app.js clamp.
// S006 — FP_ZOOM_MAX = 75 caps FOV at 75°/75 = 1°, the
// individual-degree inspection layer. No sub-degree cadence defined.
const FP_ZOOM_MIN    = 0.2;
const FP_ZOOM_MAX    = 75;

// Optical cadence step per wheel notch — S006b three-tier ladder
// mirroring refinedAzCadenceForFov in worldObjects.js:
//   FOV ≥ 30°        → coarse 15° wire. 5° per notch so wide-FOV
//                      traversal from 75° down to 30° is a handful
//                      of clicks rather than dozens.
//   8° ≤ FOV < 30°  → refined 5° meridians. 5° per notch so each
//                      click snaps onto the next visible meridian.
//   FOV <  8°        → refined 1° meridians. 1° per notch.
function opticalCadenceStepDeg(fovDeg) {
  if (fovDeg >= 8) return 5;
  return 1;
}

// Given a target Optical FOV, compute the corresponding OpticalZoom.
function zoomFromFov(fovDeg) {
  return Math.max(FP_ZOOM_MIN, Math.min(FP_ZOOM_MAX, 75 / fovDeg));
}

// One wheel notch in Optical: shift the visible FOV by the current
// cadence's minor-tick width (zoom in = FOV decreases by that width).
function opticalWheelStep(currentZoom, dir) {
  const fov = Math.max(0.005, Math.min(75, 75 / currentZoom));
  const step = opticalCadenceStepDeg(fov);
  // `dir`: +1 = zoom in (narrow FOV), −1 = zoom out (widen FOV)
  let nextFov = fov - dir * step;
  nextFov = Math.max(0.005, Math.min(75, nextFov));
  return zoomFromFov(nextFov);
}

export function attachMouseHandler(canvas, model) {
  let dragging = false;
  let lastX = 0, lastY = 0;

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    lastX = e.offsetX; lastY = e.offsetY;
  });

  canvas.addEventListener('pointerup', (e) => {
    dragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.offsetX - lastX;
    const dy = e.offsetY - lastY;
    lastX = e.offsetX; lastY = e.offsetY;
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;

    if (e.ctrlKey || e.metaKey) {
      model.setState({
        ObserverLat: model.state.ObserverLat - (dy / w) * POS_INCR,
        ObserverLong: model.state.ObserverLong + (dx / h) * POS_INCR,
        Description: '',
      });
      return;
    }

    if (model.state.InsideVault) {
      // Mouse drag = free look. Drag right → ObserverHeading increases
      // (turn right). Drag down → pitch decreases (look toward horizon),
      // drag up → pitch increases (look toward zenith). Pitch is clamped
      // to 0..90° so the observer can't tilt past the horizon or past the
      // zenith.
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
      // S002 — unit-stepped Optical zoom: one wheel notch shifts FOV
      // by exactly one minor-cadence unit (1° in degree regime, 1' in
      // arcminute regime, 1" in arcsecond regime). OpticalZoom is
      // mode-local and does NOT affect the orbit Zoom state.
      const cur = model.state.OpticalZoom || 5.09;
      const dir = e.deltaY > 0 ? -1 : 1;   // wheel up = zoom in
      model.setState({ OpticalZoom: opticalWheelStep(cur, dir) });
    } else {
      // Orbit zoom — gentle multiplicative wheel, scoped to the
      // Heavenly-mode `Zoom` state only.
      const factor = e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
      model.setState({ Zoom: model.state.Zoom * factor });
    }
  }, { passive: false });
}
