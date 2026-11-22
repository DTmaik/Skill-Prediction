'use strict';
// Compatibility layer for the OSTO 115 hybrid client (P31 server, client protocol 115.02 / 387463).
// core.js and classes/*.js are written against the P31 (31.04) packet versions. On the 115 client this file wraps the
// mod object: every hook / toClient / toServer keeps the P31 call, but uses the newest packet version the loaded
// protocol has and translates the fields that differ. On P31 nothing of this is used (isP115() is false).

// ---- detection ----
function isP115(mod) {
	try {
		const major = Number(mod.majorPatchVersion !== undefined ? mod.majorPatchVersion : (mod.dispatch && mod.dispatch.majorPatchVersion));
		if (major >= 100) return true;
		const proto = Number(mod.dispatch && mod.dispatch.protocolVersion);
		return proto === 387463 || proto === 387396;
	} catch (e) {
		return false;
	}
}

// ---- helpers ----
const num = (v) => (typeof v === 'bigint' ? Number(v) : v);
const pick = (a, b) => (a !== undefined ? a : b);
const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
const vec = (v) => (v && typeof v === 'object' ? { x: Number(v.x) || 0, y: Number(v.y) || 0, z: Number(v.z) || 0 } : undefined);

// ---- converters (name -> { in(P115 event) => P31 view, out(P31 data) => P115 data }) ----
// in()  gets the parsed P115 event and returns a NEW object for SP (the toolbox shares parsed events between mods,
//       so the original is never changed); fields of the P31 definition are added as aliases, int64 numbers that SP
//       does arithmetic with become plain numbers.
// out() gets what SP sends (or a P31 view SP modified) and returns a NEW object in P115 shape. Floats that the P31
//       definition did not have must be set: the toolbox writes an undefined float as NaN.
const targetsIn = (list, map) => (Array.isArray(list) ? list.map(t => Object.assign({}, t, map(t))) : list);

const CONVERTERS = {
	// int64 duration (P31 int32)
	S_ABNORMALITY_BEGIN: { in: (e) => Object.assign({}, e, { duration: num(e.duration), unk: pick(e.unk, 0) }) },
	S_ABNORMALITY_REFRESH: { in: (e) => Object.assign({}, e, { duration: num(e.duration), unk: pick(e.unk, 0) }) },

	// int64 damage / hp
	S_EACH_SKILL_RESULT: { in: (e) => Object.assign({}, e, { value: num(e.value) }) },
	S_PLAYER_STAT_UPDATE: { in: (e) => Object.assign({}, e, { hp: num(e.hp), drain: num(e.drain), maxHp: num(e.maxHp) }) },

	// skill list: uint64 id
	S_SKILL_LIST: { in: (e) => Object.assign({}, e, { skills: targetsIn(e.skills, s => ({ id: num(s.id) })) }) },

	// targets[].id -> targets[].gameId (+ hitCylinderId)
	C_START_TARGETED_SKILL: {
		in: (e) => Object.assign({}, e, { targets: targetsIn(e.targets, t => ({ id: t.gameId })) }),
		out: (d) => Object.assign({}, d, {
			targets: Array.isArray(d.targets) ? d.targets.map(t => Object.assign({}, t, { gameId: pick(t.gameId, t.id), hitCylinderId: pick(t.hitCylinderId, 0) })) : d.targets
		})
	},

	// P31: unk, targets[{unk1, target}], endpoints[{loc}]  /  P115: continue, targets[{arrowId, gameId, hitCylinderId}], endpoints[vec3]
	C_START_INSTANCE_SKILL: instanceConverter(),
	C_START_COMBO_INSTANT_SKILL: instanceConverter(),

	// P31: source, targets[{target}]  /  P115: id, end, loc, targets[{gameId, unk}]
	C_HIT_USER_PROJECTILE: {
		in: (e) => Object.assign({}, e, { source: e.id, targets: targetsIn(e.targets, t => ({ target: t.gameId })) }),
		out: (d) => Object.assign({}, d, {
			id: pick(d.id, d.source),
			targets: Array.isArray(d.targets) ? d.targets.map(t => Object.assign({}, t, { gameId: pick(t.gameId, t.target), unk: pick(t.unk, 0) })) : d.targets
		})
	},

	// new floats
	S_ACTION_STAGE: {
		out: (d) => Object.assign({}, d, {
			speed: isNum(d.speed) ? d.speed : 1,
			projectileSpeed: isNum(d.projectileSpeed) ? d.projectileSpeed : (isNum(d.speed) ? d.speed : 1),
			effectScale: isNum(d.effectScale) ? d.effectScale : 1
		})
	},
	S_START_USER_PROJECTILE: {
		out: (d) => Object.assign({}, d, {
			speed: isNum(d.speed) ? d.speed : 0,
			distance: isNum(d.distance) ? d.distance : 0,
			projectileSpeed: isNum(d.projectileSpeed) ? d.projectileSpeed : 1
		})
	},
	S_END_USER_PROJECTILE: {
		out: (d) => Object.assign({}, d, {
			unk3: isNum(d.unk3) ? d.unk3 : 0, unk4: isNum(d.unk4) ? d.unk4 : 0, unk5: isNum(d.unk5) ? d.unk5 : 0
		})
	},
	S_SKILL_CATEGORY: { out: (d) => Object.assign({}, d, { unkn: isNum(d.unkn) ? d.unkn : 0 }) },

	// chat: authorID/authorName -> gameId/name
	S_CHAT: {
		in: (e) => Object.assign({}, e, { authorID: e.gameId, authorName: e.name }),
		out: (d) => Object.assign({}, d, { gameId: pick(d.gameId, pick(d.authorID, 0n)), name: pick(d.name, d.authorName || '') })
	}
};

