// Control panel: tabs + grouped sliders/inputs/checkboxes that bind to the
// FeModel state. No external framework — plain DOM.

import { dateTimeToString, dateTimeToDate } from '../core/time.js';
import { fmtDuFen, fmtLiBuFromLi, haversineLi, KM_PER_LI, R_LI } from '../core/units.js';
import { TIME_ORIGIN } from '../core/constants.js';
import { findNextEclipses } from '../core/ephemeris.js';
import { findNextSolarEclipseAfter } from '../core/solarEclipseSchedule.js';
import { raDecToAzEl } from '../core/transforms.js';
import { CEL_NAV_SELECT_OPTIONS, CEL_NAV_STARS } from '../core/celnavStars.js';
import { CATALOGUED_STARS, CONSTELLATIONS } from '../core/constellations.js';
import { BLACK_HOLES } from '../core/blackHoles.js';
import { QUASARS }     from '../core/quasars.js';
import { GALAXIES }    from '../core/galaxies.js';
import { CEL_THEO_STARS, CEL_THEO_OWN } from '../core/celTheoStars.js';
import { SATELLITES }  from '../core/satellites.js';
import { NAMED_STARS_HYG }    from '../core/_namedStarsHyg.js';
import { NAMED_STARS_HYG_EXTRA } from '../core/_namedStarsHygExtra.js';
import { GALAXIES_EXTRA }     from '../core/galaxiesExtra.js';
import { GALAXIES_EXTRA2 }    from '../core/galaxiesExtra2.js';
import { QUASARS_EXTRA }      from '../core/quasarsExtra.js';
import { QUASARS_EXTRA2 }     from '../core/quasarsExtra2.js';
import { SATELLITES_EXTRA }   from '../core/satellitesExtra.js';
import { listProjections, listGeneratedProjections, listHqMaps, listGeMaps, PROJECTIONS } from '../core/projections.js';
import { Autoplay } from './autoplay.js';
import { t, setLang, onLangChange, LANGUAGES } from './i18n.js';

const LANG_NATIVE_NAMES = {
  en: 'English', cs: 'Čeština', es: 'Español',
  fr: 'Français', de: 'Deutsch', it: 'Italiano',
  pt: 'Português', pl: 'Polski', nl: 'Nederlands',
  sk: 'Slovenčina', ru: 'Русский', ar: 'العربية',
  he: 'עברית', zh: '中文', ja: '日本語',
  ko: '한국어', th: 'ไทย', hi: 'हिन्दी',
};

const PLANET_NAMES = {
  mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter',
  saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
};

// Flat list of every body the search box can target. Built once at
// module load; entries carry the tracker id + display name + the
// accent colour used by the autocomplete chip.
const BODY_SEARCH_INDEX = (() => {
  const out = [];
  out.push({ id: 'sun',  name: 'Sun',  color: '#ffc844' });
  out.push({ id: 'moon', name: 'Moon', color: '#f4f4f4' });
  const planets = [
    ['mercury', 'Mercury', '#d0b090'], ['venus',   'Venus',   '#fff0c8'],
    ['mars',    'Mars',    '#d05040'], ['jupiter', 'Jupiter', '#ffa060'],
    ['saturn',  'Saturn',  '#e4c888'], ['uranus',  'Uranus',  '#a8d8e0'],
    ['neptune', 'Neptune', '#7fa6e8'],
  ];
  for (const [id, name, color] of planets) out.push({ id, name, color });
  for (const s of CEL_NAV_STARS)     out.push({ id: `star:${s.id}`, name: s.name, color: '#ffe8a0' });
  for (const s of CATALOGUED_STARS)  out.push({ id: `star:${s.id}`, name: s.name, color: '#ffffff' });
  for (const b of BLACK_HOLES)       out.push({ id: `star:${b.id}`, name: b.name, color: '#9966ff' });
  for (const q of QUASARS)           out.push({ id: `star:${q.id}`, name: q.name, color: '#40e0d0' });
  for (const g of GALAXIES)          out.push({ id: `star:${g.id}`, name: g.name, color: '#ff80c0' });
  for (const s of CEL_THEO_OWN)      out.push({ id: `star:${s.id}`, name: s.name, color: '#ff8c00' });
  for (const s of SATELLITES)        out.push({ id: `star:${s.id}`, name: s.name, color: '#66ff88' });
  for (const s of NAMED_STARS_HYG)        out.push({ id: `star:${s.id}`, name: s.name, color: '#fff5d8' });
  for (const s of NAMED_STARS_HYG_EXTRA)  out.push({ id: `star:${s.id}`, name: s.name, color: '#fff5d8' });
  for (const g of GALAXIES_EXTRA)         out.push({ id: `star:${g.id}`, name: g.name, color: '#ff80c0' });
  for (const g of GALAXIES_EXTRA2)        out.push({ id: `star:${g.id}`, name: g.name, color: '#ff80c0' });
  for (const q of QUASARS_EXTRA)          out.push({ id: `star:${q.id}`, name: q.name, color: '#40e0d0' });
  for (const q of QUASARS_EXTRA2)         out.push({ id: `star:${q.id}`, name: q.name, color: '#40e0d0' });
  for (const s of SATELLITES_EXTRA)       out.push({ id: `star:${s.id}`, name: s.name, color: '#66ff88' });
  out.push({ id: 'star:pluto', name: 'Pluto', color: '#a07c66' });
  return out;
})();

// star-id → menu-button colour. Lets the Cel Theo menu show
// alias entries (e.g. Regulus, Rigel, Mintaka) in their owning
// catalogue's accent rather than the Cel Theo orange. Falls back
// to orange when the id isn't found in any other catalogue.
const STAR_COLOR_BY_ID = (() => {
  const m = new Map();
  for (const e of BODY_SEARCH_INDEX) {
    if (e.id && e.id.startsWith('star:')) m.set(e.id.slice(5), e.color);
  }
  for (const c of CONSTELLATIONS) {
    for (const st of (c.stars || [])) {
      if (st.id && !m.has(st.id)) m.set(st.id, '#ffffff');
    }
  }
  return m;
})();

function celTheoMenuColor(star) {
  if (star.extId) return STAR_COLOR_BY_ID.get(star.extId) || '#ff8c00';
  return '#ff8c00';
}

function resolveTargetAngles(targetId, c) {
  if (!targetId) return null;
  if (targetId === 'sun')  return c.SunAnglesGlobe  || null;
  if (targetId === 'moon') return c.MoonAnglesGlobe || null;
  if (c.Planets && c.Planets[targetId]) return c.Planets[targetId].anglesGlobe || null;
  if (targetId.startsWith('star:')) {
    const id = targetId.slice(5);
    for (const list of [c.CelNavStars, c.CataloguedStars, c.BlackHoles, c.Quasars, c.Galaxies, c.CelTheoStars]) {
      if (!list) continue;
      const f = list.find((x) => x.id === id);
      if (f) return f.anglesGlobe || null;
    }
  }
  return null;
}

// Position a fixed-positioned suggestion panel just above its
// search input, sized to the input's width. The panel is portalled
// to `<body>` (see `attachBodySearch` / `attachFeatureSearch`) so
// it escapes the `#bottom-bar` stacking context — without that, the
// panel painted underneath `#info-bar` regardless of its z-index.
// `panel.dataset.feSearchInput` is left undefined on purpose: the
// caller passes `input` directly each time.
function positionSearchPanel(panel, input) {
  const r = input.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // CSS owns min/max-width; JS only places the panel. Clamp `left`
  // so the panel never spills off the right edge of the viewport
  // when the input is right-aligned (e.g. narrow phone where the
  // input lives at the far end of a horizontally-scrolled bar).
  const minWidth = 220;
  const left = Math.max(4, Math.min(r.left, vw - minWidth - 4));
  panel.style.left   = `${left}px`;
  panel.style.bottom = `${vh - r.top + 4}px`;
}

// Hide every other open popup (tab popup, About / Legend dialog,
// the *other* search panel) when one of the search inputs is focused
// or starts typing. The active-tab state lives inside `attachBottomBar`
// closures, so we send the `fe-close-active-tab` custom event for that
// scope to react to. `exceptPanel` is the search panel currently being
// activated — it must NOT be closed by this call.
function closeOtherPopups(exceptPanel) {
  for (const id of ['about-popup', 'legend-popup']) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  }
  document.dispatchEvent(new CustomEvent('fe-close-active-tab'));
  document.querySelectorAll('.body-search-panel').forEach((p) => {
    if (p === exceptPanel) return;
    p.hidden = true;
    p.replaceChildren();
  });
}

// Search box + suggestion dropdown. Typing 3+ characters filters the
// index by prefix match (case-insensitive); clicking a suggestion or
// pressing Enter on the highlighted row engages the tracking protocol:
// sets FollowTarget, and in Optical snaps heading/pitch; in Heavenly
// flips FreeCamActive + the bird's-eye preset.
function attachBodySearch(host, model) {
  const wrap = document.createElement('div');
  wrap.className = 'body-search';

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'body-search-input';
  input.placeholder = 'Search body (3+ chars)';
  input.autocomplete = 'off';
  input.spellcheck = false;
  wrap.appendChild(input);

  const panel = document.createElement('div');
  panel.className = 'body-search-panel';
  panel.hidden = true;
  document.body.appendChild(panel);

  host.appendChild(wrap);

  let activeIdx = -1;
  let matches = [];

  const hide = () => {
    panel.hidden = true;
    panel.replaceChildren();
    activeIdx = -1;
    matches = [];
  };

  const engage = (match) => {
    if (!match) return;
    const angles = resolveTargetAngles(match.id, model.computed);
    const patch = { FollowTarget: match.id };
    if (model.state.InsideVault) {
      if (angles) {
        patch.ObserverHeading = ((angles.azimuth % 360) + 360) % 360;
        patch.CameraHeight    = Math.max(0, Math.min(89.9, angles.elevation));
      }
    } else {
      patch.FreeCamActive  = true;
      patch.CameraHeight   = 80.3;
      patch.CameraDistance = 10;
      patch.Zoom           = 4.67;
    }
    model.setState(patch);
    input.value = match.name;
    input.blur();
    hide();
  };

  const renderSuggestions = () => {
    panel.replaceChildren();
    if (!matches.length) { panel.hidden = true; return; }
    matches.forEach((m, i) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'body-search-row';
      if (i === activeIdx) row.classList.add('active');
      row.style.color = m.color;
      row.textContent = m.name;
      row.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        engage(m);
      });
      panel.appendChild(row);
    });
    positionSearchPanel(panel, input);
    panel.hidden = false;
  };
  const reposition = () => {
    if (!panel.hidden) positionSearchPanel(panel, input);
  };
  window.addEventListener('resize', reposition);
  window.addEventListener('scroll', reposition, true);

  input.addEventListener('focus', () => closeOtherPopups(panel));
  input.addEventListener('input', () => {
    closeOtherPopups(panel);
    const q = input.value.trim().toLowerCase();
    if (q.length < 3) { hide(); return; }
    matches = BODY_SEARCH_INDEX
      .filter((m) => m.name.toLowerCase().startsWith(q))
      .slice(0, 12);
    if (!matches.length) {
      const loose = BODY_SEARCH_INDEX
        .filter((m) => m.name.toLowerCase().includes(q))
        .slice(0, 12);
      matches = loose;
    }
    activeIdx = matches.length ? 0 : -1;
    renderSuggestions();
  });

  input.addEventListener('keydown', (e) => {
    if (panel.hidden) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, matches.length - 1);
      renderSuggestions();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      renderSuggestions();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      engage(matches[activeIdx]);
    } else if (e.key === 'Escape') {
      hide();
      input.blur();
    }
  });

  input.addEventListener('blur', () => {
    // Defer so a click on a row still fires before the panel hides.
    setTimeout(hide, 120);
  });
}

// Feature-search: find a settings row / collapsible group by typing
// part of its label. Needs the tab popup registry + `openFeature`
// callback from buildControlPanel because that's where the tab/group
// DOM actually lives. Index is built lazily on first keystroke so
// FIELD_GROUPS has been fully populated.
function attachFeatureSearch(host, openFeature, demos) {
  const wrap = document.createElement('div');
  wrap.className = 'body-search';

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'body-search-input';
  input.placeholder = demos
    ? 'Search settings or demos'
    : 'Search Show / Tracker settings';
  input.autocomplete = 'off';
  input.spellcheck = false;
  wrap.appendChild(input);

  const panel = document.createElement('div');
  panel.className = 'body-search-panel';
  panel.hidden = true;
  document.body.appendChild(panel);

  host.appendChild(wrap);

  let activeIdx = -1;
  let matches = [];
  let index = null;

  const buildIndex = () => {
    const out = [];
    // Search Show + Tracker tabs — where visibility and per-category
    // toggles live. View / Time / Info are intentionally excluded:
    // their settings aren't visibility-related.
    for (const tab of FIELD_GROUPS) {
      if (tab.tab !== 'Show' && tab.tab !== 'Tracker') continue;
      for (const g of tab.groups) {
        out.push({
          kind: 'group',
          tab: tab.tab,
          group: g.title,
          label: g.title,
          matchText: g.title.toLowerCase(),
        });
        for (const row of g.rows) {
          const parts = [];
          if (row.label) parts.push(row.label);
          if (row.buttonLabel) parts.push(row.buttonLabel);
          if (!parts.length) continue;
          const label = parts.join(' / ');
          out.push({
            kind: 'row',
            tab: tab.tab,
            group: g.title,
            label,
            matchText: (label + ' ' + g.title).toLowerCase(),
          });
        }
      }
    }
    // Demos — every entry in the registry indexed by name + group
    // so a query like "analemma 45" or "april 2024" finds the
    // right one. Click of a demo result calls `demos.play(idx)`
    // directly (matching the side-panel button click path) so the
    // tab popup doesn't open at the same time.
    if (demos && Array.isArray(demos.list)) {
      demos.list.forEach((d, idx) => {
        if (!d || !d.name) return;
        out.push({
          kind:  'demo',
          tab:   'Demos',
          group: d.group || 'demo',
          label: d.name,
          index: idx,
          matchText: (d.name + ' ' + (d.group || '')).toLowerCase(),
        });
      });
    }
    return out;
  };

  const hide = () => {
    panel.hidden = true;
    panel.replaceChildren();
    activeIdx = -1;
    matches = [];
  };

  const engage = (match) => {
    if (!match) return;
    if (match.kind === 'demo' && demos && typeof demos.play === 'function') {
      demos.play(match.index);
    } else {
      openFeature(match.tab, match.group);
    }
    input.value = '';
    input.blur();
    hide();
  };

  const renderSuggestions = () => {
    panel.replaceChildren();
    if (!matches.length) { panel.hidden = true; return; }
    matches.forEach((m, i) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'body-search-row';
      if (i === activeIdx) row.classList.add('active');
      row.innerHTML =
        `<span class="feature-row-label">${m.label}</span>`
        + `<span class="feature-row-path">${m.tab} › ${m.group}</span>`;
      row.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        engage(m);
      });
      panel.appendChild(row);
    });
    positionSearchPanel(panel, input);
    panel.hidden = false;
  };
  const reposition = () => {
    if (!panel.hidden) positionSearchPanel(panel, input);
  };
  window.addEventListener('resize', reposition);
  window.addEventListener('scroll', reposition, true);

  input.addEventListener('focus', () => closeOtherPopups(panel));
  input.addEventListener('input', () => {
    closeOtherPopups(panel);
    if (!index) index = buildIndex();
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { hide(); return; }
    const starts = [];
    const contains = [];
    for (const item of index) {
      const mt = item.matchText;
      if (mt.startsWith(q)) starts.push(item);
      else if (mt.includes(q)) contains.push(item);
    }
    matches = [...starts, ...contains].slice(0, 14);
    activeIdx = matches.length ? 0 : -1;
    renderSuggestions();
  });

  input.addEventListener('keydown', (e) => {
    if (panel.hidden) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, matches.length - 1);
      renderSuggestions();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      renderSuggestions();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      engage(matches[activeIdx]);
    } else if (e.key === 'Escape') {
      hide();
      input.blur();
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(hide, 120);
  });
}

function resolveTrackName(targetId) {
  if (!targetId) return null;
  if (targetId === 'sun')  return 'Sun';
  if (targetId === 'moon') return 'Moon';
  if (PLANET_NAMES[targetId]) return PLANET_NAMES[targetId];
  if (targetId.startsWith('star:')) {
    const id = targetId.slice(5);
    for (const arr of [CEL_NAV_STARS, CATALOGUED_STARS, BLACK_HOLES, QUASARS, GALAXIES, SATELLITES]) {
      const hit = arr.find((e) => e.id === id);
      if (hit) return hit.name;
    }
    return id;
  }
  return targetId;
}

// Eclipse cache: the search costs ~10ms worst case, so we memoise until the
// current DateTime passes the cached event (or jumps backward).
let _eclipseCache = null;
function nextEclipses(dateTime) {
  if (_eclipseCache
      && dateTime >= _eclipseCache.from
      && dateTime < _eclipseCache.horizon) {
    return _eclipseCache.result;
  }
  const fromDate = dateTimeToDate(dateTime);
  const result = findNextEclipses(fromDate);
  // Refresh when current date passes either eclipse, or after 30 days.
  const eventDTs = [];
  if (result.nextSolar) {
    eventDTs.push(result.nextSolar.getTime() / TIME_ORIGIN.msPerDay - TIME_ORIGIN.ZeroDate);
  }
  if (result.nextLunar) {
    eventDTs.push(result.nextLunar.getTime() / TIME_ORIGIN.msPerDay - TIME_ORIGIN.ZeroDate);
  }
  const horizon = eventDTs.length
    ? Math.min(...eventDTs)
    : dateTime + 30;
  _eclipseCache = { from: dateTime - 0.01, horizon, result };
  return result;
}

function formatCountdown(fromDate, toDate) {
  const diffMs = toDate.getTime() - fromDate.getTime();
  if (diffMs <= 0) return 'now';
  const days = diffMs / 86400000;
  if (days < 1) {
    const hours = diffMs / 3600000;
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `in ${h}h ${m}m`;
  }
  if (days < 60) return `in ${Math.floor(days)} days`;
  return `in ${Math.floor(days / 30.4375)} months`;
}

const ECLIPSE_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function shortDate(d) {
  return `${ECLIPSE_MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, '0')} ${d.getUTCFullYear()}`;
}

// Common named timezone offsets (minutes east of UTC). Fixed offsets, no DST.
const TIMEZONES = [
  { label: 'UTC',                      min:    0 },
  { label: 'HST  (UTC-10)',            min: -600 },
  { label: 'AKST (UTC-9)',             min: -540 },
  { label: 'PST  (UTC-8)',             min: -480 },
  { label: 'MST  (UTC-7)',             min: -420 },
  { label: 'CST  (UTC-6)',             min: -360 },
  { label: 'EST  (UTC-5)',             min: -300 },
  { label: 'AST  (UTC-4)',             min: -240 },
  { label: 'BRT  (UTC-3)',             min: -180 },
  { label: 'GMT  (UTC+0)',             min:    0 },
  { label: 'CET  (UTC+1)',             min:   60 },
  { label: 'EET  (UTC+2)',             min:  120 },
  { label: 'MSK  (UTC+3)',             min:  180 },
  { label: 'GST  (UTC+4)',             min:  240 },
  { label: 'IST  (UTC+5:30)',          min:  330 },
  { label: 'CST  (UTC+8)',             min:  480 },
  { label: 'JST  (UTC+9)',             min:  540 },
  { label: 'AEST (UTC+10)',            min:  600 },
  { label: 'NZST (UTC+12)',            min:  720 },
];

