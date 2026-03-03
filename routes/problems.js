// routes/problems.js
const express = require('express');
const router = express.Router();
const problemsWriteCode = require('../data/problems-write-code');
const problemsBuildCircuit = require('../data/problems-build-circuit');

// GET /api/problems — 문제 목록 반환 (type에 따라 다름)
router.get('/', (req, res) => {
  const type = req.query.type; // 'write-code' or 'build-circuit'
  
  if (type === 'write-code') {
    return res.json({ success: true, data: problemsWriteCode });
  } else if (type === 'build-circuit') {
    return res.json({ success: true, data: problemsBuildCircuit });
  } else {
    // 기본값은 'build-circuit'으로 설정
    return res.json({ success: true, data: problemsBuildCircuit });
  }
});

// GET /api/problems/:id — 특정 문제 조회
router.get('/:id', (req, res) => {
  const type = req.query.type || 'build-circuit';
  const problems = (type === 'write-code') ? problemsWriteCode : problemsBuildCircuit;
  
  const prob = problems.find(p => p.id === parseInt(req.params.id));
  if (!prob) return res.status(404).json({ success: false, message: '문제를 찾을 수 없습니다.' });
  
  res.json({ success: true, data: prob });
});

module.exports = router;