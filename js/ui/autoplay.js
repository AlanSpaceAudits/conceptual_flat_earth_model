import { t, onLangChange } from './i18n.js';
// Autoplay: advance model.DateTime at a configurable rate so the dynamics
// (sun/moon rising, moon phase cycle, seasons) animate on their own.

const PRESETS = [
  { label: 'Day',    days_per_sec: 1 / 24 },   // 1 second of real time = 1 simulated hour
  { label: 'Week',   days_per_sec: 1 / 3.4 },  // ~24 seconds per week
  { label: 'Month',  days_per_sec: 1 },        // 1 day of sim per second
  { label: 'Year',   days_per_sec: 10 },       // ~36 seconds per year
];

export class Autoplay {
  constructor(model) {
    this.model = model;
    // testing-rebaseline default: autoplay starts running at
    // the "Day" preset (1 simulated hour per real second) so the
    // baseline view shows the sun/moon already moving on load.
    this.playing = true;
    this.speed = PRESETS[0].days_per_sec;   // default: "Day"
    this._last = 0;
    this._tick = this._tick.bind(this);
    this._listeners = new Set();
    if (this.playing) {
      // Defer the first tick until the browser is idle so the
      // cold-start frame budget (HTML parse + module loads + WebGL
      // init + first paint) isn't competing with a per-frame
      // `model.setState({ DateTime })` cascade. `requestIdleCallback`
      // fires after the main thread settles; the timeout fallback
      // caps the delay so autoplay still starts visibly within
      // a second on browsers without rIC support.
      const start = () => {
        if (!this.playing) return;
        this._last = performance.now();
        requestAnimationFrame(this._tick);
      };
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(start, { timeout: 1000 });
      } else {
        setTimeout(start, 800);
      }
    }
  }

  onChange(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); }
  _emit() { this._listeners.forEach(fn => fn(this)); }

  play() {
    if (this.playing) return;
    this.playing = true;
    this._last = performance.now();
    requestAnimationFrame(this._tick);
    this._emit();
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    this._emit();
  }

  toggle() { this.playing ? this.pause() : this.play(); }

  setSpeed(daysPerSec) {
    this.speed = daysPerSec;
    this._emit();
  }

  _tick(ts) {
    if (!this.playing) return;
    const dt = Math.max(0, Math.min(0.1, (ts - this._last) / 1000));  // clamp to 100 ms
    this._last = ts;
    const cur = this.model.state.DateTime;
    this.model.setState({ DateTime: cur + this.speed * dt });
    requestAnimationFrame(this._tick);
  }

  renderInto(container) {
    container.replaceChildren();

    // Row 1: play/pause button + live status
    const row = document.createElement('div');
    row.className = 'autoplay-row';
    const btn = document.createElement('button');
    btn.className = 'autoplay-btn';
    const status = document.createElement('span');
    status.className = 'autoplay-status';
    row.append(btn, status);
    container.appendChild(row);

    // Row 2: presets
    const presetRow = document.createElement('div');
    presetRow.className = 'autoplay-presets';
    const PRESET_KEYS = ['btn_day', 'btn_week', 'btn_month', 'btn_year'];
    const presetBtns = PRESETS.map((p, i) => {
      const b = document.createElement('button');
      const key = PRESET_KEYS[i];
      b.textContent = key ? t(key) : p.label;
      if (key) onLangChange(() => { b.textContent = t(key); });
      b.dataset.speed = p.days_per_sec;
      b.addEventListener('click', () => this.setSpeed(p.days_per_sec));
      presetRow.appendChild(b);
      return b;
    });
    container.appendChild(presetRow);

    // Row 3: fine speed slider + number
    const speedRow = document.createElement('div');
    speedRow.className = 'row';
    speedRow.innerHTML = `<label>Speed</label>
      <input type="number" class="num" min="0.001" max="100" step="0.001">
      <span class="unit">d/s</span>
      <input type="range" class="slider" min="-4" max="2" step="0.01">`;
    const speedLabelEl = speedRow.querySelector('label');
    speedLabelEl.textContent = t('lbl_speed');
    onLangChange(() => { speedLabelEl.textContent = t('lbl_speed'); });
    const numEl = speedRow.querySelector('input.num');
    const rangeEl = speedRow.querySelector('input.slider');
    // Slider is log10-scaled for a useful range (0.0001 to 100 days/sec).
    rangeEl.addEventListener('input', () => this.setSpeed(Math.pow(10, parseFloat(rangeEl.value))));
    numEl.addEventListener('change', () => {
      const v = parseFloat(numEl.value);
      if (v > 0) this.setSpeed(v);
    });
    container.appendChild(speedRow);

    btn.addEventListener('click', () => this.toggle());

    const refresh = () => {
      btn.textContent = this.playing ? '⏸  ' + t('btn_pause') : '▶  ' + t('btn_play');
      status.textContent = this.playing ? t('status_running') : t('status_paused');
      numEl.value = (+this.speed).toFixed(4);
      rangeEl.value = Math.log10(Math.max(1e-6, this.speed)).toFixed(2);
      presetBtns.forEach((b) => {
        const active = Math.abs(parseFloat(b.dataset.speed) - this.speed) < 1e-6;
        b.setAttribute('aria-current', active ? 'true' : 'false');
      });
    };
    this.onChange(refresh);
    onLangChange(refresh);
    refresh();
  }
}
