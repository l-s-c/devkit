/**
 * 双视图渲染器 — 实物视图 + 电路图视图
 * @module renderer
 */

/**
 * 渲染连线（软导线 or 直角折线）
 */
export class WireRenderer {
  constructor(engine) {
    this.engine = engine;
  }

  /**
   * 渲染所有连线
   * @param {string} view - 'realistic' | 'schematic'
   */
  renderWires(view) {
    const layer = this.engine._wiresLayer;
    layer.innerHTML = '';

    for (const conn of this.engine.state.connections) {
      const fromComp = this.engine.state.components.find(c => c.id === conn.from.componentId);
      const toComp = this.engine.state.components.find(c => c.id === conn.to.componentId);
      if (!fromComp || !toComp) continue;

      const fromDef = this.engine.registry.get(fromComp.type);
      const toDef = this.engine.registry.get(toComp.type);
      const fromPort = fromDef.ports.find(p => p.id === conn.from.portId);
      const toPort = toDef.ports.find(p => p.id === conn.to.portId);
      if (!fromPort || !toPort) continue;

      const p1 = this.engine.getPortPos(fromComp, fromPort);
      const p2 = this.engine.getPortPos(toComp, toPort);

      if (!conn.ctrl) conn.ctrl = { dx: 0, dy: 0 };

      const pathD = view === 'schematic'
        ? this._schematicPath(p1, p2, conn.ctrl)
        : this._realisticPath(p1, p2, conn.ctrl);

      // Visible wire
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      line.setAttribute('d', pathD);
      line.setAttribute('class', view === 'schematic' ? 'wire-line wire-schematic' : 'wire-line');

      // Hit area
      const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hit.setAttribute('d', pathD);
      hit.setAttribute('stroke', 'transparent');
      hit.setAttribute('stroke-width', '16');
      hit.setAttribute('fill', 'none');
      hit.style.cursor = 'pointer';

      const wireIdx = this.engine.state.connections.indexOf(conn);
      hit.dataset.wireIdx = wireIdx;
      line.dataset.wireIdx = wireIdx;

      layer.appendChild(line);
      layer.appendChild(hit);

      // Draggable midpoint (realistic view only)
      if (view === 'realistic') {
        this._addMidpointHandle(layer, p1, p2, conn, hit, line);
      }
    }
  }

  _realisticPath(p1, p2, ctrl) {
    const midX = (p1.x + p2.x) / 2 + ctrl.dx;
    const midY = (p1.y + p2.y) / 2 + ctrl.dy;
    const dx = Math.abs(p2.x - p1.x);
    const dist = Math.hypot(dx, Math.abs(p2.y - p1.y));
    const sag = Math.max(15, dist * 0.1);
    const cx1 = p1.x + (midX - p1.x) * 0.5;
    const cy1 = p1.y + (midY - p1.y) * 0.5 + sag;
    const cx2 = p2.x + (midX - p2.x) * 0.5;
    const cy2 = p2.y + (midY - p2.y) * 0.5 + sag;
    return `M${p1.x},${p1.y} Q${cx1},${cy1} ${midX},${midY} Q${cx2},${cy2} ${p2.x},${p2.y}`;
  }

  _schematicPath(p1, p2, ctrl) {
    const midX = (p1.x + p2.x) / 2;
    if (Math.abs(p1.y - p2.y) < 2) {
      return `M${p1.x},${p1.y} L${p2.x},${p2.y}`;
    }
    return `M${p1.x},${p1.y} L${midX},${p1.y} L${midX},${p2.y} L${p2.x},${p2.y}`;
  }

  _addMidpointHandle(layer, p1, p2, conn, hit, line) {
    const midX = (p1.x + p2.x) / 2 + conn.ctrl.dx;
    const midY = (p1.y + p2.y) / 2 + conn.ctrl.dy;

    const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    handle.setAttribute('cx', midX);
    handle.setAttribute('cy', midY);
    handle.setAttribute('r', '6');
    handle.setAttribute('fill', 'rgba(220,38,38,0.15)');
    handle.setAttribute('stroke', '#DC2626');
    handle.setAttribute('stroke-width', '1.5');
    handle.style.cursor = 'grab';
    handle.style.opacity = '0';
    handle.style.transition = 'opacity 150ms';

    const show = () => handle.style.opacity = '1';
    const hide = () => { if (!handle._dragging) handle.style.opacity = '0'; };
    hit.addEventListener('pointerenter', show);
    line.addEventListener('pointerenter', show);
    hit.addEventListener('pointerleave', hide);
    line.addEventListener('pointerleave', hide);
    handle.addEventListener('pointerenter', show);
    handle.addEventListener('pointerleave', hide);

    handle.addEventListener('pointerdown', e => {
      e.preventDefault();
      e.stopPropagation();
      handle._dragging = true;
      const baseMX = (p1.x + p2.x) / 2;
      const baseMY = (p1.y + p2.y) / 2;
      const onMove = ev => {
        const pt = this.engine.svgPoint(ev);
        conn.ctrl.dx = pt.x - baseMX;
        conn.ctrl.dy = pt.y - baseMY;
        this.renderWires(this.engine.getView());
      };
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        handle._dragging = false;
        this.engine.emit('state:dirty');
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });

    layer.appendChild(handle);
  }
}
