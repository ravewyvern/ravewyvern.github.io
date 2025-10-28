export const NovaRuntime = {
  outputEl: null,
  init(outputEl) {
    this.outputEl = outputEl;
    this.clear();
  },
  print(...args) {
    if (!this.outputEl) return;
    this._append(args.join(''));
  },
  println(...args) {
    if (!this.outputEl) return;
    this._append(args.join('') + '\n');
  },
  error(msg) {
    if (!this.outputEl) return;
    const el = document.createElement('div');
    el.className = 'error';
    el.textContent = 'Error: ' + msg;
    this.outputEl.appendChild(el);
    this.outputEl.appendChild(document.createElement('hr'));
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  },
  _append(text) {
    const node = document.createElement('div');
    node.textContent = text;
    this.outputEl.appendChild(node);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  },
  clear() {
    if (this.outputEl) this.outputEl.innerHTML = '';
  }
};
