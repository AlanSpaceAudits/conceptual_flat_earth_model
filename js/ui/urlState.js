// URL hash <-> FeModel state persistence.
// Only observable scalar state fields are round-tripped.

const PERSISTED_KEYS = [
  'ObserverLat', 'ObserverLong', 'ObserverElevation',
  'Zoom', 'OpticalZoom',
  'CameraDirection', 'CameraHeight', 'CameraDistance',
  'DateTime', 'VaultSize', 'VaultHeight',
  'OpticalVaultSize', 'OpticalVaultHeight',
  'RayParameter',
  'ShowFeGrid', 'ShowShadow', 'ShowVault', 'ShowVaultGrid', 'ShowSunTrack',
  'ShowMoonTrack', 'ShowOpticalVault', 'ShowStars', 'ShowVaultRays',
  'ShowOpticalVaultRays', 'ShowManyRays', 'ShowProjectionRays', 'ShowTruePositions',
  'ShowLatitudeLines', 'ShowGroundPoints', 'ShowPlanets', 'ShowLogo',
  'ShowConstellations', 'ShowConstellationLines',
  'ShowLongitudeRing', 'ShowAzimuthRing', 'ShowOpticalVaultGrid',
  'ShowCelestialPoles', 'DarkBackground',
  'ShowLiveEphemeris', 'MoonPhaseExpanded',
  'DynamicStars',
  'TimezoneOffsetMinutes',
  'StarfieldVaultHeight', 'MoonVaultHeight', 'SunVaultHeight',
  'MercuryVaultHeight', 'VenusVaultHeight', 'MarsVaultHeight',
  'JupiterVaultHeight', 'SaturnVaultHeight',
  'UranusVaultHeight', 'NeptuneVaultHeight',
  'ObserverFigure',
  'Cosmology',
  'MapProjection',
  'StarfieldType',
  'BodySource', 'PermanentNight', 'TrackerTargets',
  'ShowEphemerisReadings', 'SpecifiedTrackerMode', 'TrackerGPOverride',
  'StarApplyPrecession', 'StarApplyNutation', 'StarApplyAberration',
  'StarTrepidation',
];

const STRING_KEYS = new Set([
  'ObserverFigure', 'Cosmology', 'MapProjection', 'StarfieldType',
  'BodySource',
]);

// Comma-joined in the URL hash.
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

// Bump when a default changes and existing URL hashes should drop that key.
const URL_SCHEMA_VERSION = '275';
const VERSION_GATED_KEYS = new Set([
  'ShowLiveEphemeris', 'MoonPhaseExpanded',
  'BodySource',
  'ObserverLat', 'ObserverLong', 'ObserverHeading',
  'CameraDirection', 'CameraHeight', 'Zoom',
  'DateTime', 'VaultHeight', 'OpticalVaultHeight',
  'RayParameter',
  'TimezoneOffsetMinutes', 'ObserverFigure',
  'ShowFeGrid', 'ShowLatitudeLines', 'ShowGroundPoints',
  'ShowVault', 'ShowVaultGrid', 'ShowTruePositions', 'ShowFacingVector',
  'ShowVaultRays', 'ShowOpticalVaultRays',
  'ShowDecCircles', 'ShowLongitudeRing', 'ShowAzimuthRing',
  'ShowOpticalVaultGrid', 'ShowCelestialPoles', 'DarkBackground',
  'MapProjection', 'StarfieldType', 'PermanentNight', 'TrackerTargets',
  'MercuryVaultHeight', 'VenusVaultHeight', 'MarsVaultHeight',
  'JupiterVaultHeight', 'SaturnVaultHeight',
  'UranusVaultHeight', 'NeptuneVaultHeight',
  'MoonVaultHeight', 'SunVaultHeight',
  'OpticalZoom',
]);

export function attachUrlState(model, demos) {
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

  const initHash = window.location.hash.replace(/^#/, '');
  let schemaMismatch = false;
  if (initHash) {
    const params = new URLSearchParams(initHash);
    const patch = paramsToPatch(params);

    const urlV = params.get('v');
    if (urlV !== URL_SCHEMA_VERSION) {
      schemaMismatch = true;
      for (const k of VERSION_GATED_KEYS) delete patch[k];
    }

    if (Object.keys(patch).length) model.setState(patch);
  }

  // Autoplay ticks at ~60 Hz reset the debounce every frame, so the
  // timer-based write never settles while it's running. Force one
  // synchronous write on schema mismatch so the new version stamps.
  if (schemaMismatch) write();

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
