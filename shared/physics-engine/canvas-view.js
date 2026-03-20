/**
 * 画布交互层 — 拖放、连线、选中、缩放平移、磁吸
 * @module canvas-view
 */

export class CanvasView {
  /**
   * @param {PhysicsEngine} engine
   */
  constructor(engine) {
    this.engine = engine;
    this.SNAP_RADIUS = 24;
    this._spaceDown = false;
    this._isPanning = false;

    this._setupZoomPan();
    this._setupKeyboard();

    // Re-bindinteractions after each render
    engine.on('render:after', () => this._bindInteractions());
  }

  // ===== Zoom & Pan =====
  _setupZoomPan() {
    const svg = this.engine._svg;
    const state = this.engine.state;

    // Wheel zoom
    this.engine.container.addEventListener('wheel', e => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / state.zoom + state.panX;
      const my = (e.clientY - rect.top) / state.zoom + state.panY;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      state.zoom = Math.max(0.3, Math.min(3, state.zoom * factor));
      state.panX = mx - (e.clientX - rect.left) / state.zoom;
      state.panY = my - (e.clientY - rect.top) / state.zoom;
      this._updateViewBox();
    }, { passive: false });

    // Space + drag or middle mouse pan
    document.addEventListener('keydown', e => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        this._spaceDown = true;
        svg.style.cursor = 'grab';
        e.preventDefault();
      }
    });
    document.addEventListener('keyup', e => {
      if (e.code === 'Space') {
        this._spaceDown = false;
        if (!this._isPanning) svg.style.cursor = 'default';
      }
    });

    svg.addEventListener('pointerdown', e => {
      if (e.button === 1 || (e.button === 0 && this._spaceDown)) {
        e.preventDefault();
        this._isPanning = true;
        const startX = e.clientX, startY = e.clientY;
        const startPanX = state.panX, startPanY = state.panY;
        svg.style.cursor = 'grabbing';
        const onMove = ev => {
          state.panX = startPanX - (ev.clientX - startX) / state.zoom;
          state.panY = startPanY - (ev.clientY - startY) / state.zoom;
          this._updateViewBox();
        };
        const onUp = () => {
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
          this._isPanning = false;
          svg.style.cursor = this._spaceDown ? 'grab' : 'default';
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
      }
    });

    requestAnimationFrame(() => this._updateViewBox());
    window.addEventListener('resize', () => this._updateViewBox());
  }

  _updateViewBox() {
    const svg = this.engine._svg;
    const rect = svg.getBoundingClientRect();
    const state = this.engine.state;
    const w = rect.width / state.zoom, h = rect.height / state.zoom;
    svg.setAttribute('viewBox', `${state.panX} ${state.panY} ${w} ${h}`);
  }

  // ===== Keyboard shortcuts =====
  _setupKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        this.engine.emit('undo');
      }
      if ((e.key === 'y' && (e.metaKey || e.ctrlKey)) || (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey)) {
        e.preventDefault();
        this.engine.emit('redo');
      }
      if (document.activeElement.tagName === 'INPUT') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.engine.state.selectedId) this.engine.removeComponent(this.engine.state.selectedId);
        else if (this.engine.state.selectedWireIdx >= 0) this.engine.removeConnection(this.engine.state.selectedWireIdx);
      }
      if (e.key === 'Escape') this.engine.select(null);
      if (e.key === 'r' || e.key === 'R') {
        const comp = this.engine.state.components.find(c => c.id === this.engine.state.selectedId);
        if (comp) {
          comp.rotation = ((comp.rotation || 0) + 90) % 360;
          this.engine.render();
          this.engine.solve();
        }
      }
    });
  }

  // ===== Component drag & interaction =====
  _bindInteractions() {
    const groups = this.engine._compsLayer.querySelectorAll('.comp-group');
    groups.forEach(g => {
      const compId = g.dataset.id;
      const comp = this.engine.state.components.find(c => c.id === compId);
      if (!comp) return;
      this._setupDrag(g, comp);
      g.querySelectorAll('.port-circle').forEach(c => this._setupPortConnect(c));
    });
  }

  _setupDrag(g, comp) {
    g.addEventListener('pointerdown', e => {
      if (e.target.classList.contains('port-circle')) return;
      e.preventDefault();
      e.stopPropagation();
      this.engine.select(comp.id);

      const pt = this.engine.svgPoint(e);
      const offset = { x: pt.x - comp.x, y: pt.y - comp.y };
      let hasMoved = false;

      const onMove = ev => {
        hasMoved = true;
        const p = this.engine.svgPoint(ev);
        comp.x = this.engine._snap(p.x - offset.x);
        comp.y = this.engine._snap(p.y - offset.y);
        const r = comp.rotation || 0;
        g.setAttribute('transform', `translate(${comp.x},${comp.y})${r ? ` rotate(${r})` : ''}`);
        this.engine.emit('wire:redraw');
      };
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        if (!hasMoved) {
          // Click without drag — component interaction (e.g., switch toggle)
          const def = this.engine.registry.get(comp.type);
          if (def?.onInteract) {
            def.onInteract(comp, this.engine);
          }
        } else {
          this.engine.solve();
        }
        this.engine.emit('state:dirty');
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });
  }

  _setupPortConnect(circle) {
    circle.addEventListener('pointerdown', e => {
      e.preventDefault();
      e.stopPropagation();
      const compId = circle.dataset.compId;
      const portId = circle.dataset.portId;
      const comp = this.engine.state.components.find(c => c.id === compId);
      const def = this.engine.registry.get(comp.type);
      const port = def.ports.find(p => p.id === portId);
      const sp = this.engine.getPortPos(comp, port);

      const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tempLine.setAttribute('class', 'wire-temp');
      tempLine.setAttribute('d', `M${sp.x},${sp.y} L${sp.x},${sp.y}`);
      this.engine._tempLayer.appendChild(tempLine);

      let snapIndicator = null;

      const onMove = ev => {
        const pt = this.engine.svgPoint(ev);
        let bestDist = this.SNAP_RADIUS, bestPos = null;
        this.engine.state.components.forEach(c => {
          const cDef = this.engine.registry.get(c.type);
          cDef.ports.forEach(p => {
            if (c.id === compId && p.id === portId) return;
            const pp = this.engine.getPortPos(c, p);
            const d = Math.hypot(pp.x - pt.x, pp.y - pt.y);
            if (d < bestDist) { bestDist = d; bestPos = pp; }
          });
        });

        const tx = bestPos ? bestPos.x : pt.x;
        const ty = bestPos ? bestPos.y : pt.y;
        const ddx = Math.abs(tx - sp.x);
        const sag = Math.max(15, Math.hypot(ddx, Math.abs(ty - sp.y)) * 0.12);
        tempLine.setAttribute('d', `M${sp.x},${sp.y} C${sp.x + ddx * 0.3},${sp.y + sag} ${tx - ddx * 0.3},${ty + sag} ${tx},${ty}`);

        if (bestPos) {
          if (!snapIndicator) {
            snapIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            snapIndicator.setAttribute('r', '8');
            snapIndicator.setAttribute('fill', 'rgba(59,130,246,0.15)');
            snapIndicator.setAttribute('stroke', '#3B82F6');
            snapIndicator.setAttribute('stroke-width', '2');
            snapIndicator.style.pointerEvents = 'none';
            const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            anim.setAttribute('attributeName', 'r');
            anim.setAttribute('values', '6;10;6');
            anim.setAttribute('dur', '0.8s');
            anim.setAttribute('repeatCount', 'indefinite');
            snapIndicator.appendChild(anim);
            this.engine._tempLayer.appendChild(snapIndicator);
          }
          snapIndicator.setAttribute('cx', bestPos.x);
          snapIndicator.setAttribute('cy', bestPos.y);
        } else if (snapIndicator) {
          snapIndicator.remove();
          snapIndicator = null;
        }
      };

      const onUp = ev => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        tempLine.remove();
        if (snapIndicator) snapIndicator.remove();

        const pt = this.engine.svgPoint(ev);
        let bestDist = this.SNAP_RADIUS, bestTarget = null;
        this.engine.state.components.forEach(c => {
          const cDef = this.engine.registry.get(c.type);
          cDef.ports.forEach(p => {
            if (c.id === compId && p.id === portId) return;
            const pp = this.engine.getPortPos(c, p);
            const d = Math.hypot(pp.x - pt.x, pp.y - pt.y);
            if (d < bestDist) { bestDist = d; bestTarget = { componentId: c.id, portId: p.id }; }
          });
        });

        if (bestTarget) {
          this.engine.addConnection({ componentId: compId, portId }, bestTarget);
        }
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });
  }
}
