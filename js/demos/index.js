// Demo manager: play/stop/next/prev + UI list.
//
// added grouped rendering, autoplay queue (advance to the next
// demo in a list when the current one finishes), and Meeus-warning
// integration via the `meeusActive` callback.

import { Animator } from './animation.js';
import { DEMOS, DEMO_GROUPS } from './definitions.js';

export class Demos {
  constructor(model) {
    this.model = model;
    this.animator = new Animator(model);
    this.list = DEMOS.slice();
    this.currentIndex = -1;
    this._panelHost = null;
    this._listEl = null;
    this._collapsed = new Set(['solar-eclipses', 'lunar-eclipses']);  // groups collapsed by default
    // Autoplay queue: when non-null, after the active demo's task
    // queue empties we advance to the next index in `_queue`.
    this._queue = null;
    this._queueCursor = 0;
    // Snapshot of model.state taken at the start of a demo (or
    // queue), restored when the demo ends or is stopped. `null`
    // means no demo is holding a snapshot.
    this._savedState = null;

    // Poll the animator each rAF. Two separate transitions matter:
    //   running → !running  → demo truly ended (queue empty, or
    //     stop() called). Snap to DE405 default ONLY here, so
    //     pausing via the bar's ▶/⏸ button doesn't reset time.
    //   wasPlaying && !nowPlaying while running → advance queue.
    let wasPlaying = false;
    let wasRunning = false;
    const tick = () => {
      const nowRunning = this.animator.running;
      const nowPlaying = this.animator.isPlaying();
      if (wasRunning && !nowRunning) {
        const queueDone = !this._queue
          || this._queueCursor >= this._queue.length;
        if (queueDone) this._restoreSavedState();
      }
      wasRunning = nowRunning;
      wasPlaying = nowPlaying;
      if (this._queue && !nowPlaying && !this.animator.isPaused()
          && this._queueCursor < this._queue.length) {
        const next = this._queue[this._queueCursor++];
        // Defer to microtask so any state-mutation hooks settle.
        Promise.resolve().then(() => this._playSingle(next, /* fromQueue */ true));
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Restore the model.state snapshot taken at demo / queue start so
  // observer lat / lon / time / tracking / view options return to
  // exactly what the user had before pressing play. No-op if no
  // snapshot is held.
  _restoreSavedState() {
    if (!this._savedState) return;
    this.model.setState(this._savedState);
    this._savedState = null;
  }

  _playSingle(index, fromQueue = false) {
    if (index < 0 || index >= this.list.length) return;
    this.animator.stop();
    // Snapshot pre-demo state on the first play of a (possibly
    // queued) sequence — subsequent queued demos share the same
    // snapshot so the eventual restore returns to what the user
    // had before any demo ran.
    if (this._savedState === null) {
      this._savedState = { ...this.model.state };
    }
    this.currentIndex = index;
    const d = this.list[index];
    // reset eclipse + flight-routes state before each demo's intro
    // so panels left over from the previous demo (eclipse shadow,
    // flight info boxes, race track, per-route colours, central-
    // angle suppression) don't bleed into the next one when the user
    // switches.
    this.model.setState({
      EclipseActive: false, EclipseKind: null,
      EclipseEventUTMS: null, EclipsePipeline: null,
      EclipseMinSepDeg: null, EclipseMagnitude: null, EclipseEventType: null,
      ShowFlightRoutes: false,
      FlightRoutesSelected: 'all',
      FlightRoutesProgress: 1,
      FlightInfoBox: null,
      FlightRaceTrack: null,
      FlightRouteColors: {},
      HideFlightCentralAngle: false,
    });
    const introState = typeof d.intro === 'function' ? d.intro(this.model) : d.intro;
    // An intro function may return null/false to refuse to load (for
    // demos that need a specific tracker / state precondition). Bail
    // without stomping on the current view; the demo's own intro is
    // expected to have surfaced its own message via `Description`.
    if (!introState) {
      this._refreshPanel();
      return;
    }
    // Universal demo-time setting: hide constellation outlines so
    // they don't compete with the demo's own visualization. Demos
    // that explicitly want lines on can override in their intro.
    const introWithLinesOff = { ShowConstellationLines: false, ...introState };
    this.model.setState(introWithLinesOff);
    this.animator.play(d.tasks(this.model));
    // Optional per-demo speedScale override. Default 0.125 from
    // animator.play() is suitable for slow celestial demos; map /
    // route demos run faster when the authored cadence already
    // matches wall time.
    if (typeof d.speedScale === 'number') {
      this.animator.setSpeedScale(d.speedScale);
    }
    // Fire a no-op setState after `animator.play` so the next
    // `update` event sees `animator.running === true` and the
    // controlPanel watchdog suspends autoplay immediately —
    // otherwise autoplay can tick once or twice before the first
    // `Tcall` triggers a state update.
    this.model.setState({});
    if (this._btnPauseResume) this._btnPauseResume.textContent = 'Pause';
    this._refreshPanel();
    if (!fromQueue) {
      // Manual play breaks any active queue.
      this._queue = null;
      this._queueCursor = 0;
    }
  }

  // Single-click play (breaks autoplay queue).
  play(index) { this._playSingle(index, false); }

  // Play a list (group-id) sequentially. After each demo's tasks
  // finish, the next one starts automatically.
  playGroup(groupId) {
    const indices = [];
    this.list.forEach((d, i) => { if (d.group === groupId) indices.push(i); });
    if (!indices.length) return;
    this._queue = indices;
    this._queueCursor = 1;       // first item plays now; queue cursor points to next
    this._playSingle(indices[0], true);
  }

  stop() {
    this.animator.stop();
    this._queue = null;
    this._queueCursor = 0;
    this._restoreSavedState();
    if (this._btnPauseResume) this._btnPauseResume.textContent = 'Pause';
    this._refreshPanel();
  }

  next() {
    // If a queue is active, jump to next queued item; otherwise next in list.
    if (this._queue && this._queueCursor < this._queue.length) {
      const idx = this._queue[this._queueCursor++];
      this._playSingle(idx, true);
      return;
    }
    this._playSingle(Math.min(this.currentIndex + 1, this.list.length - 1), false);
  }

  prev() { this._playSingle(Math.max(this.currentIndex - 1, 0), false); }

  // Apply a demo's intro state without running its task queue. Useful
  // when the user wants the lat / lon / time / view setup of a demo
  // but no animation.
  jumpTo(index) {
    const d = this.list[index];
    if (!d) return;
    this.animator.stop();
    this.model.setState({
      EclipseActive: false, EclipseKind: null,
      EclipseEventUTMS: null, EclipsePipeline: null,
      EclipseMinSepDeg: null, EclipseMagnitude: null, EclipseEventType: null,
    });
    const introState = typeof d.intro === 'function' ? d.intro(this.model) : d.intro;
    this.model.setState(introState);
    this._refreshPanel();
  }

  renderInto(panel) {
    this._panelHost = panel;
    panel.replaceChildren();

    const controls = document.createElement('div');
    controls.className = 'demo-controls';
    const btnStop = document.createElement('button');
    btnStop.textContent = 'Stop';
    btnStop.addEventListener('click', () => this.stop());
    const btnPrev = document.createElement('button');
    btnPrev.textContent = 'Prev';
    btnPrev.addEventListener('click', () => this.prev());
    // pause/resume. Freezes the tween queue so the can
    // move observer lat/long or switch Heavenly/Optical while the
    // eclipse geometry stays exactly where it was.
    const btnPauseResume = document.createElement('button');
    btnPauseResume.textContent = 'Pause';
    btnPauseResume.addEventListener('click', () => {
      if (this.animator.isPaused()) {
        this.animator.resume();
        btnPauseResume.textContent = 'Pause';
      } else if (this.animator.isPlaying() || this.animator.running) {
        this.animator.pause();
        btnPauseResume.textContent = 'Resume';
      }
    });
    this._btnPauseResume = btnPauseResume;
    const btnNext = document.createElement('button');
    btnNext.textContent = 'Next';
    btnNext.addEventListener('click', () => this.next());
    controls.append(btnStop, btnPauseResume, btnPrev, btnNext);
    panel.appendChild(controls);

    this._listEl = document.createElement('div');
    this._listEl.className = 'demo-list';
    panel.appendChild(this._listEl);

    this._buildGroupedList();
    this._refreshPanel();
  }

  _buildGroupedList() {
    if (!this._listEl) return;
    this._listEl.replaceChildren();
    this._buttons = [];   // index → button DOM
    const groups = DEMO_GROUPS.length
      ? DEMO_GROUPS
      : [{ id: 'general', label: 'Demos' }];

    groups.forEach(g => {
      const indices = [];
      this.list.forEach((d, i) => { if ((d.group || 'general') === g.id) indices.push(i); });
      if (!indices.length) return;

      const header = document.createElement('div');
      header.className = 'demo-group-header';
      const collapsed = this._collapsed.has(g.id);
      header.textContent = `${collapsed ? '▶' : '▼'} ${g.label} (${indices.length})`;
      header.style.cursor = 'pointer';
      header.addEventListener('click', () => {
        if (this._collapsed.has(g.id)) this._collapsed.delete(g.id);
        else this._collapsed.add(g.id);
        this._buildGroupedList();
        this._refreshPanel();
      });
      this._listEl.appendChild(header);

      // "Play all" mini-button per group with >1 entries.
      if (indices.length > 1) {
        const playAll = document.createElement('button');
        playAll.className = 'demo-play-all';
        playAll.textContent = `▶ Play all in ${g.label.split(' (')[0]} (autoplay queue)`;
        playAll.addEventListener('click', () => this.playGroup(g.id));
        this._listEl.appendChild(playAll);
      }

      if (collapsed) return;

      indices.forEach(i => {
        const row = document.createElement('div');
        row.className = 'demo-row';
        const b = document.createElement('button');
        b.className = 'demo-play';
        b.textContent = this.list[i].name;
        b.addEventListener('click', () => this.play(i));
        const jump = document.createElement('button');
        jump.className = 'demo-jump';
        jump.textContent = '↪';
        jump.title = 'Jump to this demo\'s lat / lon / time without playing the animation';
        jump.addEventListener('click', (e) => {
          e.stopPropagation();
          this.jumpTo(i);
        });
        row.append(b, jump);
        this._listEl.appendChild(row);
        this._buttons[i] = b;
      });
    });
  }

  _refreshPanel() {
    if (!this._buttons) return;
    this._buttons.forEach((b, i) => {
      if (b) b.setAttribute('aria-current', i === this.currentIndex ? 'true' : 'false');
    });
  }
}
