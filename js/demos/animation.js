// Tiny tween engine for animated demos. Lives outside the render loop — the
// engine calls model.setState() at rAF frequency and the renderer reacts via
// its own 'update' listener.

const EASING = {
  linear: (t) => t,
  cosine: (t) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t))),
};

export class Animator {
  constructor(model) {
    this.model = model;
    this.queue = [];
    this.running = false;
    this.paused  = false;   // S201 — pause/resume without clearing queue
    this._now = null;
    this._frame = this._frame.bind(this);
  }

  play(tasks) {
    this.queue = tasks.slice();
    this.paused = false;
    this._now = performance.now();
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(this._frame);
    }
  }

  // S201 — freeze the tween queue in place. The rAF chain breaks but
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
    const elapsed = ts - this._now;
    this._now = ts;

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
    return true;
  }
}

// Helpers matching the original authoring style (Tpse/Ttxt/Tval).
export const Tpse = (ms) => ({ kind: 'pause', duration: ms, delay: 0 });
export const Ttxt = (txt, delay = 0) => ({ kind: 'text', text: txt, delay });
export const Tval = (key, endValue, duration = 500, delay = 0, ease = 'cosine') =>
  ({ kind: 'val', key, endValue, duration, delay, ease });
