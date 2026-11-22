'use strict';
// Abdull

const fs = require('fs');
const path = require('path');
const createPrediction = require('./core');
const omni = require('./omni');
const p115 = require('./p115');

const CLASS_FILES = ['zerk', 'gunner', 'archer', 'sorc', 'reaper', 'slayer', 'lancer', 'warrior', 'priest', 'mystic'];

const CLASSES = {};
for (const file of CLASS_FILES) {
	if (!fs.existsSync(path.join(__dirname, 'classes', `${file}.js`))) continue;
	try {
		const def = require(`./classes/${file}`);
		CLASSES[def.JOB] = def;
	} catch (e) {
		console.error(`[Skill-Prediction] classes/${file}.js could not be loaded:`, e);
	}
}

// first start on the 115 client: take the P31 class settings and learned values (data/<class>/*.json) as starting point
function seedP115Data(from, to) {
	if (fs.existsSync(to)) return;
	try {
		fs.mkdirSync(to, { recursive: true });
		if (!fs.existsSync(from)) return;
		for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
			const src = path.join(from, entry.name), dst = path.join(to, entry.name);
			if (!entry.isDirectory()) continue; // data/shared.json (ping, omni keys) stays shared
			fs.mkdirSync(dst, { recursive: true });
			for (const f of fs.readdirSync(src)) {
				if (f.endsWith('.json') && fs.statSync(path.join(src, f)).isFile()) fs.copyFileSync(path.join(src, f), path.join(dst, f));
			}
		}
		console.log('[Skill-Prediction] 115 client: settings and learned values copied from data/ to data-p115/');
	} catch (e) {
		console.error('[Skill-Prediction] data-p115/ could not be prepared:', e);
	}
}

