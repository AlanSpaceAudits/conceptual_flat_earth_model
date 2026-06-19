// 2028-07-22 total solar eclipse (path through Sydney). Tests the video's claim
// that the model shows the same eclipse magnitude everywhere.
//   GEOCENTRIC  = Sun & Moon directions from Earth's centre (no observer).
//   TOPOCENTRIC = what an observer actually sees, via the horizontal-parallax
//                 ratio sinHP = R⊕/d the ephemeris supplies. No distances: the
//                 only inputs are angles and the dimensionless sinHP ratio.
import { SOLAR_CANON } from '../js/data/eclipseCanon5M.js';
import * as master from '../js/ephem/masterTang.js';
import { greenwichSiderealDeg } from '../js/ephem/common.js';
import { topocentricRaDec } from '../js/core/topocentric.js';

const DEG = Math.PI / 180, RAD = 180 / Math.PI;
const e = SOLAR_CANON.find(x => x.y === 2028 && x.mo === 7);
console.log('Eclipse:', `${e.y}-${String(e.mo).padStart(2,'0')}-${String(e.d).padStart(2,'0')}`, e.type,
  'greatest UT', e.utISO?.slice(11,19) ?? '(computed)', '| gamma', e.gamma, '| mag', e.mag,
  '| greatest-eclipse point', e.latDeg+'N', e.lonDeg+'E');

function jdTD(e){let Y=e.y,M=e.mo;if(M<=2){Y-=1;M+=12;}const g=(e.y>1582)||(e.y===1582&&(e.mo>10||(e.mo===10&&e.d>=15)));let B=0;if(g){const A=Math.floor(Y/100);B=2-A+Math.floor(A/4);}return Math.floor(365.25*(Y+4716))+Math.floor(30.6001*(M+1))+e.d+(e.h+e.mi/60+e.s/3600)/24+B-1524.5;}
const jdUT0 = jdTD(e) - e.deltaT/86400;
const dateOf = j => new Date((j-2440587.5)*86400000);
const sep=(a,b)=>Math.acos(Math.max(-1,Math.min(1,Math.sin(a.dec)*Math.sin(b.dec)+Math.cos(a.dec)*Math.cos(b.dec)*Math.cos(a.ra-b.ra))))*RAD;
const sunAlt=(g,lat,lon,gm)=>Math.asin(Math.sin(lat*DEG)*Math.sin(g.dec)+Math.cos(lat*DEG)*Math.cos(g.dec)*Math.cos((gm+lon)*DEG-g.ra))*RAD;

// For an observer, scan ±2.5 h and report the MINIMUM Sun-Moon separation
// (max eclipse) and the Sun's altitude there.
function maxEclipse(lat, lon, topocentric){
  let best = 1e9, alt = 0;
  for(let m=-150; m<=150; m++){
    const d = dateOf(jdUT0 + m/1440);
    let s = master.bodyGeocentric('sun', d, e.deltaT);
    let mo = master.bodyGeocentric('moon', d, e.deltaT);
    const gm = greenwichSiderealDeg(d);
    if(topocentric){
      const lst = (gm + lon) * DEG;
      // sinHP = R⊕/d from the ephemeris — a ratio, never a distance.
      s  = topocentricRaDec(s.ra,  s.dec,  master.bodyParallaxSine('sun',  d, e.deltaT), lat*DEG, lst);
      mo = topocentricRaDec(mo.ra, mo.dec, master.bodyParallaxSine('moon', d, e.deltaT), lat*DEG, lst);
    }
    const sp = sep(s, mo);
    if(sp < best){ best = sp; alt = sunAlt(master.bodyGeocentric('sun', d, e.deltaT), lat, lon, gm); }
  }
  return { sep: best, alt };
}
const verdict=(sp,alt)=> alt<0 ? 'sun below horizon -> NO eclipse seen'
  : sp<0.27 ? 'TOTAL / near-total' : sp<0.55 ? 'partial' : sp<1.6 ? 'slight grazing/none' : 'NO eclipse';

const locs=[['Sydney (on path of totality)',-33.87,151.21],['far-north Russia',65,90],['greatest-eclipse point',e.latDeg,e.lonDeg]];
console.log('\nGEOCENTRIC (no observer parallax): min Sun-Moon separation');
for(const[n,la,lo] of locs){const r=maxEclipse(la,lo,false); console.log(`  ${n.padEnd(34)} sep ${r.sep.toFixed(3)}deg`);}
console.log('\nTOPOCENTRIC (sinHP = R/d ratio, no distance): what each observer sees');
for(const[n,la,lo] of locs){const r=maxEclipse(la,lo,true); console.log(`  ${n.padEnd(34)} sep ${r.sep.toFixed(3)}deg  sunAlt ${r.alt.toFixed(0)}deg  -> ${verdict(r.sep,r.alt)}`);}
