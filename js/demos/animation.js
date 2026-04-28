// Tiny tween engine for animated demos. Lives outside the render loop — the
// engine calls model.setState() at rAF frequency and the renderer reacts via
// its own 'update' listener.

const EASING = {
  linear: (t) => t,
  cosine: (t) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t))),
  // Cubic ease-in — value changes slowly at start, accelerates to
  // the end. Used for orbital-trace demos where time should ramp up
  // naturally from a crawl to the authored finishing rate.
  accel: (t) => {
    const u = Math.min(1, Math.max(0, t));
    return u * u * u;
  },
  // Stair-steps the tween value to 365 discrete steps so a one-year
  // tween advances by exactly one day per step.
  days365: (t) => {
    const u = Math.min(1, Math.max(0, t));
    if (u >= 1) return 1;
    return Math.floor(u * 365) / 365;
  },
};

export class Animator {
  constructor(model) {
    this.model = model;
    this.queue = [];
    this.running = false;
    this.paused  = false;   // pause/resume without clearing queue
    // Default 0.125 = 1/8 the authored Tval cadence; 2× button
    // doubles each click back toward original speed.
    this.speedScale = 0.125;
    this._now = null;
    this._frame = this._frame.bind(this);
  }

  setSpeedScale(mult) {
    this.speedScale = Math.max(0.01, Math.min(64, mult));
  }

  play(tasks) {
    this.queue = tasks.slice();
    this.paused = false;
    this.speedScale = 0.125;
    this._now = performance.now();
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(this._frame);
    }
  }

  // freeze the tween queue in place. The rAF chain breaks but
  // `this.queue` is preserved; observer/lat/long/view-mode changes
  // don't touch it. Resume by calling .resume() later.
  pause() {
    if (!this.running) return;
    this.paused = true;
  }

  resume() {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this._now   = performance.now();   // don't credit paused interval as elapsed
    requestAnimationFrame(this._frame);
  }

  stop() {
    this.running = false;
    this.paused  = false;
    this.queue = [];
  }

  isPlaying() { return this.running && !this.paused; }
  isPaused()  { return this.running && this.paused; }

  _frame(ts) {
    if (!this.running) return;
    if (this.paused)   return;   // rAF chain stays broken until resume()
    const wall = ts - this._now;
    this._now = ts;
    const elapsed = wall * (this.speedScale || 1);

    while (this.queue.length && this.queue[0].delay > 0) {
      this.queue[0].delay -= elapsed;
      if (this.queue[0].delay > 0) break;
      // negative overflow becomes extra elapsed for the task
    }
    // Process head
    if (this.queue.length) {
      const t = this.queue[0];
      const done = this._stepTask(t, elapsed);
      if (done) this.queue.shift();
    }
    if (this.queue.length) requestAnimationFrame(this._frame);
    else this.running = false;
  }

  _stepTask(task, dt) {
    if (task.kind === 'pause') {
      task.remaining = (task.remaining ?? task.duration) - dt;
      return task.remaining <= 0;
    }
    if (task.kind === 'hold') {
      return false;
    }
    if (task.kind === 'text') {
      this.model.setState({ Description: task.text });
      return true;
    }
    if (task.kind === 'val') {
      if (task.startValue === undefined) {
        task.startValue = this.model.state[task.key];
        task.elapsed = 0;
      }
      task.elapsed += dt;
      const t = task.duration === 0 ? 1 : Math.min(1, task.elapsed / task.duration);
      const ease = EASING[task.ease] ?? EASING.cosine;
      const v = task.startValue + (task.endValue - task.startValue) * ease(t);
      this.model.setState({ [task.key]: v });
      return t >= 1;
    }
    if (task.kind === 'call') {
      task.fn(this.model);
      return true;
    }
    if (task.kind === 'repeat') {
      // Re-queue a fresh copy of the loop body PLUS this task itself
      // at the END of the queue, then mark the current instance done
      // so the animator shifts it off and the body runs from scratch
      // again. Resets per-task internal state (`startValue` /
      // `elapsed` for `val`, `remaining` for `pause`) so each loop
      // iteration starts from the original authored configuration.
      for (const orig of task.body) {
        const copy = { ...orig };
        if (copy.kind === 'val') {
          copy.startValue = undefined;
          copy.elapsed = 0;
        }
        if (copy.kind === 'pause') {
          copy.remaining = copy.duration;
        }
        this.queue.push(copy);
      }
      this.queue.push({ kind: 'repeat', body: task.body, delay: 0 });
      return true;
    }
    return true;
  }
}

// Helpers matching the original authoring style (Tpse/Ttxt/Tval).
export const Tpse = (ms) => ({ kind: 'pause', duration: ms, delay: 0 });
export const Thold = () => ({ kind: 'hold', delay: 0 });
export const Ttxt = (txt, delay = 0) => ({ kind: 'text', text: txt, delay });
export const Tval = (key, endValue, duration = 500, delay = 0, ease = 'cosine') =>
  ({ kind: 'val', key, endValue, duration, delay, ease });
export const Tcall = (fn) => ({ kind: 'call', fn, delay: 0 });
export const Trepeat = (body) => ({ kind: 'repeat', body, delay: 0 });
