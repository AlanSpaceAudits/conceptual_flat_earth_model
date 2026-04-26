// Tracking-info pop-up. Surfaces a pixel-art portrait + readout
// panel for whichever body the user has actively selected for
// tracking. The "selected" body is, in priority:
//   1. `state.FollowTarget` (explicit follow / search-result hit)
//   2. The single entry in `state.TrackerTargets` if it has length 1
//   3. — none, panel hidden —
// Panel is fixed in the upper-left of the viewport; classed
// `info-popup` for shared styling.

const ART_SIZE = 96;        // canvas pixel grid
const SCALE    = 4;         // chunky pixel-art zoom
const W = ART_SIZE * SCALE;

function pix(ctx, x, y, color, scale = SCALE) {
  ctx.fillStyle = color;
  ctx.fillRect(x * scale, y * scale, scale, scale);
}

function disc(ctx, cx, cy, r, color, scale = SCALE) {
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        ctx.fillRect((cx + dx) * scale, (cy + dy) * scale, scale, scale);
      }
    }
  }
}

function ring(ctx, cx, cy, rOuter, rInner, color, scale = SCALE) {
  ctx.fillStyle = color;
  for (let dy = -rOuter; dy <= rOuter; dy++) {
    for (let dx = -rOuter; dx <= rOuter; dx++) {
      const d2 = dx * dx + dy * dy;
      if (d2 <= rOuter * rOuter && d2 >= rInner * rInner) {
        ctx.fillRect((cx + dx) * scale, (cy + dy) * scale, scale, scale);
      }
    }
  }
}

// --- Per-body / per-category renderers ------------------------------------

function drawSun(ctx) {
  const cx = ART_SIZE / 2, cy = ART_SIZE / 2;
  // Outer corona
  disc(ctx, cx, cy, 16, '#ff8c00');
  disc(ctx, cx, cy, 13, '#ffb840');
  disc(ctx, cx, cy, 10, '#ffd870');
  disc(ctx, cx, cy, 7,  '#fff0a8');
  // Rays
  ctx.fillStyle = '#ffd060';
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    for (let t = 18; t < 26; t++) {
      pix(ctx, Math.round(cx + Math.cos(ang) * t), Math.round(cy + Math.sin(ang) * t), '#ffd060');
    }
  }
}

function drawMoon(ctx, phase = 0.5) {
  const cx = ART_SIZE / 2, cy = ART_SIZE / 2;
  disc(ctx, cx, cy, 16, '#1a1a22');
  disc(ctx, cx, cy, 15, '#d8d8e0');
  // Maria
  disc(ctx, cx - 4, cy - 3, 3, '#9aa0b0');
  disc(ctx, cx + 5, cy + 1, 2, '#9aa0b0');
  disc(ctx, cx + 1, cy + 5, 2, '#9aa0b0');
  // Phase shadow (very simplified): cover left-half if phase < 0.5
  if (phase != null && phase < 0.5) {
    ctx.fillStyle = '#0e1018';
    for (let dy = -15; dy <= 15; dy++) {
      const w = Math.round(Math.sqrt(Math.max(0, 15 * 15 - dy * dy)));
      const cut = Math.round(w * (1 - phase * 2));
      ctx.fillRect((cx - w) * SCALE, (cy + dy) * SCALE, cut * SCALE, SCALE);
    }
  }
}

function drawPlanet(ctx, name) {
  const cx = ART_SIZE / 2, cy = ART_SIZE / 2;
  const palette = {
    mercury: ['#3a342a', '#7a6f5b', '#aa9b7c', '#cdbf9e'],
    venus:   ['#3a3a20', '#a08f4a', '#d6c66a', '#f0e09b'],
    mars:    ['#2a0a06', '#7a2618', '#c44030', '#e87060'],
    jupiter: ['#3a2a18', '#9a6c3c', '#d8a868', '#f0d0a0'],
    saturn:  ['#3a2a18', '#866b3a', '#bfa46a', '#e8d8a8'],
    uranus:  ['#102a32', '#3e7c8a', '#7ec0c8', '#bce0e6'],
    neptune: ['#0a1e3a', '#264a8a', '#4a7ec8', '#9ac0e8'],
  };
  const c = palette[name] || palette.jupiter;
  disc(ctx, cx, cy, 14, c[0]);
  disc(ctx, cx, cy, 13, c[1]);
  disc(ctx, cx - 1, cy - 1, 11, c[2]);
  disc(ctx, cx - 2, cy - 3, 6, c[3]);
  // Bands for jupiter / saturn
  if (name === 'jupiter' || name === 'saturn') {
    ctx.fillStyle = c[1];
    for (const off of [-9, -4, 1, 6]) {
      ctx.fillRect((cx - 13) * SCALE, (cy + off) * SCALE, 26 * SCALE, 1 * SCALE);
    }
  }
  // Saturn ring
  if (name === 'saturn') {
    ctx.fillStyle = '#d8c890';
    for (let dx = -22; dx <= 22; dx++) {
      const dy = Math.round(dx * 0.18);
      ctx.fillRect((cx + dx) * SCALE, (cy + dy) * SCALE, SCALE, SCALE);
      if (Math.abs(dx) > 14) {
        ctx.fillRect((cx + dx) * SCALE, (cy + dy + 1) * SCALE, SCALE, SCALE);
      }
    }
  }
  // Mars polar caps
  if (name === 'mars') {
    disc(ctx, cx, cy - 11, 2, '#f0f0f8');
    disc(ctx, cx, cy + 11, 2, '#f0f0f8');
  }
}

