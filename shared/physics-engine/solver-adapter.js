/**
 * 求解适配器 — 接入不同物理求解器
 * @module solver-adapter
 */

/**
 * 电路 MNA 求解适配器
 * 复用现有 circuit-builder 的 solveCircuit 逻辑
 */
export function createCircuitSolver() {
  return function solve({ components, connections, registry }) {
    // Build node map from connections
    const nodeMap = {};
    let nodeId = 0;
    const getNode = key => {
      if (!(key in nodeMap)) nodeMap[key] = nodeId++;
      return nodeMap[key];
    };

    // Ground node
    const GND = getNode('gnd');

    // Assign nodes to ports via connections
    const portNodes = {};
    for (const conn of connections) {
      const k1 = `${conn.from.componentId}:${conn.from.portId}`;
      const k2 = `${conn.to.componentId}:${conn.to.portId}`;
      const n = getNode(k1);
      nodeMap[k2] = n; // merge nodes
      portNodes[k1] = n;
      portNodes[k2] = n;
    }

    // Ensure all ports have nodes
    for (const comp of components) {
      const def = registry.get(comp.type);
      for (const port of def.ports) {
        const k = `${comp.id}:${port.id}`;
        if (!(k in portNodes)) portNodes[k] = getNode(k);
      }
    }

    const N = nodeId; // total nodes
    if (N === 0) return { branches: {}, warning: null };

    // MNA: Gx = s
    // Voltage sources add extra equations
    const voltageSources = [];
    const branches = {};

    for (const comp of components) {
      const def = registry.get(comp.type);
      const ports = def.ports;
      const pNodes = ports.map(p => portNodes[`${comp.id}:${p.id}`]);

      switch (def.solver.type) {
        case 'voltage-source':
          voltageSources.push({ comp, n1: pNodes[0], n2: pNodes[1], V: comp.params.V || 0 });
          break;
        case 'resistor':
          branches[comp.id] = { n1: pNodes[0], n2: pNodes[1], R: comp.params.R || 10 };
          break;
        case 'switch':
          if (comp.params.closed) {
            branches[comp.id] = { n1: pNodes[0], n2: pNodes[1], R: 0.001 }; // near-zero resistance
          }
          break;
        default:
          break;
      }
    }

    // Simple MNA for DC circuits
    const size = N + voltageSources.length;
    const G = Array.from({ length: size }, () => new Float64Array(size));
    const s = new Float64Array(size);

    // Stamp resistors into G matrix
    for (const [id, br] of Object.entries(branches)) {
      const g = 1 / br.R;
      G[br.n1][br.n1] += g;
      G[br.n2][br.n2] += g;
      G[br.n1][br.n2] -= g;
      G[br.n2][br.n1] -= g;
    }

    // Stamp voltage sources
    for (let i = 0; i < voltageSources.length; i++) {
      const vs = voltageSources[i];
      const row = N + i;
      G[vs.n1][row] += 1;
      G[vs.n2][row] -= 1;
      G[row][vs.n1] += 1;
      G[row][vs.n2] -= 1;
      s[row] = vs.V;
    }

    // Ground node 0
    for (let j = 0; j < size; j++) {
      G[GND][j] = 0;
      G[j][GND] = 0;
    }
    G[GND][GND] = 1;
    s[GND] = 0;

    // Gaussian elimination
    const x = gaussianSolve(G, s, size);
    if (!x) return { branches: {}, error: 'singular-matrix' };

    // Extract results
    const result = { branches: {}, warning: null };
    for (const [id, br] of Object.entries(branches)) {
      const v1 = x[br.n1], v2 = x[br.n2];
      const I = (v1 - v2) / br.R;
      result.branches[id] = { V: v1 - v2, I, R: br.R };
      if (Math.abs(I) > 10) result.warning = 'overcurrent';
    }

    // Voltage source currents
    for (let i = 0; i < voltageSources.length; i++) {
      const vs = voltageSources[i];
      result.branches[vs.comp.id] = { V: vs.V, I: x[N + i] };
    }

    return result;
  };
}

function gaussianSolve(A, b, n) {
  // Copy
  const M = A.map(row => Float64Array.from(row));
  const s = Float64Array.from(b);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col, maxVal = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > maxVal) {
        maxVal = Math.abs(M[row][col]);
        maxRow = row;
      }
    }
    if (maxVal < 1e-12) return null; // Singular
    if (maxRow !== col) {
      [M[col], M[maxRow]] = [M[maxRow], M[col]];
      [s[col], s[maxRow]] = [s[maxRow], s[col]];
    }

    // Eliminate
    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / M[col][col];
      for (let j = col; j < n; j++) M[row][j] -= factor * M[col][j];
      s[row] -= factor * s[col];
    }
  }

  // Back substitution
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let sum = s[i];
    for (let j = i + 1; j < n; j++) sum -= M[i][j] * x[j];
    x[i] = sum / M[i][i];
  }
  return x;
}
