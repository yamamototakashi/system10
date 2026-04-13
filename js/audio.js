/* ===========================================================
 *  audio.js — Web Audio API サウンドシステム
 * =========================================================== */

G.ensureAudio = function () {
  if (!G.audioCtx) {
    G.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (G.audioCtx.state === 'suspended') {
    G.audioCtx.resume();
  }
};

/* ---------- 汎用ビープ ---------- */
function beep(freq, dur, wave, vol) {
  if (!G.soundOn || !G.audioCtx) return;
  try {
    var ac  = G.audioCtx;
    var osc = ac.createOscillator();
    var gn  = ac.createGain();
    osc.connect(gn);
    gn.connect(ac.destination);
    osc.type = wave || 'square';
    var t = ac.currentTime;
    osc.frequency.setValueAtTime(freq, t);
    gn.gain.setValueAtTime(vol || 0.25, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur);
  } catch (_) { /* 無視 */ }
}

/* ---------- メロディ用ヘルパー ---------- */
function melodyBeep(freqs, interval, dur, wave, vol) {
  if (!G.soundOn || !G.audioCtx) return;
  try {
    var ac  = G.audioCtx;
    var osc = ac.createOscillator();
    var gn  = ac.createGain();
    osc.connect(gn);
    gn.connect(ac.destination);
    osc.type = wave || 'square';
    var t = ac.currentTime;
    for (var i = 0; i < freqs.length; i++) {
      osc.frequency.setValueAtTime(freqs[i], t + i * interval);
    }
    gn.gain.setValueAtTime(vol || 0.3, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur);
  } catch (_) {}
}

/* ---------- 効果音 ---------- */

// パドルに当たった音
G.sndPaddle = function () {
  beep(440, 0.08, 'square', 0.3);
};

// 壁反射音
G.sndWall = function () {
  beep(220, 0.06, 'square', 0.2);
};

// 得点音
G.sndScore = function () {
  beep(660, 0.25, 'square', 0.25);
};

// 勝利音 (C5 → E5 → G5 → C6)
G.sndWin = function () {
  melodyBeep([523, 659, 784, 1047], 0.12, 0.55, 'square', 0.3);
};

// 敗北音 (下降トーン)
G.sndLose = function () {
  if (!G.soundOn || !G.audioCtx) return;
  try {
    var ac  = G.audioCtx;
    var t   = ac.currentTime;
    var osc = ac.createOscillator();
    var gn  = ac.createGain();
    osc.connect(gn);
    gn.connect(ac.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(110, t + 0.5);
    gn.gain.setValueAtTime(0.25, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.start(t);
    osc.stop(t + 0.5);
  } catch (_) {}
};

// カウントダウン音
G.sndCount = function () {
  beep(880, 0.1, 'square', 0.2);
};
