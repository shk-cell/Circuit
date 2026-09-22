// routes/grade.js
const express  = require('express');
const router   = express.Router();
const { OpenAI } = require('openai');
const problems = require('../data/problems-build-circuit');

require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================================
// 브레드보드 그래프 빌더 + BFS 연결 판별
// ============================================================

const isRail = (p) =>
  p.startsWith('Trail+') || p.startsWith('Trail-') ||
  p.startsWith('Brail+') || p.startsWith('Brail-');

const railGroup = (p) => {
  if (p.startsWith('Trail+')) return 'Trail+';
  if (p.startsWith('Trail-')) return 'Trail-';
  if (p.startsWith('Brail+')) return 'Brail+';
  if (p.startsWith('Brail-')) return 'Brail-';
  return null;
};

/**
 * 점퍼선 + 부품 + 브레드보드 내부 연결을 모두 포함한 그래프 생성
 */
function buildGraph(wires, components) {
  const adj = {};
  const addEdge = (a, b) => {
    if (!a || !b || a === b) return;
    (adj[a] = adj[a] || new Set()).add(b);
    (adj[b] = adj[b] || new Set()).add(a);
  };

  // 1) 점퍼선
  wires.forEach(([a, b]) => addEdge(a, b));

  // 2) 브레드보드 내부: 같은 행 같은 구역(a~e 또는 f~j)은 연결
  const cols_top = ['a','b','c','d','e'];
  const cols_bot = ['f','g','h','i','j'];
  for (let row = 1; row <= 30; row++) {
    for (let i = 0; i < 4; i++) {
      addEdge(`${cols_top[i]}${row}`, `${cols_top[i+1]}${row}`);
      addEdge(`${cols_bot[i]}${row}`, `${cols_bot[i+1]}${row}`);
    }
  }

  // 3) 레일 내부: 같은 레일 그룹은 전부 연결
  for (let i = 1; i < 30; i++) {
    addEdge(`Trail+${i}`,  `Trail+${i+1}`);
    addEdge(`Trail-${i}`,  `Trail-${i+1}`);
    addEdge(`Brail+${i}`, `Brail+${i+1}`);
    addEdge(`Brail-${i}`, `Brail-${i+1}`);
  }

  // 4) 부품 내부 연결
  components.forEach(comp => {
    if (comp.type === 'resistor' || comp.type === 'led' || comp.type === 'photoresistor' || comp.type === 'buzzer') {
      addEdge(comp.pin1, comp.pin2);
    } else if (comp.type === 'button') {
      // pin1↔pin2 항상 연결, pin3↔pin4 항상 연결
      // 채점은 버튼을 눌렀을 때 기준 → 전부 연결
      addEdge(comp.pin1, comp.pin2);
      addEdge(comp.pin3, comp.pin4);
      addEdge(comp.pin1, comp.pin3);
    } else if (comp.type === 'slideswitch') {
      // 채점 기준: 스위치 ON 상태(COM ↔ ON1 연결)
      addEdge(comp.pinCOM, comp.pinON1);
    }
    // ultrasonic, servo: 각 핀은 독립 — 내부 연결 없음
  });

  return adj;
}

/**
 * BFS로 start에서 도달 가능한 모든 핀을 반환 (ALL_NAMED 필터 없음)
 */
function reachableAll(adj, startPin) {
  const visited = new Set([startPin]);
  const queue = [startPin];
  while (queue.length) {
    const cur = queue.shift();
    for (const next of (adj[cur] || [])) {
      if (!visited.has(next)) { visited.add(next); queue.push(next); }
    }
  }
  return visited;
}

/**
 * BFS로 start에서 도달 가능한 targets 중 해당하는 것들을 Set으로 반환
 *
 * 5V/3V3/GND는 여러 독립된 회로가 공유하는 공용 레일이다. LED 등은 방향성 없는
 * 그래프 edge로 모델링되어 있어서, 레일을 그냥 통과시키면 "내 저항은 5V에
 * 연결 안 됐지만 GND를 타고 옆 회로의 LED를 거꾸로 거쳐 5V에 우회 도달"하는
 * 식의 오판정이 생긴다. 그래서 레일 핀은 '도달'은 인정하되(found에 추가),
 * 그 지점을 통과해서 더 확장하지는 않는다.
 */
