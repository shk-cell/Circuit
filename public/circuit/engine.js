export const engine = (() => {
  // ============================================================
  // 상수
  // ============================================================
  const HOLE      = 14;
  const HOLE_R    = 3;
  const BB_PAD    = 18;
  const BB_X      = 260;
  const BB_Y      = 60;
  const ARD_X     = 20;
  const ARD_Y     = 60;
  const ARD_W     = 200;
  const ARD_H     = 530;
  const COL_NAMES = ['a','b','c','d','e','f','g','h','i','j'];

  // ============================================================
  // 상태
  // ============================================================
  const state = {
    PINS: {},
    wires: [],
    startPin: null,
    selectedWire: -1,
    wireColor: '#ff4444',

    // view transform
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    MIN_SCALE: 0.3,
    MAX_SCALE: 10.0,

    // mouse
    mouseWorldX: 0,
    mouseWorldY: 0,
    mouseScreenX: 0,
    mouseScreenY: 0,


    // problems
    PROBLEMS: [],
    currentProb: 0,

    // ✅ 부품 목록 (pin이 동적으로 바뀌므로 state 안에 위치)
    components: [
      { type: 'resistor', label: '220Ω', pin1: 'e10', pin2: 'e14' },
      { type: 'led',      label: 'LED',  pin1: 'a10', pin2: 'a9'  },
    ],

    // ✅ 드래그 중인 부품 정보
    draggingComp: null,  // { index, snapPin1, snapPin2 } — 드래그 중 스냅 미리보기

    // ✅ 호버 중인 부품 인덱스
    hoveredComp: -1,

    // ✅ 푸시버튼 상태
    buttonPressed: false,
  };

  // ============================================================
  // 현재 문제 ID
  // ============================================================
  function getCurrentProblemId() {
    return state.PROBLEMS?.[state.currentProb]?.id;
  }

  function getActiveComponents() {
    return state.components;
  }

  // ============================================================
  // 좌표 변환
  // ============================================================
  function toWorld(sx, sy) {
    return { x: (sx - state.offsetX) / state.scale, y: (sy - state.offsetY) / state.scale };
  }
  function toScreen(wx, wy) {
    return { x: wx * state.scale + state.offsetX, y: wy * state.scale + state.offsetY };
  }

  // ============================================================
  // 핀 빌드
  // ============================================================
  function buildPins() {
    const PINS = {};
    const railTopY = BB_Y + BB_PAD;
    const mainTopY = railTopY + 36;
    const gapY     = mainTopY + 5 * HOLE + 8;
    const railBotY = gapY + 5 * HOLE + 10;

    for (let i = 1; i <= 30; i++) {
      const x = BB_X + BB_PAD + (i - 1) * HOLE;
      PINS[`Trail+${i}`]  = { x, y: railTopY,      label: `+${i}`, color: '#ff4444', group: 'Trail+' };
      PINS[`Trail-${i}`]  = { x, y: railTopY + 12,  label: `-${i}`, color: '#4466ff', group: 'Trail-' };
      PINS[`Brail+${i}`] = { x, y: railBotY,       label: `+${i}`, color: '#ff4444', group: 'Trail+' };
      PINS[`Brail-${i}`] = { x, y: railBotY + 12,  label: `-${i}`, color: '#4466ff', group: 'Trail-' };
    }

    for (let row = 1; row <= 30; row++) {
      const x = BB_X + BB_PAD + (row - 1) * HOLE;
      for (let ci = 0; ci < 5; ci++) {
        PINS[`${COL_NAMES[ci]}${row}`]   = { x, y: mainTopY + ci * HOLE, label: `${COL_NAMES[ci]}${row}`,   color: '#b8a870', group: 'main' };
        PINS[`${COL_NAMES[5+ci]}${row}`] = { x, y: gapY     + ci * HOLE, label: `${COL_NAMES[5+ci]}${row}`, color: '#b8a870', group: 'main' };
      }
    }

    const ax = ARD_X + ARD_W - 14;
    let ay = ARD_Y + 50;
    const step = 18;
    for (let d = 0; d <= 13; d++) PINS[`D${d}`]  = { x: ax, y: ay + d * step, label: `D${d}`,  color: '#4488ff', group: 'digital' };
    ay += 14 * step + 10;
    for (let g = 0; g < 3; g++)  PINS[`GND${g}`] = { x: ax, y: ay + g * step, label: 'GND',    color: '#888',    group: 'gnd'     };
    ay += 3 * step + 10;
    PINS['5V']  = { x: ax, y: ay,        label: '5V',   color: '#ff4444', group: 'power' }; ay += step;
    PINS['3V3'] = { x: ax, y: ay,        label: '3.3V', color: '#ff4444', group: 'power' }; ay += step + 10;
    for (let a = 0; a <= 5; a++) PINS[`A${a}`] = { x: ax, y: ay + a * step, label: `A${a}`, color: '#ff9900', group: 'analog' };

    state.PINS = PINS;
  }

  function calcWorldSize() {
    const bbEndX   = BB_X + BB_PAD * 2 + 29 * HOLE + 40;
    const railBotY = BB_Y + BB_PAD + 36 + 5 * HOLE + 8 + 5 * HOLE + 10 + 24 + 30;
    return { w: bbEndX, h: Math.max(railBotY, ARD_Y + ARD_H + 40) };
  }

  // ============================================================
  // 브레드보드 내부 연결
  // ============================================================
  function getBBEdges() {
    const e = [];
    for (let i = 1; i < 30; i++) {
      e.push([`Trail+${i}`,  `Trail+${i+1}`]);
      e.push([`Trail-${i}`,  `Trail-${i+1}`]);
      e.push([`Brail+${i}`, `Brail+${i+1}`]);
      e.push([`Brail-${i}`, `Brail-${i+1}`]);
    }
    const t = ['a','b','c','d','e'];
    const b = ['f','g','h','i','j'];
    for (let r = 1; r <= 30; r++) {
      for (let ci = 0; ci < 4; ci++) {
        e.push([`${t[ci]}${r}`, `${t[ci+1]}${r}`]);
        e.push([`${b[ci]}${r}`, `${b[ci+1]}${r}`]);
      }
    }
    return e;
  }

  function buildGraph(includeResistor = true) {
    const g = {};
    const add = (a, b) => {
      (g[a] = g[a] || []).push(b);
      (g[b] = g[b] || []).push(a);
    };
    state.wires.forEach(({ from, to }) => add(from, to));
    getBBEdges().forEach(([a, b]) => add(a, b));
    state.components.forEach((comp) => {
      if (comp.type === 'resistor' && !includeResistor) return;
      add(comp.pin1, comp.pin2);
    });
    return g;
  }

  function connected(graph, a, b) {
    if (a === b) return true;
    const vis = new Set([a]);
    const q = [a];
    while (q.length) {
      const n = q.shift();
      for (const nb of graph[n] || []) {
        if (nb === b) return true;
        if (!vis.has(nb)) { vis.add(nb); q.push(nb); }
      }
    }
    return false;
  }


  // ============================================================
  // 부품 히트테스트 & 스냅
  // ============================================================

  /**
   * 월드 좌표 (wx, wy)에 부품 바디가 있는지 확인
   * @returns { index, comp } | null
   */
  function getCompAt(wx, wy) {
    for (let i = 0; i < state.components.length; i++) {
      const comp = state.components[i];

      // ── 초음파 센서: pin1/pin2 없이 pinVCC/pinGND 사용 ──
      if (comp.type === 'ultrasonic') {
        const pV = state.PINS[comp.pinVCC];
        const pG = state.PINS[comp.pinGND];
        if (!pV || !pG) continue;
        const cx  = (pV.x + pG.x) / 2;
        const bw  = (pG.x - pV.x) + 28;
        const bh  = 44;
        const by  = pV.y - 16 - bh;  // renderer의 by와 동일
        if (wx >= cx - bw / 2 - 6 && wx <= cx + bw / 2 + 6 &&
            wy >= by - 6           && wy <= by + bh + 6) {
          return { index: i, comp };
        }
        continue;
      }

      // ── 서보모터: pinVCC/pinGND/pinSIG 사용 ──
      if (comp.type === 'servo') {
        const pV = state.PINS[comp.pinVCC];
        const pG = state.PINS[comp.pinGND];
        if (!pV || !pG) continue;
        const cx = (pV.x + pG.x) / 2;
        const bw = 64, bh = 52;
        const by = pV.y - 20 - bh;
        if (wx >= cx - bw / 2 - 12 && wx <= cx + bw / 2 + 12 &&
            wy >= by - 35           && wy <= pV.y + 5) {
          return { index: i, comp };
        }
        continue;
      }

      if (comp.type === 'potentiometer') {
        const pS = state.PINS[comp.pinSIG];
        if (!pS) continue;
        const bw = 36, bh = 36;
        const bx = pS.x - bw / 2;
        const by = pS.y - 14 - bh;
        if (wx >= bx - 8 && wx <= bx + bw + 8 &&
            wy >= by - 20 && wy <= pS.y + 5) {
          return { index: i, comp };
        }
        continue;
      }

      // ── 슬라이드 스위치 ──
      if (comp.type === 'slideswitch') {
        const pN1 = state.PINS[comp.pinON1];
        const pN2 = state.PINS[comp.pinON2];
        if (!pN1 || !pN2) continue;
        const bw = (pN2.x - pN1.x) + 20;
        const bh = 30;
        const bx = pN1.x - 10;
        const by = pN1.y - 12 - bh;
        if (wx >= bx - 6      && wx <= bx + bw + 6 &&
            wy >= by - 6       && wy <= by + bh + 12) {
          return { index: i, comp };
        }
        continue;
      }

      const p1 = state.PINS[comp.pin1];
      const p2 = state.PINS[comp.pin2];
      if (!p1 || !p2) continue;

      const minX = Math.min(p1.x, p2.x) - 10;
      const maxX = Math.max(p1.x, p2.x) + 10;

      if (comp.type === 'resistor' || comp.type === 'photoresistor') {
        const bodyBot = p1.y - 20;
        const bodyTop = p1.y - 66;
        if (wx >= minX && wx <= maxX && wy >= bodyTop && wy <= bodyBot) {
          return { index: i, comp };
        }
      } else if (comp.type === 'led') {
        const baseY   = Math.min(p1.y, p2.y);
        const bodyBot = baseY - 15;
        const bodyTop = baseY - 55;
        if (wx >= minX && wx <= maxX && wy >= bodyTop && wy <= bodyBot) {
          return { index: i, comp };
        }
      } else if (comp.type === 'buzzer') {
        const baseY   = (p1.y + p2.y) / 2;
        const bodyBot = baseY + 15;
        const bodyTop = baseY - 25;
        if (wx >= minX && wx <= maxX && wy >= bodyTop && wy <= bodyBot) {
          return { index: i, comp };
        }
      } else if (comp.type === 'button') {
        const p3 = state.PINS[comp.pin3];
        const p4 = state.PINS[comp.pin4];
        if (!p3 || !p4) continue;
        const cx = (p1.x + p2.x + p3.x + p4.x) / 4;
        const cy = (p1.y + p2.y + p3.y + p4.y) / 4;
        if (Math.abs(wx - cx) < 25 && Math.abs(wy - cy) < 25) {
          return { index: i, comp };
        }
      }
    }
    return null;
  }

  /**
   * 드래그 중 마우스 (wx, wy) 기준으로 스냅될 pin1/pin2 계산
   * - pin1 기준으로 마우스와 가장 가까운 main 핀에 스냅
   * - pin2는 원래 행(row)/열(col) 간격을 그대로 유지
   * @returns { pin1, pin2 } | null
   */
  function snapComp(comp, wx, wy) {
    // ── 초음파 센서: 모든 열 허용, 마우스에 가장 가까운 main 핀 기준 ──
    if (comp.type === 'ultrasonic') {
      let bestCol = 'e', bestRow = 1, bestDist = Infinity;
      const COL_LIST = ['a','b','c','d','e','f','g','h','i','j'];
      for (const [id, pin] of Object.entries(state.PINS)) {
        if (pin.group !== 'main') continue;
        const d = Math.hypot(pin.x - wx, pin.y - wy);
        if (d < bestDist) {
          bestDist = d;
          bestCol  = id.match(/^[a-j]/)?.[0];
          bestRow  = parseInt(id.match(/\d+/)?.[0]);
        }
      }
      const gndRow = bestRow + 6;
      if (gndRow > 30) return null;
      return {
        pinVCC:  `${bestCol}${bestRow}`,
        pinTRIG: `${bestCol}${bestRow + 2}`,
        pinECHO: `${bestCol}${bestRow + 4}`,
        pinGND:  `${bestCol}${bestRow + 6}`,
      };
    }

    // ── 서보모터: 모든 열 허용, VCC/GND/SIG 연속 3행 ──
    if (comp.type === 'servo') {
      let bestCol = 'f', bestRow = 1, bestDist = Infinity;
      for (const [id, pin] of Object.entries(state.PINS)) {
        if (pin.group !== 'main') continue;
        const d = Math.hypot(pin.x - wx, pin.y - wy);
        if (d < bestDist) {
          bestDist = d;
          bestCol  = id.match(/^[a-j]/)?.[0];
          bestRow  = parseInt(id.match(/\d+/)?.[0]);
        }
      }
      if (bestRow + 2 > 30) return null;
      return {
        pinVCC: `${bestCol}${bestRow}`,
        pinGND: `${bestCol}${bestRow + 1}`,
        pinSIG: `${bestCol}${bestRow + 2}`,
      };
    }

    // ── 가변저항: VCC/SIG/GND 연속 3행 ──
    if (comp.type === 'potentiometer') {
      let bestCol = 'e', bestRow = 1, bestDist = Infinity;
      for (const [id, pin] of Object.entries(state.PINS)) {
        if (pin.group !== 'main') continue;
        const d = Math.hypot(pin.x - wx, pin.y - wy);
        if (d < bestDist) {
          bestDist = d;
          bestCol  = id.match(/^[a-j]/)?.[0];
          bestRow  = parseInt(id.match(/\d+/)?.[0]);
        }
      }
      if (bestRow + 2 > 30) return null;
      return {
        pinVCC: `${bestCol}${bestRow}`,
        pinSIG: `${bestCol}${bestRow + 1}`,
        pinGND: `${bestCol}${bestRow + 2}`,
      };
    }

    // ── 슬라이드 스위치: ON1/COM/ON2 연속 3행 (왼/가운데/오른) ──
    if (comp.type === 'slideswitch') {
    let bestCol = 'e', bestRow = 1, bestDist = Infinity;
    for (const [id, pin] of Object.entries(state.PINS)) {
      if (pin.group !== 'main') continue;
      const d = Math.hypot(pin.x - wx, pin.y - wy);
      if (d < bestDist) {
        bestDist = d;
        bestCol  = id.match(/^[a-j]/)?.[0];
        bestRow  = parseInt(id.match(/\d+/)?.[0]);
      }
    }
    if (bestRow + 2 > 30) return null;
    return {
      pinON1: `${bestCol}${bestRow}`,
      pinCOM: `${bestCol}${bestRow + 1}`,
      pinON2: `${bestCol}${bestRow + 2}`,
    };
    }

    // ── 부저: 고정 2칸 간격 (Row + 2) ──
    if (comp.type === 'buzzer') {
    let bestCol = 'a', bestRow = 1, bestDist = Infinity;
    for (const [id, pin] of Object.entries(state.PINS)) {
      if (pin.group !== 'main') continue;
      const d = Math.hypot(pin.x - wx, pin.y - wy);
      if (d < bestDist) {
        bestDist = d;
        bestCol = id.match(/^[a-j]/)?.[0];
        bestRow = parseInt(id.match(/\d+/)?.[0]);
      }
    }
    if (bestRow + 2 > 30) return null;
    return { pin1: `${bestCol}${bestRow}`, pin2: `${bestCol}${bestRow + 2}` };
    }

    const parsePin = (id) => ({      col: id.match(/^[a-j]+/)?.[0],
      row: parseInt(id.match(/\d+/)?.[0]),
    });

    const parsed1  = parsePin(comp.pin1);
    const parsed2  = parsePin(comp.pin2);
    const COL_LIST = ['a','b','c','d','e','f','g','h','i','j'];
    const colGap   = COL_LIST.indexOf(parsed2.col) - COL_LIST.indexOf(parsed1.col);
    const rowGap   = parsed2.row - parsed1.row;
    const isButton = !!(comp.pin3 && comp.pin4);

    // 마우스 기준 가장 가까운 핀 탐색 (버튼은 e열만)
    let bestCol = parsed1.col, bestRow = parsed1.row, bestDist = Infinity;
    for (const [id, pin] of Object.entries(state.PINS)) {
      if (pin.group !== 'main') continue;
      if (isButton && parsePin(id).col !== 'e') continue;
      const d = Math.hypot(pin.x - wx, pin.y - wy);
      if (d < bestDist) {
        bestDist = d;
        const p = parsePin(id);
        bestCol  = p.col;
        bestRow  = p.row;
      }
    }

    const newColIdx1 = COL_LIST.indexOf(bestCol);
    const newColIdx2 = newColIdx1 + colGap;
    const newRow2    = bestRow + rowGap;

    if (newColIdx2 < 0 || newColIdx2 >= COL_LIST.length) return null;
    if (newRow2 < 1 || newRow2 > 30) return null;

    const newPin1 = `${bestCol}${bestRow}`;
    const newPin2 = `${COL_LIST[newColIdx2]}${newRow2}`;
    if (!state.PINS[newPin1] || !state.PINS[newPin2]) return null;

    // 버튼: pin3/pin4는 pin1/pin2와 같은 row, f열 고정
    if (isButton) {
      const newPin3 = `f${bestRow}`;
      const newPin4 = `f${bestRow + rowGap}`;
      if (!state.PINS[newPin3] || !state.PINS[newPin4]) return null;
      return { pin1: newPin1, pin2: newPin2, pin3: newPin3, pin4: newPin4 };
    }

    return { pin1: newPin1, pin2: newPin2 };
  }

  // ============================================================
  function wireControlPoints(x1, y1, x2, y2) {
    const mx = (x1 + x2) / 2;
    return { cx1: mx, cy1: y1, cx2: mx, cy2: y2 };
  }

  function distToWire(wx, wy, x1, y1, x2, y2) {
    const { cx1, cy1, cx2, cy2 } = wireControlPoints(x1, y1, x2, y2);
    const N = Math.max(60, Math.round(Math.hypot(x2 - x1, y2 - y1) * 2));
    let minD = Infinity;
    for (let i = 0; i <= N; i++) {
      const t = i / N, t1 = 1 - t;
      const bx = t1**3*x1 + 3*t1**2*t*cx1 + 3*t1*t**2*cx2 + t**3*x2;
      const by = t1**3*y1 + 3*t1**2*t*cy1 + 3*t1*t**2*cy2 + t**3*y2;
      const d = Math.hypot(bx - wx, by - wy);
      if (d < minD) minD = d;
    }
    return minD;
  }

  function getWireAt(wx, wy) {
    const threshold = 8 / state.scale;
    for (let i = state.wires.length - 1; i >= 0; i--) {
      const w = state.wires[i];
      const fp = state.PINS[w.from], tp = state.PINS[w.to];
      if (!fp || !tp) continue;
      const minX = Math.min(fp.x, tp.x) - threshold * 2;
      const maxX = Math.max(fp.x, tp.x) + threshold * 2;
      const minY = Math.min(fp.y, tp.y) - threshold * 2;
      const maxY = Math.max(fp.y, tp.y) + threshold * 2;
      if (wx < minX || wx > maxX || wy < minY || wy > maxY) continue;
      if (distToWire(wx, wy, fp.x, fp.y, tp.x, tp.y) < threshold) return i;
    }
    return -1;
  }

  function getPinAt(wx, wy) {
    let best = null, bestD = Infinity;
    for (const [id, p] of Object.entries(state.PINS)) {
      const d = Math.hypot(p.x - wx, p.y - wy);
      const thr = (p.group === 'main' || String(p.group).includes('Trail') || String(p.group).includes('Brail')) ? 7 : 10;
      if (d < thr && d < bestD) { best = id; bestD = d; }
    }
    return best;
  }

  // ============================================================
  // 줌 / 패닝
  // ============================================================
  function clampOffset(viewW, viewH) {
    const { w, h } = calcWorldSize();
    const margin = 80;
    state.offsetX = Math.min(viewW - margin, Math.max(-(w * state.scale - margin), state.offsetX));
    state.offsetY = Math.min(viewH - margin, Math.max(-(h * state.scale - margin), state.offsetY));
  }

  function zoomBy(delta, viewW, viewH, cx, cy) {
    const newScale = Math.max(state.MIN_SCALE, Math.min(state.MAX_SCALE, state.scale + delta));
    const factor = newScale / state.scale;
    state.offsetX = cx - factor * (cx - state.offsetX);
    state.offsetY = cy - factor * (cy - state.offsetY);
    state.scale = newScale;
    clampOffset(viewW, viewH);
  }

  function resetZoom(viewW, viewH) {
    const { w, h } = calcWorldSize();
    state.scale = Math.min(viewW / w, viewH / h) * 0.92;
    state.offsetX = (viewW - w * state.scale) / 2;
    state.offsetY = (viewH - h * state.scale) / 2;
  }

  // ============================================================
  // 공개 API
  // ============================================================
  function init() { buildPins(); }

  return {
    HOLE, HOLE_R, BB_PAD, BB_X, BB_Y, ARD_X, ARD_Y, ARD_W, ARD_H, COL_NAMES,
    state,

    getCurrentProblemId,
    getActiveComponents,

    init,
    toWorld,
    toScreen,

    calcWorldSize,
    clampOffset,
    zoomBy,
    resetZoom,

    buildGraph,
    connected,

    getCompAt,
    snapComp,

    getWireAt,
    getPinAt,
    wireControlPoints,
  };
})();