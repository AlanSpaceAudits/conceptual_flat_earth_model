// 3x3 rotation matrix with optional translation. Column-vector convention: v' = R*v + t.
// Matrices are stored as { r: [[...],[...],[...]], t: [tx,ty,tz] } where r[i][j] is row i col j.
// Behaviour matches Walter Bislin's JsgMat3 calls used by the FE model:
//   RotatingX/Y/Z(angleRad, base?)  => compose: result = rotAxis * base (base applied first)
//   Moving(x, y, z, rotMat)         => translation + rotation
//   Unit()                          => identity
//   Trans(m, v)                     => m.r * v + m.t

import { ToRad } from './utils.js';

const ZERO_T = () => [0, 0, 0];
const I3 = () => [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

function rotX(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [[1, 0, 0], [0, c, -s], [0, s, c]];
}
function rotY(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
}
function rotZ(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
}

// A * B (3x3 only)
function mul3(A, B) {
  const r = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      r[i][j] = A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j];
    }
  }
  return r;
}

// m * v + m.t
function apply(m, v) {
  const r = m.r, t = m.t;
  return [
    r[0][0] * v[0] + r[0][1] * v[1] + r[0][2] * v[2] + t[0],
    r[1][0] * v[0] + r[1][1] * v[1] + r[1][2] * v[2] + t[1],
    r[2][0] * v[0] + r[2][1] * v[1] + r[2][2] * v[2] + t[2],
  ];
}

// Compose: rotation applied "after" base => result_r = rot * base_r, result_t = rot * base_t
function composeRot(rot, base) {
  if (!base) return { r: rot, t: ZERO_T() };
  const r = mul3(rot, base.r);
  const t = [
    rot[0][0] * base.t[0] + rot[0][1] * base.t[1] + rot[0][2] * base.t[2],
    rot[1][0] * base.t[0] + rot[1][1] * base.t[1] + rot[1][2] * base.t[2],
    rot[2][0] * base.t[0] + rot[2][1] * base.t[1] + rot[2][2] * base.t[2],
  ];
  return { r, t };
}

export const M = {
  Unit:       ()                   => ({ r: I3(), t: ZERO_T() }),
  RotatingX:  (angleRad, base)     => composeRot(rotX(angleRad), base),
  RotatingY:  (angleRad, base)     => composeRot(rotY(angleRad), base),
  RotatingZ:  (angleRad, base)     => composeRot(rotZ(angleRad), base),
  Moving:     (x, y, z, rotMat)    => ({
    r: rotMat ? rotMat.r.map(row => row.slice()) : I3(),
    t: [x, y, z],
  }),
  Trans:      (m, v)               => apply(m, v),
};

export default M;
