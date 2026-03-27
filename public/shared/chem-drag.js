/**
 * Chemistry Drag & Drop utility
 * Usage: ChemDrag.makeDraggable(svgEl, {onDrop, onDrag, snapBack, targets})
 */
const ChemDrag = (() => {
  let active = null; // {el, startX, startY, origTransform, ghost}

  function makeDraggable(el, opts = {}) {
    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      const svg = el.closest('svg');
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      
      active = {
        el,
        startX: svgP.x,
        startY: svgP.y,
        origTransform: el.getAttribute('transform') || '',
        opts
      };
      el.style.cursor = 'grabbing';
      el.style.opacity = '0.7';
      if (opts.onStart) opts.onStart(el);
    });

    el.addEventListener('pointermove', e => {
      if (!active || active.el !== el) return;
      const svg = el.closest('svg');
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      const dx = svgP.x - active.startX;
      const dy = svgP.y - active.startY;
      
      el.setAttribute('transform', `${active.origTransform} translate(${dx},${dy})`);
      
      // Highlight targets
      if (opts.targets) {
        opts.targets.forEach(t => {
          const hit = isOverTarget(el, t.el || document.getElementById(t.id));
          if (t.el || document.getElementById(t.id)) {
            (t.el || document.getElementById(t.id)).classList.toggle('drop-highlight', hit);
          }
        });
      }
      if (opts.onDrag) opts.onDrag(el, dx, dy);
    });

    el.addEventListener('pointerup', e => {
      if (!active || active.el !== el) return;
      el.style.cursor = 'grab';
      el.style.opacity = '1';
      
      // Check drop targets
      let dropped = false;
      if (opts.targets) {
        for (const t of opts.targets) {
          const targetEl = t.el || document.getElementById(t.id);
          if (targetEl && isOverTarget(el, targetEl)) {
            targetEl.classList.remove('drop-highlight');
            if (t.onDrop) t.onDrop(el, targetEl);
            dropped = true;
            break;
          }
          if (targetEl) targetEl.classList.remove('drop-highlight');
        }
      }
      
      // Snap back if no valid drop
      if (!dropped && opts.snapBack !== false) {
        el.setAttribute('transform', active.origTransform);
      }
      
      if (opts.onEnd) opts.onEnd(el, dropped);
      active = null;
    });
  }

  function isOverTarget(dragEl, targetEl) {
    if (!targetEl) return false;
    const a = dragEl.getBBox();
    const b = targetEl.getBBox();
    // Simple center-point check
    const dragCX = a.x + a.width / 2;
    const dragCY = a.y + a.height / 2;
    return dragCX > b.x && dragCX < b.x + b.width &&
           dragCY > b.y && dragCY < b.y + b.height;
  }

  function showToast(svg, msg, duration = 2000) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = `
      <rect x="160" y="170" width="400" height="40" rx="8" fill="rgba(0,0,0,0.75)"/>
      <text x="360" y="195" font-size="12" fill="white" text-anchor="middle" font-weight="600">${msg}</text>
    `;
    svg.appendChild(g);
    setTimeout(() => g.remove(), duration);
  }

  return { makeDraggable, showToast };
})();
