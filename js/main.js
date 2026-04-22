// App bootstrap.

import { FeModel } from './core/app.js';
import { Renderer } from './render/index.js';
import { attachMouseHandler } from './ui/mouseHandler.js';
import { buildControlPanel, buildHud } from './ui/controlPanel.js';
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
// condition (day / twilight band / night), with a 24h annotation when
// the observer's latitude is polar enough that the sun never sets or
// never rises at the current declination.
//   sun elev at anti-transit = −(90 − |lat + dec|)  → 24h day when |lat+dec| > 90
//   sun elev at transit      =  (90 − |lat − dec|)  → 24h night when |lat−dec| > 90
function defaultStatus(s, c) {
  const lat = s.ObserverLat;
  const dec = (c.SunDec || 0) * 180 / Math.PI;
  const elev = c.SunAnglesGlobe ? c.SunAnglesGlobe.elevation : 0;
  const latStr = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}`;

  let sun;
  if (elev > 0) sun = `sun ${elev.toFixed(1)}° above horizon — daylight`;
  else if (elev > -6)  sun = `sun ${(-elev).toFixed(1)}° below horizon — civil twilight`;
  else if (elev > -12) sun = `sun ${(-elev).toFixed(1)}° below horizon — nautical twilight`;
  else if (elev > -18) sun = `sun ${(-elev).toFixed(1)}° below horizon — astronomical twilight`;
  else sun = `sun ${(-elev).toFixed(1)}° below horizon — night`;

  if (Math.abs(lat + dec) > 90) return `${latStr} — ${sun} (24-hour daylight).`;
  if (Math.abs(lat - dec) > 90) return `${latStr} — ${sun} (24-hour night).`;
  return `${latStr} — ${sun}.`;
}

model.addEventListener('update', () => {
  // Demo-triggered descriptions take priority; otherwise fall back to the
  // computed polar-day/night status so the line still reads usefully for
  // any observer position.
  descDynamicEl.textContent =
    model.state.Description || defaultStatus(model.state, model.computed);
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

// Expose for debugging from the console.
window.model = model;
window.renderer = renderer;
window.demos = demos;
