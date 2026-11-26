'use strict';
// Abdull

const DEFAULT_SKILLS = {
	combo: { name: 'Combo Attack', durations: [645, 1018, 1800] },
	standFast: { name: 'Stand Fast (block)', duration: 350 },
	onslaught: { name: 'Onslaught', stages: [950, 480, 535, 510, 395, 755], chainStages: [680, 370, 385, 390, 265, 580] },
	challengingShout: { name: 'Challenging Shout', duration: 1731 },
	shieldBash: { name: 'Shield Bash', duration: 830, chainDuration: 700 },
	guardianShout: { name: 'Guardian Shout', duration: 565 },
	shieldCounter: { name: 'Shield Counter', duration: 1440 },
	leash: { name: 'Leash', stages: [720, 850] },
	debilitate: { name: 'Debilitate', duration: 940, chainDuration: 825 },
	retaliate: { name: 'Retaliate' },
	infuriate: { name: 'Infuriate', duration: 2430 },
	springAttack: { name: 'Spring Attack', duration: 2790, chainDuration: 1859 },
	chargingLunge: { name: 'Charging Lunge (dash)', dashDuration: 1100, dashDistance: 494 },
	chargingLungeHit: { name: 'Charging Lunge (hit)', duration: 930 },
	secondWind: { name: 'Second Wind', duration: 690 },
	adrenalineRush: { name: 'Adrenaline Rush', duration: 690 },
	shieldBarrage: { name: 'Shield Barrage (hit 1)', duration: 624, durationRace2: 503, distance: 123 },
	shieldBarrage2: { name: 'Shield Barrage (hit 2)', duration: 790, distance: 100 },
	pledgeOfProtection: { name: 'Pledge of Protection', duration: 980 },
	menacingWave: { name: 'Menacing Wave', stages: [680, 800] },
	lockdownBlow: { name: 'Lockdown Blow', duration: 1390, chainDuration: 1335 },
	ironWill: { name: 'Iron Will', duration: 783 },
	mastersLeash: { name: "Master's Leash", stages: [715, 840] },
	gigaChain: { name: 'Chain Leash', stages: [720, 840] },
	wallop: { name: 'Wallop', duration: 2380, chainDuration: 1890 },
	backstep: { name: 'Backstep', duration: 730, distance: -150, stCost: 800, stCostGlyph: 700 },
	rallyingCry: { name: 'Rallying Cry', duration: 640 }
};

const RETRY = [35, 75];
const NO_CHAIN = [{ from: [], sub: 30 }];

const FAMILIES = {
	1: { key: 'combo', mode: 'combo', subs: [0, 1, 2], selfLock: 0, retry: false },

	2: { key: 'standFast', mode: 'hold', subs: [0, 30], releaseSub: null, releaseEndType: 10, prevEndType: 4, fixedSpeed: true,
		retry: false, selfLock: 0, pressRetry: [35, 70, 105, 140, 180], tapResend: true },
	3: { key: 'onslaught', mode: 'custom', subs: [0], serverSubs: [30], retry: false, selfLock: 0, selfRunning: true },
	4: { key: 'challengingShout', mode: 'simple', retry: RETRY },
	5: { key: 'shieldBash', mode: 'simple', subs: [0, 1], chains: NO_CHAIN, retry: false, selfLock: 0, selfRunning: true },
	7: { key: 'guardianShout', mode: 'simple', retry: RETRY },

	8: { key: 'shieldCounter', mode: 'simple', retry: false, selfLock: 0 },

	9: { key: 'leash', mode: 'stages', subs: [], serverSubs: [0], retry: false },
	10: { key: 'debilitate', mode: 'simple', chains: NO_CHAIN, retry: false, selfLock: 0, selfRunning: true },
	11: { key: 'retaliate', mode: 'passthrough' },
	12: { key: 'infuriate', mode: 'simple', retry: false, selfLock: 0, selfRunning: true },
	13: { key: 'springAttack', mode: 'simple', chains: NO_CHAIN, retry: false, selfLock: 0, selfRunning: true },

	15: { key: 'chargingLunge', keys: { 1: 'chargingLungeHit' }, mode: 'simple', subs: [1], serverSubs: [0], retry: false },
	16: { key: 'secondWind', mode: 'simple', fixedSpeed: true, retry: RETRY },
	17: { key: 'adrenalineRush', mode: 'simple', fixedSpeed: true, retry: RETRY },

	18: { key: 'shieldBarrage', keys: { 1: 'shieldBarrage2' }, mode: 'simple', subs: [0, 1], retry: false, selfLock: 0 },
	19: { key: 'pledgeOfProtection', mode: 'simple', fixedSpeed: true, retry: RETRY },
	20: { key: 'menacingWave', mode: 'stages', fixedSpeed: true, retry: RETRY },
	21: { key: 'lockdownBlow', mode: 'simple', subs: [0, 1], chains: NO_CHAIN, retry: false, selfLock: 0, selfRunning: true },
	22: { key: 'ironWill', mode: 'simple', fixedSpeed: true, retry: RETRY },
	23: { key: 'mastersLeash', mode: 'stages', subs: [], serverSubs: [0], retry: false },

	24: { key: 'gigaChain', mode: 'stages', retry: false },
	25: { key: 'wallop', mode: 'simple', chains: NO_CHAIN, retry: false, selfLock: 0, selfRunning: true },
	26: { key: 'backstep', mode: 'simple', retry: RETRY, selfLock: 0 },
	27: { key: 'rallyingCry', mode: 'simple', retry: RETRY }
};

const GLYPHS = {
	22085: { name: 'Challenging Shout speed', exclusive: 'shout', groups: [4], speed: 1.25 },
	22056: { name: 'Challenging Shout speed', exclusive: 'shout', groups: [4], speed: 1.25 },
	22035: { name: 'Onslaught speed' },
	22060: { name: 'Onslaught speed' },
	22067: { name: 'Backstep stamina' },
	22089: { name: 'Backstep stamina' }
};
const ONSLAUGHT_GLYPHS = [22035, 22060];
const ABN_ONSLAUGHT_SPEED = 22060;
const ONSLAUGHT_GLYPH_SPEED = 1.25;
const BACKSTEP_GLYPHS = [22067, 22089];
const SC_SPEED_ABN_FIRST = 88202301;
const LEASH_WINDOW_MS = 5000;

const CHAIN_GROUPS = [3, 13, 25];

