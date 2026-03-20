/**
 * 元件注册表 — 类型定义、端口、外观、物理属性
 * @module component
 */

export class ComponentRegistry {
  constructor() {
    this._types = new Map();
  }

  /**
   * 注册元件类型
   * @param {string} type - 类型标识 (battery, resistor, ...)
   * @param {object} def - 定义
   * @param {Array} def.ports - 端口 [{id, dx, dy, side?}]
   * @param {object} def.params - 参数 {name: {default, min?, max?, unit, step?}}
   * @param {object} def.render - 渲染 {realistic: fn(comp,state), schematic: fn(comp,state)}
   * @param {object} def.solver - 求解属性 {type: 'voltage-source'|'resistor'|'switch'|...}
   * @param {object} [def.meta] - 元数据 {label, icon, tag, category}
   * @param {function} [def.onInteract] - 画布直接交互回调 (comp, engine) => void
   */
  register(type, def) {
    if (!def.ports || !def.render) throw new Error(`Component "${type}" must have ports and render`);
    this._types.set(type, {
      type,
      ports: def.ports,
      params: def.params || {},
      render: def.render,
      solver: def.solver || {},
      meta: def.meta || { label: type },
      onInteract: def.onInteract || null,
    });
  }

  get(type) {
    return this._types.get(type);
  }

  all() {
    return [...this._types.values()];
  }

  /**
   * 创建元件实例
   */
  createInstance(type, x, y, id) {
    const def = this.get(type);
    if (!def) throw new Error(`Unknown component type: ${type}`);
    const params = {};
    for (const [k, v] of Object.entries(def.params)) {
      params[k] = typeof v === 'object' ? v.default : v;
    }
    return {
      id: id || `c${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      x, y,
      rotation: 0,
      params,
    };
  }
}