// Date + time + timezone: inputs show local wall-clock in the selected zone;
// DateTime in the model is always stored as UTC.
//
// changing the TZ dropdown now **shifts the UTC instant** so the
// displayed wall-clock stays put (Path B: hold-local-clock, move-UTC).
// This matches the workflow users expect when cross-checking against
// Stellarium: enter a local time for an observation site, flip TZs,
// and watch the sky move by the corresponding number of hours. The
// Date / Time inputs (below) still take the wall-clock as being in the
// currently-selected zone when committing edits, so typing a new value
// commits the same UTC instant that timezoneRow would produce.
function dateTimeRow(model) {
  const el = document.createElement('div');
  el.className = 'row datetime';
  el.innerHTML = `<label>Date / time</label>
    <input type="date" class="date">
    <input type="time" class="time" step="1">`;
  bindTranslatable(el.querySelector('label'), 'Date / time', LABEL_KEY);
  const dateEl = el.querySelector('input.date');
  const timeEl = el.querySelector('input.time');

  function refresh() {
    const offMin = model.state.TimezoneOffsetMinutes || 0;
    // Shift the UTC instant by +offset to get the wall-clock in that zone.
    const shifted = new Date(
      dateTimeToDate(model.state.DateTime).getTime() + offMin * 60000,
    );
    const yyyy = shifted.getUTCFullYear().toString().padStart(4, '0');
    const mm   = (shifted.getUTCMonth() + 1).toString().padStart(2, '0');
    const dd   = shifted.getUTCDate().toString().padStart(2, '0');
    const hh   = shifted.getUTCHours().toString().padStart(2, '0');
    const mi   = shifted.getUTCMinutes().toString().padStart(2, '0');
    const ss   = shifted.getUTCSeconds().toString().padStart(2, '0');
    dateEl.value = `${yyyy}-${mm}-${dd}`;
    timeEl.value = `${hh}:${mi}:${ss}`;
  }
  function commit() {
    if (!dateEl.value || !timeEl.value) return;
    const offMin = model.state.TimezoneOffsetMinutes || 0;
    const [Y, M, D]      = dateEl.value.split('-').map(Number);
    const [h, mi, s = 0] = timeEl.value.split(':').map(Number);
    // Take the entered wall-clock as being in the selected zone; subtract the
    // zone offset to recover the UTC instant.
    const wallMs = Date.UTC(Y, M - 1, D, h, mi, s || 0);
    const utcMs  = wallMs - offMin * 60000;
    const dt = utcMs / TIME_ORIGIN.msPerDay - TIME_ORIGIN.ZeroDate;
    model.setState({ DateTime: dt });
  }
  dateEl.addEventListener('change', commit);
  timeEl.addEventListener('change', commit);
  model.addEventListener('update', refresh);
  refresh();
  return el;
}

function timezoneRow(model) {
  const el = document.createElement('div');
  el.className = 'row bool';
  const opts = TIMEZONES.map(z => `<option value="${z.min}">${z.label}</option>`).join('');
  el.innerHTML = `<label>Timezone</label><select class="sel">${opts}</select>`;
  bindTranslatable(el.querySelector('label'), 'Timezone', LABEL_KEY);
  const sel = el.querySelector('select');
  function refresh() { sel.value = String(model.state.TimezoneOffsetMinutes || 0); }
  sel.addEventListener('change', () => {
    // Path B: flipping the timezone holds the DISPLAYED
    // wall-clock constant and shifts the underlying UTC instant by
    // the delta. Derivation: local = UTC + offset. If local is to
    // stay the same across the change, UTC_new = UTC_old − (offset_new
    // − offset_old). Convert the delta from minutes to DateTime's
    // day units (1 day = 1440 min). This is what you want for
    // Stellarium-parity workflows: set a local observation time,
    // switch zones, and the sky moves to what a local clock at the
    // same nominal time would see at the new longitude.
    const newOff = parseInt(sel.value, 10);
    const oldOff = model.state.TimezoneOffsetMinutes || 0;
    const deltaMin  = newOff - oldOff;
    const deltaDays = deltaMin / (60 * 24);
    model.setState({
      TimezoneOffsetMinutes: newOff,
      DateTime: (model.state.DateTime || 0) - deltaDays,
    });
  });
  model.addEventListener('update', refresh);
  refresh();
  return el;
}

const FIELD_GROUPS = [
  {
    tab: 'View', groups: [
      { title: 'Observer', rows: [
        { key: 'ObserverFigure', label: 'Figure', select: [
          { value: 'male',     label: 'Male' },
          { value: 'female',   label: 'Female' },
          { value: 'turtle',   label: 'Turtle' },
          { value: 'bear',     label: 'Bear' },
          { value: 'llama',    label: 'Llama' },
          { value: 'goose',    label: 'Goose' },
          { value: 'cat',      label: 'Black Cat' },
          { value: 'drmike',   label: 'Great Pyrenees' },
          { value: 'owl',      label: 'Owl' },
          { value: 'frog',     label: 'Frog' },
          { value: 'kangaroo', label: 'Kangaroo' },
          { value: 'nikki',    label: 'Not Nikki Minaj' },
          { value: 'none',     label: 'None' },
        ]},
        // step 0.0001° ≈ 0.36" so the number field gives
        // sub-arcsecond granularity (needed for Stellarium-parity
        // tests at a specific observatory / nav-fix coordinate).
        { key: 'ObserverLat',  label: 'ObserverLat',  unit: '°', min: -90,  max:  90,  step: 0.0001 },
        { key: 'ObserverLong', label: 'ObserverLong', unit: '°', min: -180, max: 180,  step: 0.0001 },
        // Observer.Elevation now represents the observer's
        // gaze pitch (elevation angle above the horizon), 0°–90°.
        // Bound to `CameraHeight`, which drives the first-person
        // look-up/down in Optical mode (it's also the orbit-elevation
        // key in Heavenly, but the 0–90 range reads the same way
        // there — angle above the disc plane). 0° = looking at the
        // horizon; 90° = looking straight up. The mouse-drag pitch
        // updates this slider in real time and vice versa.
        //
        // The physical `ObserverElevation` state field (, observer
        // height above the disc) still exists and is still URL-
        // persisted and clamped in `app.update()`; it just isn't
        // bound to this row anymore.
        { key: 'CameraHeight', label: 'Elevation', unit: '°', min: 0, max: 90, step: 0.1 },
        // "Facing" row renamed to "Azi" and moved up directly
        // under Elevation so the observer's own angular pair reads
        // together (Elevation + Azi) before the cursor-tracking pair
        // (Mouse El + Mouse Az) below it.
        { key: 'ObserverHeading', label: 'Azi',       unit: '°', min: 0,    max: 360,  step: 0.0001, cardinal: true },
        // live cursor elevation readout. Tracks the elevation
        // of the ray from the observer through the mouse pointer
        // while the pointer is over the canvas in Optical mode. Shows
        // "—" in Heavenly or when the pointer is off-canvas.
        { key: 'MouseElevation', label: 'Mouse El', unit: '°', readout: true, digits: 1 },
        // companion cursor azimuth readout (compass degrees CW
        // from north, wrapped to [0, 360)).
        { key: 'MouseAzimuth',   label: 'Mouse Az', unit: '°', readout: true, digits: 1 },
        { key: 'ObserverHeading', label: 'Nudge', nudge: [
          { delta:  1,        label: '+1°' },
          { delta: -1,        label: '−1°' },
          { delta:  1/60,     label: "+1'" },
          { delta: -1/60,     label: "−1'" },
          { delta:  1/3600,   label: '+1"' },
          { delta: -1/3600,   label: '−1"' },
        ], wrap360: true },
        { key: 'InsideVault', label: '', action: {
          enterLabel: 'Heavenly Vault', exitLabel: 'Optical Vault',
        } },
      ]},
      { title: 'Camera', rows: [
        { key: 'CameraDirection', label: 'CameraDir',    unit: '°', min: -180, max: 180, step: 0.1 },
        { key: 'CameraHeight',    label: 'CameraHeight', unit: '°', min: -30,  max: 89.9, step: 0.1 },
        { key: 'CameraDistance',  label: 'CameraDist',   unit: '',  min: 2,    max: 100,  step: 0.1 },
        { key: 'Zoom',            label: 'Zoom',         unit: 'x', min: 0.1,  max: 10,   step: 0.01 },
      ]},
      { title: 'Vault of the Heavens', rows: [
        { key: 'VaultSize',   label: 'VaultSize',   unit: '', min: 1,   max: 5,   step: 0.01 },
        { key: 'VaultHeight', label: 'VaultHeight', unit: '', min: 0.1, max: 1.0, step: 0.001 },
      ]},
      { title: 'Optical Vault', rows: [
        { key: 'OpticalVaultSize',   label: 'Size',   unit: '', min: 0.1,  max: 1.0, step: 0.01 },
        { key: 'OpticalVaultHeight', label: 'Height', unit: '', min: 0.05, max: 1.0, step: 0.01 },
      ]},
      { title: 'Body Vaults', rows: [
        { key: 'StarfieldVaultHeight', label: 'Starfield', unit: '', min: 0.05, max: 1.0, step: 0.001 },
        { key: 'MoonVaultHeight',      label: 'Moon',      unit: '', min: 0.05, max: 1.0, step: 0.001 },
        { key: 'SunVaultHeight',       label: 'Sun',       unit: '', min: 0.05, max: 1.0, step: 0.001 },
        { key: 'MercuryVaultHeight',   label: 'Mercury',   unit: '', min: 0.05, max: 1.0, step: 0.001 },
        { key: 'VenusVaultHeight',     label: 'Venus',     unit: '', min: 0.05, max: 1.0, step: 0.001 },
        { key: 'MarsVaultHeight',      label: 'Mars',      unit: '', min: 0.05, max: 1.0, step: 0.001 },
        { key: 'JupiterVaultHeight',   label: 'Jupiter',   unit: '', min: 0.05, max: 1.0, step: 0.001 },
        { key: 'SaturnVaultHeight',    label: 'Saturn',    unit: '', min: 0.05, max: 1.0, step: 0.001 },
        // 
        { key: 'UranusVaultHeight',    label: 'Uranus',    unit: '', min: 0.05, max: 1.0, step: 0.001 },
        { key: 'NeptuneVaultHeight',   label: 'Neptune',   unit: '', min: 0.05, max: 1.0, step: 0.001 },
      ]},
      { title: 'Rays', rows: [
        { key: 'RayParameter', label: 'RayParam', unit: '', min: 0.5, max: 2.0, step: 0.01 },
      ]},
    ],
  },
  {
    tab: 'Time', groups: [
      { title: 'Date / Time', rows: [
        { key: 'DayOfYear', label: 'DayOfYear', unit: 'd', min: 0, max: 365, step: 1 },
        { key: 'Time',      label: 'Time',      unit: 'h', min: 0, max: 24, step: 0.01 },
        { key: 'DateTime',  label: 'DateTime',  unit: 'd', min: -3650, max: 36500, step: 0.01 },
      ]},
    ],
  },
  {
    tab: 'Show', groups: [
      { title: 'Heavenly Vault', rows: [
        { key: 'ShowVaultGrid',       label: 'Vault Grid',         bool: true },
      ]},
      { title: 'Ground / Disc', rows: [
        { key: 'ShowFeGrid',           label: 'FE Grid',                 bool: true },
        { key: 'ShowTropicCancer',     label: 'Tropic of Cancer',        bool: true },
        { key: 'ShowEquator',          label: 'Equator',                 bool: true },
        { key: 'ShowTropicCapricorn',  label: 'Tropic of Capricorn',     bool: true },
        { key: 'ShowPolarCircles',     label: 'Polar Circles',           bool: true },
        { key: 'ShowLatLineInfo',      label: 'Display Info',            bool: true },
        { key: 'ShowTangSphereDims',   label: 'Tang Sphere Dimensions',  bool: true },
        { key: 'ShowGroundPoints',     label: 'Sun / Moon GP',           bool: true },
        { key: 'ShowShadow',           label: 'Shadow',                  bool: true },
        { key: 'ShowLongitudeRing',    label: 'Heavenly Vault Azi',      bool: true },
      ]},
      { title: 'Rays', rows: [
        { key: 'ShowVaultRays',        label: 'Vault Rays',         bool: true },
        { key: 'ShowOpticalVaultRays', label: 'Optical Vault Rays', bool: true },
        { key: 'ShowProjectionRays',   label: 'Projection Rays',    bool: true },
        { key: 'ShowManyRays',         label: 'Many Rays',          bool: true },
      ]},
      { title: 'Cosmology', rows: [
        { key: 'Cosmology', label: 'Axis Mundi',
          select: ['none', 'yggdrasil', 'meru', 'vortex', 'vortex2', 'discworld'] },
      ]},
      { title: 'Map Projection', rows: [
        { pairSelect: true,
          leftKey:  'MapProjection',
          rightKey: 'MapProjectionGe',
          left:  { label: 'FE Map', select: [
            ...listGeneratedProjections(),
            ...listHqMaps(),
          ]},
          right: { label: 'GE Map', select: listGeMaps() },
        },
      ]},
      { title: 'Misc', rows: [
        { key: 'DarkBackground',  label: 'Dark Background',  bool: true },
        { key: 'ShowLogo',        label: 'Logo',             bool: true },
        { key: 'ShowTooltips',    label: 'Mouseover Tooltips', bool: true },
      ]},
    ],
  },
  // dedicated Tracker tab. Manual-select dropdown (sun, moon,
  // five planets, 58 Cel Nav stars) feeds the second HUD panel's
  // azimuth/elevation/RA/Dec readout. Also exposes BodySource so the
  // can toggle the helioc vs geoc pipeline and see readouts are
  // consistent.
  // Tracker tab. Multi-select button grid; toggling
  // each button adds/removes its id from `TrackerTargets`. Every
  // tracked object gets a block in the HUD with both ephemerides and
  // a coloured GP on the disc.
  {
    tab: 'Tracker', groups: [
      { title: 'Ephemeris', rows: [
        { key: 'BodySource', label: 'Source', select: [
          { value: 'geocentric',   label: 'GeoC     (Earth-focus Kepler)' },
          { value: 'ptolemy',      label: 'Ptolemy  (deferent + epicycle)' },
          { value: 'astropixels',  label: 'DE405    (Espenak AstroPixels)' },
          { value: 'vsop87',       label: 'VSOP87   (Bretagnon & Francou)' },
        ]},
        { key: 'ShowEphemerisReadings', label: 'Ephemeris comparison', bool: true },
        { key: 'StarApplyPrecession', label: 'Precession',  bool: true },
        { key: 'StarApplyNutation',   label: 'Nutation',    bool: true },
        { key: 'StarApplyAberration', label: 'Aberration',  bool: true },
        { key: 'StarTrepidation',     label: 'Trepidation', bool: true },
      ]},
      { title: 'Starfield', rows: [
        { key: 'StarfieldType', label: 'Starfield', select: [
          { value: 'random',      label: 'Default (random)' },
          { value: 'chart-dark',  label: 'Chart (dark)' },
          { value: 'chart-light', label: 'Chart (light)' },
          { value: 'celnav',      label: 'Cel Nav (named stars)' },
          { value: 'ae_aries',    label: 'AE Aries' },
          { value: 'ae_aries_2',  label: 'AE Aries 2' },
          { value: 'ae_aries_3',  label: 'AE Aries 3' },
          { value: 'alphabeta',   label: 'Alpabeta Field' },
        ]},
        { key: 'DynamicStars', label: 'Starfield Mode',
          boolSelect: { trueLabel: 'Dynamic (fade w/ day)', falseLabel: 'Static (always visible)' } },
        { key: 'PermanentNight', label: 'Permanent night', bool: true },
      ]},
      { title: 'Tracker Options', rows: [
        { actions: [
          { buttonLabel: 'Clear All',
            onClick: (m) => m.setState({
              TrackerTargets: [],
              ShowConstellationLines: false,
            }) },
          { buttonLabel: 'Track All',
            onClick: (m) => m.setState({
              TrackerTargets: [
                'sun', 'moon',
                'mercury', 'venus', 'mars', 'jupiter',
                'saturn', 'uranus', 'neptune',
                ...CEL_NAV_STARS.map((x) => `star:${x.id}`),
                ...CATALOGUED_STARS.map((x) => `star:${x.id}`),
                ...BLACK_HOLES.map((x) => `star:${x.id}`),
                ...QUASARS.map((x) => `star:${x.id}`),
                ...GALAXIES.map((x) => `star:${x.id}`),
                ...SATELLITES.map((x) => `star:${x.id}`),
              ],
              ShowCelNav: true, ShowBlackHoles: true,
              ShowQuasars: true, ShowGalaxies: true,
              ShowSatellites: true,
            }) },
          { buttonLabel: 'Clear Trace',
            onClick: (m) => m.setState({ ClearTraceCount: (m.state.ClearTraceCount | 0) + 1 }) },
        ]},
        { key: 'ShowStars',            label: 'Stars (master)',           bool: true },
        { key: 'ShowCelestialBodies',  label: 'Celestial Bodies (master)', bool: true },
        { key: 'ShowVault',            label: 'Heavenly Vault',           bool: true },
        { key: 'ShowOpticalVault',     label: 'Optical Vault',            bool: true },
        { key: 'ShowTruePositions',    label: 'True Positions',           bool: true },
        { key: 'ShowGPTracer',         label: 'Trace GP',                 bool: true },
        { key: 'ShowOpticalVaultTrace', label: 'Trace Optical Vault',     bool: true },
        { key: 'ShowTraceUnder',       label: 'Show Under',               bool: true },
        { key: 'SpecifiedTrackerMode', label: 'Specified Tracker Mode',   bool: true },
        { key: 'TrackerGPOverride',    label: 'GP Override',              bool: true },
        { key: 'ShowSunTrack',         label: 'Sun Track',                bool: true },
        { key: 'ShowMoonTrack',        label: 'Moon Track',               bool: true },
        { key: 'ShowOpticalVaultGrid', label: 'Optical Vault Grid',       bool: true },
        { key: 'ShowAzimuthRing',      label: 'Azimuth ring',             bool: true },
        { key: 'ShowFacingVector',     label: 'Facing Vector / N-S-E-W',  bool: true },
        { key: 'ShowCelestialPoles',   label: 'Celestial Poles',          bool: true },
        { key: 'ShowDecCircles',       label: 'Declination Circles',      bool: true },
        { key: 'ShowGPPath',           label: 'GP Path',                  bool: true },
        { key: 'GPPathDays',           label: 'GP Path Span (days)', unit: '', min: 1, max: 1095, step: 1 },
        { key: 'ShowCentralAngle',     label: 'Central Angle',            bool: true },
        { key: 'ShowInscribedAngle',   label: 'Inscribed Angle',          bool: true },
        { key: 'ShowStellariumOverlay', label: 'Stellarium Overlay',      bool: true },
        { key: 'ShowSunMoonNine',      label: 'Sun / Moon "9" Glyph',     bool: true },
        { key: 'ShowDomeCaustic',      label: 'Dome Caustic',             bool: true },
      ]},
      { title: 'Refraction', rows: [
        { key: 'Refraction', label: '"Astronomical"', select: [
          { value: 'off',       label: 'Off' },
          { value: 'bennett',   label: 'Bennett' },
          { value: 'seidelman', label: 'Seidelman' },
        ]},
        { key: 'ShowGeocentricPosition', label: 'Show Geocentric Position', bool: true },
        { key: 'RefractionPressureMbar', label: 'Pressure', unit: 'mbar',
          min: 800, max: 1100, step: 0.25 },
        { key: 'RefractionTemperatureC', label: 'Temperature', unit: '°C',
          min: -40, max: 50, step: 0.5 },
      ]},
      { title: 'Display Units', rows: [
        { key: 'ShowChineseDu', label: 'Chinese du / fen', bool: true },
      ]},
      { title: 'Celestial Bodies', rows: [
        { key: 'GPOverridePlanets', label: 'GP Override', bool: true },
        { label: '', buttonLabel: 'Enable All',
          onClick: (m) => m.setState({
            TrackerTargets: [
              ...new Set([
                ...(Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : []),
                'sun', 'moon', 'mercury', 'venus', 'mars',
                'jupiter', 'saturn', 'uranus', 'neptune',
              ]),
            ],
          }) },
        { label: '', buttonLabel: 'Disable All',
          onClick: (m) => {
            const ids = new Set(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune']);
            const cur = Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : [];
            m.setState({ TrackerTargets: cur.filter((t) => !ids.has(t)) });
          } },
        { key: 'TrackerTargets', label: '', buttonGrid: [
          { value: 'sun',     label: 'Sun',     color: '#ffc844' },
          { value: 'moon',    label: 'Moon',    color: '#f4f4f4' },
          { value: 'mercury', label: 'Mercury', color: '#d0b090' },
          { value: 'venus',   label: 'Venus',   color: '#fff0c8' },
          { value: 'mars',    label: 'Mars',    color: '#d05040' },
          { value: 'jupiter', label: 'Jupiter', color: '#ffa060' },
          { value: 'saturn',  label: 'Saturn',  color: '#e4c888' },
          { value: 'uranus',  label: 'Uranus',  color: '#a8d8e0' },
          { value: 'neptune', label: 'Neptune', color: '#7fa6e8' },
        ]},
      ]},
      { title: 'Cel Nav', rows: [
        { key: 'GPOverrideCelNav', label: 'GP Override', bool: true },
        { label: '', buttonLabel: 'Enable All',
          onClick: (m) => m.setState({
            TrackerTargets: [
              ...new Set([
                ...(Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : []),
                ...CEL_NAV_STARS.map((s) => `star:${s.id}`),
              ]),
            ],
            ShowCelNav: true,
          }) },
        { label: '', buttonLabel: 'Disable All',
          onClick: (m) => {
            const ids = new Set(CEL_NAV_STARS.map((s) => `star:${s.id}`));
            const cur = Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : [];
            m.setState({ TrackerTargets: cur.filter((t) => !ids.has(t)) });
          } },
        { key: 'TrackerTargets', label: '', buttonGrid:
          [...CEL_NAV_STARS]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((s) => ({ value: `star:${s.id}`, label: s.name, color: '#ffe8a0' })),
        },
      ]},
      { title: 'Constellations', rows: [
        { key: 'ShowConstellationLines', label: 'Outlines', bool: true },
        { key: 'GPOverrideConstellations', label: 'GP Override', bool: true },
        // Constellation-name row: clicking a name toggles every
        // star in that constellation in `TrackerTargets`. Stars
        // already in the set are removed (toggle-off); otherwise
        // the constellation's full roster is added. The
        // "Orion's Belt" entry at the head of the list is a
        // sub-asterism — three stars (Mintaka, Alnilam, Alnitak),
        // no extra constellation line, since Orion's own outline
        // already draws them when its parent toggle is on.
        { layout: 'wrap', actions: [
          {
            buttonLabel: "Orion's Belt",
            onClick: (m) => {
              const ids = ['star:mintaka', 'star:alnilam', 'star:alnitak'];
              const cur = Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : [];
              const set = new Set(cur);
              const allIn = ids.every((id) => set.has(id));
              if (allIn) {
                const drop = new Set(ids);
                m.setState({ TrackerTargets: cur.filter((t) => !drop.has(t)) });
              } else {
                for (const id of ids) set.add(id);
                m.setState({
                  TrackerTargets: [...set],
                  ShowConstellationLines: true,
                });
              }
            },
          },
          ...CONSTELLATIONS.map((con) => ({
            buttonLabel: con.name,
            onClick: (m) => {
              const ids = con.stars.map((st) => `star:${st.celnav || st.id}`);
              const cur = Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : [];
              const set = new Set(cur);
              const allIn = ids.every((id) => set.has(id));
              if (allIn) {
                const drop = new Set(ids);
                m.setState({ TrackerTargets: cur.filter((t) => !drop.has(t)) });
              } else {
                for (const id of ids) set.add(id);
                m.setState({
                  TrackerTargets: [...set],
                  ShowConstellationLines: true,
                });
              }
            },
          })),
        ] },
        { label: '', buttonLabel: 'Enable All',
          onClick: (m) => {
            const celnavIds = new Set(CEL_NAV_STARS.map((s) => s.id));
            m.setState({
              TrackerTargets: [
                ...new Set([
                  ...(Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : []),
                  ...CATALOGUED_STARS
                    .filter((s) => !celnavIds.has(s.id))
                    .map((s) => `star:${s.id}`),
                ]),
              ],
            });
          } },
        { label: '', buttonLabel: 'Disable All',
          onClick: (m) => {
            const celnavIds = new Set(CEL_NAV_STARS.map((s) => s.id));
            const ids = new Set(
              CATALOGUED_STARS.filter((s) => !celnavIds.has(s.id)).map((s) => `star:${s.id}`),
            );
            const cur = Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : [];
            m.setState({ TrackerTargets: cur.filter((t) => !ids.has(t)) });
          } },
        { key: 'TrackerTargets', label: '', buttonGrid:
          (() => {
            // Union of every constellation-member star, regardless
            // of whether the membership came via a `celnav` link
            // (entry borrowed from `CEL_NAV_STARS`) or a standalone
            // `id` (entry living in `CATALOGUED_STARS`). Cel-nav
            // overlap stars are tinted with the cel-nav yellow so
            // they read at a glance vs the white constellation-only
            // stars.
            const celById = new Map(CEL_NAV_STARS.map((s) => [s.id, s]));
            const catById = new Map(CATALOGUED_STARS.map((s) => [s.id, s]));
            const seen = new Set();
            const list = [];
            for (const con of CONSTELLATIONS) {
              for (const st of con.stars) {
                const id = st.celnav || st.id;
                if (!id || seen.has(id)) continue;
                seen.add(id);
                const fromCel = celById.get(id);
                const ref = fromCel || catById.get(id);
                if (!ref) continue;
                list.push({
                  value: `star:${id}`,
                  label: ref.name,
                  color: fromCel ? '#ffe8a0' : '#ffffff',
                });
              }
            }
            list.sort((a, b) => a.label.localeCompare(b.label));
            return list;
          })(),
        },
      ]},
      { title: 'Black Holes', rows: [
        { key: 'GPOverrideBlackHoles', label: 'GP Override', bool: true },
        { label: '', buttonLabel: 'Enable All',
          onClick: (m) => m.setState({
            TrackerTargets: [
              ...new Set([
                ...(Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : []),
                ...BLACK_HOLES.map((b) => `star:${b.id}`),
              ]),
            ],
            ShowBlackHoles: true,
          }) },
        { label: '', buttonLabel: 'Disable All',
          onClick: (m) => {
            const ids = new Set(BLACK_HOLES.map((b) => `star:${b.id}`));
            const cur = Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : [];
            m.setState({ TrackerTargets: cur.filter((t) => !ids.has(t)) });
          } },
        { key: 'TrackerTargets', label: '', buttonGrid:
          [...BLACK_HOLES]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((b) => ({ value: `star:${b.id}`, label: b.name, color: '#9966ff' })),
        },
      ]},
      { title: 'Quasars', rows: [
        { key: 'GPOverrideQuasars', label: 'GP Override', bool: true },
        { label: '', buttonLabel: 'Enable All',
          onClick: (m) => m.setState({
            TrackerTargets: [
              ...new Set([
                ...(Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : []),
                ...QUASARS.map((q) => `star:${q.id}`),
              ]),
            ],
            ShowQuasars: true,
          }) },
        { label: '', buttonLabel: 'Disable All',
          onClick: (m) => {
            const ids = new Set(QUASARS.map((q) => `star:${q.id}`));
            const cur = Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : [];
            m.setState({ TrackerTargets: cur.filter((t) => !ids.has(t)) });
          } },
        { key: 'TrackerTargets', label: '', buttonGrid:
          [...QUASARS]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((q) => ({ value: `star:${q.id}`, label: q.name, color: '#40e0d0' })),
        },
      ]},
      { title: 'Galaxies', rows: [
        { key: 'GPOverrideGalaxies', label: 'GP Override', bool: true },
        { label: '', buttonLabel: 'Enable All',
          onClick: (m) => m.setState({
            TrackerTargets: [
              ...new Set([
                ...(Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : []),
                ...GALAXIES.map((g) => `star:${g.id}`),
              ]),
            ],
            ShowGalaxies: true,
          }) },
        { label: '', buttonLabel: 'Disable All',
          onClick: (m) => {
            const ids = new Set(GALAXIES.map((g) => `star:${g.id}`));
            const cur = Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : [];
            m.setState({ TrackerTargets: cur.filter((t) => !ids.has(t)) });
          } },
        { key: 'TrackerTargets', label: '', buttonGrid:
          [...GALAXIES]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((g) => ({ value: `star:${g.id}`, label: g.name, color: '#ff80c0' })),
        },
      ]},
      { title: 'Cel Theo', rows: [
        { key: 'ShowCelTheo', label: 'Show', bool: true },
        { label: '', buttonLabel: 'Enable All',
          onClick: (m) => m.setState({
            TrackerTargets: [
              ...new Set([
                ...(Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : []),
                ...CEL_THEO_STARS.map((s) => `star:${s.extId || s.id}`),
              ]),
            ],
            ShowCelTheo: true,
          }) },
        { label: '', buttonLabel: 'Disable All',
          onClick: (m) => {
            const ids = new Set(CEL_THEO_STARS.map((s) => `star:${s.extId || s.id}`));
            const cur = Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : [];
            m.setState({ TrackerTargets: cur.filter((t) => !ids.has(t)) });
          } },
        { key: 'TrackerTargets', label: '', buttonGrid:
          // Preserve user-supplied order (not alphabetised) — the
          // sequence on Roohif's celestial-theodolite list reflects
          // the observation timeline.
          CEL_THEO_STARS.map((s) => ({
            value: `star:${s.extId || s.id}`,
            label: s.name,
            color: celTheoMenuColor(s),
          })),
        },
      ]},
      { title: 'Satellites', rows: [
        { key: 'GPOverrideSatellites', label: 'GP Override', bool: true },
        { label: '', buttonLabel: 'Enable All',
          onClick: (m) => m.setState({
            TrackerTargets: [
              ...new Set([
                ...(Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : []),
                ...SATELLITES.map((x) => `star:${x.id}`),
              ]),
            ],
            ShowSatellites: true,
          }) },
        { label: '', buttonLabel: 'Disable All',
          onClick: (m) => {
            const ids = new Set(SATELLITES.map((x) => `star:${x.id}`));
            const cur = Array.isArray(m.state.TrackerTargets) ? m.state.TrackerTargets : [];
            m.setState({ TrackerTargets: cur.filter((t) => !ids.has(t)) });
          } },
        { key: 'TrackerTargets', label: '', buttonGrid:
          [...SATELLITES]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((x) => ({ value: `star:${x.id}`, label: x.name, color: '#66ff88' })),
        },
      ]},
    ],
  },
];

function numericRow(model, row) {
  const el = document.createElement('div');
  el.className = 'row';
  el.innerHTML = `<label>${row.label}</label>
    <input type="number" class="num" min="${row.min}" max="${row.max}" step="${row.step}">
    <span class="unit">${row.unit}</span>
    <input type="range" class="slider" min="${row.min}" max="${row.max}" step="${row.step}">`;
  const numEl   = el.querySelector('input.num');
  const rangeEl = el.querySelector('input.slider');
  const digits  = Math.max(0, Math.ceil(-Math.log10(row.step)));
  let editing = false;
  function refresh() {
    const v = model.state[row.key];
    rangeEl.value = v;
    if (!editing) {
      numEl.value = Number.isFinite(v) ? (+v).toFixed(digits) : v;
    }
  }
  // Slider drives setState live; number field commits on Enter or blur so
  // you can type a full value without the slider fighting you mid-edit.
  rangeEl.addEventListener('input', () => {
    model.setState({ [row.key]: parseFloat(rangeEl.value) });
  });
  numEl.addEventListener('focus', () => { editing = true; });
  const commit = () => {
    editing = false;
    const v = parseFloat(numEl.value);
    if (!Number.isNaN(v)) model.setState({ [row.key]: v });
    else refresh();
  };
  numEl.addEventListener('blur', commit);
  numEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { numEl.blur(); }
    if (e.key === 'Escape') { editing = false; refresh(); numEl.blur(); }
  });
  model.addEventListener('update', refresh);
  refresh();
  return el;
}

