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
  engine.init();

  renderer.init({
    canvas: $('c'),
    wrap: $('canvasWrap'),
    engine,
  });

  // 1번 문제 로드 (회로 보고 코드 작성 모드 전용)
  try {
    const problems = await api.fetchProblems('write-code');
    const prob1 = problems.find(p => p.id === 1);
    
    if (prob1) {
      // 1. 문제 정보 표시
      $('probTitle').textContent = `1. ${prob1.title}`;
      $('probDesc').innerHTML = prob1.description;
      
      // 코드 에디터 초기화 (CodeMirror 사용)
      if (editor) {
        editor.setValue(prob1.defaultCode || '');
        // 값 설정 후 즉시 및 지연 후 refresh
        editor.refresh();
        setTimeout(() => {
          editor.refresh();
        }, 1);
      } else {
        $('codeEditor').value = prob1.defaultCode || '';
      }
      
      // 키워드 표시
      if (prob1.keyKeywords && prob1.keyKeywords.length > 0) {
        $('keywordsArea').style.display = 'block';
        $('probKeywords').innerHTML = prob1.keyKeywords
          .map(k => `<span class="keyword-tag">${k}</span>`)
          .join('');
      } else {
        $('keywordsArea').style.display = 'none';
      }
      
      // 2. 엔진에 부품 및 모범 회로 전선 주입
      engine.state.components = prob1.components.map(c => ({ ...c }));
      if (prob1.modelWires) {
        engine.state.wires = prob1.modelWires.map(w => ({ 
          from: w[0], 
          to: w[1], 
          color: w[2] || '#ff4444' 
        }));
      }
      
      // 3. 렌더링 갱신
      renderer.drawAll();

      // 3. 코드 초기화 버튼 기능 (내부에서 prob1 사용)
      $('resetBtn').onclick = () => {
        if (confirm('작성한 코드를 초기화하고 처음 상태로 되돌리시겠습니까?')) {
          if (editor) {
            editor.setValue(prob1.defaultCode);
          } else {
            $('codeEditor').value = prob1.defaultCode;
          }
          
          showNotif('🔄 코드가 초기화되었습니다.');
        }
      };
    }
  } catch (e) {
    console.error('문제 로드 실패:', e);
  }

  // ── 줌 및 팬 로직 ──
  const wrap = $('canvasWrap');
  
  // 마우스 휠 줌 (CTC와 동일)
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

  // 단순 팬(Pan) 로직
  let isPanning = false;
  let startX, startY, startOffX, startOffY;

  wrap.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isPanning = true;
    startX = e.clientX;
    startY = e.clientY;
    startOffX = engine.state.offsetX;
    startOffY = engine.state.offsetY;
    wrap.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    engine.state.offsetX = startOffX + (e.clientX - startX);
    engine.state.offsetY = startOffY + (e.clientY - startY);
    engine.clampOffset(wrap.clientWidth, wrap.clientHeight);
  });

  window.addEventListener('mouseup', () => {
    isPanning = false;
    wrap.style.cursor = 'default';
  });

  // 채점 버튼 이벤트
  $('submitBtn').onclick = async () => {
    const code = editor ? editor.getValue() : $('codeEditor').value;
    const probId = 1;
    
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