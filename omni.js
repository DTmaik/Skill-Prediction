'use strict';
// DTmaik

const path = require('path');

// keyboard hook codes of letters and digits (the hook reports the key label: on AZERTY the W position is Z)
const CODES = {
	q: 16, w: 17, e: 18, r: 19, t: 20, y: 21, u: 22, i: 23, o: 24, p: 25,
	a: 30, s: 31, d: 32, f: 33, g: 34, h: 35, j: 36, k: 37, l: 38,
	z: 44, x: 45, c: 46, v: 47, b: 48, n: 49, m: 50,
	1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 0: 11
};
const KEYS = { 17: false, 30: false, 31: false, 32: false };
let DIR = [17, 30, 31, 32];   // forward, left, back, right
let keyNames = 'wasd';

// own movement keys: 4 different letters/digits in the order forward, left, back, right
function setKeys(str) {
	const s = String(str || '').toLowerCase();
	if (!/^[a-z0-9]{4}$/.test(s) || new Set(s).size !== 4) return false;
	DIR = [...s].map(ch => CODES[ch]);
	keyNames = s;
	for (const k of Object.keys(KEYS)) delete KEYS[k];
	for (const c of DIR) KEYS[c] = false;
	return true;
}
let io = null;
let loadError = null;

const onDown = (e) => { if (e && e.keycode in KEYS) KEYS[e.keycode] = true; };
const onUp = (e) => { if (e && e.keycode in KEYS) KEYS[e.keycode] = false; };

const GLOBAL_KEY = '__skillPredictionIohook';

function start() {
	if (io) return true;
	try {
		io = global[GLOBAL_KEY] || require(path.join(__dirname, 'node_modules', 'iohook'));
		global[GLOBAL_KEY] = io;
		io.removeAllListeners('keydown');
		io.removeAllListeners('keyup');
		io.on('keydown', onDown);
		io.on('keyup', onUp);
		io.start();
		loadError = null;
		return true;
	} catch (e) {
		io = null;
		loadError = e;
		console.error('[Skill-Prediction] Omnidirectional: the keyboard hook (iohook) could not be loaded:', e && e.message);
		return false;
	}
}

function stop() {
	for (const k of Object.keys(KEYS)) KEYS[k] = false;
	if (!io) return;
	try {
		io.removeListener('keydown', onDown);
		io.removeListener('keyup', onUp);
		io.stop();
	} catch (e) {}
	io = null;
}

const anyKey = () => Boolean(io) && DIR.some(c => KEYS[c]);

function normalize(a) {
	a = a % (2 * Math.PI);
	if (a > Math.PI) a -= 2 * Math.PI;
	if (a < -Math.PI) a += 2 * Math.PI;
	return a;
}

function angle(w, flip) {
	if (flip) {
		w = (w + Math.PI) % (2 * Math.PI);
		if (w > Math.PI) w -= 2 * Math.PI;
	}
	const [W, A, S, D] = DIR.map(c => KEYS[c]);
	const diag = Math.PI / 4, card = Math.PI / 2;
	if (W && A) return normalize(w - diag);
	if (W && D) return normalize(w + diag);
	if (S && A) return normalize(w - 3 * diag);
	if (S && D) return normalize(w + 3 * diag);
	if (W) return normalize(w);
	if (S) return normalize(w + Math.PI);
	if (A) return normalize(w - card);
	if (D) return normalize(w + card);
	return w;
}

module.exports = {
	start,
	stop,
	anyKey,
	angle,
	setKeys,
	keyNames: () => keyNames,
	keyLabel: () => keyNames.toUpperCase().split('').join(' / '),
	ready: () => Boolean(io),
	lastError: () => loadError,

	_test: { keys: KEYS, fake() { io = { removeListener() {}, stop() {} }; } }
};
// Soaria
