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
const ZOOM_STEP = 1.1;

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
    const factor = e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
    model.setState({ Zoom: model.state.Zoom * factor });
  }, { passive: false });
}