function reachableSet(adj, startPin, targets) {
  const targetSet = new Set(targets);
  const visited = new Set([startPin]);
  const queue = [startPin];
  const found = new Set();
  if (targetSet.has(startPin)) found.add(startPin);

  while (queue.length) {
    const cur = queue.shift();
    if (cur !== startPin && RAIL_PINS.has(cur)) continue;
    for (const next of (adj[cur] || [])) {
      if (targetSet.has(next)) found.add(next);
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return found;
}

const POWER_PINS   = ['5V', '3V3'];
const GND_PINS     = ['GND0', 'GND1', 'GND2'];
const RAIL_PINS    = new Set([...POWER_PINS, ...GND_PINS]);
const DIGITAL_PINS = Array.from({length: 14}, (_, i) => `D${i}`);
const ANALOG_PINS  = Array.from({length: 6},  (_, i) => `A${i}`);
const ALL_NAMED    = [...POWER_PINS, ...GND_PINS, ...DIGITAL_PINS, ...ANALOG_PINS];

const isPower   = (v) => POWER_PINS.includes(v);
const isGND     = (v) => GND_PINS.includes(v);
const isDigital = (v) => DIGITAL_PINS.includes(v);

/**
 * 핀 배열 중 하나라도 predicate(reachableSet)를 만족하면 true
 */
function anyPin(adj, pins, predicate) {
  return pins.some(p => predicate(reachableSet(adj, p, ALL_NAMED)));
}

// ============================================================
// POST /api/grade/:id
// ============================================================
router.post('/:id', async (req, res) => {
  try {
    const problemId = parseInt(req.params.id);
    const { wires = [], userCode = '', components = [] } = req.body;

    console.log('===== 제출된 점퍼선 =====');
    console.log(wires);
    console.log('부품 위치:', components);

    const problem = problems.find(p => p.id === problemId);
    if (!problem) return res.status(404).json({ success: false, message: '문제를 찾을 수 없습니다.' });

    if (wires.length === 0) {
      return res.json({
        success: true,
        data: { problemId, passed: false, feedback: ['연결된 점퍼선이 하나도 없습니다!'] }
      });
    }

    // ================================================================
    // 그래프 빌드
    // ================================================================
    const adj = buildGraph(wires, components);

    // ================================================================
    // GPT용 문자열 생성
    // ================================================================
    const railMap = {};
    wires.forEach(([a, b]) => {
      if (isRail(a) && [...POWER_PINS, ...GND_PINS].includes(b)) railMap[railGroup(a)] = b;
      if (isRail(b) && [...POWER_PINS, ...GND_PINS].includes(a)) railMap[railGroup(b)] = a;
    });

    const resolvePin = (p) => {
      const g = railGroup(p);
      if (g && railMap[g]) return railMap[g];
      if (isRail(p)) return `레일(${p})`;
      return p;
    };

    const wireStr = wires
      .filter(([a, b]) => !(isRail(a) && isRail(b)))
      .map(([a, b]) => [resolvePin(a), resolvePin(b)])
      .filter(([a, b]) => a !== b)
      .map(([a, b]) => `${a} — ${b}`)
      .join('\n');

    const compDesc = components.map(c => {
      let pins, pinsStr;
      if (c.type === 'ultrasonic') {
        pins = [c.pinVCC, c.pinTRIG, c.pinECHO, c.pinGND].filter(Boolean);
        pinsStr = `VCC:${c.pinVCC} TRIG:${c.pinTRIG} ECHO:${c.pinECHO} GND:${c.pinGND}`;
      } else if (c.type === 'servo') {
        pins = [c.pinVCC, c.pinGND, c.pinSIG].filter(Boolean);
        pinsStr = `VCC:${c.pinVCC} GND:${c.pinGND} SIG:${c.pinSIG}`;
      } else if (c.type === 'potentiometer') {
        pins = [c.pinVCC, c.pinSIG, c.pinGND].filter(Boolean);
        pinsStr = `VCC:${c.pinVCC} SIG:${c.pinSIG} GND:${c.pinGND}`;
      } else if (c.type === 'slideswitch') {
        pins = [c.pinON1, c.pinCOM, c.pinON2].filter(Boolean);
        pinsStr = `ON1:${c.pinON1} COM:${c.pinCOM} ON2:${c.pinON2}`;
      } else {
        pins = [c.pin1, c.pin2, c.pin3, c.pin4].filter(Boolean);
        pinsStr = c.pin3 ? `${c.pin1}/${c.pin2}/${c.pin3}/${c.pin4}` : `${c.pin1} ↔ ${c.pin2}`;
      }
      const reached = pins.map(p => {
        const r = [...reachableSet(adj, p, ALL_NAMED)];
        return r.length ? `${p}→[${r.join(',')}]` : null;
      }).filter(Boolean);
      return `${c.label ?? c.type}(${c.type}): ${pinsStr}${reached.length ? ` [연결: ${reached.join(', ')}]` : ' [전원/GND 미연결]'}`;
    }).join('\n');

    // ================================================================
    // 문제별 사전 체크 (BFS 기반)
    // ================================================================
    let preCheck = '';
    let preCheckPassed = null;

    // ── 문제 1: LED 켜기 (5V) ───────────────────────────────────────────
    if (problemId === 1) {
      const led  = components.find(c => c.type === 'led');
      const r220 = components.find(c => c.label === '220Ω' || c.type === 'resistor');

      const ledPins  = led   ? [led.pin1,  led.pin2]  : [];
      const r220Pins = r220  ? [r220.pin1, r220.pin2] : [];

      // 체크1: LED의 한 쪽이 GND에 연결되어 있어야 함
      const chk1 = anyPin(adj, ledPins, r => [...r].some(isGND));
      
      // 체크2: 220Ω 저항의 한 쪽은 5V(Power)에 연결되어야 함
      const chk2 = anyPin(adj, r220Pins, r => [...r].some(isPower));
      
      // 체크3: LED와 저항이 서로 연결되어 있는지 확인 (BFS)
      const chk3 = ledPins.some(lp => {
        const r = reachableAll(adj, lp);
        return r220Pins.some(rp => r.has(rp));
      });

      preCheck = `
[서버 사전 체크 결과 - 이 결과를 최우선으로 사용하세요]
체크1 (LED → GND):           ${chk1 ? '✅ 통과' : '❌ 실패 - LED가 GND(접지)에 연결되지 않음'}
체크2 (220Ω → 5V):           ${chk2 ? '✅ 통과' : '❌ 실패 - 220Ω 저항이 5V에 연결되지 않음'}
체크3 (LED ↔ 저항 연결):     ${chk3 ? '✅ 통과' : '❌ 실패 - LED와 저항이 서로 연결되지 않음 (같은 행에 꽂았는지 확인!)'}
최종: ${chk1&&chk2&&chk3 ? '✅ 정답' : '❌ 오답'}
`;
      preCheckPassed = chk1 && chk2 && chk3;
    }

    // ── 문제 2: LED 3개 켜기 ──────────────────────────────────────────
    if (problemId === 2) {
      const leds = components.filter(c => c.type === 'led');
      const resistors = components.filter(c => c.label === '220Ω' || c.type === 'resistor');

      let allPassed = true;
      let checkResults = [];

      for (let i = 0; i < 3; i++) {
        const led = leds[i];
        const ledPins = led ? [led.pin1, led.pin2] : [];
        
        // 1. 각 LED가 GND에 연결되어 있는지 확인
        const connectsToGND = anyPin(adj, ledPins, r => [...r].some(isGND));
        
        // 2. 각 LED가 어떤 저항과 연결되어 있는지 확인
        const connectedResistor = resistors.find(res => {
          const resPins = [res.pin1, res.pin2];
          return ledPins.some(lp => {
            const reachable = reachableAll(adj, lp);
            return resPins.some(rp => reachable.has(rp));
          });
        });

        // 3. 그 저항이 5V(Power)에 연결되어 있는지 확인
        const resistorToPower = connectedResistor ? anyPin(adj, [connectedResistor.pin1, connectedResistor.pin2], r => [...r].some(isPower)) : false;

        const ledOk = connectsToGND && resistorToPower;
        if (!ledOk) allPassed = false;
        
        checkResults.push(`LED${i+1}: ${ledOk ? '✅' : '❌'} (GND:${connectsToGND ? 'OK' : 'FAIL'}, Power:${resistorToPower ? 'OK' : 'FAIL'})`);
      }

      preCheck = `
[서버 사전 체크 결과 - 이 결과를 최우선으로 사용하세요]
${checkResults.join('\n')}
최종: ${allPassed ? '✅ 정답' : '❌ 오답 (모든 LED가 독립적인 저항을 거쳐 5V와 GND에 연결되어야 합니다)'}
`;
      preCheckPassed = allPassed;
    }

    // ── 문제 3: 푸시버튼으로 LED 켜기 ──────────────────────────────
    if (problemId === 3) {
      const btn  = components.find(c => c.type === 'button');
      const r10k = components.find(c => c.label === '10kΩ');
      const r220 = components.find(c => c.label === '220Ω');
      const led  = components.find(c => c.type === 'led');

      const btnPins  = btn  ? [btn.pin1,  btn.pin2,  btn.pin3,  btn.pin4].filter(Boolean) : [];
      const r10kPins = r10k ? [r10k.pin1, r10k.pin2] : [];
      const r220Pins = r220 ? [r220.pin1, r220.pin2] : [];
      const ledPins  = led  ? [led.pin1,  led.pin2]  : [];

      const chk1 = anyPin(adj, btnPins,  r => [...r].some(isPower)) &&
                   anyPin(adj, btnPins,  r => [...r].some(isDigital));
      const chk2 = anyPin(adj, r10kPins, r => [...r].some(isDigital)) &&
                   anyPin(adj, r10kPins, r => [...r].some(isGND));
      const chk3 = anyPin(adj, r220Pins, r => [...r].some(isDigital));
      const chk4 = anyPin(adj, ledPins,  r => [...r].some(isGND));

      preCheck = `
[서버 사전 체크 결과 - 이 결과를 최우선으로 사용하세요]
체크1 (버튼 → 5V + 디지털핀): ${chk1 ? '✅ 통과' : '❌ 실패 - 버튼이 5V와 디지털 핀에 모두 연결되지 않음'}
체크2 (10kΩ → 디지털핀 + GND): ${chk2 ? '✅ 통과' : '❌ 실패 - 10kΩ 저항이 디지털 핀과 GND 사이에 연결되지 않음'}
체크3 (220Ω → 디지털핀): ${chk3 ? '✅ 통과' : '❌ 실패 - 220Ω 저항이 디지털 핀에 연결되지 않음'}
체크4 (LED → GND): ${chk4 ? '✅ 통과' : '❌ 실패 - LED 음극이 GND에 연결되지 않음'}
최종: ${chk1&&chk2&&chk3&&chk4 ? '✅ 정답' : '❌ 오답'}
`;
      preCheckPassed = chk1 && chk2 && chk3 && chk4;
    }

    // ── 문제 4: 버튼 2개로 LED 2개 독립 제어 ───────────────────────
    if (problemId === 4) {
      const btn1 = components.find(c => c.type === 'button' && c.label === 'BTN1');
      const btn2 = components.find(c => c.type === 'button' && c.label === 'BTN2');
      const r10ks  = components.filter(c => c.label === '10kΩ');
      const r220s  = components.filter(c => c.label === '220Ω');
      const leds   = components.filter(c => c.type === 'led');

      const r10k1  = r10ks[0],  r10k2  = r10ks[1];
      const r220_1 = r220s[0],  r220_2 = r220s[1];
      const led1   = leds[0],   led2   = leds[1];

      const btnPins1  = btn1   ? [btn1.pin1,   btn1.pin2,   btn1.pin3,   btn1.pin4].filter(Boolean)  : [];
      const btnPins2  = btn2   ? [btn2.pin1,   btn2.pin2,   btn2.pin3,   btn2.pin4].filter(Boolean)  : [];
      const r10kPins1 = r10k1  ? [r10k1.pin1,  r10k1.pin2]  : [];
      const r10kPins2 = r10k2  ? [r10k2.pin1,  r10k2.pin2]  : [];
      const r220Pins1 = r220_1 ? [r220_1.pin1, r220_1.pin2] : [];
      const r220Pins2 = r220_2 ? [r220_2.pin1, r220_2.pin2] : [];
      const ledPins1  = led1   ? [led1.pin1,   led1.pin2]   : [];
      const ledPins2  = led2   ? [led2.pin1,   led2.pin2]   : [];

      // 체크1: 버튼1 → 5V + D2
      const chk1 = anyPin(adj, btnPins1,  r => [...r].some(isPower)) &&
                   anyPin(adj, btnPins1,  r => r.has('D2'));
      // 체크2: 10kΩ(1) → D2 + GND
      const chk2 = anyPin(adj, r10kPins1, r => r.has('D2')) &&
                   anyPin(adj, r10kPins1, r => [...r].some(isGND));
      // 체크3: 220Ω(1) → D12, LED1 → GND
      const chk3 = anyPin(adj, r220Pins1, r => r.has('D12')) &&
                   anyPin(adj, ledPins1,  r => [...r].some(isGND));
      // 체크4: 버튼2 → 5V + D3
      const chk4 = anyPin(adj, btnPins2,  r => [...r].some(isPower)) &&
                   anyPin(adj, btnPins2,  r => r.has('D3'));
      // 체크5: 10kΩ(2) → D3 + GND
      const chk5 = anyPin(adj, r10kPins2, r => r.has('D3')) &&
                   anyPin(adj, r10kPins2, r => [...r].some(isGND));
      // 체크6: 220Ω(2) → D13, LED2 → GND
      const chk6 = anyPin(adj, r220Pins2, r => r.has('D13')) &&
                   anyPin(adj, ledPins2,  r => [...r].some(isGND));

      preCheck = `
[서버 사전 체크 결과 - 이 결과를 최우선으로 사용하세요]
체크1 (버튼1 → 5V + D2):       ${chk1 ? '✅ 통과' : '❌ 실패 - 버튼1이 5V와 D2에 모두 연결되지 않음'}
체크2 (10kΩ(1) → D2 + GND):    ${chk2 ? '✅ 통과' : '❌ 실패 - 첫 번째 10kΩ 저항이 D2와 GND 사이에 연결되지 않음'}
체크3 (220Ω(1)→D12, LED1→GND): ${chk3 ? '✅ 통과' : '❌ 실패 - 첫 번째 220Ω이 D12에 연결되지 않거나 LED1 음극이 GND에 연결되지 않음'}
체크4 (버튼2 → 5V + D3):       ${chk4 ? '✅ 통과' : '❌ 실패 - 버튼2가 5V와 D3에 모두 연결되지 않음'}
체크5 (10kΩ(2) → D3 + GND):    ${chk5 ? '✅ 통과' : '❌ 실패 - 두 번째 10kΩ 저항이 D3와 GND 사이에 연결되지 않음'}
체크6 (220Ω(2)→D13, LED2→GND): ${chk6 ? '✅ 통과' : '❌ 실패 - 두 번째 220Ω이 D13에 연결되지 않거나 LED2 음극이 GND에 연결되지 않음'}
최종: ${chk1&&chk2&&chk3&&chk4&&chk5&&chk6 ? '✅ 정답' : '❌ 오답'}
`;
      preCheckPassed = chk1 && chk2 && chk3 && chk4 && chk5 && chk6;
    }

    // ── 문제 5: 초음파 센서로 거리에 따라 LED 켜기 ─────────────────
    if (problemId === 5) {
      const sensor = components.find(c => c.type === 'ultrasonic');
      const r220   = components.find(c => c.label === '220Ω');
      const led    = components.find(c => c.type === 'led');

      const vccPins  = sensor ? [sensor.pinVCC]  : [];
      const gndPins  = sensor ? [sensor.pinGND]  : [];
      const trigPins = sensor ? [sensor.pinTRIG] : [];
      const echoPins = sensor ? [sensor.pinECHO] : [];
      const r220Pins = r220  ? [r220.pin1, r220.pin2] : [];
      const ledPins  = led   ? [led.pin1,  led.pin2]  : [];

      // 체크1: VCC → 5V
      const chk1 = anyPin(adj, vccPins,  r => [...r].some(isPower));
      // 체크2: GND → GND
      const chk2 = anyPin(adj, gndPins,  r => [...r].some(isGND));
      // 체크3: TRIG → D9
      const chk3 = anyPin(adj, trigPins, r => r.has('D9'));
      // 체크4: ECHO → D10
      const chk4 = anyPin(adj, echoPins, r => r.has('D10'));
      // 체크5: 220Ω → D13, LED 음극 → GND
      const chk5 = anyPin(adj, r220Pins, r => r.has('D13')) &&
                   anyPin(adj, ledPins,  r => [...r].some(isGND));

      preCheck = `
[서버 사전 체크 결과 - 이 결과를 최우선으로 사용하세요]
체크1 (VCC → 5V):             ${chk1 ? '✅ 통과' : '❌ 실패 - 초음파 센서 VCC가 5V에 연결되지 않음'}
체크2 (GND → GND):            ${chk2 ? '✅ 통과' : '❌ 실패 - 초음파 센서 GND가 GND에 연결되지 않음'}
체크3 (TRIG → D9):            ${chk3 ? '✅ 통과' : '❌ 실패 - TRIG 핀이 D9에 연결되지 않음'}
체크4 (ECHO → D10):           ${chk4 ? '✅ 통과' : '❌ 실패 - ECHO 핀이 D10에 연결되지 않음'}
체크5 (220Ω→D13, LED→GND):   ${chk5 ? '✅ 통과' : '❌ 실패 - 220Ω이 D13에 연결되지 않거나 LED 음극이 GND에 연결되지 않음'}
최종: ${chk1&&chk2&&chk3&&chk4&&chk5 ? '✅ 정답' : '❌ 오답'}
`;
      preCheckPassed = chk1 && chk2 && chk3 && chk4 && chk5;
    }

    // ── 문제 6: 버튼 2개로 서보모터 방향 제어 ──────────────────────
    if (problemId === 6) {
      const servo = components.find(c => c.type === 'servo');
      const btn1  = components.find(c => c.type === 'button' && c.label === 'BTN1');
      const btn2  = components.find(c => c.type === 'button' && c.label === 'BTN2');
      const r10k1 = components.filter(c => c.label === '10kΩ')[0];
      const r10k2 = components.filter(c => c.label === '10kΩ')[1];

      const servoPins = servo ? [servo.pinVCC, servo.pinGND, servo.pinSIG] : [];
      const btn1Pins  = btn1  ? [btn1.pin1, btn1.pin2, btn1.pin3, btn1.pin4].filter(Boolean) : [];
      const btn2Pins  = btn2  ? [btn2.pin1, btn2.pin2, btn2.pin3, btn2.pin4].filter(Boolean) : [];
      const r10k1Pins = r10k1 ? [r10k1.pin1, r10k1.pin2] : [];
      const r10k2Pins = r10k2 ? [r10k2.pin1, r10k2.pin2] : [];

      // 체크1: 서보 VCC → 5V
      const chk1 = servo ? anyPin(adj, [servo.pinVCC], r => [...r].some(isPower)) : false;
      // 체크2: 서보 GND → GND
      const chk2 = servo ? anyPin(adj, [servo.pinGND], r => [...r].some(isGND))   : false;
      // 체크3: 서보 SIG → D9
      const chk3 = servo ? anyPin(adj, [servo.pinSIG], r => r.has('D9'))           : false;
      // 체크4: BTN1 → 5V+D2, 10kΩ(1) → D2+GND
      const chk4 = anyPin(adj, btn1Pins,  r => [...r].some(isPower) && r.has('D2')) &&
                   anyPin(adj, r10k1Pins, r => r.has('D2') && [...r].some(isGND));
      // 체크5: BTN2 → 5V+D3, 10kΩ(2) → D3+GND
      const chk5 = anyPin(adj, btn2Pins,  r => [...r].some(isPower) && r.has('D3')) &&
                   anyPin(adj, r10k2Pins, r => r.has('D3') && [...r].some(isGND));

      preCheck = `
[서버 사전 체크 결과 - 이 결과를 최우선으로 사용하세요]
체크1 (서보 VCC → 5V):              ${chk1 ? '✅ 통과' : '❌ 실패 - 서보 VCC가 5V에 연결되지 않음'}
체크2 (서보 GND → GND):             ${chk2 ? '✅ 통과' : '❌ 실패 - 서보 GND가 GND에 연결되지 않음'}
체크3 (서보 SIG → D9):              ${chk3 ? '✅ 통과' : '❌ 실패 - 서보 SIG가 D9에 연결되지 않음'}
체크4 (BTN1→5V+D2, 10kΩ1→D2+GND): ${chk4 ? '✅ 통과' : '❌ 실패 - 버튼1 또는 풀다운 저항1 연결 오류'}
체크5 (BTN2→5V+D3, 10kΩ2→D3+GND): ${chk5 ? '✅ 통과' : '❌ 실패 - 버튼2 또는 풀다운 저항2 연결 오류'}
최종: ${chk1&&chk2&&chk3&&chk4&&chk5 ? '✅ 정답' : '❌ 오답'}
`;
      preCheckPassed = chk1 && chk2 && chk3 && chk4 && chk5;
    }

    // ── 문제 7: 가변저항으로 서보모터 각도 조절 ────────────────────
    if (problemId === 7) {
      const pot   = components.find(c => c.type === 'potentiometer');
      const servo = components.find(c => c.type === 'servo');

      const chk1 = pot   ? anyPin(adj, [pot.pinVCC],   r => [...r].some(isPower)) : false;
      const chk2 = pot   ? anyPin(adj, [pot.pinGND],   r => [...r].some(isGND))   : false;
      const chk3 = pot   ? anyPin(adj, [pot.pinSIG],   r => r.has('A0'))           : false;
      const chk4 = servo ? anyPin(adj, [servo.pinVCC], r => [...r].some(isPower)) : false;
      const chk5 = servo ? anyPin(adj, [servo.pinGND], r => [...r].some(isGND))   : false;
      const chk6 = servo ? anyPin(adj, [servo.pinSIG], r => r.has('D9'))           : false;

      preCheck = `
[서버 사전 체크 결과 - 이 결과를 최우선으로 사용하세요]
체크1 (가변저항 VCC → 5V):  ${chk1 ? '✅ 통과' : '❌ 실패 - 가변저항 VCC가 5V에 연결되지 않음'}
체크2 (가변저항 GND → GND): ${chk2 ? '✅ 통과' : '❌ 실패 - 가변저항 GND가 GND에 연결되지 않음'}
체크3 (가변저항 SIG → A0):  ${chk3 ? '✅ 통과' : '❌ 실패 - 가변저항 SIG가 A0에 연결되지 않음'}
체크4 (서보 VCC → 5V):      ${chk4 ? '✅ 통과' : '❌ 실패 - 서보 VCC가 5V에 연결되지 않음'}
체크5 (서보 GND → GND):     ${chk5 ? '✅ 통과' : '❌ 실패 - 서보 GND가 GND에 연결되지 않음'}
체크6 (서보 SIG → D9):      ${chk6 ? '✅ 통과' : '❌ 실패 - 서보 SIG가 D9에 연결되지 않음'}
최종: ${chk1&&chk2&&chk3&&chk4&&chk5&&chk6 ? '✅ 정답' : '❌ 오답'}
`;
      preCheckPassed = chk1 && chk2 && chk3 && chk4 && chk5 && chk6;
    }

    // ── 문제 8: 슬라이드 스위치로 LED 켜고 끄기 ────────────────────
    if (problemId === 8) {
      const sw   = components.find(c => c.type === 'slideswitch');
      const r10k = components.find(c => c.label === '10kΩ');
      const r220 = components.find(c => c.label === '220Ω');
      const led  = components.find(c => c.type === 'led');

      const on1Pins  = sw   ? [sw.pinON1]             : [];
      const comPins  = sw   ? [sw.pinCOM]              : [];
      const on2Pins  = sw   ? [sw.pinON2]              : [];
      const r10kPins = r10k ? [r10k.pin1, r10k.pin2]  : [];
      const r220Pins = r220 ? [r220.pin1, r220.pin2]  : [];
      const ledPins  = led  ? [led.pin1,  led.pin2]   : [];

      // 체크1: COM → D2
      const chk1 = anyPin(adj, comPins,  r => r.has('D2'));
      // 체크2: ON2 → 5V
      const chk2 = anyPin(adj, on2Pins,  r => [...r].some(isPower));
      // 체크3: ON1 → 10kΩ → GND (reachableAll로 브레드보드 핀도 탐색)
      const chk3 = on1Pins.some(p => {
        const r = reachableAll(adj, p);
        return r10kPins.some(rp => r.has(rp));
      }) && anyPin(adj, r10kPins, r => [...r].some(isGND));
      // 체크4: 220Ω → D13
      const chk4 = anyPin(adj, r220Pins, r => r.has('D13'));
      // 체크5: LED 음극 → GND
      const chk5 = anyPin(adj, ledPins,  r => [...r].some(isGND));

      preCheck = `
[서버 사전 체크 결과 - 이 결과를 최우선으로 사용하세요]
체크1 (COM → D2):              ${chk1 ? '✅ 통과' : '❌ 실패 - COM(가운데)이 D2에 연결되지 않음'}
체크2 (ON2 → 5V):              ${chk2 ? '✅ 통과' : '❌ 실패 - ON2(오른쪽)이 5V에 연결되지 않음'}
체크3 (ON1 → 10kΩ → GND):     ${chk3 ? '✅ 통과' : '❌ 실패 - ON1(왼쪽)이 10kΩ을 거쳐 GND에 연결되지 않음'}
체크4 (220Ω → D13):            ${chk4 ? '✅ 통과' : '❌ 실패 - 220Ω 저항이 D13에 연결되지 않음'}
체크5 (LED 음극 → GND):        ${chk5 ? '✅ 통과' : '❌ 실패 - LED 음극이 GND에 연결되지 않음'}
최종: ${chk1&&chk2&&chk3&&chk4&&chk5 ? '✅ 정답' : '❌ 오답'}
`;
      preCheckPassed = chk1 && chk2 && chk3 && chk4 && chk5;
    }

    // ── 문제 9: 조도 센서로 어두워지면 켜지는 가로등 ─────────────────
    if (problemId === 9) {
      const cds  = components.find(c => c.type === 'photoresistor');
      const r10k = components.find(c => c.label === '10kΩ');
      const r220 = components.find(c => c.label === '220Ω');
      const led  = components.find(c => c.type === 'led');

      const cdsPins  = cds  ? [cds.pin1,  cds.pin2]  : [];
      const r10kPins = r10k ? [r10k.pin1, r10k.pin2] : [];
      const r220Pins = r220 ? [r220.pin1, r220.pin2] : [];
      const ledPins  = led  ? [led.pin1,  led.pin2]  : [];

      // 체크1: 조도센서 한쪽은 5V
      const chk1 = anyPin(adj, cdsPins, r => [...r].some(isPower));
      // 체크2: 조도센서 반대쪽은 A0 및 10kΩ 저항
      const chk2 = cdsPins.some(p => {
        const r = reachableAll(adj, p);
        return r.has('A0') && r10kPins.some(rp => r.has(rp));
      });
      // 체크3: 10kΩ 저항의 다른 쪽은 GND
      const chk3 = anyPin(adj, r10kPins, r => [...r].some(isGND));
      // 체크4: LED가 D13에 연결됨 (220Ω 거쳐서)
      const chk4 = anyPin(adj, r220Pins, r => r.has('D13')) && 
                   r220Pins.some(p => {
                     const r = reachableAll(adj, p);
                     return ledPins.some(lp => r.has(lp));
                   });
      // 체크5: LED 음극이 GND에 연결됨
      const chk5 = anyPin(adj, ledPins, r => [...r].some(isGND));

      preCheck = `
[서버 사전 체크 결과 - 이 결과를 최우선으로 사용하세요]
체크1 (조도센서 → 5V):         ${chk1 ? '✅ 통과' : '❌ 실패 - 조도 센서의 한쪽 끝이 5V에 연결되지 않음'}
체크2 (조도센서 → A0 & 10kΩ):  ${chk2 ? '✅ 통과' : '❌ 실패 - 조도 센서가 A0 핀 및 10kΩ 저항과 동시에 연결되지 않음'}
체크3 (10kΩ → GND):           ${chk3 ? '✅ 통과' : '❌ 실패 - 10kΩ 풀다운 저항이 GND에 연결되지 않음'}
체크4 (LED → D13):            ${chk4 ? '✅ 통과' : '❌ 실패 - LED가 220Ω 저항을 통해 D13에 연결되지 않음'}
체크5 (LED 음극 → GND):       ${chk5 ? '✅ 통과' : '❌ 실패 - LED의 음극(GND쪽)이 연결되지 않음'}
최종: ${chk1&&chk2&&chk3&&chk4&&chk5 ? '✅ 정답' : '❌ 오답'}
`;
      preCheckPassed = chk1 && chk2 && chk3 && chk4 && chk5;
    }

    // ── 문제 10: 초음파 센서와 부저를 이용한 후방 감지기 ───────────────
    if (problemId === 10) {
      const sensor = components.find(c => c.type === 'ultrasonic');
      const buzzer = components.find(c => c.type === 'buzzer');

      const vccPins  = sensor ? [sensor.pinVCC]  : [];
      const gndPins  = sensor ? [sensor.pinGND]  : [];
      const trigPins = sensor ? [sensor.pinTRIG] : [];
      const echoPins = sensor ? [sensor.pinECHO] : [];
      const buzPins  = buzzer ? [buzzer.pin1, buzzer.pin2] : [];

      // 체크1: 초음파 센서 전원 (VCC->5V, GND->GND)
      const chk1 = anyPin(adj, vccPins, r => [...r].some(isPower)) &&
                   anyPin(adj, gndPins, r => [...r].some(isGND));
      // 체크2: 초음파 센서 신호 (TRIG->D9, ECHO->D10)
      const chk2 = anyPin(adj, trigPins, r => r.has('D9')) &&
                   anyPin(adj, echoPins, r => r.has('D10'));
      // 체크3: 부저 (+) 단자가 D8에 연결됨
      const chk3 = anyPin(adj, [buzzer?.pin1], r => r.has('D8'));
      // 체크4: 부저 (-) 단자가 GND에 연결됨
      const chk4 = anyPin(adj, [buzzer?.pin2], r => [...r].some(isGND));

      preCheck = `
[서버 사전 체크 결과 - 이 결과를 최우선으로 사용하세요]
체크1 (센서 전원):   ${chk1 ? '✅ 통과' : '❌ 실패 - 초음파 센서의 VCC 또는 GND 연결을 확인하세요'}
체크2 (센서 신호):   ${chk2 ? '✅ 통과' : '❌ 실패 - TRIG는 D9, ECHO는 D10에 연결해야 합니다'}
체크3 (부저 + 연결): ${chk3 ? '✅ 통과' : '❌ 실패 - 부저의 (+) 단자를 D8에 연결하세요'}
체크4 (부저 - 연결): ${chk4 ? '✅ 통과' : '❌ 실패 - 부저의 (-) 단자를 GND에 연결하세요'}
최종: ${chk1&&chk2&&chk3&&chk4 ? '✅ 정답' : '❌ 오답'}
`;
      preCheckPassed = chk1 && chk2 && chk3 && chk4;
    }
    // ================================================================
    const prompt = `너는 아두이노 회로 교육 채점 도우미야.

[푸시버튼 내부 구조]
- 푸시버튼은 4개 핀(pin1/pin2/pin3/pin4)을 가짐
- pin1과 pin2는 버튼 내부에서 항상 연결됨 (안 눌러도)
- pin3과 pin4는 버튼 내부에서 항상 연결됨 (안 눌러도)
- 버튼을 누르면 pin1/pin2/pin3/pin4 전부 연결됨
- 따라서 5V가 pin4에 연결되면 pin3에도 5V가 연결된 것임
- 대각선(pin1↔pin4, pin2↔pin3) 두 핀을 사용해도 동작함

[브레드보드 규칙]
- 같은 행(row)의 a~e 핀은 내부적으로 연결됨 (예: a5=b5=c5=d5=e5)
- 같은 행(row)의 f~j 핀도 내부적으로 연결됨
- a~e 구역과 f~j 구역은 서로 연결되지 않음 (가운데 홈으로 분리)
- 부품 다리가 꽂힌 핀은 같은 행 같은 구역의 모든 핀과 연결됨

[문제]
${problem.description}

[부품 위치 및 전기적 연결]
${compDesc}

[학생이 연결한 점퍼선]
${wireStr}

${preCheck}
${preCheck ? '⚠️ 위 서버 사전 체크 결과가 있습니다. isCorrect는 반드시 최종 줄의 ✅/❌ 판정을 그대로 따르세요. 임의로 변경하지 마세요.' : ''}
위 회로가 문제의 목표를 달성하는지 판단하고, 학생에게 한국어로 피드백 1~2문장을 작성해줘.
- 정답이면: 칭찬하고 전류 경로를 간단히 설명
- 오답이면: 어느 연결이 빠졌거나 잘못됐는지 구체적으로 안내

출력형식(JSON):
{
  "isCorrect": true 또는 false,
  "feedback": "한국어 피드백"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log('GPT 채점 결과:', result);

    // 서버 사전 체크(BFS 기반, 결정론적)가 존재하는 문제는 그 결과를 최종 판정으로 강제한다.
    // GPT의 isCorrect는 preCheck 지시를 무시/오독할 수 있어 판정에 신뢰할 수 없고, feedback 문구 생성에만 사용한다.
    const passed = preCheckPassed !== null ? preCheckPassed : result.isCorrect;
    if (preCheckPassed !== null && preCheckPassed !== result.isCorrect) {
      console.warn(`[grade] GPT 판정(${result.isCorrect})이 서버 사전 체크(${preCheckPassed})와 불일치 — 사전 체크 결과를 사용함`);
    }

    res.json({
      success: true,
      data: { problemId, passed, feedback: [result.feedback] }
    });

  } catch (error) {
    console.error('채점 에러:', error);
    res.status(500).json({ success: false, message: '채점 실패. 다시 시도해주세요.' });
  }
});

module.exports = router;