const CHARGE_END_FALLBACK = 500;
const HOLD_ARRIVE_AFTER = 20;
// server delays shorter than this are not worth holding a request back
const LAG_HOLD_MIN = 15;
// a manual block waits at most this long for a learned block point
const BLOCK_WAIT_MAX = 200;
// Shield Bash has finished its forward move after this much time (attack speed 1.0)
const SB_MOVE_DONE = 450;
// chain requests wait this much longer than the server delay, else they arrive too early and are ignored
const CHAIN_HOLD_MARGIN = 20;
// bug report lancer 2026-11-26 "dasda" + vanilla sniff ttb-1795705062884: the server takes Spring Attack out of Shield Counter only
// late in the counter - ignored without an answer at 682 (attack speed 1.0, after its own counter start), chained at 947 / 1032 /
// 1312 / 1312, the counter runs 1425. The client asks from ~650: the server ran the counter in full, started plain Spring Attack
// 642 ms after ours and every skill after it had to wait ~650-800 ms. The request is now held until the server takes it.
// Mod log ttb-1795706558604: shown at the key press and only the request held, its hits came 110-170 ms later than usual for the
// animation. Now the counter keeps playing and Spring Attack is shown and sent together when the server takes it.
const SPRING_AFTER_COUNTER_FROM = 950;
const ABN_BARRAGE_SPEED = 201550;
const BARRAGE_BUFF_SPEED = 1.2;

const ONSLAUGHT_CHAIN_FROM = [5];
const SPRING_CHAIN_FROM = [10, '1:2', 21, 18, 5, 8];
const LOCKDOWN_CHAIN_FROM = [10, 18, 13];
const BASH_CHAIN_FROM = [10];
const DEB_CHAIN_FROM = [1, 18];
const WALLOP_CHAIN_FROM = [13, 10, 21, 18, 15, 8];

const SPRING_AFTER = [8, 2, 22, 19, 10, 21, '1:2', 18, 5];
const ONSLAUGHT_AFTER = [22, 2, 19, 5, 1, 18];
const WALLOP_AFTER = [8, 2, 22, 19, 13, 10, 21, 18, 15];
const DEB_AFTER = [1, 18];
const DURING_BLOCK = [8, 26, 10, 3, 11];

const LEGACY = {
	dirs: ['neuesLancerSP'],

	config: {},
	skillData(o) {
		const g = (k) => o[k] || {};
		const pick = (k, props) => { const out = {}; for (const p of props) if (g(k)[p] !== undefined) out[p] = g(k)[p]; return out; };
		return {
			combo: pick('combo', ['durations']),
			standFast: pick('standFast', ['duration']),
			onslaught: pick('onslaught', ['stages', 'chainStages']),
			challengingShout: pick('challengingShout', ['duration']),
			shieldBash: pick('shieldBash', ['duration', 'chainDuration']),
			guardianShout: pick('guardianShout', ['duration']),
			shieldCounter: pick('shieldCounter', ['duration']),
			leash: pick('leash', ['stages']),
			debilitate: pick('debilitate', ['duration', 'chainDuration']),
			infuriate: pick('infuriate', ['duration']),
			springAttack: pick('springAttack', ['duration', 'chainDuration']),
			chargingLunge: pick('chargingLunge', ['dashDuration', 'dashDistance']),
			chargingLungeHit: g('chargingLunge').hitDuration !== undefined ? { duration: g('chargingLunge').hitDuration } : {},
			secondWind: pick('secondWind', ['duration']),
			adrenalineRush: pick('adrenalineRush', ['duration']),
			shieldBarrage: Object.assign({}, g('shieldBarrage').hit1Duration !== undefined ? { duration: g('shieldBarrage').hit1Duration } : {},
				g('shieldBarrage').hit1DurationAman !== undefined ? { durationRace2: g('shieldBarrage').hit1DurationAman } : {},
				g('shieldBarrage').hit1Distance !== undefined ? { distance: g('shieldBarrage').hit1Distance } : {}),
			shieldBarrage2: Object.assign({}, g('shieldBarrage').hit2Duration !== undefined ? { duration: g('shieldBarrage').hit2Duration } : {},
				g('shieldBarrage').hit2Distance !== undefined ? { distance: g('shieldBarrage').hit2Distance } : {}),
			pledgeOfProtection: pick('pledgeOfProtection', ['duration']),
			menacingWave: pick('menacingWave', ['stages']),
			lockdownBlow: pick('lockdownBlow', ['duration', 'chainDuration']),
			ironWill: pick('ironWill', ['duration']),
			mastersLeash: pick('mastersLeash', ['stages']),
			gigaChain: pick('gigaChain', ['stages']),
			wallop: pick('wallop', ['duration', 'chainDuration']),
			backstep: pick('backstep', ['duration', 'distance', 'stCost', 'stCostGlyph']),
			rallyingCry: pick('rallyingCry', ['duration'])
		};
	}
};