function instanceConverter() {
	return {
		in: (e) => Object.assign({}, e, {
			unk: e.continue,
			targets: targetsIn(e.targets, t => ({ unk1: t.arrowId, target: t.gameId })),
			endpoints: Array.isArray(e.endpoints) ? e.endpoints.map(v => { const p = vec(v); return Object.assign({}, p, { loc: vec(v) }); }) : e.endpoints
		}),
		out: (d) => Object.assign({}, d, {
			continue: Boolean(pick(d.continue, d.unk)),
			targets: Array.isArray(d.targets) ? d.targets.map(t => Object.assign({}, t, {
				arrowId: pick(t.arrowId, pick(t.unk1, 0)), gameId: pick(t.gameId, t.target), hitCylinderId: pick(t.hitCylinderId, 0)
			})) : d.targets,
			endpoints: Array.isArray(d.endpoints) ? d.endpoints.map(p => vec(p && p.loc && p.x === undefined ? p.loc : p)) : d.endpoints
		})
	};
}

// ---- wrapper ----
function wrap(mod, log = () => {}) {
	const proxy = mod.dispatch || mod;
	const dummies = new WeakSet();
	const reported = new Set();

	const mapped = (name) => {
		try { return !proxy.protocolMap || proxy.protocolMap.name.has(name); } catch (e) { return true; }
	};
	const versionOf = (name, wanted) => {
		try {
			const defs = proxy.protocol.messages.get(name);
			if (!defs || !defs.size) return wanted;
			return Math.max(...defs.keys());
		} catch (e) {
			return wanted;
		}
	};
	const note = (what) => { if (!reported.has(what)) { reported.add(what); log(what); } };

	function hook(name, version, opts, cb) {
		if (typeof opts === 'function') { cb = opts; opts = {}; }
		if (name === '*' || typeof name !== 'string') return mod.hook(name, version, opts, cb);
		if (!mapped(name)) {
			note(`${name} does not exist on the 115 client - hook skipped`);
			const d = { name, dummy: true };
			dummies.add(d);
			return d;
		}
		if (version === 'raw' || version === 'event' || version === '*') return mod.hook(name, version, opts, cb);
		const conv = CONVERTERS[name];
		const v = versionOf(name, version);
		if (!conv || !conv.in) return mod.hook(name, v, opts, cb);
		return mod.hook(name, v, opts, (event) => {
			const view = conv.in(event);
			const res = cb(view);
			if (res === true) {
				// SP changed the packet: write its view back in P115 shape into the event the toolbox serializes
				const out = conv.out ? conv.out(view) : view;
				for (const k of Object.keys(out)) event[k] = out[k];
			}
			return res;
		});
	}

	function unhook(h) {
		if (h && dummies.has(h)) return;
		return mod.unhook(h);
	}

	function send(kind, name, version, data) {
		if (typeof name !== 'string') return mod[kind](name, version, data); // raw buffer
		if (!mapped(name)) { note(`${name} does not exist on the 115 client - not sent`); return false; }
		const conv = CONVERTERS[name];
		const out = conv && conv.out ? conv.out(data || {}) : data;
		return mod[kind](name, versionOf(name, version), out);
	}

	return new Proxy(mod, {
		get(target, prop) {
			if (prop === 'hook') return hook;
			if (prop === 'tryHook') return (...a) => { try { return hook(...a); } catch (e) { return null; } };
			if (prop === 'unhook') return unhook;
			if (prop === 'toClient') return (name, version, data) => send('toClient', name, version, data);
			if (prop === 'toServer') return (name, version, data) => send('toServer', name, version, data);
			if (prop === 'isP115') return true;
			const v = target[prop];
			return typeof v === 'function' ? v.bind(target) : v;
		}
	});
}

module.exports = { isP115, wrap, CONVERTERS };
