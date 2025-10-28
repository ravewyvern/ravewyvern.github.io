export const NovaRuntime = {
    outputEl: null,
    init(outputEl) {
        this.outputEl = outputEl;
        this.clear();
    },
    print(...args) {
        if (!this.outputEl) return;
        const text = args.join('');
        // append to the last non-error line if present, otherwise create a new div
        const last = this.outputEl.lastElementChild;
        if (last && !last.classList.contains('error')) {
            last.textContent += text;
        } else {
            const node = document.createElement('div');
            node.textContent = text;
            this.outputEl.appendChild(node);
        }
        this.outputEl.scrollTop = this.outputEl.scrollHeight;
    },
    println(...args) {
        if (!this.outputEl) return;
        const text = args.join('');
        // append to last line (or create one) then create a new empty line to move cursor to next line
        const last = this.outputEl.lastElementChild;
        if (last && !last.classList.contains('error')) {
            last.textContent += text;
        } else {
            const node = document.createElement('div');
            node.textContent = text;
            this.outputEl.appendChild(node);
        }
        // create an empty div so further print() continues on a new line
        const newline = document.createElement('div');
        this.outputEl.appendChild(newline);
        this.outputEl.scrollTop = this.outputEl.scrollHeight;
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
    clear() {
        if (this.outputEl) this.outputEl.innerHTML = '';
    }
};