function setup(api) {
	const { groupOf, subOf, baseOf, getSkillId } = api;
	const at = (id, g, ...subs) => groupOf(id) === g && (subs.length === 0 || subs.includes(subOf(id)));
	const running = () => { const a = api.action(); return a && !a.finished ? a : null; };
	const runningGroup = () => { const a = running(); return a ? groupOf(a.skillId) : -1; };
	const race = () => Math.floor((api.model() - 10101) / 100);
	const plain = (id) => (subOf(id) >= 30 ? id - 30 : id);
	const cfg = () => api.config;

	let comboStep = 0, comboReset = null;
	let blockBase = 20200;
	let defended = false;
	let leashUntil = 0;
	let stamina = 99999;
	let scSpeed = 1;
	let sbPressedAt = 0;
	const held = [];
	let barrageBuffUsed = false;

	const blockFrom = {};

	// 115 client log (lancer.log): the server refused the block in a chained Wallop (25:30) arriving at ~1185 and took it at 1193 / 1200
	// (attack speed 1.0). One refusal ended Wallop only on our side and shifted the next skills (ghost block / Shield Barrage hit 2).
	const P115 = Boolean(api.dispatch && api.dispatch.isP115);
	const WALLOP_CHAIN_BLOCK_POINT = 1205;
	const blockSeed = (id) => {
		if (groupOf(id) === 18 && subOf(id) === 0) return 400;
		if (P115 && groupOf(id) === 25 && subOf(id) === 30) return WALLOP_CHAIN_BLOCK_POINT;
		return 0;
	};
	const blockPoint = (id) => blockFrom[id] || blockSeed(id);
	let lastBlockPress = null;
	let blockRefusedAt = 0;
	let serverBlockAt = 0;
	let pressHeld = null;
	let lastHeldSent = null;
	const onsRefs = new Map();
	// forward movement during each Onslaught stage (index k = during stage k-1, 6 = last stage);
	// vanilla logs lvl 60 and lvl 70, normal and chain: 100 in every stage from stage 1 on, ~35 in the last
	const ONS_REF = [0, 0, 100, 100, 100, 100, 35];
	const onsRefOf = (id) => { if (!onsRefs.has(id)) onsRefs.set(id, ONS_REF.slice()); return onsRefs.get(id); };
	const moveRef = { '1:0': 74, '5:0': 44, '5:30': 44, '10:0': 43, '10:30': 43, '13:30': 86, '21:0': 122, '21:30': 122, '25:0': 100, '25:30': 100, '18:0c': 98 };
	let freeRatio = 1;
	const svMoves = new Map();
	let onsPred = null;
	const fwd = (from, to, w) => Math.max(0, (to.x - from.x) * Math.cos(w) + (to.y - from.y) * Math.sin(w));
	const along = (loc, w, d) => ({ x: loc.x + Math.cos(w) * d, y: loc.y + Math.sin(w) * d, z: loc.z });
	const moveKey = (sid) => `${groupOf(sid)}:${subOf(sid)}`;
	const clamp01 = (x) => Math.max(0, Math.min(1, x));
	// ranks move a bit differently (Lockdown Blow 103 vs 122 ...): clearly free = 1, clearly blocked = 0
	const snapFree = (x) => (x >= 0.6 ? 1 : (x <= 0.25 ? 0 : clamp01(x)));
	function noteFree(ratio, from) {
		freeRatio = snapFree(ratio);
		api.recordPacket('MOD', 'Way ahead (1 = free, 0 = target blocks)', { ratio: freeRatio.toFixed(2), from });
		// an Onslaught that runs and has no report of your client yet takes it over at once
		if (onsPred && !onsPred.measured && onsPred.action && !onsPred.action.finished && api.action() === onsPred.action) onsPred.ratio = freeRatio;
	}
	// compares a skill's server movement with its usual distance: free way or a target in the way
	function learnMove(key, moved, from) {
		const ref = moveRef[key];
		if (!(ref >= 40)) return;
		if (moved > ref * 1.05) moveRef[key] = Math.round(moved);
		noteFree(moved / ref, from);
	}
	// where Onslaught has brought you at time T: last client report plus the movement since, spread evenly over each stage
	function onsPosAt(pred, T = Date.now(), ratio = pred.ratio, base = pred.base) {
		const a = pred.action;
		const sp = (a && a.speed) || 1;
		const total = pred.list.reduce((x, y) => x + y, 0);
		const factor = a && total > 0 && a.normDuration > 0 ? a.normDuration / total : 1;
		let d = 0, t0 = pred.startAt;
		for (let st = 0; st < pred.list.length; st++) {
			const dur = pred.list[st] * factor / sp;
			const from = Math.max(t0, base.at), to = Math.min(t0 + dur, T);
			if (to > from && dur > 0) d += (pred.ref[st + 1] || 0) * ratio * (to - from) / dur;
			t0 += dur;
		}
		return along(base.loc, pred.w, d);
	}
	const serverStarts = new Map();
	let pendingSpring = null; // Spring Attack pressed early in our Shield Counter, shown + sent when the server takes it
	let sendingSpring = false;
	const rttSamples = [];

	function rttTyp() {
		if (rttSamples.length < 3) return api.estimateRtt();
		const sorted = rttSamples.slice().sort((x, y) => x - y);
		return sorted[Math.floor(sorted.length / 2)];
	}
	const serverDur = {};
	const mismatch = new Set();
	const knownSkills = new Set();

	// learned skill ranks per character, kept over a proxy reload (the skill list only comes at login)
	const RANKS_KEY = '__skillPredictionLancerRanks';
	const rankStore = () => (global[RANKS_KEY] = global[RANKS_KEY] || {});
	let ranksRestored = false;
	function syncRanks() {
		if (ranksRestored || !api.cid()) return;
		ranksRestored = true;
		const r = rankStore()[String(api.cid())];
		if (r && r[2]) blockBase = r[2];
	}
	const learnId = (id) => {
		syncRanks();
		const g = groupOf(id);
		if (subOf(id) !== 0 && !(g === 2 && subOf(id) === 30)) return;
		if (g === 2 && subOf(id) === 0) {
			blockBase = id;
			if (api.cid()) (rankStore()[String(api.cid())] = rankStore()[String(api.cid())] || {})[2] = id;
		}
	};

	(async function loadKnownSkills() {
		try {
			if (typeof api.dispatch.queryData !== 'function' || !api.model()) return;
			const nodes = await api.dispatch.queryData('/SkillData/Skill@templateId=?/', [api.model()], true, false, ['id']);
			for (const n of (nodes || [])) if (n.attributes && n.attributes.id) knownSkills.add(Number(n.attributes.id));
		} catch (e) {  }
	})();

	api.tryHook('S_SKILL_LIST', 2, (event) => {
		for (const sk of (event.skills || [])) learnId(Number(sk.id));
	});
	const chainExists = (id) => (knownSkills.size ? knownSkills.has(id) : CHAIN_GROUPS.includes(groupOf(id)));

	function realServerSkill() {
		const sv = api.serverActive();
		return sv && api.clientAction() === sv.actionId ? sv.id : 0;
	}

	const serverLength = (sid, ours) => Math.max(ours, ...(serverDur[sid] || []));

	function dataLength(sid) {
		const fam = api.familyDef(sid);
		const data = fam ? api.dataOf(fam, subOf(sid)) : null;
		if (!data) return 0;
		if (Array.isArray(data.durations)) return data.durations[Math.min(subOf(sid), data.durations.length - 1)] || 0;
		const st = subOf(sid) >= 30 && Array.isArray(data.chainStages) ? data.chainStages : data.stages;
		if (Array.isArray(st)) return st.reduce((x, y) => x + y, 0);
		return (subOf(sid) >= 30 ? data.chainDuration : data.duration) || 0;
	}

	const svStart = (sv) => { const st = serverStarts.get(sv.actionId); return st ? st.at : sv.at; };
	// how long the server still plays its current skill
	function serverBusyLeft() {
		const a = api.action();

		if (a && a.finished && !a.isHold && a.heldSentAt && api.serverAckAt(groupOf(a.skillId)) < a.heldSentAt && a.speed) {
			return a.heldSentAt + serverLength(a.skillId, a.normDuration) / a.speed - Date.now();
		}
		const sv = api.serverActive();
		if (!sv || groupOf(sv.id) === 2) return -Infinity;

		if (a && a.isHold && a.requestedAt >= svStart(sv) && Date.now() - a.requestedAt < api.estimateRtt() + 50 && blockRefusedAt < a.requestedAt) return -Infinity;
		const st = serverStarts.get(sv.actionId);
		let len, speed;
		if (a && a.finished && !a.isHold && groupOf(a.skillId) === groupOf(sv.id) && a.speed) { len = a.normDuration; speed = a.speed; }
		else { len = dataLength(sv.id); speed = st ? st.speed : api.aspd(); }
		if (!(len > 0) || !speed) return -Infinity;
		return svStart(sv) + serverLength(sv.id, len) / speed - api.estimateRtt() - Date.now();
	}
	// Soaria
	function sourceSkill() {
		const a = api.action();
		if (a && !a.finished && !a.isHold) return a.skillId;
		const real = realServerSkill();
		if (real) return real;
		if (!a || a.isHold) return 0;
		return serverBusyLeft() > 15 ? a.skillId : 0;
	}
	const chainFrom = (list) => { const s = sourceSkill(); return Boolean(s && api.matchesAny(plain(s), list)); };

	const chainOk = (sid, list) => chainExists(baseOf(sid) + 30) && chainFrom(list);

	// how far the server runs behind our animation (its start minus ours minus ping)
	function serverLag(ours) {
		if (!ours) return 0;
		const sv = api.serverActive();
		if (sv && groupOf(sv.id) === groupOf(ours.skillId) && svStart(sv) >= ours.requestedAt) return svStart(sv) - ours.startedAt - rttTyp();
		const h = held.find(x => x.action === ours);
		if (h) return h.sendAt - ours.startedAt;

		if (ours.heldSentAt) return ours.heldSentAt - ours.startedAt;
		return 0;
	}

	// Spring Attack in our Shield Counter: wait until the request reaches the server late enough in its counter
	function springAfterCounterWait(sid, ours) {
		if (groupOf(sid) !== 13 || !ours || groupOf(ours.skillId) !== 8) return 0;
		const sv = api.serverActive();
		const own = sv && groupOf(sv.id) === 8 && svStart(sv) >= (ours.requestedAt || 0);
		const st = own ? serverStarts.get(sv.actionId) : null;
		const svAt = own ? svStart(sv) : Math.max(ours.startedAt, ours.heldSentAt || 0) + rttTyp();
		const speed = (st && st.speed) || ours.speed || api.aspd();
		const arrive = (Date.now() - svAt + rttTyp()) * speed;
		return Math.max(0, (SPRING_AFTER_COUNTER_FROM - arrive) / speed);
	}

	function sendPendingSpring() {
		const p = pendingSpring;
		if (!p) return;
		pendingSpring = null;
		api.clearTimeout(p.timer);
		api.recordPacket('MOD->S', 'Held Spring Attack shown + sent (server takes it now)', { skill: api.skillLabel(getSkillId(p.event.skill)) });
		sendingSpring = true;
		try { api.startSkill(p.name, p.version, p.event); } finally { sendingSpring = false; }
	}
	function dropPendingSpring(reason) {
		if (!pendingSpring) return;
		api.clearTimeout(pendingSpring.timer);
		api.recordPacket('MOD', 'Held Spring Attack dropped', { reason });
		pendingSpring = null;
	}

	function holdRequest(info, event, delay, label, kind) {
		const prev = held.length ? held[held.length - 1].sendAt + 10 : 0;
		const sendAt = Math.max(Date.now() + delay, prev);
		const h = { kind, name: info.name, version: info.version, event: api.copyEvent(event), timer: null, sendAt, action: api.action() };
		h.timer = api.setTimeout(() => sendHeld(h), Math.max(0, sendAt - Date.now()));
		held.push(h);
		api.recordPacket('MOD', label, { skill: api.skillLabel(info.sid), delay: Math.round(delay) });
		api.setLastSkill(info.sid, event);
		return 'drop';
	}
	const blocking = () => Boolean(api.hold() && groupOf(api.hold().skillId) === 2);
	function trackChain(info, event) {
		lastHeldSent = { kind: 'chain', name: info.name, version: info.version, event: api.copyEvent(event), sid: info.sid, sentAt: Date.now(), action: api.action() };
	}

	function serverSkillInfo() {
		const sv = api.serverActive();
		return sv && groupOf(sv.id) !== 2 ? { id: sv.id, at: svStart(sv), speed: (serverStarts.get(sv.actionId) || {}).speed || api.aspd() } : null;
	}

	// time until the server accepts a block in its current skill (learned per skill)
	function blockWaitFor(svInfo) {
		if (!svInfo || !(blockPoint(svInfo.id) > 0)) return 0;

		const arrive = (Date.now() - svInfo.at + rttTyp()) * svInfo.speed;
		return (blockPoint(svInfo.id) - arrive) / svInfo.speed;
	}

	// Abdull


	function predictCombo(event, info, a) {
		const sid = info.sid;
		const step = subOf(sid) > 0 ? Math.min(subOf(sid), 2) : comboStep % 3;
		const id = baseOf(sid) + step;
		const d = api.skills.combo.durations[step] || 1000;
		api.startAction(event, id, { duration: d, prevEndType: a && groupOf(a.skillId) === 1 ? 6 : undefined, requestId: sid });
		comboStep = (step + 1) % 3;
		api.clearTimeout(comboReset);
		comboReset = api.setTimeout(() => { comboStep = 0; }, d);
		return 'done';
	}

	function predictChained(event, info, key, chain, extra) {
		const sid = info.sid;
		const d = api.skills[key];
		const target = (chain ? baseOf(sid) + 30 : sid);
		const fam = api.familyDef(sid) || {};
		const a = api.startAction(event, target, Object.assign({
			duration: chain ? d.chainDuration : d.duration,
			distance: (chain && d.chainDistance !== undefined ? d.chainDistance : d.distance) || 0,
			fixedSpeed: Boolean(fam.fixedSpeed),
			prevEndType: 4,
			requestId: sid
		}, extra || {}));
		api.applyLocks(fam, sid, a);
		if (chain) api.recordPacket('MOD', 'Chain predicted', { skill: api.skillLabel(target) });
		return a;
	}

	function predictOnslaught(event, info, chain) {
		const sid = info.sid;
		const d = api.skills.onslaught;
		const list = chain ? d.chainStages : d.stages;
		const stages = [];
		let acc = 0;
		list.forEach((ms, i) => { if (i > 0) stages.push({ at: acc, stage: i }); acc += ms; });
		const target = chain ? baseOf(sid) + 30 : sid;
		const pred = { ref: onsRefOf(target), list, ratio: freeRatio, base: null, startAt: Date.now(), w: event.w, action: null };
		const a = api.startAction(event, target, {
			duration: acc, stages, distance: 0, prevEndType: 4, requestId: sid,
			stageLoc: () => onsPosAt(pred),
			endLoc: () => onsPosAt(pred)
		});
		pred.action = a;
		pred.startAt = a.startedAt;
		pred.base = pred.origin = { loc: a.start, at: a.startedAt };
		onsPred = pred;
		api.applyLocks(api.familyDef(sid), sid, a);
		return a;
	}

	function predictLunge(event, info) {
		const sid = info.sid;
		const d = api.skills.chargingLunge;
		const dest = event.dest && (event.dest.x || event.dest.y) ? { x: event.dest.x, y: event.dest.y, z: event.dest.z } : null;
		const travel = dest ? Math.hypot(dest.x - event.loc.x, dest.y - event.loc.y) : d.dashDistance;
		api.startAction(event, sid, { duration: (travel / d.dashDistance) * d.dashDuration + CHARGE_END_FALLBACK, fixedSpeed: true, endType: 39, prevEndType: 4, requestId: sid });
		api.lock(sid, api.GLOBAL_LOCK_DELAY);
		api.setLastSkill(sid, event);
		return 'done';
	}
	api.hook('S_INSTANT_DASH', 3, (event) => {
		if (!api.predicting() || event.gameId !== api.cid()) return;
		const a = running();
		if (!a || !at(a.skillId, 15, 0)) return;
		const d = api.skills.chargingLunge;
		a.dest = { x: event.loc.x, y: event.loc.y, z: event.loc.z };
		const travel = Math.hypot(event.loc.x - a.start.x, event.loc.y - a.start.y);
		a.normDuration = (travel / d.dashDistance) * d.dashDuration + CHARGE_END_FALLBACK;
		api.scheduleActionEnd(a, a.normDuration);
	});

	// Soaria
	function predictLeash(event, info, key) {
		const sid = info.sid;
		const d = api.skills[key];
		const a = api.startAction(event, sid, { duration: d.stages[0] + d.stages[1], stages: [{ at: d.stages[0], stage: 1 }], prevEndType: 4, requestId: sid });
		void a;
		api.lock(sid, api.GLOBAL_LOCK_DELAY);
		api.setLastSkill(sid, event);
		return 'done';
	}




	function pressUpSendAt(p) {
		if (!p || p.upSent) return 0;
		if (!p.up) return Infinity;
		const pressAt = p.sentAt || p.plannedAt;
		return pressAt + Math.max(30, p.upAt - p.at);
	}
	function sendPressUp(p) {
		if (!p || p.upSent || !p.up) return;
		p.upSent = true;
		if (pressHeld === p) pressHeld = null;
		api.dispatch.toServer('C_PRESS_SKILL', 4, p.up);
	}
	// DTmaik
	// sends a held request; it never goes out before a held block release
	function sendHeld(h) {
		const i = held.indexOf(h);
		if (i < 0) return;
		const up = pressUpSendAt(pressHeld);
		if (up && up !== Infinity && Date.now() < up + 10) {
			api.clearTimeout(h.timer);
			h.timer = api.setTimeout(() => sendHeld(h), up + 10 - Date.now());
			api.recordPacket('MOD', 'Held skill waits for the held block release', { skill: api.skillLabel(getSkillId(h.event.skill)) });
			return;
		}

		for (const x of held.slice(0, i)) sendHeld(x);
		held.splice(held.indexOf(h), 1);
		api.clearTimeout(h.timer);
		api.recordPacket('MOD->S', h.name + ' [held skill sent]', { skill: api.skillLabel(getSkillId(h.event.skill)) });
		api.dispatch.toServer(h.name, h.version, h.event);
		if (h.action) h.action.heldSentAt = Date.now();
		lastHeldSent = { kind: h.kind, name: h.name, version: h.version, event: h.event, sid: getSkillId(h.event.skill), sentAt: Date.now(), action: h.action };
	}

	// a held or chain request that reached the server before its previous skill ended is lost: send it once more
	function resendIfEarly(endAt, endType) {
		const h = lastHeldSent;
		if (!h || groupOf(h.sid) === 1) return;
		if (h.kind === 'chain') {
			if (endType !== 0 || !h.action || h.action.finished || api.action() !== h.action) return;
		} else if (h.kind !== 'busy') return;
		if (endAt - h.sentAt <= api.estimateRtt() || endAt - h.sentAt > 1500) return;
		if (api.serverAckAt(groupOf(h.sid)) >= h.sentAt) return;
		lastHeldSent = null;
		api.recordPacket('MOD->S', h.name + ' [held skill resent: arrived before the server ended the previous skill]', { skill: api.skillLabel(h.sid) });
		api.sendRetry(h.name, h.version, h.event);
	}
	function canInterrupt(g) {
		if (g === 26 || g === 11 || g === 8) return true;
		return false;
	}
	function canInterruptId(sid) {
		const g = groupOf(sid);
		if (canInterrupt(g)) return true;
		if (g === 3) return chainOk(sid, ONSLAUGHT_CHAIN_FROM);
		if (g === 13) return chainOk(sid, SPRING_CHAIN_FROM);
		if (g === 21) return chainOk(sid, LOCKDOWN_CHAIN_FROM);
		if (g === 5) return chainOk(sid, BASH_CHAIN_FROM);
		if (g === 10) return chainOk(sid, DEB_CHAIN_FROM);
		if (g === 25) return chainOk(sid, WALLOP_CHAIN_FROM);
		return false;
	}

	// the server plays the other variant (normal or chain): time our animation to it
	function variantMismatch(event, sid) {
		const a = running();
		if (!a || a.isHold || event.stage !== 0 || a.skillId === sid || groupOf(a.skillId) !== groupOf(sid) || [1, 2, 18].includes(groupOf(sid))) return;
		mismatch.add(event.id);
		const data = api.dataOf(api.familyDef(sid), subOf(sid));
		if (!data) return;
		let dur;
		if (groupOf(sid) === 3) dur = (subOf(sid) >= 30 ? data.chainStages : data.stages).reduce((s, x) => s + x, 0);
		else dur = subOf(sid) >= 30 ? data.chainDuration : data.duration;
		if (!(dur > 0)) return;
		a.normDuration = dur;
		api.scheduleActionEnd(a, dur / (a.speed || 1));
		api.recordPacket('MOD', 'Server plays another variant: timed to it', { ours: api.skillLabel(a.skillId), server: api.skillLabel(sid) });
	}

	// the server started our skill late: our animation ends that much later
	function resync(event, sid) {
		const a = running();
		if (!a || a.isHold || a.resynced || event.stage !== 0 || groupOf(a.skillId) !== groupOf(sid)) return;
		a.resynced = true;
		const late = Date.now() - a.startedAt - api.estimateRtt();
		if (late < 30 || late > 1500 || !a.endAt) return;
		api.scheduleActionEnd(a, a.endAt - a.startedAt + late);
		api.recordPacket('MOD', 'Server started it late: our animation ends later', { skill: api.skillLabel(a.skillId), late: Math.round(late) });
	}
	// Abdull
	function resetCombo() { comboStep = 0; api.clearTimeout(comboReset); }

	api.tryHook('S_DEFEND_SUCCESS', 3, (event) => {
		if (api.enabled() && event.gameId === api.cid()) defended = true;
	});
	api.tryHook('S_PLAYER_CHANGE_STAMINA', 1, (event) => {
		if (api.enabled()) stamina = Number(event.current);
	});
	api.hook('S_ABNORMALITY_BEGIN', 3, (event) => {
		if (!api.enabled() || event.target !== api.cid()) return;
		const id = Number(event.id);
		if (id >= SC_SPEED_ABN_FIRST && id < SC_SPEED_ABN_FIRST + 10) scSpeed = 1.3 + (id - SC_SPEED_ABN_FIRST) * 0.05;
	});
	api.hook('S_ABNORMALITY_END', 1, (event) => {
		if (!api.enabled() || event.target !== api.cid()) return;
		const id = Number(event.id);
		if (id >= SC_SPEED_ABN_FIRST && id < SC_SPEED_ABN_FIRST + 10) scSpeed = 1;
		if (id === ABN_BARRAGE_SPEED) barrageBuffUsed = false;
	});
	api.hook('S_ABNORMALITY_BEGIN', 3, { order: 10 }, (event) => {
		if (api.enabled() && event.target === api.cid() && Number(event.id) === ABN_BARRAGE_SPEED) barrageBuffUsed = false;
	});
	api.hook('S_START_COOLTIME_SKILL', 3, { order: -20 }, (event) => { learnId(getSkillId(event.skill)); });

	const blockArrive = (bp) => (bp.sentAt - bp.sv.at + rttTyp()) * bp.sv.speed;

	// a refused block teaches the earliest point the server accepts it in its current skill
	api.hook('S_CANNOT_START_SKILL', 4, { order: 10 }, (event) => {
		if (!api.predicting() || groupOf(getSkillId(event.skill)) !== 2) return;
		const bp = lastBlockPress;
		if (!bp || Date.now() - bp.sentAt > 700) return;
		// the server already blocks: this refusal is only the answer to a repeated press
		if (serverBlockAt >= bp.at) return;
		blockRefusedAt = Date.now();
		if (!bp.sv) return;
		const t = Math.round(blockArrive(bp));
		const sd = serverDur[bp.sv.id];
		const len = sd && sd.length ? Math.max(...sd) : dataLength(bp.sv.id);
		if (len > 0 && t >= len - 30) return;

		if (t > 0 && t < 5000 && !(blockFrom[bp.sv.id] > t + 60)) {
			blockFrom[bp.sv.id] = len > 0 ? Math.min(t + 60, len - 50) : t + 60;
			api.recordPacket('MOD', 'LEARNED: block refused this early in the skill', { skill: api.skillLabel(bp.sv.id), from: t + 60 });
		}
	});

	const cls = {
		skillSpeed(sid) {
			const g = groupOf(sid);
			if (g === 3) {
				const guess = Date.now() - sbPressedAt < api.estimateRtt() + 80 && ONSLAUGHT_GLYPHS.some(api.isGlyph);
				if (api.hasAbnormal(ABN_ONSLAUGHT_SPEED) || guess) return ONSLAUGHT_GLYPH_SPEED;
			}
			if (g === 8) return scSpeed;
			if (at(sid, 18, 0) && api.hasAbnormal(ABN_BARRAGE_SPEED) && !barrageBuffUsed) { barrageBuffUsed = true; return BARRAGE_BUFF_SPEED; }
			return 1;
		},
		durationFactor(sid) {
			if (at(sid, 18, 0) && race() === 2) {
				const d = api.skills.shieldBarrage;
				return d.duration > 0 && d.durationRace2 > 0 ? d.durationRace2 / d.duration : 1;
			}
			return 1;
		},

		start(event, info) {
			const sid = info.sid;
			const g = groupOf(sid);
			learnId(sid);
			if (!info.fam) return undefined;
			const rg = runningGroup();
			const a = running();
			const ours = a && !a.isHold ? a : null;

			if (blocking() && !DURING_BLOCK.includes(g)) return 'drop';
			if (pendingSpring && !sendingSpring) {
				if (g === 13) return 'drop'; // repeated press while it waits
				dropPendingSpring('new key press');
			}

			if (ours) {
				if (g === 13 && !api.matchesAny(plain(ours.skillId), SPRING_AFTER)) return 'drop';
				if (g === 3 && (!api.matchesAny(plain(ours.skillId), ONSLAUGHT_AFTER) || rg === 8)) return 'drop';
				if (g === 25 && !api.matchesAny(plain(ours.skillId), WALLOP_AFTER)) return 'drop';
				if (g === 10 && !api.matchesAny(plain(ours.skillId), DEB_AFTER)) return 'drop';

				if (at(sid, 18, 0) && at(ours.skillId, 18, 1)) return 'drop';
				if (at(sid, 18, 1) && at(ours.skillId, 18, 1) && Date.now() - ours.startedAt < 300) {
					api.recordPacket('MOD', 'Shield Barrage hit 2 dropped (already sent)', {});
					return 'drop';
				}

				if (g === 1 && groupOf(ours.skillId) === 1) {
					const len = (api.skills.combo.durations[Math.min(subOf(ours.skillId), 2)] || 1000) / (ours.speed || 1);
					if (Date.now() - ours.startedAt < len * 0.5) {
						api.recordPacket('MOD', 'Combo request dropped (duplicate, hit just started)', { skill: api.skillLabel(sid) });
						return 'drop';
					}
				}
			}
			if (g === 26) {
				const cost = BACKSTEP_GLYPHS.some(api.isGlyph) ? (api.skills.backstep.stCostGlyph || 700) : (api.skills.backstep.stCost || 800);
				if (stamina < cost) return 'drop';
			}

			if (info.fam.selfRunning && ours && groupOf(ours.skillId) === g) return 'pass';
			if (info.fam.selfRunning && realServerSkill() && groupOf(realServerSkill()) === g) return 'pass';

			if (g === 8) {
				if (!(defended && (rg === 25 || rg === 3 || blocking()))) return 'pass';
			}

			if (api.isLocked(sid)) return undefined;
			if (api.cooldownLeft(sid) > 50) return undefined;
			if (g !== 1) resetCombo();

			if (!ours && !blocking() && info.fam.mode !== 'passthrough' && info.fam.mode !== 'stages') {
				const busy = serverBusyLeft();
				if (busy + HOLD_ARRIVE_AFTER > 0 && !canInterruptId(sid)) {
					const r = cls.predictNow(event, info, g, false);
					if (r === 'done') return holdRequest(info, event, busy + HOLD_ARRIVE_AFTER, 'Skill held back (server still plays the previous skill)', 'busy');
				}
			}

			const upAt = pressUpSendAt(pressHeld);
			if (upAt && upAt !== Infinity && !blocking()) {
				let r = cls.predictNow(event, info, g, true);
				if (r === undefined) r = cls.predictNow(event, info, g, false);
				if (r === 'done') return holdRequest(info, event, Math.max(0, upAt - Date.now()) + 10, 'Skill held back (block release not sent yet)', 'lag');
			}

			const scWait = sendingSpring ? 0 : springAfterCounterWait(sid, ours);
			if (scWait > 0) {
				// the chain request itself waits CHAIN_HOLD_MARGIN after it is shown (lag hold below)
				pendingSpring = { name: info.name, version: info.version, event: api.copyEvent(event), timer: api.setTimeout(sendPendingSpring, Math.max(0, scWait - CHAIN_HOLD_MARGIN)) };
				api.recordPacket('MOD', 'Spring Attack held back (server takes it only late in Shield Counter)', { wait: Math.round(scWait) });
				return 'drop';
			}

			let lag = serverLag(ours);
			const chainReq = Boolean(ours) && !canInterrupt(g) && canInterruptId(sid);
			if (chainReq) lag += CHAIN_HOLD_MARGIN;
			if (lag > LAG_HOLD_MIN && info.fam.mode !== 'passthrough') {
				const src = api.serverActive();
				let r = cls.predictNow(event, info, g, true);
				if (r === undefined) r = cls.predictNow(event, info, g, false);
				if (r === 'done') {
					const now = api.action();
					if (now && subOf(now.skillId) >= 30 && src && ours && src.id === ours.skillId) {
						const st = serverStarts.get(src.actionId);

						const len = Math.min(dataLength(src.id), ...(serverDur[src.id] || []));
						if (len > 0) {
							const srcLeft = svStart(src) + len / ((st && st.speed) || api.aspd()) - rttTyp() - Date.now();
							if (lag > srcLeft - 20) lag = Math.max(0, srcLeft - 20);
						}
					}
					if (lag <= 0) {
						api.dispatch.toServer(info.name, info.version, event);
						if (chainReq) trackChain(info, event);
						return 'drop';
					}
					return holdRequest(info, event, lag, 'Skill held back (server runs behind our animation)', chainReq ? 'chain' : 'lag');
				}
			}
			const res = cls.predictNow(event, info, g, true);
			if (res === 'done' && chainReq) trackChain(info, event);
			return res;
		},

		predictNow(event, info, g, allowChain) {
			const sid = info.sid;
			const ours = running() && !running().isHold ? running() : null;
			if (g === 1) return predictCombo(event, info, ours);
			if (g === 3 && subOf(sid) === 0) { predictOnslaught(event, info, allowChain && chainOk(sid, ONSLAUGHT_CHAIN_FROM)); return 'done'; }
			if (g === 5) {
				predictChained(event, info, 'shieldBash', allowChain && subOf(sid) === 0 && chainOk(sid, BASH_CHAIN_FROM));
				sbPressedAt = Date.now();
				return 'done';
			}
			if (g === 8) {
				defended = false;
				predictChained(event, info, 'shieldCounter', false);
				return 'done';
			}
			if (g === 10) {
				predictChained(event, info, 'debilitate', allowChain && chainOk(sid, DEB_CHAIN_FROM));
				return 'done';
			}
			if (g === 12) {
				predictChained(event, info, 'infuriate', false);
				return 'done';
			}
			if (g === 13) {
				predictChained(event, info, 'springAttack', allowChain && chainOk(sid, SPRING_CHAIN_FROM));
				return 'done';
			}
			if (g === 18) {
				predictChained(event, info, subOf(sid) === 1 ? 'shieldBarrage2' : 'shieldBarrage', false);
				return 'done';
			}
			if (g === 21) {
				predictChained(event, info, 'lockdownBlow', allowChain && chainOk(sid, LOCKDOWN_CHAIN_FROM));
				return 'done';
			}
			if (g === 25) {
				const chain = allowChain && chainOk(sid, WALLOP_CHAIN_FROM);
				predictChained(event, info, 'wallop', chain);
				return 'done';
			}
			if (g === 4) {
				predictChained(event, info, 'challengingShout', false);
				api.scheduleRetries(info.name, info.version, event, RETRY);
				return 'done';
			}
			if (allowChain) return undefined;
			const fam = info.fam;
			if (fam.mode !== 'simple') return undefined;
			const key = (fam.keys && fam.keys[subOf(sid)]) || fam.key;
			predictChained(event, info, key, false);
			return 'done';
		},
		targeted(event, info) {
			const sid = info.sid;
			const g = groupOf(sid);
			if (blocking()) return 'drop';
			if (api.isLocked(sid)) return undefined;
			resetCombo();
			let r;
			if (g === 15 && subOf(sid) === 0) r = predictLunge(event, info);
			else if (g === 9) { leashUntil = Date.now() + LEASH_WINDOW_MS; r = predictLeash(event, info, 'leash'); }
			else if (g === 23) {
				if (Date.now() >= leashUntil) return undefined;
				leashUntil = 0;
				r = predictLeash(event, info, 'mastersLeash');
			}
			// a held block release goes first, otherwise the server is still blocking and refuses the skill
			const upAt = pressUpSendAt(pressHeld);
			if (r === 'done' && upAt && upAt !== Infinity) {
				return holdRequest(Object.assign({}, info, { name: 'C_START_TARGETED_SKILL', version: 6 }), event, Math.max(0, upAt - Date.now()) + 10, 'Skill held back (block release not sent yet)', 'lag');
			}
			return r;
		},
		press(event, info) {
			const sid = info.sid;
			learnId(sid);
			if (groupOf(sid) !== 2) return undefined;
			if (!event.press) {
				defended = false;

				const p = pressHeld;
				if (p && !p.up) {
					p.up = api.copyEvent(event);
					p.upAt = Date.now();
					api.releaseHold();
					if (p.sentAt) api.setTimeout(() => sendPressUp(p), Math.max(0, p.sentAt + Math.max(30, p.upAt - p.at) - Date.now()));
					return 'drop';
				}
				return undefined;
			}
			resetCombo();

			const a = running();
			const ours = a && !a.isHold ? a : null;
			const sv = api.serverActive();
			const svInfo = sv && groupOf(sv.id) !== 2 ? { id: sv.id, at: svStart(sv), speed: (serverStarts.get(sv.actionId) || {}).speed || api.aspd() } : null;
			let lag = ours ? serverLag(ours) : 0;

			const wait = Math.min(blockWaitFor(svInfo), BLOCK_WAIT_MAX);
			if (wait > lag) lag = wait;
			lastBlockPress = { at: Date.now(), sentAt: Date.now(), sv: svInfo };
			if (lag > LAG_HOLD_MIN && !api.isLocked(sid)) {
				api.startHold(Object.assign({}, info.fam, { pressRetry: null }), event);
				const p = pressHeld = { down: api.copyEvent(event), up: null, at: Date.now(), upAt: 0, sentAt: 0, plannedAt: Date.now() + lag };
				api.recordPacket('MOD', 'Block held back (server runs behind our animation)', { delay: Math.round(lag) });
				const bp = lastBlockPress;
				api.setTimeout(() => {
					if (pressHeld !== p) return;
					p.sentAt = Date.now();
					if (bp) bp.sentAt = p.sentAt;
					api.dispatch.toServer('C_PRESS_SKILL', 4, p.down);
					if (p.up) api.setTimeout(() => sendPressUp(p), Math.max(30, p.upAt - p.at));
				}, lag);
				return 'drop';
			}
			return undefined;
		},
		predicted(sid, a) {
			const g = groupOf(sid);
			if (g === 26 && a) api.lock(sid, Math.max(0, a.normDuration / a.speed - 200));
		},
		serverStage(event, sid) {
			{
				const loc = { x: event.loc.x, y: event.loc.y, z: event.loc.z };
				if (event.stage === 0) {
					svMoves.set(event.id, { sid, w: event.w, locs: { 0: loc }, last: 0, at: Date.now(), speed: Number(event.speed) || 1 });
					if (svMoves.size > 30) svMoves.delete(svMoves.keys().next().value);
				} else {
					const m = svMoves.get(event.id);
					if (m) { m.locs[event.stage] = loc; m.last = Math.max(m.last, event.stage); }
				}
			}
			learnId(sid);

			if (groupOf(sid) === 2 && event.stage === 0) serverBlockAt = Date.now();
			if (groupOf(sid) === 2 && event.stage === 0 && lastBlockPress && lastBlockPress.sv && Date.now() - lastBlockPress.sentAt < 700) {
				const id = lastBlockPress.sv.id;
				const t = Math.round(blockArrive(lastBlockPress));
				if (blockFrom[id] > t && t > 0) blockFrom[id] = t;
			}
			if (event.stage === 0) {
				const ra = running();
				if (ra && !ra.isHold && groupOf(ra.skillId) === groupOf(sid) && !ra.rttSampled) {
					ra.rttSampled = true;
					const sample = Date.now() - (ra.heldSentAt || ra.requestedAt);
					if (sample > 0 && sample < 1000) { rttSamples.push(sample); if (rttSamples.length > 12) rttSamples.shift(); }
				}
				serverStarts.set(event.id, { sid, at: Date.now(), speed: Number(event.speed) || 1 });
				if (serverStarts.size > 50) serverStarts.delete(serverStarts.keys().next().value);
			}

			if (at(sid, 8) && event.stage === 0) {
				const a = running();
				if (!(a && groupOf(a.skillId) === 8)) defended = false;
			}
			variantMismatch(event, sid);
			resync(event, sid);
			return undefined;
		},
		serverEnd(event, sid) {
			const mv = svMoves.get(event.id);
			if (mv && groupOf(mv.sid) === groupOf(sid)) {
				svMoves.delete(event.id);
				if (groupOf(sid) === 3) {
					// server positions in Onslaught only mirror what the client reported: nothing to learn from them
				} else if (event.type === 0 || (event.type === 6 && at(sid, 18, 0)) || (event.type === 4 && at(mv.sid, 5) && (Date.now() - mv.at) * mv.speed >= SB_MOVE_DONE)) {
					const key = moveKey(mv.sid) + (event.type === 6 ? 'c' : '');
					learnMove(key, fwd(mv.locs[0], event.loc, mv.w), api.skillLabel(mv.sid));
				}
			}
			const st = serverStarts.get(event.id);
			serverStarts.delete(event.id);
			if (st && event.type === 0 && st.sid === sid) {
				const list = serverDur[sid] = serverDur[sid] || [];
				list.push(Math.round((Date.now() - st.at) * st.speed));
				if (list.length > 3) list.shift();
			}
			resendIfEarly(Date.now(), event.type);
			for (const h of held.filter(x => x.kind === 'busy')) sendHeld(h);
			if (mismatch.has(event.id)) {
				mismatch.delete(event.id);
				const a = running();
				if (a && groupOf(a.skillId) === groupOf(sid)) {
					a.finished = true;
					api.clearActionTimers(a);
					api.recordPacket('S->C', 'S_ACTION_END [MIRRORED: server variant ended]', { ours: api.skillLabel(a.skillId), server: api.skillLabel(sid) });
					api.sendEnd(a.skillId, event.type, { x: event.loc.x, y: event.loc.y, z: event.loc.z }, a.w, a.id);
					return false;
				}
			}
			return undefined;
		},
		learnTarget(id) {
			if (at(id, 15, 0)) return null;
			if (at(id, 3)) return null;
			if (at(id, 18, 0) && race() === 2) return { key: 'shieldBarrage', prop: 'durationRace2', dist: true };
			return undefined;
		},
		notify(n) {
			const p = onsPred;
			if (!p || !p.action || api.action() !== p.action || p.action.finished || groupOf(n.skill) !== 3) return;
			const now = Date.now();
			const loc = { x: n.loc.x, y: n.loc.y, z: n.loc.z };
			// measured from the start of the Onslaught, not between two reports: the client does not move evenly inside a stage
			if (n.stage === 0) p.origin = { loc, at: now };
			const full = fwd(p.origin.loc, onsPosAt(p, now, 1, p.origin), p.w);
			if (full >= 80) {
				p.ratio = snapFree(fwd(p.origin.loc, loc, p.w) / full);
				p.measured = true;
				noteFree(p.ratio, 'Onslaught (your client)');
			}
			p.base = { loc, at: now };
		},
		reset() {
			svMoves.clear();
			onsPred = null;
			resetCombo();
			for (const h of held) api.clearTimeout(h.timer);
			held.length = 0;
			if (pendingSpring) api.clearTimeout(pendingSpring.timer);
			pendingSpring = null;
			pressHeld = null;
			mismatch.clear();
			defended = false;
			leashUntil = 0;
			scSpeed = 1;
		},
		// a skill without prediction must not reach the server before a held block release or held skill
		passOff(name, version, event) {
			const up = pressUpSendAt(pressHeld);
			let at = up && up !== Infinity ? up + 10 : 0;
			for (const h of held) at = Math.max(at, (h.sendAt || 0) + 5);
			if (at <= Date.now()) return false;
			const ev = api.copyEvent(event);
			api.setTimeout(() => {
				api.recordPacket('MOD->S', name + ' [skill without prediction sent after the held request]', { skill: api.skillLabel(getSkillId(ev.skill)) });
				api.dispatch.toServer(name, version, ev);
			}, at - Date.now());
			return true;
		},
		bugState() {
			return `combo=${comboStep} block=${blockBase} defended=${defended ? 1 : 0} leash=${Date.now() < leashUntil ? 1 : 0} stamina=${stamina} sc=${scSpeed}`;
		}
	};
	return cls;
}

