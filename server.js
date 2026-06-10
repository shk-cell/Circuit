const express = require('express');
const cors = require('cors');
const path = require('path');
const problemsRouter = require('./routes/problems');
const gradeRouter = require('./routes/grade');
const gradeCodeRouter = require('./routes/grade-code');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API 라우터
app.use('/api/problems', problemsRouter);
app.use('/api/grade', gradeRouter);
app.use('/api/grade-code', gradeCodeRouter);

// 메인 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`✅ CircuitLab 서버 실행 중: http://localhost:${PORT}`);
});

module.exports = server;
