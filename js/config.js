/* ===========================================================
 *  config.js — 定数・設定・共有ステート
 * =========================================================== */

/* ---------- グローバル名前空間 ---------- */
var G = {};

/* ---------- 仮想解像度 ---------- */
G.VW = 400;
G.VH = 600;

/* ---------- ゲームルール ---------- */
G.WIN_SCORE = 11;

/* ---------- パドル ---------- */
G.PADDLE_W = 12;
G.PADDLE_H = 72;
G.PADDLE_MARGIN = 16;

/* ---------- ボール ---------- */
G.BALL_SZ = 10;
G.BALL_SPD0 = 280;      // 初速 (units/sec)
G.BALL_SPD_MAX = 520;   // 最高速
G.BALL_SPD_INC = 12;    // ラリー毎の加速量
G.MAX_ANGLE = Math.PI * 0.35; // 最大反射角 ≈63°

/* ---------- 難易度 ---------- */
G.DIFF = {
  EASY:   { cpuSpd: 160, err: 50, drift: 80 },
  NORMAL: { cpuSpd: 240, err: 25, drift: 120 },
  HARD:   { cpuSpd: 340, err: 10, drift: 180 }
};

/* ---------- ゲーム状態定数 ---------- */
G.S = {
  TITLE: 0,
  COUNT: 1,
  PLAY:  2,
  PAUSE: 3,
  SCORED: 4,
  OVER:  5
};

/* ---------- 7セグメント表示パターン ---------- */
// [top, topR, botR, bot, botL, topL, mid]
G.SEG = [
  [1,1,1,1,1,1,0], // 0
  [0,1,1,0,0,0,0], // 1
  [1,1,0,1,1,0,1], // 2
  [1,1,1,1,0,0,1], // 3
  [0,1,1,0,0,1,1], // 4
  [1,0,1,1,0,1,1], // 5
  [1,0,1,1,1,1,1], // 6
  [1,1,1,0,0,0,0], // 7
  [1,1,1,1,1,1,1], // 8
  [1,1,1,1,0,1,1]  // 9
];

/* ---------- 共有ランタイム変数 ---------- */
G.canvas  = null;
G.ctx     = null;
G.cw      = 0;    // canvas 実ピクセル幅
G.ch      = 0;    // canvas 実ピクセル高
G.sx      = 1;    // scaleX (仮想→実)
G.sy      = 1;    // scaleY
G.state   = G.S.TITLE;
G.diff    = 'NORMAL';
G.soundOn = true;
G.audioCtx = null;

// ゲームオブジェクト
G.player = null;
G.cpu    = null;
G.ball   = null;
G.rally  = 0;
G.serveDir  = 1;
G.lastScorer = '';

// カウントダウン
G.cdNum   = 0;
G.cdTimer = 0;

// 得点後の間
G.scoreTimer = 0;

// 勝者
G.winner = '';

// 入力
G.ptrDown = false;
G.ptrY    = G.VH / 2;
G.keys    = {};

// CPU AI
G.cpuErr = 0;

// デモモード
G.demoL = null;
G.demoR = null;
G.demoB = null;

// タイミング
G.lastTs = 0;

/* ---------- ユーティリティ ---------- */
G.clamp = function (v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
};

G.el = function (id) {
  return document.getElementById(id);
};
