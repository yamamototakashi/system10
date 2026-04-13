/* ===========================================================
 *  renderer.js — Canvas 描画・7セグ表示
 * =========================================================== */

/* ========== メイン描画 ========== */

G.render = function () {
  var ctx = G.ctx;
  ctx.save();

  // 背景クリア
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, G.cw, G.ch);

  // 仮想座標にスケール
  ctx.scale(G.sx, G.sy);

  if (G.state === G.S.TITLE) {
    drawField(G.demoL, G.demoR, G.demoB, 0, 0);
  } else {
    drawField(G.player, G.cpu, G.ball,
              G.player.score, G.cpu.score);
    if (G.state === G.S.COUNT) {
      drawCountdown();
    }
  }

  ctx.restore();
};

/* ========== フィールド描画 ========== */

function drawField(lp, rp, b, ls, rs) {
  var ctx = G.ctx;
  var VW  = G.VW;
  var VH  = G.VH;

  // 中央点線
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(VW / 2, 0);
  ctx.lineTo(VW / 2, VH);
  ctx.stroke();
  ctx.setLineDash([]);

  // 上下境界線
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 1);
  ctx.lineTo(VW, 1);
  ctx.moveTo(0, VH - 1);
  ctx.lineTo(VW, VH - 1);
  ctx.stroke();

  // パドル
  ctx.fillStyle = '#fff';
  ctx.fillRect(lp.x, lp.y, lp.w, lp.h);
  ctx.fillRect(rp.x, rp.y, rp.w, rp.h);

  // ボール
  ctx.fillRect(b.x - b.sz / 2, b.y - b.sz / 2, b.sz, b.sz);

  // スコア
  drawScore(ls, rs);
}

/* ========== スコア描画 ========== */

function drawScore(left, right) {
  G.ctx.fillStyle = 'rgba(255,255,255,0.7)';
  var dw = 24, dh = 40, y = 20;
  drawNumber(G.VW / 4,     y, dw, dh, left);
  drawNumber(G.VW * 3 / 4, y, dw, dh, right);
}

function drawNumber(cx, y, dw, dh, num) {
  if (num >= 10) {
    drawDigit(cx - dw - 3, y, dw, dh, Math.floor(num / 10));
    drawDigit(cx + 3,      y, dw, dh, num % 10);
  } else {
    drawDigit(cx - dw / 2, y, dw, dh, num);
  }
}

/* ========== 7セグメント 1桁描画 ========== */

function drawDigit(x, y, w, h, d) {
  var s = G.SEG[d];
  var t = Math.max(3, Math.round(h * 0.1)); // セグメント厚み
  var g = 2;                                  // 隙間

  //  _0_
  // 5   1
  //  _6_
  // 4   2
  //  _3_

  if (s[0]) G.ctx.fillRect(x + g,     y,              w - 2*g, t);          // top
  if (s[1]) G.ctx.fillRect(x + w - t,  y + g,          t,       h/2 - g);   // topR
  if (s[2]) G.ctx.fillRect(x + w - t,  y + h/2,        t,       h/2 - g);   // botR
  if (s[3]) G.ctx.fillRect(x + g,     y + h - t,       w - 2*g, t);         // bot
  if (s[4]) G.ctx.fillRect(x,         y + h/2,         t,       h/2 - g);   // botL
  if (s[5]) G.ctx.fillRect(x,         y + g,           t,       h/2 - g);   // topL
  if (s[6]) G.ctx.fillRect(x + g,     y + h/2 - t/2,  w - 2*g, t);         // mid
}

/* ========== カウントダウン描画 ========== */

function drawCountdown() {
  var ctx = G.ctx;

  // 半透明オーバーレイ
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, G.VW, G.VH);

  // 大きな 7セグ数字を中央に
  ctx.fillStyle = '#fff';
  var dw = 48, dh = 80;
  drawDigit(G.VW / 2 - dw / 2, G.VH / 2 - dh / 2, dw, dh, G.cdNum);
}
