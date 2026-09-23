const problems = [
  {
    id: 1,
    title: "LED 켜기 (D13)",
    description: "아두이노의 D13번 핀에 연결된 LED를 켜는 코드를 작성하세요.",
    defaultCode: `// [미션 1] LED 켜기 가이드
// --------------------------------------------------
// 1. 연결 정보 확인:
//    - LED는 디지털 13번(D13) 핀에 연결되어 있습니다.
// 2. 주요 명령어 예시:
//    - pinMode(13, OUTPUT);  <- 13번 핀을 출력용으로 설정
//    - digitalWrite(13, HIGH); <- 13번 핀에 전기를 보내 LED 켜기
// --------------------------------------------------

void setup() {
  // [STEP 1] 13번 핀을 출력(OUTPUT) 모드로 설정하세요.
  pinMode(13, OUTPUT);
}

void loop() {
  // [STEP 2] 13번 핀에 전기를 보냅니다(HIGH).
  // 여기에 digitalWrite 명령어를 작성해 보세요!
  
}`,
    defaultBlocks: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_functions" x="40" y="20"><statement name="SETUP"><block type="arduino_pin_mode"><field name="PIN">13</field><field name="MODE">OUTPUT</field></block></statement><statement name="LOOP"><block type="arduino_digital_write"><field name="PIN">13</field><field name="STATE">HIGH</field></block></statement></block></xml>`,
    modelWires: [['D13', 'e22', '#ff4444'], ['a17', 'GND1', '#222222']],
    components: [{ type: 'resistor', label: '220Ω', pin1: 'e18', pin2: 'e22' }, { type: 'led', label: 'LED', pin1: 'a18', pin2: 'a17' }],
  },
  {
    id: 2,
    title: "LED 3개 순차 점멸",
    description: "디지털 핀 2번, 4번, 6번에 연결된 3개의 LED를 1초 간격으로 순서대로 켜고 끄는 코드를 작성하세요.",
    defaultCode: `// [미션 2] LED 3개 순차 점멸 가이드
// --------------------------------------------------
// 1. 연결 정보 확인:
//    - LED1: D2, LED2: D4, LED3: D6
// 2. 주요 명령어 예시:
//    - delay(1000); <- 1초(1000ms) 동안 멈춥니다.
//    - digitalWrite(2, LOW); <- 2번 핀의 전기를 끊어 LED를 끕니다.
// --------------------------------------------------

void setup() {
  // [STEP 1] 2, 4, 6번 핀을 모두 출력(OUTPUT)으로 설정하세요.
  pinMode(2, OUTPUT);
  pinMode(4, OUTPUT);
  pinMode(6, OUTPUT);
}

void loop() {
  // [STEP 2] 순서대로 켜고 끄는 로직을 완성하세요.
  // 1. 2번 켜기 -> 1초 대기 -> 2번 끄기
  digitalWrite(2, HIGH); 
  delay(1000); 
  digitalWrite(2, LOW);

  // 2. 4번 켜기 -> 1초 대기 -> 4번 끄기 (아래에 작성하세요)
  

  // 3. 6번 켜기 -> 1초 대기 -> 6번 끄기 (아래에 작성하세요)
  
}`,
    defaultBlocks: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_functions" x="40" y="20"><statement name="SETUP"><block type="arduino_pin_mode"><field name="PIN">2</field><field name="MODE">OUTPUT</field><next><block type="arduino_pin_mode"><field name="PIN">4</field><field name="MODE">OUTPUT</field><next><block type="arduino_pin_mode"><field name="PIN">6</field><field name="MODE">OUTPUT</field></block></next></block></next></block></statement></block></xml>`,
    modelWires: [['D2', 'e10', '#ff4444'], ['a5', 'GND1', '#222222'], ['D4', 'e19', '#4488ff'], ['a14', 'GND1', '#222222'], ['D6', 'e28', '#44dd88'], ['a23', 'GND1', '#222222']],
    components: [{ type: 'resistor', label: '220Ω', pin1: 'e6', pin2: 'e10' }, { type: 'led', label: 'LED1', pin1: 'a6', pin2: 'a5' }, { type: 'resistor', label: '220Ω', pin1: 'e15', pin2: 'e19' }, { type: 'led', label: 'LED2', pin1: 'a15', pin2: 'a14' }, { type: 'resistor', label: '220Ω', pin1: 'e24', pin2: 'e28' }, { type: 'led', label: 'LED3', pin1: 'a24', pin2: 'a23' }],
  },
  {
    id: 3,
    title: "푸시버튼으로 LED 켜기",
    description: "푸시버튼(D2)을 누르면 LED(D13)가 켜지고 버튼을 누르지 않는다면 LED가 꺼집니다.\n※ 버튼은 아두이노 내부 풀업(INPUT_PULLUP)을 사용합니다: 누르면 LOW, 떼면 HIGH",
    defaultCode: `// [미션 3] 버튼으로 LED 제어 가이드
// --------------------------------------------------
// 1. 연결 정보 확인:
//    - 버튼: 디지털 2번(D2), LED: 디지털 13번(D13)
// 2. 주요 명령어 예시:
//    - int val = digitalRead(2); <- 2번 핀의 상태(HIGH/LOW)를 읽어 val에 저장
//    - if (val == LOW) { ... } <- 만약 val이 LOW라면(= 버튼을 눌렀다면)...
// 3. INPUT_PULLUP: 버튼을 누르면 LOW, 떼면 HIGH가 읽힙니다.
// --------------------------------------------------

void setup() {
  pinMode(2, INPUT_PULLUP); // 버튼 입력 (내부 풀업 저항 사용)
  pinMode(13, OUTPUT); // LED는 전기를 보내므로 OUTPUT
}

void loop() {
  // [STEP 1] 버튼의 상태를 읽어 변수에 저장합니다.
  int btn = digitalRead(2);

  // [STEP 2] 조건문을 사용하여 LED를 제어하세요.
  if (btn == LOW) {
    // 버튼을 눌렀을 때: LED 켜기
    digitalWrite(13, HIGH);
  } else {
    // 버튼을 떼었을 때: LED 끄기 (아래에 작성하세요)
    
  }
}`,
    defaultBlocks: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_functions" x="40" y="20"><statement name="SETUP"><block type="arduino_pin_mode"><field name="PIN">2</field><field name="MODE">INPUT_PULLUP</field><next><block type="arduino_pin_mode"><field name="PIN">13</field><field name="MODE">OUTPUT</field></block></next></block></statement><statement name="LOOP"><block type="controls_if"><mutation else="1"></mutation></block></statement></block></xml>`,
    modelWires: [['GND0', 'Brail-1', '#222222'], ['g12', 'Brail-12', '#222222'], ['D2', 'i10', '#4488ff'], ['a21', 'D13', '#ff4444'], ['c16', 'Brail-16', '#222222']],
    components: [{ type: 'button', label: 'BTN', pin1: 'e10', pin2: 'e12', pin3: 'f10', pin4: 'f12' }, { type: 'resistor', label: '220Ω', pin1: 'b16', pin2: 'b20' }, { type: 'led', label: 'LED', pin1: 'a21', pin2: 'a20' }],
  },
  {
    id: 4,
    title: "푸시 버튼 2개로 LED 2개 켜고 끄기",
    description: "버튼1(D2)을 누르면 LED1(D12)이 켜지고, 버튼2(D3)를 누르면 LED2(D13)가 켜지도록 작성하세요.\n※ 버튼은 아두이노 내부 풀업(INPUT_PULLUP)을 사용합니다: 누르면 LOW, 떼면 HIGH",
    defaultCode: `// [미션 4] 버튼 2개, LED 2개 가이드
// --------------------------------------------------
// 1. 연결 정보 확인:
//    - 버튼1: D2 -> LED1: D12
//    - 버튼2: D3 -> LED2: D13
// 2. 힌트: 각 버튼과 LED 쌍을 독립적인 if문으로 처리하세요.
// --------------------------------------------------

void setup() {
  // [STEP 1] 2, 3번 입력 / 12, 13번 출력 설정
  pinMode(2, INPUT_PULLUP); pinMode(3, INPUT_PULLUP); // 내부 풀업
  pinMode(12, OUTPUT); pinMode(13, OUTPUT);
}

void loop() {
  // [STEP 2] 버튼 1이 눌리면 12번 LED 켜기
  if (digitalRead(2) == LOW) { // 누르면 LOW
    digitalWrite(12, HIGH);
  } else {
    digitalWrite(12, LOW);
  }

  // [STEP 3] 버튼 2(D3)가 눌리면 13번 LED를 켜는 코드를 아래에 작성하세요.
  
}`,
    defaultBlocks: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_functions" x="40" y="20"><statement name="SETUP"><block type="arduino_pin_mode"><field name="PIN">2</field><field name="MODE">INPUT_PULLUP</field><next><block type="arduino_pin_mode"><field name="PIN">3</field><field name="MODE">INPUT_PULLUP</field><next><block type="arduino_pin_mode"><field name="PIN">12</field><field name="MODE">OUTPUT</field><next><block type="arduino_pin_mode"><field name="PIN">13</field><field name="MODE">OUTPUT</field></block></next></block></next></block></next></block></statement></block></xml>`,
    modelWires: [['GND0', 'Brail-1', '#222222'], ['g8', 'Brail-8', '#222222'], ['D2', 'h6', '#4488ff'], ['g15', 'Brail-15', '#222222'], ['D3', 'h13', '#44dd88'], ['D12', 'g22', '#ff8844'], ['h17', 'Brail-17', '#222222'], ['D13', 'g29', '#cc44ff'], ['h24', 'Brail-24', '#222222']],
    components: [{ type: 'button', label: 'BTN1', pin1: 'e6', pin2: 'e8', pin3: 'f6', pin4: 'f8' }, { type: 'button', label: 'BTN2', pin1: 'e13', pin2: 'e15', pin3: 'f13', pin4: 'f15' }, { type: 'led', label: 'LED1', pin1: 'f22', pin2: 'f21' }, { type: 'resistor', label: '220Ω', pin1: 'g17', pin2: 'g21' }, { type: 'led', label: 'LED2', pin1: 'f29', pin2: 'f28' }, { type: 'resistor', label: '220Ω', pin1: 'g24', pin2: 'g28' }],
  },
  {
    id: 5,
    title: "초음파 센서로 거리에 따라 LED 켜기",
    description: "HC-SR04 센서로 측정한 거리가 20cm 이내라면 LED(D13)를 켜는 프로그램을 완성하세요.",
    defaultCode: `// [미션 5] 초음파 센서 거리 측정 가이드
// --------------------------------------------------
// 1. 연결 정보 확인:
//    - TRIG: D9 (신호 발사), ECHO: D10 (신호 수신)
//    - LED: D13
// 2. 주요 명령어:
//    - pulseIn(10, HIGH); <- ECHO 핀으로 신호가 돌아온 시간을 잽니다.
// --------------------------------------------------

void setup() {
  pinMode(9, OUTPUT);  // TRIG
  pinMode(10, INPUT);  // ECHO
  pinMode(13, OUTPUT); // LED
}

void loop() {
  // [STEP 1] 초음파 발사 로직 (미리 작성됨)
  digitalWrite(9, LOW); delayMicroseconds(2);
  digitalWrite(9, HIGH); delayMicroseconds(10);
  digitalWrite(9, LOW);

  // [STEP 2] 돌아온 시간(duration)을 cm 단위 거리(distance)로 변환
  long duration = pulseIn(10, HIGH);
  int distance = duration * 0.034 / 2;

  // [STEP 3] 거리가 20cm 미만일 때 LED를 켜는 조건문을 완성하세요.
  if (distance < 20) {
    // 여기에 코드를 작성하세요!
    
  } else {
    digitalWrite(13, LOW);
  }
}`,
    defaultBlocks: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_functions" x="40" y="20"><statement name="SETUP"><block type="arduino_pin_mode"><field name="PIN">9</field><field name="MODE">OUTPUT</field><next><block type="arduino_pin_mode"><field name="PIN">10</field><field name="MODE">INPUT</field><next><block type="arduino_pin_mode"><field name="PIN">13</field><field name="MODE">OUTPUT</field></block></next></block></next></block></statement><statement name="LOOP"><block type="controls_if"><mutation else="1"></mutation><value name="IF0"><block type="logic_compare"><field name="OP">LT</field><value name="A"><block type="arduino_ultrasonic_read"><field name="TRIG">9</field><field name="ECHO">10</field></block></value><value name="B"><block type="math_number"><field name="NUM">20</field></block></value></block></value></block></statement></block></xml>`,
    modelWires: [['5V', 'Brail+1', '#ff4444'],['GND2', 'Brail-1', '#222222'],['e5', 'Brail+5', '#ff4444'],['e11', 'Brail-11', '#222222'],['D9', 'e7', '#4488ff'],['D10', 'e9', '#44dd88'],['D13', 'e22', '#ff4444'],['a17', 'Brail-17', '#222222']],
    components: [{ type: 'ultrasonic', label: 'HC-SR04', pinVCC: 'e5', pinTRIG: 'e7', pinECHO: 'e9', pinGND: 'e11' }, { type: 'resistor', label: '220Ω', pin1: 'e18', pin2: 'e22' }, { type: 'led', label: 'LED', pin1: 'a18', pin2: 'a17' }],
  },
  {
    id: 6,
    title: "버튼 2개로 서보모터 방향 제어",
    description: "버튼1(D2)을 누르면 서보모터 -10도, 버튼2(D3)를 누르면 +10도 회전 시키세요.\n※ 버튼은 아두이노 내부 풀업(INPUT_PULLUP)을 사용합니다: 누르면 LOW, 떼면 HIGH",
    defaultCode: `// [미션 6] 서보모터 버튼 제어 가이드
// --------------------------------------------------
// 1. 연결 정보 확인:
//    - 서보 신호선: D9, 버튼1: D2, 버튼2: D3
// 2. 주요 명령어:
//    - myservo.write(각도); <- 서보모터를 해당 각도로 이동
// --------------------------------------------------
#include <Servo.h>

Servo myservo;
int angle = 90; // 초기 각도

void setup() {
  myservo.attach(9);
  pinMode(2, INPUT_PULLUP); // 내부 풀업
  pinMode(3, INPUT_PULLUP);
}

void loop() {
  // [STEP 1] 버튼 1(D2)이 눌리면 각도를 10도 뺍니다.
  if (digitalRead(2) == LOW) { // 누르면 LOW
    angle = angle - 10;
  }
  
  // [STEP 2] 버튼 2(D3)가 눌리면 각도를 10도 더하는 코드를 완성하세요.
  

  // [STEP 3] 각도가 0~180 범위를 벗어나지 않게 제한하고 서보를 움직입니다.
  if (angle < 0) angle = 0;
  if (angle > 180) angle = 180;

  myservo.write(angle);
  delay(100); // 버튼 입력 속도 조절
}`,
    defaultBlocks: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_functions" x="40" y="20"><statement name="SETUP"><block type="arduino_pin_mode"><field name="PIN">2</field><field name="MODE">INPUT_PULLUP</field><next><block type="arduino_pin_mode"><field name="PIN">3</field><field name="MODE">INPUT_PULLUP</field></block></next></block></statement></block></xml>`,
    modelWires: [['5V', 'Brail+1', '#ff4444'],['GND2', 'Brail-1', '#222222'],['g2', 'Brail+2', '#ff4444'],['g3', 'Brail-3', '#222222'],['D9', 'g4', '#ffcc00'],['g15', 'Brail-15', '#222222'],['D2', 'h13', '#4488ff'],['g23', 'Brail-23', '#222222'],['D3', 'h21', '#44dd88']],
    components: [{ type: 'servo', label: 'Servo', pinVCC: 'f2', pinGND: 'f3', pinSIG: 'f4' }, { type: 'button', label: 'BTN1', pin1: 'e13', pin2: 'e15', pin3: 'f13', pin4: 'f15' }, { type: 'button', label: 'BTN2', pin1: 'e21', pin2: 'e23', pin3: 'f21', pin4: 'f23' }],
  },
  {
    id: 7,
    title: "가변저항으로 서보모터 각도 조절",
    description: "가변저항(A0) 값을 읽어 서보모터(D9)의 각도를 0~180도로 조절하세요.",
    defaultCode: `// [미션 7] 가변저항 서보 제어 가이드
// --------------------------------------------------
// 1. 힌트: analogRead(A0)의 값(0~1023)을 
//          map 함수를 통해 (0~180)으로 변환해야 합니다.
// 2. 명령어 예시:
//    - int angle = map(값, 0, 1023, 0, 180);
// --------------------------------------------------
#include <Servo.h>
Servo myservo;

void setup() {
  myservo.attach(9);
}

void loop() {
  // [STEP 1] 가변저항(A0)의 아날로그 값을 읽으세요.
  int sensorValue = analogRead(A0);

  // [STEP 2] 센서값을 각도로 변환하세요.
  int angle = map(sensorValue, 0, 1023, 0, 180);

  // [STEP 3] 서보모터를 변환된 각도로 움직이세요.
  // 여기에 코드를 작성하세요!
  
  delay(15);
}`,
    defaultBlocks: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_functions" x="40" y="20"><statement name="LOOP"><block type="arduino_servo_write"><field name="PIN">9</field><value name="DEGREE"><block type="arduino_map"><value name="VAL"><block type="arduino_analog_read"><field name="PIN">A0</field></block></value></block></value></block></statement></block></xml>`,
    modelWires: [['5V', 'Brail+1', '#ff4444'], ['GND2', 'Brail-1', '#222222'],['e5', 'Brail+5', '#ff4444'], ['e7', 'Brail-7', '#222222'], ['A0', 'e6', '#4488ff'],['f21', 'Brail+21', '#ff4444'], ['f22', 'Brail-22', '#222222'], ['D9', 'f23', '#ffcc00']],
    components: [{ type: 'potentiometer', label: 'POT', pinVCC: 'e5', pinSIG: 'e6', pinGND: 'e7' }, { type: 'servo', label: 'Servo', pinVCC: 'f21', pinGND: 'f22', pinSIG: 'f23' }],
  },
  {
    id: 8,
    title: "슬라이드 스위치로 LED 켜고 끄기",
    description: "스위치(D2)의 위치에 따라 LED(D13)가 켜지고 꺼지는 프로그램을 작성하세요.\n※ 스위치는 아두이노 내부 풀업(INPUT_PULLUP)을 사용합니다: GND 쪽으로 밀면 LOW, 반대쪽으로 밀면 HIGH",
    defaultCode: `// [미션 8] 슬라이드 스위치 가이드
// --------------------------------------------------
// 1. 힌트: 스위치는 버튼과 원리가 같습니다. 
//          상태를 digitalRead로 읽어서 LED에 digitalWrite 합니다.
// --------------------------------------------------

void setup() {
  pinMode(2, INPUT_PULLUP); // 스위치 핀 (내부 풀업: GND 쪽이면 LOW)
  pinMode(13, OUTPUT); // LED 핀
}

void loop() {
  // [STEP 1] 스위치 상태를 읽으세요.
  int swState = digitalRead(2);

  // [STEP 2] 읽은 상태(swState)를 13번 LED에 그대로 출력해 보세요.
  // 여기에 digitalWrite 명령어를 작성하세요.
  
}`,
    defaultBlocks: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_functions" x="40" y="20"><statement name="SETUP"><block type="arduino_pin_mode"><field name="PIN">2</field><field name="MODE">INPUT_PULLUP</field><next><block type="arduino_pin_mode"><field name="PIN">13</field><field name="MODE">OUTPUT</field></block></next></block></statement></block></xml>`,
    modelWires: [['GND0', 'Brail-1', '#222222'], ['g6', 'Brail-6', '#222222'], ['D2', 'g7', '#4488ff'],['D13', 'e24', '#ff8844'], ['a19', 'Brail-19', '#222222']],
    components: [{ type: 'slideswitch', label: 'SW', pinCOM: 'f7', pinON1: 'f6', pinON2: 'f8' }, { type: 'resistor', label: '220Ω', pin1: 'e20', pin2: 'e24' }, { type: 'led', label: 'LED', pin1: 'a20', pin2: 'a19' }],
  },
  {
    id: 9,
    title: "조도 센서로 어두워지면 켜지는 가로등",
    description: "조도 센서(A0) 값이 500보다 작으면 LED(D13)를 켜고, 밝으면 끄세요.",
    defaultCode: `// [미션 9] 조도 센서 가로등 가이드
// --------------------------------------------------
// 1. 힌트: 주변이 어두우면 센서 값이 낮아집니다.
//          if (밝기값 < 500) 조건을 사용하세요.
// --------------------------------------------------

void setup() {
  pinMode(13, OUTPUT); // LED 핀
}

void loop() {
  // [STEP 1] 조도 센서(A0)의 아날로그 값을 읽습니다.
  int light = analogRead(A0);

  // [STEP 2] 500 미만일 때 LED를 켜는 조건문을 완성하세요.
  if (light < 500) {
    // 여기에 코드를 작성하세요!
    
  } else {
    // 밝을 때 LED 끄기
    
  }
  delay(100);
}`,
    defaultBlocks: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_functions" x="40" y="20"><statement name="SETUP"><block type="arduino_pin_mode"><field name="PIN">13</field><field name="MODE">OUTPUT</field></block></statement><statement name="LOOP"><block type="controls_if"><mutation else="1"></mutation></block></statement></block></xml>`,
    modelWires: [['5V', 'Brail+1', '#ff4444'], ['GND2', 'Brail-1', '#222222'],['f10', 'Brail+10', '#ff4444'], ['h2', 'Brail-2', '#222222'], ['A0', 'h6', '#4488ff'],['D13', 'a18', '#ff4444'], ['c13', 'Brail-13', '#222222']],
    components: [{ type: 'photoresistor', label: 'CdS', pin1: 'f6', pin2: 'f10' }, { type: 'resistor', label: '10kΩ', pin1: 'g2', pin2: 'g6' }, { type: 'led', label: 'LED', pin1: 'a18', pin2: 'a17' }, { type: 'resistor', label: '220Ω', pin1: 'b13', pin2: 'b17' }],
  },
  {
    id: 10,
    title: "초음파 센서와 부저를 이용한 후방 감지기",
    description: "거리가 30cm 이내일 때 부저(D8)를 울리고, 그 외에는 소리를 끄세요.",
    defaultCode: `// [미션 10] 후방 감지기 가이드
// --------------------------------------------------
// 1. 힌트: tone(8, 1000); 명령어로 8번 부저를 1000Hz로 울립니다.
//          noTone(8); 명령어로 소리를 끕니다.
// --------------------------------------------------

void setup() {
  pinMode(9, OUTPUT);  // TRIG
  pinMode(10, INPUT);  // ECHO
  pinMode(8, OUTPUT);  // 부저
}

void loop() {
  // [STEP 1] 초음파 측정 로직 (제공)
  digitalWrite(9, LOW); delayMicroseconds(2);
  digitalWrite(9, HIGH); delayMicroseconds(10);
  digitalWrite(9, LOW);
  int dist = pulseIn(10, HIGH) * 0.034 / 2;

  // [STEP 2] 거리가 30cm 이내일 때 부저를 제어하세요.
  if (dist < 30) {
    // 여기에 소리 내는 코드를 작성하세요 (tone)
    
  } else {
    // 여기에 소리 끄는 코드를 작성하세요 (noTone)
    
  }
  delay(100);
}`,
    defaultBlocks: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_functions" x="40" y="20"><statement name="SETUP"><block type="arduino_pin_mode"><field name="PIN">9</field><field name="MODE">OUTPUT</field><next><block type="arduino_pin_mode"><field name="PIN">10</field><field name="MODE">INPUT</field><next><block type="arduino_pin_mode"><field name="PIN">8</field><field name="MODE">OUTPUT</field></block></next></block></next></block></statement></block></xml>`,
    modelWires: [['5V', 'Brail+1', '#ff4444'], ['GND0', 'Brail-1', '#222222'],['f4', 'Brail+4', '#ff4444'], ['f10', 'Brail-10', '#222222'],['D9', 'f6', '#4488ff'], ['D10', 'f8', '#44dd88'],['D8', 'g16', '#ffcc00'], ['f18', 'Brail-18', '#222222']],
    components: [{ type: 'ultrasonic', label: 'HC-SR04', pinVCC: 'f4', pinTRIG: 'f6', pinECHO: 'f8', pinGND: 'f10' }, { type: 'buzzer', label: 'Buzzer', pin1: 'f16', pin2: 'f18' }],
  },
];

module.exports = problems;
