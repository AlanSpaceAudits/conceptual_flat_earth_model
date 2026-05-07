// App bootstrap.

import { FeModel } from './core/app.js';
import { Renderer } from './render/index.js';
import { attachMouseHandler } from './ui/mouseHandler.js';
import { attachKeyboardHandler } from './ui/keyboardHandler.js';
import { buildControlPanel, buildHud, buildTrackerHud } from './ui/controlPanel.js';
import { buildTrackingInfoPopup } from './ui/trackingInfoPopup.js';
import { Demos } from './demos/index.js';
import { ExperimentManager } from './experiments/index.js';
import { attachUrlState } from './ui/urlState.js';
import { setActiveProjection } from './core/canonical.js';
import { t, onLangChange, isRtl } from './ui/i18n.js';

const model = new FeModel();
const canvas = document.getElementById('feCanvas');

// Build UI first so it renders even if WebGL fails.
const demos = new Demos(model);
const experiments = new ExperimentManager(model);
const viewEl_panel = document.getElementById('view');
buildControlPanel(viewEl_panel, model, demos, experiments);
const hudEl = document.getElementById('hud');
buildHud(hudEl, model);
const trackerHudEl = document.getElementById('tracker-hud');
if (trackerHudEl) buildTrackerHud(trackerHudEl, model);
const trackingInfoEl = document.getElementById('tracking-info-popup');
if (trackingInfoEl) buildTrackingInfoPopup(trackingInfoEl, model);

// First load only: pick a language from navigator.languages so the
// page boots in the visitor's browser locale when they have no
// stored Language in the URL hash.
const _hashHasLang = window.location.hash.includes('Language=');
if (!_hashHasLang) {
  const SUPPORTED = new Set(['en','cs','es','fr','de','it','pt','pl','nl','sk','ru','ar','he','zh','ja','ko','th','hi']);
  const prefs = (navigator.languages && navigator.languages.length)
    ? navigator.languages
    : [navigator.language || 'en'];
  for (const p of prefs) {
    const id = (p || '').toLowerCase().split('-')[0];
    if (SUPPORTED.has(id)) {
      model.setState({ Language: id });
      break;
    }
  }
}

// Routes WorldModel → canonical.js' active-projection slot. Only
// world models that opt into `useProjectionGrid` (currently `dp`
// and `cp`) override the canonical north-pole AE framework;
// FE/GE keep the default. Registered before the Renderer so its
// 'update' listener runs first and rebuilds DiscGrid /
// LatitudeLines using the new projection.
let _prevWorldModel = null;
const refreshActiveProjection = () => {
  const wm = model.state.WorldModel;
  setActiveProjection(wm === 'dp' ? 'dp' : wm === 'cp' ? 'canters_w20' : null);
  // Entering CP: snap the observer to the Canters texture's
  // baked centre so they're guaranteed on the visible projection
  // and don't have to scroll back from a previous FE / DP spot.
  if (wm === 'cp' && _prevWorldModel !== 'cp') {
    model.setState({ ObserverLat: 40.71, ObserverLong: -104.01 });
  }
  _prevWorldModel = wm;
};
model.addEventListener('update', refreshActiveProjection);
refreshActiveProjection();

// Feature-detect WebGL before instantiating the Renderer. THREE's
// constructor logs `console.error` ("WebGLRenderer: A WebGL context
// could not be created") *before* throwing on environments without
// a GPU (headless Chrome / Lighthouse, locked-down kiosks). Catching
// the throw doesn't suppress the error, which Lighthouse counts
// against Best Practices. Probing first lets us route those
// environments straight to the fallback message without invoking
// THREE at all.
const _hasWebGL = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
})();

