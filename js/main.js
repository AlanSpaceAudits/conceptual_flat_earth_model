// App bootstrap.

import { FeModel } from './core/app.js';
import { Renderer } from './render/index.js';
import { attachMouseHandler } from './ui/mouseHandler.js';
import { attachKeyboardHandler } from './ui/keyboardHandler.js';
import { buildControlPanel, buildHud, buildTrackerHud } from './ui/controlPanel.js';
import { Demos } from './demos/index.js';
import { attachUrlState } from './ui/urlState.js';

const model = new FeModel();
const canvas = document.getElementById('feCanvas');

// Build UI first so it renders even if WebGL fails.
const demos = new Demos(model);
const viewEl_panel = document.getElementById('view');
buildControlPanel(viewEl_panel, model, demos);
const hudEl = document.getElementById('hud');
buildHud(hudEl, model);
const trackerHudEl = document.getElementById('tracker-hud');
if (trackerHudEl) buildTrackerHud(trackerHudEl, model);

let renderer = null;
try {
  renderer = new Renderer(canvas, model);
  renderer.loadLand().catch((err) => {
    console.warn('Failed to load land data:', err);
  });
  attachMouseHandler(canvas, model);
  attachKeyboardHandler(model);
} catch (err) {
  console.error('WebGL unavailable — 3D view disabled:', err);
  const warn = document.createElement('div');
  warn.style.cssText = 'position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#fff; padding:24px; text-align:center;';
  warn.textContent = 'WebGL could not be initialised. The controls still work; the 3D view is disabled.';
  canvas.parentElement.appendChild(warn);
}

model.update();
model.dispatchEvent(new CustomEvent('update'));

const descDynamicEl = document.querySelector('#desc .desc-dynamic');

// sun elev at anti-transit = −(90 − |lat + dec|)  → 24h day when |lat+dec| > 90
// sun elev at transit      =  (90 − |lat − dec|)  → 24h night when |lat−dec| > 90
function defaultStatus(s, c) {
  const lat = s.ObserverLat;
  const dec = (c.SunDec || 0) * 180 / Math.PI;
  const elev = c.SunAnglesGlobe ? c.SunAnglesGlobe.elevation : 0;
  const latStr = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}`;

  let sun;
  if (elev > 0)        sun = 'sun within observer’s optical vault — daylight';
  else if (elev > -6)  sun = 'sun beyond observer’s optical vault — civil twilight';
  else if (elev > -12) sun = 'sun beyond observer’s optical vault — nautical twilight';
  else if (elev > -18) sun = 'sun beyond observer’s optical vault — astronomical twilight';
  else                 sun = 'sun beyond observer’s optical vault — night';

  if (Math.abs(lat + dec) > 90) return `${latStr} — ${sun} (sun never leaves optical vault).`;
  if (Math.abs(lat - dec) > 90) return `${latStr} — ${sun} (sun never enters optical vault).`;
  return `${latStr} — ${sun}.`;
}

model.addEventListener('update', () => {
  descDynamicEl.textContent =
    model.state.Description || defaultStatus(model.state, model.computed);
});

const logoEl = document.getElementById('logo');
if (logoEl) {
  const syncLogo = () => { logoEl.style.display = model.state.ShowLogo === false ? 'none' : ''; };
  model.addEventListener('update', syncLogo);
  syncLogo();
}

// Optical-mode entry snap: FOV 75° + pitch 7.5° so 45° sits at the viewport top.
const OPTICAL_ENTRY_ZOOM  = 1.0;
const OPTICAL_ENTRY_PITCH = 7.5;
// Heavenly-mode snap when leaving Optical with an active FollowTarget:
// bird's-eye preset so the disc is visible with the tracked body's
// ground point near the centre. User can then pan manually.
const HEAVENLY_TRACK_PITCH = 80.3;
const HEAVENLY_TRACK_DIST  = 10;
const HEAVENLY_TRACK_ZOOM  = 4.67;
let _prevInsideVault = !!model.state.InsideVault;
model.addEventListener('update', () => {
  const now = !!model.state.InsideVault;
  if (now && !_prevInsideVault) {
    model.setState({
      OpticalZoom:  OPTICAL_ENTRY_ZOOM,
      CameraHeight: OPTICAL_ENTRY_PITCH,
    });
  } else if (!now && _prevInsideVault && model.state.FollowTarget) {
    model.setState({
      CameraHeight:   HEAVENLY_TRACK_PITCH,
      CameraDistance: HEAVENLY_TRACK_DIST,
      Zoom:           HEAVENLY_TRACK_ZOOM,
    });
  }
  _prevInsideVault = now;
});

// Cadence chip: current wheel-step / FOV / heading in Optical mode only.
const cadenceChip = document.createElement('div');
cadenceChip.id = 'cadence-chip';
cadenceChip.style.cssText = `
  position: absolute;
  top: 8px;
  right: 12px;
  pointer-events: none;
  font: 12px/1.4 ui-monospace, Menlo, monospace;
  color: #f4a640;
  background: rgba(10, 14, 22, 0.78);
  border: 1px solid rgba(244, 166, 64, 0.4);
  border-radius: 6px;
  padding: 4px 10px;
  z-index: 10;
  display: none;
