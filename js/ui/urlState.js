// URL hash <-> FeModel state persistence.
// Only the observable scalar state fields are round-tripped.

const PERSISTED_KEYS = [
  'ObserverLat', 'ObserverLong', 'ObserverElevation',
  'Zoom', 'OpticalZoom',
  'CameraDirection', 'CameraHeight', 'CameraDistance',
  'DateTime', 'VaultSize', 'VaultHeight',
  'OpticalVaultSize', 'OpticalVaultHeight',
  'RayParameter',
  'ShowFeGrid', 'ShowShadow', 'ShowVault', 'ShowVaultGrid', 'ShowSunTrack',
  'ShowMoonTrack', 'ShowOpticalVault', 'ShowStars', 'ShowVaultRays',
  'ShowOpticalVaultRays', 'ShowManyRays', 'ShowTruePositions',
  'ShowLatitudeLines', 'ShowGroundPoints', 'ShowPlanets', 'ShowLogo',
  'ShowConstellations', 'ShowConstellationLines',
  'ShowLongitudeRing', 'ShowAzimuthRing',
  'DynamicStars',
  'TimezoneOffsetMinutes',
  'StarfieldVaultHeight', 'MoonVaultHeight', 'SunVaultHeight',
  'MercuryVaultHeight', 'VenusVaultHeight', 'MarsVaultHeight',
  'JupiterVaultHeight', 'SaturnVaultHeight',
  'ObserverFigure',
  'Cosmology',
  'MapProjection',
  'StarfieldType',
  // S009 / S009a
  'BodySource', 'PermanentNight', 'TrackerTargets',
  // S014 / S017 / S017b — star-correction toggles (independent bools)
  'StarApplyPrecession', 'StarApplyNutation', 'StarApplyAberration',
  'StarTrepidation',
];

const STRING_KEYS = new Set([
  'ObserverFigure', 'Cosmology', 'MapProjection', 'StarfieldType',
  'BodySource',
]);

// S009a — keys whose state value is an array of strings. Serialised
// as a comma-joined string in the URL hash.
const ARRAY_KEYS = new Set(['TrackerTargets']);

function stateToParams(state) {
  const p = new URLSearchParams();
  for (const k of PERSISTED_KEYS) {
    const v = state[k];
    if (v == null) continue;
    if (ARRAY_KEYS.has(k)) {
      if (Array.isArray(v) && v.length) p.set(k, v.join(','));
    }
    else if (typeof v === 'boolean') p.set(k, v ? '1' : '0');
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
    if (ARRAY_KEYS.has(k)) patch[k] = s.length ? s.split(',') : [];
    else if (STRING_KEYS.has(k)) patch[k] = s;
    else if (s === '0' || s === '1') patch[k] = s === '1';
    else patch[k] = parseFloat(s);
  }
  return patch;
}

// S201 — schema version stamped into every URL write. On load, if the
// URL's `v` is missing or lower than CURRENT, the keys listed below
// are dropped from the restored patch so the initial state defaults
// (e.g. BodySource = 'astropixels') take effect. Bumps of this
// constant should be documented in the change log when a default
// changes in a way users can't immediately tell from the URL itself.
const URL_SCHEMA_VERSION = '201';
const VERSION_GATED_KEYS = new Set(['BodySource']);

export function attachUrlState(model, demos) {
  // Initial restore
  const initHash = window.location.hash.replace(/^#/, '');
  if (initHash) {
    const params = new URLSearchParams(initHash);
    const patch = paramsToPatch(params);

    // S201 — schema-version gate. If URL is stamped with an older
    // schema (or none), drop keys whose defaults have changed since.
    const urlV = params.get('v');
    if (urlV !== URL_SCHEMA_VERSION) {
      for (const k of VERSION_GATED_KEYS) delete patch[k];
    }

    if (Object.keys(patch).length) model.setState(patch);

    const demoIdx = params.get('demo');
    if (demoIdx != null && demos) demos.play(parseInt(demoIdx, 10));
  }

  let timer = null;
  const write = () => {
    const p = stateToParams(model.state);
    p.set('v', URL_SCHEMA_VERSION);
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
