/**
 * chem-effects.js — Chemistry visual effects engine
 * Bubble generator, smoke particles, color transitions, precipitation
 */

const ChemEffects = (() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // ===== BUBBLE POOL =====
  function createBubblePool(svg, container, maxCount = 30) {
    const pool = [];
    const active = [];

    for (let i = 0; i < maxCount; i++) {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('r', '0');
      c.setAttribute('fill', 'rgba(255,255,255,0.3)');
      c.setAttribute('stroke', 'rgba(255,255,255,0.1)');
      c.setAttribute('stroke-width', '0.3');
      container.appendChild(c);
      pool.push({ el: c, x: 0, y: 0, r: 0, vy: 0, active: false });
    }

    let animId = null;

    function emit(x, yStart, yEnd, opts = {}) {
      const b = pool.find(p => !p.active);
      if (!b) return;
      b.active = true;
      b.x = x + (Math.random() - 0.5) * (opts.spread || 10);
      b.y = yStart;
      b.yEnd = yEnd;
      b.r = (opts.minR || 1) + Math.random() * ((opts.maxR || 3) - (opts.minR || 1));
      b.vy = -(opts.speed || 0.5) - Math.random() * 0.3;
      b.el.setAttribute('cx', b.x);
      b.el.setAttribute('cy', b.y);
      b.el.setAttribute('r', b.r);
      b.el.setAttribute('fill', opts.color || 'rgba(255,255,255,0.3)');
      active.push(b);
    }

    function tick() {
      for (let i = active.length - 1; i >= 0; i--) {
        const b = active[i];
        b.y += b.vy;
        b.x += (Math.random() - 0.5) * 0.3; // wobble
        b.el.setAttribute('cx', b.x);
        b.el.setAttribute('cy', b.y);

        if (b.y <= b.yEnd) {
          b.active = false;
          b.el.setAttribute('r', '0');
          active.splice(i, 1);
        }
      }
    }

    function start(interval = 100, emitFn) {
      let lastEmit = 0;
      function loop(now) {
        if (now - lastEmit > interval) {
          emitFn(emit);
          lastEmit = now;
        }
        tick();
        animId = requestAnimationFrame(loop);
      }
      animId = requestAnimationFrame(loop);
    }

    function stop() {
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      active.forEach(b => { b.active = false; b.el.setAttribute('r', '0'); });
      active.length = 0;
    }

    return { emit, tick, start, stop, active };
  }

  // ===== SMOKE PARTICLES =====
  function createSmokeSystem(svg, container, maxCount = 20) {
    const particles = [];

    for (let i = 0; i < maxCount; i++) {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('r', '0');
      c.setAttribute('filter', 'url(#smokeBlur)');
      container.appendChild(c);
      particles.push({ el: c, active: false });
    }

    let animId = null;

    function emit(x, y, opts = {}) {
      const p = particles.find(p => !p.active);
      if (!p) return;
      p.active = true;
      p.x = x + (Math.random() - 0.5) * (opts.spread || 8);
      p.y = y;
      p.r = opts.startR || 3;
      p.maxR = opts.maxR || 12;
      p.vy = -(opts.speed || 0.3) - Math.random() * 0.2;
      p.vx = (Math.random() - 0.5) * 0.3;
      p.opacity = opts.opacity || 0.4;
      p.life = 0;
      p.maxLife = opts.maxLife || 80;
      p.color = opts.color || '#D1D5DB';
      p.el.setAttribute('fill', p.color);
    }

    function tick() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (!p.active) continue;
        p.life++;
        p.y += p.vy;
        p.x += p.vx;
        const progress = p.life / p.maxLife;
        const r = p.r + (p.maxR - p.r) * progress;
        const opacity = p.opacity * (1 - progress);
        p.el.setAttribute('cx', p.x);
        p.el.setAttribute('cy', p.y);
        p.el.setAttribute('r', r);
        p.el.setAttribute('opacity', opacity);

        if (p.life >= p.maxLife) {
          p.active = false;
          p.el.setAttribute('r', '0');
          p.el.setAttribute('opacity', '0');
        }
      }
    }

    function start(interval = 60, emitFn) {
      let lastEmit = 0;
      function loop(now) {
        if (now - lastEmit > interval) {
          emitFn(emit);
          lastEmit = now;
        }
        tick();
        animId = requestAnimationFrame(loop);
      }
      animId = requestAnimationFrame(loop);
    }

    function stop() {
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      particles.forEach(p => { p.active = false; p.el.setAttribute('r', '0'); p.el.setAttribute('opacity', '0'); });
    }

    return { emit, tick, start, stop };
  }

  // ===== COLOR TRANSITION (HSL interpolation) =====
  function lerpHSL(hsl1, hsl2, t) {
    return [
      hsl1[0] + (hsl2[0] - hsl1[0]) * t,
      hsl1[1] + (hsl2[1] - hsl1[1]) * t,
      hsl1[2] + (hsl2[2] - hsl1[2]) * t
    ];
  }

  function hslToString(hsl) {
    return `hsl(${hsl[0].toFixed(0)}, ${hsl[1].toFixed(0)}%, ${hsl[2].toFixed(0)}%)`;
  }

  function animateColor(el, attr, fromHSL, toHSL, duration, onDone) {
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const hsl = lerpHSL(fromHSL, toHSL, t);
      el.setAttribute(attr, hslToString(hsl));
      if (t < 1) requestAnimationFrame(tick);
      else if (onDone) onDone();
    }
    requestAnimationFrame(tick);
  }

  // ===== LIQUID LEVEL ANIMATION =====
  function animateLiquidLevel(el, attrY, attrH, startY, endY, totalH, duration, onDone) {
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOut
      const y = startY + (endY - startY) * eased;
      const h = totalH - (y - Math.min(startY, endY));
      el.setAttribute(attrY, y);
      el.setAttribute(attrH, Math.max(0, startY + totalH - y));
      if (t < 1) requestAnimationFrame(tick);
      else if (onDone) onDone();
    }
    requestAnimationFrame(tick);
  }

  return {
    createBubblePool,
    createSmokeSystem,
    lerpHSL,
    hslToString,
    animateColor,
    animateLiquidLevel
  };
})();

if (typeof module !== 'undefined') module.exports = ChemEffects;
