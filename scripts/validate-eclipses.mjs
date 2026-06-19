// Geocentric kinematic eclipse prediction from the master Sun + Moon, checked
// against Fred Espenak's eclipse canon (computed from JPL DE405).
//
// An eclipse is pure two-body kinematics: a solar eclipse is when the Moon's
// geocentric direction meets the Sun's (new moon at a node); a lunar eclipse
// is when the Moon meets the Sun's antipode (full moon at a node). We refine
// the instant of minimum separation using the master ephemeris and compare the
// time and minimum separation to Espenak's catalogue.
// Run: node scripts/validate-eclipses.mjs

import { ASTROPIXELS_ECLIPSES } from '../js/data/astropixelsEclipses.js';
import { refineEclipseByMinSeparation } from '../js/ephem/common.js';
import * as master from '../js/ephem/masterTang.js';

const sunFn  = (d) => master.bodyGeocentric('sun', d);
const moonFn = (d) => master.bodyGeocentric('moon', d);
const DEGS = 180 / Math.PI;

function run(kind, list) {
  console.log(`\n=== ${kind} eclipses: master kinematics vs Espenak (UT) ===`);
  console.log('date          Espenak UT     master UT      dt(min)  min-sep');
  const errs = [];
  for (const e of list) {
    const yr = +e.date.slice(0, 4);
    if (yr < 2021 || yr > 2027) continue;        // DE405 trustworthy window
    const approx = new Date(e.utISO);
    const r = refineEclipseByMinSeparation(approx, sunFn, moonFn, { kind, halfWindowMinutes: 180 });
    const dtMin = (r.date.getTime() - approx.getTime()) / 60000;
    errs.push(Math.abs(dtMin));
    const sepDeg = r.minSeparationRad * DEGS;
    console.log(
      `${e.date}  ${e.utISO.slice(11, 19)}      ${r.date.toISOString().slice(11, 19)}     ` +
      `${dtMin.toFixed(1).padStart(6)}   ${sepDeg.toFixed(3)}°  ${e.type}`,
    );
  }
  const max = Math.max(...errs), rms = Math.sqrt(errs.reduce((s, x) => s + x * x, 0) / errs.length);
  console.log(`timing vs Espenak: max ${max.toFixed(1)} min, rms ${rms.toFixed(1)} min  (${errs.length} events)`);
}

run('solar', ASTROPIXELS_ECLIPSES.solar);
run('lunar', ASTROPIXELS_ECLIPSES.lunar);
