export const renderer = (() => {
  let canvas, ctx, wrap, engine;
  let rafId = null;

  function init({ canvas: c, wrap: w, engine: eng }) {
    canvas = c;
    wrap = w;
    engine = eng;
    ctx = canvas?.getContext('2d') ?? null;

    sizeCanvas();
    engine.resetZoom(wrap.clientWidth, wrap.clientHeight);
    updateZoomLabel();
    drawAll();

    window.addEventListener('resize', onResize);
  }

  function onResize() {
    sizeCanvas();
  }

  function sizeCanvas() {
    if (!canvas || !wrap) return;
    canvas.width = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
  }

  function updateZoomLabel() {
    const el = document.getElementById('zoomLabel');
    if (el) el.textContent = Math.round(engine.state.scale * 100) + '%';
  }

  // ---------------- DRAW HELPERS ----------------
  function rr(x, y, w, h, r, stroke = true) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
    if (stroke) ctx.stroke();
  }

  function drawBg() {
    const { w, h } = engine.calcWorldSize();
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(-500, -500, w + 1000, h + 1000);
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    const gs = 20;
    for (let x = -500; x < w + 1000; x += gs) { ctx.beginPath(); ctx.moveTo(x, -500); ctx.lineTo(x, h + 1000); ctx.stroke(); }
    for (let y = -500; y < h + 1000; y += gs) { ctx.beginPath(); ctx.moveTo(-500, y); ctx.lineTo(w + 1000, y); ctx.stroke(); }
  }

  function drawArduino() {
    const { ARD_X, ARD_Y, ARD_W, ARD_H } = engine;
    const PINS = engine.state.PINS;

    const x = ARD_X, y = ARD_Y, w = ARD_W, h = ARD_H;
    ctx.fillStyle = '#006468'; ctx.strokeStyle = '#004448'; ctx.lineWidth = 2;
    rr(x, y, w, h, 8);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 14px Space Mono'; ctx.textAlign = 'center';
    ctx.fillText('ARDUINO', x + w / 2, y + 30);

    const groups = [
      { ids: Array.from({ length: 14 }, (_, i) => `D${i}`), label: 'DIGITAL' },
      { ids: ['GND0', 'GND1', 'GND2'], label: 'GND' },
      { ids: ['5V', '3V3'], label: 'POWER' },
      { ids: Array.from({ length: 6 }, (_, i) => `A${i}`), label: 'ANALOG' },
    ];
    groups.forEach(g => {
      const f = PINS[g.ids[0]], l = PINS[g.ids[g.ids.length - 1]];
      if (!f || !l) return;
      ctx.fillStyle = '#aadddd'; ctx.font = '10px Space Mono'; ctx.textAlign = 'left';
      ctx.fillText(g.label, ARD_X + 15, (f.y + l.y) / 2 + 4);
    });

    Object.entries(PINS).forEach(([id, p]) => {
      if (['main','Trail+','Trail-'].includes(p.group)) return;
      ctx.fillStyle = '#222222'; ctx.fillRect(p.x - 6, p.y - 5, 12, 10);
      ctx.strokeStyle = p.color; ctx.lineWidth = 1; ctx.strokeRect(p.x - 6, p.y - 5, 12, 10);
      ctx.fillStyle = p.color; ctx.font = '8px Space Mono'; ctx.textAlign = 'right'; ctx.fillText(p.label, p.x - 10, p.y + 3);
    });
  }

  function drawBreadboard() {
    const { HOLE, BB_PAD, BB_X, BB_Y, COL_NAMES } = engine;
    const railTopY = BB_Y + BB_PAD, mainTopY = railTopY + 36, gapY = mainTopY + 5 * HOLE + 8, railBotY = gapY + 5 * HOLE + 10;
    const bbW = BB_PAD * 2 + 29 * HOLE, bbH = railBotY + 24 - BB_Y;

    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 2;
    rr(BB_X, BB_Y, bbW, bbH, 8);

    // top rail
    ctx.fillStyle = '#f8f9fa'; rr(BB_X + 8, railTopY - 6, bbW - 16, 24, 4, false);
    ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#ff4444'; ctx.beginPath(); ctx.moveTo(BB_X + 18, railTopY); ctx.lineTo(BB_X + bbW - 18, railTopY); ctx.stroke();
    ctx.strokeStyle = '#4466ff'; ctx.beginPath(); ctx.moveTo(BB_X + 18, railTopY + 12); ctx.lineTo(BB_X + bbW - 18, railTopY + 12); ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = 'bold 11px Space Mono'; ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4444'; ctx.fillText('+', BB_X + 11, railTopY + 4);
    ctx.fillStyle = '#4466ff'; ctx.fillText('-', BB_X + 11, railTopY + 15);

    [1, 5, 10, 15, 20, 25, 30].forEach(n => {
      ctx.fillStyle = '#888888'; ctx.font = '7px Space Mono'; ctx.textAlign = 'center';
      ctx.fillText(n, BB_X + BB_PAD + (n - 1) * HOLE, BB_Y + 10);
    });
    COL_NAMES.slice(0, 5).forEach((col, ci) => {
      ctx.fillStyle = '#888888'; ctx.font = '8px Space Mono'; ctx.textAlign = 'center';
      ctx.fillText(col, BB_X + 8, mainTopY + ci * HOLE + 3);
    });
    COL_NAMES.slice(5, 10).forEach((col, ci) => {
      ctx.fillStyle = '#888888'; ctx.font = '8px Space Mono'; ctx.textAlign = 'center';
      ctx.fillText(col, BB_X + 8, gapY + ci * HOLE + 3);
    });

    ctx.fillStyle = '#e5e7eb'; ctx.fillRect(BB_X + BB_PAD - 2, gapY - 14, bbW - BB_PAD * 2 + 4, 8);

    // bottom rail
    ctx.fillStyle = '#f8f9fa'; rr(BB_X + 8, railBotY - 6, bbW - 16, 24, 4, false);
    ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#ff4444'; ctx.beginPath(); ctx.moveTo(BB_X + 18, railBotY); ctx.lineTo(BB_X + bbW - 18, railBotY); ctx.stroke();
    ctx.strokeStyle = '#4466ff'; ctx.beginPath(); ctx.moveTo(BB_X + 18, railBotY + 12); ctx.lineTo(BB_X + bbW - 18, railBotY + 12); ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = 'bold 11px Space Mono'; ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4444'; ctx.fillText('+', BB_X + 11, railBotY + 4);
    ctx.fillStyle = '#4466ff'; ctx.fillText('-', BB_X + 11, railBotY + 15);
  }

  function getCompPinIds() {
    const ids = new Set();
    engine.getActiveComponents().forEach((c) => {
      if (c.type === 'ultrasonic') {
        ids.add(c.pinVCC); ids.add(c.pinTRIG); ids.add(c.pinECHO); ids.add(c.pinGND);
      } else if (c.type === 'servo' || c.type === 'potentiometer') {
        ids.add(c.pinVCC); ids.add(c.pinSIG); ids.add(c.pinGND);
      } else if (c.type === 'slideswitch') {
        ids.add(c.pinCOM); ids.add(c.pinON1); ids.add(c.pinON2);
      } else {
        ids.add(c.pin1); ids.add(c.pin2);
        if (c.pin3) ids.add(c.pin3);
        if (c.pin4) ids.add(c.pin4);
      }
    });
    return ids;
  }

  function drawResistor(c, hovered = false) {
    const PINS = engine.state.PINS;
    const p1 = PINS[c.pin1], p2 = PINS[c.pin2];
    if (!p1 || !p2) return;

    const x1 = p1.x, x2 = p2.x, pinY = p1.y, midX = (x1 + x2) / 2;
    const bodyW = (x2 - x1) * 0.55, bodyH = 10, liftY = pinY - 52;

    ctx.strokeStyle = '#999'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, pinY); ctx.lineTo(midX - bodyW / 2, liftY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, pinY); ctx.lineTo(midX + bodyW / 2, liftY); ctx.stroke();

    const hh = bodyH / 2, hw = bodyW / 2, bulge = 4;
    ctx.fillStyle = '#e5c07b'; ctx.strokeStyle = '#b89554'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(midX - hw, liftY - hh); ctx.lineTo(midX + hw, liftY - hh);
    ctx.bezierCurveTo(midX + hw + bulge, liftY - hh * 0.5, midX + hw + bulge, liftY + hh * 0.5, midX + hw, liftY + hh);
    ctx.lineTo(midX - hw, liftY + hh);
    ctx.bezierCurveTo(midX - hw - bulge, liftY + hh * 0.5, midX - hw - bulge, liftY - hh * 0.5, midX - hw, liftY - hh);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    const bw = 2.2, bh = bodyH + 4;
    [{ c: '#8B4513', x: -0.35 }, { c: '#111111', x: -0.12 }, { c: '#ff2200', x: 0.11 }, { c: '#cccc00', x: 0.34 }].forEach(b => {
      ctx.fillStyle = b.c; ctx.fillRect(midX + b.x * bodyW - bw / 2, liftY - bh / 2, bw, bh);
    });
    ctx.fillStyle = '#6b7280'; ctx.font = 'bold 10px Space Mono'; ctx.textAlign = 'center';
    ctx.fillText(c.label ?? 'R', midX, liftY - hh - 7);

    // 호버 하이라이트
    if (hovered) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 8;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(midX - hw - 6, liftY - hh - 6); ctx.lineTo(midX + hw + 6, liftY - hh - 6);
      ctx.lineTo(midX + hw + 6, liftY + hh + 6); ctx.lineTo(midX - hw - 6, liftY + hh + 6); ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]); ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  function drawLED(c, hovered = false) {
    const PINS = engine.state.PINS;
    const p1 = PINS[c.pin1], p2 = PINS[c.pin2];
    if (!p1 || !p2) return;

    const lx1 = p1.x, lx2 = p2.x, ly1 = p1.y, ly2 = p2.y, cx = (lx1 + lx2) / 2, pinTopY = Math.min(ly1, ly2);
    const legLen = 32, bodyH = 14, bodyW = 16, domeR = 8, bodyBotY = pinTopY - legLen, bodyTopY = bodyBotY - bodyH;

    ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(lx1, ly1); ctx.lineTo(lx1, bodyBotY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx2, ly2); ctx.lineTo(lx2, bodyBotY); ctx.stroke();

    ctx.fillStyle = '#991b1b'; ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.rect(cx - bodyW / 2, bodyTopY, bodyW, bodyH); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, bodyTopY, domeR, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.arc(cx - 2, bodyTopY - 2, domeR * 0.4, 0, Math.PI * 2); ctx.fill();

    ctx.font = 'bold 7px Space Mono'; ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444'; ctx.fillText('+', lx1, ly1 + 11);
    ctx.fillStyle = '#3b82f6'; ctx.fillText('−', lx2, ly2 + 11);
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 10px Space Mono';
    ctx.fillText(c.label ?? 'LED', cx, bodyTopY - domeR - 5);

    // 호버 하이라이트
    if (hovered) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 8;
      ctx.setLineDash([4, 3]);
      const hlTop = bodyTopY - domeR - 6, hlBot = bodyBotY + 4;
      ctx.beginPath();
      ctx.roundRect(cx - bodyW / 2 - 6, hlTop, bodyW + 12, hlBot - hlTop, 6);
      ctx.stroke();
      ctx.setLineDash([]); ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  function drawBuzzer(c, hovered = false) {
    const PINS = engine.state.PINS;
    const p1 = PINS[c.pin1], p2 = PINS[c.pin2]; // p1은 (+), p2는 (-)
    if (!p1 || !p2) return;

    const x1 = p1.x, x2 = p2.x, cy = (p1.y + p2.y) / 2;
    const midX = (x1 + x2) / 2;
    const bodyR = 18, bodyH = 14, liftY = p1.y - 22;

    // 다리
    ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, p1.y); ctx.lineTo(x1, liftY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, p2.y); ctx.lineTo(x2, liftY); ctx.stroke();

    // 몸체 (검은색 원통)
    ctx.fillStyle = '#1f2937'; ctx.strokeStyle = '#111827'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(midX, liftY, bodyR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    
    // 중앙 구멍
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(midX, liftY, 4, 0, Math.PI * 2); ctx.fill();

    // 상단 (+) 표시
    ctx.fillStyle = '#ef4444'; ctx.font = 'bold 10px Space Mono'; ctx.textAlign = 'center';
    ctx.fillText('+', x1, liftY - 4);

    ctx.fillStyle = '#9ca3af'; ctx.font = 'bold 8px Space Mono'; ctx.textAlign = 'center';
    ctx.fillText(c.label ?? 'Buzzer', midX, liftY + bodyR + 10);

    if (hovered) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 8;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.arc(midX, liftY, bodyR + 4, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }

  function drawPhotoresistor(c, hovered = false) {
    const PINS = engine.state.PINS;
    const p1 = PINS[c.pin1], p2 = PINS[c.pin2];
    if (!p1 || !p2) return;

    const x1 = p1.x, x2 = p2.x, pinY = p1.y, midX = (x1 + x2) / 2;
    const bodyW = 20, bodyH = 14, liftY = pinY - 52;

    ctx.strokeStyle = '#888'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, pinY); ctx.lineTo(midX - bodyW / 2 + 2, liftY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, pinY); ctx.lineTo(midX + bodyW / 2 - 2, liftY); ctx.stroke();

    ctx.fillStyle = '#fef3c7'; ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(midX, liftY, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(midX - 7, liftY - 4); ctx.lineTo(midX - 3, liftY + 4); ctx.lineTo(midX + 1, liftY - 4);
    ctx.lineTo(midX + 5, liftY + 4); ctx.stroke();

    ctx.fillStyle = '#6b7280'; ctx.font = 'bold 10px Space Mono'; ctx.textAlign = 'center';
    ctx.fillText(c.label ?? 'CdS', midX, liftY - 14);

    if (hovered) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 8;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.arc(midX, liftY, 14, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }

  // ✅ 4핀 버튼 렌더링 (좌상:e20 우상:e22 좌하:f20 우하:f22)
  function drawButton(c, hovered = false) {
    const PINS = engine.state.PINS;
    const p1 = PINS[c.pin1]; // e20 좌상단
    const p2 = PINS[c.pin2]; // e22 우상단
    const p3 = PINS[c.pin3]; // f20 좌하단
    const p4 = PINS[c.pin4]; // f22 우하단
    if (!p1 || !p2 || !p3 || !p4) return;

    const pressed = engine.state.buttonPressed;
    const cx = (p1.x + p2.x + p3.x + p4.x) / 4;
    const cy = (p1.y + p2.y + p3.y + p4.y) / 4;
    const bw = 38, bh = 38;

    ctx.strokeStyle = '#888'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p1.x, cy - bh / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p2.x, p2.y); ctx.lineTo(p2.x, cy - bh / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p3.x, cy + bh / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p4.x, p4.y); ctx.lineTo(p4.x, cy + bh / 2); ctx.stroke();

    ctx.fillStyle = pressed ? '#c0c0c0' : '#b8b8b8';
    ctx.strokeStyle = '#777'; ctx.lineWidth = 1.5;
    rr(cx - bw / 2, cy - bh / 2, bw, bh, 5);

    [[p1.x, cy - bh / 2 + 5], [p2.x, cy - bh / 2 + 5],
     [p3.x, cy + bh / 2 - 5], [p4.x, cy + bh / 2 - 5]].forEach(([px, py]) => {
      ctx.fillStyle = '#555';
      ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fill();
    });

    ctx.fillStyle = '#666';
    ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pressed ? '#3a3a3a' : '#1a1a1a';
    ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();

    if (pressed) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath(); ctx.arc(cx - 2, cy - 2, 4, 0, Math.PI * 2); ctx.fill();
    }

    ctx.font = 'bold 6px Space Mono'; ctx.fillStyle = '#4b5563'; ctx.textAlign = 'center';
    ctx.fillText(pressed ? 'ON' : 'BTN', cx, cy - bh / 2 - 4);

    // 호버 하이라이트
    if (hovered) {
      ctx.save();
      ctx.fillStyle = 'transparent';
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 8;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.roundRect(cx - bw / 2 - 6, cy - bh / 2 - 6, bw + 12, bh + 12, 8);
      ctx.stroke();
      ctx.setLineDash([]); ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  function drawUltrasonic(c, hovered = false) {
    const PINS = engine.state.PINS;
    const pV = PINS[c.pinVCC], pT = PINS[c.pinTRIG], pE = PINS[c.pinECHO], pG = PINS[c.pinGND];
    if (!pV || !pT || !pE || !pG) return;

    const pinY  = pV.y;
    const cx    = (pV.x + pG.x) / 2;
    const bw    = (pG.x - pV.x) + 28;
    const bh    = 44;
    const bx    = cx - bw / 2;
    const by    = pinY - 16 - bh;

    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    [pV, pT, pE, pG].forEach(p => {
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, by + bh); ctx.stroke();
    });

    ctx.fillStyle = '#1a6b1a'; ctx.strokeStyle = '#145214'; ctx.lineWidth = 1.5;
    rr(bx, by, bw, bh, 5);

    const eyeY = by + bh * 0.42;
    [-1, 1].forEach(side => {
      const ex = cx + side * 11;
      ctx.fillStyle = '#c0a000'; ctx.strokeStyle = '#8a7000'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(ex, eyeY, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(ex, eyeY, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.arc(ex - 2, eyeY - 2, 2.5, 0, Math.PI * 2); ctx.fill();
    });

    ctx.font = 'bold 6px Space Mono'; ctx.textAlign = 'center';
    [[pV, 'VCC'], [pT, 'TRIG'], [pE, 'ECHO'], [pG, 'GND']].forEach(([p, lbl]) => {
      ctx.fillStyle = lbl === 'VCC' ? '#ff2222' : lbl === 'GND' ? '#2255ff' : lbl === 'TRIG' ? '#ff8800' : '#00bb88';
      ctx.fillText(lbl, p.x, by + bh + 10);
    });

    ctx.fillStyle = '#aaffaa'; ctx.font = 'bold 7px Space Mono'; ctx.textAlign = 'center';
    ctx.fillText(c.label ?? 'HC-SR04', cx, by + 10);

    // 호버 하이라이트
    if (hovered) {
      ctx.save();
      ctx.fillStyle = 'transparent';
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 10;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.roundRect(bx - 6, by - 6, bw + 12, bh + 12, 8);
      ctx.stroke();
      ctx.setLineDash([]); ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  function drawPotentiometer(c, hovered = false) {
    const PINS = engine.state.PINS;
    const pV = PINS[c.pinVCC], pS = PINS[c.pinSIG], pG = PINS[c.pinGND];
    if (!pV || !pS || !pG) return;

    const pinY = pV.y;
    const cx   = pS.x;
    const bw   = 36, bh = 36;
    const bx   = cx - bw / 2;
    const by   = pinY - 14 - bh;

    // ── 핀 다리 3개 ──
    [[pV, '#ff2222'], [pS, '#ff8800'], [pG, '#4466ff']].forEach(([p, col]) => {
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, by + bh); ctx.stroke();
    });

    // ── 몸체 ──
    const bodyGrad = ctx.createLinearGradient(bx, by, bx + bw, by);
    bodyGrad.addColorStop(0,   '#4a4a5a');
    bodyGrad.addColorStop(0.4, '#6a6a7e');
    bodyGrad.addColorStop(1,   '#4a4a5a');
    ctx.fillStyle = bodyGrad; ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
    rr(bx, by, bw, bh, 6);

    // ── 노브(다이얼) ──
    const knobR = 11, knobX = cx, knobY = by + bh / 2;
    ctx.fillStyle = '#888'; ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(knobX, knobY, knobR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b0b0b0';
    ctx.beginPath(); ctx.arc(knobX, knobY, knobR - 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(knobX, knobY);
    ctx.lineTo(knobX + (knobR - 5) * Math.cos(-Math.PI / 4), knobY + (knobR - 5) * Math.sin(-Math.PI / 4));
    ctx.stroke();
    ctx.fillStyle = '#444';
    ctx.beginPath(); ctx.arc(knobX, knobY, 2, 0, Math.PI * 2); ctx.fill();

    // ── 라벨 ──
    ctx.fillStyle = '#ccccff'; ctx.font = 'bold 7px Space Mono'; ctx.textAlign = 'center';
    ctx.fillText(c.label ?? 'POT', cx, by - 4);

    // ── 핀 라벨 ──
    ctx.font = 'bold 6px Space Mono'; ctx.textAlign = 'center';
    [[pV, 'VCC', '#ff4444'], [pS, 'SIG', '#ff8800'], [pG, 'GND', '#4466ff']].forEach(([p, lbl, col]) => {
      ctx.fillStyle = col;
      ctx.fillText(lbl, p.x, pinY + 11);
    });

    // ── 호버 하이라이트 ──
    if (hovered) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 10;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.roundRect(bx - 6, by - 18, bw + 12, bh + 24, 8);
      ctx.stroke();
      ctx.setLineDash([]); ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  function drawServo(c, hovered = false) {
    const PINS = engine.state.PINS;
    const pV = PINS[c.pinVCC], pG = PINS[c.pinGND], pS = PINS[c.pinSIG];
    if (!pV || !pG || !pS) return;

    const pinY = pV.y;
    const cx   = (pV.x + pG.x) / 2;
    const bw   = 64;
    const bh   = 52;
    const bx   = cx - bw / 2;
    const by   = pinY - 20 - bh;

    // ── 와이어 다리 (주황/빨강/갈색 3선) ──
    const wireColors = ['#cc4400', '#ff2222', '#663300']; // SIG, VCC, GND
    const wirePins   = [pS, pV, pG];
    wirePins.forEach((p, i) => {
      ctx.strokeStyle = wireColors[i]; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, by + bh + 2); ctx.stroke();
    });

    // ── 메인 몸체 (파란색 직사각형) ──
    const bodyGrad = ctx.createLinearGradient(bx, by, bx + bw, by);
    bodyGrad.addColorStop(0,   '#1a4fa0');
    bodyGrad.addColorStop(0.4, '#2266cc');
    bodyGrad.addColorStop(1,   '#1a4fa0');
    ctx.fillStyle = bodyGrad; ctx.strokeStyle = '#0d2d66'; ctx.lineWidth = 1.5;
    rr(bx, by, bw, bh, 5);

    // ── 몸체 위 탭 (양쪽 마운팅 이어) ──
    const tabW = 10, tabH = 8, tabY = by + bh * 0.3;
    ctx.fillStyle = '#1a4fa0'; ctx.strokeStyle = '#0d2d66'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(bx - tabW + 2, tabY, tabW, tabH, 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(bx - tabW + 4, tabY + tabH / 2, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#0d2d66'; ctx.fill();
    ctx.fillStyle = '#1a4fa0'; ctx.strokeStyle = '#0d2d66';
    ctx.beginPath(); ctx.roundRect(bx + bw - 2, tabY, tabW, tabH, 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(bx + bw + tabW - 4, tabY + tabH / 2, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#0d2d66'; ctx.fill();

    // ── 기어 박스 ──
    const gearR = 13, gearX = cx, gearY = by + 14;
    ctx.fillStyle = '#1555bb'; ctx.strokeStyle = '#0d2d66'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(gearX, gearY, gearR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#aaaaaa'; ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(gearX, gearY, gearR - 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#dddddd';
    ctx.beginPath(); ctx.arc(gearX, gearY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#999';
    ctx.beginPath(); ctx.arc(gearX, gearY, 2.5, 0, Math.PI * 2); ctx.fill();

    // ── 혼 (회전 암) ──
    const hornY = by - 5;
    ctx.save();
    ctx.translate(gearX, gearY);
    ctx.fillStyle = '#eeeeee'; ctx.strokeStyle = '#aaaaaa'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-4, -(gearY - hornY) - 18, 8, 22, 3);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#bbbbbb';
    ctx.beginPath(); ctx.arc(0, -(gearY - hornY) - 14, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#888';
    ctx.beginPath(); ctx.arc(0, -(gearY - hornY) - 14, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();

    // ── 라벨 ──
    ctx.fillStyle = '#aaccff'; ctx.font = 'bold 7px Space Mono'; ctx.textAlign = 'center';
    ctx.fillText(c.label ?? 'Servo', cx, by + bh - 6);

    // ── 핀 라벨 ──
    ctx.font = 'bold 6px Space Mono'; ctx.textAlign = 'center';
    [[pV, 'VCC', '#ff4444'], [pS, 'SIG', '#ff8800'], [pG, 'GND', '#4466ff']].forEach(([p, lbl, col]) => {
      ctx.fillStyle = col;
      ctx.fillText(lbl, p.x, pinY + 11);
    });

    // ── 호버 하이라이트 ──
    if (hovered) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 10;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.roundRect(bx - tabW - 4, by - 30, bw + tabW * 2 + 8, bh + 50, 8);
      ctx.stroke();
      ctx.setLineDash([]); ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  function drawSlideSwitch(c, hovered = false) {
    const PINS = engine.state.PINS;
    const pN1 = PINS[c.pinON1];  // 왼쪽  (터미널1)
    const pC  = PINS[c.pinCOM];  // 가운데 (공통)
    const pN2 = PINS[c.pinON2];  // 오른쪽 (터미널2)
    if (!pC || !pN1 || !pN2) return;

    const pinY = pN1.y;
    const cx   = pC.x;                      // 가운데 핀이 중심
    const bw   = (pN2.x - pN1.x) + 20;
    const bh   = 30;
    const bx   = pN1.x - 10;
    const by   = pinY - 12 - bh;

    // ── 핀 다리 3개 (왼:ON1 / 가운데:COM / 오른:ON2) ──
    [[pN1, '#44cc88'], [pC, '#ff8800'], [pN2, '#4488ff']].forEach(([p, col]) => {
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, by + bh); ctx.stroke();
    });

    // ── 몸체 ──
    ctx.fillStyle = '#2a2a3a'; ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5;
    rr(bx, by, bw, bh, 5);

    // ── 슬라이드 레일 ──
    const railY = by + bh / 2;
    const railX1 = bx + 6, railX2 = bx + bw - 6;
    ctx.fillStyle = '#111'; ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
    rr(railX1 - 2, railY - 4, railX2 - railX1 + 4, 8, 3);

    // ── 슬라이더 노브 (ON1 쪽으로 치우침) ──
    const knobX = pN1.x;
    ctx.fillStyle = '#cccccc'; ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
    rr(knobX - 6, railY - 7, 12, 14, 3);
    ctx.fillStyle = '#888';
    ctx.fillRect(knobX - 3, railY - 4, 6, 8);

    // ── 라벨 ──
    ctx.fillStyle = '#aaffcc'; ctx.font = 'bold 7px Space Mono'; ctx.textAlign = 'center';
    ctx.fillText(c.label ?? 'SW', cx, by - 4);

    // ── 핀 라벨 (왼:ON1 / 가운데:COM / 오른:ON2) ──
    ctx.font = 'bold 6px Space Mono'; ctx.textAlign = 'center';
    [[pN1, 'ON1', '#44cc88'], [pC, 'COM', '#ff8800'], [pN2, 'ON2', '#4488ff']].forEach(([p, lbl, col]) => {
      ctx.fillStyle = col;
      ctx.fillText(lbl, p.x, pinY + 11);
    });

    // ── 호버 하이라이트 ──
    if (hovered) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 10;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.roundRect(bx - 6, by - 16, bw + 12, bh + 22, 8);
      ctx.stroke();
      ctx.setLineDash([]); ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  function drawComponents() {
    const hovIdx = engine.state.hoveredComp;
    engine.getActiveComponents().forEach((c, i) => {
      const hovered = i === hovIdx;
      if (c.type === 'resistor')      drawResistor(c, hovered);
      if (c.type === 'photoresistor') drawPhotoresistor(c, hovered);
      if (c.type === 'led')           drawLED(c, hovered);
      if (c.type === 'buzzer')        drawBuzzer(c, hovered);
      if (c.type === 'button')        drawButton(c, hovered);
      if (c.type === 'ultrasonic')    drawUltrasonic(c, hovered);
      if (c.type === 'potentiometer') drawPotentiometer(c, hovered);
      if (c.type === 'servo')         drawServo(c, hovered);
      if (c.type === 'slideswitch')   drawSlideSwitch(c, hovered);
    });
  }

  function drawPins() {
    const { PINS, wires, startPin } = engine.state;
    const compPins = getCompPinIds();

    Object.entries(PINS).forEach(([id, p]) => {
      const isSel = startPin === id;
      const isConn = wires.some(w => w.from === id || w.to === id);
      const isComp = compPins.has(id);

      if (isComp) {
        const comp = engine.getActiveComponents().find(c =>
          c.pin1 === id || c.pin2 === id ||
          c.pinVCC === id || c.pinGND === id || c.pinSIG === id ||
          c.pinTRIG === id || c.pinECHO === id ||
          c.pinCOM === id || c.pinON1 === id || c.pinON2 === id
        );
        ctx.fillStyle = (comp && comp.type === 'led')
          ? ((id === comp.pin1) ? '#ff5555' : '#7777cc')
          : '#cc9933';

        ctx.beginPath(); ctx.arc(p.x, p.y, engine.HOLE_R + 1, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = isSel ? '#222' : 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, engine.HOLE_R + 1, 0, Math.PI * 2); ctx.stroke();
        if (isSel) {
          ctx.strokeStyle = '#222';
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(p.x, p.y, engine.HOLE_R + 1.5, 0, Math.PI * 2); ctx.stroke();
        }
        return;
      }

      if (['main','Trail+','Trail-'].includes(p.group)) {
        ctx.fillStyle = isConn ? p.color : (isSel ? '#222' : '#888');
        ctx.beginPath(); ctx.arc(p.x, p.y, engine.HOLE_R, 0, Math.PI * 2); ctx.fill();
        if (isSel) {
          ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(p.x, p.y, engine.HOLE_R + 1.5, 0, Math.PI * 2); ctx.stroke();
        }
      } else {
        ctx.fillStyle = isSel ? '#222' : (isConn ? p.color : 'rgba(255,255,255,0.5)');
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
        if (isSel) {
          ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.stroke();
        }
      }
    });
  }

  function wirePath(x1, y1, x2, y2, color, lw, selected, isDrag) {
    const { cx1, cy1, cx2, cy2 } = engine.wireControlPoints(x1, y1, x2, y2);

    if (selected) {
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = lw + 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2); ctx.stroke();
    }

    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
    ctx.shadowColor = color; ctx.shadowBlur = selected ? 10 : 4;

    if (isDrag) {
      ctx.setLineDash([6 / engine.state.scale, 4 / engine.state.scale]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2); ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2); ctx.stroke();


    }
    ctx.shadowBlur = 0;
  }

  function drawWires() {
    const { wires, PINS, selectedWire } = engine.state;
    wires.forEach((w, idx) => {
      const fp = PINS[w.from], tp = PINS[w.to]; if (!fp || !tp) return;
      wirePath(fp.x, fp.y, tp.x, tp.y, w.color, idx === selectedWire ? 5 : 3, idx === selectedWire, false);
    });
  }

  function drawDragging() {
    const { startPin, PINS, wireColor, mouseWorldX, mouseWorldY } = engine.state;
    if (!startPin) return;
    wirePath(PINS[startPin].x, PINS[startPin].y, mouseWorldX, mouseWorldY, wireColor, 2, false, true);
  }

  function drawSnapPreview() {
    const drag = engine.state.draggingComp;
    if (!drag) return;

    const comp = engine.state.components[drag.index];
    const PINS = engine.state.PINS;

    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 8;
    ctx.setLineDash([4, 3]);

    // ── 초음파 센서 ──
    if (comp.type === 'ultrasonic') {
      const pV = PINS[drag.snapPinVCC];
      const pG = PINS[drag.snapPinGND];
      if (!pV || !pG) { ctx.restore(); return; }
      const cx = (pV.x + pG.x) / 2;
      const bw = (pG.x - pV.x) + 28;
      const bh = 44;
      const bx = cx - bw / 2;
      const by = pV.y - 16 - bh;
      // 외곽선만
      ctx.beginPath();
      ctx.roundRect(bx - 6, by - 6, bw + 12, bh + 12, 8);
      ctx.stroke();

    // ── 버튼 ──
    } else if (comp.type === 'button') {
      const p1 = PINS[drag.snapPin1], p2 = PINS[drag.snapPin2];
      const p3 = PINS[drag.snapPin3], p4 = PINS[drag.snapPin4];
      if (!p1 || !p2 || !p3 || !p4) { ctx.restore(); return; }
      const cx = (p1.x + p2.x + p3.x + p4.x) / 4;
      const cy = (p1.y + p2.y + p3.y + p4.y) / 4;
      const bw = 38, bh = 38;
      ctx.beginPath();
      ctx.roundRect(cx - bw / 2 - 6, cy - bh / 2 - 6, bw + 12, bh + 12, 8);
      ctx.stroke();

    // ── 저항 ──
    } else if (comp.type === 'resistor') {
      const p1 = PINS[drag.snapPin1], p2 = PINS[drag.snapPin2];
      if (!p1 || !p2) { ctx.restore(); return; }
      const midX = (p1.x + p2.x) / 2;
      const bodyW = (p2.x - p1.x) * 0.55;
      const liftY = p1.y - 52;
      const hw = bodyW / 2, hh = 5;
      ctx.beginPath();
      ctx.roundRect(midX - hw - 6, liftY - hh - 6, hw * 2 + 12, hh * 2 + 12, 4);
      ctx.stroke();

    // ── LED ──
    } else if (comp.type === 'led') {
      const p1 = PINS[drag.snapPin1], p2 = PINS[drag.snapPin2];
      if (!p1 || !p2) { ctx.restore(); return; }
      const cx = (p1.x + p2.x) / 2;
      const pinTopY = Math.min(p1.y, p2.y);
      const bodyBotY = pinTopY - 32;
      const bodyTopY = bodyBotY - 14;
      ctx.beginPath();
      ctx.roundRect(cx - 14, bodyTopY - 14, 28, bodyBotY - bodyTopY + 20, 6);
      ctx.stroke();

    // ── 조도 센서 ──
    } else if (comp.type === 'photoresistor') {
      const p1 = PINS[drag.snapPin1], p2 = PINS[drag.snapPin2];
      if (!p1 || !p2) { ctx.restore(); return; }
      const midX = (p1.x + p2.x) / 2;
      const liftY = p1.y - 52;
      ctx.beginPath();
      ctx.arc(midX, liftY, 14, 0, Math.PI * 2);
      ctx.stroke();

    // ── 부저 ──
    } else if (comp.type === 'buzzer') {
      const p1 = PINS[drag.snapPin1], p2 = PINS[drag.snapPin2];
      if (!p1 || !p2) { ctx.restore(); return; }
      const midX = (p1.x + p2.x) / 2;
      const liftY = p1.y - 22;
      ctx.beginPath();
      ctx.arc(midX, liftY, 22, 0, Math.PI * 2);
      ctx.stroke();

    // ── 서보 ──
    } else if (comp.type === 'servo') {
      const pV = PINS[drag.snapPinVCC], pG = PINS[drag.snapPinGND];
      if (!pV || !pG) { ctx.restore(); return; }
      const cx  = (pV.x + pG.x) / 2;
      const bw  = 64, bh = 52;
      const bx  = cx - bw / 2;
      const by  = pV.y - 20 - bh;
      ctx.beginPath();
      ctx.roundRect(bx - 6, by - 6, bw + 12, bh + 12, 8);
      ctx.stroke();

    // ── 가변저항 ──
    } else if (comp.type === 'potentiometer') {
      const pS = PINS[drag.snapPinSIG];
      if (!pS) { ctx.restore(); return; }
      const bw  = 36, bh = 36;
      const bx  = pS.x - bw / 2;
      const by  = pS.y - 14 - bh;
      ctx.beginPath();
      ctx.roundRect(bx - 6, by - 18, bw + 12, bh + 24, 8);
      ctx.stroke();

    // ── 슬라이드 스위치 ──
    } else if (comp.type === 'slideswitch') {
      const pN1 = PINS[drag.snapPinON1];
      const pN2 = PINS[drag.snapPinON2];
      if (!pN1 || !pN2) { ctx.restore(); return; }
      const bw = (pN2.x - pN1.x) + 20;
      const bh = 30;
      const bx = pN1.x - 10;
      const by = pN1.y - 12 - bh;
      ctx.beginPath();
      ctx.roundRect(bx - 6, by - 16, bw + 12, bh + 22, 8);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.restore();

    // 스냅될 핀들에 작은 원형 강조
    const snapPinIds =
      comp.type === 'ultrasonic'    ? [drag.snapPinVCC, drag.snapPinTRIG, drag.snapPinECHO, drag.snapPinGND] :
      comp.type === 'servo'         ? [drag.snapPinVCC, drag.snapPinSIG, drag.snapPinGND] :
      comp.type === 'potentiometer' ? [drag.snapPinVCC, drag.snapPinSIG, drag.snapPinGND] :
      comp.type === 'slideswitch'   ? [drag.snapPinCOM, drag.snapPinON1, drag.snapPinON2] :
      [drag.snapPin1, drag.snapPin2, drag.snapPin3, drag.snapPin4];
    snapPinIds.filter(Boolean).forEach(id => {
      const p = PINS[id];
      if (!p) return;
      ctx.save();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.arc(p.x, p.y, engine.HOLE_R + 4, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });
  }

  function drawAll() {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(engine.state.offsetX, engine.state.offsetY);
    ctx.scale(engine.state.scale, engine.state.scale);

    drawBg();
    drawArduino();
    drawBreadboard();
    drawPins();
    drawComponents();
    drawWires();
    drawDragging();
    drawSnapPreview();  // ✅ 드래그 스냅 미리보기

    ctx.restore();
    updateZoomLabel();
  }

  function startLoop() {
    const loop = () => {
      drawAll();
      rafId = requestAnimationFrame(loop);
    };
    if (rafId) cancelAnimationFrame(rafId);
    loop();
  }

  function stopLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  return { init, drawAll, startLoop, stopLoop, sizeCanvas, updateZoomLabel };
})();