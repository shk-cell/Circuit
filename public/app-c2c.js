import { api } from './api.js';
import { engine } from './circuit/engine.js';
import { renderer } from './circuit/renderer.js';

const $ = (id) => document.getElementById(id);

// 전역 변수
let editor;
let currentProblem = null;
let allProblems = [];

/**
 * 1. CodeMirror 에디터 초기화
 */
function initCodeMirror() {
  const textarea = $('codeEditor');
  if (!textarea) return;
  if (typeof CodeMirror === 'undefined') {
    console.warn('[Init] CodeMirror not loaded (CDN 미로드) — 텍스트 입력으로 대체');
    return;
  }
  editor = CodeMirror.fromTextArea(textarea, {
    lineNumbers: true,
    mode: "text/x-c++src",
    theme: "default",
    indentUnit: 2,
    tabSize: 2,
    lineWrapping: true
  });
  editor.on('focus', () => editor.refresh());
  console.log('[Init] CodeMirror initialized');
}

/**
 * 2. 문제 로드 및 UI 반영
 */
function loadProblem(prob) {
  if (!prob) return;
  console.log('[loadProblem] Loading:', prob.id, prob.title);
  currentProblem = prob;

  $('probTitle').textContent = `${prob.id}. ${prob.title}`;
  $('probDesc').innerHTML = prob.description || '';

  if (editor) {
    editor.setValue(prob.defaultCode || "");
    editor.clearHistory();
    setTimeout(() => editor.refresh(), 50);
  }

  engine.state.components = (prob.components || []).map(c => ({ ...c }));
  engine.state.wires = (prob.modelWires || []).map(w => ({ from: w[0], to: w[1], color: w[2] || '#ff4444' }));
  
  renderer.drawAll();
}

/**
 * 3. 미션 선택 오버레이 노출
 */
function setupMode() {
  $('stageOverlay').style.display = 'flex';
}

async function main() {
  // 1. 미션 선택 오버레이 노출
  setupMode();

  // 2. 엔진 및 에디터 초기화
  engine.init();
  try { initCodeMirror(); } catch(e) { console.error('[initCodeMirror]', e); }

  try { renderer.init({ canvas: $('c'), wrap: $('canvasWrap'), engine }); } catch(e) { console.error('[renderer.init]', e); }
  try { renderer.startLoop(); } catch(e) { console.error('[renderer.startLoop]', e); }

  // 줌 및 팬 로직 복구
  const wrap = $('canvasWrap');
  if (wrap) {
    // 1. 마우스 휠 줌
    wrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = wrap.getBoundingClientRect();
      engine.zoomBy(
        e.deltaY < 0 ? 0.12 : -0.12,
        r.width, r.height,
        e.clientX - r.left, e.clientY - r.top
      );
    }, { passive: false });

    // 2. 드래그 팬(Pan)
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
  }

  // 3. 줌 버튼 이벤트 (HTML에 버튼이 있는 경우)
  $('zoomPlus')?.addEventListener('click', () => engine.zoomBy(0.15, wrap.clientWidth, wrap.clientHeight, wrap.clientWidth/2, wrap.clientHeight/2));
  $('zoomMinus')?.addEventListener('click', () => engine.zoomBy(-0.15, wrap.clientWidth, wrap.clientHeight, wrap.clientWidth/2, wrap.clientHeight/2));

  // 4. 문제 데이터 가져오기

  try {
    const res = await api.fetchProblems('write-code');
    allProblems = res;
    
    // 스테이지 그리드
    const grid = $('stageGrid');
    allProblems.forEach(p => {
      const card = document.createElement('div');
      card.className = 'stage-card';
      card.innerHTML = `<div class="num">${p.id}</div><div class="title">${p.title}</div>`;
      card.onclick = () => { try { loadProblem(p); } catch(e) { console.error('[loadProblem]', e); } $('stageOverlay').style.display = 'none'; };
      grid.appendChild(card);
    });

    // 버튼들
    $('listBtn').onclick = () => $('stageOverlay').style.display = 'flex';
    $('resetBtn').onclick = () => { if(confirm('초기화할까요?')) loadProblem(currentProblem); };
    
    $('submitBtn').onclick = async () => {
      if (!currentProblem) return;
      showNotif('🤖 채점 중...');
      const userCode = editor ? editor.getValue() : ($('codeEditor')?.value ?? '');
      const result = await api.gradeCode(currentProblem.id, {
        userCode,
        wires: engine.state.wires.map(w => [w.from, w.to]),
        components: engine.state.components
      });
      if (result) {
        showModal(result.passed ? '🎉' : '🤔', result.passed ? '정답!' : '오답', result.passed ? '통과' : '재도전', result.passed ? '#10b981' : '#f43f5e', result.feedback[0]);
      }
    };
    $('modalClose').onclick = () => $('modal').classList.remove('show');

  } catch (err) { console.error(err); }
}

function showNotif(msg, isError = false) {
  const el = $('notif');
  el.textContent = msg; el.style.display = 'block';
  el.style.borderColor = isError ? '#f43f5e' : '#10b981';
  setTimeout(() => el.style.display = 'none', 3000);
}

function showModal(icon, title, score, color, msg) {
  $('mIcon').textContent = icon; $('mTitle').textContent = title;
  $('mScore').textContent = score; $('mScore').style.color = color;
  $('mMsg').textContent = msg; $('modal').classList.add('show');
}

main();
