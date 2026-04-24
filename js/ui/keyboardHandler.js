// Arrow-key observer movement.
//
// Tap: 1° step in the arrow's direction.
// Hold: same 1°/tick for the first 2 s, then 10°/tick thereafter.
//
//   ArrowUp    → ObserverLat + step (north)
//   ArrowDown  → ObserverLat - step (south)
//   ArrowRight → ObserverLong + step (east)
//   ArrowLeft  → ObserverLong - step (west)

const KEY_STEP_DEG     = 1;
const KEY_BURST_DEG    = 10;
const BURST_THRESHOLD_MS = 2000;
const TICK_MS          = 150;

const KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

function patchFor(key, deg, state) {
  if (state.FreeCameraMode) {
    // Free-camera: arrows rotate / tilt the orbit camera instead of
    // moving the observer. ↑/↓ tilts pitch; ←/→ yaws direction.
    const hStep = deg * 0.5;  // camera moves a touch more slowly
    switch (key) {
      case 'ArrowUp':
        return { CameraHeight: Math.min(89.9, (state.CameraHeight || 0) + hStep) };
      case 'ArrowDown':
        return { CameraHeight: Math.max(-30,   (state.CameraHeight || 0) - hStep) };
      case 'ArrowRight':
        return { CameraDirection: (state.CameraDirection || 0) + hStep };
      case 'ArrowLeft':
        return { CameraDirection: (state.CameraDirection || 0) - hStep };
      default: return null;
    }
  }
  switch (key) {
    case 'ArrowUp':    return { ObserverLat:  state.ObserverLat  + deg };
    case 'ArrowDown':  return { ObserverLat:  state.ObserverLat  - deg };
    case 'ArrowRight': return { ObserverLong: state.ObserverLong + deg };
    case 'ArrowLeft':  return { ObserverLong: state.ObserverLong - deg };
    default: return null;
  }
}

function isFormField(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function attachKeyboardHandler(model) {
  const held = new Map(); // key → { start, intervalId }

  window.addEventListener('keydown', (e) => {
    // Spacebar toggles autoplay pause/play.
    if ((e.key === ' ' || e.code === 'Space') && !e.repeat) {
      if (isFormField(e.target)) return;
      const ap = model._autoplay;
      if (ap) {
        e.preventDefault();
        ap.toggle();
      }
      return;
    }

    if (!KEYS.has(e.key)) return;

    if (isFormField(e.target)) return;

    e.preventDefault();
    if (e.repeat) return;   // browser auto-repeat; our own interval handles it.

    const firstStep = patchFor(e.key, KEY_STEP_DEG, model.state);
    if (firstStep) model.setState(firstStep);

    const start = performance.now();
    const intervalId = setInterval(() => {
      const elapsed = performance.now() - start;
      const step = elapsed >= BURST_THRESHOLD_MS ? KEY_BURST_DEG : KEY_STEP_DEG;
      const patch = patchFor(e.key, step, model.state);
      if (patch) model.setState(patch);
    }, TICK_MS);

    const prev = held.get(e.key);
    if (prev) clearInterval(prev.intervalId);
    held.set(e.key, { start, intervalId });
  });

  window.addEventListener('keyup', (e) => {
    const entry = held.get(e.key);
    if (!entry) return;
    clearInterval(entry.intervalId);
    held.delete(e.key);
  });

  window.addEventListener('blur', () => {
    for (const { intervalId } of held.values()) clearInterval(intervalId);
    held.clear();
  });
}
