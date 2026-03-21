/**
 * MNA (Modified Nodal Analysis) Circuit Solver
 * Pure function, no dependencies.
 * 
 * Input: { components, connections }
 *   component: { id, type, params: { R, V, ... }, ports: [{ id, side }] }
 *   connection: { from: { componentId, portId }, to: { componentId, portId } }
 * 
 * Output: { nodes: { nodeId: voltage }, branches: { componentId: { I, V } }, error? }
 */

export function solveCircuit(circuit) {
  const { components, connections } = circuit;
  if (!components.length) return { nodes: {}, branches: {}, error: null };

  // 1. Build node map — connected ports share the same node
  const portToNode = {};  // "compId:portId" -> nodeId
  const uf = new UnionFind();

  for (const conn of connections) {
    const a = `${conn.from.componentId}:${conn.from.portId}`;
    const b = `${conn.to.componentId}:${conn.to.portId}`;
    uf.union(a, b);
  }

  // Also register isolated ports + merge wire ports (zero resistance)
  for (const comp of components) {
    for (const port of comp.ports) {
      const key = `${comp.id}:${port.id}`;
      uf.find(key); // ensure exists
    }
    // Wire: merge both ports into same node (zero resistance)
    if (comp.type === 'wire' && comp.ports.length >= 2) {
      uf.union(`${comp.id}:${comp.ports[0].id}`, `${comp.id}:${comp.ports[1].id}`);
    }
  }

  // Map union-find roots to sequential node IDs (0-based)
  const rootToNodeId = {};
  let nodeCount = 0;
  for (const key of uf.allKeys()) {
    const root = uf.find(key);
    if (!(root in rootToNodeId)) {
      rootToNodeId[root] = nodeCount++;
    }
    portToNode[key] = rootToNodeId[root];
  }

  if (nodeCount < 2) return { nodes: {}, branches: {}, error: 'not-enough-nodes' };

  // 2. Ground node = node 0 (pick the negative terminal of first voltage source, or node 0)
  let groundNode = 0;
  for (const comp of components) {
    if (comp.type === 'battery') {
      const negKey = `${comp.id}:${comp.ports[0].id}`; // port[0] = negative
      groundNode = portToNode[negKey] ?? 0;
      break;
    }
  }

  // Remap so ground = index 0
  const nodeRemap = new Array(nodeCount);
  let idx = 1;
  for (let i = 0; i < nodeCount; i++) {
    if (i === groundNode) nodeRemap[i] = 0;
    else nodeRemap[i] = idx++;
  }
  // Update portToNode
  for (const key in portToNode) {
    portToNode[key] = nodeRemap[portToNode[key]];
  }

  // 3. Classify components
  const resistors = [];
  const voltageSources = [];
  const switches = [];
  const otherPassive = []; // ammeter (R≈0), bulb (has R)

  for (const comp of components) {
    switch (comp.type) {
      case 'resistor':
      case 'bulb':
        resistors.push(comp);
        break;
      case 'rheostat':
        resistors.push({ ...comp, params: { ...comp.params, R: Math.max(0.01, (comp.params.R_total || 20) * (comp.params.slider ?? 0.5)) } });
        break;
      case 'battery':
        voltageSources.push(comp);
        break;
      case 'switch':
        switches.push(comp);
        break;
      case 'ammeter':
        // Treat as very small resistor (0.001Ω)
        resistors.push({ ...comp, params: { ...comp.params, R: 0.001 } });
        break;
      case 'voltmeter':
        // Treat as very large resistor (1MΩ)
        resistors.push({ ...comp, params: { ...comp.params, R: 1e6 } });
        break;
      case 'wire':
        // Already merged in step 1 (before node mapping)
        break;
    }
  }

  // Handle switches: open switch = break connection (infinite R)
  for (const sw of switches) {
    if (!sw.params.closed) {
      // Open switch = very high resistance
      resistors.push({ ...sw, params: { R: 1e12 } });
    } else {
      // Closed switch = very low resistance
      resistors.push({ ...sw, params: { R: 0.001 } });
    }
  }

  // 4. Check for closed circuit
  // If no voltage source, no current flows
  if (voltageSources.length === 0) {
    return buildResult(components, portToNode, new Float64Array(nodeCount), [], voltageSources);
  }

  // 5. Build MNA matrices
  // Variables: [V1, V2, ..., V(n-1), I_vs1, I_vs2, ...]
  // V0 = ground = 0 (not a variable)
  const n = nodeCount - 1; // voltage variables (excluding ground)
  const m = voltageSources.length; // current variables
  const size = n + m;

  if (size === 0) return { nodes: {}, branches: {}, error: 'degenerate' };

  const A = Array.from({ length: size }, () => new Float64Array(size));
  const b = new Float64Array(size);

  // 5a. Stamp resistors into G matrix (top-left n×n block)
  for (const r of resistors) {
    const R = r.params.R;
    if (!R || R <= 0) continue;
    const G = 1 / R;
    const p0key = `${r.id}:${r.ports[0].id}`;
    const p1key = `${r.id}:${r.ports[1].id}`;
    const n0 = portToNode[p0key]; // node indices (0=ground)
    const n1 = portToNode[p1key];

    // Stamp conductance: G matrix uses 1-indexed (node 0 = ground, skip)
    if (n0 > 0 && n0 <= n) A[n0 - 1][n0 - 1] += G;
    if (n1 > 0 && n1 <= n) A[n1 - 1][n1 - 1] += G;
    if (n0 > 0 && n1 > 0) {
      A[n0 - 1][n1 - 1] -= G;
      A[n1 - 1][n0 - 1] -= G;
    }
  }

  // 5b. Stamp voltage sources
  for (let k = 0; k < m; k++) {
    const vs = voltageSources[k];
    const V = vs.params.V || 0;
    const negKey = `${vs.id}:${vs.ports[0].id}`; // port[0] = negative
    const posKey = `${vs.id}:${vs.ports[1].id}`; // port[1] = positive
    const nNeg = portToNode[negKey];
    const nPos = portToNode[posKey];

    // B and C matrices (off-diagonal blocks)
    // Row n+k: V(nPos) - V(nNeg) = V_source
    if (nPos > 0) { A[n + k][nPos - 1] = 1; A[nPos - 1][n + k] = 1; }
    if (nNeg > 0) { A[n + k][nNeg - 1] = -1; A[nNeg - 1][n + k] = -1; }

    b[n + k] = V;
  }

  // 6. Solve Ax = b using Gaussian elimination with partial pivoting
  const x = gaussianSolve(A, b, size);
  if (!x) return { nodes: {}, branches: {}, error: 'singular-matrix' };

  // 7. Extract results
  const nodeVoltages = new Float64Array(nodeCount);
  for (let i = 0; i < n; i++) {
    nodeVoltages[i + 1] = x[i]; // node 0 = ground = 0V
  }

  const vsCurrents = [];
  for (let k = 0; k < m; k++) {
    vsCurrents.push(x[n + k]);
  }

  return buildResult(components, portToNode, nodeVoltages, vsCurrents, voltageSources);
}