module.exports = {
	NAME: 'Lancer-SP',
	NOTIFY_REPEAT_LATEST: true,
	CMD: 'lancer',
	CLASS_LABEL: 'Lancer',
	JOB: 1,
	AUTHORS: 'Abdull',

	OMNI: {
		15: { dir: 'north', targeted: true, dest: 495 },
		26: { dir: 'south' }
	},
	COLOR: '#56B4E9',
	DATA_DIR: 'lancer',
	GLOBAL_LOCK_DELAY: 250,
	RETRY_DELAYS: [],
	NOTIFY_REPEATS: [100],
	END_DESYNC_FIX: true,
	NO_SPEED_LEARN: true,

	MEASURED_UPDATES: [
		{ key: 'debilitate', prop: 'duration', old: [920], value: 940 },

		{ key: 'shieldBash', prop: 'duration', old: [852, 825], value: 830 },
		{ key: 'combo', prop: 'durations', old: [[655, 1018, 1800], [650, 1000, 1800]], value: [645, 1018, 1800] },
		{ key: 'onslaught', prop: 'stages', old: [[940, 515, 515, 515, 387, 740]], value: [950, 480, 535, 510, 395, 755] },
		{ key: 'onslaught', prop: 'chainStages', old: [[670, 377, 377, 377, 284, 595]], value: [680, 370, 385, 390, 265, 580] }
	],
	DEFAULT_SKILLS,
	FAMILIES,
	GLYPHS,
	LEGACY,
	EXTRA_CONFIG: {},
	COMMANDS: {},
	setup
};
// Soaria
