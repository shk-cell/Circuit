const problems = [
  {
    id: 1,
    title: "LED 켜기 (D13)",
    description: "아두이노의 D13번 핀에 연결된 LED를 켜는 코드를 작성하세요.",
    defaultCode: `// [미션 힌트]\n// 1. 연결 정보 확인:\n//    - LED: D13\n// 2. setup():\n//    - pinMode(핀번호, OUTPUT)를 사용하여 LED 핀을 출력으로 설정하세요.\n// 3. loop():\n//    - digitalWrite(핀번호, HIGH)를 사용하여 LED를 켜세요.\n\nvoid setup() {\n  // 여기에 코드를 작성하세요\n  \n}\n\nvoid loop() {\n  // 여기에 코드를 작성하세요\n  \n}`,
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
    defaultCode: `// [미션 힌트]\n// 1. 연결 정보 확인:\n//    - LED1: D2, LED2: D4, LED3: D6\n// 2. setup():\n//    - pinMode()를 사용하여 세 개의 핀을 모두 OUTPUT으로 설정하세요.\n// 3. loop():\n//    - digitalWrite()로 LED를 켜고(HIGH) 끕니다(LOW).\n//    - delay(1000)을 사용하여 1초(1000ms) 동안 멈추게 하세요.\n\nvoid setup() {\n  // 여기에 코드를 작성하세요\n  \n}\n\nvoid loop() {\n  // 여기에 코드를 작성하세요\n  \n}`,
    modelWires: [
      ['D2', 'e10', '#ff4444'],
      ['a5', 'GND1', '#222222'],
      ['D4', 'e19', '#4488ff'],
      ['a14', 'GND1', '#222222'],
      ['D6', 'e28', '#44dd88'],
      ['a23', 'GND1', '#222222']
    ],
    keyKeywords: ["pinMode", "digitalWrite", "delay"],
    components: [
      { type: 'resistor', label: '220Ω', pin1: 'e6',  pin2: 'e10' },
      { type: 'led',      label: 'LED1', pin1: 'a6',  pin2: 'a5'  },
      { type: 'resistor', label: '220Ω', pin1: 'e15', pin2: 'e19' },
      { type: 'led',      label: 'LED2', pin1: 'a15', pin2: 'a14' },
      { type: 'resistor', label: '220Ω', pin1: 'e24', pin2: 'e28' },
      { type: 'led',      label: 'LED3', pin1: 'a24', pin2: 'a23' },
    ],
  },
  {
    id: 3,
    title: "푸시버튼으로 LED 켜기",
    description: "푸시버튼을 누르면 LED가 켜지고 버튼을 누르지 않는다면 LED가 꺼집니다.",
    defaultCode: `// [미션 힌트]\n// 1. 연결 정보 확인:\n//    - 버튼: D2, LED: D13\n// 2. setup():\n//    - 버튼 핀은 INPUT, LED 핀은 OUTPUT으로 설정하세요.\n// 3. loop():\n//    - digitalRead(핀번호)로 버튼 상태를 읽어 변수에 저장하세요.\n//    - if문을 사용하여 버튼이 HIGH면 LED를 켜고, 아니면 끕니다.\n\nvoid setup() {\n  // 여기에 코드를 작성하세요\n  \n}\n\nvoid loop() {\n  // 여기에 코드를 작성하세요\n  \n}`,
    modelWires: [
      ['c16', 'Brail-16', '#222222'],
      ['i6', 'Brail-6', '#222222'],
      ['g12', 'Brail+12', '#ff4444'],
      ['D2', 'i10', '#4488ff'],
      ['a21', 'D13', '#ff4444'],
      ['5V', 'Brail+1', '#ff4444'],
      ['Brail-1', 'GND0', '#222222']
    ],
    keyKeywords: ["pinMode", "digitalRead", "digitalWrite"],
    components: [
      { type: 'button',   label: 'BTN',  pin1: 'e10', pin2: 'e12', pin3: 'f10', pin4: 'f12' },
      { type: 'resistor', label: '10kΩ', pin1: 'h6',  pin2: 'h10' },
      { type: 'resistor', label: '220Ω', pin1: 'b16', pin2: 'b20' },
      { type: 'led',      label: 'LED',  pin1: 'a21', pin2: 'a20' },
    ],
  },
  {
    id: 4,
    title: "푸시 버튼 2개로 LED 2개 켜고 끄기",
    description: "제공된 회로 구성을 확인하고, 버튼1(D2)을 누르면 LED1(D12)이 켜지고, 버튼2(D3)를 누르면 LED2(D13)가 켜지도록 코드를 작성하세요.",
    defaultCode: `// [미션 힌트]\n// 1. 연결 정보 확인:\n//    - 버튼1: D2, LED1: D12\n//    - 버튼2: D3, LED2: D13\n// 2. setup():\n//    - 두 버튼은 INPUT, 두 LED는 OUTPUT으로 설정하세요.\n// 3. loop():\n//    - 버튼1 상태를 읽어 LED1을 제어하고, 버튼2 상태를 읽어 LED2를 제어하세요.\n\nvoid setup() {\n  // 여기에 코드를 작성하세요\n  \n}\n\nvoid loop() {\n  // 여기에 코드를 작성하세요\n  \n}`,
    modelWires: [
      ['h2', 'Brail-2', '#222222'],
      ['g8', 'Brail+8', '#ff4444'],
      ['5V', 'Brail+1', '#ff4444'],
      ['GND0', 'Brail-1', '#222222'],
      ['D2', 'h6', '#4488ff'],
      ['h9', 'Brail-9', '#222222'],
      ['g15', 'Brail+15', '#ff4444'],
      ['h13', 'D3', '#44dd88'],
      ['h17', 'Brail-17', '#222222'],
      ['h24', 'Brail-24', '#222222'],
      ['D12', 'g22', '#ff8844'],
      ['g29', 'D13', '#cc44ff']
    ],
    keyKeywords: ["pinMode", "digitalRead", "digitalWrite"],
    components: [
      { type: 'button',   label: 'BTN1', pin1: 'e6',  pin2: 'e8',  pin3: 'f6',  pin4: 'f8'  },
      { type: 'resistor', label: '10kΩ', pin1: 'g2',  pin2: 'g6'  },
      { type: 'resistor', label: '220Ω', pin1: 'g17', pin2: 'g21' },
      { type: 'led',      label: 'LED1', pin1: 'f22', pin2: 'f21' },
      { type: 'button',   label: 'BTN2', pin1: 'e13', pin2: 'e15', pin3: 'f13', pin4: 'f15' },
      { type: 'resistor', label: '10kΩ', pin1: 'g9',  pin2: 'g13' },
      { type: 'resistor', label: '220Ω', pin1: 'g24', pin2: 'g28' },
      { type: 'led',      label: 'LED2', pin1: 'f29', pin2: 'f28' },
    ],
  },
  {
    id: 5,
    title: "초음파 센서로 거리에 따라 LED 켜기",
    description: "HC-SR04 초음파 센서를 사용하여 물체와의 거리를 측정하고, 거리가 20cm 이내라면 LED를 켜는 프로그램을 완성하세요.<br><br><b>연결 정보:</b><br>- TRIG: D9, ECHO: D10<br>- LED: D13<br><br><b>동작 원리:</b><br>1. 초음파 발사(TRIG HIGH) 후 반사된 시간(ECHO)을 측정합니다.<br>2. 측정된 시간을 거리(cm)로 변환합니다.<br>3. 거리가 20cm보다 작으면 LED를 켭니다.",
    defaultCode: `// [미션 힌트]\n// 1. 연결 정보 확인:\n//    - TRIG: D9, ECHO: D10, LED: D13\n// 2. setup():\n//    - TRIG 핀은 신호를 내보내므로 OUTPUT, ECHO 핀은 받아야 하므로 INPUT입니다.\n// 3. loop():\n//    - pulseIn(ECHO핀, HIGH) 함수는 초음파가 돌아온 시간을 측정합니다.\n//    - 'if'문을 사용하여 측정된 distance가 20보다 작을 때 LED를 제어하세요.\n\nconst int trigPin = 9;\nconst int echoPin = 10;\nconst int ledPin  = 13;\n\nvoid setup() {\n  // 핀 모드를 설정하세요\n  \n}\n\nvoid loop() {\n  // 초음파 발생 로직 (제공)\n  digitalWrite(trigPin, LOW);\n  delayMicroseconds(2);\n  digitalWrite(trigPin, HIGH);\n  delayMicroseconds(10);\n  digitalWrite(trigPin, LOW);\n\n  // 반사 시간 측정 및 거리 계산 (수식 제공)\n  long duration = pulseIn(echoPin, HIGH);\n  int distance = duration * 0.034 / 2;\n\n  // 여기에 거리에 따른 LED 제어 코드를 작성하세요\n  \n}`,
    modelWires: [
      ['Brail+1', '5V', '#ff4444'],
      ['GND2', 'Brail-1', '#222222'],
      ['e7', 'D9', '#4488ff'],
      ['e9', 'D10', '#44dd88'],
      ['e11', 'Brail-11', '#222222'],
      ['a17', 'Brail-17', '#222222'],
      ['D13', 'e22', '#ff4444'],
      ['e5', 'Brail+5', '#ff4444']
    ],
    components: [
      { type: 'ultrasonic', label: 'HC-SR04', pinVCC: 'e5',  pinTRIG: 'e7',  pinECHO: 'e9',  pinGND: 'e11' },
      { type: 'resistor',   label: '220Ω',    pin1: 'e18', pin2: 'e22' },
      { type: 'led',        label: 'LED',     pin1: 'a18', pin2: 'a17' },
    ],
  },
  {
    id: 6,
    title: "버튼 2개로 서보모터 방향 제어",
    description: "버튼1을 누르면 서보모터가 왼쪽(-10도), 버튼2를 누르면 오른쪽(+10도)으로 회전하는 프로그램을 작성하세요.<br><br><b>연결 정보:</b><br>- 서보모터: VCC(5V), GND(GND), SIG(D9)<br>- 버튼1: D2, 버튼2: D3",
    defaultCode: `#include <Servo.h>\n\nServo myServo;\nconst int btn1 = 2;\nconst int btn2 = 3;\nint angle = 90;\n\nvoid setup() {\n  myServo.attach(9);\n  // 버튼 핀 모드 설정\n  \n}\n\nvoid loop() {\n  // 버튼1을 누르면 각도를 줄이고, 버튼2를 누르면 각도를 늘리세요\n  // 각도의 범위는 0 ~ 180도 사이여야 합니다.\n  \n  myServo.write(angle);\n  delay(50);\n}`,
    modelWires: [
      ['5V', 'Brail+1', '#ff4444'],
      ['g2', 'Brail+2', '#ff4444'],
      ['g3', 'Brail-3', '#222222'],
      ['Brail-1', 'GND2', '#222222'],
      ['h9', 'Brail-9', '#222222'],
      ['g15', 'Brail+15', '#ff4444'],
      ['g23', 'Brail+23', '#ff4444'],
      ['h17', 'Brail-17', '#222222'],
      ['h13', 'D2', '#4488ff'],
      ['h21', 'D3', '#44dd88'],
      ['g4', 'D9', '#ffcc00']
    ],
    components: [
      { type: 'servo',    label: 'Servo',  pinVCC: 'f2',  pinGND: 'f3',  pinSIG: 'f4'  },
      { type: 'button',   label: 'BTN1',   pin1: 'e13', pin2: 'e15', pin3: 'f13', pin4: 'f15' },
      { type: 'resistor', label: '10kΩ',   pin1: 'g9',  pin2: 'g13' },
      { type: 'button',   label: 'BTN2',   pin1: 'e21', pin2: 'e23', pin3: 'f21', pin4: 'f23' },
      { type: 'resistor', label: '10kΩ',   pin1: 'g17', pin2: 'g21' },
    ],
  },
  {
    id: 7,
    title: "가변저항으로 서보모터 각도 조절",
    description: "가변저항(Potentiometer)의 출력값을 읽어 서보모터의 각도를 0도에서 180도까지 부드럽게 조절하는 프로그램을 작성하세요.<br><br><b>연결 정보:</b><br>- 가변저항: SIG(A0)<br>- 서보모터: SIG(D9)",
    defaultCode: `#include <Servo.h>\n\nServo myServo;\nconst int potPin = A0;\n\nvoid setup() {\n  myServo.attach(9);\n}\n\nvoid loop() {\n  // 1. analogRead()로 가변저항 값을 읽으세요 (0~1023)\n  // 2. map() 함수를 사용하여 0~1023 범위를 0~180 범위로 변환하세요\n  // 3. myServo.write()로 각도를 조절하세요\n  \n  delay(15);\n}`,
    modelWires: [
      ['e5', 'Brail+5', '#ff4444'],
      ['e6', 'A0', '#4488ff'],
      ['e7', 'Brail-7', '#222222'],
      ['f21', 'Brail+21', '#ff4444'],
      ['f22', 'Brail-22', '#222222'],
      ['D9', 'f23', '#ffcc00'],
      ['Brail+1', '5V', '#ff4444'],
      ['GND2', 'Brail-1', '#222222']
    ],
    components: [
      { type: 'potentiometer', label: 'POT',   pinVCC: 'e5', pinSIG: 'e6', pinGND: 'e7'  },
      { type: 'servo',         label: 'Servo', pinVCC: 'f21', pinGND: 'f22', pinSIG: 'f23' },
    ],
  },
  {
    id: 8,
    title: "슬라이드 스위치로 LED 켜고 끄기",
    description: "슬라이드 스위치의 위치에 따라 LED가 켜지고 꺼지는 프로그램을 작성하세요.<br><br><b>연결 정보:</b><br>- 스위치 COM: D2 (10kΩ 풀다운 연결)<br>- 스위치 ON2: 5V<br>- LED: D13<br><br><b>동작 원리:</b><br>스위치를 오른쪽(ON2)으로 밀면 D2에 5V가 입력되어 LED가 켜집니다.",
    defaultCode: `// [미션 힌트]\n// 1. 연결 정보 확인:\n//    - 스위치(COM): D2, LED: D13\n// 2. setup():\n//    - 스위치 핀은 INPUT, LED 핀은 OUTPUT으로 설정하세요.\n// 3. loop():\n//    - digitalRead(2)를 통해 스위치 상태를 읽으세요.\n//    - 읽은 상태값을 그대로 digitalWrite(13, 상태)에 적용해 보세요.\n\nvoid setup() {\n  // 여기에 코드를 작성하세요\n  \n}\n\nvoid loop() {\n  // 여기에 코드를 작성하세요\n  \n}`,
    modelWires: [
      ['5V', 'Brail+1', '#ff4444'],
      ['GND0', 'Brail-1', '#222222'],
      ['h2', 'Brail-2', '#222222'],
      ['g8', 'Brail+8', '#ff4444'],
      ['g7', 'D2', '#4488ff'],
      ['e24', 'D13', '#ff8844'],
      ['a19', 'Brail-19', '#222222'],
      ['Brail-19', 'Brail+19', '#222222']
    ],
    components: [
      { type: 'slideswitch', label: 'SW',   pinCOM: 'f7', pinON1: 'f6', pinON2: 'f8' },
      { type: 'resistor',    label: '10kΩ', pin1: 'g2',   pin2: 'g6' },
      { type: 'resistor',    label: '220Ω', pin1: 'e20',  pin2: 'e24' },
      { type: 'led',         label: 'LED',  pin1: 'a20',  pin2: 'a19' },
    ],
  },
  {
    id: 9,
    title: "조도 센서로 어두워지면 켜지는 가로등",
    description: "조도 센서(CdS)의 밝기 값을 읽어, 주변이 어두워지면 LED가 자동으로 켜지는 회로를 만드세요.\n\n[연결 조건]\n- 조도 센서 한쪽 → 5V\n- 조도 센서 반대쪽 → A0 및 10kΩ 저항의 한쪽\n- 10kΩ 저항의 반대쪽 → GND\n- LED: 220Ω 저항을 거쳐 D13에 연결, LED 음극 → GND",
    defaultCode: `// [미션 힌트]\n// 1. 연결 정보 확인:\n//    - 조도 센서(CdS): A0, LED: D13\n// 2. setup():\n//    - LED 핀을 OUTPUT으로 설정하세요.\n// 3. loop():\n//    - analogRead(핀번호)로 조도 센서의 값을 읽으세요.\n//    - 'if'문을 사용하여 값이 500보다 작으면(어두우면) LED를 켜고, 아니면 끕니다.\n\nconst int cdsPin = A0;\nconst int ledPin = 13;\n\nvoid setup() {\n  // LED 핀 모드를 설정하세요\n  \n}\n\nvoid loop() {\n  // 1. 조도 센서 값을 읽어 변수에 저장하세요\n  int val = \n\n  // 2. 어두워지면(val < 500) LED를 켜고, 밝으면 끄는 조건문을 작성하세요\n  \n\n  delay(100);\n}`,
    keyKeywords: ["pinMode", "analogRead", "digitalWrite", "if"],
    modelWires: [
      ['h2', 'Brail-2', '#222222'],
      ['f10', 'Brail+10', '#ff4444'],
      ['c13', 'Brail-13', '#222222'],
      ['a18', 'D13', '#ff4444'],
      ['h6', 'A0', '#4488ff'],
      ['Brail+1', '5V', '#ff4444'],
      ['GND2', 'Brail-1', '#222222']
    ],
    components: [
      { type: 'photoresistor', label: 'CdS', pin1: 'f6', pin2: 'f10' },
      { type: 'resistor', label: '10kΩ', pin1: 'g2', pin2: 'g6' },
      { type: 'resistor', label: '220Ω', pin1: 'b13', pin2: 'b17' },
      { type: 'led', label: 'LED', pin1: 'a18', pin2: 'a17' }
    ],
  },
  {
    id: 10,
    title: "초음파 센서와 부저를 이용한 후방 감지기",
    description: "자동차의 후방 감지기처럼, 초음파 센서로 거리를 측정하여 물체가 30cm 이내로 가까워지면 피에조 부저에서 경고음이 울리도록 만드세요.\n\n[연결 조건]\n- 초음파 센서: VCC→5V, GND→GND, TRIG→D9, ECHO→D10\n- 피에조 부저: (+) 단자→D8, (-) 단자→GND",
    defaultCode: `// [미션 힌트]\n// 1. 연결 정보 확인:\n//    - TRIG: D9, ECHO: D10, Buzzer: D8\n// 2. setup():\n//    - 각 핀의 입출력 모드를 설정하세요.\n//    - TRIG는 OUTPUT, ECHO는 INPUT, Buzzer는 OUTPUT입니다.\n// 3. loop():\n//    - 초음파 거리 측정 로직은 제공됩니다.\n//    - 'if'문을 사용하여 distance가 30cm 이내일 때 tone()을 울리세요.\n//    - 그 외에는 noTone()으로 소리를 끕니다.\n\nconst int trigPin = 9;\nconst int echoPin = 10;\nconst int buzPin  = 8;\n\nvoid setup() {\n  // 1. 각 핀의 모드를 설정하세요\n  \n}\n\nvoid loop() {\n  // 초음파 발생 및 거리 계산 (제공)\n  digitalWrite(trigPin, LOW);\n  delayMicroseconds(2);\n  digitalWrite(trigPin, HIGH);\n  delayMicroseconds(10);\n  digitalWrite(trigPin, LOW);\n\n  long duration = pulseIn(echoPin, HIGH);\n  int distance  = duration * 0.034 / 2;\n\n  // 2. 거리가 30cm 이내일 때 부저를 제어하는 조건문을 작성하세요\n  \n\n  delay(100);\n}`,
    keyKeywords: ["pinMode", "pulseIn", "if", "tone", "noTone"],
    modelWires: [
      ['f4', 'Brail+4', '#ff4444'],
      ['f10', 'Brail-10', '#222222'],
      ['f18', 'Brail-18', '#222222'],
      ['GND0', 'Brail-1', '#222222'],
      ['5V', 'Brail+1', '#ff4444'],
      ['f6', 'D9', '#4488ff'],
      ['D10', 'f8', '#44dd88'],
      ['D8', 'g16', '#ffcc00']
    ],
    components: [
      {
        type: 'ultrasonic',
        label: 'HC-SR04',
        pinVCC: 'f4',
        pinTRIG: 'f6',
        pinECHO: 'f8',
        pinGND: 'f10'
      },
      { type: 'buzzer', label: 'Buzzer', pin1: 'f16', pin2: 'f18' }
    ],
  },
];

module.exports = problems;