function drawCelNavStar(ctx) {
  const cx = ART_SIZE / 2, cy = ART_SIZE / 2;
  ctx.fillStyle = '#ffe8a0';
  // 4-point star with halo
  for (let i = -3; i <= 3; i++) {
    pix(ctx, cx + i, cy, '#ffe8a0');
    pix(ctx, cx, cy + i, '#ffe8a0');
  }
  for (let i = -2; i <= 2; i++) {
    pix(ctx, cx + i, cy + i, '#ffd060');
    pix(ctx, cx + i, cy - i, '#ffd060');
  }
  pix(ctx, cx, cy, '#ffffff');
  // Spike rays
  for (let r = 6; r <= 14; r += 2) {
    pix(ctx, cx + r, cy, '#ffd060');
    pix(ctx, cx - r, cy, '#ffd060');
    pix(ctx, cx, cy + r, '#ffd060');
    pix(ctx, cx, cy - r, '#ffd060');
  }
}

function drawConstellationStar(ctx) {
  const cx = ART_SIZE / 2, cy = ART_SIZE / 2;
  // Smaller pinpoint star
  disc(ctx, cx, cy, 3, '#ffffff');
  pix(ctx, cx, cy, '#fffff0');
  // Connecting line stub (representing constellation membership)
  ctx.fillStyle = '#88aaff';
  for (let i = 4; i <= 18; i++) pix(ctx, cx + i, cy + Math.round(i * 0.6), '#88aaff');
  for (let i = 4; i <= 16; i++) pix(ctx, cx - i, cy - Math.round(i * 0.5), '#88aaff');
  // Adjacent star sketch
  disc(ctx, cx + 18, cy + 11, 2, '#ffffff');
  disc(ctx, cx - 16, cy - 8, 2, '#ffffff');
}

function drawBlackHole(ctx) {
  const cx = ART_SIZE / 2, cy = ART_SIZE / 2;
  // Accretion ring
  ring(ctx, cx, cy, 18, 13, '#9966ff');
  ring(ctx, cx, cy, 14, 11, '#cc99ff');
  // Event horizon
  disc(ctx, cx, cy, 9, '#000');
  disc(ctx, cx, cy, 8, '#000');
  // Bright photon ring
  ring(ctx, cx, cy, 11, 9, '#ffffff');
}

function drawQuasar(ctx) {
  const cx = ART_SIZE / 2, cy = ART_SIZE / 2;
  disc(ctx, cx, cy, 4, '#40e0d0');
  disc(ctx, cx, cy, 2, '#ffffff');
  // Bipolar jets
  ctx.fillStyle = '#40e0d0';
  for (let t = 5; t <= 22; t++) {
    pix(ctx, cx + Math.round(t * 0.5), cy - t, '#40e0d0');
    pix(ctx, cx - Math.round(t * 0.5), cy + t, '#40e0d0');
  }
  // Halo
  ring(ctx, cx, cy, 8, 6, '#80fff0');
}

