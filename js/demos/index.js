// Demo manager: play/stop/next/prev + UI list.

import { Animator } from './animation.js';
import { DEMOS } from './definitions.js';

export class Demos {
  constructor(model) {
    this.model = model;
    this.animator = new Animator(model);
    this.list = DEMOS.slice();
    this.currentIndex = -1;
    this._panelHost = null;
  }

  play(index) {
    if (index < 0 || index >= this.list.length) return;
    this.animator.stop();
    this.currentIndex = index;
    const d = this.list[index];
    this.model.setState(d.intro);
    this.animator.play(d.tasks());
    this._refreshPanel();
  }

  stop() {
    this.animator.stop();
    this._refreshPanel();
  }

  next() { this.play(Math.min(this.currentIndex + 1, this.list.length - 1)); }
  prev() { this.play(Math.max(this.currentIndex - 1, 0)); }

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
    const btnNext = document.createElement('button');
    btnNext.textContent = 'Next';
    btnNext.addEventListener('click', () => this.next());
    controls.append(btnStop, btnPrev, btnNext);
    panel.appendChild(controls);

    this._listEl = document.createElement('div');
    this._listEl.className = 'demo-list';
    panel.appendChild(this._listEl);

    this.list.forEach((d, i) => {
      const b = document.createElement('button');
      b.textContent = d.name;
      b.addEventListener('click', () => this.play(i));
      this._listEl.appendChild(b);
    });
    this._refreshPanel();
  }

  _refreshPanel() {
    if (!this._listEl) return;
    [...this._listEl.children].forEach((b, i) => {
      b.setAttribute('aria-current', i === this.currentIndex ? 'true' : 'false');
    });
  }
}
