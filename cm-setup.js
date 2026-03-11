// ============================================================
// JSONKit — CodeMirror 6 Setup (npm packages, no CDN)
// ============================================================
import { EditorState, StateField, StateEffect } from '@codemirror/state';
import { EditorView, Decoration, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { json } from '@codemirror/lang-json';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';

// ── Custom theme matching JSONKit design tokens ──
const jsonkitTheme = EditorView.theme({
  '&': {
    fontSize: '13px',
    fontFamily: '"JetBrains Mono", monospace',
    height: '100%',
  },
  '.cm-content': {
    padding: '12px 0',
    caretColor: 'var(--brand-500)',
  },
  '.cm-gutters': {
    background: 'var(--bg-900)',
    borderRight: '1px solid var(--bg-700)',
    color: 'var(--text-600)',
  },
  '.cm-activeLineGutter': {
    background: 'var(--bg-850)',
    color: 'var(--text-400)',
  },
  '.cm-activeLine': {
    background: 'var(--bg-850)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    background: 'rgba(99, 102, 241, 0.15)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--brand-500)',
  },
  '.cm-matchingBracket': {
    background: 'rgba(99, 102, 241, 0.2)',
    outline: '1px solid rgba(99, 102, 241, 0.4)',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  // Diff decoration styles
  '.cm-diff-added': {
    backgroundColor: '#ECFDF5',
  },
  '.cm-diff-removed': {
    backgroundColor: '#FEF2F2',
  },
  '.cm-diff-modified': {
    backgroundColor: '#FFFBEB',
  },
  '.cm-diff-char': {
    backgroundColor: '#FDE68A',
    borderRadius: '2px',
  },
});

const darkDiffTheme = EditorView.theme({
  '.cm-diff-added': {
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  '.cm-diff-removed': {
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  '.cm-diff-modified': {
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  '.cm-diff-char': {
    backgroundColor: 'rgba(245,158,11,0.25)',
  },
});

// ── Diff decoration effect and field ──
const setDiffDecorations = StateEffect.define();

const diffDecorationField = StateField.define({
  create() { return Decoration.none; },
  update(decos, tr) {
    for (const e of tr.effects) {
      if (e.is(setDiffDecorations)) return e.value;
    }
    // Clear decorations on doc change (will be re-applied by re-diff)
    if (tr.docChanged) return Decoration.none;
    return decos;
  },
  provide: f => EditorView.decorations.from(f),
});

// ES module export + window fallback
export const cmDiffTools = { Decoration, setDiffDecorations, diffDecorationField };
window._cmDiffTools = cmDiffTools;

function createExtensions(options = {}) {
  const exts = [
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    history(),
    bracketMatching(),
    foldGutter(),
    highlightSelectionMatches(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    json(),
    jsonkitTheme,
    darkDiffTheme,
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...searchKeymap,
    ]),
  ];

  if (options.includeDiffField) {
    exts.push(diffDecorationField);
  }

  if (options.readonly) {
    exts.push(EditorState.readOnly.of(true));
  }

  if (options.onChange) {
    exts.push(EditorView.updateListener.of((update) => {
      if (update.docChanged) options.onChange(update);
    }));
  }

  return exts;
}

function replaceTextarea(id, options = {}) {
  const textarea = document.getElementById(id);
  if (!textarea) return null;

  const cmContainer = document.createElement('div');
  cmContainer.className = 'cm-container';
  cmContainer.style.cssText = 'height:100%;width:100%;';
  textarea.parentElement.insertBefore(cmContainer, textarea);
  textarea.style.display = 'none';

  try {
    const view = new EditorView({
      state: EditorState.create({
        doc: textarea.value || '',
        extensions: createExtensions({
          readonly: textarea.readOnly,
          onChange: options.onChange,
          includeDiffField: options.includeDiffField || false,
        }),
      }),
      parent: cmContainer,
    });

    // Check CM actually rendered
    if (!cmContainer.querySelector('.cm-editor')) {
      console.warn(`CM6 not rendered for #${id}, restoring textarea`);
      textarea.style.display = '';
      cmContainer.remove();
      return null;
    }

    // Proxy textarea.value ↔ CM editor
    Object.defineProperty(textarea, 'value', {
      get() { return view.state.doc.toString(); },
      set(val) {
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: val } });
      },
      configurable: true,
    });

    return view;
  } catch (err) {
    console.warn(`CM6 init failed for #${id}:`, err);
    textarea.style.display = '';
    cmContainer.remove();
    return null;
  }
}

// ── Initialize all editors ──
function initCodeMirror() {
  const makeOnChange = (id) => () => {
    const el = document.getElementById(id);
    if (el) el.dispatchEvent(new Event('input'));
  };

  const formatView = replaceTextarea('formatInput', { onChange: makeOnChange('formatInput') });
  replaceTextarea('treeInput', { onChange: makeOnChange('treeInput') });
  replaceTextarea('convertInput', { onChange: makeOnChange('convertInput') });
  replaceTextarea('convertOutput');

  // Expose format editor view
  window._cmFormatView = formatView;

  // Diff editors with decoration support + onChange for auto re-diff
  const diffLeftView = replaceTextarea('diffLeft', {
    includeDiffField: true,
    onChange: makeOnChange('diffLeft'),
  });
  const diffRightView = replaceTextarea('diffRight', {
    includeDiffField: true,
    onChange: makeOnChange('diffRight'),
  });

  // Expose diff editor views for app.js
  window._cmDiffViews = {
    left: diffLeftView,
    right: diffRightView,
  };

  console.log('✅ CodeMirror 6 initialized');
}

if (document.readyState === 'complete') {
  initCodeMirror();
} else {
  window.addEventListener('load', initCodeMirror);
}
