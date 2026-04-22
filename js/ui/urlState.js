// URL hash <-> FeModel state persistence.
// Only the observable scalar state fields are round-tripped.

const PERSISTED_KEYS = [
  'ObserverLat', 'ObserverLong', 'Zoom',
  'CameraDirection', 'CameraHeight', 'CameraDistance',
  'DateTime', 'VaultSize', 'VaultHeight',
  'OpticalVaultSize', 'OpticalVaultHeight',
  'RayParameter',
  'ShowFeGrid', 'ShowShadow', 'ShowVaultGrid', 'ShowSunTrack',
  'ShowMoonTrack', 'ShowOpticalVault', 'ShowStars', 'ShowVaultRays',
  'ShowOpticalVaultRays', 'ShowManyRays',
  'ShowLatitudeLines', 'ShowGroundPoints', 'ShowPlanets',
  'DynamicStars',
  'TimezoneOffsetMinutes',
  'StarfieldVaultHeight', 'MoonVaultHeight', 'SunVaultHeight',
  'MercuryVaultHeight', 'VenusVaultHeight', 'MarsVaultHeight',
  'JupiterVaultHeight', 'SaturnVaultHeight',
  'ObserverFigure',
  'Cosmology',
];

const STRING_KEYS = new Set(['ObserverFigure', 'Cosmology']);

function stateToParams(state) {
  const p = new URLSearchParams();
  for (const k of PERSISTED_KEYS) {
    const v = state[k];
    if (v == null) continue;
    if (typeof v === 'boolean') p.set(k, v ? '1' : '0');
    else if (typeof v === 'number') p.set(k, +v.toFixed(4));
    else p.set(k, String(v));
    // String keys already handled by the fall-through branch above.
  }
  return p;
}

function paramsToPatch(params) {
  const patch = {};
  for (const k of PERSISTED_KEYS) {
    const s = params.get(k);
    if (s == null) continue;
    if (STRING_KEYS.has(k)) patch[k] = s;
    else if (s === '0' || s === '1') patch[k] = s === '1';
    else patch[k] = parseFloat(s);
  }
  return patch;
}

export function attachUrlState(model, demos) {
  // Initial restore
  const initHash = window.location.hash.replace(/^#/, '');
  if (initHash) {
    const params = new URLSearchParams(initHash);
    const patch = paramsToPatch(params);
    if (Object.keys(patch).length) model.setState(patch);

    const demoIdx = params.get('demo');
    if (demoIdx != null && demos) demos.play(parseInt(demoIdx, 10));
  }

  let timer = null;
  const write = () => {
    const p = stateToParams(model.state);
    if (demos && demos.currentIndex >= 0) p.set('demo', String(demos.currentIndex));
    const newHash = '#' + p.toString();
    if (newHash !== window.location.hash) {
      history.replaceState(null, '', newHash);
    }
  };
  model.addEventListener('update', () => {
    clearTimeout(timer);
    timer = setTimeout(write, 250);
  });

  window.addEventListener('hashchange', () => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const patch = paramsToPatch(params);
    if (Object.keys(patch).length) model.setState(patch);
  });
}
