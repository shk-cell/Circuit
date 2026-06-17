# ⚡ CircuitLab — 아두이노 회로 학습 플랫폼

Arduino 코드를 보고 브레드보드에 직접 회로를 연결하고, GPT가 즉시 채점해 주는 학습 플랫폼입니다.

---

## 제작 이유

Arduino를 처음 배우는 학생들에게 회로 연결은 가장 큰 진입 장벽입니다. 실물 부품과 브레드보드를 직접 다루려면 재료 구입 비용이 필요하고, 잘못 연결하면 부품이 타거나 파손될 위험도 있습니다. 또한 연결이 맞는지 스스로 확인하기 어렵고, 선생님이 일일이 확인해 주기도 어렵습니다.

CircuitLab은 이 문제를 해결하기 위해 만들어졌습니다. 실물 없이 브라우저에서 Arduino 회로를 직접 연결하고, AI가 즉시 채점해 주는 학습 환경을 제공합니다.

---

## 주요 기능

- **회로 연결 연습**: 주어진 Arduino 코드를 분석하고, 브레드보드에 회로를 직접 구성
- **Canvas 기반 에디터**: 드래그 앤 드롭, 줌/팬, 스냅 미리보기 지원
- **지원 부품**: 저항, LED, 버저, 버튼, 조도센서, 초음파센서, 서보모터, 가변저항, 슬라이드 스위치
- **GPT 자동 채점**: 회로 연결 상태를 AI가 분석해 점수와 피드백 즉시 제공
- **Electron 데스크탑 앱**: 별도 브라우저 없이 설치 후 바로 실행 가능

---

## 📁 프로젝트 구조

```
Circuit/
├── electron-main.js       # Electron 진입점 (Express 내장)
├── server.js              # Express 서버
├── package.json
├── routes/
│   ├── problems.js        # 문제 목록 API
│   ├── grade.js           # 회로 채점 API (GPT)
│   └── grade-code.js      # 코드 채점 API (GPT)
├── data/
│   ├── problems.js
│   ├── problems-build-circuit.js   # 회로 연결 문제 데이터
│   └── problems-write-code.js      # 코드 작성 문제 데이터
└── public/
    ├── index.html          # 메인 랜딩 페이지
    ├── make-circuit.html   # 회로 연결 연습 페이지
    ├── app.js              # make-circuit 진입점
    ├── app-c2c.js          # make-code 진입점
    ├── api.js              # fetch 래퍼
    ├── blockly.min.js      # Blockly 로컬 번들
    ├── blockly-arduino.js  # Arduino Blockly 블록 정의
    ├── circuit/
    │   ├── engine.js       # 회로 상태/로직
    │   └── renderer.js     # Canvas 렌더링
    └── ui/
        └── ui.js           # UI 이벤트 바인딩
```

---

## 🚀 실행 방법

### 방법 1. 설치 파일 (권장)

[Releases](https://github.com/shk-cell/Circuit/releases) 페이지에서 `CircuitLab Setup x.x.x.exe` 다운로드 후 실행

### 방법 2. 개발 환경에서 직접 실행

**1. 의존성 설치**
```bash
npm install
```

**2. `.env` 파일 생성**
```
OPENAI_API_KEY=your_api_key_here
```

**3. 실행**
```bash
# Electron 앱으로 실행
npm start

# 웹 서버만 실행 (브라우저에서 http://localhost:3000 접속)
npm run server
```

---

## 📡 API 명세

### 문제 목록 조회
```
GET /api/problems?type=build-circuit
```

### 채점 요청
```
POST /api/grade/:id
Content-Type: application/json

{
  "wires": [...],
  "userCode": "...",
  "components": [...]
}
```

---

## 🗺 향후 개발 로드맵

| 단계 | 기능 | 기술 스택 |
|------|------|-----------|
| ✅ 현재 | 회로 에디터 + GPT 채점 | Electron + Canvas |
| 2단계 | 코드 작성 연습 모드 재도입 | CodeMirror |
| 3단계 | 사용자 로그인 / 진도 저장 | JWT + SQLite |
| 4단계 | Arduino 코드 실제 시뮬레이션 | avr8js |
| 5단계 | 선생님 문제 출제 기능 | 관리자 패널 |
