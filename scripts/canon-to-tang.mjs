// Express Five-Millennium-Canon eclipses in Tang units: the celestial position
// of the eclipse (which xiu, in du) from the master ephemeris, and the
// geographic point of greatest eclipse in Tang ground du.
// Run: node scripts/canon-to-tang.mjs

import { SOLAR_CANON } from '../js/data/eclipseCanon5M.js';
import { bodyTang } from '../js/tang/sphere.js';
import { groundDegToTang } from '../js/tang/ground.js';

function jdTD(e) {
  let Y = e.y, M = e.mo;
  if (M <= 2) { Y -= 1; M += 12; }
  const greg = (e.y > 1582) || (e.y === 1582 && (e.mo > 10 || (e.mo === 10 && e.d >= 15)));
  let B = 0;
  if (greg) { const A = Math.floor(Y / 100); B = 2 - A + Math.floor(A / 4); }
  const frac = (e.h + e.mi / 60 + e.s / 3600) / 24;
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + e.d + frac + B - 1524.5;
}
const utDate = (e) => new Date((jdTD(e) - e.deltaT / 86400 - 2440587.5) * 86400000);
const find = (y, mo) => SOLAR_CANON.find((e) => e.y === y && e.mo === mo);

// A spread: modern total, a Tang-dynasty eclipse, an ancient one.
const picks = [
  find(2024, 4), find(2009, 7), find(2017, 8),
  find(840, 5), find(756, 10),               // Tang dynasty (618-907)
  find(-1999, 6),                            // canon's earliest
].filter(Boolean);

console.log('eclipse        type   Sun in Tang sky               greatest eclipse ground point');
for (const e of picks) {
  const d = utDate(e);
  const s = bodyTang('sun', d).tang;
  const g = groundDegToTang(e.latDeg, e.lonDeg);
  const yr = (e.y < 0 ? e.y : ' ' + e.y);
  const ew = g.lonDu >= 0 ? 'E' : 'W', ns = e.latDeg >= 0 ? 'N' : 'S';
  console.log(
    `${yr} ${String(e.mo).padStart(2, '0')}/${String(e.d).padStart(2, '0')}`.padEnd(13),
    e.type.padEnd(4),
    `${s.xiuName} ${s.xiuHanzi} ${s.rxdDu.toFixed(2)}du RXD / ${s.qjdDu.toFixed(2)}du QJD`.padEnd(30),
    `${Math.abs(g.polarAltDu).toFixed(1)}du polar-alt ${ns} / ${Math.abs(g.lonDu).toFixed(1)}du ${ew}`,
  );
}
