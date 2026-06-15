export const ui = (() => {
  let engine, renderer, api;

  const $ = (id) => document.getElementById(id);

  // ============================================================
  // UI 헬퍼
  // ============================================================
  function showNotif(msg, isError = false) {
    const el = $('notif');
    if (!el) return;
    el.textContent = msg;
    if (isError) {
      el.style.borderColor = 'var(--warn)';
      el.style.color = 'var(--warn)';
      el.style.background = 'rgba(234,88,12,.1)';
    } else {
      el.style.borderColor = 'var(--accent2)';
      el.style.color = '#059669';
      el.style.background = 'var(--panel)';
    }
    el.style.display = 'block';
    clearTimeout(el._t);
    el._t = setTimeout(() => (el.style.display = 'none'), isError ? 4000 : 2000);
  }

  function showModal(icon, title, scoreText, scoreColor, msg) {
    const modal = $('modal');
    if (!modal) return;
    $('mIcon').textContent  = icon;
    $('mTitle').textContent = title;
    $('mScore').textContent = scoreText;
    $('mScore').style.color = scoreColor;
    $('mMsg').textContent   = msg;
    modal.classList.add('show');
  }

  function closeModal() {
    $('modal')?.classList.remove('show');
  }

  function setSelectedWire(idx) {
    engine.state.selectedWire = idx;
    const tip = $('wireTip');
    if (tip) tip.style.display = idx >= 0 ? 'block' : 'none';
  }

  // ============================================================
  // 초기화 / 리셋
  // ============================================================
  function resetAll(notify = true) {
    engine.state.wires         = [];
    engine.state.startPin      = null;
    engine.state.draggingComp  = null;
    engine.state.buttonPressed  = false;
    setSelectedWire(-1);

    // 현재 문제의 초기 부품 배치로 복원
    const prob = engine.state.PROBLEMS[engine.state.currentProb];
    engine.state.components = prob?.components
      ? prob.components.map(c => ({ ...c }))
      : [
          { type: 'resistor', label: '220Ω', pin1: 'e10', pin2: 'e14' },
          { type: 'led',      label: 'LED',  pin1: 'a10', pin2: 'a9'  },
        ];

    if (notify) showNotif('🔄 초기화 완료');
  }

  // ============================================================
  // 문제 로드
  // ============================================================
  function initProbSelect() {
    const sel = $('probSelect');
    if (!sel) return;
    sel.innerHTML = '';
    engine.state.PROBLEMS.forEach((p, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `${i + 1}. ${p.title}`;
      sel.appendChild(opt);
    });
  }

  function showStageSelector() {
    $('stageOverlay')?.style.setProperty('display', 'flex');
  }

  function hideStageSelector() {
    $('stageOverlay')?.style.setProperty('display', 'none');
  }

  function initStageGrid() {
    const grid = $('stageGrid');
    if (!grid) return;
    grid.innerHTML = '';
    engine.state.PROBLEMS.forEach((p, i) => {
      const card = document.createElement('div');
      card.className = 'stage-card';
      card.innerHTML = `
        <div class="num">${i + 1}</div>
        <div class="title">${p.title}</div>
      `;
      card.onclick = () => {
        loadProblem(i);
        hideStageSelector();
      };
      grid.appendChild(card);
    });
  }

  function loadProblem(idx) {
    engine.state.currentProb = idx;
    const p = engine.state.PROBLEMS[idx];
    if (!p) return;

    $('probSelect') && ($('probSelect').value = String(idx));
    $('probTitle') && ($('probTitle').textContent = p.title);

    const desc = (p.desc || p.description || '').replace(/\n/g, '<br>');
    $('probDesc') && ($('probDesc').innerHTML = desc);

    const codeEditor = $('codeEditor');
    if (codeEditor) {
      const raw = p.code || p.defaultCode || '';
      const code = raw.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      
      // make-circuit 모드에서는 코드가 "가이드"이므로 읽기 전용이어야 함
      if (window.editor) {
        window.editor.setValue(code);
        window.editor.setOption("readOnly", true); // 편집 불가 설정
      } else if (codeEditor.tagName === 'TEXTAREA') {
        codeEditor.value = code;
        codeEditor.readOnly = true;
      } else {
        // highlight.js 등을 사용하는 일반 요소(code 태그 등)인 경우
        codeEditor.textContent = code;
        if (window.hljs) {
          delete codeEditor.dataset.highlighted;
          window.hljs.highlightElement(codeEditor);
        }
      }
    }

    resetAll(false);
  }

  function showServerErrorUI() {
    $('probTitle') && ($('probTitle').textContent = '서버를 먼저 실행해주세요');
    const probDesc = $('probDesc');
    if (probDesc) {
      probDesc.innerHTML =
        '터미널에서 아래 명령어 실행 후 새로고침하세요.<br><br>' +
        '<code style="background:#f1f5f9;padding:4px 8px;border-radius:4px;font-size:12px">node server.js</code>';
    }
  }

  async function loadProblems() {
    let list;
    // URL 경로에 'make-code'가 포함되어 있는지 확인하여 타입 결정
    const isWriteCode = window.location.pathname.includes('make-code.html') || window.location.pathname.includes('make-code');
    const type = isWriteCode ? 'write-code' : 'build-circuit';
    
    console.log('[loadProblems] Type detected:', type, 'Path:', window.location.pathname);

    try {
      list = await api.fetchProblems(type);
      console.log('[loadProblems] Fetched list:', list);
      
      if (!list || list.length === 0) {
        showNotif('⚠️ 로드된 문제가 없습니다.', true);
        return;
      }
    } catch (e) {
      console.error('[fetchProblems failed]', e);
      showServerErrorUI();
      showNotif('⚠️ 서버 연결 실패', true);
      return;
    }

    try {
      engine.state.PROBLEMS = list.map((p) => ({
        ...p,
        code: p.defaultCode || '',
        desc: p.description || p.desc || '',
      }));
      
      initProbSelect();
      initStageGrid();
      showStageSelector();
    } catch (e) {
      console.error('[UI build failed]', e);
      showNotif('⚠️ 화면 구성 중 오류(콘솔 확인)', true);
    }
  }

  // ============================================================
  // 채점 제출
  // ============================================================
  async function submitAnswer() {
    const probId = engine.getCurrentProblemId() ?? 1;
    const formattedWires = engine.state.wires.map(w => [w.from, w.to]);
    
    // CodeMirror 사용 시 에디터에서 값 가져오기
    const userCode = window.editor ? window.editor.getValue() : ($('codeEditor')?.value ?? '');

    // 채점 시 현재 부품 위치도 함께 전송 (grade.js가 동적 핀 위치를 알아야 함)
    const compPositions = engine.state.components.map(c => {
      if (c.type === 'ultrasonic') {
        return { type: c.type, label: c.label, pinVCC: c.pinVCC, pinTRIG: c.pinTRIG, pinECHO: c.pinECHO, pinGND: c.pinGND };
      }
      if (c.type === 'servo') {
        return { type: c.type, label: c.label, pinVCC: c.pinVCC, pinGND: c.pinGND, pinSIG: c.pinSIG };
      }
      if (c.type === 'potentiometer') {
        return { type: c.type, label: c.label, pinVCC: c.pinVCC, pinSIG: c.pinSIG, pinGND: c.pinGND };
      }
      if (c.type === 'slideswitch') {
        return { type: c.type, label: c.label, pinCOM: c.pinCOM, pinON1: c.pinON1, pinON2: c.pinON2 };
      }
      return { type: c.type, label: c.label, pin1: c.pin1, pin2: c.pin2, ...(c.pin3 && { pin3: c.pin3, pin4: c.pin4 }) };
    });

    try {
      showNotif('🤖 GPT 선생님이 회로를 분석 중입니다... 잠시만 기다려주세요!');
      const result = await api.grade(probId, { wires: formattedWires, userCode, components: compPositions });

      if (result.passed) {
        showModal('🎉', '정답입니다!', '통과', 'var(--accent2)', result.feedback[0] || '훌륭하게 회로를 구성했습니다!');
      } else {
        showModal('🤔', '아쉽네요!', '오답', 'var(--warn)', result.feedback[0] || '연결을 다시 한번 확인해 보세요.');
      }
    } catch (error) {
      console.error('채점 요청 중 오류 발생:', error);
      showNotif('채점 서버와 통신하는 중 문제가 발생했습니다.', true);
    }
  }

  // ============================================================
  // 점퍼선 색상 버튼
  // ============================================================
  function bindWireColorButtons() {
    const btns = document.querySelectorAll('.wire-color');
    btns.forEach((el) => {
      el.addEventListener('click', () => {
        btns.forEach((b) => b.classList.remove('sel'));
        el.classList.add('sel');
        engine.state.wireColor = el.dataset.c || '#ff4444';
        if (engine.state.selectedWire >= 0) {
          engine.state.wires[engine.state.selectedWire].color = engine.state.wireColor;
        }
      });
    });
  }

  // ============================================================
  // 캔버스 이벤트
  // ============================================================
  function bindCanvasEvents() {
    const wrap = $('canvasWrap');
    if (!wrap) return;

    // 휠 줌
    wrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = wrap.getBoundingClientRect();
      engine.zoomBy(
        e.deltaY < 0 ? 0.12 : -0.12,
        r.width, r.height,
        e.clientX - r.left, e.clientY - r.top
      );
    }, { passive: false });

    // 키보드
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        engine.state.startPin = null;
        engine.state.draggingComp = null;
        setSelectedWire(-1);
        const st = $('statusTxt');
        if (st) st.textContent = '핀을 클릭해서 점퍼선 연결 시작';
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && engine.state.selectedWire >= 0) {
        const w = engine.state.wires[engine.state.selectedWire];
        const fp = engine.state.PINS[w.from];
        const tp = engine.state.PINS[w.to];
        showNotif(`🗑 ${fp?.label ?? w.from} ↔ ${tp?.label ?? w.to} 삭제됨`);
        engine.state.wires.splice(engine.state.selectedWire, 1);
        setSelectedWire(-1);
        e.preventDefault();
      }
    });

    // ── 드래그 상태 ──
    let mouseDownPos  = null;
    let panStartX = 0, panStartY = 0, panOffStartX = 0, panOffStartY = 0;
    let isPanning = false;
    let isDraggingComp = false;

    wrap.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;

      const r  = wrap.getBoundingClientRect();
      const wx = (e.clientX - r.left  - engine.state.offsetX) / engine.state.scale;
      const wy = (e.clientY - r.top   - engine.state.offsetY) / engine.state.scale;

      // ✅ 부품 바디 클릭 → 드래그 시작 (와이어 연결 모드가 아닐 때 핀보다 우선)
      if (!engine.state.startPin) {
        const hit = engine.getCompAt(wx, wy);
        if (hit) {
          // 버튼이면 드래그 시작 (클릭/드래그 구분은 mouseup에서)
          if (hit.comp.type === 'button') {
            isDraggingComp = true;
            const snap = engine.snapComp(hit.comp, wx, wy);
            engine.state.draggingComp = { index: hit.index, snapPin1: snap?.pin1, snapPin2: snap?.pin2, snapPin3: snap?.pin3, snapPin4: snap?.pin4, isButton: true };
            wrap.style.cursor = 'grabbing';
            mouseDownPos = { cx: e.clientX, cy: e.clientY }; // 이동 거리 측정용
            return;
          }
          // 초음파 센서 드래그 시작
          if (hit.comp.type === 'ultrasonic') {
            isDraggingComp = true;
            const snap = engine.snapComp(hit.comp, wx, wy);
            engine.state.draggingComp = {
              index: hit.index,
              snapPinVCC: snap?.pinVCC, snapPinTRIG: snap?.pinTRIG,
              snapPinECHO: snap?.pinECHO, snapPinGND: snap?.pinGND,
              isUltrasonic: true,
            };
            wrap.style.cursor = 'grabbing';
            mouseDownPos = null;
            return;
          }
          // 서보모터 드래그 시작
          if (hit.comp.type === 'servo') {
            isDraggingComp = true;
            const snap = engine.snapComp(hit.comp, wx, wy);
            engine.state.draggingComp = {
              index: hit.index,
              snapPinVCC: snap?.pinVCC, snapPinGND: snap?.pinGND, snapPinSIG: snap?.pinSIG,
              isServo: true,
            };
            wrap.style.cursor = 'grabbing';
            mouseDownPos = null;
            return;
          }
          // 슬라이드 스위치 드래그 시작
          if (hit.comp.type === 'slideswitch') {
            isDraggingComp = true;
            const snap = engine.snapComp(hit.comp, wx, wy);
            engine.state.draggingComp = {
              index: hit.index,
              snapPinCOM: snap?.pinCOM, snapPinON1: snap?.pinON1, snapPinON2: snap?.pinON2,
              isSlideSwitch: true,
            };
            wrap.style.cursor = 'grabbing';
            mouseDownPos = null;
            return;
          }
          isDraggingComp = true;
          const snap = engine.snapComp(hit.comp, wx, wy);
          engine.state.draggingComp = { index: hit.index, snapPin1: snap?.pin1, snapPin2: snap?.pin2 };
          wrap.style.cursor = 'grabbing';
          mouseDownPos = null;
          return;
        }
      }

      mouseDownPos  = { cx: e.clientX, cy: e.clientY };
      panStartX     = e.clientX;
      panStartY     = e.clientY;
      panOffStartX  = engine.state.offsetX;
      panOffStartY  = engine.state.offsetY;
      isPanning     = false;
      isDraggingComp = false;
    });

    wrap.addEventListener('mousemove', (e) => {
      const r  = wrap.getBoundingClientRect();
      const sx = e.clientX - r.left;
      const sy = e.clientY - r.top;

      engine.state.mouseScreenX = sx;
      engine.state.mouseScreenY = sy;
      const wc = engine.toWorld(sx, sy);
      engine.state.mouseWorldX = wc.x;
      engine.state.mouseWorldY = wc.y;

      // ✅ 부품 드래그 중 — 스냅 미리보기 갱신
      if (isDraggingComp && engine.state.draggingComp !== null) {
        const comp = engine.state.components[engine.state.draggingComp.index];
        const snap = engine.snapComp(comp, wc.x, wc.y);
        if (comp.type === 'ultrasonic') {
          engine.state.draggingComp.snapPinVCC  = snap?.pinVCC  ?? null;
          engine.state.draggingComp.snapPinTRIG = snap?.pinTRIG ?? null;
          engine.state.draggingComp.snapPinECHO = snap?.pinECHO ?? null;
          engine.state.draggingComp.snapPinGND  = snap?.pinGND  ?? null;
          engine.state.draggingComp.snapPin1 = snap?.pinVCC ?? null;
          engine.state.draggingComp.snapPin2 = snap?.pinGND ?? null;
        } else if (comp.type === 'servo') {
          engine.state.draggingComp.snapPinVCC = snap?.pinVCC ?? null;
          engine.state.draggingComp.snapPinGND = snap?.pinGND ?? null;
          engine.state.draggingComp.snapPinSIG = snap?.pinSIG ?? null;
          engine.state.draggingComp.snapPin1   = null;
          engine.state.draggingComp.snapPin2   = null;
        } else if (comp.type === 'slideswitch') {
          engine.state.draggingComp.snapPinCOM = snap?.pinCOM ?? null;
          engine.state.draggingComp.snapPinON1 = snap?.pinON1 ?? null;
          engine.state.draggingComp.snapPinON2 = snap?.pinON2 ?? null;
          engine.state.draggingComp.snapPin1   = null;
          engine.state.draggingComp.snapPin2   = null;
        } else {
          engine.state.draggingComp.snapPin1 = snap?.pin1 ?? null;
          engine.state.draggingComp.snapPin2 = snap?.pin2 ?? null;
          engine.state.draggingComp.snapPin3 = snap?.pin3 ?? null;
          engine.state.draggingComp.snapPin4 = snap?.pin4 ?? null;
        }
        return;
      }

      if (mouseDownPos && e.buttons === 1 &&
          Math.hypot(e.clientX - mouseDownPos.cx, e.clientY - mouseDownPos.cy) > 6) {
        isPanning = true;
      }

      if (isPanning) {
        engine.state.offsetX = panOffStartX + (e.clientX - panStartX);
        engine.state.offsetY = panOffStartY + (e.clientY - panStartY);
        engine.clampOffset(r.width, r.height);
        return;
      }

      // 상태바 텍스트
      const st  = $('statusTxt');
      if (!st) return;
      const pid = engine.getPinAt(engine.state.mouseWorldX, engine.state.mouseWorldY);
      if (pid) {
        engine.state.hoveredComp = -1;
        st.textContent = `핀: ${engine.state.PINS[pid].label}${engine.state.startPin ? ' — 클릭해서 연결' : ''}`;
      } else if (engine.state.startPin) {
        st.textContent = `"${engine.state.PINS[engine.state.startPin].label}" 선택됨 — 연결할 핀 클릭`;
      } else {
        // 부품 위 호버 안내
        const hit = engine.getCompAt(engine.state.mouseWorldX, engine.state.mouseWorldY);
        if (hit) {
          st.textContent = `${hit.comp.label} — 드래그로 이동`;
          wrap.style.cursor = 'grab';
          engine.state.hoveredComp = hit.index;
        } else {
          engine.state.hoveredComp = -1;
          const wi = engine.getWireAt(engine.state.mouseWorldX, engine.state.mouseWorldY);
          st.textContent = wi >= 0
            ? `점퍼선 클릭하여 선택 (${engine.state.PINS[engine.state.wires[wi].from].label} ↔ ${engine.state.PINS[engine.state.wires[wi].to].label})`
            : '핀 클릭: 연결 | 부품 드래그: 이동 | 빈 곳 드래그: 화면 이동';
          wrap.style.cursor = 'crosshair';
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      // ✅ 부품 드래그 완료 → 스냅 위치에 부품 이동
      if (isDraggingComp && engine.state.draggingComp !== null) {
        const drag = engine.state.draggingComp;
        const { index, snapPin1, snapPin2 } = drag;
        const comp = engine.state.components[index];

        // 버튼: 이동 거리가 작으면 토글, 크면 이동
        const moved = mouseDownPos
          ? Math.hypot(e.clientX - mouseDownPos.cx, e.clientY - mouseDownPos.cy)
          : 999;

        if (drag.isButton && moved < 8) {
          engine.state.buttonPressed = !engine.state.buttonPressed;
        } else if (drag.isUltrasonic && drag.snapPinVCC) {
          comp.pinVCC  = drag.snapPinVCC;
          comp.pinTRIG = drag.snapPinTRIG;
          comp.pinECHO = drag.snapPinECHO;
          comp.pinGND  = drag.snapPinGND;
          showNotif(`📌 ${comp.label} 이동: ${drag.snapPinVCC} ~ ${drag.snapPinGND}`);
        } else if (drag.isServo && drag.snapPinVCC) {
          comp.pinVCC = drag.snapPinVCC;
          comp.pinGND = drag.snapPinGND;
          comp.pinSIG = drag.snapPinSIG;
          showNotif(`📌 ${comp.label} 이동: VCC:${drag.snapPinVCC} SIG:${drag.snapPinSIG}`);
        } else if (drag.isSlideSwitch && drag.snapPinCOM) {
          comp.pinCOM = drag.snapPinCOM;
          comp.pinON1 = drag.snapPinON1;
          comp.pinON2 = drag.snapPinON2;
          showNotif(`📌 ${comp.label} 이동: COM:${drag.snapPinCOM}`);
        } else if (snapPin1 && snapPin2) {
          comp.pin1 = snapPin1;
          comp.pin2 = snapPin2;
          if (drag.snapPin3) comp.pin3 = drag.snapPin3;
          if (drag.snapPin4) comp.pin4 = drag.snapPin4;
          showNotif(`📌 ${comp.label} 이동: ${snapPin1} ↔ ${snapPin2}`);
        }
        engine.state.draggingComp = null;
        isDraggingComp = false;
        wrap.style.cursor = 'crosshair';
        return;
      }

      if (!mouseDownPos) return;

      const wasPanning = isPanning;
      isPanning    = false;
      mouseDownPos = null;

      if (wasPanning) return;

      const r  = wrap.getBoundingClientRect();
      const wx = (e.clientX - r.left  - engine.state.offsetX) / engine.state.scale;
      const wy = (e.clientY - r.top   - engine.state.offsetY) / engine.state.scale;

      const pid = engine.getPinAt(wx, wy);
      const wi  = engine.getWireAt(wx, wy);

      if (engine.state.startPin) {
        if (pid) {
          const a = engine.state.startPin, b = pid;
          const exists = engine.state.wires.some(w => (w.from === a && w.to === b) || (w.from === b && w.to === a));
          if (a !== b && !exists) {
            engine.state.wires.push({ from: a, to: b, color: engine.state.wireColor });
            showNotif(`✓ ${engine.state.PINS[a].label} ↔ ${engine.state.PINS[b].label}`);
          }
          engine.state.startPin = null;
        }
        return;
      }

      if (wi >= 0) { setSelectedWire(wi === engine.state.selectedWire ? -1 : wi); return; }
      if (pid)     { setSelectedWire(-1); engine.state.startPin = pid; return; }
      setSelectedWire(-1);
    });

    wrap.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const r  = wrap.getBoundingClientRect();
      const wx = (e.clientX - r.left  - engine.state.offsetX) / engine.state.scale;
      const wy = (e.clientY - r.top   - engine.state.offsetY) / engine.state.scale;
      const pid = engine.getPinAt(wx, wy);
      if (pid) {
        engine.state.wires = engine.state.wires.filter(w => w.from !== pid && w.to !== pid);
        setSelectedWire(-1);
      }
      engine.state.startPin = null;
    });
  }

  // ============================================================
  // 툴바 버튼
  // ============================================================
  function bindToolbarButtons() {
    const wrap = $('canvasWrap');
    if (!wrap) return;
    $('zoomMinus')?.addEventListener('click', () => engine.zoomBy(-0.15, wrap.clientWidth, wrap.clientHeight, wrap.clientWidth / 2, wrap.clientHeight / 2));
    $('zoomPlus') ?.addEventListener('click', () => engine.zoomBy( 0.15, wrap.clientWidth, wrap.clientHeight, wrap.clientWidth / 2, wrap.clientHeight / 2));
    $('zoomReset')?.addEventListener('click', () => engine.resetZoom(wrap.clientWidth, wrap.clientHeight));
  }

  // ============================================================
  // 초기화
  // ============================================================
  function init({ engine: eng, renderer: ren, api: ap }) {
    engine   = eng;
    renderer = ren;
    api      = ap;

    $('resetBtn')  ?.addEventListener('click', () => resetAll(true));
    $('submitBtn') ?.addEventListener('click', () => submitAnswer());
    $('modalClose')?.addEventListener('click', () => closeModal());
    $('probSelect')?.addEventListener('change', (e) => loadProblem(parseInt(e.target.value, 10)));
    $('listBtn')   ?.addEventListener('click', () => showStageSelector());

    bindWireColorButtons();
    bindToolbarButtons();
    bindCanvasEvents();
  }

  return {
    init,
    loadProblems,
    loadProblem,
    resetAll,
    submitAnswer,
    showNotif,
    showModal,
    closeModal,
  };
})();