module.exports = function SkillPrediction(dispatch) {
	console.log('[Skill-Prediction] by Soaria');

	// OSTO 115 hybrid client: same P31 server, but 115.02 packets. p115.js translates them, the prediction itself is unchanged.
	// Class settings / learned values of the 115 client live in data-p115/<class>/ (first start: copied from data/), so the two clients
	// never overwrite each other's learned values. data/shared.json (ping, omni keys) is used by both.
	const P115 = p115.isP115(dispatch);
	if (P115) {
		dispatch = p115.wrap(dispatch, (msg) => console.log(`[Skill-Prediction] 115 client: ${msg}`));
		console.log('[Skill-Prediction] 115 client detected - packets are translated, data in data-p115/');
	}
	const DATA_ROOT = path.join(__dirname, P115 ? 'data-p115' : 'data');
	if (P115) seedP115Data(path.join(__dirname, 'data'), DATA_ROOT);

	(function loadLocalDefinitions() {
		if (P115) return; // only needed for the P31 protocol (packets do not exist on the 115 client)
		const proxyDispatch = dispatch.dispatch || dispatch;
		if (typeof proxyDispatch.addDefinition !== 'function') return;
		let files = [];
		try { files = fs.readdirSync(__dirname); } catch (e) { return; }
		for (const file of files) {
			const m = file.match(/^(\w+)\.(\d+)\.def$/);
			if (!m) continue;
			try { proxyDispatch.addDefinition(m[1], parseInt(m[2], 10), path.join(__dirname, file), false); } catch (e) {  }
		}
	})();

	let active = null;
	let me = { cid: null, model: 0, job: -1 };

	function stopActive() {
		if (!active) return;
		try { active.inst.destructor(); } catch (e) { console.error('[Skill-Prediction] Error while stopping the class prediction:', e); }
		active = null;
	}
	function startClass(def, initialState) {
		stopActive();
		try {
			const inst = createPrediction(dispatch, def, {
				modDir: __dirname,
				dataDir: path.join(DATA_ROOT, def.DATA_DIR || def.CMD),
				initialState
			});
			active = { def, inst };
		} catch (e) {
			console.error(`[Skill-Prediction] ${def.NAME} could not be started:`, e);
			active = null;
		}
	}
	function selectClass(state) {
		const job = (state.model - 10101) % 100;
		me = { cid: state.cid, model: state.model, job };
		const def = CLASSES[job];
		if (!def) { stopActive(); return; }
		if (active && active.def === def) return;
		startClass(def, state);
	}

	dispatch.hook('S_LOGIN', 12, { order: -100 }, (event) => {
		selectClass({ cid: event.gameId, model: event.templateId, enabled: true });
	});

	function sendChat(name, msg) {
		const text = name === 'Skill-Prediction' ? `<font color="#FFFFFF">${msg}</font>` : `<font color="#56B4E9">[${name}]</font> <font color="#FFFFFF">${msg}</font>`;
		try {
			if (dispatch.command && typeof dispatch.command.message === 'function') return dispatch.command.message(text);
		} catch (e) {}
		try {
			dispatch.toClient('S_CHAT', 2, { channel: 24, authorID: 0n, unk1: 0, gm: 0, unk2: 0, authorName: name, message: `<font color="#56B4E9">[${name}]</font> ${text}` });
		} catch (e) {}
	}
	function runCommand(def, args) {
		if (active && active.def === def) return active.inst.handleCommand(args);
		sendChat(def.NAME, `Only active while you play a ${def.CLASS_LABEL}.`);
	}
	const defs = Object.values(CLASSES);

	const SP_NAME = 'Skill-Prediction';
	const sharedPath = path.join(__dirname, 'data', 'shared.json'); // ping / omni keys: the same for both clients (core.js reads it from data/ too)
	const configOf = (def) => path.join(DATA_ROOT, def.DATA_DIR || def.CMD, 'config.json');
	function readJson(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; } }
	// settings for all classes (ping, omni keys) in data/shared.json
	function writeShared(patch) {
		fs.mkdirSync(path.dirname(sharedPath), { recursive: true });
		fs.writeFileSync(sharedPath, JSON.stringify(Object.assign({}, readJson(sharedPath) || {}, patch), null, '\t'), 'utf8');
	}
	{
		const shared = readJson(sharedPath);
		if (shared && shared.OMNI_KEYS) omni.setKeys(shared.OMNI_KEYS);
	}
	function omniKeysCommand(arg) {
		if (arg === undefined) return sendChat(SP_NAME, `Omni keys (forward, left, back, right): ${omni.keyNames().toUpperCase()}. Change: sp omnikeys zqsd (AZERTY) or your own 4 keys, default: sp omnikeys wasd`);
		if (!omni.setKeys(arg)) return sendChat(SP_NAME, 'Give 4 different letters or digits in the order forward, left, back, right, for example sp omnikeys zqsd');
		try { writeShared({ OMNI_KEYS: omni.keyNames() }); } catch (e) { console.error('[Skill-Prediction] data/shared.json could not be saved:', e); return sendChat(SP_NAME, 'Could not save the omni keys (see the Toolbox console).'); }
		sendChat(SP_NAME, `Omni keys set to ${omni.keyNames().toUpperCase()} (forward, left, back, right) for all classes.`);
	}
	function spCommand(args) {
		const sub = String(args[0] || '').toLowerCase();
		if (sub === 'omnikeys') return omniKeysCommand(args[1]);
		if (sub !== 'ping') {
			sendChat(SP_NAME, 'sp ping 110 sets your ping (in ms) for all classes at once.');
			return sendChat(SP_NAME, 'sp omnikeys zqsd sets the omni keys (forward, left, back, right), e.g. for AZERTY.');
		}
		if (args[1] === undefined) {
			const shared = readJson(sharedPath);
			let ping = shared && Number.isFinite(Number(shared.GLOBAL_LATENCY)) ? Number(shared.GLOBAL_LATENCY) : null;
			if (ping === null && active) { const c = readJson(configOf(active.def)); if (c && Number.isFinite(Number(c.GLOBAL_LATENCY))) ping = Number(c.GLOBAL_LATENCY); }
			if (ping === null) return sendChat(SP_NAME, 'No ping set yet. Set it with sp ping 110.');
			sendChat(SP_NAME, `Your ping is set to ${ping} ms.`);
			const other = defs.filter(def => { const c = readJson(configOf(def)); return c && Number(c.GLOBAL_LATENCY) !== ping; }).map(def => def.CMD);
			if (other.length) sendChat(SP_NAME, `Different value in the config of ${other.join(', ')}.`);
			return;
		}
		const v = Math.round(Number(args[1]));
		if (!/^\d+$/.test(String(args[1])) || !(v >= 0 && v <= 999)) return sendChat(SP_NAME, 'The ping must be a number from 0 to 999 (ms).');
		try {
			writeShared({ GLOBAL_LATENCY: v });
		} catch (e) { console.error('[Skill-Prediction] data/shared.json could not be saved:', e); return sendChat(SP_NAME, 'Could not save the ping (see the Toolbox console).'); }
		let n = 0;
		for (const def of defs) {
			const p = configOf(def);
			const c = readJson(p);
			if (!c) continue;
			c.GLOBAL_LATENCY = v;
			try { fs.writeFileSync(p, JSON.stringify(c, null, '\t'), 'utf8'); n++; } catch (e) { console.error(`[Skill-Prediction] ${p} could not be saved:`, e); }
		}
		if (active && typeof active.inst.reloadConfig === 'function') { try { active.inst.reloadConfig(); } catch (e) {} }
		sendChat(SP_NAME, `Ping set to ${v} ms for all classes (${n} class configs updated, new ones start with it).`);
	}
	if (dispatch.command && typeof dispatch.command.add === 'function') {
		for (const def of defs) {
			try { dispatch.command.add(def.CMD, (...args) => runCommand(def, args)); } catch (e) {}
		}
		try { dispatch.command.add('sp', (...args) => spCommand(args)); } catch (e) {}
	}

	dispatch.hook('C_CHAT', 1, (event) => {
		const clean = String(event.message || '').replace(/<[^>]*>/g, '').trim();
		const lower = clean.toLowerCase();
		if (lower === '!sp' || lower.startsWith('!sp ')) {
			spCommand(clean.slice(3).trim().split(/\s+/).filter(Boolean));
			return false;
		}
		for (const def of defs) {
			if (lower === '!' + def.CMD || lower.startsWith('!' + def.CMD + ' ')) {
				runCommand(def, clean.slice(def.CMD.length + 1).trim().split(/\s+/).filter(Boolean));
				return false;
			}
			if (clean === `disable${def.JOB}` || clean === `enable${def.JOB}`) {
				runCommand(def, [clean === `enable${def.JOB}` ? 'on' : 'off']);
				return false;
			}
		}
	});

	try {
		const g = dispatch.game && dispatch.game.me;
		if (g && g.gameId && g.templateId) selectClass({ cid: g.gameId, model: g.templateId, enabled: true });
	} catch (e) {}

	return {
		saveState() {
			return { me, inner: active ? active.inst.saveState() : null };
		},
		loadState(state) {
			if (!state || !state.me || state.me.cid === null || state.me.cid === undefined) return;
			const inner = state.inner || {};
			selectClass({ cid: state.me.cid, model: state.me.model, enabled: inner.enabled !== false, aspd: inner.aspd, glyphState: inner.glyphState });
			if (active && state.inner) active.inst.loadState(state.inner);
		},
		destructor() {
			stopActive();
			try { require('./omni').stop(); } catch (e) {}
			if (dispatch.command && typeof dispatch.command.remove === 'function') {
				for (const def of defs) { try { dispatch.command.remove(def.CMD); } catch (e) {} }
				try { dispatch.command.remove('sp'); } catch (e) {}
			}
		}
	};
};
// Soaria
