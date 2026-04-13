/* ===========================================================
 *  game.js — ゲームオブジェクト・物理・AI・スコア
 * =========================================================== */

/* ---------- パドル生成 ---------- */
G.makePaddle = function (x) {
  return { x: x, y: G.VH / 2 - G.PADDLE_H / 2,
           w: G.PADDLE_W, h: G.PADDLE_H, score: 0 };
};

/* ---------- ゲームリセット ---------- */
G.resetGame = function () {
  G.player = G.makePaddle(G.PADDLE_MARGIN);
  G.cpu    = G.makePaddle(G.VW - G.PADDLE_MARGIN - G.PADDLE_W);
  G.player.score = 0;
  G.cpu.score    = 0;
  G.cpuErr  = 0;
  G.rally   = 0;
  G.winner  = '';
  G.lastScorer = '';
  G.prepareBall(Math.random() > 0.5 ? 1 : -1);
};

/* ---------- ボール準備（発射前） ---------- */
G.prepareBall = function (dir) {
  G.ball = {
    x: G.VW / 2,
    y: G.VH / 2,
    sz: G.BALL_SZ,
    speed: G.BALL_SPD0,
    vx: 0, vy: 0
  };
  G.serveDir = dir;
  G.rally = 0;
};

/* ---------- ボール発射 ---------- */
G.launchBall = function () {
  var angle = (Math.random() * 0.6 - 0.3); // ±17°
  G.ball.vx = Math.cos(angle) * G.ball.speed * G.serveDir;
  G.ball.vy = Math.sin(angle) * G.ball.speed;
};

/* ========== プレイ中の更新 ========== */

G.updatePlaying = function (dt) {
  G.updatePlayer(dt);
  G.updateCPU(dt);
  G.updateBall(dt);
};

/* ---------- プレイヤーパドル ---------- */
G.updatePlayer = function (dt) {
  if (G.ptrDown) {
    // 相対移動: タッチ開始時からの指の移動量だけパドルを動かす
    var delta = G.ptrY - G.ptrStartY;
    G.player.y = G.ptrPaddleStartY + delta;
  }
  // キーボード
  var ks = 300;
  if (G.keys['ArrowUp']   || G.keys['w'] || G.keys['W']) G.player.y -= ks * dt;
  if (G.keys['ArrowDown'] || G.keys['s'] || G.keys['S']) G.player.y += ks * dt;

  G.player.y = G.clamp(G.player.y, 0, G.VH - G.player.h);
};

/* ---------- CPU パドル ---------- */
G.updateCPU = function (dt) {
  var d = G.DIFF[G.diff];
  var target;

  if (G.ball.vx > 0) {
    // ボールが向かってくる → 追跡
    target = G.ball.y + G.cpuErr - G.cpu.h / 2;
  } else {
    // ボールが離れている → 中央へ
    target = G.VH / 2 - G.cpu.h / 2;
  }

  var delta   = target - G.cpu.y;
  var speed   = (G.ball.vx > 0) ? d.cpuSpd : d.drift;
  var maxMove = speed * dt;

  if (Math.abs(delta) > 2) {
    G.cpu.y += Math.sign(delta) * Math.min(Math.abs(delta), maxMove);
  }

  // 誤差を定期的に更新
  if (Math.random() < dt * 1.5) {
    G.cpuErr = (Math.random() - 0.5) * d.err * 2;
  }

  G.cpu.y = G.clamp(G.cpu.y, 0, G.VH - G.cpu.h);
};

/* ---------- ボール更新 ---------- */
G.updateBall = function (dt) {
  G.ball.x += G.ball.vx * dt;
  G.ball.y += G.ball.vy * dt;

  var hs = G.ball.sz / 2;

  // 上壁
  if (G.ball.y - hs < 0) {
    G.ball.y = hs;
    G.ball.vy = Math.abs(G.ball.vy);
    G.sndWall();
  }
  // 下壁
  if (G.ball.y + hs > G.VH) {
    G.ball.y = G.VH - hs;
    G.ball.vy = -Math.abs(G.ball.vy);
    G.sndWall();
  }

  // プレイヤーパドル（左）
  if (G.ball.vx < 0 && hitTest(G.player)) {
    bounce(G.player, 1);
  }
  // CPUパドル（右）
  if (G.ball.vx > 0 && hitTest(G.cpu)) {
    bounce(G.cpu, -1);
  }

  // 得点判定
  if (G.ball.x + hs < -10) {
    G.cpu.score++;
    handleScore('cpu');
  } else if (G.ball.x - hs > G.VW + 10) {
    G.player.score++;
    handleScore('player');
  }
};

