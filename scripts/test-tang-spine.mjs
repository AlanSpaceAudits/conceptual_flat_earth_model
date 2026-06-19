// Spine self-test: Tang frame round-trip losslessness + ptolz wiring.
// Run: node scripts/test-tang-spine.mjs

import { raDecToTang, tangToRaDec } from '../js/tang/frame.js';
import { XIU, XIU_WIDTH_DEG } from '../js/tang/xiu.js';
import { bodyTang } from '../js/tang/sphere.js';
import { availableSources, activeSource, supportedBodies } from '../js/ephem/registry.js';
import { groundDegToTang, groundTangToDeg } from '../js/tang/ground.js';
import { DU_PER_DEG } from '../js/tang/units.js';

let fails = 0;
const approx = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
function check(name, cond, detail = '') {
  if (!cond) { fails++; console.log(`  FAIL ${name} ${detail}`); }
  else console.log(`  ok   ${name}`);
}

console.log('1. xiu ruler closes the circle');
const widthSum = XIU_WIDTH_DEG.reduce((a, b) => a + b, 0);
check('28 mansions', XIU.length === 28);
check('widths sum to 360', approx(widthSum, 360, 1e-6), `sum=${widthSum}`);
check('no negative widths', XIU_WIDTH_DEG.every((w) => w > 0));

console.log('2. RA/Dec -> Tang -> RA/Dec round-trip is lossless');
let maxRaErr = 0, maxDecErr = 0;
for (let ra = 0; ra < 360; ra += 0.37) {
  for (let dec = -89; dec <= 89; dec += 7) {
    const f = raDecToTang(ra, dec);
    const back = tangToRaDec(f);
    let dRa = Math.abs(((back.raDeg - ra + 540) % 360) - 180);
    maxRaErr = Math.max(maxRaErr, dRa);
    maxDecErr = Math.max(maxDecErr, Math.abs(back.decDeg - dec));
  }
}
check('RA round-trip < 1e-9 deg', maxRaErr < 1e-9, `maxRaErr=${maxRaErr}`);
check('Dec round-trip < 1e-9 deg', maxDecErr < 1e-9, `maxDecErr=${maxDecErr}`);

console.log('3. QJD / RXD semantics');
const poleStar = raDecToTang(0, 90);   // at the pole, co-declination = 0 du
check('QJD=0 du at +90 dec', approx(poleStar.qjdDu, 0, 1e-9), `qjd=${poleStar.qjdDu}`);
const equ = raDecToTang(0, 0);          // equator -> 90 deg co-dec -> 91.3125 du
check('QJD=91.3125 du at 0 dec', approx(equ.qjdDu, 365.25 / 4, 1e-6), `qjd=${equ.qjdDu}`);
const spica = raDecToTang(XIU[0].raJ2000Deg, -11); // exactly on Jiao edge
check('RXD=0 du on mansion edge', approx(spica.rxdDu, 0, 1e-9), `rxd=${spica.rxdDu}`);
check('xiu=0 (Jiao) on its edge', spica.xiu === 0, `xiu=${spica.xiu}`);

console.log('4. ephemeris registry (TangMaster active, TangPtolz retained, modular)');
check('active source = tangMaster', activeSource() === 'tangMaster', activeSource());
check('tangMaster + tangPtolz registered', availableSources().includes('tangMaster') && availableSources().includes('tangPtolz'), availableSources().join(','));
check('tangMaster supports sun+moon+7 planets', supportedBodies().size === 9, [...supportedBodies()].join(','));

console.log('5. bodyTang funnel (ptolz -> Tang -> RA/Dec)');
const d = new Date(Date.UTC(2024, 3, 8, 18, 0, 0));  // 2024-04-08 eclipse day
for (const body of ['sun', 'moon', 'venus', 'jupiter']) {
  const r = bodyTang(body, d);
  const ok = Number.isFinite(r.ra) && Number.isFinite(r.dec) && r.tang.xiu >= 0;
  check(`${body}: ${r.tang.xiuName} ${r.tang.rxdDu.toFixed(2)}du RXD / ${r.tang.qjdDu.toFixed(2)}du QJD`, ok);
}
// Sun and Moon should be in nearly the same place at a solar eclipse.
const sun = bodyTang('sun', d), moon = bodyTang('moon', d);
const sep = Math.abs(sun.tang.rxdDu - moon.tang.rxdDu);
check('sun/moon same mansion at eclipse', sun.tang.xiu === moon.tang.xiu, `sun=${sun.tang.xiuName} moon=${moon.tang.xiuName}`);

console.log('6. terrestrial Chinese ground frame round-trip (lat/long -> du -> lat/long)');
let maxLatErr = 0, maxLonErr = 0;
for (let lat = -90; lat <= 90; lat += 3.3) {
  for (let lon = -180; lon <= 180; lon += 11) {
    const g = groundDegToTang(lat, lon);
    const back = groundTangToDeg(g);
    maxLatErr = Math.max(maxLatErr, Math.abs(back.latDeg - lat));
    maxLonErr = Math.max(maxLonErr, Math.abs(back.lonDeg - lon));
  }
}
check('ground lat round-trip < 1e-9', maxLatErr < 1e-9, `maxLatErr=${maxLatErr}`);
check('ground lon round-trip < 1e-9', maxLonErr < 1e-9, `maxLonErr=${maxLonErr}`);
const g32 = groundDegToTang(32, -100.8387);
check('lat 32 deg -> polar-alt du', approx(g32.polarAltDu, 32 * DU_PER_DEG, 1e-9), `polarAltDu=${g32.polarAltDu.toFixed(4)}`);
check('equator -> 0 du polar-alt', approx(groundDegToTang(0, 0).polarAltDu, 0, 1e-12));

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURE(S)`);
process.exit(fails === 0 ? 0 : 1);