// read-only display row. Mirrors one state field, formats its
// numeric value at `row.digits` decimals, shows a placeholder when the
// value is `null` / undefined. No slider, no editable input — just
// labelled text for live readouts.
function readoutRow(model, row) {
  const el = document.createElement('div');
  el.className = 'row';
  el.innerHTML = `<label>${row.label}</label>
    <input type="text" class="num" readonly>
    <span class="unit">${row.unit || ''}</span>`;
  const numEl = el.querySelector('input.num');
  const digits = row.digits != null ? row.digits : 2;
  const placeholder = row.placeholder != null ? row.placeholder : '—';
  function refresh() {
    const v = model.state[row.key];
    numEl.value = (v == null || !Number.isFinite(v))
      ? placeholder
      : (+v).toFixed(digits);
  }
  model.addEventListener('update', refresh);
  refresh();
  return el;
}

function selectRow(model, row) {
  const el = document.createElement('div');
  el.className = 'row bool';
  // Each option can be a plain string (value == label) or { value, label }.
  const opts = row.select.map((o) => {
    const value = typeof o === 'string' ? o : o.value;
    const label = typeof o === 'string' ? o : (o.label ?? o.value);
    return `<option value="${value}">${label}</option>`;
  }).join('');
  el.innerHTML = `<label>${row.label}</label><select class="sel">${opts}</select>`;
  const sel = el.querySelector('select');
  function refresh() { sel.value = String(model.state[row.key]); }
  sel.addEventListener('change', () => model.setState({ [row.key]: sel.value }));
  model.addEventListener('update', refresh);
  refresh();
  return el;
}

// Heading row: numeric slider + four cardinal toggles (N/E/S/W). Each button
// is a toggle for the facing vector at that direction:
//   click an inactive cardinal → ShowFacingVector on + heading snaps, button
//                                turns orange (active);
//   click the active cardinal  → ShowFacingVector off, button returns to
//                                its normal colour.
// The numeric slider still lets a pick any intermediate heading; the
// active cardinal then de-activates because the heading no longer matches.
function cardinalRow(model, row) {
  const wrap = document.createElement('div');
  wrap.className = 'cardinal-row';
  wrap.appendChild(numericRow(model, row));

  const btns = document.createElement('div');
  btns.className = 'row cardinal-buttons';
  btns.innerHTML = `<label></label>
    <button data-h="0">N</button>
    <button data-h="90">E</button>
    <button data-h="180">S</button>
    <button data-h="270">W</button>`;
  const buttons = Array.from(btns.querySelectorAll('button'));
  buttons.forEach((b) => {
    const h = parseFloat(b.dataset.h);
    b.addEventListener('click', () => {
      const active = model.state.ShowFacingVector
        && Math.abs(((model.state[row.key] - h + 540) % 360) - 180) < 0.5;
      if (active) {
        model.setState({ ShowFacingVector: false });
      } else {
        model.setState({ ShowFacingVector: true, [row.key]: h });
      }
    });
  });
  function refresh() {
    const heading = model.state[row.key];
    const showing = !!model.state.ShowFacingVector;
    buttons.forEach((b) => {
      const h = parseFloat(b.dataset.h);
      const isActive = showing
        && Math.abs(((heading - h + 540) % 360) - 180) < 0.5;
      b.classList.toggle('active', isActive);
    });
  }
  model.addEventListener('update', refresh);
  refresh();
  wrap.appendChild(btns);
  return wrap;
}

// Fine-increment nudge buttons for a numeric key. `row.nudge` is an
// array of { delta, label } entries; each button adds its delta to the
// stored value. If `row.wrap360` is true the result wraps into
// [0, 360). Used for degree fields where a wants sub-degree
// precision (arcminute = 1/60°, arcsecond = 1/3600°) without fighting
// a super-sensitive slider.
function nudgeRow(model, row) {
  const el = document.createElement('div');
  el.className = 'row nudge-buttons';
  const btnsHtml = row.nudge
    .map((n, i) => `<button data-i="${i}">${n.label}</button>`)
    .join('');
  el.innerHTML = `<label>${row.label}</label>${btnsHtml}`;
  const buttons = Array.from(el.querySelectorAll('button'));
  buttons.forEach((b, i) => {
    b.addEventListener('click', () => {
      const delta = row.nudge[i].delta;
      const cur = model.state[row.key];
      let next = (Number.isFinite(cur) ? cur : 0) + delta;
      if (row.wrap360) next = ((next % 360) + 360) % 360;
      model.setState({ [row.key]: next });
    });
  });
  el.style.gridTemplateColumns = `96px repeat(${row.nudge.length}, 1fr)`;
  return el;
}

// Single toggle button whose label flips based on a boolean state field.
// row.action is `{ enterLabel, exitLabel }` — shown when the field is
// false / true respectively.
// one-shot click row. `row.onClick(model)` fires on each
// click; `row.buttonLabel` is the static button text. Not bound to
// any state key — use it for clear-all / reset-style actions where a
// toggle would be the wrong affordance.
function clickRow(model, row) {
  const el = document.createElement('div');
  el.className = 'row bool action-row';
  el.innerHTML = `<label>${row.label ?? ''}</label>
    <button class="action-btn"></button>`;
  const btn = el.querySelector('button');
  btn.textContent = row.buttonLabel ?? 'Action';
  btn.addEventListener('click', () => row.onClick(model));
  return el;
}

function clickGroupRow(model, row) {
  const el = document.createElement('div');
  // `layout: 'wrap'` switches the row from equal-flex columns to a
  // flex-wrap cluster — used for the constellation-name list where
  // each button keeps its natural width and rows wrap as needed.
  el.className = 'row action-group-row' + (row.layout === 'wrap' ? ' wrap' : '');
  for (const a of row.actions) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'action-btn';
    btn.textContent = a.buttonLabel ?? 'Action';
    btn.addEventListener('click', () => a.onClick(model));
    el.appendChild(btn);
  }
  return el;
}

function actionRow(model, row) {
  const el = document.createElement('div');
  el.className = 'row bool action-row';
  el.innerHTML = `<label>${row.label}</label>
    <button class="action-btn"></button>`;
  const btn = el.querySelector('button');
  function refresh() {
    const active = !!model.state[row.key];
    btn.textContent = active ? row.action.exitLabel : row.action.enterLabel;
    btn.classList.toggle('active', active);
  }
  btn.addEventListener('click', () => {
    model.setState({ [row.key]: !model.state[row.key] });
  });
  model.addEventListener('update', refresh);
  refresh();
  return el;
}

// Two-option select backed by a boolean state field. row.boolSelect is
// `{ trueLabel, falseLabel }` — the labels users see in the dropdown.
function boolSelectRow(model, row) {
  const el = document.createElement('div');
  el.className = 'row bool';
  const { trueLabel, falseLabel } = row.boolSelect;
  el.innerHTML = `<label>${row.label}</label>
    <select class="sel">
      <option value="true">${trueLabel}</option>
      <option value="false">${falseLabel}</option>
    </select>`;
  const sel = el.querySelector('select');
  function refresh() { sel.value = model.state[row.key] ? 'true' : 'false'; }
  sel.addEventListener('change', () => {
    model.setState({ [row.key]: sel.value === 'true' });
  });
  model.addEventListener('update', refresh);
  refresh();
  return el;
}