let renderer = null;
if (_hasWebGL) {
  try {
    renderer = new Renderer(canvas, model);
    experiments.attachRenderer(renderer);
    renderer.loadLand().catch((err) => {
      console.warn('Failed to load land data:', err);
    });
    attachMouseHandler(canvas, model, renderer);
    attachKeyboardHandler(model);
  } catch (err) {
    console.warn('WebGL unavailable — 3D view disabled:', err);
    renderer = null;
  }
}
if (!renderer) {
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
  if (elev > 0)        sun = `${t('within_vault')} — ${t('daylight')}`;
  else if (elev > -6)  sun = `${t('beyond_vault')} — ${t('twilight_civil')}`;
  else if (elev > -12) sun = `${t('beyond_vault')} — ${t('twilight_nautical')}`;
  else if (elev > -18) sun = `${t('beyond_vault')} — ${t('twilight_astronomical')}`;
  else                 sun = `${t('beyond_vault')} — ${t('night')}`;

  if (Math.abs(lat + dec) > 90) return `${latStr} — ${sun} ${t('sun_never_leaves')}.`;
  if (Math.abs(lat - dec) > 90) return `${latStr} — ${sun} ${t('sun_never_enters')}.`;
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
    if (model.state.FollowTarget) {
      // Entering Optical while tracking: keep the default zoom but
      // don't apply the horizon-pitch snap — the follow listener in
      // mouseHandler re-aims heading/pitch at the target the very
      // next update, so the body stays centred on screen.
      model.setState({
        OpticalZoom: OPTICAL_ENTRY_ZOOM,
        FreeCamActive: false,
      });
    } else {
      model.setState({
        OpticalZoom:  OPTICAL_ENTRY_ZOOM,
        CameraHeight: OPTICAL_ENTRY_PITCH,
      });
    }
  } else if (!now && _prevInsideVault && model.state.FollowTarget) {
    model.setState({
      CameraHeight:   HEAVENLY_TRACK_PITCH,
      CameraDistance: HEAVENLY_TRACK_DIST,
      Zoom:           HEAVENLY_TRACK_ZOOM,
      FreeCamActive:  true,
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
  zoom: var(--ui-zoom);
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


const aboutBtn    = document.getElementById('about-btn');
const aboutPopup  = document.getElementById('about-popup');
const legendBtn   = document.getElementById('legend-btn');
const legendPopup = document.getElementById('legend-popup');
const infoBoxBtns = [aboutBtn, legendBtn].filter(Boolean);
const infoBoxPopups = [aboutPopup, legendPopup].filter(Boolean);

function openInfoPopup(popup) {
  for (const p of infoBoxPopups) p.hidden = (p !== popup) ? true : !p.hidden;
}

if (aboutBtn && aboutPopup) {
  aboutBtn.addEventListener('click', (e) => { e.stopPropagation(); openInfoPopup(aboutPopup); });
}
if (legendBtn && legendPopup) {
  // Translatable legend: try `about_<lang>.md` for the current
  // language; fall back to `about.md` (English) if missing.
  // Re-fetch + re-render when the language changes.
  let legendLoadedLang = null;
  let legendLoading = null;
  const loadLegend = async () => {
    const lang = model.state.Language || 'en';
    if (legendLoadedLang === lang) return;
    if (legendLoading) await legendLoading;
    legendLoading = (async () => {
      let md = null;
      if (lang !== 'en') {
        try {
          const res = await fetch(`about_${lang}.md`);
          if (res.ok) md = await res.text();
        } catch (_) {}
      }
      if (md == null) {
        try {
          const res = await fetch('about.md');
          if (res.ok) md = await res.text();
        } catch (_) {}
      }
      if (md != null) {
        legendPopup.innerHTML = renderMarkdown(md);
        legendLoadedLang = lang;
      } else {
        legendPopup.textContent = 'Legend unavailable.';
      }
    })();
    await legendLoading;
    legendLoading = null;
  };
  legendBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await loadLegend();
    openInfoPopup(legendPopup);
  });
  // Reload whenever the language changes — invalidate the cached
  // language so the next click (or current open popup) refreshes.
  onLangChange(() => {
    legendLoadedLang = null;
    if (!legendPopup.hidden) loadLegend();
  });
}
document.addEventListener('click', (e) => {
  for (const popup of infoBoxPopups) {
    if (popup.hidden) continue;
    if (popup.contains(e.target)) continue;
    if (infoBoxBtns.some((b) => b && b.contains(e.target))) continue;
    popup.hidden = true;
  }
});

// Tiny markdown renderer — handles headings, paragraphs, bullet
// lists, GFM tables, code spans, and bold / italic. Enough for
// the Legend popup; intentionally minimal.
function renderMarkdown(src) {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;
  const inline = (s) => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/&lt;kbd&gt;([^&]+)&lt;\/kbd&gt;/g, '<kbd>$1</kbd>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  while (i < lines.length) {
    const ln = lines[i];
    if (/^---+\s*$/.test(ln)) { out.push('<hr>'); i++; continue; }
    const h = ln.match(/^(#{1,6})\s+(.*)$/);
    if (h) { out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (ln.startsWith('| ')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i]); i++; }
      if (rows.length >= 2) {
        const split = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        const headers = split(rows[0]);
        const body = rows.slice(2).map(split);
        out.push('<table>');
        out.push('<thead><tr>' + headers.map((h) => `<th>${inline(h)}</th>`).join('') + '</tr></thead>');
        out.push('<tbody>' + body.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody>');
        out.push('</table>');
        continue;
      }
    }
    if (/^[-*]\s+/.test(ln)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^[-*]\s+/, ''))}</li>`);
        i++;
      }
      out.push('<ul>' + items.join('') + '</ul>');
      continue;
    }
    if (ln.trim() === '') { i++; continue; }
    const p = [ln];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#|---|\||[-*]\s)/.test(lines[i])) {
      p.push(lines[i]); i++;
    }
    out.push(`<p>${inline(p.join(' '))}</p>`);
  }
  return out.join('\n');
}

// Translate any data-i18n nodes (About popup paragraphs, etc.).
function refreshI18nNodes() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const k = el.getAttribute('data-i18n');
    el.textContent = t(k);
  });
}
onLangChange(refreshI18nNodes);
refreshI18nNodes();

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

// Translatable header bits.
const _titleEl = document.getElementById('app-title');
const _subEl   = document.getElementById('app-subtitle');
const refreshTitle = () => {
  if (_titleEl) _titleEl.textContent = t('app_title');
  if (_subEl)   _subEl.textContent   = t('app_subtitle');
  document.documentElement.setAttribute('dir', isRtl() ? 'rtl' : 'ltr');
};
onLangChange(refreshTitle);
refreshTitle();

window.model = model;
window.renderer = renderer;
window.demos = demos;
window.experiments = experiments;

// Local verification hook for capture/smoke scripts.
window.__feCapture = {
  model,
  demos,
  experiments,
  get renderer() { return renderer; },
};

// Service-worker registration. CACHE_VERSION inside `sw.js`
// controls eviction; on `controllerchange` (an existing SW was
// replaced by a new one via skipWaiting + clients.claim) we
// auto-reload the page once so the user picks up the fresh JS /
// CSS without manually hard-refreshing.
//
// `_controlledAtStart` records whether this page was already
// controlled by a prior SW when the bootstrap ran. On a brand-new
// visit (no prior SW) the activate handler claims this client and
// `controllerchange` fires for the first claim; reloading there
// would be a wasteful redirect on the very first page load
// (Lighthouse "Avoid multiple page redirects" caught this). The
// page only auto-reloads when an *existing* controller is replaced
// — i.e. the user is upgrading from a previous CACHE_VERSION.
if ('serviceWorker' in navigator) {
  const _controlledAtStart = !!navigator.serviceWorker.controller;
  let _reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!_controlledAtStart) return;
    if (_reloaded) return;
    _reloaded = true;
    window.location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
