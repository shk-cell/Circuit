const express = require('express');
const router  = express.Router();
const { OpenAI } = require('openai');
const problems = require('../data/problems-write-code');

require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * [회로 보고 코드 작성] 모드 전용 채점 API
 */
router.post('/:id', async (req, res) => {
  try {
    const problemId = parseInt(req.params.id);
    const { userCode = '', components = [], wires = [] } = req.body;

    const problem = problems.find(p => p.id === problemId);
    if (!problem) return res.status(404).json({ success: false, message: '문제를 찾을 수 없습니다.' });

    // 1. 코드 기반 사전 체크
    let preCheckFeedback = '';
    
    // 문제 1: LED 켜기 체크
    if (problemId === 1) {
      const hasPin13 = userCode.includes('13');
      const hasOutput = userCode.toUpperCase().includes('OUTPUT');
      const hasHigh   = userCode.toUpperCase().includes('HIGH');

      if (!hasPin13) {
        preCheckFeedback = "회로의 LED가 연결된 13번 핀을 사용해야 합니다.";
      } else if (!hasOutput) {
        preCheckFeedback = "pinMode를 사용하여 13번 핀을 OUTPUT으로 설정했는지 확인하세요.";
      } else if (!hasHigh) {
        preCheckFeedback = "digitalWrite를 사용하여 13번 핀에 HIGH 신호를 주어야 합니다.";
      }
    }

    if (preCheckFeedback) {
      return res.json({
        success: true,
        data: { passed: false, feedback: [preCheckFeedback] }
      });
    }

    // 2. GPT 상세 분석
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY') {
      console.error('[OpenAI Error] API Key가 설정되지 않았습니다.');
      return res.status(200).json({
        success: true,
        data: { passed: false, feedback: ["서버 설정에서 OpenAI API Key가 누락되었습니다. 관리자에게 문의하세요."] }
      });
    }

    const prompt = `너는 아두이노 코드 교육 채점 선생님이야.
학생이 '회로 보고 코드 작성' 문제를 풀고 있어.

[제시된 회로 구성]
- 부품: ${JSON.stringify(components)}
- 전선 연결: ${JSON.stringify(wires)}

[문제 목표]
${problem.description}

[학생이 작성한 코드]
${userCode}

위 회로 구성을 참고했을 때, 학생의 코드가 목표를 달성하는지 판단해줘.
코드의 문법이 맞는지, 회로에 연결된 핀 번호를 정확히 사용했는지 확인해야 해.
블록 코딩에서 생성된 코드의 경우, void setup()이나 void loop() 내부에 명령어들이 정확히 포함되어 있는지 유심히 봐줘.

출력형식(JSON):
{
  "isCorrect": true 또는 false,
  "feedback": "친절한 한국어 피드백 (1~2문장)"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content);

    res.json({
      success: true,
      data: { 
        passed: result.isCorrect, 
        feedback: [result.feedback] 
      }
    });

  } catch (error) {
    console.error('Code grading error 상세:', error);
    res.status(500).json({ success: false, message: `채점 실패: ${error.message}` });
  }
});

module.exports = router;