// multi-select button grid. Drives an array-valued state
// field. Clicking a button toggles that id's membership in the array;
// active buttons get the `.on` class.
function buttonGridRow(model, row) {
  const el = document.createElement('div');
  el.className = 'row button-grid-row';
  if (row.label) {
    const label = document.createElement('label');
    label.textContent = row.label;
    el.appendChild(label);
  } else {
    el.classList.add('no-label');
  }
  const grid = document.createElement('div');
  grid.className = 'button-grid';
  el.appendChild(grid);

  const btns = row.buttonGrid.map((opt) => {
    const value = typeof opt === 'string' ? opt : opt.value;
    const text  = typeof opt === 'string' ? opt : (opt.label ?? opt.value);
    // optional per-button text colour. Inline `style.color`
    // beats the `.tracker-btn.on` class rule's colour, so the
    // body-specific pigment survives the selected state too.
    const color = typeof opt === 'object' ? opt.color : null;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tracker-btn';
    btn.textContent = text;
    if (color) btn.style.color = color;
    btn.addEventListener('click', () => {
      const current = Array.isArray(model.state[row.key]) ? model.state[row.key] : [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      model.setState({ [row.key]: next });
    });
    grid.appendChild(btn);
    return { btn, value };
  });

  function refresh() {
    const current = Array.isArray(model.state[row.key]) ? model.state[row.key] : [];
    const set = new Set(current);
    for (const { btn, value } of btns) btn.classList.toggle('on', set.has(value));
  }
  model.addEventListener('update', refresh);
  refresh();
  return el;
}

function boolRow(model, row) {
  const el = document.createElement('div');
  el.className = 'row bool';
  el.innerHTML = `<label>${row.label}</label><input type="checkbox">`;
  const cb = el.querySelector('input');
  function refresh() { cb.checked = !!model.state[row.key]; }
  cb.addEventListener('change', () => model.setState({ [row.key]: cb.checked }));
  model.addEventListener('update', refresh);
  refresh();
  return el;
}

// Two select dropdowns side-by-side, both bound to the same model
// state key. Used when a single state field has two distinct
// option sources that the user wants to pick from independently.
function pairSelectRow(model, row) {
  const el = document.createElement('div');
  el.className = 'row pair-select';
  const left  = `<option value="">— ${row.left.label} —</option>`
    + row.left.select.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : (o.label ?? o.value);
        return `<option value="${v}">${l}</option>`;
      }).join('');
  const right = `<option value="">— ${row.right.label} —</option>`
    + row.right.select.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : (o.label ?? o.value);
        return `<option value="${v}">${l}</option>`;
      }).join('');
  el.innerHTML = `
    <select class="sel pair-left">${left}</select>
    <select class="sel pair-right">${right}</select>
  `;
  const selL = el.querySelector('.pair-left');
  const selR = el.querySelector('.pair-right');
  const leftValues  = new Set(row.left.select.map((o) => typeof o === 'string' ? o : o.value));
  const rightValues = new Set(row.right.select.map((o) => typeof o === 'string' ? o : o.value));
  // When `leftKey` / `rightKey` are set, each side drives its own
  // state field (e.g., FE map vs GE map). When omitted, both sides
  // share `row.key` (legacy single-state behaviour).
  const leftKey  = row.leftKey  || row.key;
  const rightKey = row.rightKey || row.key;
  function refresh() {
    const curL = String(model.state[leftKey]  || '');
    const curR = String(model.state[rightKey] || '');
    selL.value = leftValues.has(curL)  ? curL : '';
    selR.value = rightValues.has(curR) ? curR : '';
  }
  selL.addEventListener('change', () => {
    if (selL.value) model.setState({ [leftKey]: selL.value });
  });
  selR.addEventListener('change', () => {
    if (selR.value) model.setState({ [rightKey]: selR.value });
  });
  model.addEventListener('update', refresh);
  refresh();
  return el;
}

const LABEL_KEY = {
  'Heavenly Vault': 'lbl_heavenly_vault',
  'Vault Grid': 'lbl_vault_grid',
  'Sun Track': 'lbl_sun_track',
  'Moon Track': 'lbl_moon_track',
  'Optical Vault': 'lbl_optical_vault',
  'Optical Vault Grid': 'lbl_optical_vault_grid',
  'Azimuth ring': 'lbl_azimuth_ring',
  'Facing Vector / N-S-E-W': 'lbl_facing_vector',
  'Celestial Poles': 'lbl_celestial_poles',
  'Declination Circles': 'lbl_declination_circles',
  'FE Grid': 'lbl_fe_grid',
  'Tropics / Polar': 'lbl_tropics_polar',
  'Sun / Moon GP': 'lbl_sun_moon_gp',
  'Longitude ring': 'lbl_longitude_ring',
  'Shadow': 'lbl_shadow',
  'Vault Rays': 'lbl_vault_rays',
  'Optical Vault Rays': 'lbl_optical_vault_rays',
  'Projection Rays': 'lbl_projection_rays',
  'Many Rays': 'lbl_many_rays',
  'Axis Mundi': 'lbl_axis_mundi',
  'Planets': 'lbl_planets',
  'Dark Background': 'lbl_dark_background',
  'Logo': 'lbl_logo',
  'Show': 'lbl_show',
  'GP Override': 'lbl_gp_override',
  'Outlines': 'lbl_outlines',
  'Figure': 'lbl_figure',
  'Starfield': 'lbl_starfield',
  'Starfield Mode': 'lbl_starfield_mode',
  'Permanent night': 'lbl_permanent_night',
  'Show Satellites': 'lbl_show_satellites',
  'Specified Tracker Mode': 'lbl_specified_tracker_mode',
  'True Positions': 'lbl_true_positions',
  'GP Path (24 h)': 'lbl_gp_path_24h',
  'Ephemeris comparison': 'lbl_ephemeris_comparison',
  'Precession': 'lbl_precession',
  'Nutation': 'lbl_nutation',
  'Aberration': 'lbl_aberration',
  'Trepidation': 'lbl_trepidation',
  'Source': 'lbl_source',
  'ObserverLat': 'lbl_observer_lat',
  'ObserverLong': 'lbl_observer_long',
  'Size': 'lbl_size',
  'Height': 'lbl_height',
  'HQ Map Art': 'lbl_hq_map_art',
  'Generated': 'lbl_generated',
  'CameraDir': 'lbl_camera_dir',
  'CameraHeight': 'lbl_camera_height',
  'CameraDist': 'lbl_camera_dist',
  'Zoom': 'lbl_zoom',
  'Elevation': 'lbl_elevation',
  'VaultSize': 'lbl_vault_size',
  'VaultHeight': 'lbl_vault_height',
  'DayOfYear': 'lbl_day_of_year',
  'Time': 'lbl_time',
  'DateTime': 'lbl_datetime',
  'Timezone': 'lbl_timezone',
  'Date / time': 'lbl_date_time_field',
  'Speed': 'lbl_speed',
};
const BUTTON_LABEL_KEY = {
  'Enable All': 'btn_enable_all',
  'Disable All': 'btn_disable_all',
  'Disable Satellites': 'btn_disable_satellites',
};
function bindTranslatable(textNode, originalText, keyMap) {
  if (!textNode || originalText == null) return;
  const key = keyMap[originalText];
  textNode.textContent = key ? t(key) : originalText;
  if (key) onLangChange(() => { textNode.textContent = t(key); });
}

// `ShowTooltips` master gate. When off, every element bound via
// `bindTip` clears its `title` attribute so hover bubbles vanish.
const _tipBinds = [];
let _tooltipsOn = true;
function setTooltipsEnabled(on) {
  if (_tooltipsOn === !!on) return;
  _tooltipsOn = !!on;
  for (const refresh of _tipBinds) refresh();
}
function bindTip(el, key) {
  if (!el || !key) return;
  const refresh = () => { el.title = _tooltipsOn ? t(key) : ''; };
  _tipBinds.push(refresh);
  refresh();
  onLangChange(refresh);
}

// Distance Calc panel for the View tab. Renders 4 lat/lon inputs,
// a two-button "use observer" cluster, and a computed readout that
// shows: great-circle distance (li bu + km), central angle (DMS +
// du fen), and inscribed angle (DMS + du fen, half the central by
// the inscribed-angle theorem). Auto-fills P1 with the observer's
// (lat, lon) the first time the panel renders while all four
// inputs are still null. Returns the rendered element so the View
// tab can append it inside a collapsible group.
function distanceCalcPanel(model) {
  const wrap = document.createElement('div');
  wrap.className = 'dist-calc-panel';

  const mkNum = (label, key, range) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<label>${label}</label>
      <input type="number" class="num" step="0.0001"
             min="${range[0]}" max="${range[1]}">
      <span class="unit">°</span>`;
    const num = row.querySelector('input.num');
    let editing = false;
    const refresh = () => {
      const v = model.state[key];
      if (!editing) num.value = Number.isFinite(v) ? (+v).toFixed(4) : '';
    };
    num.addEventListener('focus', () => { editing = true; });
    const commit = () => {
      editing = false;
      const v = parseFloat(num.value);
      model.setState({ [key]: Number.isFinite(v) ? v : null });
    };
    num.addEventListener('blur', commit);
    num.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  num.blur();
      if (e.key === 'Escape') { editing = false; refresh(); num.blur(); }
    });
    model.addEventListener('update', refresh);
    refresh();
    return row;
  };

  wrap.appendChild(mkNum('Lat 1', 'DistCalcLat1', [-90,  90]));
  wrap.appendChild(mkNum('Lon 1', 'DistCalcLon1', [-180, 180]));
  wrap.appendChild(mkNum('Lat 2', 'DistCalcLat2', [-90,  90]));
  wrap.appendChild(mkNum('Lon 2', 'DistCalcLon2', [-180, 180]));

  const btnRow = document.createElement('div');
  btnRow.className = 'row action-group-row';
  const mkBtn = (text, onClick) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'action-btn';
    b.textContent = text;
    b.addEventListener('click', onClick);
    return b;
  };
  btnRow.appendChild(mkBtn('Use Obs → P1', () => {
    model.setState({
      DistCalcLat1: model.state.ObserverLat,
      DistCalcLon1: model.state.ObserverLong,
    });
  }));
  btnRow.appendChild(mkBtn('Use Obs → P2', () => {
    model.setState({
      DistCalcLat2: model.state.ObserverLat,
      DistCalcLon2: model.state.ObserverLong,
    });
  }));
  btnRow.appendChild(mkBtn('Clear', () => {
    model.setState({
      DistCalcLat1: null, DistCalcLon1: null,
      DistCalcLat2: null, DistCalcLon2: null,
    });
  }));
  wrap.appendChild(btnRow);

  const out = document.createElement('div');
  out.className = 'dist-calc-output';
  out.innerHTML = `
    <div class="dc-line"><span class="dc-label">Distance</span>
      <span class="dc-val" data-k="dist">—</span></div>
    <div class="dc-line"><span class="dc-label">Central angle</span>
      <span class="dc-val" data-k="ca">—</span></div>
    <div class="dc-line"><span class="dc-label">Inscribed angle</span>
      <span class="dc-val" data-k="ia">—</span></div>`;
  wrap.appendChild(out);

  const slotDist = out.querySelector('[data-k="dist"]');
  const slotCa   = out.querySelector('[data-k="ca"]');
  const slotIa   = out.querySelector('[data-k="ia"]');

  const fmtDmsUnsigned = (deg) => {
    if (!Number.isFinite(deg)) return '—';
    const a = Math.abs(deg);
    const d = Math.floor(a);
    const mF = (a - d) * 60;
    const m = Math.floor(mF);
    const sec = (mF - m) * 60;
    return `${d}° ${String(m).padStart(2, '0')}' ${sec.toFixed(2)}"`;
  };

  const refresh = () => {
    const s = model.state;
    const have = Number.isFinite(s.DistCalcLat1)
              && Number.isFinite(s.DistCalcLon1)
              && Number.isFinite(s.DistCalcLat2)
              && Number.isFinite(s.DistCalcLon2);
    if (!have) {
      slotDist.textContent = '—';
      slotCa.textContent   = '—';
      slotIa.textContent   = '—';
      return;
    }
    const li = haversineLi(
      s.DistCalcLat1, s.DistCalcLon1,
      s.DistCalcLat2, s.DistCalcLon2);
    const km = li * KM_PER_LI;
    // Central angle = arc / R_LI in radians, expressed in degrees.
    // Equivalent to the spherical-law-of-cosines value the dot-
    // product distance uses; haversine / R_LI keeps the formulas
    // consistent across the panel.
    const central = (li / R_LI) * 180 / Math.PI;
    // Inscribed-angle theorem: an inscribed angle subtending the
    // same arc is half the central angle.
    const inscribed = central / 2;

    slotDist.textContent =
      `${fmtLiBuFromLi(li)}  (${km.toFixed(2)} km)`;
    slotCa.textContent =
      `${fmtDmsUnsigned(central)}  ·  ${fmtDuFen(central)}`;
    slotIa.textContent =
      `${fmtDmsUnsigned(inscribed)}  ·  ${fmtDuFen(inscribed)}`;
  };

  // (Auto-fill of P1 from the observer's position removed —
  // it left a stale yellow pin at the original observer
  // location when the user moved to a new spot, since the
  // map-render path treats any non-null DistCalcLat1/Lon1 as
  // an active pair to draw. The "Use Obs → P1" button is the
  // explicit way to seed P1 now; the panel starts empty.)

  model.addEventListener('update', refresh);
  refresh();
  return wrap;
}

// Dispatch a field-group row definition to the right row-builder.
function buildRow(model, row) {
  let el;
  if (row.bool)            el = boolRow(model, row);
  else if (row.boolSelect) el = boolSelectRow(model, row);
  else if (row.pairSelect) el = pairSelectRow(model, row);
  else if (row.select)     el = selectRow(model, row);
  else if (row.buttonGrid) el = buttonGridRow(model, row);
  else if (row.cardinal)   el = cardinalRow(model, row);
  else if (row.actions)    el = clickGroupRow(model, row);
  else if (row.onClick)    el = clickRow(model, row);
  else if (row.action)     el = actionRow(model, row);
  else if (row.nudge)      el = nudgeRow(model, row);
  else if (row.readout)    el = readoutRow(model, row);
  else                     el = numericRow(model, row);

  // Bind the row's first <label> to the i18n table when the label
  // matches a known key.
  const labelEl = el.querySelector('label');
  if (labelEl && row.label) bindTranslatable(labelEl, row.label, LABEL_KEY);

  // clickRow's button text is row.buttonLabel, not row.label.
  if (row.onClick && row.buttonLabel) {
    const btn = el.querySelector('button.action-btn');
    if (btn) bindTranslatable(btn, row.buttonLabel, BUTTON_LABEL_KEY);
  }
  return el;
}

// Collapsible group inside a tab popup. Header click toggles body.
// `popupGroups` is a shared Set of all {header, body} pairs in the
// same popup — expanding one collapses the others so only one group
// is open at a time.
const GROUP_KEY = {
  'Observer': 'grp_observer', 'Camera': 'grp_camera',
  'Vault of the Heavens': 'grp_vault_of_heavens',
  'Optical Vault': 'grp_optical_vault',
  'Body Vaults': 'grp_body_vaults', 'Rays': 'grp_rays',
  'Cosmology': 'grp_cosmology', 'Map Projection': 'grp_map_projection',
  'Misc': 'grp_misc', 'Ephemeris': 'grp_ephemeris',
  'Starfield': 'grp_starfield', 'Tracker Options': 'grp_tracker_options',
  'Celestial Bodies': 'grp_celestial_bodies', 'Cel Nav': 'grp_cel_nav',
  'Constellations': 'grp_constellations', 'Black Holes': 'grp_black_holes',
  'Quasars': 'grp_quasars', 'Galaxies': 'grp_galaxies',
  'Satellites': 'grp_satellites',
  'Bright Star Catalog': 'grp_bright_star_catalog',
  'Calendar': 'grp_calendar', 'Autoplay': 'grp_autoplay',
  'Language Select': 'grp_language_select',
};

function buildGroup(model, title, rows, popupGroups) {
  const el = document.createElement('div');
  el.className = 'group';
  el.dataset.groupTitle = title;
  const header = document.createElement('button');
  header.type = 'button';
  header.className = 'group-header collapsed';
  const arrow = document.createElement('span');
  arrow.className = 'group-arrow';
  arrow.textContent = '▸';
  const titleSpan = document.createElement('span');
  titleSpan.className = 'group-header-title';
  const titleKey = GROUP_KEY[title];
  titleSpan.textContent = titleKey ? t(titleKey) : title;
  if (titleKey) {
    onLangChange(() => { titleSpan.textContent = t(titleKey); });
  }
  header.append(arrow, titleSpan);
  const body = document.createElement('div');
  body.className = 'group-body';
  body.hidden = true;
  const pair = { header, body };
  if (popupGroups) popupGroups.add(pair);
  header.addEventListener('click', () => {
    const willOpen = header.classList.contains('collapsed');
    if (willOpen && popupGroups) {
      // Close every sibling before opening this one.
      for (const other of popupGroups) {
        if (other === pair) continue;
        if (!other.header.classList.contains('collapsed')) {
          other.header.classList.add('collapsed');
          other.body.hidden = true;
        }
      }
    }
    header.classList.toggle('collapsed');
    body.hidden = !willOpen ? true : false;
  });
  for (const row of rows) body.appendChild(buildRow(model, row));
  el.append(header, body);
  return { el, header, body };
}

