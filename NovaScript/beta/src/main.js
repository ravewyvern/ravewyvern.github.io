import { NovaRuntime } from './runtime.js';
import { interpret } from './parser.js';

const codeEl = document.getElementById('code');
const runBtn = document.getElementById('runBtn');
const clearBtn = document.getElementById('clearBtn');
const outputEl = document.getElementById('outputBox');

NovaRuntime.init(outputEl);

runBtn.addEventListener('click', () => {
  NovaRuntime.clear();
  // set global env reference for interpolation inside parser (hack for v0.1)
  window.__nova_env__ = {};
  try {
    // We'll read declarations to prepopulate env during interpretation; parser will fill window.__nova_env__ when variables are created.
    interpret(codeEl.value);
  } catch (e) {
    NovaRuntime.error(e.message);
  }
});

clearBtn.addEventListener('click', () => {
  NovaRuntime.clear();
});
