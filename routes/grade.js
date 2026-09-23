// routes/grade.js
const express  = require('express');
const router   = express.Router();
const { OpenAI } = require('openai');
const problems = require('../data/problems-build-circuit');
const { gradeCircuit, makeCircuit, baseEdges, pinsOf } = require('../lib/circuit-check');

require('dotenv').config();

// API 키가 없어도 서버는 뜨도록 지연 생성
let openai = null;
function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'YOUR_OPENAI_API_KEY') return null;
  if (!openai) openai = new OpenAI({ apiKey: key });
  return openai;
}

// ============================================================
// POST /api/grade/:id
// ============================================================
router.post('/:id', async (req, res) => {
  try {
    const problemId = parseInt(req.params.id);
    const { wires = [], components = [] } = req.body;

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
    // 1) 서버 채점 (핀 단위, 결정론적) — 최종 판정
    // ================================================================
    const result = gradeCircuit(problemId, wires, components);
    console.log('[grade] 서버 채점:\n' + result.lines.join('\n'));

    // ================================================================
    // 2) GPT는 피드백 문장만 작성 (판정에는 관여하지 않음)
    // ================================================================
    const C = makeCircuit(wires, baseEdges(components));
    const compDesc = components.map(c => {
      const pins = Object.entries(pinsOf(c))
        .filter(([, p]) => p)
        .map(([k, p]) => {
          const name = c.type === 'led' ? (k === 'pin1' ? '+(긴다리)' : '−(짧은다리)')
                     : c.type === 'buzzer' ? (k === 'pin1' ? '+' : '−')
                     : k;
          return `${name}@${p}→[${C.where(p)}]`;
        });
      return `${c.label ?? c.type}(${c.type}): ${pins.join(', ')}`;
    }).join('\n');

    const wireStr = wires.map(([a, b]) => `${a} — ${b}`).join('\n');

    const fallback = result.passed === false
      ? `아쉬워요! ${result.firstError}`
      : result.passed === true
        ? '정답입니다! 모든 부품이 올바른 핀에 정확한 방향으로 연결되었어요.'
        : '채점 서버에서 이 문제를 판정할 수 없습니다.';

    let passed = result.passed;
    let feedback = fallback;

    const client = getOpenAI();
    if (client) {
      const prompt = `너는 아두이노 회로 교육 채점 도우미야.

[중요] 정답/오답 판정은 이미 서버가 핀 단위로 정확하게 끝냈어. 너는 판정을 바꾸지 말고, 아래 결과를 바탕으로 학생에게 줄 피드백 문장만 작성해.

[표기 설명]
- "핀@브레드보드구멍→[연결된 아두이노 핀]" 형식. 부품 내부는 통과하지 않은 순수 배선 기준이야.
- LED의 +는 긴 다리(애노드), −는 짧은 다리(캐소드).
- 푸시버튼: pin1↔pin3, pin2↔pin4는 항상 연결되고, 누르면 두 쌍이 연결됨.

[문제]
${problem.description}

[부품별 다리 연결 상태]
${compDesc}

[학생이 연결한 점퍼선]
${wireStr}

[서버 채점 결과]
${result.lines.join('\n') || '(서버 규칙 없음)'}
최종: ${result.passed === true ? '✅ 정답' : result.passed === false ? '❌ 오답' : '판정 필요'}

한국어로 1~2문장 피드백을 작성해.
- 정답이면: 칭찬하고 전류 경로를 간단히 설명
- 오답이면: ❌ 항목 중 가장 중요한 것 하나를 골라, 어느 부품의 어느 다리를 어디로 옮겨야 하는지 구체적으로 안내 (정답을 통째로 알려주지는 말 것)

출력형식(JSON):
{
  "isCorrect": true 또는 false,
  "feedback": "한국어 피드백"
}`;

      try {
        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        });
        const gpt = JSON.parse(response.choices[0].message.content);
        console.log('GPT 피드백:', gpt);
        if (gpt.feedback) feedback = gpt.feedback;
        if (passed === null) passed = !!gpt.isCorrect; // 서버 규칙이 없는 문제만 GPT 판정 사용
      } catch (e) {
        console.error('[grade] GPT 호출 실패 — 서버 피드백 사용:', e.message);
      }
    }

    if (passed === null) passed = false;

    res.json({
      success: true,
      data: { problemId, passed, feedback: [feedback] }
    });

  } catch (error) {
    console.error('채점 에러:', error);
    res.status(500).json({ success: false, message: '채점 실패. 다시 시도해주세요.' });
  }
});

module.exports = router;
