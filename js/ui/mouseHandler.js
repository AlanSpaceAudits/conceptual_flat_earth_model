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

const ROT_INCR = 200;
const FP_LOOK_INCR = 180;
const POS_INCR = 300;
const ZOOM_STEP   = 1.1;
const FP_ZOOM_MIN = 0.2;
const FP_ZOOM_MAX = 75;      // fov_min = 75/75 = 1°

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

  canvas.addEventListener('pointerleave', () => {
    if (model.state.MouseElevation !== null
        || model.state.MouseAzimuth !== null) {
      model.setState({ MouseElevation: null, MouseAzimuth: null });
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;

    // Cursor elevation + azimuth readouts (Optical only).
    // Pinhole, zero roll: kx = x_ndc·tan(hFov/2), ky = y_ndc·tan(vFov/2),
    // c = cos P − ky·sin P, then
    //   az = H + atan2(kx, c)
    //   el = atan2(sin P + ky·cos P, √(c² + kx²))
    if (model.state.InsideVault) {
      const xNdc = (e.offsetX / w) * 2 - 1;
      const yNdc = 1 - (e.offsetY / h) * 2;
      const zoom = Math.max(0.2, model.state.OpticalZoom || 1);
      const fovV = Math.max(0.005, Math.min(75, 75 / zoom));
      const aspect = w / h;
      const fovVRad = fovV * Math.PI / 180;
      const fovHRad = 2 * Math.atan(Math.tan(fovVRad / 2) * aspect);
      const kx = xNdc * Math.tan(fovHRad / 2);
      const ky = yNdc * Math.tan(fovVRad / 2);
      const pitchRad = (model.state.CameraHeight || 0) * Math.PI / 180;
      const headingDeg = model.state.ObserverHeading || 0;
      const cosP = Math.cos(pitchRad);
      const sinP = Math.sin(pitchRad);
      const c = cosP - ky * sinP;
      const vert = sinP + ky * cosP;
      const horizLen = Math.sqrt(c * c + kx * kx);
      const elDeg = Math.atan2(vert, horizLen) * 180 / Math.PI;
      let azDeg = headingDeg + Math.atan2(kx, c) * 180 / Math.PI;
      azDeg = ((azDeg % 360) + 360) % 360;
      const mouseEl = Math.max(-90, Math.min(90, elDeg));
      if (model.state.MouseElevation !== mouseEl
          || model.state.MouseAzimuth !== azDeg) {
        model.setState({ MouseElevation: mouseEl, MouseAzimuth: azDeg });
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
      // Unit-step by the active cadence; OpticalZoom is mode-local.
      const cur = model.state.OpticalZoom || 5.09;
      const dir = e.deltaY > 0 ? -1 : 1;   // wheel up = zoom in
      model.setState({ OpticalZoom: opticalWheelStep(cur, dir) });
    } else {
      const factor = e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
      model.setState({ Zoom: model.state.Zoom * factor });
    }
  }, { passive: false });
}
