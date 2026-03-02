import { api } from './api.js';
import { engine } from './circuit/engine.js';
import { renderer } from './circuit/renderer.js';
import { ui } from './ui/ui.js';

async function main() {
  engine.init();

  renderer.init({
    canvas: document.getElementById('c'),
    wrap: document.getElementById('canvasWrap'),
    engine,
  });

  ui.init({
    engine,
    renderer,
    api,
  });

  try {
    await ui.loadProblems();
  } catch (e) {
    // ui.loadProblems 내부에서 UI 안내를 출력하지만,
    // 혹시 던져지는 에러가 있더라도 앱 전체는 유지
    console.error('[loadProblems uncaught]', e);
  } finally {
    // ✅ 어떤 상황에서도 애니메이션 루프는 시작(전류 점선 흐름이 "이벤트 때만" 움직이는 문제 방지)
    renderer.startLoop();
  }
}

main().catch((e) => {
  console.error(e);
});