`;
const viewEl = document.getElementById('view');
if (viewEl) viewEl.appendChild(cadenceChip);

// Matches refinedAzCadenceForFov in worldObjects.js and
// opticalCadenceStepDeg in mouseHandler.js.
function activeCadenceLabel(fovDeg) {
  if (fovDeg >= 30) return '15°';
  if (fovDeg >= 8)  return '5°';
  return '1°';
}

model.addEventListener('update', () => {
  if (!cadenceChip) return;
  const s = model.state;
  if (!s.InsideVault) {
    cadenceChip.style.display = 'none';
    return;
  }
  const zoom = Math.max(0.2, s.OpticalZoom || 5.09);
  const fov  = Math.max(1, Math.min(75, 75 / zoom));
  const heading = ((s.ObserverHeading || 0) % 360 + 360) % 360;
  cadenceChip.textContent =
    `Step: ${activeCadenceLabel(fov)}  ·  FOV ${fov.toFixed(1)}°  ·  `
    + `Facing ${heading.toFixed(1)}°`;
  cadenceChip.style.display = '';
});

// When switching to a chart starfield, auto-disable constellation overlays
// (they fight the chart's built-in art). Only triggers on the transition.
let _prevStarfieldType = model.state.StarfieldType || 'random';
model.addEventListener('update', () => {
  const st = model.state.StarfieldType || 'random';
  if (st !== _prevStarfieldType) {
    const movingToChart = _prevStarfieldType === 'random' && st !== 'random';
    _prevStarfieldType = st;
    if (movingToChart
        && (model.state.ShowConstellations || model.state.ShowConstellationLines)) {
      model.setState({ ShowConstellations: false, ShowConstellationLines: false });
    }
  }
});

const infoBtn   = document.querySelector('header .info-btn');
const infoPopup = document.querySelector('header .info-popup');
if (infoBtn && infoPopup) {
  infoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    infoPopup.hidden = !infoPopup.hidden;
  });
  document.addEventListener('click', (e) => {
    if (!infoPopup.hidden && !infoPopup.contains(e.target) && e.target !== infoBtn) {
      infoPopup.hidden = true;
    }
  });
}

attachUrlState(model, demos);

// Meeus-moon warning banner: Meeus Ch.47 moon is ~2.5° off DE405.
// HelioC / GeoC use it directly; VSOP87 delegates its moon to Meeus.
const MEEUS_BODY_SOURCES = new Set(['heliocentric', 'geocentric', 'vsop87']);
const meeusBannerEl = document.getElementById('meeus-warning');
function syncMeeusBanner() {
  if (!meeusBannerEl) return;
  const src = model.state.BodySource || 'geocentric';
  const isMeeus = MEEUS_BODY_SOURCES.has(src);
  meeusBannerEl.hidden = !isMeeus;
  if (isMeeus) {
    meeusBannerEl.innerHTML =
      `<strong>Meeus timing error.</strong> Active source uses the Meeus Ch.47 moon, `
      + `which is ~2.5° off DE405. Eclipse demos in this mode land roughly 4 hours `
      + `from the real UTC moment.`;
  }
}
model.addEventListener('update', syncMeeusBanner);
syncMeeusBanner();

window.model = model;
window.renderer = renderer;
window.demos = demos;
