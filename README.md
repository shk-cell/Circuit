# ⚡ CircuitLab — 회로 학습 플랫폼

Arduino 회로를 브라우저에서 직접 연결하고, 코드를 작성해서 채점받는 학습 플랫폼입니다.

---

## 📁 프로젝트 구조

```
circuitlab/
├── server.js              # Express 서버 진입점
├── package.json
├── routes/
│   ├── problems.js        # 문제 API
│   └── grade.js           # 채점 엔진 API
├── data/
│   └── problems.js        # 문제 데이터 (DB 교체 가능)
└── public/
    └── index.html         # 프론트엔드 (여기에 circuit-lab.html 내용 붙여넣기)
```

---

## 🚀 실행 방법

### 1. Node.js 설치
https://nodejs.org 에서 LTS 버전 다운로드 & 설치

### 2. 의존성 설치
```bash
cd circuitlab
npm install
```

### 3. 서버 실행
```bash
# 일반 실행
npm start

# 개발 모드 (코드 변경시 자동 재시작)
npm run dev
```

### 4. 브라우저에서 접속
```
http://localhost:3000
```

---

## 📡 API 명세

### 문제 목록 조회
```
GET /api/problems
```
```json
{
  "success": true,
  "data": [
    { "id": 1, "title": "LED 켜기", "difficulty": "beginner", ... }
  ]
}
```

### 특정 문제 조회
```
GET /api/problems/:id
```

### 채점 요청
```
POST /api/grade/:id
Content-Type: application/json

{
  "wires": [
    { "from": "5v", "to": "res_top" },
    { "from": "res_bot", "to": "led_plus" },
    { "from": "led_minus", "to": "gnd" }
  ],
  "code": "void setup(){pinMode(13,OUTPUT);} void loop(){digitalWrite(13,HIGH);}"
}
```
```json
{
  "success": true,
  "data": {
    "totalScore": 100,
    "passed": true,
    "circuit": { "score": 100, "passed": 3, "total": 3 },
    "code": { "score": 100, "passed": 3, "total": 3 },
    "feedback": []
  }
}
```

---

## 🗺 향후 개발 로드맵

| 단계 | 기능 | 기술 스택 |
|------|------|-----------|
| ✅ 현재 | 회로 에디터 + 채점 엔진 | Node.js + Canvas |
| 2단계 | 사용자 로그인 / 회원가입 | JWT + bcrypt |
| 3단계 | 진도 저장 / 랭킹 | SQLite / PostgreSQL |
| 4단계 | Arduino 코드 실제 시뮬레이션 | avr8js |
| 5단계 | 선생님 문제 출제 기능 | 관리자 패널 |
| 6단계 | 실시간 협업 / 질문 | Socket.io |

---

## 💡 프론트엔드 연결 방법

`circuit-lab.html` 파일 내용을 `public/index.html`로 복사한 뒤,
API 호출 부분을 아래처럼 수정하세요:

```javascript
// 문제 불러오기
const res = await fetch('/api/problems/1');
const { data } = await res.json();

// 채점 요청
const result = await fetch('/api/grade/1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ wires, code })
});
const { data: gradeData } = await result.json();
```
