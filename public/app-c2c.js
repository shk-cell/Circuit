import { api } from './api.js';
import { engine } from './circuit/engine.js';
import { renderer } from './circuit/renderer.js';

const $ = (id) => document.getElementById(id);

// 1. CodeMirror 에디터 초기화
let editor;
if (window.CodeMirror) {
  editor = CodeMirror.fromTextArea($('codeEditor'), {
    lineNumbers: true,
    mode: "text/x-c++src", // Arduino/C++ 모드
    theme: "default",
    indentUnit: 2,
    tabSize: 2,
    lineWrapping: true
  });

  // 처음 클릭하거나 포커스될 때 레이아웃 재계산 강제 (커서 위치 오류 방지)
  editor.on('focus', function() {
    editor.refresh();
  });
}

async function init() {
  const wrap = $('canvasWrap'); // 변수 선언을 위로 이동
  engine.init();

  renderer.init({
    canvas: $('c'),
    wrap: wrap,
    engine,
  });

  let currentProblem = null;
  let allProblems = [];

  function loadProblem(prob) {
    if (!prob) return;
    console.log('[loadProblem] Loading:', prob.title);
    
    try {
      currentProblem = prob;

      // 1. 문제 정보 표시
      $('probTitle').textContent = `${prob.id}. ${prob.title}`;
      $('probDesc').innerHTML = prob.description || '';
      
      // 코드 에디터 초기화
      if (editor) {
        editor.setValue(prob.defaultCode || '');
        setTimeout(() => editor.refresh(), 10);
      } else {
        $('codeEditor').value = prob.defaultCode || '';
      }
      
      // 2. 엔진 데이터 주입 (방어 코드 추가)
      engine.state.components = (prob.components || []).map(c => ({ ...c }));
      if (prob.modelWires) {
        engine.state.wires = prob.modelWires.map(w => ({ 
          from: w[0], to: w[1], color: w[2] || '#ff4444' 
        }));
      } else {
        engine.state.wires = [];
      }
      
      // 3. 렌더링 갱신
      renderer.drawAll();
      if (wrap) {
        engine.resetZoom(wrap.clientWidth, wrap.clientHeight);
      }
    } catch (err) {
      console.error('[loadProblem Error]', err);
      showNotif('⚠️ 문제를 로드하는 중 오류가 발생했습니다.', true);
    }
  }

  function showStageSelector() {
    console.log('[showStageSelector]');
    $('stageOverlay').style.display = 'flex';
  }

  function hideStageSelector() {
    console.log('[hideStageSelector]');
    $('stageOverlay').style.display = 'none';
  }

  function initStageGrid() {
    const grid = $('stageGrid');
    if (!grid) return;
    grid.innerHTML = '';
    allProblems.forEach((p, i) => {
      const card = document.createElement('div');
      card.className = 'stage-card';
      card.innerHTML = `
        <div class="num">${i + 1}</div>
        <div class="title">${p.title}</div>
      `;
      card.onclick = () => {
        console.log('[Stage Click] Index:', i);
        loadProblem(allProblems[i]);
        hideStageSelector();
        if ($('probSelect')) $('probSelect').value = i;
      };
      grid.appendChild(card);
    });
  }

  // 문제 로드
  try {
    const rawProblems = await api.fetchProblems('write-code');
    // 모든 문제를 목록에 포함
    allProblems = rawProblems;
    
    const sel = $('probSelect');
    sel.innerHTML = '';
    
    allProblems.forEach((p, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${p.id}. ${p.title}`;
      sel.appendChild(opt);
    });

    sel.onchange = (e) => {
      loadProblem(allProblems[e.target.value]);
    };

    // 스테이지 그리드 초기화 및 표시
    initStageGrid();
    showStageSelector();

    // 상단 '문제 목록' 버튼 이벤트 연결
    $('listBtn').onclick = () => showStageSelector();

  } catch (e) {
    console.error('문제 로드 실패:', e);
  }

  // ── 줌 및 팬 로직 ──
  // wrap 변수는 이미 상단에 선언됨
  
  // 마우스 휠 줌
  wrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = wrap.getBoundingClientRect();
    engine.zoomBy(
      e.deltaY < 0 ? 0.12 : -0.12,
      r.width, r.height,
      e.clientX - r.left, e.clientY - r.top
    );
  }, { passive: false });

  // 툴바 버튼
  $('zoomMinus')?.addEventListener('click', () => engine.zoomBy(-0.15, wrap.clientWidth, wrap.clientHeight, wrap.clientWidth / 2, wrap.clientHeight / 2));
  $('zoomPlus') ?.addEventListener('click', () => engine.zoomBy( 0.15, wrap.clientWidth, wrap.clientHeight, wrap.clientWidth / 2, wrap.clientHeight / 2));

  // 견고한 팬(Pan) 로직 (ui.js 방식)
  let mouseDownPos = null;
  let isPanning = false;
  let panStartX, panStartY, panOffStartX, panOffStartY;

  wrap.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    mouseDownPos = { cx: e.clientX, cy: e.clientY };
    panStartX = e.clientX;
    panStartY = e.clientY;
    panOffStartX = engine.state.offsetX;
    panOffStartY = engine.state.offsetY;
    isPanning = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (mouseDownPos && e.buttons === 1) {
      if (!isPanning && Math.hypot(e.clientX - mouseDownPos.cx, e.clientY - mouseDownPos.cy) > 6) {
        isPanning = true;
        wrap.style.cursor = 'grabbing';
      }
    }

    if (isPanning) {
      const r = wrap.getBoundingClientRect();
      engine.state.offsetX = panOffStartX + (e.clientX - panStartX);
      engine.state.offsetY = panOffStartY + (e.clientY - panStartY);
      engine.clampOffset(r.width, r.height);
    }
  });

  window.addEventListener('mouseup', () => {
    isPanning = false;
    mouseDownPos = null;
    wrap.style.cursor = 'grab';
  });

  // 채점 버튼 이벤트
  $('submitBtn').onclick = async () => {
    if (!currentProblem) return;
    const code = editor ? editor.getValue() : $('codeEditor').value;
    const probId = currentProblem.id;
    
    // 이 모드에서는 회로가 고정되어 있으므로, 현재 엔진의 wires와 components를 그대로 전송
    const formattedWires = engine.state.wires.map(w => [w.from, w.to]);
    const compPositions = engine.state.components;

    try {
      showNotif('🤖 GPT 선생님이 코드를 검토 중입니다...');
      
      const result = await api.gradeCode(probId, { 
        wires: formattedWires, 
        userCode: code, 
        components: compPositions 
      });

      // 결과 표시 (CTC와 동일한 텍스트 및 스타일)
      if (result.passed) {
        showModal('🎉', '정답입니다!', '통과', 'var(--accent2)', result.feedback[0] || '훌륭하게 코드를 작성했습니다!');
      } else {
        showModal('🤔', '아쉽네요!', '오답', 'var(--warn)', result.feedback[0] || '코드를 다시 한번 확인해 보세요.');
      }
    } catch (error) {
      console.error('채점 오류:', error);
      showNotif('⚠️ 채점 서버 통신 실패', true);
    }
  };

  $('modalClose').onclick = () => $('modal').classList.remove('show');

  renderer.startLoop();
}

// UI 헬퍼 함수 추가 (CTC ui.js와 동일한 기능)
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

init();