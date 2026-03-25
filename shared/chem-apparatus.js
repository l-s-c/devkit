/**
 * chem-apparatus.js — Chemistry apparatus SVG generators
 * Each apparatus is a standalone function: drawXxx(parent, x, y, opts)
 */

const ChemApparatus = (() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  }

  // ===== COLLECTING BOTTLE (集气瓶) =====
  function drawCollectingBottle(parent, x, y, opts = {}) {
    const w = opts.width || 80, h = opts.height || 120;
    const g = el('g', { transform: `translate(${x},${y})`, id: opts.id || 'collectingBottle', class: 'apparatus collecting-bottle' });

    // Glass body (double gradient for glass effect)
    g.appendChild(el('rect', { x: 0, y: 20, width: w, height: h, rx: 4, fill: 'rgba(219,234,254,0.15)', stroke: '#93C5FD', 'stroke-width': '1.2' }));
    // Left highlight
    g.appendChild(el('line', { x1: 3, y1: 25, x2: 3, y2: h + 15, stroke: 'rgba(255,255,255,0.3)', 'stroke-width': '1' }));
    // Neck
    g.appendChild(el('rect', { x: w/2 - 12, y: 5, width: 24, height: 18, rx: 2, fill: 'rgba(219,234,254,0.1)', stroke: '#93C5FD', 'stroke-width': '1' }));

    // Scale marks (1/5 divisions)
    for (let i = 1; i <= 4; i++) {
      const my = 20 + h * (1 - i/5);
      g.appendChild(el('line', { x1: 0, y1: my, x2: 8, y2: my, stroke: '#94A3B8', 'stroke-width': '0.5' }));
      if (i === 1) {
        g.appendChild(el('text', { x: 11, y: my + 3, 'font-size': '6', fill: '#94A3B8' })).textContent = '1/5';
      }
    }

    // Label
    g.appendChild(el('text', { x: w/2, y: h + 35, 'font-size': '7', fill: '#64748B', 'text-anchor': 'middle' })).textContent = opts.label || '集气瓶';

    parent.appendChild(g);
    return g;
  }

  // ===== COMBUSTION SPOON (燃烧匙) =====
  function drawCombustionSpoon(parent, x, y, opts = {}) {
    const g = el('g', { transform: `translate(${x},${y})`, id: opts.id || 'combustionSpoon', class: 'apparatus combustion-spoon' });

    // Handle
    g.appendChild(el('line', { x1: 0, y1: 0, x2: 0, y2: -60, stroke: '#78716C', 'stroke-width': '2', 'stroke-linecap': 'round' }));
    // Spoon cup
    g.appendChild(el('ellipse', { cx: 0, cy: 0, rx: 8, ry: 4, fill: '#78716C', stroke: '#57534E', 'stroke-width': '0.5' }));

    parent.appendChild(g);
    return g;
  }

  // ===== ALCOHOL LAMP (酒精灯) =====
  function drawAlcoholLamp(parent, x, y, opts = {}) {
    const g = el('g', { transform: `translate(${x},${y})`, id: opts.id || 'alcoholLamp', class: 'apparatus alcohol-lamp' });

    // Body
    g.appendChild(el('ellipse', { cx: 0, cy: 0, rx: 20, ry: 12, fill: '#FDE68A', stroke: '#D97706', 'stroke-width': '0.8' }));
    // Neck
    g.appendChild(el('rect', { x: -4, y: -20, width: 8, height: 12, rx: 2, fill: '#D1D5DB', stroke: '#9CA3AF', 'stroke-width': '0.5' }));
    // Wick
    g.appendChild(el('line', { x1: 0, y1: -22, x2: 0, y2: -28, stroke: '#78716C', 'stroke-width': '1.5' }));
    // Label
    g.appendChild(el('text', { x: 0, y: 18, 'font-size': '6', fill: '#64748B', 'text-anchor': 'middle' })).textContent = '酒精灯';

    parent.appendChild(g);
    return g;
  }

  // ===== WATER TROUGH (水槽) =====
  function drawWaterTrough(parent, x, y, opts = {}) {
    const w = opts.width || 100, h = opts.height || 50;
    const g = el('g', { transform: `translate(${x},${y})`, id: opts.id || 'waterTrough', class: 'apparatus water-trough' });

    // Trough body
    g.appendChild(el('rect', { x: 0, y: 0, width: w, height: h, rx: 3, fill: 'rgba(219,234,254,0.2)', stroke: '#93C5FD', 'stroke-width': '1' }));
    // Water
    g.appendChild(el('rect', { x: 2, y: h * 0.3, width: w - 4, height: h * 0.68, rx: 2, fill: '#7DD3FC', opacity: '0.4' }));
    // Label
    g.appendChild(el('text', { x: w/2, y: h + 12, 'font-size': '6', fill: '#64748B', 'text-anchor': 'middle' })).textContent = opts.label || '水槽';

    parent.appendChild(g);
    return g;
  }

  // ===== RUBBER STOPPER (橡皮塞) =====
  function drawRubberStopper(parent, x, y, opts = {}) {
    const g = el('g', { transform: `translate(${x},${y})`, id: opts.id || 'stopper', class: 'apparatus stopper' });
    g.appendChild(el('rect', { x: -14, y: 0, width: 28, height: 8, rx: 2, fill: '#92400E', stroke: '#78350F', 'stroke-width': '0.5' }));
    parent.appendChild(g);
    return g;
  }

  // ===== CLAMP (止水夹) =====
  function drawClamp(parent, x, y, opts = {}) {
    const g = el('g', { transform: `translate(${x},${y})`, id: opts.id || 'clamp', class: 'apparatus clamp' });
    g.appendChild(el('rect', { x: -6, y: -4, width: 12, height: 8, rx: 1, fill: '#78716C', stroke: '#57534E', 'stroke-width': '0.5' }));
    const label = el('text', { x: 0, y: 12, 'font-size': '5', fill: '#64748B', 'text-anchor': 'middle' });
    label.textContent = opts.label || '止水夹';
    g.appendChild(label);
    parent.appendChild(g);
    return g;
  }

  return {
    drawCollectingBottle,
    drawCombustionSpoon,
    drawAlcoholLamp,
    drawWaterTrough,
    drawRubberStopper,
    drawClamp
  };
})();

if (typeof module !== 'undefined') module.exports = ChemApparatus;
