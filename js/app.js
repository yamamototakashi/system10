/* ===========================================================
 *  app.js — 初期化・入力・UI・ゲームループ・状態遷移
 * =========================================================== */

/* ========== 初期化 ========== */

function init() {
  G.canvas = G.el('gameCanvas');
  G.ctx    = G.canvas.getContext('2d');

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', function () {
    setTimeout(resize, 150);
  });

  setupPointer();
  setupKeyboard();
  setupButtons();

  G.initDemo();

  // Service Worker 登録
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(function () {});
  }

  G.lastTs = performance.now();
  requestAnimationFrame(loop);
}

/* ========== リサイズ ========== */

function resize() {
  var app  = G.el('app');
  var maxW = app.clientWidth;
  var maxH = app.clientHeight;
  var ratio = G.VW / G.VH;

  var w, h;
  if (maxW / maxH < ratio) { w = maxW; h = maxW / ratio; }
  else                      { h = maxH; w = maxH * ratio; }

  w = Math.floor(w);
  h = Math.floor(h);

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  G.canvas.width  = Math.round(w * dpr);
  G.canvas.height = Math.round(h * dpr);
  G.canvas.style.width  = w + 'px';
  G.canvas.style.height = h + 'px';

  G.cw = G.canvas.width;
  G.ch = G.canvas.height;
  G.sx = G.cw / G.VW;
  G.sy = G.ch / G.VH;
}

/* ========== ポインター入力 ========== */

function setupPointer() {
  var c = G.canvas;

  c.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    G.ptrDown = true;
    if (c.setPointerCapture) c.setPointerCapture(e.pointerId);
    ptrUpdate(e);
  });
  c.addEventListener('pointermove', function (e) {
    e.preventDefault();
    if (G.ptrDown) ptrUpdate(e);
  });
  c.addEventListener('pointerup',      function () { G.ptrDown = false; });
  c.addEventListener('pointercancel',   function () { G.ptrDown = false; });
  c.addEventListener('lostpointercapture', function () { G.ptrDown = false; });

  // iOS スクロール防止
  c.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
  c.addEventListener('touchmove',  function (e) { e.preventDefault(); }, { passive: false });
}

function ptrUpdate(e) {
  var rect = G.canvas.getBoundingClientRect();
  G.ptrY = ((e.clientY - rect.top) / rect.height) * G.VH;
}

/* ========== キーボード入力 ========== */

function setupKeyboard() {
  window.addEventListener('keydown', function (e) {
    G.keys[e.key] = true;
    if (e.key === 'Escape' || e.key === 'p') {
      if (G.state === G.S.PLAY)  pauseGame();
      else if (G.state === G.S.PAUSE) resumeGame();
    }
  });
  window.addEventListener('keyup', function (e) {
    G.keys[e.key] = false;
  });
}

/* ========== UI ボタン ========== */

function setupButtons() {
  G.el('startBtn').addEventListener('click', startGame);
  G.el('pauseBtn').addEventListener('click', pauseGame);
  G.el('resumeBtn').addEventListener('click', resumeGame);
  G.el('homeBtn').addEventListener('click', goHome);
  G.el('homeBtn2').addEventListener('click', goHome);
  G.el('retryBtn').addEventListener('click', retryGame);
  G.el('soundBtn').addEventListener('click', toggleSound);

  var btns = document.querySelectorAll('.diff-btn');
  btns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      G.diff = btn.dataset.diff;
      btns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });
}

/* ========== 状態遷移 ========== */

function startGame() {
  G.ensureAudio();
  G.resetGame();
  hideOverlay('titleOverlay');
  G.el('pauseBtn').classList.remove('hidden');
  startCountdown();
}

function startCountdown() {
  G.state   = G.S.COUNT;
  G.cdNum   = 3;
  G.cdTimer = 0.7;
  G.sndCount();
}

function pauseGame() {
  if (G.state !== G.S.PLAY) return;
  G.state = G.S.PAUSE;
  G.showOverlay('pauseOverlay');
}

function resumeGame() {
  if (G.state !== G.S.PAUSE) return;
  hideOverlay('pauseOverlay');
  G.state = G.S.PLAY;
}

function goHome() {
  hideOverlay('pauseOverlay');
  hideOverlay('gameoverOverlay');
  G.el('pauseBtn').classList.add('hidden');
  G.showOverlay('titleOverlay');
  G.state = G.S.TITLE;
  G.initDemo();
}

function retryGame() {
  hideOverlay('gameoverOverlay');
  G.resetGame();
  startCountdown();
}

function toggleSound() {
  G.soundOn = !G.soundOn;
  G.el('soundBtn').textContent = G.soundOn ? 'SOUND: ON' : 'SOUND: OFF';
  if (G.soundOn) G.ensureAudio();
}

/* ---------- オーバーレイ制御 ---------- */

G.showOverlay = function (id) { G.el(id).classList.add('visible'); };
function hideOverlay(id)      { G.el(id).classList.remove('visible'); }

/* ========== ゲームループ ========== */

function loop(ts) {
  var dt = (ts - G.lastTs) / 1000;
  G.lastTs = ts;
  if (dt > 0.033) dt = 0.033; // 30fps 下限

  switch (G.state) {

    case G.S.TITLE:
      G.updateDemo(dt);
      break;

    case G.S.COUNT:
      G.cdTimer -= dt;
      if (G.cdTimer <= 0) {
        G.cdNum--;
        if (G.cdNum <= 0) {
          G.state = G.S.PLAY;
          G.launchBall();
        } else {
          G.cdTimer = 0.7;
          G.sndCount();
        }
      }
      G.updatePlayer(dt);
      break;

    case G.S.PLAY:
      G.updatePlaying(dt);
      break;

    case G.S.SCORED:
      G.scoreTimer -= dt;
      if (G.scoreTimer <= 0) {
        var dir = (G.lastScorer === 'player') ? 1 : -1;
        G.prepareBall(dir);
        startCountdown();
      }
      break;

    // PAUSE, OVER は何もしない
  }

  G.render();
  requestAnimationFrame(loop);
}

/* ========== エントリポイント ========== */

window.addEventListener('DOMContentLoaded', init);
