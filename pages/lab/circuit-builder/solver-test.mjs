import { solveCircuit } from './circuit-solver.js';

function makeComp(id, type, params, ports) {
  return { id, type, params, ports: ports.map((p, i) => ({ id: `p${i}`, side: i === 0 ? 'left' : 'right' })) };
}
function conn(c1, p1, c2, p2) {
  return { from: { componentId: c1, portId: `p${p1}` }, to: { componentId: c2, portId: `p${p2}` } };
}
function approx(a, b, tol = 0.01) { return Math.abs(a - b) < tol; }

let pass = 0, fail = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    pass++;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    fail++;
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

// 1. Simple: V=6V, R=10Ω → I=0.6A
test('1. Simple circuit V=6V R=10Ω → I=0.6A', () => {
  const r = solveCircuit({
    components: [
      makeComp('bat', 'battery', { V: 6 }, [0, 1]),       // port0=neg, port1=pos
      makeComp('r1', 'resistor', { R: 10 }, [0, 1]),
    ],
    connections: [
      conn('bat', 1, 'r1', 1),  // bat+ → r1 right
      conn('bat', 0, 'r1', 0),  // bat- → r1 left
    ]
  });
  assert(!r.error, 'error: ' + r.error);
  assert(approx(Math.abs(r.branches.r1.I), 0.6), `I=${r.branches.r1.I}, expected 0.6`);
});

// 2. Series: V=12V, R1=10Ω, R2=20Ω → I=0.4A, V1=4V, V2=8V
test('2. Series V=12V R1=10 R2=20 → I=0.4A', () => {
  const r = solveCircuit({
    components: [
      makeComp('bat', 'battery', { V: 12 }, [0, 1]),
      makeComp('r1', 'resistor', { R: 10 }, [0, 1]),
      makeComp('r2', 'resistor', { R: 20 }, [0, 1]),
    ],
    connections: [
      conn('bat', 1, 'r1', 0),   // bat+ → r1 left
      conn('r1', 1, 'r2', 0),    // r1 right → r2 left
      conn('r2', 1, 'bat', 0),   // r2 right → bat-
    ]
  });
  assert(!r.error, 'error: ' + r.error);
  assert(approx(Math.abs(r.branches.r1.I), 0.4), `I_r1=${r.branches.r1.I}`);
  assert(approx(r.branches.r1.V, 4), `V_r1=${r.branches.r1.V}`);
  assert(approx(r.branches.r2.V, 8), `V_r2=${r.branches.r2.V}`);
});

// 3. Parallel: V=12V, R1=10Ω, R2=20Ω → I1=1.2A, I2=0.6A
test('3. Parallel V=12V R1=10 R2=20 → I1=1.2 I2=0.6', () => {
  const r = solveCircuit({
    components: [
      makeComp('bat', 'battery', { V: 12 }, [0, 1]),
      makeComp('r1', 'resistor', { R: 10 }, [0, 1]),
      makeComp('r2', 'resistor', { R: 20 }, [0, 1]),
    ],
    connections: [
      conn('bat', 1, 'r1', 1),   // bat+ → r1+
      conn('bat', 1, 'r2', 1),   // bat+ → r2+
      conn('r1', 0, 'bat', 0),   // r1- → bat-
      conn('r2', 0, 'bat', 0),   // r2- → bat-
    ]
  });
  assert(!r.error, 'error: ' + r.error);
  assert(approx(Math.abs(r.branches.r1.I), 1.2), `I_r1=${r.branches.r1.I}`);
  assert(approx(Math.abs(r.branches.r2.I), 0.6), `I_r2=${r.branches.r2.I}`);
});

