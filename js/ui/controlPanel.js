// Control panel: tabs + grouped sliders/inputs/checkboxes that bind to the
// FeModel state. No external framework — plain DOM.

import { dateTimeToString, dateTimeToDate } from '../core/time.js';
import { TIME_ORIGIN } from '../core/constants.js';
import { findNextEclipses } from '../core/ephemeris.js';
import { CEL_NAV_SELECT_OPTIONS, CEL_NAV_STARS } from '../core/celnavStars.js';
import { CATALOGUED_STARS } from '../core/constellations.js';
import { listProjections } from '../core/projections.js';
import { Autoplay } from './autoplay.js';

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
// S009b — changing the TZ dropdown now **shifts the UTC instant** so the
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
  const sel = el.querySelector('select');
  function refresh() { sel.value = String(model.state.TimezoneOffsetMinutes || 0); }
  sel.addEventListener('change', () => {
    // S009b — Path B: flipping the timezone holds the DISPLAYED
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
          { value: 'none',     label: 'None' },
        ]},
        // S009b — step 0.0001° ≈ 0.36" so the number field gives
        // sub-arcsecond granularity (needed for Stellarium-parity
        // tests at a specific observatory / nav-fix coordinate).
        { key: 'ObserverLat',  label: 'ObserverLat',  unit: '°', min: -90,  max:  90,  step: 0.0001 },
        { key: 'ObserverLong', label: 'ObserverLong', unit: '°', min: -180, max: 180,  step: 0.0001 },
        // S208 — Observer.Elevation now represents the observer's
        // gaze pitch (elevation angle above the horizon), 0°–90°.
        // Bound to `CameraHeight`, which drives the first-person
        // look-up/down in Optical mode (it's also the orbit-elevation
        // key in Heavenly, but the 0–90 range reads the same way
        // there — angle above the disc plane). 0° = looking at the
        // horizon; 90° = looking straight up. The mouse-drag pitch
        // updates this slider in real time and vice versa.
        //
        // The physical `ObserverElevation` state field (S007, observer
        // height above the disc) still exists and is still URL-
        // persisted and clamped in `app.update()`; it just isn't
        // bound to this row anymore.
        { key: 'CameraHeight', label: 'Elevation', unit: '°', min: 0, max: 90, step: 0.1 },
        // S224 — "Facing" row renamed to "Azi" and moved up directly
        // under Elevation so the observer's own angular pair reads
        // together (Elevation + Azi) before the cursor-tracking pair
        // (Mouse El + Mouse Az) below it.
        { key: 'ObserverHeading', label: 'Azi',       unit: '°', min: 0,    max: 360,  step: 0.0001, cardinal: true },
        // S211 — live cursor elevation readout. Tracks the elevation
        // of the ray from the observer through the mouse pointer
        // while the pointer is over the canvas in Optical mode. Shows
        // "—" in Heavenly or when the pointer is off-canvas.
        { key: 'MouseElevation', label: 'Mouse El', unit: '°', readout: true, digits: 1 },
        // S212 — companion cursor azimuth readout (compass degrees CW
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
        // S221
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
      { title: 'Visibility', rows: [
        { key: 'ShowFeGrid',          label: 'FE Grid',            bool: true },
        { key: 'ShowLatitudeLines',   label: 'Tropics / Polar',    bool: true },
        { key: 'ShowGroundPoints',    label: 'Sun / Moon GP',      bool: true },
        { key: 'ShowVault',           label: 'Heavenly Vault',     bool: true },
        { key: 'ShowVaultGrid',       label: 'Vault Grid',         bool: true },
        { key: 'ShowShadow',          label: 'Shadow',             bool: true },
        { key: 'ShowSunTrack',        label: 'Sun Track',          bool: true },
        { key: 'ShowMoonTrack',       label: 'Moon Track',         bool: true },
        { key: 'ShowOpticalVault',    label: 'Optical Vault',      bool: true },
        // S213 — grid-only toggle for the Optical Vault. When off the
        // cap surface stays but the grid + azi/elev labels are hidden
        // (the label hides are forced, overriding ShowAzimuthRing).
        { key: 'ShowOpticalVaultGrid', label: 'Optical Vault Grid', bool: true },
        { key: 'ShowTruePositions',   label: 'True Positions',     bool: true },
        { key: 'ShowFacingVector',    label: 'Facing Vector / N-S-E-W', bool: true },
        { key: 'ShowDecCircles',      label: 'Declination Circles',     bool: true },
        // S215 — red dot at NCP, blue dot at SCP, projected onto the
        // observer's optical vault.
        { key: 'ShowCelestialPoles',  label: 'Celestial Poles',    bool: true },
        { key: 'ShowStars',           label: 'Stars',              bool: true },
        { key: 'ShowConstellations',      label: 'Constellations',        bool: true },
        { key: 'ShowConstellationLines',  label: 'Constellation outlines', bool: true },
        { key: 'ShowLongitudeRing',       label: 'Longitude ring (ground)', bool: true },
        { key: 'ShowAzimuthRing',         label: 'Azimuth ring (vault)',    bool: true },
        { key: 'DynamicStars',        label: 'Starfield Mode',
          boolSelect: { trueLabel: 'Dynamic (fade w/ day)', falseLabel: 'Static (always visible)' } },
        { key: 'ShowVaultRays',       label: 'Vault Rays',         bool: true },
        { key: 'ShowOpticalVaultRays', label: 'Optical Vault Rays', bool: true },
        { key: 'ShowManyRays',        label: 'Many Rays',          bool: true },
        // S223 — true→projected ray per body (sun, moon, planets).
        // Hidden when the body is below horizon.
        { key: 'ShowProjectionRays',  label: 'Projection Rays',    bool: true },
        { key: 'ShowPlanets',         label: 'Planets',            bool: true },
        { key: 'ShowLogo',            label: 'Logo',               bool: true },
        // S226 — swaps the scene background to the same night-sky
        // colour the Optical vault fades to at night; LongitudeRing
        // azi numerals + ticks auto-switch to white / pale grey.
        { key: 'DarkBackground',      label: 'Dark Background',    bool: true },
      ]},
      { title: 'Cosmology', rows: [
        { key: 'Cosmology', label: 'Axis Mundi',
          select: ['none', 'yggdrasil', 'meru', 'vortex', 'vortex2'] },
      ]},
      { title: 'Map Projection', rows: [
        { key: 'MapProjection', label: 'Projection', select: listProjections() },
      ]},
      { title: 'Starfield', rows: [
        { key: 'StarfieldType', label: 'Starfield', select: [
          { value: 'random',      label: 'Default (random)' },
          { value: 'chart-dark',  label: 'Chart (dark)' },
          { value: 'chart-light', label: 'Chart (light)' },
          { value: 'celnav',      label: 'Cel Nav (named stars)' },
        ]},
        // S009 — permanent night mode so starfield / body placement can
        // be tested without waiting for the sun to set.
        { key: 'PermanentNight', label: 'Permanent night', bool: true },
      ]},
    ],
  },
  // S009 — dedicated Tracker tab. Manual-select dropdown (sun, moon,
  // five planets, 58 Cel Nav stars) feeds the second HUD panel's
  // azimuth/elevation/RA/Dec readout. Also exposes BodySource so the
  // user can toggle the helioc vs geoc pipeline and see readouts are
  // consistent.
  // S009 / S009a — Tracker tab. Multi-select button grid; toggling
  // each button adds/removes its id from `TrackerTargets`. Every
  // tracked object gets a block in the HUD with both ephemerides and
  // a coloured GP on the disc.
  {
    tab: 'Tracker', groups: [
      { title: 'Object', rows: [
        // S228 — one-shot clear button so the user doesn't have to
        // click every active pill to turn it off.
        { label: '', buttonLabel: 'Clear All Tracked',
          onClick: (m) => m.setState({ TrackerTargets: [] }) },
        { key: 'TrackerTargets', label: 'Track', buttonGrid: [
          // S219 — per-button text colour. Sun / moon / planet
          // colours match the in-scene marker pigments defined in
          // `render/index.js`. Cel-nav stars render white, non-cel-
          // nav (catalogued) stars render warm-yellow, matching the
          // two starfield layers. Cel-nav wins when a star appears
          // in both lists — `CELNAV_IDS` below is the master set.
          { value: 'sun',     label: 'Sun',     color: '#ffc844' },
          { value: 'moon',    label: 'Moon',    color: '#f4f4f4' },
          { value: 'mercury', label: 'Mercury', color: '#d0b090' },
          { value: 'venus',   label: 'Venus',   color: '#fff0c8' },
          { value: 'mars',    label: 'Mars',    color: '#d05040' },
          { value: 'jupiter', label: 'Jupiter', color: '#ffa060' },
          { value: 'saturn',  label: 'Saturn',  color: '#e4c888' },
          // S221
          { value: 'uranus',  label: 'Uranus',  color: '#a8d8e0' },
          { value: 'neptune', label: 'Neptune', color: '#7fa6e8' },
          // S217 — merge cel-nav almanac stars with the non-cel-nav
          // catalogued stars (Orion belt, dipper arm, σ Oct, etc.)
          // and sort alphabetically so everything is trackable.
          ...(() => {
            const celnavIds = new Set(CEL_NAV_STARS.map((s) => s.id));
            return [...CEL_NAV_STARS, ...CATALOGUED_STARS]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((s) => ({
                value: `star:${s.id}`,
                label: s.name,
                // S220 — colour swap: cel-nav stars now read in the
                // warm-yellow pigment the constellation layer used to
                // own; catalogued stars take the white. Mirrors the
                // in-field swap (cel-nav starfield 0xffe8a0,
                // constellation starfield 0xffffff).
                color: celnavIds.has(s.id) ? '#ffe8a0' : '#ffffff',
              }));
          })(),
        ]},
      ]},
      { title: 'Ephemeris', rows: [
        { key: 'BodySource', label: 'Source', select: [
          { value: 'heliocentric', label: 'HelioC   (Schlyter Kepler + Sun-geo)' },
          { value: 'geocentric',   label: 'GeoC     (Earth-focus Kepler)' },
          { value: 'ptolemy',      label: 'Ptolemy  (deferent + epicycle)' },
          { value: 'astropixels',  label: 'DE405    (Espenak AstroPixels)' },
          { value: 'vsop87',       label: 'VSOP87   (Bretagnon & Francou)' },
        ]},
        // S216 — when on, the Tracker HUD shows the full RA/Dec
        // comparison block from all 5 pipelines for sun/moon/planets.
        // Stars are always compact (az + el only) since their RA/Dec
        // is pipeline-independent.
        { key: 'ShowEphemerisReadings', label: 'Ephemeris comparison', bool: true },
        // S218 — "Specified Tracker Mode": sky collapses to just the
        // tracked objects + their GPs. Everything else (non-tracked
        // sun/moon/planets, non-tracked stars, random starfield,
        // constellation lines) hides.
        { key: 'SpecifiedTrackerMode', label: 'Specified Tracker Mode', bool: true },
        // S014 / S017 — star correction toggles. Four independent
        // checkboxes; the first three apply precession / nutation /
        // aberration individually. "Trepidation" is the combined-
        // correction label — when checked it forces all three
        // corrections on. The name references the medieval Arabic
        // "trepidation of the equinoxes", a hypothetical extra
        // oscillation bolted onto precession to match observation;
        // here it labels "the compound apparent wobble as a single
        // phenomenon", the pedagogical counterpart to viewing the
        // three individual corrections one at a time.
        { key: 'StarApplyPrecession', label: 'Precession',  bool: true },
        { key: 'StarApplyNutation',   label: 'Nutation',    bool: true },
        { key: 'StarApplyAberration', label: 'Aberration',  bool: true },
        { key: 'StarTrepidation',     label: 'Trepidation', bool: true },
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

// S211 — read-only display row. Mirrors one state field, formats its
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
// The numeric slider still lets the user pick any intermediate heading; the
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
// [0, 360). Used for degree fields where the user wants sub-degree
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
// S228 — one-shot click row. `row.onClick(model)` fires on each
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

// S009a — multi-select button grid. Drives an array-valued state
// field. Clicking a button toggles that id's membership in the array;
// active buttons get the `.on` class.
function buttonGridRow(model, row) {
  const el = document.createElement('div');
  el.className = 'row button-grid-row';
  const label = document.createElement('label');
  label.textContent = row.label;
  el.appendChild(label);
  const grid = document.createElement('div');
  grid.className = 'button-grid';
  el.appendChild(grid);

  const btns = row.buttonGrid.map((opt) => {
    const value = typeof opt === 'string' ? opt : opt.value;
    const text  = typeof opt === 'string' ? opt : (opt.label ?? opt.value);
    // S219 — optional per-button text colour. Inline `style.color`
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

export function buildControlPanel(panelEl, model, demos) {
  const tabsBar = panelEl.querySelector('.tabs');
  const body = panelEl.querySelector('.tab-body');
  tabsBar.replaceChildren();
  body.replaceChildren();

  const tabPanels = [];
  FIELD_GROUPS.forEach((tab, i) => {
    const btn = document.createElement('button');
    btn.textContent = tab.tab;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    tabsBar.appendChild(btn);

    const panel = document.createElement('div');
    panel.hidden = i !== 0;
    tabPanels.push(panel);
    body.appendChild(panel);

    tab.groups.forEach((g) => {
      const t = document.createElement('div');
      t.className = 'group-title';
      t.textContent = g.title;
      panel.appendChild(t);
      g.rows.forEach((row) => {
        let rowEl;
        if (row.bool) rowEl = boolRow(model, row);
        else if (row.boolSelect) rowEl = boolSelectRow(model, row);
        else if (row.select) rowEl = selectRow(model, row);
        else if (row.buttonGrid) rowEl = buttonGridRow(model, row);
        else if (row.cardinal) rowEl = cardinalRow(model, row);
        else if (row.onClick) rowEl = clickRow(model, row);
        else if (row.action) rowEl = actionRow(model, row);
        else if (row.nudge) rowEl = nudgeRow(model, row);
        else if (row.readout) rowEl = readoutRow(model, row);
        else rowEl = numericRow(model, row);
        panel.appendChild(rowEl);
      });
    });

    // Time tab gets the calendar date/time row, then Autoplay.
    if (tab.tab === 'Time') {
      const calTitle = document.createElement('div');
      calTitle.className = 'group-title';
      calTitle.textContent = 'Calendar';
      panel.appendChild(calTitle);
      panel.appendChild(timezoneRow(model));
      panel.appendChild(dateTimeRow(model));

      const autoTitle = document.createElement('div');
      autoTitle.className = 'group-title';
      autoTitle.textContent = 'Autoplay';
      panel.appendChild(autoTitle);
      const autoHost = document.createElement('div');
      panel.appendChild(autoHost);
      const autoplay = new Autoplay(model);
      autoplay.renderInto(autoHost);
      // expose so /main.js and debugging can reach it
      model._autoplay = autoplay;
    }

    btn.addEventListener('click', () => {
      tabPanels.forEach((p, j) => { p.hidden = j !== i; });
      [...tabsBar.children].forEach((b, j) => {
        b.setAttribute('aria-selected', j === i ? 'true' : 'false');
      });
    });
  });

  if (demos) {
    const tab = document.createElement('button');
    tab.textContent = 'Demos';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'false');
    tabsBar.appendChild(tab);
    const panel = document.createElement('div');
    panel.hidden = true;
    body.appendChild(panel);
    demos.renderInto(panel);
    tab.addEventListener('click', () => {
      tabPanels.forEach((p) => { p.hidden = true; });
      panel.hidden = false;
      [...tabsBar.children].forEach((b) => b.setAttribute('aria-selected', 'false'));
      tab.setAttribute('aria-selected', 'true');
    });
    tabPanels.push(panel);
  }
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
  const lines = ['time', 'sun', 'moon', 'solar-ec', 'lunar-ec'].map(() => {
    const d = document.createElement('div');
    d.className = 'line';
    hudEl.appendChild(d);
    return d;
  });

  // Moon phase widget: a small canvas with the phase visual + illumination
  // bar, plus a label line for phase name + percentage.
  const moonBox = document.createElement('div');
  moonBox.className = 'line moon-phase-box';
  const canvas = document.createElement('canvas');
  canvas.width = 132; canvas.height = 56;
  canvas.className = 'moon-phase-canvas';
  const moonLabel = document.createElement('div');
  moonLabel.className = 'moon-phase-label';
  moonBox.appendChild(canvas);
  moonBox.appendChild(moonLabel);
  hudEl.appendChild(moonBox);

  const fmt = (v, p = 1) => v.toFixed(p).padStart(6);
  const refresh = () => {
    const c = model.computed;
    const s = model.state;
    lines[0].textContent = dateTimeToString(s.DateTime);
    lines[1].textContent = c.SunAnglesGlobe.elevation >= 0
      ? `Sun:  az ${fmt(c.SunAnglesGlobe.azimuth)}°  el ${fmt(c.SunAnglesGlobe.elevation)}°`
      : "Sun:  beyond observer's optical vault";
    lines[2].textContent = c.MoonAnglesGlobe.elevation >= 0
      ? `Moon: az ${fmt(c.MoonAnglesGlobe.azimuth)}°  el ${fmt(c.MoonAnglesGlobe.elevation)}°  phase ${(c.MoonPhaseFraction * 100).toFixed(0)}%`
      : `Moon: beyond observer's optical vault  phase ${(c.MoonPhaseFraction * 100).toFixed(0)}%`;

    const ec = nextEclipses(s.DateTime);
    const now = dateTimeToDate(s.DateTime);
    lines[3].textContent = ec.nextSolar
      ? `Next solar eclipse: ${shortDate(ec.nextSolar)}  ${formatCountdown(now, ec.nextSolar)}`
      : 'Next solar eclipse: —';
    lines[4].textContent = ec.nextLunar
      ? `Next lunar eclipse: ${shortDate(ec.nextLunar)}  ${formatCountdown(now, ec.nextLunar)}`
      : 'Next lunar eclipse: —';

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

// S009 / S009a / S009d — Tracker HUD panel. One `.tracker-block` per
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

  const fmtDeg = (v, p = 1) => (v >= 0 ? '+' : '') + v.toFixed(p);
  const fmtHours = (raRad) => {
    // S221 — pipelines that don't carry this body return NaN so the
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
  // S012 — az is already 0–360 degrees, el is already ±90 degrees;
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
  // vsop87, foot } DOM nodes kept across refreshes. S011 added Ptolemy,
  // S015 added AstroPixels/DE405, S016 added VSOP87.
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
    const helio = document.createElement('div');
    helio.className = 'line source-line';
    block.appendChild(helio);
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
    return { block, title, azel, helio, geo, ptolemy, astropixels, vsop87, foot };
  }

  const refresh = () => {
    const infos = model.computed.TrackerInfos || [];
    if (infos.length === 0) {
      trackerEl.style.display = 'none';
      for (const { block } of blockCache.values()) block.remove();
      blockCache.clear();
      return;
    }
    trackerEl.style.display = '';

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

      const cat = info.category === 'star'   ? 'star'
                : info.category === 'planet' ? 'planet'
                : 'luminary';
      rec.title.textContent = `${info.name} (${cat})`;
      rec.azel.textContent  = `az ${fmtDmsDegAz(info.azimuth)}   el ${fmtDmsDegEl(info.elevation)}`;
      // S216 — ephemeris-comparison block hides entirely for stars
      // (their RA/Dec doesn't depend on pipeline) and for sun/moon/
      // planets when `ShowEphemerisReadings` is off. Keeps the
      // tracker HUD compact by default.
      const showReadings = info.category !== 'star'
        && model.state.ShowEphemerisReadings === true;
      rec.helio.hidden = !showReadings;
      rec.geo.hidden = !showReadings;
      rec.ptolemy.hidden = !showReadings;
      rec.astropixels.hidden = !showReadings;
      rec.vsop87.hidden = !showReadings;
      if (showReadings) {
        rec.helio.textContent =
          `Helio : RA ${fmtHours(info.helioReading.ra)}   Dec ${fmtDms(info.helioReading.dec)}`;
        rec.geo.textContent =
          `GeoC  : RA ${fmtHours(info.geoReading.ra)}   Dec ${fmtDms(info.geoReading.dec)}`;
        rec.ptolemy.textContent =
          `Ptol  : RA ${fmtHours(info.ptolemyReading.ra)}   Dec ${fmtDms(info.ptolemyReading.dec)}`;
        rec.astropixels.textContent =
          `DE405 : RA ${fmtHours(info.astropixelsReading.ra)}   Dec ${fmtDms(info.astropixelsReading.dec)}`;
        rec.vsop87.textContent =
          `VSOP87: RA ${fmtHours(info.vsop87Reading.ra)}   Dec ${fmtDms(info.vsop87Reading.dec)}`;
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