// Bottom-bar + per-tab popup layout. `host` is the element the bar
// and popups attach to (expected to be #view so they overlay the
// canvas).
export function buildControlPanel(host, model, demos) {
  const autoplay = new Autoplay(model);
  model._autoplay = autoplay;

  // Mouseover tooltips honour `state.ShowTooltips`. When the user
  // unchecks the toggle every `bindTip`-managed element clears its
  // `title` attribute so hover bubbles vanish across the whole UI.
  setTooltipsEnabled(model.state.ShowTooltips !== false);
  model.addEventListener('update', () => {
    setTooltipsEnabled(model.state.ShowTooltips !== false);
  });

  const infoBar = document.createElement('div');
  infoBar.id = 'info-bar';
  infoBar.innerHTML = `
    <div class="info-row info-row-top">
      <span class="info-slot" data-k="lat">—</span>
      <span class="info-slot" data-k="lon">—</span>
      <span class="info-slot" data-k="el">—</span>
      <span class="info-slot" data-k="az">—</span>
      <span class="info-sep">│</span>
      <span class="info-slot" data-k="mel">Mouse El: —</span>
      <span class="info-slot" data-k="maz">Mouse Az: —</span>
      <span class="info-sep">│</span>
      <span class="info-slot" data-k="eph">ephem: —</span>
      <span class="info-sep">│</span>
      <span class="info-slot" data-k="time">—</span>
      <span class="info-slot" data-k="speed">—</span>
      <span class="info-sep">│</span>
      <span class="info-slot info-track" data-k="track">Tracking: —</span>
      <span class="info-slot info-dist" data-k="dist" hidden></span>
      <span class="info-actions" data-k="actions"></span>
    </div>
  `;
  const slotLat   = infoBar.querySelector('[data-k="lat"]');
  const slotLon   = infoBar.querySelector('[data-k="lon"]');
  const slotEl    = infoBar.querySelector('[data-k="el"]');
  const slotAz    = infoBar.querySelector('[data-k="az"]');
  const slotMel   = infoBar.querySelector('[data-k="mel"]');
  const slotMaz   = infoBar.querySelector('[data-k="maz"]');
  const slotEph   = infoBar.querySelector('[data-k="eph"]');
  const slotTime  = infoBar.querySelector('[data-k="time"]');
  const slotSpeed = infoBar.querySelector('[data-k="speed"]');
  setLang(model.state.Language || 'en');
  model.addEventListener('update', () => {
    setLang(model.state.Language || 'en');
  });
  const slotTrack = infoBar.querySelector('[data-k="track"]');
  const slotDist  = infoBar.querySelector('[data-k="dist"]');
  const fmtLat = (v) => `Lat ${v >= 0 ? '+' : ''}${v.toFixed(4)}°`;
  const fmtLon = (v) => `Lon ${v >= 0 ? '+' : ''}${v.toFixed(4)}°`;
  const fmtSignedDeg = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}°`;
  const EPHEM_NAMES = {
    geocentric:   'GeoC',
    ptolemy:      'Ptolemy',
    astropixels:  'DE405',
    vsop87:       'VSOP87',
  };
  const refreshInfoBar = () => {
    const s = model.state;
    slotLat.textContent = fmtLat(s.ObserverLat);
    slotLon.textContent = fmtLon(s.ObserverLong);
    slotEl.textContent  = `El ${fmtSignedDeg(s.CameraHeight || 0)}`;
    slotAz.textContent  = `Az ${(s.ObserverHeading || 0).toFixed(2)}°`;
    slotMel.textContent = Number.isFinite(s.MouseElevation)
      ? `Mouse El: ${fmtSignedDeg(s.MouseElevation)}`
      : 'Mouse El: —';
    slotMaz.textContent = Number.isFinite(s.MouseAzimuth)
      ? `Mouse Az: ${s.MouseAzimuth.toFixed(2)}°`
      : 'Mouse Az: —';
    slotEph.textContent = `ephem: ${EPHEM_NAMES[s.BodySource] || s.BodySource || '—'}`;
    // Show the menu-bar clock in the observer's local zone (as set by
    // `TimezoneOffsetMinutes`) so a preset like PP that selects a
    // specific local-time event reads as the local clock the user
    // typed in, not as UTC. Adds a `(UTC±H[:MM])` suffix so the
    // offset stays self-documenting.
    const tzMin = Number.isFinite(Number(s.TimezoneOffsetMinutes))
      ? Number(s.TimezoneOffsetMinutes) : 0;
    const utc = dateTimeToDate(s.DateTime);
    const local = new Date(utc.getTime() + tzMin * 60 * 1000);
    const _MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const _pad2 = (n) => String(Math.floor(n)).padStart(2, '0');
    const datePart = `${_MONTHS[local.getUTCMonth()]} ${_pad2(local.getUTCDate())} ${local.getUTCFullYear()}`;
    const timePart = `${_pad2(local.getUTCHours())}:${_pad2(local.getUTCMinutes())}:${_pad2(local.getUTCSeconds())}`;
    const sign = tzMin >= 0 ? '+' : '-';
    const absMin = Math.abs(tzMin);
    const offHrs = Math.floor(absMin / 60);
    const offMin = absMin % 60;
    const offLabel = offMin === 0
      ? `UTC${sign}${offHrs}`
      : `UTC${sign}${offHrs}:${_pad2(offMin)}`;
    slotTime.textContent = `${datePart} / ${timePart} ${offLabel}`;
    const trackName = resolveTrackName(s.FollowTarget);
    if (trackName) {
      const a = resolveTargetAngles(s.FollowTarget, model.computed);
      if (a) {
        const az = ((a.azimuth % 360) + 360) % 360;
        const el = a.elevation;
        slotTrack.textContent =
          `Tracking: ${trackName}  ·  az ${az.toFixed(2)}°  el ${(el >= 0 ? '+' : '') + el.toFixed(2)}°`;
      } else {
        slotTrack.textContent = `Tracking: ${trackName}`;
      }
    } else {
      slotTrack.textContent = 'Tracking: —';
    }
    // Distance-compass readout. Shows From → To pair status while
    // the mode is active; once both pins are placed, computes the
    // haversine distance via the Tang sphere primitive (R_LI) and
    // reports it as `li bu` plus a parenthetical km value via the
    // KM_PER_LI bridge.
    if (s.DistanceCompassMode) {
      slotDist.hidden = false;
      const haveFrom = Number.isFinite(s.DistancePairFromLat)
                    && Number.isFinite(s.DistancePairFromLon);
      const haveTo   = Number.isFinite(s.DistancePairToLat)
                    && Number.isFinite(s.DistancePairToLon);
      if (haveFrom && haveTo) {
        const li = haversineLi(
          s.DistancePairFromLat, s.DistancePairFromLon,
          s.DistancePairToLat,   s.DistancePairToLon);
        const km = li * KM_PER_LI;
        slotDist.textContent =
          `Dist: ${fmtLiBuFromLi(li)}  (${km.toFixed(1)} km)`;
      } else if (haveFrom) {
        slotDist.textContent = 'Dist: click second point…';
      } else {
        slotDist.textContent = 'Dist: click first point…';
      }
    } else {
      slotDist.hidden = true;
      slotDist.textContent = '';
    }
  };
  model.addEventListener('update', refreshInfoBar);
  refreshInfoBar();

  const bar = document.createElement('div');
  bar.id = 'bottom-bar';

  const barLeft = document.createElement('div');
  barLeft.className = 'bar-left';

  const presets = document.createElement('div');
  presets.className = 'presets';

  const PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars',
                   'jupiter', 'saturn', 'uranus', 'neptune'];

  // Preset 1: Minimal — only the ephemeris pipeline runs; everything
  // visual is off. Observer figure goes invisible. Black backdrop, AE
  // map, no body / overlay / ray rendering.
  const applyPreset1 = () => {
    model.setState({
      ObserverFigure: 'none',
      ObserverLat: 32.0, ObserverLong: -100.8387,
      ObserverHeading: 357.3098, ObserverElevation: 0,
      CameraDirection: -106.6, CameraHeight: 15.2,
      CameraDistance: 10.0, Zoom: 4.67,
      InsideVault: false,
      ShowVault: false, ShowVaultGrid: false,
      ShowSunTrack: false, ShowMoonTrack: false,
      ShowOpticalVault: false, ShowOpticalVaultGrid: false,
      ShowAzimuthRing: false, ShowFacingVector: false,
      ShowCelestialPoles: false, ShowDecCircles: false,
      ShowFeGrid: false, ShowTropicCancer: false, ShowEquator: false,
      ShowTropicCapricorn: false, ShowPolarCircles: false,
      ShowGroundPoints: false, ShowLongitudeRing: false,
      ShowShadow: false,
      ShowVaultRays: false, ShowOpticalVaultRays: false,
      ShowProjectionRays: false, ShowManyRays: false,
      Cosmology: 'none',
      MapProjection: 'ae', MapProjectionGe: 'hq_equirect_night',
      GeneratedMap: 'blank', MapArt: 'none',
      ShowPlanets: false, DarkBackground: true, ShowLogo: false,
      ShowCelestialBodies: false,
      ShowCelNav: false, ShowConstellations: false, ShowConstellationLines: false,
      ShowBlackHoles: false, ShowQuasars: false, ShowGalaxies: false,
      ShowSatellites: false,
      ShowStars: false,
      ShowSunAnalemma: false, ShowMoonAnalemma: false,
      ShowGPPath: false, ShowDomeCaustic: false,
      ShowGPTracer: false, ShowOpticalVaultTrace: false, ShowSunMoonNine: false,
      ShowTruePositions: false,
      TrackerTargets: [],
      SpecifiedTrackerMode: false,
    });
  };

  const applyPreset2 = () => {
    const allCelNav        = CEL_NAV_STARS.map(x => `star:${x.id}`);
    const allConstellation = CATALOGUED_STARS.map(x => `star:${x.id}`);
    const allBlackHoles    = BLACK_HOLES.map(x => `star:${x.id}`);
    const allQuasars       = QUASARS.map(x => `star:${x.id}`);
    const allGalaxies      = GALAXIES.map(x => `star:${x.id}`);
    const allSatellites    = SATELLITES.map(x => `star:${x.id}`);
    model.setState({
      ObserverFigure: 'nikki',
      ObserverLat: 45.0, ObserverLong: -100.0,
      ObserverElevation: 19.8, ObserverHeading: 351.8844,
      CameraDirection: -85.8, CameraHeight: 12.2,
      CameraDistance: 10.0, Zoom: 3.86,
      InsideVault: false,
      VaultSize: 1.00, VaultHeight: 0.400,
      OpticalVaultSize: 0.50, OpticalVaultHeight: 0.30,
      StarfieldVaultHeight: 0.300,
      MoonVaultHeight: 0.317,
      SunVaultHeight: 0.372,
      MercuryVaultHeight: 0.371, VenusVaultHeight: 0.370,
      MarsVaultHeight: 0.371, JupiterVaultHeight: 0.313,
      SaturnVaultHeight: 0.313, UranusVaultHeight: 0.361,
      NeptuneVaultHeight: 0.339,
      RayParameter: 2.00,
      ShowVault: true, ShowVaultGrid: false,
      ShowSunTrack: false, ShowMoonTrack: false,
      ShowOpticalVault: true, ShowOpticalVaultGrid: false,
      ShowAzimuthRing: false, ShowFacingVector: false,
      ShowCelestialPoles: false, ShowDecCircles: false,
      ShowFeGrid: false, ShowTropicCancer: false, ShowEquator: false,
      ShowTropicCapricorn: false, ShowPolarCircles: false,
      ShowGroundPoints: false, ShowLongitudeRing: false,
      ShowShadow: true,
      ShowVaultRays: false, ShowOpticalVaultRays: false,
      ShowProjectionRays: false, ShowManyRays: false,
      Cosmology: 'none',
      MapProjection: 'ae', MapProjectionGe: 'hq_equirect_night',
      GeneratedMap: 'default', MapArt: 'none',
      ShowPlanets: true, DarkBackground: true, ShowLogo: true,
      BodySource: 'astropixels',
      StarApplyPrecession: false, StarApplyNutation: false,
      StarApplyAberration: false, StarTrepidation: true,
      StarfieldType: 'celnav', DynamicStars: true, PermanentNight: false,
      ShowStars: true,
      ShowSunMoonNine: false, ShowDomeCaustic: false,
      ShowGPTracer: true, ShowOpticalVaultTrace: false, ShowGPPath: false,
      ShowSunAnalemma: false, ShowMoonAnalemma: false,
      ShowTruePositions: false, TrackerGPOverride: false,
      SpecifiedTrackerMode: false,
      ShowCelestialBodies: true, GPOverridePlanets: false,
      ShowCelNav: true, GPOverrideCelNav: false,
      ShowConstellations: true, ShowConstellationLines: true, GPOverrideConst: false,
      ShowBlackHoles: true, GPOverrideBlackHoles: false,
      ShowQuasars: true, GPOverrideQuasars: false,
      ShowGalaxies: true, GPOverrideGalaxies: false,
      ShowSatellites: true, GPOverrideSatellites: false,
      TrackerTargets: [
        ...PLANETS,
        ...allCelNav, ...allConstellation,
        ...allBlackHoles, ...allQuasars,
        ...allGalaxies, ...allSatellites,
      ],
    });
  };

  const btnP1 = document.createElement('button');
  btnP1.className = 'time-btn preset-btn';
  btnP1.type = 'button';
  btnP1.textContent = 'P1';
  btnP1.title = 'Preset 1 — Minimal (everything off, ephemeris only)';
  btnP1.addEventListener('click', applyPreset1);
  const btnP2 = document.createElement('button');
  btnP2.className = 'time-btn preset-btn';
  btnP2.type = 'button';
  btnP2.textContent = 'P2';
  btnP2.title = 'Preset 2 — Demo (45°N -100°, full body + star catalog, FE disc view)';
  btnP2.addEventListener('click', applyPreset2);
  presets.append(btnP1, btnP2);
  barLeft.appendChild(presets);

  const timeControls = document.createElement('div');
  timeControls.className = 'time-controls';
  const btnVault = document.createElement('button');
  btnVault.className = 'time-btn vault-swap';
  btnVault.type = 'button';
  bindTip(btnVault, 'tip_vault_swap');

  // Quick-hop buttons: jump observer to varied country lat/lons.
  const geoHops = document.createElement('div');
  geoHops.className = 'geo-hops';
  const COUNTRY_HOPS = [
    { code: 'USA', name: 'USA (Denver)',             lat: 39.74,  lon: -104.99 },
    { code: 'BRA', name: 'Brazil (Brasília)',         lat: -15.78, lon: -47.93  },
    { code: 'GBR', name: 'UK (London)',               lat: 51.51,  lon: -0.13   },
    { code: 'EGY', name: 'Egypt (Cairo)',             lat: 30.05,  lon: 31.24   },
    { code: 'ZAF', name: 'South Africa (Cape Town)',  lat: -33.92, lon: 18.42   },
    { code: 'RUS', name: 'Russia (Moscow)',           lat: 55.76,  lon: 37.62   },
    { code: 'IND', name: 'India (Delhi)',             lat: 28.61,  lon: 77.21   },
    { code: 'JPN', name: 'Japan (Tokyo)',             lat: 35.68,  lon: 139.65  },
    { code: 'AUS', name: 'Australia (Sydney)',        lat: -33.87, lon: 151.21  },
    { code: 'ARG', name: 'Argentina (Ushuaia)',       lat: -54.81, lon: -68.31  },
  ];
  for (const h of COUNTRY_HOPS) {
    const b = document.createElement('button');
    b.className = 'time-btn geo-hop';
    b.type = 'button';
    b.textContent = h.code;
    b.title = `${h.name}  ·  ${h.lat.toFixed(2)}°, ${h.lon.toFixed(2)}°`;
    b.addEventListener('click', () => {
      model.setState({ ObserverLat: h.lat, ObserverLong: h.lon });
    });
    geoHops.appendChild(b);
  }
  const btnRew  = document.createElement('button');
  btnRew.className = 'time-btn';  btnRew.type = 'button';
  btnRew.textContent = '⏪'; bindTip(btnRew, 'tip_rewind');
  const btnPlay = document.createElement('button');
  btnPlay.className = 'time-btn'; btnPlay.type = 'button';
  btnPlay.textContent = '▶'; bindTip(btnPlay, 'tip_play_pause');
  const btnFf   = document.createElement('button');
  btnFf.className = 'time-btn';  btnFf.type = 'button';
  btnFf.textContent = '⏩'; bindTip(btnFf, 'tip_fast_forward');
  const btnSlow = document.createElement('button');
  btnSlow.className = 'time-btn';  btnSlow.type = 'button';
  btnSlow.textContent = '½×';
  bindTip(btnSlow, 'tip_slow');
  const btnSpeed = document.createElement('button');
  btnSpeed.className = 'time-btn';  btnSpeed.type = 'button';
  btnSpeed.textContent = '2×';
  bindTip(btnSpeed, 'tip_speed');
  const btnRealtime = document.createElement('button');
  btnRealtime.className = 'time-btn';  btnRealtime.type = 'button';
  btnRealtime.textContent = 'RT';
  btnRealtime.title = 'Real time (1 sim sec per real sec)';
  const speedStack = document.createElement('div');
  speedStack.className = 'speed-stack';
  const btnEndDemo = document.createElement('button');
  btnEndDemo.className = 'time-btn end-demo-btn';
  btnEndDemo.type = 'button';
  btnEndDemo.textContent = 'End Demo';
  bindTip(btnEndDemo, 'tip_end_demo');
  btnEndDemo.hidden = true;
  btnEndDemo.addEventListener('click', () => {
    if (demos && typeof demos.stop === 'function') demos.stop();
  });
  const btnEndTracking = document.createElement('button');
  btnEndTracking.className = 'time-btn end-demo-btn end-tracking-btn';
  btnEndTracking.type = 'button';
  btnEndTracking.textContent = 'End Tracking';
  bindTip(btnEndTracking, 'tip_clear_follow');
  btnEndTracking.hidden = true;
  btnEndTracking.addEventListener('click', () => {
    model.setState({
      FollowTarget: null,
      FreeCamActive: false,
      SpecifiedTrackerMode: false,
    });
  });
  // Speed readout is duplicated by `slotSpeed` in the date / time
  // bar (the "+0.042 d/s" appendix on the date line). The detached
  // span stays for the existing `speedReadout.textContent = lbl`
  // writes to no-op safely. End Demo / End Tracking get docked
  // into the `info-bar` (next to the "Tracking: ..." slot)
  // instead of riding the transport strip — that's the natural
  // anchor for "stop the active session" controls and frees the
  // bottom bar from the floating button.
  const speedReadout = document.createElement('span');
  speedReadout.className = 'time-speed';
  // speedStack is now empty in normal layout but kept so
  // refreshTimeControls can flip btnEndDemo / btnEndTracking
  // hidden flags through the same handle. The buttons live in
  // infoBar's `info-actions` span.
  void speedStack;
  const slotActions = infoBar.querySelector('[data-k="actions"]');
  if (slotActions) slotActions.append(btnEndDemo, btnEndTracking);

  // Day / month / year skippers. 2 × 3 compact grid (back row +
  // forward row) using calendar-aware month / year arithmetic so
  // "+1mo" lands on the same day-of-month even across month-length
  // changes; same for "+1y" across leap years.
  const jumpGrid = document.createElement('div');
  jumpGrid.className = 'time-jump-grid';
  const stepDays = (n) => {
    const cur = model.state.DateTime || 0;
    model.setState({ DateTime: cur + n });
  };
  const stepMonths = (n) => {
    const cur = model.state.DateTime || 0;
    const d = dateTimeToDate(cur);
    d.setUTCMonth(d.getUTCMonth() + n);
    model.setState({ DateTime: d.getTime() / TIME_ORIGIN.msPerDay - TIME_ORIGIN.ZeroDate });
  };
  const stepYears = (n) => {
    const cur = model.state.DateTime || 0;
    const d = dateTimeToDate(cur);
    d.setUTCFullYear(d.getUTCFullYear() + n);
    model.setState({ DateTime: d.getTime() / TIME_ORIGIN.msPerDay - TIME_ORIGIN.ZeroDate });
  };
  const makeJumpBtn = (label, fn, tip) => {
    const b = document.createElement('button');
    b.className = 'time-btn jump-btn';
    b.type = 'button';
    b.textContent = label;
    if (tip) b.title = tip;
    b.addEventListener('click', fn);
    return b;
  };
  jumpGrid.append(
    makeJumpBtn('−d',  () => stepDays(-1),   'Back 1 day'),
    makeJumpBtn('−mo', () => stepMonths(-1), 'Back 1 month'),
    makeJumpBtn('−y',  () => stepYears(-1),  'Back 1 year'),
    makeJumpBtn('+d',  () => stepDays(1),    'Forward 1 day'),
    makeJumpBtn('+mo', () => stepMonths(1),  'Forward 1 month'),
    makeJumpBtn('+y',  () => stepYears(1),   'Forward 1 year'),
  );

  // Axis-line toggle (orange line from observer to disc centre /
  // globe centre). Sits where the vault-swap button used to live;
  // vault-swap moved to the right-side compass cluster.
  const btnAxis = document.createElement('button');
  btnAxis.className = 'time-btn axis-line-btn';
  btnAxis.type = 'button';
  btnAxis.textContent = '↕';
  btnAxis.title = 'Toggle Fictitious Observer';
  btnAxis.addEventListener('click', () => {
    model.setState({ ShowAxisLine: !model.state.ShowAxisLine });
  });
  const refreshAxisBtn = () => {
    btnAxis.setAttribute('aria-pressed', model.state.ShowAxisLine ? 'true' : 'false');
  };
  model.addEventListener('update', refreshAxisBtn);
  refreshAxisBtn();

  timeControls.append(btnRew, btnPlay, btnFf, btnSlow, btnSpeed, btnRealtime, jumpGrid, speedStack);
  barLeft.appendChild(geoHops);

  // Cel Theo presets. Each entry seeds observer lat/lon, tracker
  // target (the relevant Cel Theo star), the date / time / UTC
  // offset for the documented occultation event, and the
  // event-day atmosphere (`pressureMbar`, `tempC`) the refraction
  // formulas should pull from. Buttons toggle: clicking the active
  // preset reverts pressure / temperature to MSL standard
  // (1013.25 mbar, 15°C) so the user can compare event-conditions
  // refraction against standard-atmosphere refraction without
  // re-typing the numbers.
  const CEL_THEO_PRESETS = [
    {
      code: 'PP',
      name: 'Pikes Peak  ·  39 Aquarii  ·  2025-01-27 18:43:07 MST',
      lat:  38.999700,
      lon: -104.497230,
      starId: 'star:ct_39_aqr',
      utcMs: Date.UTC(2025, 0, 28, 1, 43, 7),
      tzMin: -420,
      pressureMbar: 787.8,
      tempC: -0.2,
    },
  ];
  const DEFAULT_PRESSURE_MBAR = 1013.25;
  const DEFAULT_TEMP_C = 15;
  const celTheoHops = document.createElement('div');
  celTheoHops.className = 'geo-hops cel-theo-hops';
  const celTheoBtns = [];
  for (const p of CEL_THEO_PRESETS) {
    const b = document.createElement('button');
    b.className = 'time-btn geo-hop cel-theo-hop';
    b.type = 'button';
    b.textContent = p.code;
    b.title = p.name;
    b.addEventListener('click', () => {
      const isActive = model.state.CelTheoPresetActive === p.code;
      if (isActive) {
        model.setState({
          CelTheoPresetActive: null,
          RefractionPressureMbar: DEFAULT_PRESSURE_MBAR,
          RefractionTemperatureC: DEFAULT_TEMP_C,
        });
        return;
      }
      const dateTime = p.utcMs / TIME_ORIGIN.msPerDay - TIME_ORIGIN.ZeroDate;
      const cur = Array.isArray(model.state.TrackerTargets) ? model.state.TrackerTargets : [];
      const targets = cur.includes(p.starId) ? cur : [...cur, p.starId];
      model.setState({
        ObserverLat:  p.lat,
        ObserverLong: p.lon,
        DateTime:     dateTime,
        TimezoneOffsetMinutes: p.tzMin,
        TrackerTargets: targets,
        FollowTarget:   p.starId,
        ShowCelTheo:    true,
        RefractionPressureMbar: p.pressureMbar,
        RefractionTemperatureC: p.tempC,
        CelTheoPresetActive: p.code,
      });
    });
    celTheoBtns.push({ btn: b, code: p.code });
    celTheoHops.appendChild(b);
  }
  const refreshCelTheoPresets = () => {
    const active = model.state.CelTheoPresetActive;
    for (const { btn, code } of celTheoBtns) {
      btn.setAttribute('aria-pressed', active === code ? 'true' : 'false');
    }
  };
  model.addEventListener('update', refreshCelTheoPresets);
  refreshCelTheoPresets();
  barLeft.appendChild(celTheoHops);

  // Skip-to-next-eclipse shortcut. Sits in the same hop bar as the
  // Cel-Theo PP button. Each click advances DateTime to the next
  // catalogued solar eclipse (Espenak / DE405, 2021–2040), landing
  // ~30 min before greatest eclipse so the auto-detected shadow
  // path has time to sweep in. Tooltip carries the upcoming
  // event's date / type so the user knows what they're jumping to.
  const btnSkipEclipse = document.createElement('button');
  btnSkipEclipse.className = 'time-btn geo-hop cel-theo-hop skip-eclipse-btn';
  btnSkipEclipse.type = 'button';
  btnSkipEclipse.textContent = '☀️◓';
  btnSkipEclipse.addEventListener('click', () => {
    const cur = model.state.DateTime || 0;
    const next = findNextSolarEclipseAfter(cur);
    if (!next) return;
    // Drop the clock 30 min before greatest eclipse so the shadow
    // sweep starts from "first contact" within the live window.
    const leadIn = 0.5 / 24;
    model.setState({ DateTime: next.anchorDt - leadIn });
  });
  const refreshSkipEclipse = () => {
    const cur = model.state.DateTime || 0;
    const next = findNextSolarEclipseAfter(cur);
    if (next) {
      btnSkipEclipse.title = `Jump to next solar eclipse · ${next.date} ${next.type}`
        + (next.magnitude != null ? ` · mag ${next.magnitude.toFixed(2)}` : '');
    } else {
      btnSkipEclipse.title = 'Jump to next solar eclipse';
    }
  };
  model.addEventListener('update', refreshSkipEclipse);
  refreshSkipEclipse();
  celTheoHops.appendChild(btnSkipEclipse);

  const compassControls = document.createElement('div');
  compassControls.className = 'compass-controls';

  // 2×3 grid for the main mode / jump buttons. Row 1 = visibility
  // toggles (what renders), row 2 = direct-jump / camera-mode
  // buttons. Cycle buttons (🗺 ✨) sit in a small row after the grid;
  // N / S / E / W cardinals stay on the far right.
  const modeGrid = document.createElement('div');
  modeGrid.className = 'mode-grid';

  const btnNight = document.createElement('button');
  btnNight.className = 'time-btn night-btn';
  btnNight.type = 'button';
  btnNight.textContent = '🌙';
  bindTip(btnNight, 'tip_permanent_night');
  btnNight.addEventListener('click', () => {
    model.setState({ PermanentNight: !model.state.PermanentNight });
  });

  const btnTrue = document.createElement('button');
  btnTrue.className = 'time-btn true-btn';
  btnTrue.type = 'button';
  btnTrue.textContent = '◉';
  bindTip(btnTrue, 'tip_true_positions');
  btnTrue.addEventListener('click', () => {
    model.setState({ ShowTruePositions: !model.state.ShowTruePositions });
  });

  const btnStm = document.createElement('button');
  btnStm.className = 'time-btn stm-btn';
  btnStm.type = 'button';
  btnStm.textContent = '🎯';
  bindTip(btnStm, 'tip_stm');
  btnStm.addEventListener('click', () => {
    model.setState({ SpecifiedTrackerMode: !model.state.SpecifiedTrackerMode });
  });

  const btnTrackerOpts = document.createElement('button');
  btnTrackerOpts.className = 'time-btn tracker-opts-btn';
  btnTrackerOpts.type = 'button';
  btnTrackerOpts.textContent = '🎛';
  bindTip(btnTrackerOpts, 'tip_tracker_opts_jump');
  btnTrackerOpts.addEventListener('click', () => {
    featureOpen.fn('Tracker', 'Tracker Options');
  });

  const btnObserver = document.createElement('button');
  btnObserver.className = 'time-btn observer-btn';
  btnObserver.type = 'button';
  btnObserver.textContent = '📍';
  bindTip(btnObserver, 'tip_observer_jump');
  btnObserver.addEventListener('click', () => {
    featureOpen.fn('View', 'Observer');
  });

  const btnFreeCamKb = document.createElement('button');
  btnFreeCamKb.className = 'time-btn freecam-btn';
  btnFreeCamKb.type = 'button';
  btnFreeCamKb.textContent = '🎥';
  bindTip(btnFreeCamKb, 'tip_freecam');
  btnFreeCamKb.addEventListener('click', () => {
    model.setState({ FreeCameraMode: !model.state.FreeCameraMode });
  });

  // Screenshot — copies the WebGL canvas to the clipboard as PNG.
  // Falls back to a Save As download if the Clipboard API isn't
  // available (older browsers / non-secure contexts). Lives on the
  // top row of the mode grid, right of the night button.
  const btnScreenshot = document.createElement('button');
  btnScreenshot.className = 'time-btn screenshot-btn';
  btnScreenshot.type = 'button';
  btnScreenshot.textContent = '📷';
  btnScreenshot.title = 'Copy screenshot to clipboard';
  btnScreenshot.addEventListener('click', async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    try {
      requestAnimationFrame(async () => {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          if (navigator.clipboard && window.ClipboardItem) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob }),
              ]);
              btnScreenshot.textContent = '✓';
              setTimeout(() => { btnScreenshot.textContent = '📷'; }, 1000);
              return;
            } catch (_e) { /* fall through */ }
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'fe_model_screenshot.png';
          a.click();
          URL.revokeObjectURL(url);
          btnScreenshot.textContent = '⬇';
          setTimeout(() => { btnScreenshot.textContent = '📷'; }, 1000);
        }, 'image/png');
      });
    } catch (_e) { /* ignore */ }
  });

  // Rays: opens the Show → Rays group so the four ray toggles
  // (Vault, Optical Vault, Projection, Many) are one click away.
  // GE and FE both read the same toggles; the renderer dispatches
  // on WorldModel and draws the right geometry per mode.
  const btnRays = document.createElement('button');
  btnRays.className = 'time-btn rays-btn';
  btnRays.type = 'button';
  btnRays.textContent = '🔦';
  btnRays.title = 'Rays';
  btnRays.addEventListener('click', () => {
    if (typeof featureOpen.fn === 'function') {
      featureOpen.fn('Show', 'Rays');
    }
  });

  // Grid order (CSS grid-auto-flow row, 4 columns):
  //   🌙  📷  ◉   🎯     — visibility-state toggles + screenshot
  //   🎛  📍  🎥  🔦     — navigation / camera-mode jumps + rays
  modeGrid.append(btnNight, btnScreenshot, btnTrue, btnStm,
                  btnTrackerOpts, btnObserver, btnFreeCamKb, btnRays);
  // Vault-swap + axis-line stacked vertically as a 1×2 column to
  // the left of the modeGrid's first column (the moon icon).
  const swapStack = document.createElement('div');
  swapStack.className = 'swap-stack';
  swapStack.append(btnVault, btnAxis);
  compassControls.appendChild(swapStack);
  compassControls.appendChild(modeGrid);

  // Cycle buttons sit next to the grid — they swap fundamental
  // scene backdrop (map projection + starfield) rather than toggling
  // visibility, so they're grouped apart.
  const cycleRow = document.createElement('div');
  cycleRow.className = 'cycle-row';

  const btnMap = document.createElement('button');
  btnMap.className = 'time-btn map-btn';
  btnMap.type = 'button';
  btnMap.textContent = '🗺';
  bindTip(btnMap, 'tip_map');
  btnMap.addEventListener('click', () => {
    if (typeof featureOpen.fn === 'function') {
      featureOpen.fn('Show', 'Map Projection');
    }
  });

  const btnStarfield = document.createElement('button');
  btnStarfield.className = 'time-btn starfield-btn';
  btnStarfield.type = 'button';
  btnStarfield.textContent = '✨';
  bindTip(btnStarfield, 'tip_starfield');
  btnStarfield.addEventListener('click', () => {
    if (typeof featureOpen.fn === 'function') {
      featureOpen.fn('Tracker', 'Starfield');
    }
  });

  const btnAzRing = document.createElement('button');
  btnAzRing.className = 'time-btn az-ring-btn';
  btnAzRing.type = 'button';
  btnAzRing.textContent = '🧭';
  bindTip(btnAzRing, 'tip_az_ring');
  btnAzRing.addEventListener('click', () => {
    const on = !!model.state.ShowAzimuthRing;
    // One-click compass set: Optical-cap degree labels, the ground
    // longitude ring, the Optical-vault grid, and the FE disc grid
    // all turn on / off together.
    model.setState({
      ShowAzimuthRing:      !on,
      ShowLongitudeRing:    !on,
      ShowOpticalVaultGrid: !on,
      ShowFeGrid:           !on,
    });
  });

  // Shortcut to the Info → Language Select group. Sits in the
  // cycle-row's bottom-right slot so users can swap language
  // without hunting through the Info tab. Button face shows the
  // current 2-letter id (EN / CZ / ES / …).
  const btnLang = document.createElement('button');
  btnLang.className = 'time-btn lang-btn';
  btnLang.type = 'button';
  const refreshLangBtn = () => {
    const cur = model.state.Language || 'en';
    const entry = LANGUAGES.find((l) => l.id === cur) || LANGUAGES[0];
    btnLang.textContent = entry.label;
  };
  btnLang.addEventListener('click', () => {
    if (typeof featureOpen.fn === 'function') {
      featureOpen.fn('Info', 'Language Select');
    }
  });
  bindTip(btnLang, 'lang_label');
  model.addEventListener('update', refreshLangBtn);
  refreshLangBtn();

  // World-model cycle: FE (flat disc, AE) → GE (globe sphere) → DP
  // (flat disc, dual-pole AE) → FE. State key `WorldModel`
  // ('fe' / 'ge' / 'dp'). Button face displays the *current* model.
  // Stacked directly under the grids toggle (▦).
  const btnWorld = document.createElement('button');
  btnWorld.className = 'time-btn world-btn';
  btnWorld.type = 'button';
  btnWorld.setAttribute('aria-pressed', 'true');
  const refreshWorldBtn = () => {
    const wm = model.state.WorldModel;
    btnWorld.textContent = wm === 'ge' ? 'GE' : wm === 'dp' ? 'DP' : 'FE';
  };
  btnWorld.addEventListener('click', () => {
    const cur = model.state.WorldModel;
    const next = cur === 'fe' ? 'ge' : cur === 'ge' ? 'dp' : 'fe';
    model.setState({ WorldModel: next });
  });
  model.addEventListener('update', refreshWorldBtn);
  refreshWorldBtn();

  cycleRow.append(btnMap, btnStarfield, btnAzRing, btnLang);
  compassControls.appendChild(cycleRow);

  // Cardinals live in their own 2×2 sub-grid so the N / S / E / W
  // pairing reads like a real compass rose.
  const cardinalGrid = document.createElement('div');
  cardinalGrid.className = 'cardinal-grid';
  const compassBtns = [
    { label: 'N', heading: 0   },
    { label: 'E', heading: 90  },
    { label: 'W', heading: 270 },
    { label: 'S', heading: 180 },
  ].map(({ label, heading }) => {
    const b = document.createElement('button');
    b.className = 'time-btn compass-btn';
    b.type = 'button';
    b.textContent = label;
    b.title = `Face ${label}`;
    b.dataset.heading = String(heading);
    b.addEventListener('click', () => {
      model.setState({ ObserverHeading: heading, FollowTarget: null });
    });
    cardinalGrid.appendChild(b);
    return b;
  });
  compassControls.appendChild(cardinalGrid);

  // GP Tracer toggle. Was the combined-grids button; the compass (🧭)
  // already covers the FE grid + optical-vault grid + azimuth ring +
  // longitude ring, so this slot is repurposed for the GP tracer.
  const btnGrids = document.createElement('button');
  btnGrids.className = 'time-btn grids-btn';
  btnGrids.type = 'button';
  btnGrids.textContent = '▦';
  bindTip(btnGrids, 'tip_grids');
  btnGrids.addEventListener('click', () => {
    model.setState({ ShowGPTracer: !model.state.ShowGPTracer });
  });
  const refreshGrids = () => {
    btnGrids.setAttribute('aria-pressed', model.state.ShowGPTracer ? 'true' : 'false');
  };
  model.addEventListener('update', refreshGrids);
  refreshGrids();

  // Astronomical-refraction quick toggle. Cycles
  // off → Bennett → Seidelman → off. Button face shows the active
  // formula's initial (— / B / S).
  const btnRefr = document.createElement('button');
  btnRefr.className = 'time-btn refr-btn';
  btnRefr.type = 'button';
  btnRefr.title = 'Astronomical refraction (off / Bennett / Seidelman)';
  btnRefr.addEventListener('click', () => {
    const cur = model.state.Refraction || 'off';
    const next = cur === 'off' ? 'bennett'
               : cur === 'bennett' ? 'seidelman'
               : 'off';
    model.setState({ Refraction: next });
  });
  const refreshRefr = () => {
    const cur = model.state.Refraction || 'off';
    btnRefr.textContent = cur === 'bennett' ? 'B' : cur === 'seidelman' ? 'S' : '—';
    btnRefr.setAttribute('aria-pressed', cur !== 'off' ? 'true' : 'false');
  };
  model.addEventListener('update', refreshRefr);
  refreshRefr();
  // Stack the world-model toggle (FE / GE) directly under the grids
  // button so the two related "what am I looking at" toggles share a
  // column at the right edge of the compass cluster.
  const btnClearTrace = document.createElement('button');
  btnClearTrace.className = 'time-btn clear-trace-btn';
  btnClearTrace.type = 'button';
  btnClearTrace.textContent = '⌫';
  btnClearTrace.title = 'Clear Trace';
  btnClearTrace.addEventListener('click', () => {
    model.setState({ ClearTraceCount: (model.state.ClearTraceCount | 0) + 1 });
  });

  // Distance-compass toggle. ON: map clicks drop From / Then To
  // pins instead of selecting bodies; renderer paints the pair +
  // connector and the info-bar shows the li distance. Click again
  // to toggle off (clears pair).
  const btnDistCompass = document.createElement('button');
  btnDistCompass.className = 'time-btn dist-compass-btn';
  btnDistCompass.type = 'button';
  // Inline SVG drafting compass (two diverging legs joined at a
  // pivot, with the adjustment crossbar). Unicode has no drafting-
  // compass glyph; 🧭 is the magnetic-navigation kind, 📐 is a set
  // square. SVG keeps the icon legible and scales with currentColor.
  btnDistCompass.innerHTML =
    '<svg viewBox="0 0 16 16" width="14" height="14" '
    + 'fill="none" stroke="currentColor" stroke-width="1.4" '
    + 'stroke-linecap="round" stroke-linejoin="round" '
    + 'aria-hidden="true">'
    + '<circle cx="8" cy="2.4" r="0.9" fill="currentColor" stroke="none"/>'
    + '<line x1="8" y1="3.1" x2="3" y2="13.6"/>'
    + '<line x1="8" y1="3.1" x2="13" y2="13.6"/>'
    + '<line x1="5.6" y1="8.4" x2="10.4" y2="8.4"/>'
    + '</svg>';
  btnDistCompass.title = 'Distance compass — click two map points to measure (li)';
  btnDistCompass.addEventListener('click', () => {
    const next = !model.state.DistanceCompassMode;
    model.setState({
      DistanceCompassMode: next,
      DistancePairFromLat: next ? model.state.DistancePairFromLat : null,
      DistancePairFromLon: next ? model.state.DistancePairFromLon : null,
      DistancePairToLat:   next ? model.state.DistancePairToLat   : null,
      DistancePairToLon:   next ? model.state.DistancePairToLon   : null,
    });
  });
  const refreshDistCompass = () => {
    btnDistCompass.setAttribute('aria-pressed',
      model.state.DistanceCompassMode ? 'true' : 'false');
  };
  model.addEventListener('update', refreshDistCompass);
  refreshDistCompass();

  // Two-row icon stack. Compass joins the top row alongside the
  // tracer and refraction toggles so the cluster stays 2 rows tall
  // (3 cols wide) instead of 3 rows tall.
  const tracerRow = document.createElement('div');
  tracerRow.className = 'world-row';
  tracerRow.append(btnGrids, btnRefr, btnDistCompass);

  // Bottom row carries the world-model toggle + clear-trace, with a
  // hidden spacer to match the top row's 3-slot width.
  const worldSpacer = document.createElement('span');
  worldSpacer.className = 'world-row-spacer';
  worldSpacer.setAttribute('aria-hidden', 'true');
  const worldRow = document.createElement('div');
  worldRow.className = 'world-row';
  worldRow.append(btnWorld, btnClearTrace, worldSpacer);

  const gridsStack = document.createElement('div');
  gridsStack.className = 'grids-stack';
  gridsStack.append(tracerRow, worldRow);
  compassControls.appendChild(gridsStack);


  const searchHost = document.createElement('div');
  searchHost.className = 'search-host';
  attachBodySearch(searchHost, model);

  const featureHost = document.createElement('div');
  featureHost.className = 'search-host';
  // Placeholder function — replaced once tabEntries / openTab exist.
  const featureOpen = { fn: () => {} };
  attachFeatureSearch(featureHost, (tab, group) => featureOpen.fn(tab, group), demos);

  // Two-layer wrapper:
  //   `tabsBar` (no ARIA role) — visual flex container that also
  //              carries the search inputs. ARIA forbids non-tab
  //              children inside a tablist, so this can't itself
  //              be `role="tablist"`.
  //   `tabsList` (`role="tablist"`) — narrow inner container that
  //              ONLY holds the role="tab" buttons.
  const tabsBar = document.createElement('div');
  tabsBar.className = 'tabs';
  const searchStack = document.createElement('div');
  searchStack.className = 'search-stack';
  searchStack.appendChild(searchHost);
  searchStack.appendChild(featureHost);
  tabsBar.appendChild(searchStack);

  const tabsList = document.createElement('div');
  tabsList.className = 'tabs-list';
  tabsList.setAttribute('role', 'tablist');
  tabsList.setAttribute('aria-orientation', 'horizontal');
  tabsBar.appendChild(tabsList);

  bar.append(barLeft, timeControls, compassControls, tabsBar);

  const refreshVaultBtn = () => {
    const inVault = !!model.state.InsideVault;
    btnVault.textContent = inVault ? '🌐' : '👁';
    btnVault.setAttribute('aria-pressed', inVault ? 'true' : 'false');
  };
  btnVault.addEventListener('click', () => {
    model.setState({ InsideVault: !model.state.InsideVault });
    refreshVaultBtn();
  });
  model.addEventListener('update', refreshVaultBtn);
  refreshVaultBtn();

  const refreshCompass = () => {
    const heading = ((model.state.ObserverHeading || 0) % 360 + 360) % 360;
    for (const b of compassBtns) {
      const h = Number(b.dataset.heading);
      const d = Math.min(Math.abs(heading - h), 360 - Math.abs(heading - h));
      b.setAttribute('aria-pressed', d < 0.5 ? 'true' : 'false');
    }
    btnNight.setAttribute('aria-pressed',
      model.state.PermanentNight ? 'true' : 'false');
    btnStm.setAttribute('aria-pressed',
      model.state.SpecifiedTrackerMode ? 'true' : 'false');
    btnTrue.setAttribute('aria-pressed',
      model.state.ShowTruePositions ? 'true' : 'false');
    btnFreeCamKb.setAttribute('aria-pressed',
      model.state.FreeCameraMode ? 'true' : 'false');
    btnAzRing.setAttribute('aria-pressed',
      (model.state.ShowAzimuthRing || model.state.ShowLongitudeRing) ? 'true' : 'false');
  };
  model.addEventListener('update', refreshCompass);
  refreshCompass();

  const popupsContainer = document.createElement('div');
  popupsContainer.id = 'tab-popups';

  host.append(popupsContainer, infoBar, bar);

  const tabEntries = [];
  let activeIdx = -1;

  // Anchor the popup horizontally to its tab button. The popup's
  // right edge aligns with the tab's right edge; width defaults to
  // `row + padding` but grows for the Tracker tab so the 100-button
  // grid stays legible.
  const positionPopup = (tabIdx) => {
    const entry = tabEntries[tabIdx];
    const btn = entry.btn;
    const popup = entry.popup;
    const tabLabel = btn.textContent.trim();
    const wide = tabLabel === 'Tracker' || tabLabel === 'Demos';
    const targetWidth = Math.min(window.innerWidth - 24, wide ? 560 : 380);
    const hostRect = host.getBoundingClientRect();
    const btnRect  = btn.getBoundingClientRect();
    // Right-anchor to the tab's right edge (relative to host).
    const rightFromHost = Math.max(8, hostRect.right - btnRect.right);
    popup.style.right = `${rightFromHost}px`;
    popup.style.left  = 'auto';
    popup.style.width = `${targetWidth}px`;
  };

  const openTab = (i) => {
    if (activeIdx === i) {
      tabEntries[i].popup.hidden = true;
      tabEntries[i].btn.setAttribute('aria-selected', 'false');
      activeIdx = -1;
      return;
    }
    if (activeIdx >= 0) {
      tabEntries[activeIdx].popup.hidden = true;
      tabEntries[activeIdx].btn.setAttribute('aria-selected', 'false');
    }
    positionPopup(i);
    tabEntries[i].popup.hidden = false;
    tabEntries[i].btn.setAttribute('aria-selected', 'true');
    activeIdx = i;
  };

  // Closing a tab from outside (currently dispatched by the search
  // inputs in `closeOtherPopups`). Without this hook the search would
  // hide the popup via DOM but `activeIdx` would still point at the
  // hidden tab, requiring two extra clicks to re-open it.
  document.addEventListener('fe-close-active-tab', () => {
    if (activeIdx < 0) return;
    tabEntries[activeIdx].popup.hidden = true;
    tabEntries[activeIdx].btn.setAttribute('aria-selected', 'false');
    activeIdx = -1;
  });

  // Wire the feature-search's "open this tab + expand this group"
  // callback now that tabEntries / openTab exist. Always forces the
  // requested tab active — if another popup was already open it gets
  // closed so the user's current window switches to whatever the
  // search result lives in. No-op when the tab name or group can't
  // be resolved.
  // Track the last opened (tab, group) so a re-click on the same
  // shortcut button toggles the popup closed instead of just
  // re-focusing it.
  let _lastFeatureTab = null, _lastFeatureGroup = null;
  featureOpen.fn = (tabName, groupTitle) => {
    const idx = tabEntries.findIndex(
      (t) => t.btn.textContent.trim() === tabName,
    );
    if (idx < 0) return;
    // Toggle close: if the same tab + group was the last thing the
    // user opened via a shortcut button, the second press closes
    // the popup. `null` matches `null` so a button with no group
    // arg also toggles cleanly.
    if (activeIdx === idx
        && _lastFeatureTab === tabName
        && _lastFeatureGroup === (groupTitle || null)) {
      tabEntries[idx].popup.hidden = true;
      tabEntries[idx].btn.setAttribute('aria-selected', 'false');
      activeIdx = -1;
      _lastFeatureTab = null;
      _lastFeatureGroup = null;
      return;
    }
    if (activeIdx >= 0 && activeIdx !== idx) {
      tabEntries[activeIdx].popup.hidden = true;
      tabEntries[activeIdx].btn.setAttribute('aria-selected', 'false');
    }
    // Lazy tabs (e.g. Demos) defer their build callback until the
    // tab is opened — feature-search shortcut presses count as open.
    if (typeof tabEntries[idx].ensureBuilt === 'function') {
      tabEntries[idx].ensureBuilt();
    }
    positionPopup(idx);
    tabEntries[idx].popup.hidden = false;
    tabEntries[idx].btn.setAttribute('aria-selected', 'true');
    activeIdx = idx;
    _lastFeatureTab = tabName;
    _lastFeatureGroup = groupTitle || null;
    if (!groupTitle) return;
    const popup = tabEntries[idx].popup;
    const groupEl = popup.querySelector(
      `.group[data-group-title="${CSS.escape(groupTitle)}"]`,
    );
    if (!groupEl) return;
    const header = groupEl.querySelector('.group-header');
    if (header && header.classList.contains('collapsed')) header.click();
    groupEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Keep the open popup anchored if the window resizes.
  window.addEventListener('resize', () => {
    if (activeIdx >= 0) positionPopup(activeIdx);
  });

  const TAB_KEY = {
    View: 'tab_view', Time: 'tab_time', Show: 'tab_show',
    Tracker: 'tab_tracker', Demos: 'tab_demos', Info: 'tab_info',
  };
  const registerTab = (label, buildInto, { lazy = false } = {}) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');
    const key = TAB_KEY[label];
    btn.textContent = key ? t(key) : label;
    if (key) onLangChange(() => { btn.textContent = t(key); });
    tabsList.appendChild(btn);

    const popup = document.createElement('div');
    popup.className = 'tab-popup';
    popup.hidden = true;
    popupsContainer.appendChild(popup);

    // Heavy tab bodies (e.g. Demos with its 80+ button list) defer
    // their build callback until the user actually opens the tab.
    // Cuts initial DOM size + cold-start JS execution time.
    let _built = false;
    const ensureBuilt = () => {
      if (_built) return;
      _built = true;
      buildInto(popup);
    };
    if (!lazy) ensureBuilt();

    const idx = tabEntries.length;
    tabEntries.push({ btn, popup, ensureBuilt });
    btn.addEventListener('click', () => {
      ensureBuilt();
      openTab(idx);
    });
  };

  for (const tab of FIELD_GROUPS) {
    registerTab(tab.tab, (popup) => {
      const popupGroups = new Set();
      for (const g of tab.groups) {
        const { el } = buildGroup(model, g.title, g.rows, popupGroups);
        popup.appendChild(el);
      }
      if (tab.tab === 'Time') {
        const cal = buildGroup(model, 'Calendar', [], popupGroups);
        cal.body.appendChild(timezoneRow(model));
        cal.body.appendChild(dateTimeRow(model));
        popup.appendChild(cal.el);

        const auto = buildGroup(model, 'Autoplay', [], popupGroups);
        autoplay.renderInto(auto.body);
        popup.appendChild(auto.el);
      }
      if (tab.tab === 'View') {
        const dc = buildGroup(model, 'Distance Calc', [], popupGroups);
        dc.body.appendChild(distanceCalcPanel(model));
        popup.appendChild(dc.el);
      }
    });
  }

  if (demos) {
    registerTab('Demos', (popup) => {
      const host = document.createElement('div');
      host.className = 'demos-host';
      popup.appendChild(host);
      demos.renderInto(host);
    }, { lazy: true });
  }

  registerTab('Info', (popup) => {
    const popupGroups = new Set();
    const makeSection = (title, links) => {
      const g = buildGroup(model, title, [], popupGroups);
      const list = document.createElement('div');
      list.className = 'info-links';
      for (const l of links) {
        const a = document.createElement('a');
        a.className = 'info-link';
        a.href = l.href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = l.label;
        list.appendChild(a);
      }
      g.body.appendChild(list);
      popup.appendChild(g.el);
    };
    makeSection('Space Audits', [
      { label: 'YouTube',   href: 'https://www.youtube.com/@space_audits' },
      { label: 'Obsidian',  href: 'https://publish.obsidian.md/spaceaudits' },
      { label: 'X',         href: 'https://x.com/space_audits' },
      { label: 'Telegram',  href: 'https://t.me/spaceaudits' },
      { label: 'Website',   href: 'https://spaceaudits.net' },
    ]);
    makeSection('Shane St. Pierre', [
      { label: 'X',         href: 'https://x.com/AntiDisinfo86' },
      { label: 'YouTube',   href: 'https://www.youtube.com/@shanestpierre' },
      { label: 'ADL',       href: 'https://adl.place' },
    ]);
    makeSection('Man of Stone', [
      { label: 'X',         href: 'https://x.com/Inventionaire' },
      { label: 'Rumble',    href: 'https://rumble.com/c/c-7782904?e9s=src_v1_cmd' },
      { label: 'Telegram',  href: 'https://t.me/+CVNNswIjrT45OTA0' },
    ]);
    makeSection('Globebusters', [
      { label: 'YouTube',     href: 'https://www.youtube.com/@GLOBEBUSTERS1' },
      { label: 'S13 Playlist', href: 'https://www.youtube.com/watch?v=_hf7LduxSzY&list=PLvq003QsCfCuGpSNkPiNTtU1xtEuVFgTO' },
      { label: 'S14 Playlist', href: 'https://www.youtube.com/watch?v=ghuXev6qft4&list=PLvq003QsCfCuID9WbOsL-ci501yAey2SE' },
      { label: 'S15 Playlist', href: 'https://www.youtube.com/watch?v=1NFQNT3to5s&list=PLvq003QsCfCv3v-i7hYPtqcofn_huOSUZ' },
    ]);
    makeSection('Aether Cosmology CZ-SK', [
      { label: 'Kick',      href: 'https://kick.com/aethercosmologyczsk' },
      { label: 'YouTube',   href: 'https://www.youtube.com/@AetherCosmologyCZSK' },
      { label: 'Instagram', href: 'https://www.instagram.com/domo_noglobe/' },
      { label: 'Facebook',  href: 'https://www.facebook.com/people/Domo-Noglobe/61583879655677/' },
      { label: 'Telegram',  href: 'https://t.me/AetherCosmologyczsk' },
    ]);
    makeSection('Discord', [
      { label: 'Aether Cosmology', href: 'https://discord.gg/aethercosmology' },
      { label: 'Earth Awakenings', href: 'https://discord.gg/earthawakenings' },
    ]);
    makeSection('Clubhouse', [
      { label: '#FlatEarthGang', href: 'https://www.clubhouse.com/club/flatearthgang' },
    ]);
    makeSection('Twitter Community', [
      {
        label: 'FE Community Friday X Spaces hosted by Ken and Brian',
        href: 'https://x.com/ken_caudle',
      },
    ]);

    // Language Select — full-name buttons, only one active at a time.
    const langGroup = buildGroup(model, 'Language Select', [], popupGroups);
    const langGrid = document.createElement('div');
    langGrid.className = 'lang-select-grid';
    const langBtnEls = [];
    for (const l of LANGUAGES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-select-btn';
      btn.dataset.langId = l.id;
      btn.textContent = `${l.label} — ${LANG_NATIVE_NAMES[l.id] || l.id}`;
      btn.addEventListener('click', () => {
        if (model.state.Language !== l.id) model.setState({ Language: l.id });
      });
      langGrid.appendChild(btn);
      langBtnEls.push(btn);
    }
    const refreshLangActive = () => {
      const cur = model.state.Language || 'en';
      for (const b of langBtnEls) {
        b.setAttribute('aria-pressed', b.dataset.langId === cur ? 'true' : 'false');
      }
    };
    model.addEventListener('update', refreshLangActive);
    refreshLangActive();
    langGroup.body.appendChild(langGrid);
    popup.appendChild(langGroup.el);
  });

  // Wire the bar's time controls into Autoplay.
  // While a demo is active, autoplay is suspended so demo-Pause
  // truly freezes time. `_autoplayWasPlaying` snapshots the prior
  // state at demo start; non-null means demo holds the suspension.
  let _autoplayWasPlaying = null;
  const refreshTimeControls = () => {
    const a = demos && demos.animator;
    const demoPlaying = !!a && (a.isPlaying() || a.isPaused());
    if (demoPlaying && _autoplayWasPlaying === null) {
      _autoplayWasPlaying = autoplay.playing;
      if (autoplay.playing) autoplay.pause();
    } else if (!demoPlaying && _autoplayWasPlaying !== null) {
      const restore = _autoplayWasPlaying;
      _autoplayWasPlaying = null;
      if (restore && !autoplay.playing) autoplay.play();
    }
    btnEndDemo.hidden = !demoPlaying;
    btnEndTracking.hidden = !(model.state.FollowTarget
                              || model.state.FreeCamActive);
    if (demoPlaying) {
      btnPlay.textContent = a.isPaused() ? '▶' : '⏸';
      const lbl = `demo ${a.speedScale.toFixed(2)}×`;
      speedReadout.textContent = lbl;
      if (slotSpeed) slotSpeed.textContent = lbl;
      return;
    }
    btnPlay.textContent = autoplay.playing ? '⏸' : '▶';
    const s = autoplay.speed;
    const lbl = `${s >= 0 ? '+' : ''}${s.toFixed(3)} d/s`;
    speedReadout.textContent = lbl;
    if (slotSpeed) slotSpeed.textContent = lbl;
  };
  const DEFAULT_SPEED = 1 / 24; // Day preset: 1 sim-hour per real-second.
  const MIN_SPEED = DEFAULT_SPEED / 128;
  const MAX_SPEED = DEFAULT_SPEED * 128;
  const clampSign = (v) => Math.sign(v) || 1;
  const clampMag  = (v) => Math.min(MAX_SPEED, Math.max(MIN_SPEED, Math.abs(v)));

  // Helpers: route play/pause/slow/speed to the demo animator when a
  // demo is active, so the transport bar behaves the same way in
  // General, Eclipse, and any other demo context.
  const demoActive = () => {
    const a = demos && demos.animator;
    return !!a && (a.isPlaying() || a.isPaused());
  };
  btnPlay.addEventListener('click', () => {
    if (demoActive()) {
      const a = demos.animator;
      if (a.isPaused()) a.resume();
      else a.pause();
      refreshTimeControls();
      return;
    }
    // Play/pause resets the speed multiplier back to the Day preset so
    // a fresh press always starts at a known cadence. Slow/Speed
    // buttons persist across a subsequent pause and resume on their
    // next click.
    autoplay.setSpeed(DEFAULT_SPEED);
    autoplay.toggle();
    refreshTimeControls();
  });
  btnRew.addEventListener('click', () => {
    const s = autoplay.speed;
    if (s > 0) autoplay.setSpeed(-s);
    else autoplay.setSpeed(s * 2);
    if (!autoplay.playing) autoplay.play();
    refreshTimeControls();
  });
  btnFf.addEventListener('click', () => {
    const s = autoplay.speed;
    if (s < 0) autoplay.setSpeed(-s);
    else autoplay.setSpeed(s * 2);
    if (!autoplay.playing) autoplay.play();
    refreshTimeControls();
  });
  btnSlow.addEventListener('click', () => {
    if (demoActive()) {
      const a = demos.animator;
      a.setSpeedScale(a.speedScale / 2);
      if (a.isPaused()) a.resume();
      refreshTimeControls();
      return;
    }
    // Halve the current speed magnitude (direction preserved). Also
    // works when rewinding: -1/24 → -1/48 (slower backward). If the
    // user is paused, resume play at the new (slower) speed.
    const s = autoplay.speed || DEFAULT_SPEED;
    const next = clampSign(s) * clampMag(Math.abs(s) / 2);
    autoplay.setSpeed(next);
    if (!autoplay.playing) autoplay.play();
    refreshTimeControls();
  });
  btnSpeed.addEventListener('click', () => {
    if (demoActive()) {
      const a = demos.animator;
      a.setSpeedScale(a.speedScale * 2);
      if (a.isPaused()) a.resume();
      refreshTimeControls();
      return;
    }
    // Double the current speed magnitude, same direction. Works for
    // rewind too (-1/24 → -1/12 faster backward). Resume play if
    // paused.
    const s = autoplay.speed || DEFAULT_SPEED;
    const next = clampSign(s) * clampMag(Math.abs(s) * 2);
    autoplay.setSpeed(next);
    if (!autoplay.playing) autoplay.play();
    refreshTimeControls();
  });
  btnRealtime.addEventListener('click', () => {
    // 1 sim second per real second = 1 / 86400 days/sec. Set the
    // speed directly (bypassing `clampMag`'s lower bound, which is
    // still ~30× faster than real time) and start playback.
    autoplay.setSpeed(1 / 86400);
    if (!autoplay.playing) autoplay.play();
    refreshTimeControls();
  });
  autoplay.onChange(refreshTimeControls);
  model.addEventListener('update', refreshTimeControls);
  refreshTimeControls();

  // Escape priority:
  //   1. close any tab popup if open
  //   2. pause a running demo animator
  //   3. clear tracking / free-cam
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (activeIdx >= 0) {
      const entry = tabEntries[activeIdx];
      entry.popup.hidden = true;
      entry.btn.setAttribute('aria-selected', 'false');
      activeIdx = -1;
      return;
    }
    const a = demos && demos.animator;
    if (a && a.isPlaying && a.isPlaying() && !a.isPaused()) {
      a.pause();
      refreshTimeControls();
      return;
    }
    if (model.state.FollowTarget || model.state.FreeCamActive) {
      model.setState({
        FollowTarget: null,
        FreeCamActive: false,
        SpecifiedTrackerMode: false,
      });
    }
  });
}

// Phase name for a given lit fraction + waxing flag.
function moonPhaseName(frac, waxing) {
  if (frac < 0.02) return 'New';
  if (frac > 0.98) return 'Full';
  if (Math.abs(frac - 0.5) < 0.05) return waxing ? 'First Quarter' : 'Last Quarter';
  if (frac < 0.5)  return waxing ? 'Waxing Crescent' : 'Waning Crescent';
  return waxing ? 'Waxing Gibbous' : 'Waning Gibbous';
}

// Draw the moon disc with the lit / dark distribution. `frac` is the
// illuminated fraction (0..1); `waxing` flips the orientation so the lit
// limb sits on the right (waxing) or the left (waning).
function drawMoonPhase(ctx, cx, cy, r, frac, waxing) {
  ctx.save();
  ctx.translate(cx, cy);
  if (!waxing) ctx.scale(-1, 1);   // mirror so lit side switches limb

  // Dark base disc.
  ctx.fillStyle = '#22262e';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, 2 * Math.PI);
  ctx.fill();

  if (frac > 0.001) {
    if (frac > 0.999) {
      ctx.fillStyle = '#f4f4f4';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Lit half (right semicircle).
      ctx.fillStyle = '#f4f4f4';
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
      ctx.fill();

      const ellipseR = Math.abs(1 - 2 * frac) * r;
      if (frac < 0.5) {
        // Crescent: carve a dark ellipse out of the lit half.
        ctx.fillStyle = '#22262e';
        ctx.beginPath();
        ctx.ellipse(0, 0, ellipseR, r, 0, -Math.PI / 2, Math.PI / 2, false);
        ctx.fill();
      } else {
        // Gibbous: extend lit area onto the dark side with a light ellipse.
        ctx.fillStyle = '#f4f4f4';
        ctx.beginPath();
        ctx.ellipse(0, 0, ellipseR, r, 0, Math.PI / 2, -Math.PI / 2, false);
        ctx.fill();
      }
    }
  }

  // Outline.
  ctx.strokeStyle = '#6a7180';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

// Horizontal % bar with a moving fill.
function drawIlluminationBar(ctx, x, y, w, h, frac) {
  ctx.fillStyle = '#1a1f2a';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#f4f4f4';
  ctx.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * frac), h - 2);
  ctx.strokeStyle = '#6a7180';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

export function buildHud(hudEl, model) {
  // "Live Moon Phases" collapsible at the top. Body holds the moon
  // canvas + label plus the eclipse countdown lines so the whole
  // moon / eclipse stack collapses together.
  const moonWrapper = document.createElement('div');
  moonWrapper.className = 'moon-phase-wrapper';
  const moonHeader = document.createElement('button');
  moonHeader.type = 'button';
  moonHeader.className = 'moon-phase-header';
  const moonTri = document.createElement('span');
  moonTri.className = 'tri';
  const moonLabelNode = document.createTextNode(' ' + t('panel_live_moon_phases'));
  moonHeader.append(moonTri, moonLabelNode);
  onLangChange(() => { moonLabelNode.nodeValue = ' ' + t('panel_live_moon_phases'); });
  moonWrapper.appendChild(moonHeader);
  const moonBody = document.createElement('div');
  moonBody.className = 'moon-phase-body';
  const lines = ['time', 'sun', 'moon'].map(() => {
    const d = document.createElement('div');
    d.className = 'line';
    moonBody.appendChild(d);
    return d;
  });
  const canvas = document.createElement('canvas');
  canvas.width = 132; canvas.height = 56;
  canvas.className = 'moon-phase-canvas';
  const moonLabel = document.createElement('div');
  moonLabel.className = 'moon-phase-label';
  const moonPhaseRow = document.createElement('div');
  moonPhaseRow.className = 'moon-phase-row';
  moonPhaseRow.appendChild(canvas);
  moonPhaseRow.appendChild(moonLabel);
  moonBody.appendChild(moonPhaseRow);
  const solarEcLine = document.createElement('div');
  solarEcLine.className = 'line';
  const lunarEcLine = document.createElement('div');
  lunarEcLine.className = 'line';
  moonBody.appendChild(solarEcLine);
  moonBody.appendChild(lunarEcLine);
  moonWrapper.appendChild(moonBody);
  hudEl.appendChild(moonWrapper);

  moonHeader.addEventListener('click', () => {
    model.setState({ MoonPhaseExpanded: !model.state.MoonPhaseExpanded });
  });
  const refreshMoonCollapsible = () => {
    const exp = !!model.state.MoonPhaseExpanded;
    moonBody.style.display = exp ? '' : 'none';
    moonTri.textContent = exp ? '▼' : '▶';
    moonHeader.setAttribute('aria-expanded', exp ? 'true' : 'false');
  };
  model.addEventListener('update', refreshMoonCollapsible);
  refreshMoonCollapsible();

  const fmt = (v, p = 1) => v.toFixed(p).padStart(6);
  const refresh = () => {
    const c = model.computed;
    const s = model.state;
    lines[0].textContent = dateTimeToString(s.DateTime);
    lines[1].textContent = c.SunAnglesGlobe.elevation >= 0
      ? `Sun:  az ${fmt(c.SunAnglesGlobe.azimuth)}°  el ${fmt(c.SunAnglesGlobe.elevation)}°`
      : `Sun:  ${t('beyond_vault')}`;
    lines[2].textContent = c.MoonAnglesGlobe.elevation >= 0
      ? `Moon: az ${fmt(c.MoonAnglesGlobe.azimuth)}°  el ${fmt(c.MoonAnglesGlobe.elevation)}°  phase ${(c.MoonPhaseFraction * 100).toFixed(0)}%`
      : `Moon: ${t('beyond_vault')}  phase ${(c.MoonPhaseFraction * 100).toFixed(0)}%`;

    const ec = nextEclipses(s.DateTime);
    const now = dateTimeToDate(s.DateTime);
    solarEcLine.textContent = ec.nextSolar
      ? `${t('next_solar_eclipse')}: ${shortDate(ec.nextSolar)}  ${formatCountdown(now, ec.nextSolar)}`
      : `${t('next_solar_eclipse')}: —`;
    lunarEcLine.textContent = ec.nextLunar
      ? `${t('next_lunar_eclipse')}: ${shortDate(ec.nextLunar)}  ${formatCountdown(now, ec.nextLunar)}`
      : `${t('next_lunar_eclipse')}: —`;

    // Waxing / waning from moon-sun longitude difference: when the moon is
    // east of the sun (RA difference 0..π) it's waxing toward full.
    const dRA = ((c.MoonRA - c.SunRA) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const waxing = dRA < Math.PI;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMoonPhase(ctx, 28, 28, 22, c.MoonPhaseFraction, waxing);
    drawIlluminationBar(ctx, 60, 32, 64, 8, c.MoonPhaseFraction);
    moonLabel.textContent =
      `${moonPhaseName(c.MoonPhaseFraction, waxing)}  ·  ${(c.MoonPhaseFraction * 100).toFixed(0)}%`;
  };
  model.addEventListener('update', refresh);
  refresh();
}

// / /: Tracker HUD panel. One `.tracker-block` per
// tracked target. Both Geo and Helio rows use the same `.source-line`
// style regardless of the `BodySource` selection — the audience sees
// both readouts equally, which is the point of the dual-pipeline
// display (each tick of time, the two rows advance in sync proving
// the helioc and geoc pipelines converge).
//
// Refresh is keyed-cache based so adding a target or changing time
// just updates textContent in place. Every refresh recomputes text
// unconditionally; there's no "skip if already right" branching that
// could leave a block stale.
export function buildTrackerHud(trackerEl, model) {
  trackerEl.classList.add('tracker-hud');

  // Vertical side tab that toggles `ShowLiveEphemeris`. Always present
  // in the DOM; clicking shows/hides the multi-column HUD.
  let tabBtn = document.getElementById('live-ephem-tab');
  if (!tabBtn) {
    tabBtn = document.createElement('button');
    tabBtn.id = 'live-ephem-tab';
    tabBtn.type = 'button';
    tabBtn.textContent = t('panel_live_ephemeris_data');
    onLangChange(() => { tabBtn.textContent = t('panel_live_ephemeris_data'); });
    const hudEl = document.getElementById('hud')
      || document.getElementById('view')
      || document.body;
    hudEl.appendChild(tabBtn);
  }
  tabBtn.addEventListener('click', () => {
    model.setState({ ShowLiveEphemeris: !model.state.ShowLiveEphemeris });
  });
  const refreshTabPressed = () => {
    tabBtn.setAttribute('aria-pressed',
      model.state.ShowLiveEphemeris ? 'true' : 'false');
  };

  // Re-anchor #tracker-hud just below #hud so collapsing the
  // moon-phase widget pulls the tracker HUD up with it. Reads are
  // batched into a rAF callback so the
  // `getBoundingClientRect` queries don't synchronously flush
  // layout when called inside a ResizeObserver / resize event
  // handler that may be fired alongside other DOM mutations.
  const hudHost = document.getElementById('hud');
  const viewHost = document.getElementById('view');
  let _trackerAnchorRaf = 0;
  let _trackerAnchorLastTop = -1;
  const positionTrackerBelowHud = () => {
    if (!hudHost || !viewHost) return;
    if (_trackerAnchorRaf) return;
    _trackerAnchorRaf = requestAnimationFrame(() => {
      _trackerAnchorRaf = 0;
      const hudRect  = hudHost.getBoundingClientRect();
      const viewRect = viewHost.getBoundingClientRect();
      const top = Math.round(hudRect.bottom - viewRect.top + 8);
      if (top !== _trackerAnchorLastTop) {
        _trackerAnchorLastTop = top;
        trackerEl.style.top = `${top}px`;
      }
    });
  };
  if (hudHost && typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(positionTrackerBelowHud).observe(hudHost);
  }
  window.addEventListener('resize', positionTrackerBelowHud);

  const fmtDeg = (v, p = 1) => (v >= 0 ? '+' : '') + v.toFixed(p);
  const fmtHours = (raRad) => {
    // pipelines that don't carry this body return NaN so the
    // HUD can render "no data" explicitly instead of a spurious
    // 00h00m00.0s row.
    if (!Number.isFinite(raRad)) return '—';
    const h = ((raRad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) * 12 / Math.PI;
    const hh = Math.floor(h);
    const mm = Math.floor((h - hh) * 60);
    const ss = ((h - hh) * 60 - mm) * 60;
    return `${String(hh).padStart(2, '0')}ʰ${String(mm).padStart(2, '0')}ᵐ${ss.toFixed(1).padStart(4, '0')}ˢ`;
  };
  const fmtDms = (decRad) => {
    if (!Number.isFinite(decRad)) return '—';
    const d = decRad * 180 / Math.PI;
    const sign = d < 0 ? '−' : '+';
    const abs = Math.abs(d);
    const dd = Math.floor(abs);
    const mRaw = (abs - dd) * 60;
    const mm = Math.floor(mRaw);
    const ss = (mRaw - mm) * 60;
    return `${sign}${String(dd).padStart(2, '0')}°${String(mm).padStart(2, '0')}′${ss.toFixed(1).padStart(4, '0')}″`;
  };
  // az is already 0–360 degrees, el is already ±90 degrees;
  // both as decimal numbers from the observer pipeline. Produce
  // Stellarium-style signed dms for both. Az uses 3-digit degrees
  // (0–360), el uses 2-digit signed degrees.
  const fmtDmsDegAz = (deg) => {
    const d = ((deg % 360) + 360) % 360;
    const dd = Math.floor(d);
    const mRaw = (d - dd) * 60;
    const mm = Math.floor(mRaw);
    const ss = (mRaw - mm) * 60;
    return `+${String(dd).padStart(3, '0')}°${String(mm).padStart(2, '0')}′${ss.toFixed(1).padStart(4, '0')}″`;
  };
  const fmtDmsDegEl = (deg) => {
    const sign = deg < 0 ? '−' : '+';
    const abs = Math.abs(deg);
    const dd = Math.floor(abs);
    const mRaw = (abs - dd) * 60;
    const mm = Math.floor(mRaw);
    const ss = (mRaw - mm) * 60;
    return `${sign}${String(dd).padStart(2, '0')}°${String(mm).padStart(2, '0')}′${ss.toFixed(1).padStart(4, '0')}″`;
  };

  // target id → { block, title, azel, helio, geo, ptolemy, astropixels,
  // vsop87, foot } DOM nodes kept across refreshes. added Ptolemy,
  // added AstroPixels/DE405, added VSOP87.
  const blockCache = new Map();

  function makeBlock() {
    const block = document.createElement('div');
    block.className = 'tracker-block';
    const title = document.createElement('div');
    title.className = 'line tracker-title';
    block.appendChild(title);
    const azel = document.createElement('div');
    azel.className = 'line';
    block.appendChild(azel);
    const refr = document.createElement('div');
    refr.className = 'line tracker-refr';
    block.appendChild(refr);
    const geo = document.createElement('div');
    geo.className = 'line source-line';
    block.appendChild(geo);
    const ptolemy = document.createElement('div');
    ptolemy.className = 'line source-line';
    block.appendChild(ptolemy);
    const astropixels = document.createElement('div');
    astropixels.className = 'line source-line';
    block.appendChild(astropixels);
    const vsop87 = document.createElement('div');
    vsop87.className = 'line source-line';
    block.appendChild(vsop87);
    const foot = document.createElement('div');
    foot.className = 'line tracker-foot';
    block.appendChild(foot);
    return { block, title, azel, refr, geo, ptolemy, astropixels, vsop87, foot };
  }

  const refresh = () => {
    refreshTabPressed();
    positionTrackerBelowHud();
    const allInfos = model.computed.TrackerInfos || [];
    // When the tracker holds many stars (e.g. a full catalog), the
    // HUD's per-target block list balloons. Stars carry only a
    // single (RA, Dec) anyway, so collapse the star list down to
    // just the one being actively followed (and any non-star
    // entries — sun / moon / planets / satellites — pass through
    // untouched). If no follow-target is set the star block is
    // simply hidden.
    const _followId = model.state.FollowTarget;
    const _allowedStarTarget = _followId && _followId.startsWith('star:') ? _followId : null;
    const infos = allInfos.filter((i) => {
      if (i._followOnly) return false;
      if (i.category === 'star') return i.target === _allowedStarTarget;
      return true;
    });
    const showHud = !!model.state.ShowLiveEphemeris && infos.length > 0;
    if (!showHud) {
      trackerEl.style.display = 'none';
      for (const { block } of blockCache.values()) block.remove();
      blockCache.clear();
      return;
    }
    trackerEl.style.display = '';
    trackerEl.classList.toggle('expanded',
      model.state.ShowEphemerisReadings === true);

    const stamp = dateTimeToString(model.state.DateTime);

    // Discard blocks for targets no longer selected.
    const keep = new Set(infos.map((i) => i.target));
    for (const [id, rec] of blockCache) {
      if (!keep.has(id)) {
        rec.block.remove();
        blockCache.delete(id);
      }
    }

    // Create-or-reuse a block per target, update text unconditionally.
    for (const info of infos) {
      let rec = blockCache.get(info.target);
      if (!rec) {
        rec = makeBlock();
        blockCache.set(info.target, rec);
      }
      // Attach / re-attach — no-op if already a child; cheap fallback
      // if the cache got out of sync with the DOM.
      if (rec.block.parentNode !== trackerEl) trackerEl.appendChild(rec.block);

      const cat = info.category === 'star'
        ? (info.subCategory === 'blackhole' ? 'black hole'
          : info.subCategory === 'quasar'   ? 'quasar'
          : info.subCategory === 'galaxy'   ? 'galaxy'
          : 'star')
        : info.category === 'planet' ? 'planet'
        : 'luminary';
      rec.title.textContent = `${info.name} (${cat})`;
      const _chineseOn = !!model.state.ShowChineseDu;
      const _withDu = (deg, dmsStr, signed = false) =>
        _chineseOn && Number.isFinite(deg)
          ? `${dmsStr}  ·  ${fmtDuFen(deg, signed)}`
          : dmsStr;
      rec.azel.textContent  = `az ${_withDu(info.azimuth, fmtDmsDegAz(info.azimuth))}   el ${_withDu(info.elevation, fmtDmsDegEl(info.elevation), true)}`;
      // Refraction lift in arcminutes when a formula is active and
      // the body is above the horizon. Hidden otherwise so the row
      // doesn't take up space when refraction is off.
      const refrDeg = Number.isFinite(info.refractionDeg) ? info.refractionDeg : 0;
      const refrOn = (model.state.Refraction && model.state.Refraction !== 'off');
      if (refrOn && refrDeg > 0) {
        const formulaName = model.state.Refraction === 'bennett' ? 'Bennett' : 'Seidelman';
        const arcmin = refrDeg * 60;
        rec.refr.textContent = `refr (${formulaName}): +${arcmin.toFixed(2)}′  (apparent ${fmtDmsDegEl(info.elevation + refrDeg)})`;
        rec.refr.hidden = false;
      } else {
        rec.refr.textContent = '';
        rec.refr.hidden = true;
      }
      // ephemeris-comparison block hides entirely for stars
      // (their RA/Dec doesn't depend on pipeline) and for sun/moon/
      // planets when `ShowEphemerisReadings` is off. Keeps the
      // tracker HUD compact by default.
      const showReadings = info.category !== 'star'
        && model.state.ShowEphemerisReadings === true;
      rec.geo.hidden = !showReadings;
      rec.ptolemy.hidden = !showReadings;
      rec.astropixels.hidden = !showReadings;
      rec.vsop87.hidden = !showReadings;
      if (showReadings) {
        // Each pipeline's RA / Dec is followed by its converted
        // az / el so the user can see how a different RA / Dec
        // value lands in the local sky frame, not just on the
        // celestial sphere.
        const lat = model.state.ObserverLat;
        const lon = model.state.ObserverLong;
        const gmst = model.computed.SkyRotAngle || 0;
        const fmtRow = (label, reading) => {
          const r = reading || { ra: NaN, dec: NaN };
          const ae = raDecToAzEl(r.ra, r.dec, lat, lon, gmst);
          const azStr = Number.isFinite(ae.azimuth)   ? fmtDmsDegAz(ae.azimuth)   : '—';
          const elStr = Number.isFinite(ae.elevation) ? fmtDmsDegEl(ae.elevation) : '—';
          return `${label.padEnd(6)}: RA ${fmtHours(r.ra)}   Dec ${fmtDms(r.dec)}   Az ${azStr}   El ${elStr}`;
        };
        rec.geo.textContent         = fmtRow('GeoC',   info.geoReading);
        rec.ptolemy.textContent     = fmtRow('Ptol',   info.ptolemyReading);
        rec.astropixels.textContent = fmtRow('DE405',  info.astropixelsReading);
        rec.vsop87.textContent      = fmtRow('VSOP87', info.vsop87Reading);
      }
      const magTag = (info.mag != null) ? `   mag ${info.mag.toFixed(2)}` : '';
      rec.foot.textContent = `${stamp}${magTag}`;
    }

    // Re-order blocks to match the infos[] ordering. `appendChild` on
    // an existing child moves it to the end, so walking infos and
    // appending each block once produces the correct final order.
    for (const info of infos) {
      const rec = blockCache.get(info.target);
      if (rec) trackerEl.appendChild(rec.block);
    }
  };

  model.addEventListener('update', refresh);
  refresh();
}