// 4. Mixed: V=12V, R1=10Ω series with R2∥R3=20Ω∥20Ω
test('4. Mixed V=12V R1=10 R2∥R3=20∥20 → I=0.6A', () => {
  const r = solveCircuit({
    components: [
      makeComp('bat', 'battery', { V: 12 }, [0, 1]),
      makeComp('r1', 'resistor', { R: 10 }, [0, 1]),
      makeComp('r2', 'resistor', { R: 20 }, [0, 1]),
      makeComp('r3', 'resistor', { R: 20 }, [0, 1]),
    ],
    connections: [
      conn('bat', 1, 'r1', 0),   // bat+ → r1 left
      conn('r1', 1, 'r2', 0),    // r1 right → r2 left (junction)
      conn('r1', 1, 'r3', 0),    // r1 right → r3 left (junction)
      conn('r2', 1, 'bat', 0),   // r2 right → bat-
      conn('r3', 1, 'bat', 0),   // r3 right → bat-
    ]
  });
  assert(!r.error, 'error: ' + r.error);
  // Rp = 10, Rt = 20, I_total = 0.6A
  assert(approx(Math.abs(r.branches.bat.I), 0.6), `I_total=${r.branches.bat.I}`);
  assert(approx(Math.abs(r.branches.r2.I), 0.3), `I_r2=${r.branches.r2.I}`);
  assert(approx(Math.abs(r.branches.r3.I), 0.3), `I_r3=${r.branches.r3.I}`);
});

// 5. Wheatstone bridge balanced: R1*R4 = R2*R3 → bridge current = 0
test('5. Wheatstone bridge balanced → bridge I=0', () => {
  const r = solveCircuit({
    components: [
      makeComp('bat', 'battery', { V: 10 }, [0, 1]),
      makeComp('r1', 'resistor', { R: 10 }, [0, 1]),
      makeComp('r2', 'resistor', { R: 20 }, [0, 1]),
      makeComp('r3', 'resistor', { R: 10 }, [0, 1]),
      makeComp('r4', 'resistor', { R: 20 }, [0, 1]),
      makeComp('rg', 'resistor', { R: 50 }, [0, 1]), // galvanometer
    ],
    connections: [
      conn('bat', 1, 'r1', 0),   // bat+ → A
      conn('bat', 1, 'r2', 0),   // bat+ → A
      conn('r1', 1, 'rg', 0),    // B (r1 right = rg left)
      conn('r2', 1, 'rg', 1),    // C (r2 right = rg right)
      conn('r1', 1, 'r3', 0),    // B → r3
      conn('r2', 1, 'r4', 0),    // C → r4
      conn('r3', 1, 'bat', 0),   // D → bat-
      conn('r4', 1, 'bat', 0),   // D → bat-
    ]
  });
  assert(!r.error, 'error: ' + r.error);
  assert(approx(Math.abs(r.branches.rg.I), 0, 0.001), `I_bridge=${r.branches.rg.I}`);
});

// 6. Open circuit → all I=0
test('6. Open circuit → I=0', () => {
  const r = solveCircuit({
    components: [
      makeComp('bat', 'battery', { V: 6 }, [0, 1]),
      makeComp('r1', 'resistor', { R: 10 }, [0, 1]),
      // No connections between bat and r1!
    ],
    connections: [
      conn('bat', 1, 'bat', 0),  // bat shorted to itself... 
    ]
  });
  // r1 not connected → I should be 0
  assert(approx(Math.abs(r.branches.r1?.I || 0), 0), `I_r1=${r.branches.r1?.I}`);
});

// 7. Short circuit (R=0 equivalent) → error or warning
test('7. Near-short circuit → overcurrent warning', () => {
  const r = solveCircuit({
    components: [
      makeComp('bat', 'battery', { V: 12 }, [0, 1]),
      makeComp('r1', 'resistor', { R: 0.001 }, [0, 1]),
    ],
    connections: [
      conn('bat', 1, 'r1', 1),
      conn('bat', 0, 'r1', 0),
    ]
  });
  assert(!r.error, 'error: ' + r.error);
  assert(r.warning === 'overcurrent', `expected overcurrent warning, got ${r.warning}`);
});

console.log(`\n${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
