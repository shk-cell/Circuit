// lib/circuit-check.js
// ============================================================
// 핀 단위(넷 기반) 회로 채점기
//
// 이전 방식의 문제:
//   부품(LED, 저항 등) 내부를 "전선"처럼 그래프에 넣고 BFS를 돌렸기 때문에
//   LED의 +/− 어느 쪽이든, 부품 어느 다리든 "어딘가에 닿기만 하면" 통과했다.
//
// 새 방식:
//   1) 점퍼선 + 브레드보드 내부 줄 + 전원 레일 + (스위치 상태에 따른) 스위치 접점만으로
//      "넷(전기적으로 같은 점)"을 만든다. 저항/LED/센서 내부는 절대 통과하지 않는다.
//   2) 각 부품의 "특정 다리"가 "특정 넷(5V, GND, D13 …)"에 있는지 정확히 검사한다.
//   3) 합선(5V↔GND), 부품 바이패스(양쪽 다리가 같은 넷), 버튼/스위치 동작을 상태별로 검사한다.
// ============================================================

const TOP = ['a', 'b', 'c', 'd', 'e'];
const BOT = ['f', 'g', 'h', 'i', 'j'];

// Arduino 핀 → "종류(class)". GND0/1/2는 모두 같은 GND.
function classOf(pin) {
  if (pin === '5V' || pin === '3V3') return pin;
  if (/^GND\d$/.test(pin)) return 'GND';
  if (/^[DA]\d+$/.test(pin)) return pin;
  return null;
}

// 브레드보드 구멍 → 같은 금속 줄(strip) 키
function stripOf(pin) {
  let m = /^([a-j])(\d+)$/.exec(pin);
  if (m) return (TOP.includes(m[1]) ? 'T' : 'B') + m[2];
  m = /^(Trail\+|Trail-|Brail\+|Brail-)\d+$/.exec(pin);
  if (m) return m[1];
  return pin;
}

const LABEL = { '5V': '5V', '3V3': '3.3V', GND: 'GND' };
const nameOf = (cls) => LABEL[cls] || cls;

/**
 * 넷 계산기
 * @param wires       [[a,b], ...]
 * @param extraEdges  스위치/버튼 내부 접점 등 [[a,b], ...]
 */
