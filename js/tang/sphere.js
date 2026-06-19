// Tang canonical sphere — the single funnel every body position passes
// through.
//
//   ephemeris (registry) --RA/Dec--> ENCODE --Tang record (canonical)-->
//   DECODE --RA/Dec--> downstream transforms / FE+GE interpreters
//
// `bodyTang` is what the application calls instead of hitting an ephemeris
// directly. The position of record is the du/xiu encoding; the RA/Dec it also
// returns (so existing render code keeps its `{ ra, dec }` contract) is produced
// FROM that Tang record by the single scaling factor between the two systems.
// They are one factor apart and give identical positions, so neither is
// observably primary; the Tang record is taken as canonical and the modern
// angles are derived from it.

import { bodyRADec as ephemRADec, activeSource } from '../ephem/registry.js';
import { raDecRadToTang, tangToRaDecRad } from './frame.js';

// Returns { ra, dec, tang } where ra/dec are radians (geocentric apparent,
// reconstructed from the canonical Tang record) and tang is the canonical
// du/xiu record. NaN-safe: an unsupported body yields a sentinel Tang
// record and { ra: NaN, dec: NaN }.
export function bodyTang(name, dateUTC, source = activeSource()) {
  const raw = ephemRADec(name, dateUTC, source);   // radians from ephemeris
  const tang = raDecRadToTang(raw.ra, raw.dec);     // ENCODE -> canonical
  const { ra, dec } = tangToRaDecRad(tang);         // DECODE -> render frame
  return { ra, dec, tang };
}
