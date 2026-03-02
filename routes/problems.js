// routes/problems.js
const express = require('express');
const router = express.Router();
const problems = require('../data/problems');

// GET /api/problems — 전체 문제 목록
router.get('/', (req, res) => {
  // 이제 가공 없이 문제 목록을 그대로 보냅니다.
  res.json({ success: true, data: problems });
});

// GET /api/problems/:id — 특정 문제 조회
router.get('/:id', (req, res) => {
  const prob = problems.find(p => p.id === parseInt(req.params.id));
  if (!prob) return res.status(404).json({ success: false, message: '문제를 찾을 수 없습니다.' });
  
  res.json({ success: true, data: prob });
});

module.exports = router;