function makeCircuit(wires, extraEdges = []) {
  const parent = {};
  const find = (x) => {
    if (parent[x] === undefined) parent[x] = x;
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  const union = (a, b) => {
    if (!a || !b) return;
    const ra = find(stripOf(a)), rb = find(stripOf(b));
    if (ra !== rb) parent[ra] = rb;
  };
  // 아두이노 보드의 GND 핀들은 내부에서 모두 연결되어 있음
  union('GND0', 'GND1');
  union('GND1', 'GND2');
  wires.forEach(([a, b]) => union(a, b));
  extraEdges.forEach(([a, b]) => union(a, b));

  // 넷별로 포함된 Arduino 핀 종류
  const netClasses = {};
  const named = ['5V', '3V3', 'GND0', 'GND1', 'GND2',
    ...Array.from({ length: 14 }, (_, i) => `D${i}`),
    ...Array.from({ length: 6 }, (_, i) => `A${i}`)];
  named.forEach((p) => {
    const r = find(stripOf(p));
    (netClasses[r] = netClasses[r] || new Set()).add(classOf(p));
  });

  const net = (pin) => find(stripOf(pin));
  const classes = (pin) => (pin ? netClasses[net(pin)] || new Set() : new Set());
  return {
    net,
    classes,
    has: (pin, cls) => !!pin && classes(pin).has(cls),
    same: (a, b) => !!a && !!b && net(a) === net(b),
    // 다리가 현재 어디에 연결되어 있는지 사람이 읽을 수 있는 문자열
    where: (pin) => {
      const c = [...classes(pin)];
      return c.length ? c.map(nameOf).join(', ') : '아무 핀에도 연결 안 됨';
    },
    allNets: () => Object.entries(netClasses),
  };
}

// ── 부품 헬퍼 ────────────────────────────────────────────────
const TWO_PIN = ['resistor', 'led', 'photoresistor', 'buzzer'];

function pinsOf(c) {
  switch (c.type) {
    case 'ultrasonic':    return { VCC: c.pinVCC, TRIG: c.pinTRIG, ECHO: c.pinECHO, GND: c.pinGND };
    case 'servo':         return { VCC: c.pinVCC, GND: c.pinGND, SIG: c.pinSIG };
    case 'potentiometer': return { VCC: c.pinVCC, SIG: c.pinSIG, GND: c.pinGND };
    case 'slideswitch':   return { ON1: c.pinON1, COM: c.pinCOM, ON2: c.pinON2 };
    case 'button':        return { pin1: c.pin1, pin2: c.pin2, pin3: c.pin3, pin4: c.pin4 };
    default:              return { pin1: c.pin1, pin2: c.pin2 };
  }
}

// 버튼 내부 구조 (브레드보드 가운데 홈을 가로질러 꽂는 4핀 택트 스위치)
//   pin1(e열) ↔ pin3(f열) : 항상 연결 (같은 다리쌍)
//   pin2(e열) ↔ pin4(f열) : 항상 연결
//   누르면 두 쌍이 서로 연결
const buttonAlways  = (b) => [[b.pin1, b.pin3], [b.pin2, b.pin4]];
const buttonPressed = (b) => [[b.pin1, b.pin2]];

function baseEdges(components) {
  return components.filter((c) => c.type === 'button').flatMap(buttonAlways);
}

const compName = (c) => c.label || c.type;

// ── 공통 검사: 합선 / 부품 바이패스 / 잘못된 직결 ─────────────────
function commonChecks(wires, components) {
  const errors = [];
  const C = makeCircuit(wires, baseEdges(components));

  // 1) 한 넷에 서로 다른 Arduino 핀 종류가 섞이면: 부품을 거치지 않은 직결
  for (const [, set] of C.allNets()) {
    if (set.size < 2) continue;
    const list = [...set];
    if (set.has('GND') && (set.has('5V') || set.has('3V3'))) {
      errors.push('⚡ 합선: 5V와 GND가 부품을 거치지 않고 바로 연결되어 있습니다.');
    } else {
      errors.push(`부품을 거치지 않고 ${list.map(nameOf).join('와(과) ')}이(가) 바로 연결되어 있습니다.`);
    }
  }

  // 2) 부품의 다리끼리 같은 넷이면 부품이 바이패스됨
  components.forEach((c) => {
    if (TWO_PIN.includes(c.type)) {
      if (C.same(c.pin1, c.pin2)) {
        errors.push(`${compName(c)}의 양쪽 다리가 전기적으로 같은 곳에 연결되어 부품을 거치지 않습니다.`);
      }
    } else if (c.type === 'button') {
      if (C.same(c.pin1, c.pin2)) {
        errors.push(`${compName(c)} 양쪽이 이미 연결되어 있어 버튼을 누르지 않아도 항상 켜진 상태입니다.`);
      }
    } else {
      const p = Object.entries(pinsOf(c));
      for (let i = 0; i < p.length; i++) {
        for (let j = i + 1; j < p.length; j++) {
          if (C.same(p[i][1], p[j][1])) {
            errors.push(`${compName(c)}의 ${p[i][0]}와 ${p[j][0]} 핀이 서로 연결되어 있습니다.`);
          }
        }
      }
    }
  });

  // 3) 버튼을 누르거나 스위치를 바꿨을 때 합선되는지
  const states = [];
  components.forEach((c) => {
    if (c.type === 'button') states.push({ name: `${compName(c)}을(를) 누르면`, edges: buttonPressed(c) });
    if (c.type === 'slideswitch') {
      states.push({ name: `${compName(c)}을(를) ON1 쪽으로 밀면`, edges: [[c.pinCOM, c.pinON1]] });
      states.push({ name: `${compName(c)}을(를) ON2 쪽으로 밀면`, edges: [[c.pinCOM, c.pinON2]] });
    }
  });
  states.forEach((s) => {
    const S = makeCircuit(wires, [...baseEdges(components), ...s.edges]);
    for (const [, set] of S.allNets()) {
      if (set.has('GND') && (set.has('5V') || set.has('3V3'))) {
        errors.push(`⚡ ${s.name} 5V와 GND가 합선됩니다.`);
        break;
      }
    }
  });

  return [...new Set(errors)];
}

// ── LED(또는 부저) + 저항 직렬 경로 검사 ──────────────────────────
//   from → 저항 → LED(+) → LED(−) → to   또는
//   from → LED(+) → LED(−) → 저항 → to
function ledSeriesOK(C, led, res, from, to) {
  const A = led.pin1, K = led.pin2; // pin1 = + (긴 다리), pin2 = − (짧은 다리)
  const clean = (pin) => C.classes(pin).size === 0; // 저항-LED 사이 중간점은 다른 핀과 연결되면 안 됨
  for (const [x, y] of [[res.pin1, res.pin2], [res.pin2, res.pin1]]) {
    if (C.has(x, from) && C.same(y, A) && clean(A) && C.has(K, to)) return true;
    if (C.has(A, from) && C.same(K, x) && clean(K) && C.has(y, to)) return true;
  }
  return false;
}

function diagnoseLed(C, led, resistors, from, to) {
  const reversed = { ...led, pin1: led.pin2, pin2: led.pin1 };
  if (resistors.some((r) => ledSeriesOK(C, reversed, r, from, to))) {
    return `${compName(led)}의 +/− 방향이 반대입니다. 긴 다리(+)는 ${nameOf(from)} 쪽, 짧은 다리(−)는 ${nameOf(to)} 쪽이어야 합니다.`;
  }
  const hints = [];
  const plusSide  = C.has(led.pin1, from) || resistors.some((r) => C.same(r.pin1, led.pin1) || C.same(r.pin2, led.pin1));
  const minusSide = C.has(led.pin2, to)   || resistors.some((r) => C.same(r.pin1, led.pin2) || C.same(r.pin2, led.pin2));
  if (!plusSide)  hints.push(`LED +(긴 다리)가 저항이나 ${nameOf(from)}에 연결되지 않았습니다 (현재: ${C.where(led.pin1)})`);
  if (!minusSide) hints.push(`LED −(짧은 다리)가 ${nameOf(to)}에 연결되지 않았습니다 (현재: ${C.where(led.pin2)})`);
  if (!hints.length) hints.push(`${nameOf(from)} → 저항 → LED(+) → LED(−) → ${nameOf(to)} 경로가 완성되지 않았습니다`);
  return `${compName(led)}: ${hints.join(' / ')}`;
}

/**
 * 여러 LED에 저항을 하나씩(중복 없이) 배정해서 모두 직렬 경로가 성립하는지 검사
 * reqs: [{ led, from, to }]
 * @returns { ok, msgs: [각 LED별 결과 메시지 or null] }
 */
function checkLeds(C, reqs, resistors) {
  const n = reqs.length;
  const used = new Array(resistors.length).fill(false);
  const bt = (i) => {
    if (i === n) return true;
    for (let k = 0; k < resistors.length; k++) {
      if (used[k]) continue;
      if (ledSeriesOK(C, reqs[i].led, resistors[k], reqs[i].from, reqs[i].to)) {
        used[k] = true;
        if (bt(i + 1)) return true;
        used[k] = false;
      }
    }
    return false;
  };
  if (bt(0)) return reqs.map(() => null);
  const alone = reqs.map((q) => resistors.some((r) => ledSeriesOK(C, q.led, r, q.from, q.to)));
  if (alone.every(Boolean)) {
    // 각자는 되지만 저항을 공유하고 있는 경우
    return reqs.map((q) => `${compName(q.led)}: 저항을 다른 LED와 같이 쓰고 있습니다. LED마다 저항이 하나씩 있어야 합니다.`);
  }
  return reqs.map((q, i) => (alone[i] ? null : diagnoseLed(C, q.led, resistors, q.from, q.to)));
}

// ── 버튼 입력 검사 (아두이노 내부 풀업, INPUT_PULLUP) ─────────────────
//   버튼 한쪽 → dPin, 반대쪽 → GND.  외부 저항 없음.
//   안 누름: dPin은 GND와 분리 (내부 풀업으로 HIGH)
//   누름   : dPin이 GND와 연결 (LOW)
function buttonSideOK(C, btn, dPin) {
  return (C.has(btn.pin1, 'GND') && C.has(btn.pin2, dPin)) ||
         (C.has(btn.pin2, 'GND') && C.has(btn.pin1, dPin));
}

function checkButtons(wires, components, reqs) {
  // reqs: [{ btn, dPin }]
  const base = makeCircuit(wires, baseEdges(components));
  const msgs = [];

  reqs.forEach(({ btn, dPin }) => {
    if (!btn) { msgs.push(`버튼(${dPin}용)을 찾을 수 없습니다.`); return; }
    const n = compName(btn);
    if (!buttonSideOK(base, btn, dPin)) {
      const s1 = base.where(btn.pin1), s2 = base.where(btn.pin2);
      msgs.push(`${n}: 버튼 한쪽 다리는 ${dPin}, 반대쪽 다리는 GND에 연결해야 합니다 (현재 왼쪽 다리: ${s1} / 오른쪽 다리: ${s2})`);
      return;
    }
    // 이 버튼만 눌렀을 때 dPin이 GND가 되고, 다른 버튼 입력핀은 영향이 없어야 함
    const P = makeCircuit(wires, [...baseEdges(components), ...buttonPressed(btn)]);
    if (!P.has(dPin, 'GND')) {
      msgs.push(`${n}: 버튼을 눌러도 ${dPin}이 GND와 연결되지 않습니다.`);
    }
    reqs.forEach((o) => {
      if (o.dPin !== dPin && P.has(o.dPin, 'GND')) {
        msgs.push(`${n}을(를) 눌렀는데 ${o.dPin}도 함께 GND에 연결됩니다. 버튼마다 따로 연결하세요.`);
      }
    });
  });
  return msgs;
}

// ── 간단한 핀 연결 검사 ────────────────────────────────────────
function expectPin(C, comp, pinKey, cls, label) {
  const pin = pinsOf(comp)[pinKey];
  if (C.has(pin, cls)) return null;
  return `${label}이(가) ${nameOf(cls)}에 연결되지 않았습니다 (현재: ${C.where(pin)})`;
}

// ============================================================
// 문제별 규칙
// ============================================================
const byType  = (cs, t) => cs.filter((c) => c.type === t);
const byLabel = (cs, l) => cs.filter((c) => c.label === l);

function problemChecks(id, wires, components) {
  const C = makeCircuit(wires, baseEdges(components));
  const checks = []; // { name, msg|null }
  const add = (name, msg) => checks.push({ name, msg: msg || null });

  const leds = byType(components, 'led');
  const r220 = byLabel(components, '220Ω');
  const r10k = byLabel(components, '10kΩ');
  const ledByLabel = (l, i) => leds.find((x) => x.label === l) || leds[i];

  switch (id) {
    case 1: {
      const res = byType(components, 'resistor');
      const [m] = checkLeds(C, [{ led: leds[0], from: '5V', to: 'GND' }], res);
      add('5V → 220Ω → LED(+) → LED(−) → GND', m);
      break;
    }
    case 2: {
      const reqs = leds.slice(0, 3).map((led) => ({ led, from: '5V', to: 'GND' }));
      const ms = checkLeds(C, reqs, r220.length ? r220 : byType(components, 'resistor'));
      ms.forEach((m, i) => add(`${compName(reqs[i].led)}: 5V → 220Ω → LED → GND (독립 병렬)`, m));
      break;
    }
    case 3: {
      const btn = byType(components, 'button')[0];
      const bm = checkButtons(wires, components, [{ btn, dPin: 'D2' }]);
      add('버튼: D2 ↔ GND (INPUT_PULLUP)', bm.join(' / '));
      const [m] = checkLeds(C, [{ led: leds[0], from: 'D13', to: 'GND' }], r220);
      add('D13 → 220Ω → LED(+) → LED(−) → GND', m);
      break;
    }
    case 4: {
      const btns = byType(components, 'button');
      const b1 = btns.find((b) => b.label === 'BTN1') || btns[0];
      const b2 = btns.find((b) => b.label === 'BTN2') || btns[1];
      const bm = checkButtons(wires, components, [{ btn: b1, dPin: 'D2' }, { btn: b2, dPin: 'D3' }]);
      add('BTN1: D2 ↔ GND, BTN2: D3 ↔ GND (INPUT_PULLUP)', bm.join(' / '));
      const ms = checkLeds(C, [
        { led: ledByLabel('LED1', 0), from: 'D12', to: 'GND' },
        { led: ledByLabel('LED2', 1), from: 'D13', to: 'GND' },
      ], r220);
      add('D12 → 220Ω → LED1 → GND', ms[0]);
      add('D13 → 220Ω → LED2 → GND', ms[1]);
      break;
    }
    case 5:
    case 10: {
      const us = byType(components, 'ultrasonic')[0];
      if (!us) { add('초음파 센서', '초음파 센서를 찾을 수 없습니다.'); break; }
      add('초음파 VCC → 5V',  expectPin(C, us, 'VCC',  '5V',  '초음파 센서 VCC'));
      add('초음파 GND → GND', expectPin(C, us, 'GND',  'GND', '초음파 센서 GND'));
      add('TRIG → D9',        expectPin(C, us, 'TRIG', 'D9',  'TRIG 핀'));
      add('ECHO → D10',       expectPin(C, us, 'ECHO', 'D10', 'ECHO 핀'));
      if (id === 5) {
        const [m] = checkLeds(C, [{ led: leds[0], from: 'D13', to: 'GND' }], r220);
        add('D13 → 220Ω → LED(+) → LED(−) → GND', m);
      } else {
        const bz = byType(components, 'buzzer')[0];
        if (!bz) { add('부저', '부저를 찾을 수 없습니다.'); break; }
        const rev = C.has(bz.pin1, 'GND') && C.has(bz.pin2, 'D8');
        add('부저 (+) → D8', rev ? '부저의 +/− 방향이 반대입니다. (+) 단자를 D8, (−) 단자를 GND에 연결하세요.'
                                  : expectPin(C, bz, 'pin1', 'D8', '부저 (+) 단자'));
        add('부저 (−) → GND', rev ? null : expectPin(C, bz, 'pin2', 'GND', '부저 (−) 단자'));
      }
      break;
    }
    case 6: {
      const sv = byType(components, 'servo')[0];
      if (sv) {
        add('서보 VCC → 5V',  expectPin(C, sv, 'VCC', '5V',  '서보 VCC'));
        add('서보 GND → GND', expectPin(C, sv, 'GND', 'GND', '서보 GND'));
        add('서보 SIG → D9',  expectPin(C, sv, 'SIG', 'D9',  '서보 SIG'));
      } else add('서보모터', '서보모터를 찾을 수 없습니다.');
      const btns = byType(components, 'button');
      const b1 = btns.find((b) => b.label === 'BTN1') || btns[0];
      const b2 = btns.find((b) => b.label === 'BTN2') || btns[1];
      const bm = checkButtons(wires, components, [{ btn: b1, dPin: 'D2' }, { btn: b2, dPin: 'D3' }]);
      add('BTN1: D2 ↔ GND, BTN2: D3 ↔ GND (INPUT_PULLUP)', bm.join(' / '));
      break;
    }
    case 7: {
      const pot = byType(components, 'potentiometer')[0];
      const sv  = byType(components, 'servo')[0];
      if (pot) {
        // 가변저항 양 끝은 대칭이므로 VCC/GND를 바꿔 꽂아도 동작함 (회전 방향만 반대)
        const ok = (C.has(pot.pinVCC, '5V') && C.has(pot.pinGND, 'GND')) ||
                   (C.has(pot.pinVCC, 'GND') && C.has(pot.pinGND, '5V'));
        add('가변저항 양 끝 → 5V / GND', ok ? null :
          `가변저항 양 끝 다리는 각각 5V와 GND에 연결해야 합니다 (현재 VCC: ${C.where(pot.pinVCC)} / GND: ${C.where(pot.pinGND)})`);
        add('가변저항 SIG → A0', expectPin(C, pot, 'SIG', 'A0', '가변저항 가운데 다리(SIG)'));
      } else add('가변저항', '가변저항을 찾을 수 없습니다.');
      if (sv) {
        add('서보 VCC → 5V',  expectPin(C, sv, 'VCC', '5V',  '서보 VCC'));
        add('서보 GND → GND', expectPin(C, sv, 'GND', 'GND', '서보 GND'));
        add('서보 SIG → D9',  expectPin(C, sv, 'SIG', 'D9',  '서보 SIG'));
      } else add('서보모터', '서보모터를 찾을 수 없습니다.');
      break;
    }
    case 8: {
      const sw = byType(components, 'slideswitch')[0];
      if (!sw) { add('슬라이드 스위치', '슬라이드 스위치를 찾을 수 없습니다.'); break; }
      // 내부 풀업(INPUT_PULLUP): COM → D2, ON1 → GND, ON2 → 연결 안 함
      add('COM → D2',  expectPin(C, sw, 'COM', 'D2',  '스위치 COM(가운데)'));
      add('ON1 → GND', expectPin(C, sw, 'ON1', 'GND', '스위치 ON1(왼쪽)'));
      add('ON2 → 연결 안 함', C.classes(sw.pinON2).size
        ? `스위치 ON2(오른쪽)는 연결하지 않습니다. 내부 풀업이 HIGH를 만들어 줍니다 (현재: ${C.where(sw.pinON2)})` : null);
      const L = makeCircuit(wires, [...baseEdges(components), [sw.pinCOM, sw.pinON1]]);
      const R = makeCircuit(wires, [...baseEdges(components), [sw.pinCOM, sw.pinON2]]);
      add('스위치 동작', (L.has('D2', 'GND') && !R.has('D2', 'GND')) ? null
        : '스위치를 왼쪽으로 밀면 D2가 GND와 연결되고, 오른쪽으로 밀면 끊어져야 합니다.');
      const [m] = checkLeds(C, [{ led: leds[0], from: 'D13', to: 'GND' }], r220);
      add('D13 → 220Ω → LED(+) → LED(−) → GND', m);
      break;
    }
    case 9: {
      const cds = byType(components, 'photoresistor')[0];
      if (!cds) { add('조도 센서', '조도 센서를 찾을 수 없습니다.'); break; }
      const ok = [[cds.pin1, cds.pin2], [cds.pin2, cds.pin1]].some(([p, q]) =>
        C.has(p, '5V') && C.has(q, 'A0') &&
        r10k.some((r) => (C.same(r.pin1, q) && C.has(r.pin2, 'GND')) ||
                         (C.same(r.pin2, q) && C.has(r.pin1, 'GND'))));
      add('5V → CdS → (A0 + 10kΩ) → GND', ok ? null :
        `조도 센서 한쪽은 5V, 다른 쪽은 A0와 10kΩ에 함께 연결하고 10kΩ 반대쪽은 GND여야 합니다 (현재 CdS: ${C.where(cds.pin1)} / ${C.where(cds.pin2)})`);
      const [m] = checkLeds(C, [{ led: leds[0], from: 'D13', to: 'GND' }], r220);
      add('D13 → 220Ω → LED(+) → LED(−) → GND', m);
      break;
    }
    default:
      return null; // 규칙 없는 문제 → GPT 판정
  }
  return checks;
}


// ── 한국어 조사 자동 처리: "VCC이(가)" → "VCC가", "핀이(가)" → "핀이" ──
function hasBatchim(ch) {
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  if (/[013678]/.test(ch)) return true;      // 영,일,삼,육,칠,팔
  if (/[LMNRlmnr]/.test(ch)) return true;    // 엘,엠,엔,알
  if (ch === 'Ω') return true;               // 옴
  return false;
}
function josa(text) {
  return text.replace(/([^\s(])(이\(가\)|을\(를\)|와\(과\)|은\(는\))/g, (m, prev, j) => {
    const b = hasBatchim(prev);
    const pick = { '이(가)': ['이', '가'], '을(를)': ['을', '를'], '와(과)': ['과', '와'], '은(는)': ['은', '는'] }[j];
    return prev + (b ? pick[0] : pick[1]);
  });
}

/**
 * 최종 채점
 * @returns { passed:boolean|null, lines:string[], firstError:string|null }
 *   passed=null 이면 이 문제는 서버 규칙이 없음 (GPT 판정 사용)
 */
function gradeCircuit(problemId, wires, components) {
  const checks = problemChecks(problemId, wires, components);
  if (!checks) return { passed: null, lines: [], firstError: null };

  const common = commonChecks(wires, components);
  const lines = [];
  common.forEach((e) => lines.push(`❌ [공통] ${e}`));
  checks.forEach((c) => lines.push(c.msg ? `❌ ${c.name} — ${c.msg}` : `✅ ${c.name}`));

  const errors = [...common, ...checks.filter((c) => c.msg).map((c) => c.msg)].map(josa);
  return { passed: errors.length === 0, lines: lines.map(josa), errors, firstError: errors[0] || null };
}

module.exports = { gradeCircuit, makeCircuit, baseEdges, pinsOf };
