// Numerical-equivalence harness for the FE/GE interpreter extraction.
// Dumps every FE and GE computed coordinate for a fixed set of
// (observer, date, world-model) cases. Run before and after the refactor;
// the two outputs must be byte-identical.
// Usage: node scripts/snapshot.mjs > /tmp/before.json   (then ... after.json)

import { FeModel } from '../js/core/app.js';

const CASES = [
  { ObserverLat: 32, ObserverLong: -100, DateTime: 2700, WorldModel: 'fe' },
  { ObserverLat: 32, ObserverLong: -100, DateTime: 2700, WorldModel: 'ge' },
  { ObserverLat: -45, ObserverLong: 150, DateTime: 3001.4, WorldModel: 'fe' },
  { ObserverLat: 70, ObserverLong: 10, DateTime: 1880.2, WorldModel: 'ge' },
  { ObserverLat: 0, ObserverLong: 0, DateTime: 2555.5, WorldModel: 'fe', Refraction: 'bennett' },
];

const r = (v) => Array.isArray(v) ? v.map((x) => +x.toFixed(10)) : (typeof v === 'number' ? +v.toFixed(10) : v);

const out = [];
for (const c of CASES) {
  const m = new FeModel();
  m.setState(c, false);
  m.update();   // second pass so optical-vault dims (one-frame lag) are populated
  const cm = m.computed;
  const body = (p) => ({
    Vault: r(cm[`${p}VaultCoord`]),
    Optical: r(cm[`${p}OpticalVaultCoord`]),
    OpticalTrue: r(cm[`${p}OpticalVaultCoordTrue`]),
    GlobeVault: r(cm[`${p}GlobeVaultCoord`]),
    GlobeOptical: r(cm[`${p}GlobeOpticalVaultCoord`]),
    GlobeOpticalTrue: r(cm[`${p}GlobeOpticalVaultCoordTrue`]),
  });
  const planets = {};
  for (const [k, v] of Object.entries(cm.Planets || {})) {
    planets[k] = {
      vaultCoord: r(v.vaultCoord), globeVaultCoord: r(v.globeVaultCoord),
      opticalVaultCoord: r(v.opticalVaultCoord), globeOpticalVaultCoord: r(v.globeOpticalVaultCoord),
      opticalVaultCoordTrue: r(v.opticalVaultCoordTrue), globeOpticalVaultCoordTrue: r(v.globeOpticalVaultCoordTrue),
    };
  }
  out.push({
    case: c,
    GlobeObserverFrame: cm.GlobeObserverFrame ? Object.fromEntries(Object.entries(cm.GlobeObserverFrame).map(([k, v]) => [k, +v.toFixed(10)])) : null,
    GlobeObserverCoord: r(cm.GlobeObserverCoord),
    GlobeVaultRadius: r(cm.GlobeVaultRadius),
    Sun: body('Sun'), Moon: body('Moon'), Planets: planets,
  });
}
console.log(JSON.stringify(out, null, 1));