function buildResult(components, portToNode, nodeVoltages, vsCurrents, voltageSources) {
  const nodes = {};
  const branches = {};

  // Node voltages
  for (let i = 0; i < nodeVoltages.length; i++) {
    nodes[i] = nodeVoltages[i];
  }

  // Branch currents and voltages
  for (const comp of components) {
    if (comp.ports.length < 2) continue;
    const n0key = `${comp.id}:${comp.ports[0].id}`;
    const n1key = `${comp.id}:${comp.ports[1].id}`;
    const n0 = portToNode[n0key];
    const n1 = portToNode[n1key];

    if (n0 === undefined || n1 === undefined) {
      branches[comp.id] = { V: 0, I: 0 };
      continue;
    }

    const V0 = nodeVoltages[n0] || 0;
    const V1 = nodeVoltages[n1] || 0;
    const Vdrop = V1 - V0;

    if (comp.type === 'battery') {
      const vsIdx = voltageSources.indexOf(comp);
      branches[comp.id] = { V: comp.params.V, I: vsIdx >= 0 ? vsCurrents[vsIdx] : 0 };
    } else if (comp.type === 'resistor' || comp.type === 'bulb') {
      const R = comp.params.R || 1;
      branches[comp.id] = { V: Math.abs(Vdrop), I: Vdrop / R };
    } else if (comp.type === 'ammeter') {
      branches[comp.id] = { V: 0, I: Vdrop / 0.001 };
    } else if (comp.type === 'switch') {
      if (comp.params.closed) {
        branches[comp.id] = { V: 0, I: Vdrop / 0.001 };
      } else {
        branches[comp.id] = { V: Math.abs(Vdrop), I: 0 };
      }
    } else {
      branches[comp.id] = { V: Math.abs(Vdrop), I: 0 };
    }
  }

  // Overcurrent warning
  let warning = null;
  for (const id in branches) {
    if (Math.abs(branches[id].I) > 10) {
      warning = 'overcurrent';
      break;
    }
  }

  return { nodes, branches, error: null, warning };
}

// Gaussian elimination with partial pivoting
function gaussianSolve(A, b, n) {
  // Work on copies
  const M = A.map(row => Float64Array.from(row));
  const rhs = Float64Array.from(b);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col, maxVal = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > maxVal) {
        maxVal = Math.abs(M[row][col]);
        maxRow = row;
      }
    }
    if (maxVal < 1e-15) return null; // Singular

    // Swap rows
    if (maxRow !== col) {
      [M[col], M[maxRow]] = [M[maxRow], M[col]];
      [rhs[col], rhs[maxRow]] = [rhs[maxRow], rhs[col]];
    }

    // Eliminate
    const pivot = M[col][col];
    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / pivot;
      for (let j = col; j < n; j++) {
        M[row][j] -= factor * M[col][j];
      }
      rhs[row] -= factor * rhs[col];
    }
  }

  // Back substitution
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let sum = rhs[i];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = sum / M[i][i];
  }

  return x;
}

// Union-Find for node merging
class UnionFind {
  constructor() { this.parent = {}; this.rank = {}; }
  find(x) {
    if (!(x in this.parent)) { this.parent[x] = x; this.rank[x] = 0; }
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  union(a, b) {
    const ra = this.find(a), rb = this.find(b);
    if (ra === rb) return;
    if (this.rank[ra] < this.rank[rb]) this.parent[ra] = rb;
    else if (this.rank[ra] > this.rank[rb]) this.parent[rb] = ra;
    else { this.parent[rb] = ra; this.rank[ra]++; }
  }
  allKeys() { return Object.keys(this.parent); }
}