function drawGalaxy(ctx) {
  const cx = ART_SIZE / 2, cy = ART_SIZE / 2;
  // Spiral arms
  ctx.fillStyle = '#ff80c0';
  for (let r = 3; r < 22; r++) {
    const a = r * 0.55;
    pix(ctx, cx + Math.round(r * Math.cos(a)),  cy + Math.round(r * Math.sin(a)),  '#ff80c0');
    pix(ctx, cx - Math.round(r * Math.cos(a)),  cy - Math.round(r * Math.sin(a)),  '#ff80c0');
    pix(ctx, cx + Math.round(r * Math.cos(a + 0.3)),  cy + Math.round(r * Math.sin(a + 0.3)),  '#ffb0d8');
    pix(ctx, cx - Math.round(r * Math.cos(a + 0.3)),  cy - Math.round(r * Math.sin(a + 0.3)),  '#ffb0d8');
  }
  // Bulge
  disc(ctx, cx, cy, 5, '#ffd0e8');
  disc(ctx, cx, cy, 3, '#ffffff');
}

function drawSatellite(ctx) {
  const cx = ART_SIZE / 2, cy = ART_SIZE / 2;
  // Body
  ctx.fillStyle = '#a0a0b0';
  ctx.fillRect((cx - 3) * SCALE, (cy - 3) * SCALE, 6 * SCALE, 6 * SCALE);
  ctx.fillStyle = '#404048';
  ctx.fillRect((cx - 2) * SCALE, (cy - 2) * SCALE, 4 * SCALE, 4 * SCALE);
  // Solar panels
  ctx.fillStyle = '#3060a0';
  ctx.fillRect((cx - 18) * SCALE, (cy - 4) * SCALE, 12 * SCALE, 8 * SCALE);
  ctx.fillRect((cx + 6) * SCALE, (cy - 4) * SCALE, 12 * SCALE, 8 * SCALE);
  ctx.fillStyle = '#80a8d0';
  for (let i = -16; i <= -8; i += 2) ctx.fillRect((cx + i) * SCALE, (cy - 3) * SCALE, SCALE, 6 * SCALE);
  for (let i = 8; i <= 16; i += 2)   ctx.fillRect((cx + i) * SCALE, (cy - 3) * SCALE, SCALE, 6 * SCALE);
  // Antenna
  ctx.fillStyle = '#e0e0e8';
  for (let i = 0; i <= 6; i++) pix(ctx, cx, cy - 4 - i, '#e0e0e8');
  pix(ctx, cx, cy - 11, '#ff4040');
}

function drawBscStar(ctx) {
  const cx = ART_SIZE / 2, cy = ART_SIZE / 2;
  disc(ctx, cx, cy, 2, '#ffffff');
  pix(ctx, cx, cy, '#fff5d8');
  // Subtle 4-point spike
  for (let i = 3; i <= 8; i++) {
    pix(ctx, cx + i, cy, '#fff5d8');
    pix(ctx, cx - i, cy, '#fff5d8');
    pix(ctx, cx, cy + i, '#fff5d8');
    pix(ctx, cx, cy - i, '#fff5d8');
  }
}

function clearCanvas(ctx) {
  ctx.clearRect(0, 0, W, W);
}

