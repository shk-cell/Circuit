const problems = [
  {
    id: 1,
    title: "LED 켜기 (D13)",
    description: "아두이노의 D13번 핀에 연결된 LED를 켜는 코드를 작성하세요.",
    defaultCode: `void setup() {\n  // 힌트\n  // pinMode(핀번호, OUTPUT);\n  \n}\n\nvoid loop() {\n  // 힌트\n  // digitalWrite(핀번호, HIGH);\n  \n}`,
    modelWires: [
      ['D13', 'e22', '#ff4444'],
      ['a17', 'GND1', '#222222']
    ],
    keyKeywords: [],
    components: [
      { type: 'resistor', label: '220Ω', pin1: 'e18', pin2: 'e22' },
      { type: 'led',      label: 'LED',  pin1: 'a18', pin2: 'a17'  },
    ],
  },
  {
    id: 2,
    title: "LED 3개 순차 점멸",
    description: "디지털 핀 2번, 4번, 6번에 연결된 3개의 LED를 1초 간격으로 순서대로 켜고 끄는 코드를 작성하세요.<br><br><b>동작 순서:</b><br>1. 2번 핀 LED 켜짐 (1초 대기) -> 꺼짐<br>2. 4번 핀 LED 켜짐 (1초 대기) -> 꺼짐<br>3. 6번 핀 LED 켜짐 (1초 대기) -> 꺼짐<br>4. 무한 반복",
    defaultCode: `void setup() {\n  // [힌트] 각 핀(2, 4, 6)을 출력(OUTPUT) 모드로 설정하세요.\n  \n}\n\nvoid loop() {\n  // [힌트] 2번 핀을 켜고(HIGH) 1초 기다린(delay) 후 끄세요(LOW).\n  \n  // [힌트] 4번 핀도 동일하게 작성하세요.\n  \n  // [힌트] 6번 핀도 동일하게 작성하세요.\n  \n}`,
    modelWires: [
      ['D2', 'e10', '#ff4444'],   // D2 -> LED1 저항입력
      ['a5', 'GND1', '#222222'],  // LED1 캐소드(-) -> GND
      ['D4', 'e19', '#4488ff'],   // D4 -> LED2 저항입력
      ['a14', 'GND1', '#222222'], // LED2 캐소드(-) -> GND
      ['D6', 'e28', '#44dd88'],   // D6 -> LED3 저항입력
      ['a23', 'GND1', '#222222']  // LED3 캐소드(-) -> GND
    ],
    keyKeywords: ["pinMode", "digitalWrite", "delay"],
    components: [
      { type: 'resistor', label: '220Ω', pin1: 'e6',  pin2: 'e10' },
      { type: 'led',      label: 'LED1', pin1: 'a6',  pin2: 'a5'  }, // pin1(+)가 오른쪽(a6), pin2(-)가 왼쪽(a5)
      { type: 'resistor', label: '220Ω', pin1: 'e15', pin2: 'e19' },
      { type: 'led',      label: 'LED2', pin1: 'a15', pin2: 'a14' },
      { type: 'resistor', label: '220Ω', pin1: 'e24', pin2: 'e28' },
      { type: 'led',      label: 'LED3', pin1: 'a24', pin2: 'a23' },
    ],
  },
  {
    id: 3,
    title: "푸시버튼으로 LED 켜기",
    description: "푸시버튼을 누르면 LED가 켜지고, 떼면 꺼지는 회로를 만드세요.\n\n[정답 판단 방법]\n체크1: BTN이 5V와 D2에 모두 연결되어 있는가?\n체크2: 10kΩ이 D2와 GND에 모두 연결되어 있는가?\n체크3: 220Ω이 D13에 연결되어 있는가?\n체크4: LED 음극이 GND에 연결되어 있는가?\n체크1~4가 모두 YES면 isCorrect: true",
    defaultCode: `const int btnPin = 2;\nconst int ledPin = 13;\n\nvoid setup() {\n  pinMode(btnPin, INPUT);\n  pinMode(ledPin, OUTPUT);\n}\n\nvoid loop() {\n  int state = digitalRead(btnPin);\n  digitalWrite(ledPin, state);\n}`,
    components: [
      { type: 'button',   label: 'BTN',  pin1: 'e10', pin2: 'e12', pin3: 'f10', pin4: 'f12' },
      { type: 'resistor', label: '10kΩ', pin1: 'a12', pin2: 'a16' },
      { type: 'resistor', label: '220Ω', pin1: 'e21', pin2: 'e25' },
      { type: 'led',      label: 'LED',  pin1: 'a21', pin2: 'a20' },
    ],
  },
  {
    id: 4,
    title: "버튼 2개로 LED 2개 독립 제어",
    description: "버튼1을 누르면 LED1만, 버튼2를 누르면 LED2만 켜지는 회로를 만드세요.\n버튼1 → D2, 버튼2 → D3, LED1 → D12, LED2 → D13\n각 버튼에 10kΩ 풀다운 저항, 각 LED에 220Ω 저항 연결.\n\n[정답 판단 방법]\n체크1: BTN1이 5V와 D2에 연결되어 있는가?\n체크2: 10kΩ(1)이 D2와 GND에 연결되어 있는가?\n체크3: 220Ω(1)이 D12에 연결되어 있고 LED1 음극이 GND인가?\n체크4: BTN2가 5V와 D3에 연결되어 있는가?\n체크5: 10kΩ(2)이 D3와 GND에 연결되어 있는가?\n체크6: 220Ω(2)이 D13에 연결되어 있고 LED2 음극이 GND인가?\n체크1~6이 모두 YES면 isCorrect: true",
    defaultCode: `const int btn1 = 2, btn2 = 3;\nconst int led1 = 12, led2 = 13;\n\nvoid setup() {\n  pinMode(btn1, INPUT);\n  pinMode(btn2, INPUT);\n  pinMode(led1, OUTPUT);\n  pinMode(led2, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(led1, digitalRead(btn1));\n  digitalWrite(led2, digitalRead(btn2));\n}`,
    components: [
      { type: 'button',   label: 'BTN1', pin1: 'e5',  pin2: 'e7',  pin3: 'f5',  pin4: 'f7'  },
      { type: 'resistor', label: '10kΩ', pin1: 'a7',  pin2: 'a11' },
      { type: 'resistor', label: '220Ω', pin1: 'e16', pin2: 'e20' },
      { type: 'led',      label: 'LED1', pin1: 'a16', pin2: 'a15' },
      { type: 'button',   label: 'BTN2', pin1: 'e23', pin2: 'e25', pin3: 'f23', pin4: 'f25' },
      { type: 'resistor', label: '10kΩ', pin1: 'a25', pin2: 'a29' },
      { type: 'resistor', label: '220Ω', pin1: 'e2',  pin2: 'e6'  },
      { type: 'led',      label: 'LED2', pin1: 'a2',  pin2: 'a1'  },
    ],
  },
  {
    id: 5,
    title: "초음파 센서로 거리에 따라 LED 켜기",
    description: "HC-SR04 초음파 센서로 거리를 측정해서, 물체가 20cm 이내로 가까워지면 LED가 켜지는 회로를 만드세요.\n\n[연결 조건]\n- 초음파 센서 VCC → 5V\n- 초음파 센서 GND → GND\n- TRIG핀 → D9\n- ECHO핀 → D10\n- LED: 220Ω 저항을 거쳐 D13에 연결, LED 음극 → GND\n\n[정답 판단 방법]\n체크1~5가 모두 YES면 isCorrect: true",
    defaultCode: `const int trigPin = 9;\nconst int echoPin = 10;\nconst int ledPin  = 13;\n\nvoid setup() {\n  pinMode(trigPin, OUTPUT);\n  pinMode(echoPin, INPUT);\n  pinMode(ledPin,  OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(trigPin, LOW);\n  delayMicroseconds(2);\n  digitalWrite(trigPin, HIGH);\n  delayMicroseconds(10);\n  digitalWrite(trigPin, LOW);\n\n  long duration = pulseIn(echoPin, HIGH);\n  int distance  = duration * 0.034 / 2;\n\n  digitalWrite(ledPin, distance < 20 ? HIGH : LOW);\n  delay(100);\n}`,
    components: [
      { type: 'ultrasonic', label: 'HC-SR04', pinVCC: 'e5',  pinTRIG: 'e7',  pinECHO: 'e9',  pinGND: 'e11' },
      { type: 'resistor',   label: '220Ω',    pin1: 'e18', pin2: 'e22' },
      { type: 'led',        label: 'LED',     pin1: 'a18', pin2: 'a17' },
    ],
  },
  {
    id: 6,
    title: "버튼 2개로 서보모터 방향 제어",
    description: "버튼1을 누르면 서보모터가 왼쪽(-10도), 버튼2를 누르면 오른쪽(+10도)으로 회전하는 회로를 만드세요.\n\n[연결 조건]\n- 서보모터 VCC → 5V\n- 서보모터 GND → GND\n- 서보모터 SIG → D9\n- 버튼1 → 5V + D2, 10kΩ(1) → D2 + GND\n- 버튼2 → 5V + D3, 10kΩ(2) → D3 + GND\n\n[정답 판단 방법]\n체크1: 서보 VCC핀이 5V에 연결되어 있는가?\n체크2: 서보 GND핀이 GND에 연결되어 있는가?\n체크3: 서보 SIG핀이 D9에 연결되어 있는가?\n체크4: BTN1이 5V와 D2에 모두 연결되어 있고, 10kΩ(1)이 D2와 GND에 연결되어 있는가?\n체크5: BTN2가 5V와 D3에 모두 연결되어 있고, 10kΩ(2)이 D3와 GND에 연결되어 있는가?\n\n체크1~5가 모두 YES면 isCorrect: true",
    defaultCode: `#include <Servo.h>\n\nServo servo;\nconst int btn1 = 2;\nconst int btn2 = 3;\nint angle = 90;\n\nvoid setup() {\n  servo.attach(9);\n  pinMode(btn1, INPUT);\n  pinMode(btn2, INPUT);\n}\n\nvoid loop() {\n  if (digitalRead(btn1) && angle > 0)   angle -= 10;\n  if (digitalRead(btn2) && angle < 180) angle += 10;\n  servo.write(angle);\n  delay(150);\n}`,
    components: [
      { type: 'servo',    label: 'Servo',  pinVCC: 'f2',  pinGND: 'f3',  pinSIG: 'f4'  },
      { type: 'button',   label: 'BTN1',   pin1: 'e8',  pin2: 'e10', pin3: 'f8',  pin4: 'f10' },
      { type: 'resistor', label: '10kΩ',   pin1: 'a10', pin2: 'a14' },
      { type: 'button',   label: 'BTN2',   pin1: 'e18', pin2: 'e20', pin3: 'f18', pin4: 'f20' },
      { type: 'resistor', label: '10kΩ',   pin1: 'a20', pin2: 'a24' },
    ],
  },
  {
    id: 7,
    title: "가변저항으로 서보모터 각도 조절",
    description: "가변저항(Potentiometer)의 출력값을 읽어 서보모터의 각도를 조절하는 회로를 만드세요.\n\n[연결 조건]\n- 가변저항 VCC → 5V\n- 가변저항 GND → GND\n- 가변저항 SIG → A0\n- 서보모터 VCC → 5V\n- 서보모터 GND → GND\n- 서보모터 SIG → D9",
    defaultCode: `#include <Servo.h>\n\nServo servo;\nconst int potPin = A0;\n\nvoid setup() {\n  servo.attach(9);\n}\n\nvoid loop() {\n  int val   = analogRead(potPin);\n  int angle = map(val, 0, 1023, 0, 180);\n  servo.write(angle);\n  delay(15);\n}`,
    components: [
      { type: 'potentiometer', label: 'POT',   pinVCC: 'e5', pinSIG: 'e6', pinGND: 'e7'  },
      { type: 'servo',         label: 'Servo', pinVCC: 'f14', pinGND: 'f15', pinSIG: 'f16' },
    ],
  },
  {
    id: 8,
    title: "슬라이드 스위치로 LED 켜고 끄기",
    description: "3핀 슬라이드 스위치를 이용해 LED를 켜고 끄는 회로를 만드세요.\n\n[슬라이드 스위치 핀 구조]\n- ON1(왼쪽)  : 스위치를 왼쪽으로 밀면 COM과 연결\n- COM(가운데): 항상 연결된 공통 핀\n- ON2(오른쪽): 스위치를 오른쪽으로 밀면 COM과 연결\n\n[연결 조건]\n- ON1(왼쪽)  → 10kΩ → GND  (스위치 OFF 시 D2를 GND로 풀다운)\n- COM(가운데)→ D2\n- ON2(오른쪽)→ 5V\n- 220Ω → D13과 LED 양극 사이\n- LED 음극 → GND\n\n[동작 원리]\n스위치 오른쪽: COM↔ON2 연결 → D2가 5V → LED ON\n스위치 왼쪽:  COM↔ON1 연결 → D2가 10kΩ 통해 GND → LED OFF\n\n[정답 판단]\n체크1: COM이 D2에 연결되어 있는가?\n체크2: ON2가 5V에 연결되어 있는가?\n체크3: ON1이 10kΩ을 거쳐 GND에 연결되어 있는가?\n체크4: 220Ω이 D13에 연결되어 있는가?\n체크5: LED 음극이 GND에 연결되어 있는가?\n체크1~5가 모두 YES면 isCorrect: true",
    defaultCode: `const int swPin  = 2;\nconst int ledPin = 13;\n\nvoid setup() {\n  pinMode(swPin,  INPUT);\n  pinMode(ledPin, OUTPUT);\n}\n\nvoid loop() {\n  int state = digitalRead(swPin);\n  digitalWrite(ledPin, state);\n  delay(10);\n}`,
    components: [
      { type: 'slideswitch', label: 'SW',   pinON1: 'g10', pinCOM: 'g11', pinON2: 'g12' },
      { type: 'resistor',    label: '10kΩ', pin1: 'a11',   pin2: 'a15' },
      { type: 'resistor',    label: '220Ω', pin1: 'e20',   pin2: 'e24' },
      { type: 'led',         label: 'LED',  pin1: 'a20',   pin2: 'a19' },
    ],
  },
  {
    id: 9,
    title: "조도 센서로 어두워지면 켜지는 가로등",
    description: "조도 센서(CdS)의 밝기 값을 읽어, 주변이 어두워지면 LED가 자동으로 켜지는 회로를 만드세요.\n\n[연결 조건]\n- 조도 센서 한쪽 → 5V\n- 조도 센서 반대쪽 → A0 및 10kΩ 저항의 한쪽\n- 10kΩ 저항의 반대쪽 → GND (풀다운 구성)\n- LED: 220Ω 저항을 거쳐 D13에 연결, LED 음극 → GND\n\n[동작 원리]\n밝을 때: CdS 저항 낮음 → A0 전압 높음\n어두울 때: CdS 저항 높음 → A0 전압 낮음 (10kΩ에 의해 GND로 풀다운)\n코드에서 analogRead(A0) 값이 일정 수준 이하일 때 digitalWrite(13, HIGH)를 수행합니다.",
    defaultCode: `const int cdsPin = A0;\nconst int ledPin = 13;\n\nvoid setup() {\n  pinMode(ledPin, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int val = analogRead(cdsPin);\n  if (val < 500) {\n    digitalWrite(ledPin, HIGH);\n  } else {\n    digitalWrite(ledPin, LOW);\n  }\n  delay(100);\n}`,
    components: [
      { type: 'photoresistor', label: 'CdS',   pin1: 'e5',  pin2: 'e9'  },
      { type: 'resistor',       label: '10kΩ', pin1: 'a9',  pin2: 'a13' },
      { type: 'resistor',       label: '220Ω', pin1: 'e18', pin2: 'e22' },
      { type: 'led',            label: 'LED',  pin1: 'a18', pin2: 'a17' },
    ],
  },
  {
    id: 10,
    title: "초음파 센서와 부저를 이용한 후방 감지기",
    description: "자동차의 후방 감지기처럼, 초음파 센서로 거리를 측정하여 물체가 30cm 이내로 가까워지면 피에조 부저에서 경고음이 울리도록 만드세요.\n\n[연결 조건]\n- 초음파 센서: VCC→5V, GND→GND, TRIG→D9, ECHO→D10\n- 피에조 부저: (+) 단자→D8, (-) 단자→GND\n\n[동작 원리]\n초음파 센서로 측정된 거리가 30cm 미만이면 digitalWrite(8, HIGH) 또는 tone(8, ...)을 사용하여 부저를 울립니다.",
    defaultCode: `const int trigPin = 9;\nconst int echoPin = 10;\nconst int buzPin  = 8;\n\nvoid setup() {\n  pinMode(trigPin, OUTPUT);\n  pinMode(echoPin, INPUT);\n  pinMode(buzPin,  OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(trigPin, LOW);\n  delayMicroseconds(2);\n  digitalWrite(trigPin, HIGH);\n  delayMicroseconds(10);\n  digitalWrite(trigPin, LOW);\n\n  long duration = pulseIn(echoPin, HIGH);\n  int distance  = duration * 0.034 / 2;\n\n  if (distance > 0 && distance < 30) {\n    tone(buzPin, 1000); // 1kHz 소리 발생\n  } else {\n    noTone(buzPin);\n  }\n  delay(100);\n}`,
    components: [
      { type: 'ultrasonic', label: 'HC-SR04', pinVCC: 'e5', pinTRIG: 'e7', pinECHO: 'e9', pinGND: 'e11' },
      { type: 'buzzer',     label: 'Buzzer',  pin1: 'a15', pin2: 'a17' },
    ],
  },
];

module.exports = problems;