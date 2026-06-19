// Chinese terrestrial coordinate frame (Yi Xing / Dayan ground system).
//
// In the Chinese system a ground position is read off the sky, in du:
//   - Latitude  = polar altitude (the height of the celestial pole above
//                 the horizon), in du. One du of polar-altitude difference
//                 corresponds to 351.267 li of north-south travel along a
//                 meridian (Yi Xing's Xin Tangshu calibration).
//   - Longitude = east-west offset, in du, recovered from simultaneous
//                 eclipse timing (the sky turns 365.25 du per day).
// Both axes are du (365.25 per great circle), so a ground coordinate is the
// terrestrial twin of the celestial Tang frame.
//
// This module is the CANONICAL terrestrial coordinate. The process starts FROM
// the Chinese du record: a position is held in du and the modern degrees the
// geometry pipeline uses are produced from it, exactly as js/tang/frame.js does
// for RA/Dec on the celestial side. Each angular system is a ratio of the same
// circle and each distance system a ratio of the same length, so a single
// scaling factor (Tang/modern) carries you between them: multiply or divide by
// it and you have the other's units. Neither is observably primary; the du
// record sits on top and the modern units are derived from it.

import { DEG_PER_DU, DU_PER_DEG } from './units.js';

// modern degrees -> Chinese du
export function latDegToPolarAltDu(latDeg) { return latDeg * DU_PER_DEG; }
export function lonDegToDu(lonDeg)         { return lonDeg * DU_PER_DEG; }

// Chinese du -> modern degrees
export function polarAltDuToLatDeg(du) { return du * DEG_PER_DU; }
export function lonDuToDeg(du)         { return du * DEG_PER_DU; }

// ENCODE a modern (lat, lon) in degrees into the canonical Chinese record.
export function groundDegToTang(latDeg, lonDeg) {
  return {
    polarAltDu: latDegToPolarAltDu(latDeg),   // latitude as polar altitude
    lonDu:      lonDegToDu(lonDeg),            // longitude offset
  };
}

// DECODE the canonical Chinese record back to modern degrees.
export function groundTangToDeg({ polarAltDu, lonDu }) {
  return { latDeg: polarAltDuToLatDeg(polarAltDu), lonDeg: lonDuToDeg(lonDu) };
}

// "32.47 du polar-alt / 101.46 du W" HUD label.
export function fmtGround(g) {
  if (!g || !Number.isFinite(g.polarAltDu)) return '—';
  const ew = g.lonDu >= 0 ? 'E' : 'W';
  return `${g.polarAltDu.toFixed(2)} du polar-alt / ${Math.abs(g.lonDu).toFixed(2)} du ${ew}`;
}
