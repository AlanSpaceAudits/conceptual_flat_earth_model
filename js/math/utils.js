// Scalar helpers. Unit-agnostic.

export const ToRad = (deg) => deg * Math.PI / 180;
export const ToDeg = (rad) => rad * 180 / Math.PI;
export const sqr   = (x)   => x * x;

export const Limit1  = (x) => (x < -1 ? -1 : x > 1 ? 1 : x);
export const Limit01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const Clamp   = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);

// Wrap x into [0, max) (for positive x) or [-max, 0) (for negative x).
export function ToRange(x, max) {
  let v = Math.abs(x) % max;
  if (x < 0) v = max - v;
  return v;
}
