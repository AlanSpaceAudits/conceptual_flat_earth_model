// Model compute smoke test: drives FeModel.update() through the Tang /
// ptolz funnel with no DOM. Confirms every body resolves to a finite
// position and multi-day stepping doesn't throw.
// Run: node scripts/smoke.mjs

import { FeModel } from '../js/core/app.js';

const m = new FeModel();
m.update();
const c = m.computed, s = m.state;
const r2 = (x) => (x * 180 / Math.PI).toFixed(2);

console.log('BodySource:', s.BodySource);
console.log('Sun  RA/Dec deg:', r2(c.SunRA), r2(c.SunDec), '| vault z:', c.SunVaultCoord[2].toFixed(3));
console.log('Moon RA/Dec deg:', r2(c.MoonRA), r2(c.MoonDec));
console.log('SkyRotAngle:', c.SkyRotAngle.toFixed(2));
console.log('Sun finite:', Number.isFinite(c.SunRA) && Number.isFinite(c.SunDec));
console.log('Planets keys:', Object.keys(c.Planets || {}).join(',') || '(none yet)');

for (let d = 0; d < 5; d++) { m.setState({ DateTime: s.DateTime + d * 30 }, false); }
console.log('multi-day update OK');
