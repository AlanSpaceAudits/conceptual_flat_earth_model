// Tang canonical celestial frame.
//
// This is the single source of truth for every body's position. The
// simulator's baseline coordinate system is the Chinese (Yi Xing / Dayan)
// equatorial system, expressed in du (365.25 per great circle):
//
//   去極度  qjdDu  — qu ji du, polar distance = co-declination, in du.
//                    δ = 90° − (qjdDu in degrees).
//   入宿度  rxdDu  — ru xiu du, mansion-entry degree, in du: eastward
//                    distance from the determinative star at the western
//                    edge of the mansion `xiu` the body sits in.
//   xiu            — index 0..27 into the 28 lunar mansions (see xiu.js).
//
// The whole process is built to start FROM this Tang system. The ephemeris has
// been converted INTO Tang du/xiu: a body's position is held as its Tang record
// (the position of record), and the modern RA/Dec the render and projection
// stages use is produced FROM that record. du and degree are each a ratio of
// the same circle (du = 1/365.25 of it, degree = 1/360 of it), so the two
// systems are internally consistent and inter-convertible by a single scaling
// factor, Tang/modern = DU_PER_DEG = 365.25/360. Multiply by it to go
// degrees -> du, divide by it to go du -> degrees; the factor alone carries you
// between them. Neither system is primary by observation: both give identical
// positions, so which one sits on top is convention, not something the sky
// shows. Here the Tang record sits on top.
//
// FE and GE interpreters both read the same Tang record; they differ only
// in how they map these shared angles into disc-vs-globe geometry and
// li/bu-vs-km distance.

import { DEG_PER_DU, DU_PER_DEG } from './units.js';
import { XIU, XIU_WIDTH_DEG, xiuOfRa } from './xiu.js';

const norm360 = (x) => ((x % 360) + 360) % 360;
const RAD = Math.PI / 180;

// --- Encode: equatorial RA/Dec (degrees) -> Tang record -------------------
//
// raDeg in [0,360), decDeg in [-90, 90].
export function raDecToTang(raDeg, decDeg) {
  const ra = norm360(raDeg);
  const xiu = xiuOfRa(ra);
  const edge = XIU[xiu].raJ2000Deg;
  const rxdDeg = norm360(ra - edge);
  return {
    xiu,
    xiuName: XIU[xiu].name,
    xiuHanzi: XIU[xiu].hanzi,
    rxdDu: rxdDeg * DU_PER_DEG,            // ru xiu du
    qjdDu: (90 - decDeg) * DU_PER_DEG,     // qu ji du (co-declination)
    raDeg: ra,                             // cached modern equivalents
    decDeg,
  };
}

// Radians convenience wrapper (ephemeris pipelines output radians).
export function raDecRadToTang(raRad, decRad) {
  if (!Number.isFinite(raRad) || !Number.isFinite(decRad)) {
    return { xiu: -1, xiuName: '—', xiuHanzi: '—', rxdDu: NaN, qjdDu: NaN, raDeg: NaN, decDeg: NaN };
  }
  return raDecToTang(raRad / RAD, decRad / RAD);
}

// --- Decode: Tang record -> equatorial RA/Dec -----------------------------
export function tangToRaDec({ xiu, rxdDu, qjdDu }) {
  const edge = XIU[xiu].raJ2000Deg;
  const raDeg = norm360(edge + rxdDu * DEG_PER_DU);
  const decDeg = 90 - qjdDu * DEG_PER_DU;
  return { raDeg, decDeg };
}

// Radians decode (matches the ephemeris API shape { ra, dec } in radians).
export function tangToRaDecRad(tang) {
  if (!tang || tang.xiu < 0 || !Number.isFinite(tang.rxdDu)) {
    return { ra: NaN, dec: NaN };
  }
  const { raDeg, decDeg } = tangToRaDec(tang);
  return { ra: raDeg * RAD, dec: decDeg * RAD };
}

// --- Readout helpers ------------------------------------------------------

// "Jiao 角  12.31 du RXD / 78.05 du QJD" style label for HUD rows.
export function fmtTang(tang) {
  if (!tang || tang.xiu < 0 || !Number.isFinite(tang.rxdDu)) return '—';
  return `${tang.xiuName} ${tang.xiuHanzi}  `
       + `${tang.rxdDu.toFixed(2)} du RXD / ${tang.qjdDu.toFixed(2)} du QJD`;
}

export { XIU, XIU_WIDTH_DEG };
