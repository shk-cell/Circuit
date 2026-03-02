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
    const problems = await api.fetchProblems();
    const prob1 = problems.find(p => p.id === 1);
    
    if (prob1) {
      // 1. 문제 정보 표시
      $('probTitle').textContent = `1. ${prob1.title}`;
      $('probDesc').innerHTML = prob1.description;
      
      // 코드 에디터 초기화 (CodeMirror 사용)
      if (editor) {
        editor.setValue(prob1.defaultCode || '');
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
        engine.state.wires = prob1.modelWires.map(w => ({ from: w[0], to: w[1], color: '#ff4444' }));
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
          
          const notif = $('notif');
          notif.textContent = '🔄 코드가 초기화되었습니다.';
          notif.style.display = 'block';
          setTimeout(() => notif.style.display = 'none', 2000);
        }
      };
    }
  } catch (e) {
    console.error('문제 로드 실패:', e);
  }

  // ... (중간 생략: 줌 및 팬 로직)

  // 채점 버튼 이벤트
  $('submitBtn').onclick = async () => {
    const code = editor ? editor.getValue() : $('codeEditor').value;
    const probId = 1;
    
    // 이 모드에서는 회로가 고정되어 있으므로, 현재 엔진의 wires와 components를 그대로 전송
    const formattedWires = engine.state.wires.map(w => [w.from, w.to]);
    const compPositions = engine.state.components;

    try {
      $('notif').textContent = '🤖 GPT 선생님이 코드를 검토 중입니다...';
      $('notif').style.display = 'block';
      
      const result = await api.gradeCode(probId, { 
        wires: formattedWires, 
        userCode: code, 
        components: compPositions 
      });

      $('notif').style.display = 'none';
      
      // 결과 표시
      $('mIcon').textContent = result.passed ? '🎉' : '🤔';
      $('mTitle').textContent = result.passed ? '정답입니다!' : '아쉽네요!';
      $('mScore').textContent = result.passed ? '통과' : '오답';
      $('mScore').style.color = result.passed ? 'var(--accent2)' : 'var(--warn)';
      $('mMsg').textContent = result.feedback[0];
      $('modal').classList.add('show');
    } catch (error) {
      console.error('채점 오류:', error);
      $('notif').textContent = '⚠️ 채점 서버 통신 실패';
    }
  };

  $('modalClose').onclick = () => $('modal').classList.remove('show');

  renderer.startLoop();
}

init();