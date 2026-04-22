// 3D vector ops. Vectors are plain arrays [x, y, z]. Unit-agnostic.

import { ToRad } from './utils.js';

export const V = {
  Null:  ()            => [0, 0, 0],
  Copy:  (a)           => [a[0], a[1], a[2]],
  Add:   (a, b)        => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  Sub:   (a, b)        => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  Scale: (a, s)        => [a[0] * s, a[1] * s, a[2] * s],

  // Dot product.
  ScalarProd: (a, b)   => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],

  // Cross product (original Jsg uses `Mult` for cross).
  Mult: (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],

  Length: (a) => Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]),

  Norm: (a) => {
    const L = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    if (L === 0) return [0, 0, 0];
    return [a[0] / L, a[1] / L, a[2] / L];
  },

  // Build [x,y,z] of given length from longitude (deg, rotation around z)
  // and latitude (deg, elevation above xy-plane).
  FromAngle: (longDeg, latDeg, length) => {
    const lo = ToRad(longDeg), la = ToRad(latDeg);
    const c = Math.cos(la);
    return [length * c * Math.cos(lo), length * c * Math.sin(lo), length * Math.sin(la)];
  },
};

export default V;