/* ---------- 衝突判定 ---------- */
function hitTest(p) {
  var hs = G.ball.sz / 2;
  return (G.ball.x - hs < p.x + p.w &&
          G.ball.x + hs > p.x &&
          G.ball.y + hs > p.y &&
          G.ball.y - hs < p.y + p.h);
}

/* ---------- パドルバウンス ---------- */
function bounce(paddle, dir) {
  var hitPos = G.clamp((G.ball.y - paddle.y) / paddle.h, 0, 1);
  var angle  = (hitPos - 0.5) * 2 * G.MAX_ANGLE;

  G.rally++;
  G.ball.speed = Math.min(
    G.BALL_SPD0 + G.rally * G.BALL_SPD_INC,
    G.BALL_SPD_MAX
  );

  G.ball.vx = Math.cos(angle) * G.ball.speed * dir;
  G.ball.vy = Math.sin(angle) * G.ball.speed;

  // 水平に近すぎる場合の補正
  if (Math.abs(G.ball.vy) < G.ball.speed * 0.08) {
    G.ball.vy = (Math.random() > 0.5 ? 1 : -1) * G.ball.speed * 0.08;
  }

  // パドル内部にめり込まないよう押し出す
  var hs = G.ball.sz / 2;
  if (dir === 1) G.ball.x = paddle.x + paddle.w + hs;
  else           G.ball.x = paddle.x - hs;

  G.sndPaddle();
  if (navigator.vibrate) navigator.vibrate(10);
}

/* ---------- 得点処理 ---------- */
function handleScore(scorer) {
  G.lastScorer = scorer;

  if (G.player.score >= G.WIN_SCORE || G.cpu.score >= G.WIN_SCORE) {
    G.winner = (G.player.score >= G.WIN_SCORE) ? 'player' : 'cpu';
    G.state  = G.S.OVER;

    G.el('resultText').textContent =
      (G.winner === 'player') ? 'YOU WIN!' : 'YOU LOSE';
    G.el('finalScore').textContent =
      G.player.score + ' - ' + G.cpu.score;
    G.showOverlay('gameoverOverlay');

    if (G.winner === 'player') G.sndWin(); else G.sndLose();
    return;
  }

  G.sndScore();
  G.state = G.S.SCORED;
  G.scoreTimer = 0.8;
}

/* ========== デモモード（タイトル画面） ========== */

G.initDemo = function () {
  G.demoL = G.makePaddle(G.PADDLE_MARGIN);
  G.demoR = G.makePaddle(G.VW - G.PADDLE_MARGIN - G.PADDLE_W);
  G.demoB = {
    x: G.VW / 2, y: G.VH / 2,
    sz: G.BALL_SZ, speed: 180, vx: 180, vy: 120
  };
};

G.updateDemo = function (dt) {
  var b  = G.demoB;
  var hs = b.sz / 2;

  b.x += b.vx * dt;
  b.y += b.vy * dt;

  if (b.y - hs < 0)    { b.y = hs;          b.vy = Math.abs(b.vy); }
  if (b.y + hs > G.VH) { b.y = G.VH - hs;  b.vy = -Math.abs(b.vy); }

  demoAI(G.demoL, b, 150, dt);
  demoAI(G.demoR, b, 170, dt);

  // パドル反射
  if (b.vx < 0 && b.x - hs < G.demoL.x + G.demoL.w &&
      b.y > G.demoL.y && b.y < G.demoL.y + G.demoL.h) {
    b.vx = Math.abs(b.vx);
    b.x  = G.demoL.x + G.demoL.w + hs;
  }
  if (b.vx > 0 && b.x + hs > G.demoR.x &&
      b.y > G.demoR.y && b.y < G.demoR.y + G.demoR.h) {
    b.vx = -Math.abs(b.vx);
    b.x  = G.demoR.x - hs;
  }

  // 画面外 → リセット
  if (b.x < -30 || b.x > G.VW + 30) {
    b.x  = G.VW / 2;
    b.y  = G.VH / 2;
    b.vx = (Math.random() > 0.5 ? 1 : -1) * 180;
    b.vy = (Math.random() - 0.5) * 240;
  }
};

function demoAI(p, b, speed, dt) {
  var target = b.y - p.h / 2;
  var delta  = target - p.y;
  if (Math.abs(delta) > 3) {
    p.y += Math.sign(delta) * Math.min(Math.abs(delta), speed * dt);
  }
  p.y = G.clamp(p.y, 0, G.VH - p.h);
}
