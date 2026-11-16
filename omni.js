'use strict';
// DTmaik

const path = require('path');

const KEYS = { 17: false, 30: false, 31: false, 32: false };
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

const anyKey = () => Boolean(io) && (KEYS[17] || KEYS[30] || KEYS[31] || KEYS[32]);

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
	const W = KEYS[17], A = KEYS[30], S = KEYS[31], D = KEYS[32];
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
	ready: () => Boolean(io),
	lastError: () => loadError,

	_test: { keys: KEYS, fake() { io = { removeListener() {}, stop() {} }; } }
};
// Soaria
