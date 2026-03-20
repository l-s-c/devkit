/**
 * PhysicsEngine — 核心场景管理、事件分发
 * @module engine
 */

import { ComponentRegistry } from './component.js';

export class PhysicsEngine {
  /**
   * @param {object} opts
   * @param {HTMLElement} opts.container - 画布容器
   * @param {string} [opts.mode='circuit'] - 模式 circuit|mechanics|optics
   * @param {number} [opts.gridSize=20] - 网格大小
   */
  constructor(opts) {
    this.container = opts.container;
    this.mode = opts.mode || 'circuit';
    this.gridSize = opts.gridSize || 20;

    this.registry = new ComponentRegistry();
    this.state = {
      components: [],
      connections: [],
      selectedId: null,
      selectedWireIdx: -1,
      nextId: 1,
      zoom: 1,
      panX: 0,
      panY: 0,
    };

    this._view = 'realistic'; // 'realistic' | 'schematic'
    this._listeners = {};
    this._solver = null;
    this._renderer = null;
    this._canvasView = null;
    this._lastResult = null;

    this._initSVG();
  }

  // ===== Event system =====
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
    return this;
  }

  emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  }

  // ===== Component registration =====
  registerComponent(type, def) {
    this.registry.register(type, def);
    return this;
  }

  // ===== State management =====
  addComponent(type, x, y) {
    const comp = this.registry.createInstance(type, this._snap(x), this._snap(y), `c${this.state.nextId++}`);
    this.state.components.push(comp);
    this.emit('component:add', comp);
    this.render();
    this.solve();
    return comp;
  }

  removeComponent(id) {
    this.state.components = this.state.components.filter(c => c.id !== id);
    this.state.connections = this.state.connections.filter(c =>
      c.from.componentId !== id && c.to.componentId !== id
    );
    if (this.state.selectedId === id) this.state.selectedId = null;
    this.emit('component:remove', id);
    this.render();
    this.solve();
  }

  addConnection(from, to) {
    const exists = this.state.connections.some(c =>
      (c.from.componentId === from.componentId && c.from.portId === from.portId &&
       c.to.componentId === to.componentId && c.to.portId === to.portId)
    );
    if (exists) return;
    const conn = { from, to, ctrl: { dx: 0, dy: 0 } };
    this.state.connections.push(conn);
    this.emit('connection:add', conn);
    this.render();
    this.solve();
  }

  removeConnection(idx) {
    this.state.connections.splice(idx, 1);
    this.emit('connection:remove', idx);
    this.render();
    this.solve();
  }

  select(id) {
    this.state.selectedId = id;
    this.state.selectedWireIdx = -1;
    this.emit('select', id);
    this.render();
  }

  // ===== View switching =====
  setView(view) {
    this._view = view;
    this.emit('view:change', view);
    this.render();
  }

  getView() {
    return this._view;
  }

  // ===== Solver =====
  setSolver(solverFn) {
    this._solver = solverFn;
  }

  solve() {
    if (!this._solver) return;
    this._lastResult = this._solver({
      components: this.state.components,
      connections: this.state.connections,
      registry: this.registry,
    });
    this.emit('solve', this._lastResult);
    return this._lastResult;
  }

  getLastResult() {
    return this._lastResult;
  }

  // ===== Rendering =====
  render() {
    this.emit('render:before');
    // Clear layers
    this._compsLayer.innerHTML = '';
    this._wiresLayer.innerHTML = '';

    // Render components
    for (const comp of this.state.components) {
      const def = this.registry.get(comp.type);
      if (!def) continue;
      const renderFn = def.render[this._view] || def.render.realistic;
      const svgContent = renderFn(comp, this._lastResult);

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'comp-group');
      g.setAttribute('data-id', comp.id);
      const rot = comp.rotation || 0;
      g.setAttribute('transform', `translate(${comp.x},${comp.y})${rot ? ` rotate(${rot})` : ''}`);

      const inner = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      inner.innerHTML = svgContent;
      g.appendChild(inner);

      // Ports
      for (const port of def.ports) {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', port.dx);
        c.setAttribute('cy', port.dy);
        c.setAttribute('r', '6');
        c.setAttribute('class', 'port-circle');
        c.setAttribute('data-comp-id', comp.id);
        c.setAttribute('data-port-id', port.id);
        g.appendChild(c);
      }

      if (comp.id === this.state.selectedId) g.classList.add('selected');
      this._compsLayer.appendChild(g);
    }

    this.emit('render:after');
  }

  // ===== Helpers =====
  _snap(v) {
    return Math.round(v / this.gridSize) * this.gridSize;
  }

  getPortPos(comp, port) {
    const rad = (comp.rotation || 0) * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    return {
      x: comp.x + port.dx * cos - port.dy * sin,
      y: comp.y + port.dx * sin + port.dy * cos,
    };
  }

  svgPoint(e) {
    const rect = this._svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / this.state.zoom + this.state.panX,
      y: (e.clientY - rect.top) / this.state.zoom + this.state.panY,
    };
  }

  _initSVG() {
    this._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this._svg.style.cssText = 'width:100%;height:100%';
    this._svg.innerHTML = `
      <defs>
        <pattern id="pe-grid" width="${this.gridSize}" height="${this.gridSize}" patternUnits="userSpaceOnUse">
          <circle cx="${this.gridSize/2}" cy="${this.gridSize/2}" r="0.8" fill="rgba(0,0,0,0.06)"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pe-grid)"/>
      <g id="pe-wires"></g>
      <g id="pe-comps"></g>
      <g id="pe-temp"></g>
    `;
    this.container.appendChild(this._svg);
    this._wiresLayer = this._svg.querySelector('#pe-wires');
    this._compsLayer = this._svg.querySelector('#pe-comps');
    this._tempLayer = this._svg.querySelector('#pe-temp');
  }

  // ===== Serialization =====
  exportState() {
    return JSON.parse(JSON.stringify({
      components: this.state.components,
      connections: this.state.connections,
    }));
  }

  importState(data) {
    this.state.components = data.components || [];
    this.state.connections = data.connections || [];
    this.state.nextId = Math.max(...this.state.components.map(c => parseInt(c.id.slice(1)) || 0), 0) + 1;
    this.render();
    this.solve();
  }
}
