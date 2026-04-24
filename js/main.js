// App bootstrap.

import { FeModel } from './core/app.js';
import { Renderer } from './render/index.js';
import { attachMouseHandler } from './ui/mouseHandler.js';
import { buildControlPanel, buildHud, buildTrackerHud } from './ui/controlPanel.js';
import { Demos } from './demos/index.js';
import { attachUrlState } from './ui/urlState.js';

const model = new FeModel();
const canvas = document.getElementById('feCanvas');

// Build UI first so it still renders if WebGL is unavailable.
const demos = new Demos(model);
const panelEl = document.getElementById('panel');
buildControlPanel(panelEl, model, demos);
const hudEl = document.getElementById('hud');
buildHud(hudEl, model);
// S009 — second HUD panel for the Tracker. Sits below #hud and is
// hidden whenever TrackerTarget === 'none'.
const trackerHudEl = document.getElementById('tracker-hud');
if (trackerHudEl) buildTrackerHud(trackerHudEl, model);

let renderer = null;
try {
  renderer = new Renderer(canvas, model);
  renderer.loadLand().catch((err) => {
    console.warn('Failed to load land data:', err);
  });
  attachMouseHandler(canvas, model);
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

// Default footer status — observer latitude plus the current sun
// condition, framed in terms of whether the sun is inside or outside
// the observer's optical vault rather than above/below any horizon.
// The 24h annotation applies when the observer's latitude is polar
// enough that the sun never leaves (or never enters) the optical vault
// at the current declination.
//   sun elev at anti-transit = −(90 − |lat + dec|)  → 24h day when |lat+dec| > 90
//   sun elev at transit      =  (90 − |lat − dec|)  → 24h night when |lat−dec| > 90
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
  // Demo-triggered descriptions take priority; otherwise fall back to the
  // computed polar-day/night status so the line still reads usefully for
  // any observer position.
  descDynamicEl.textContent =
    model.state.Description || defaultStatus(model.state, model.computed);
});

const logoEl = document.getElementById('logo');
if (logoEl) {
  const syncLogo = () => { logoEl.style.display = model.state.ShowLogo === false ? 'none' : ''; };
  model.addEventListener('update', syncLogo);
  syncLogo();
}

// S002 — Optical vault entry default. When the user transitions
// FROM Heavenly INTO Optical, snap OpticalZoom to 5.09 (the desired
// entry zoom) unless they already have a non-default value. Orbit
// Zoom is never touched here, so switching modes never blows out
// the Heavenly camera.
// S006b — also snap CameraHeight (pitch) to 10° on entry. With
// CameraHeight = 0 (horizon) and FOV 14.74°, the 9° vertical slice
// of the view only intersects the bottom ~5° of the 90° active-
// meridian arc, so the arc reads as a tiny stub and the user can't
// see the ground-line continuing into the sky. A 10° uptilt puts
// segments 13-15 of the 16-segment arc inside the visible band, so
// the yellow guide visibly rises from the horizon on the very first
// frame after entering Optical. The user can still drag to pitch
// back down to the horizon if they want.
// S006c — entry at FOV 37.5° (OpticalZoom = 2.0) lands in the 15°
// coarse regime, matching the user's requested ladder: start at 15°,
// wheel in to 5° (FOV < 30°), wheel further to 1° (FOV < 8°). The
// previous entry zoom of 5.09 landed directly in the 5° regime, which
// skipped the 15° inspection layer.
//
// S211 — entry now lands at FOV 75° (OpticalZoom = 1, max zoom out)
// with pitch 7.5° so the top of the viewport sits at elevation 45°.
// That gives a full horizon-to-45° reading band as the user's
// requested baseline — paired with the elevation-scale cadence
// (15° at FOV ≥ 30°) so labels 0°/15°/30°/45° all land on screen
// on entry.
const OPTICAL_ENTRY_ZOOM  = 1.0;
const OPTICAL_ENTRY_PITCH = 7.5;
let _prevInsideVault = !!model.state.InsideVault;
model.addEventListener('update', () => {
  const now = !!model.state.InsideVault;
  if (now && !_prevInsideVault) {
    model.setState({
      OpticalZoom:  OPTICAL_ENTRY_ZOOM,
      CameraHeight: OPTICAL_ENTRY_PITCH,
    });
  }
  _prevInsideVault = now;
});

// S002 — Active-cadence HUD chip. Shows the current angular step
// the Optical wheel is operating in (15° / 1° / 1' / 1"). Visible
// only in Optical mode.
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

// S006 (revised — S006b) — three-tier ladder: static 15° wire,
// refined 5°, refined 1°. Matches refinedAzCadenceForFov in
// worldObjects.js and opticalCadenceStepDeg in mouseHandler.js.
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

// When the user switches the starfield from random to a chart, auto-
// uncheck the constellation overlays so they don't fight with the chart's
// own built-in constellation art. We only act on the transition — if the
// user manually re-enables them while a chart is active, we leave them.
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

// Header info button: toggle the conceptual-model description popup.
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

// S200 — Meeus warning banner.
//
// The banner is shown whenever the active BodySource depends on the
// Meeus moon (which is currently ~2.5° off DE405; tracked as Task #147).
// HelioC and GeoC use Meeus directly; VSOP87 delegates the moon to
// Meeus. AstroPixels and Ptolemy each have their own moon and don't
// trigger the warning.
//
// The text is shown in red at the bottom of the #view pane. Eclipse
// demos in those modes will land at the wrong UTC moment, by roughly
// 4 hours, because the finder uses the same Meeus moon.
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

// Expose for debugging from the console.
window.model = model;
window.renderer = renderer;
window.demos = demos;