export function buildTrackingInfoPopup(panelEl, model) {
  if (!panelEl) return;
  panelEl.classList.add('tracking-info-panel');
  panelEl.innerHTML = `
    <div class="ti-art-row">
      <canvas class="ti-art" width="${W}" height="${W}"></canvas>
      <div class="ti-titles">
        <div class="ti-name">—</div>
        <div class="ti-cat">—</div>
      </div>
    </div>
    <div class="ti-readout"></div>
  `;
  const canvas  = panelEl.querySelector('.ti-art');
  const ctx     = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const elName  = panelEl.querySelector('.ti-name');
  const elCat   = panelEl.querySelector('.ti-cat');
  const elBody  = panelEl.querySelector('.ti-readout');

  const fmtDeg = (rad) => {
    if (!Number.isFinite(rad)) return '—';
    const d = rad * 180 / Math.PI;
    return d.toFixed(2) + '°';
  };
  const fmtH = (rad) => {
    if (!Number.isFinite(rad)) return '—';
    const h = (rad * 12 / Math.PI + 24) % 24;
    const hh = Math.floor(h);
    const mm = Math.floor((h - hh) * 60);
    const ss = ((h - hh) * 60 - mm) * 60;
    return `${String(hh).padStart(2, '0')}h ${String(mm).padStart(2, '0')}m ${ss.toFixed(1)}s`;
  };
  const fmtSignedDeg = (deg) => {
    if (!Number.isFinite(deg)) return '—';
    const sign = deg >= 0 ? '+' : '−';
    return sign + Math.abs(deg).toFixed(2) + '°';
  };
  const fmtAz = (deg) => {
    if (!Number.isFinite(deg)) return '—';
    const a = ((deg % 360) + 360) % 360;
    return a.toFixed(2) + '°';
  };

  function pickInfo(state, computed) {
    const infos = computed.TrackerInfos || [];
    if (state.FollowTarget) {
      const f = infos.find((i) => i.target === state.FollowTarget);
      if (f) return f;
    }
    const targets = Array.isArray(state.TrackerTargets) ? state.TrackerTargets : [];
    if (targets.length === 1) {
      const t = infos.find((i) => i.target === targets[0]);
      if (t) return t;
    }
    return null;
  }

  function classifySubcategory(info) {
    if (info.target === 'sun')  return 'sun';
    if (info.target === 'moon') return 'moon';
    if (info.category === 'planet') return info.target;
    if (info.category === 'star') return info.subCategory || 'celnav';
    return 'celnav';
  }

  function categoryLabel(info) {
    if (info.target === 'sun')  return 'Luminary · Sun';
    if (info.target === 'moon') return 'Luminary · Moon';
    if (info.category === 'planet') return 'Planet';
    if (info.subCategory === 'celnav')     return 'Cel-Nav Star';
    if (info.subCategory === 'catalogued') return 'Constellation Star';
    if (info.subCategory === 'blackhole')  return 'Black Hole';
    if (info.subCategory === 'quasar')     return 'Quasar';
    if (info.subCategory === 'galaxy')     return 'Galaxy';
    if (info.subCategory === 'satellite')  return 'Satellite';
    if (info.subCategory === 'bsc')        return 'BSC Star';
    return info.category || 'Object';
  }

  function paint(info, computed) {
    clearCanvas(ctx);
    const kind = classifySubcategory(info);
    if (kind === 'sun')         drawSun(ctx);
    else if (kind === 'moon')   drawMoon(ctx, computed.MoonPhase);
    else if (['mercury','venus','mars','jupiter','saturn','uranus','neptune'].includes(kind))
      drawPlanet(ctx, kind);
    else if (kind === 'celnav')     drawCelNavStar(ctx);
    else if (kind === 'catalogued') drawConstellationStar(ctx);
    else if (kind === 'blackhole')  drawBlackHole(ctx);
    else if (kind === 'quasar')     drawQuasar(ctx);
    else if (kind === 'galaxy')     drawGalaxy(ctx);
    else if (kind === 'satellite')  drawSatellite(ctx);
    else if (kind === 'bsc')        drawBscStar(ctx);
    else drawCelNavStar(ctx);
  }

  function refresh() {
    const s = model.state;
    const c = model.computed;
    const info = pickInfo(s, c);
    if (!info) {
      panelEl.hidden = true;
      return;
    }
    panelEl.hidden = false;
    elName.textContent = info.name || info.target;
    elCat.textContent  = categoryLabel(info);
    paint(info, c);

    const az = fmtAz(info.azimuth);
    const el = fmtSignedDeg(info.elevation);
    const gpLat = fmtSignedDeg(info.gpLat);
    const gpLon = fmtSignedDeg(info.gpLon);
    // Stars carry a single catalog `(ra, dec)` directly on `info`;
    // sun / moon / planets carry per-pipeline `*Reading` copies.
    const r = info.astropixelsReading || info.geoReading || info.helioReading
      || info.vsop87Reading || info.ptolemyReading
      || (Number.isFinite(info.ra) && Number.isFinite(info.dec)
            ? { ra: info.ra, dec: info.dec }
            : null);
    const ra  = r ? fmtH(r.ra)  : '—';
    const dec = r ? fmtSignedDeg(r.dec * 180 / Math.PI) : '—';
    const mag = (info.mag != null && Number.isFinite(info.mag))
      ? info.mag.toFixed(2)
      : '—';

    elBody.innerHTML = `
      <div class="ti-row"><span>Azimuth</span><span>${az}</span></div>
      <div class="ti-row"><span>Elevation</span><span>${el}</span></div>
      <div class="ti-row"><span>RA</span><span>${ra}</span></div>
      <div class="ti-row"><span>Dec</span><span>${dec}</span></div>
      <div class="ti-row"><span>GP lat</span><span>${gpLat}</span></div>
      <div class="ti-row"><span>GP lon</span><span>${gpLon}</span></div>
      <div class="ti-row"><span>Mag</span><span>${mag}</span></div>
    `;
  }

  model.addEventListener('update', refresh);
  refresh();
}
