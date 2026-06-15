/**
 * 최신 Blockly 규격에 맞춘 Arduino 코드 생성기
 */

export let ArduinoGenerator = null;

if (typeof Blockly === 'undefined') {
  console.warn('[blockly-arduino] Blockly not loaded — ArduinoGenerator 비활성화');
} else {

// 1. 블록 정의 (JSON) - 기존과 동일
Blockly.defineBlocksWithJsonArray([
  {
    "type": "arduino_functions",
    "message0": "초기 설정 (setup) %1 %2 반복 실행 (loop) %3 %4",
    "args0": [
      {"type": "input_dummy"},
      {"type": "input_statement", "name": "SETUP"},
      {"type": "input_dummy"},
      {"type": "input_statement", "name": "LOOP"}
    ],
    "color": "#4c97ff"
  },
  {
    "type": "arduino_pin_mode",
    "message0": "디지털 핀 %1 번을 %2 모드로 설정",
    "args0": [
      {"type": "field_number", "name": "PIN", "value": 13},
      {
        "type": "field_dropdown",
        "name": "MODE",
        "options": [["OUTPUT", "OUTPUT"], ["INPUT", "INPUT"], ["INPUT_PULLUP", "INPUT_PULLUP"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "color": "#0284c7"
  },
  {
    "type": "arduino_digital_write",
    "message0": "디지털 핀 %1 번에 %2 출력",
    "args0": [
      {"type": "field_number", "name": "PIN", "value": 13},
      {
        "type": "field_dropdown",
        "name": "STATE",
        "options": [["HIGH", "HIGH"], ["LOW", "LOW"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "color": "#10b981"
  },
  {
    "type": "arduino_digital_read",
    "message0": "디지털 %1 번 핀 읽기",
    "args0": [{"type": "field_number", "name": "PIN", "value": 2}],
    "output": "Boolean",
    "color": "#10b981"
  },
  {
    "type": "arduino_analog_read",
    "message0": "아날로그 %1 번 핀 읽기",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "PIN",
        "options": [["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["A5", "A5"]]
      }
    ],
    "output": "Number",
    "color": "#f59e0b"
  },
  {
    "type": "arduino_analog_write",
    "message0": "핀 %1 번에 PWM %2 출력 (0-255)",
    "args0": [
      {"type": "field_number", "name": "PIN", "value": 9},
      {"type": "input_value", "name": "VALUE", "check": "Number"}
    ],
    "previousStatement": null,
    "nextStatement": null,
    "color": "#f59e0b"
  },
  {
    "type": "arduino_delay",
    "message0": "%1 ms 대기",
    "args0": [{"type": "field_number", "name": "MS", "value": 1000, "min": 0}],
    "previousStatement": null,
    "nextStatement": null,
    "color": "#64748b"
  },
  {
    "type": "arduino_map",
    "message0": "값 %1 을 [%2~%3]에서 [%4~%5]로 변환",
    "args0": [
      {"type": "input_value", "name": "VAL", "check": "Number"},
      {"type": "input_value", "name": "F1", "check": "Number"},
      {"type": "input_value", "name": "T1", "check": "Number"},
      {"type": "input_value", "name": "F2", "check": "Number"},
      {"type": "input_value", "name": "T2", "check": "Number"}
    ],
    "output": "Number",
    "color": "#8b5cf6"
  },
  {
    "type": "arduino_ultrasonic_read",
    "message0": "초음파 센서 Trig:%1 Echo:%2 거리(cm) 읽기",
    "args0": [
      {"type": "field_number", "name": "TRIG", "value": 9},
      {"type": "field_number", "name": "ECHO", "value": 10}
    ],
    "output": "Number",
    "color": "#8b5cf6"
  },
  {
    "type": "arduino_servo_write",
    "message0": "서보모터 핀 %1 각도를 %2 로 이동",
    "args0": [
      {"type": "field_number", "name": "PIN", "value": 9},
      {"type": "input_value", "name": "DEGREE", "check": "Number"}
    ],
    "previousStatement": null,
    "nextStatement": null,
    "color": "#ec4899"
  },
  {
    "type": "arduino_serial_begin",
    "message0": "시리얼 통신 시작 (속도: %1)",
    "args0": [{"type": "field_number", "name": "SPEED", "value": 9600}],
    "previousStatement": null,
    "nextStatement": null,
    "color": "#0ea5e9"
  },
  {
    "type": "arduino_serial_print",
    "message0": "시리얼 출력 %1 (줄바꿈: %2)",
    "args0": [
      {"type": "input_value", "name": "CONTENT"},
      {"type": "field_checkbox", "name": "NEWLINE", "checked": true}
    ],
    "previousStatement": null,
    "nextStatement": null,
    "color": "#0ea5e9"
  },
  {
    "type": "arduino_tone",
    "message0": "부저 핀 %1 에 %2 Hz 소리",
    "args0": [
      {"type": "field_number", "name": "PIN", "value": 8},
      {"type": "input_value", "name": "FREQ", "check": "Number"}
    ],
    "previousStatement": null,
    "nextStatement": null,
    "color": "#d946ef"
  },
  {
    "type": "arduino_notone",
    "message0": "부저 핀 %1 소리 끄기",
    "args0": [{"type": "field_number", "name": "PIN", "value": 8}],
    "previousStatement": null,
    "nextStatement": null,
    "color": "#d946ef"
  }
]);

// 2. 아두이노 코드 생성기 설정
ArduinoGenerator = new Blockly.Generator('Arduino');
ArduinoGenerator.PRECEDENCE_ATOMIC = 0;
ArduinoGenerator.INDENT = '  ';

ArduinoGenerator.scrub_ = function(block, code, opt_thisOnly) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  let nextCode = '';
  if (nextBlock && !opt_thisOnly) {
    nextCode = '\n' + ArduinoGenerator.blockToCode(nextBlock);
  }
  return code + nextCode;
};

// --- 최신 규격 (forBlock)으로 생성기 함수 등록 ---

const FB = ArduinoGenerator.forBlock;

FB['arduino_functions'] = function(block, generator) {
  const setup = generator.statementToCode(block, 'SETUP');
  const loop = generator.statementToCode(block, 'LOOP');
  return `void setup() {\n${setup}}\n\nvoid loop() {\n${loop}}`;
};

FB['arduino_pin_mode'] = function(block, generator) {
  const pin = block.getFieldValue('PIN');
  const mode = block.getFieldValue('MODE');
  return `pinMode(${pin}, ${mode});`;
};

FB['arduino_digital_write'] = function(block, generator) {
  const pin = block.getFieldValue('PIN');
  const state = block.getFieldValue('STATE');
  return `digitalWrite(${pin}, ${state});`;
};

FB['arduino_digital_read'] = function(block, generator) {
  const pin = block.getFieldValue('PIN');
  return [`digitalRead(${pin})`, ArduinoGenerator.PRECEDENCE_ATOMIC];
};

FB['arduino_analog_read'] = function(block, generator) {
  const pin = block.getFieldValue('PIN');
  return [`analogRead(${pin})`, ArduinoGenerator.PRECEDENCE_ATOMIC];
};

FB['arduino_analog_write'] = function(block, generator) {
  const pin = block.getFieldValue('PIN');
  const val = generator.valueToCode(block, 'VALUE', ArduinoGenerator.PRECEDENCE_ATOMIC) || '0';
  return `analogWrite(${pin}, ${val});`;
};

FB['arduino_delay'] = function(block, generator) {
  const ms = block.getFieldValue('MS');
  return `delay(${ms});`;
};

FB['arduino_map'] = function(block, generator) {
  const val = generator.valueToCode(block, 'VAL', ArduinoGenerator.PRECEDENCE_ATOMIC) || '0';
  const f1 = generator.valueToCode(block, 'F1', ArduinoGenerator.PRECEDENCE_ATOMIC) || '0';
  const t1 = generator.valueToCode(block, 'T1', ArduinoGenerator.PRECEDENCE_ATOMIC) || '1023';
  const f2 = generator.valueToCode(block, 'F2', ArduinoGenerator.PRECEDENCE_ATOMIC) || '0';
  const t2 = generator.valueToCode(block, 'T2', ArduinoGenerator.PRECEDENCE_ATOMIC) || '255';
  return [`map(${val}, ${f1}, ${t1}, ${f2}, ${t2})`, ArduinoGenerator.PRECEDENCE_ATOMIC];
};

FB['arduino_ultrasonic_read'] = function(block, generator) {
  const trig = block.getFieldValue('TRIG');
  const echo = block.getFieldValue('ECHO');
  // 복잡한 초음파 계산식을 한 줄의 함수 호출 형태로 변환 (GPT 채점용)
  return [`readUltrasonicDistance(${trig}, ${echo})`, ArduinoGenerator.PRECEDENCE_ATOMIC];
};

FB['arduino_servo_write'] = function(block, generator) {
  const pin = block.getFieldValue('PIN');
  const deg = generator.valueToCode(block, 'DEGREE', ArduinoGenerator.PRECEDENCE_ATOMIC) || '90';
  return `servo.write(${deg});`;
};

FB['arduino_serial_begin'] = function(block, generator) {
  const speed = block.getFieldValue('SPEED');
  return `Serial.begin(${speed});`;
};

FB['arduino_serial_print'] = function(block, generator) {
  const content = generator.valueToCode(block, 'CONTENT', ArduinoGenerator.PRECEDENCE_ATOMIC) || '""';
  const newline = block.getFieldValue('NEWLINE') === 'TRUE';
  return `Serial.print${newline ? 'ln' : ''}(${content});`;
};

FB['arduino_tone'] = function(block, generator) {
  const pin = block.getFieldValue('PIN');
  const freq = generator.valueToCode(block, 'FREQ', ArduinoGenerator.PRECEDENCE_ATOMIC) || '1000';
  return `tone(${pin}, ${freq});`;
};

FB['arduino_notone'] = function(block, generator) {
  const pin = block.getFieldValue('PIN');
  return `noTone(${pin});`;
};

// --- 기본 블록들 ---

FB['controls_if'] = function(block, generator) {
  let n = 0;
  let code = '';
  do {
    const condition = generator.valueToCode(block, 'IF' + n, ArduinoGenerator.PRECEDENCE_ATOMIC) || 'false';
    const branch = generator.statementToCode(block, 'DO' + n);
    code += (n > 0 ? ' else ' : '') + `if (${condition}) {\n${branch}}`;
    n++;
  } while (block.getInput('IF' + n));

  if (block.getInput('ELSE')) {
    const branch = generator.statementToCode(block, 'ELSE');
    code += ` else {\n${branch}}`;
  }
  return code + '\n';
};

FB['logic_compare'] = function(block, generator) {
  const ops = { 'EQ': '==', 'NEQ': '!=', 'LT': '<', 'LTE': '<=', 'GT': '>', 'GTE': '>=' };
  const op = ops[block.getFieldValue('OP')];
  const a = generator.valueToCode(block, 'A', ArduinoGenerator.PRECEDENCE_ATOMIC) || '0';
  const b = generator.valueToCode(block, 'B', ArduinoGenerator.PRECEDENCE_ATOMIC) || '0';
  return [`${a} ${op} ${b}`, ArduinoGenerator.PRECEDENCE_ATOMIC];
};

FB['logic_operation'] = function(block, generator) {
  const op = block.getFieldValue('OP') === 'AND' ? '&&' : '||';
  const a = generator.valueToCode(block, 'A', ArduinoGenerator.PRECEDENCE_ATOMIC) || 'true';
  const b = generator.valueToCode(block, 'B', ArduinoGenerator.PRECEDENCE_ATOMIC) || 'true';
  return [`${a} ${op} ${b}`, ArduinoGenerator.PRECEDENCE_ATOMIC];
};

FB['math_number'] = function(block) {
  const num = parseFloat(block.getFieldValue('NUM'));
  return [num, ArduinoGenerator.PRECEDENCE_ATOMIC];
};

FB['math_arithmetic'] = function(block, generator) {
  const ops = { 'ADD': '+', 'MINUS': '-', 'MULTIPLY': '*', 'DIVIDE': '/', 'POWER': '^' };
  const op = ops[block.getFieldValue('OP')];
  const a = generator.valueToCode(block, 'A', ArduinoGenerator.PRECEDENCE_ATOMIC) || '0';
  const b = generator.valueToCode(block, 'B', ArduinoGenerator.PRECEDENCE_ATOMIC) || '0';
  return [`${a} ${op} ${b}`, ArduinoGenerator.PRECEDENCE_ATOMIC];
};

FB['variables_get'] = function(block) {
  const varName = block.getField('VAR').getText();
  return [varName, ArduinoGenerator.PRECEDENCE_ATOMIC];
};

FB['variables_set'] = function(block, generator) {
  const varName = block.getField('VAR').getText();
  const val = generator.valueToCode(block, 'VALUE', ArduinoGenerator.PRECEDENCE_ATOMIC) || '0';
  return `${varName} = ${val};\n`;
};

} // end if (typeof Blockly !== 'undefined')
