/**
 * lab-utils.js — Shared utilities for lab experiments
 */

/**
 * Convert mouse/touch event to SVG coordinate space.
 * @param {SVGSVGElement} svgEl - The SVG element
 * @param {MouseEvent|TouchEvent} e - The event
 * @returns {{x: number, y: number}} SVG coordinates
 */
function getSvgPoint(svgEl, e) {
  const pt = svgEl.createSVGPoint();
  const src = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : e);
  pt.x = src.clientX;
  pt.y = src.clientY;
  return pt.matrixTransform(svgEl.getScreenCTM().inverse());
}

/**
 * Initialize KaTeX formula rendering.
 * Finds all elements with data-formula attribute and renders them.
 * Also renders elements passed as id→formula map.
 * @param {Object.<string, string>} formulas - Map of element id to LaTeX string
 * @param {Object} [options] - KaTeX render options
 */
function renderFormulas(formulas = {}, options = {}) {
  const defaultOpts = { throwOnError: false, displayMode: true, ...options };

  // Render by id map
  for (const [id, latex] of Object.entries(formulas)) {
    const el = document.getElementById(id);
    if (el && window.katex) {
      katex.render(latex, el, defaultOpts);
    }
  }

  // Render by data-formula attribute
  document.querySelectorAll('[data-formula]').forEach(el => {
    if (window.katex) {
      const latex = el.getAttribute('data-formula');
      const inline = el.hasAttribute('data-formula-inline');
      katex.render(latex, el, { ...defaultOpts, displayMode: !inline });
    }
  });
}

/**
 * Wait for KaTeX to load, then call renderFormulas.
 * @param {Object.<string, string>} formulas - Map of element id to LaTeX string
 */
function initFormulas(formulas = {}) {
  if (window.katex) {
    renderFormulas(formulas);
  } else {
    // KaTeX script has onload that calls renderFormulas if defined globally
    window.renderFormulas = () => renderFormulas(formulas);
  }
}

// Also expose globally for non-module usage
window.labUtils = { getSvgPoint, renderFormulas, initFormulas };
