'use strict';
// Abdull

const DEFAULT_SKILLS = {
	combo: { name: 'Combo Attack', durations: [567, 667, 667, 925] },
	evasiveRoll: { name: 'Evasive Roll', duration: 820, distance: 150 },
	torrentOfBlows: { name: 'Torrent of Blows', duration: 1590 },
	rainOfBlows: { name: 'Rain of Blows', duration: 2542, chainDuration: 1990 },
	battleCry: { name: 'Battle Cry', duration: 1667 },

	battleCry91: { name: 'Infuriate (59100)', duration: 3430 },
	deathFromAbove: { name: 'Death From Above', duration: 2020 },
	poisonBlade: { name: 'Poison Blade', duration: 935 },
	leapingStrike: { name: 'Leaping Strike', duration: 1520, distance: 100 },
	retaliate: { name: 'Retaliate' },
	assaultStance: { name: 'Assault Stance' },
	defensiveStance: { name: 'Defensive Stance' },

	chargingSlash: { name: 'Charging Slash', duration: 1100, distance: 494, minDuration: 165, stopShort: 85 },
	chargingSlashHit: { name: 'Charging Slash (follow-up)', duration: 800 },
	vortexSlash: { name: 'Vortex Slash', duration: 1600 },
	combativeStrike: { name: 'Combative Strike', duration: 1095 },
	risingFury: { name: 'Rising Fury', durations: [725, 1393] },
	deadlyGamble: { name: 'Deadly Gamble', duration: 325 },
	cascadeOfStuns: { name: 'Cascade of Stuns', duration: 1400 },
	backstab: { name: 'Backstab', duration: 1275 },
	staggerCounter: { name: 'Skill 23 (stagger counter)', duration: 1058 },
	smokeAggressor: { name: 'Smoke Aggressor', stages: [158, 163] },
	pounce: { name: 'Pounce', duration: 2005, distance: 100 },
	traverseCut: { name: 'Traverse Cut', duration: 2000, chainDuration: 2650, distance: 80 },
	bladeDraw: { name: 'Blade Draw', duration: 3000, chainDuration: 1315 },
	scythe: { name: 'Scythe', duration: 1833, chainDuration: 1375 },
	reapingSlash: { name: 'Reaping Slash', duration: 2292, chainDuration: 1667 },
	block: { name: 'Block (defensive stance)' },
	flanker: { name: 'Flanker' },
	bindingSword: { name: 'Binding Sword', duration: 1890 },
	infuriate: { name: 'Infuriate', duration: 2417 }
};

const RETRY = [35, 75];
const D = (skill) => ({ skill, ms: 'duration' });

const L_SCYTHE = D('30:0'), L_REAP = D('31:0'), L_ROB = D('4:0'), L_BD = D('29:0'), L_TC = D('28:0');
const LOCK_ALL5 = [L_SCYTHE, L_REAP, L_ROB, L_BD, L_TC];
const NO_CHAIN = [{ from: [], sub: 30 }];

const FAMILIES = {
	1: { key: 'combo', mode: 'combo', subs: [0, 1, 2, 3], selfLock: 0, retry: false },

	2: { key: 'evasiveRoll', mode: 'simple', retry: false, selfLock: 0, unlocks: ['30:0'],
		locks: [D('17:0'), D('10:0'), L_REAP, L_ROB, L_BD, L_TC] },
	3: { key: 'torrentOfBlows', mode: 'simple', retry: RETRY, locks: LOCK_ALL5 },

	4: { key: 'rainOfBlows', mode: 'simple', chains: [{ from: [18, 27, 21], sub: 30 }], retry: false, locks: [L_BD, L_TC] },
	5: { key: 'battleCry', mode: 'simple', retry: RETRY, locks: LOCK_ALL5 },
	8: { key: 'assaultStance', mode: 'passthrough' },
	9: { key: 'defensiveStance', mode: 'passthrough' },

	10: { key: 'deathFromAbove', mode: 'simple', retry: RETRY, cancelOnlyBy: [],
		locks: [D('2:0'), D('3:0'), L_SCYTHE, L_REAP, L_ROB, L_BD, L_TC] },

	11: { key: 'poisonBlade', mode: 'simple', retry: RETRY, locks: [L_REAP, L_ROB, L_BD] },
	12: { key: 'leapingStrike', mode: 'simple', retry: RETRY, locks: [L_ROB, L_BD, L_REAP] },
	13: { key: 'retaliate', mode: 'passthrough' },

	16: { key: 'chargingSlash', keys: { 1: 'chargingSlashHit' }, mode: 'simple', subs: [1], serverSubs: [0], retry: RETRY, prevEndType: 6,
		locks: [L_SCYTHE, L_TC, L_REAP, L_ROB, D('11:0'), D('18:0'), D('18:1')] },

	17: { key: 'vortexSlash', mode: 'simple', subs: [0, 1, 2], retry: RETRY, locks: [L_SCYTHE, L_REAP, L_ROB, L_TC] },
	18: { key: 'combativeStrike', mode: 'simple', subs: [0, 1], retry: RETRY, unlocks: ['4:0'],
		locks: [L_SCYTHE, L_BD, { skill: '18:0', ms: 250 }, { skill: '18:1', ms: 250 }] },

	19: { key: 'risingFury', mode: 'combo', subs: [0, 1], retry: false, bySub: { 0: { locks: LOCK_ALL5 } } },
	20: { key: 'deadlyGamble', mode: 'simple', fixedSpeed: true, retry: RETRY },
	21: { key: 'cascadeOfStuns', mode: 'simple', retry: RETRY, locks: [L_REAP, L_BD, L_SCYTHE, L_TC] },

	23: { key: 'staggerCounter', mode: 'simple', retry: RETRY, locks: LOCK_ALL5 },
	24: { key: 'smokeAggressor', mode: 'stages', fixedSpeed: true, retry: RETRY },
	27: { key: 'pounce', mode: 'simple', retry: RETRY, locks: [L_REAP, L_SCYTHE, L_BD] },

	28: { key: 'traverseCut', mode: 'simple', chains: [{ from: [12, 11, 18, 27], sub: 30 }], retry: false, unlocks: ['29:0'],
		locks: [L_SCYTHE, L_REAP, L_ROB] },

	29: { key: 'bladeDraw', mode: 'simple', chains: NO_CHAIN, retry: false, selfLock: 'duration', unlocks: ['30:0'], locks: [L_ROB, L_REAP, L_TC] },

	30: { key: 'scythe', mode: 'simple', chains: [{ from: [11, 4, 29, 2], sub: 30 }], retry: false, locks: [L_ROB, L_REAP, L_TC] },

	31: { key: 'reapingSlash', mode: 'simple', chains: [{ from: [18, 4], sub: 30 }], retry: false },

	32: { key: 'block', mode: 'hold', subs: [0], releaseSub: null, releaseEndType: 10, prevEndType: 6, fixedSpeed: true,
		retry: false, selfLock: 0, pressRetry: RETRY,
		unlocks: ['2:0', '30:0', '29:0', '4:0', '3:0', '31:0', '34:0', '28:0', '18:0', '18:1', '11:0', '1:0', '1:1', '1:2', '1:3'] },
	33: { key: 'flanker', mode: 'passthrough' },

	34: { key: 'bindingSword', mode: 'simple', retry: RETRY, interruptOnly: [] },

	35: { key: 'infuriate', mode: 'simple', retry: RETRY, locks: LOCK_ALL5 }
};

const SELF_FOLLOWS = [1, 16, 17, 19];
const SELF_END_MARGIN = 100;

const ABN_DEFENSIVE_STANCE = [100297, 100298, 100299];

const ABN_STAGGER_COUNTER = 100700;

const ABN_VORTEX = 100400;

const ABN_BLOCK_HIT = 102010;
const MIN_ROLL_STAMINA = 380;
const VORTEX_WINDOW = 5000;
const BLOCK_CHAIN_AFTER = 1000;
const BD_COMBATIVE_LOCK = 1304;
const CHARGE_LOCK = 1100;
const CHARGE_END_FALLBACK = 500;

// a held request should reach the server this long after its previous skill ended
const HOLD_ARRIVE_AFTER = 30;
const LAG_HOLD_MIN = 15;

// earliest point (attack speed 1.0) the server accepts these chains; earlier requests are held
const CHAIN_MIN = [
	{ group: 29, from: '19:1', ms: 540 },
	{ group: 30, from: '2:0', ms: 320 }
];

const GLYPH_BATTLE_CRY = [21040, 21109];
const GLYPH_POUNCE = [21082];

const LEGACY = {
	dirs: ['neuesWarriorSP'],
	config: { DISABLE_BACKSTAB_MOVE_PREDICTION: null },
	skillData(o) {
		const r = (v) => (Number.isFinite(v) ? Math.round(v / 1.2) : undefined);
		const out = {};
		const copyDur = (key, from) => {
			const v = o[from || key];
			if (!v) return;
			const x = {};
			if (Array.isArray(v.durations)) x.durations = v.durations.map(r);
			if (Number.isFinite(v.duration)) x.duration = r(v.duration);
			if (Number.isFinite(v.chainDuration)) x.chainDuration = r(v.chainDuration);
			if (Number.isFinite(v.distance)) x.distance = v.distance;
			out[key] = x;
		};
		for (const key of ['combo', 'evasiveRoll', 'torrentOfBlows', 'rainOfBlows', 'battleCry', 'deathFromAbove', 'poisonBlade', 'leapingStrike',
			'vortexSlash', 'combativeStrike', 'risingFury', 'deadlyGamble', 'cascadeOfStuns', 'backstab', 'staggerCounter', 'pounce',
			'traverseCut', 'bladeDraw', 'scythe', 'reapingSlash', 'bindingSword', 'infuriate']) copyDur(key);
		const cs = o.chargingSlash;
		if (cs) {
			out.chargingSlash = { duration: cs.duration, distance: cs.distance };
			if (Number.isFinite(cs.followUpDuration)) out.chargingSlashHit = { duration: r(cs.followUpDuration) };
		}
		const sa = o.smokeAggressor;
		if (sa && Number.isFinite(sa.duration) && Number.isFinite(sa.stage0Duration)) {
			out.smokeAggressor = { stages: [r(sa.stage0Duration), r(sa.duration - sa.stage0Duration)] };
		}
		return out;
	}
};

function setup(api) {
	const { groupOf, subOf, baseOf, getSkillId } = api;
	const at = (id, g, ...subs) => groupOf(id) === g && (subs.length === 0 || subs.includes(subOf(id)));
	const running = () => { const a = api.action(); return a && !a.finished && !a.isHold ? a : null; };
	const runningIs = (g, ...subs) => { const a = running(); return Boolean(a && at(a.skillId, g, ...subs)); };
	const runningIn = (list) => { const a = running(); return Boolean(a && api.matchesAny(plain(a.skillId), list)); };

	const plain = (id) => (subOf(id) >= 30 ? id - 30 : id);

	let stanceSkill = null;
	const dstance = () => ABN_DEFENSIVE_STANCE.some(id => api.hasAbnormal(id)) || stanceSkill === 9;
	const rankOf = (id) => Math.floor((id % 10000) / 100);
	const isSkill591 = (id) => groupOf(id) === 5 && rankOf(id) >= 90;
	const cfg = () => api.config;

	let comboStep = 0, comboReset = null;
	let vortexUntil = 0;
	let vortexBuffEndAt = 0;

	const vortexReady = () => api.hasAbnormal(ABN_VORTEX) || (Date.now() < vortexUntil && vortexBuffEndAt < vortexUntil - VORTEX_WINDOW);
	let blockHeld = false;
	let blockChainUntil = 0;
	let blockDefended = false;
	let tobBlocked = false;
	let bdLockUntil = 0;

	let bdRepeatUntil = 0, bdRepeatSetAt = 0;
	let stamina = 99999;
	let backstab = null;
	let teleport = null;

	function realServerSkill() {
		const sv = api.serverActive();
		return sv && api.clientAction() === sv.actionId ? sv.id : 0;
	}

	// how long the server still plays its current skill
	function serverBusyLeft() {
		const a = api.action();
		const sv = api.serverActive();
		if (!a || !a.finished || !sv || groupOf(sv.id) !== groupOf(a.skillId) || !a.speed) return -Infinity;
		return sv.at + a.normDuration / a.speed - api.estimateRtt() - Date.now();
	}

	function sourceSkill() {
		const a = api.action();
		if (a && !a.finished && !a.isHold) return a.skillId;
		const real = realServerSkill();
		if (real) return real;
		if (!a || a.isHold) return 0;
		return serverBusyLeft() > 15 ? a.skillId : 0;
	}
	const backstabRunning = () => Boolean(backstab && !backstab.ended && api.clientAction() === backstab.actionId);
	const mismatch = new Set();

	// how long a request is held so the server does not ignore it
	function holdDelay(sid, chain) {
		const g = groupOf(sid);
		if (chain || g === 2 || g === 13) return 0;
		const prev = api.action();
		if (!prev || !prev.finished || prev.isHold) return 0;
		const busy = serverBusyLeft();
		return busy + HOLD_ARRIVE_AFTER > 0 ? busy + HOLD_ARRIVE_AFTER : 0;
	}

	// DTmaik
	function chainFromPrev(sid) {
		const prev = api.action();
		const fam = api.familyDef(sid);
		return Boolean(prev && fam && (fam.chains || []).some(ch => api.matchesAny(plain(prev.requestId || prev.skillId), ch.from)));
	}

	function holdAfterPredict(info, event, delay) {
		if (!(delay > 0)) return 'done';
		const a = api.action();
		if (a && !a.finished) a.heldUntil = Date.now() + delay;
		api.holdRequest(info.name, info.version, event, delay);
		return 'drop';
	}

	// how far the server runs behind our animation (its start minus ours minus ping)
	function serverLag(ours) {
		if (!ours) return 0;
		const sv = api.serverActive();
		if (sv && groupOf(sv.id) === groupOf(ours.skillId) && sv.at >= ours.requestedAt) return sv.at - ours.startedAt - rttTyp();
		if (ours.heldUntil) return ours.heldUntil - ours.startedAt;
		return 0;
	}

	function serverStartOf(ours) {
		const sv = api.serverActive();
		if (sv && groupOf(sv.id) === groupOf(ours.skillId) && sv.at >= ours.requestedAt) return sv.at;
		return ours.startedAt + Math.max(0, serverLag(ours)) + rttTyp();
	}

	function requestHold(sid, chain) {
		const g = groupOf(sid);

		const ours = running();
		if (!ours) return holdDelay(sid, chain);
		if (g === 2 || g === 13) return 0;
		let delay = 0;
		const lag = serverLag(ours);
		if (lag > LAG_HOLD_MIN) delay = lag;
		const speed = ours.speed || api.aspd() || 1;
		const cm = CHAIN_MIN.find(c => c.group === g && api.matchesAny(ours.skillId, [c.from]));
		if (cm) {
			const arrive = (Date.now() - serverStartOf(ours) + rttTyp()) * speed;
			delay = Math.max(delay, (cm.ms - arrive) / speed);
		}
		if (chain && delay > 0) {
			const srcLeft = serverStartOf(ours) + ours.normDuration / speed - rttTyp() - Date.now();
			delay = Math.min(delay, Math.max(0, srcLeft - 20));
		}
		if (delay > 0) api.recordPacket('MOD', 'Request held back (server behind our animation / chain too early)', { skill: api.skillLabel(sid), delay: Math.round(delay) });
		return delay > 0 ? delay : 0;
	}
	let pendingHold = null;

	const rttSamples = [];
	// typical ping from our own confirmed skills (median)
	function rttTyp() {
		if (rttSamples.length < 3) return api.estimateRtt();
		const sorted = rttSamples.slice().sort((x, y) => x - y);
		return sorted[Math.floor(sorted.length / 2)];
	}
	// Abdull
	function noteRtt(event, sid) {
		const a = running();
		if (!a || a.rttSampled || event.stage !== 0 || groupOf(a.skillId) !== groupOf(sid)) return;
		a.rttSampled = true;
		const sample = Date.now() - Math.max(a.requestedAt, a.heldUntil || 0);
		if (sample > 0 && sample < 1000) { rttSamples.push(sample); if (rttSamples.length > 12) rttSamples.shift(); }
	}

	function resync(event, sid) {
		const a = running();
		if (!a || a.resynced || event.stage !== 0 || groupOf(a.skillId) !== groupOf(sid)) return;
		a.resynced = true;
		const late = Date.now() - a.startedAt - rttTyp();
		if (late < 30 || late > 1500 || !a.endAt) return;
		api.scheduleActionEnd(a, a.endAt - a.startedAt + late);
		api.recordPacket('MOD', 'Server started it late: our animation ends later', { skill: api.skillLabel(a.skillId), late: Math.round(late) });
	}

	function variantMismatch(event, sid) {
		const a = running();
		if (!a || event.stage !== 0 || a.skillId === sid || groupOf(a.skillId) !== groupOf(sid) || SELF_FOLLOWS.includes(groupOf(sid))) return;
		if (plain(a.skillId) !== plain(sid)) return;
		const data = api.dataOf(api.familyDef(sid), subOf(sid));
		const dur = data ? (subOf(sid) >= 30 ? data.chainDuration : data.duration) : undefined;
		mismatch.add(event.id);
		if (!(dur > 0)) return;
		a.normDuration = dur;
		api.scheduleActionEnd(a, dur / (a.speed || 1));

		const left = Math.max(0, dur / (a.speed || 1) - (Date.now() - a.startedAt));
		const fam = api.familyDef(a.requestId || a.skillId) || {};
		if (fam.selfLock === 'duration') api.lock(a.requestId || a.skillId, left);
		for (const l of (fam.locks || [])) if (l.ms === 'duration') api.lock(l.skill, left);
		api.recordPacket('MOD', 'Server plays another variant: timed to it', { ours: api.skillLabel(a.skillId), server: api.skillLabel(sid) });
	}

	function predictCombo(event, info, a) {
		const sid = info.sid;
		const step = subOf(sid) > 0 ? Math.min(subOf(sid), 3) : Math.min(comboStep, 3);
		const id = baseOf(sid) + step;
		const d = api.skills.combo.durations[step] || 800;
		const b = api.startAction(event, id, { duration: d, prevEndType: a && groupOf(a.skillId) === 1 ? 6 : undefined, requestId: sid });
		comboStep = step === 3 ? 0 : step + 1;
		api.clearTimeout(comboReset);

		comboReset = api.setTimeout(() => { comboStep = 0; }, b.normDuration / (b.speed || 1));
		return 'done';
	}
	function resetCombo() {
		comboStep = 0;
		api.clearTimeout(comboReset);
	}

	function bladeDrawChains(sid) {
		if (!api.skillExists(sid + 30)) return false;
		const src = sourceSkill();
		if (src && api.matchesAny(plain(src), [17, 28, '19:1', '16:1'])) return true;

		if (api.hasAbnormal(ABN_BLOCK_HIT)) return true;
		return false;
	}
	// DTmaik
	function predictBladeDraw(event, info) {
		const sid = info.sid;
		const chain = bladeDrawChains(sid);
		const d = api.skills.bladeDraw;
		const a = api.startAction(event, sid + (chain ? 30 : 0), { duration: chain ? d.chainDuration : d.duration, prevEndType: 4, requestId: sid });
		api.applyLocks(info.fam, sid, a);
		if (chain) {
			api.lock('18:0', BD_COMBATIVE_LOCK / (a.speed || 1));
			api.lock('18:1', BD_COMBATIVE_LOCK / (a.speed || 1));
			api.recordPacket('MOD', 'Chain predicted', { skill: api.skillLabel(sid + 30) });
		}
		blockChainUntil = 0;
		tobBlocked = false;

		if (cfg().BD_LOCK) bdLockUntil = Date.now() + (Number(cfg().BD_LOCK_DURATION) || 600) / ((api.aspd() || 1) * 1.2);
		api.setLastSkill(sid, event);
		return 'done';
	}

	function predictCharging(event, info) {
		const sid = info.sid;
		const d = api.skills.chargingSlash;
		if (!event.dest) return undefined;
		const t = event.targets && event.targets.length ? event.targets[0] : null;
		const targetId = t ? (t.gameId || t.id || 0n) : 0n;
		const hasTarget = Boolean(targetId && targetId !== 0n && targetId !== 0);
		const full = Math.hypot(event.dest.x - event.loc.x, event.dest.y - event.loc.y);
		let dest = { x: event.dest.x, y: event.dest.y, z: event.dest.z };
		const stop = d.stopShort !== undefined ? d.stopShort : 85;
		if (hasTarget && full > stop) {
			const k = (full - stop) / full;
			dest = { x: event.loc.x + (event.dest.x - event.loc.x) * k, y: event.loc.y + (event.dest.y - event.loc.y) * k, z: event.dest.z };
		}
		const travel = Math.hypot(dest.x - event.loc.x, dest.y - event.loc.y);
		const duration = Math.max(d.minDuration || 0, (travel / d.distance) * d.duration);
		api.startAction(event, sid, { duration, fixedSpeed: true, dest, endType: hasTarget ? 0 : 39, prevEndType: 4, requestId: sid });
		resetCombo();
		api.lock(sid, api.GLOBAL_LOCK_DELAY);
		api.lock('11:0', CHARGE_LOCK);
		api.lock('18:0', CHARGE_LOCK);
		api.lock('18:1', CHARGE_LOCK);
		api.scheduleRetries('C_START_TARGETED_SKILL', 6, event, RETRY);
		api.setLastSkill(sid, event);
		return 'done';
	}
	api.hook('S_INSTANT_DASH', 3, (event) => {
		if (!api.predicting() || event.gameId !== api.cid()) return;
		const a = running();
		if (!a || !at(a.skillId, 16, 0)) return;
		const d = api.skills.chargingSlash;
		a.dest = { x: event.loc.x, y: event.loc.y, z: event.loc.z };
		const travel = Math.hypot(event.loc.x - a.start.x, event.loc.y - a.start.y);
		a.normDuration = Math.max(d.minDuration || 0, (travel / d.distance) * d.duration) + CHARGE_END_FALLBACK;
		api.scheduleActionEnd(a, a.normDuration / (a.speed || 1));
	});

	function clearBackstab() {
		if (backstab) api.clearTimeout(backstab.timer);
		backstab = null;
	}
	// Soaria
	// Backstab runs through the server (teleport): we only end its animation
	function backstabPressed() {
		clearBackstab();
		backstab = { at: Date.now(), timer: null, actionId: null, ended: false };
		teleport = null;
		resetCombo();
	}
	function backstabStarted(event) {
		const b = backstab;
		if (!b || b.actionId !== null) return;
		b.actionId = event.id;
		b.svAt = Date.now();
		const ms = api.skills.backstab.duration / (api.aspd() || 1);
		b.timer = api.setTimeout(() => {
			if (backstab !== b || api.clientAction() !== b.actionId) return;
			const loc = teleport || event.loc;
			api.recordPacket('MOD', 'Backstab ended on time', {});
			api.sendEnd(getSkillId(event.skill), 0, { x: loc.x, y: loc.y, z: loc.z }, teleport ? teleport.w : event.w, b.actionId);
			b.ended = true;
		}, Math.max(0, b.at + ms - Date.now()));
	}
	api.hook('S_INSTANT_MOVE', 3, (event) => {
		if (!api.enabled() || event.gameId !== api.cid()) return;
		teleport = { x: event.loc.x, y: event.loc.y, z: event.loc.z, w: event.w };
	});

	api.hook('S_PLAYER_CHANGE_STAMINA', 1, (event) => {
		if (api.enabled()) stamina = Number(event.current);
	});

	api.hook('S_ABNORMALITY_END', 1, (event) => {
		if (!api.enabled() || event.target !== api.cid()) return;
		if (Number(event.id) === ABN_VORTEX) vortexBuffEndAt = Date.now();

		if (ABN_DEFENSIVE_STANCE.includes(Number(event.id))) stanceSkill = null;
	});
	api.hook('S_DEFEND_SUCCESS', 3, (event) => {
		if (!api.enabled() || event.gameId !== api.cid()) return;
		blockDefended = true;
		if (dstance() && (runningIs(3) || at(api.lastSkill(), 3))) {
			tobBlocked = true;
			api.unlock('29:0');
		}
	});

	return {
		skillSpeed(sid) {
			const g = groupOf(sid);
			if (g === 5 && !isSkill591(sid) && GLYPH_BATTLE_CRY.some(api.isGlyph)) return 1.5;
			if (g === 27 && GLYPH_POUNCE.some(api.isGlyph)) return 1.3;
			return 1;
		},

		requestDelay(sid) {
			const delay = requestHold(sid, chainFromPrev(sid));
			pendingHold = delay > 0 ? { until: Date.now() + delay, at: Date.now() } : null;
			return delay;
		},

		start(event, info) {
			const sid = info.sid;
			const g = groupOf(sid);
			if (!info.fam) return undefined;

			if (Date.now() < bdLockUntil && g !== 2 && g !== 10) return 'drop';

			if (g === 29 && cfg().BD_REPEAT_LOCK && Date.now() < bdRepeatUntil &&
				(Date.now() - bdRepeatSetAt < rttTyp() + 150 || api.serverAckAt(29) >= bdRepeatSetAt)) {
				api.recordPacket('MOD', 'Blade Draw dropped (pressed again right after Blade Draw)', {});
				return 'drop';
			}
			if (g !== 29) bdRepeatUntil = 0;
			if (blockHeld && g !== 29 && g !== 33) return 'drop';
			if ([4, 28, 31].includes(g) && runningIn([31, 30, 34])) return 'drop';
			if (g === 30 && runningIn([30, 31, 34])) return 'drop';

			if (g === 30 && runningIs(12) && (running().endAt || Infinity) - Date.now() > SELF_END_MARGIN) return 'pass';
			if (runningIs(19, 1) && ![2, 10, 29].includes(g)) return 'drop';
			if ((g === 5 || g === 35) && runningIs(17, 1, 2)) return 'drop';
			if (g === 2 && stamina < MIN_ROLL_STAMINA) return 'drop';
			if (g === 29) { bdRepeatUntil = Date.now() + (Number(cfg().BD_REPEAT_LOCK_TIME) || 1000); bdRepeatSetAt = Date.now(); }

			if (g === 17 && subOf(sid) === 0 && !vortexReady()) return 'pass';
			if (g === 35 && !dstance()) return 'pass';
			if (g === 23 && (!api.hasAbnormal(ABN_STAGGER_COUNTER) || dstance())) return 'pass';

			if (runningIs(16, 0) && g === 29) return 'drop';
			if ((runningIs(16, 0) || backstabRunning()) && [4, 28, 29, 30, 31, 34].includes(g)) return 'pass';

			if (!SELF_FOLLOWS.includes(g)) {
				const a = running();
				if ((a && groupOf(a.skillId) === g && (a.endAt || Infinity) - Date.now() > SELF_END_MARGIN) || groupOf(realServerSkill()) === g) return 'pass';
			}

			if (api.isLocked(sid)) return undefined;
			if (api.cooldownLeft(sid) > 50) return undefined;
			if (g !== 1) resetCombo();
			if (isSkill591(sid)) {
				const delay = requestHold(sid, false);
				const a = api.startAction(event, sid, { duration: api.skills.battleCry91.duration, prevEndType: 4, requestId: sid });
				api.applyLocks(info.fam, sid, a);
				api.setLastSkill(sid, event);
				return holdAfterPredict(info, event, delay);
			}
			if (g === 1) {
				const delay = requestHold(sid, false);
				predictCombo(event, info, running());
				return holdAfterPredict(info, event, delay);
			}
			if (g === 29 && subOf(sid) === 0) {
				const delay = requestHold(sid, bladeDrawChains(sid));
				predictBladeDraw(event, info);
				return holdAfterPredict(info, event, delay);
			}
			return undefined;
		},
		press(event, info) {
			const sid = info.sid;
			const g = groupOf(sid);
			if (Date.now() < bdLockUntil && g !== 2) return 'drop';
			if (g !== 32) return undefined;

			if (!dstance()) return 'pass';
			if (!event.press) {
				if (blockHeld) blockChainUntil = Date.now() + BLOCK_CHAIN_AFTER;
				blockHeld = false;
				return undefined;
			}
			blockHeld = true;
			blockDefended = false;
			bdLockUntil = 0;
			resetCombo();
			return undefined;
		},
		targeted(event, info) {
			const sid = info.sid;
			const g = groupOf(sid);
			if (blockHeld && g !== 33) return 'drop';
			bdRepeatUntil = 0;
			if (g === 22) {
				const busy = running() ? -Infinity : serverBusyLeft();
				if (busy + HOLD_ARRIVE_AFTER > 0) {
					const copy = api.copyEvent(event);
					api.setTimeout(() => {
						if (!cfg().DISABLE_BACKSTAB) backstabPressed();
						api.recordPacket('MOD->S', 'C_START_TARGETED_SKILL [held Backstab sent]', { skill: api.skillLabel(sid) });
						api.dispatch.toServer('C_START_TARGETED_SKILL', 6, copy);
					}, busy + HOLD_ARRIVE_AFTER);
					api.recordPacket('MOD', 'Backstab held back (server still plays the previous skill)', { busy: Math.round(busy) });
					api.setLastSkill(sid, event);
					return 'drop';
				}
				if (!cfg().DISABLE_BACKSTAB) backstabPressed();
				api.setLastSkill(sid, event);
				return undefined;
			}
			if (g === 16 && subOf(sid) === 0 && !api.isLocked(sid)) return predictCharging(event, info);
			resetCombo();
			return undefined;
		},
		predicted(sid, a) {
			const g = groupOf(sid);
			if (a && pendingHold && Date.now() - pendingHold.at < 5) a.heldUntil = pendingHold.until;
			pendingHold = null;
			if (g === 10 || g === 2) vortexUntil = Date.now() + VORTEX_WINDOW;
			if (g === 17 && subOf(sid) === 0) vortexUntil = 0;
			if (g === 3) tobBlocked = false;
			if (g === 2) clearBackstab();

			if (g === 2 && a) api.lock(sid, Math.max(0, a.normDuration / a.speed - 100));
			void a;
		},
		serverStage(event, sid) {
			variantMismatch(event, sid);
			if (!mismatch.has(event.id)) resync(event, sid);
			noteRtt(event, sid);
			if (at(sid, 22) && event.stage === 0 && !cfg().DISABLE_BACKSTAB) backstabStarted(event);
			if (event.stage === 0 && (groupOf(sid) === 8 || groupOf(sid) === 9)) stanceSkill = groupOf(sid);
			if (event.stage === 0 && (groupOf(sid) === 32 || groupOf(sid) === 35) && stanceSkill === null) stanceSkill = 9;

			if (groupOf(sid) === 39 && runningIs(28)) return false;
			return undefined;
		},
		serverEnd(event, sid) {
			if (mismatch.has(event.id)) {
				mismatch.delete(event.id);
				const a = running();
				if (a && groupOf(a.skillId) === groupOf(sid)) {
					a.finished = true;
					api.clearActionTimers(a);
					api.recordPacket('S->C', 'S_ACTION_END [MIRRORED: server variant ended]', { ours: api.skillLabel(a.skillId), server: api.skillLabel(sid) });
					api.sendEnd(a.skillId, event.type, { x: event.loc.x, y: event.loc.y, z: event.loc.z }, a.w, a.id);
					if (event.type !== 0) api.unlock(a.requestId || a.skillId);
					return false;
				}
			}
			if (at(sid, 22) && backstab && backstab.actionId === event.id) {
				const ended = backstab.ended;
				clearBackstab();
				if (ended) return false;
			}
			return undefined;
		},
		learnTarget(id) {
			if (at(id, 16, 0)) return null;
			if (isSkill591(id)) return { key: 'battleCry91', prop: 'duration' };
			if (groupOf(id) === 39) return { key: 'traverseCut', prop: subOf(id) >= 30 ? 'chainDuration' : 'duration' };
			return undefined;
		},
		reset() {
			bdRepeatUntil = 0;
			stanceSkill = null;
			mismatch.clear();
			resetCombo();
			clearBackstab();
			vortexUntil = 0;
			blockHeld = false;
			blockChainUntil = 0;
			blockDefended = false;
			tobBlocked = false;
			bdLockUntil = 0;
		},
		bugState() {
			return `combo=${comboStep} ds=${dstance() ? 1 : 0} block=${blockHeld ? 1 : 0}/${blockDefended ? 1 : 0} tob=${tobBlocked ? 1 : 0} vortex=${vortexReady() ? 1 : 0} ` +
				`bdLock=${Date.now() < bdLockUntil ? 1 : 0} stamina=${stamina} backstab=${backstab ? (backstab.ended ? 'ended' : 'running') : '-'}`;
		}
	};
}

module.exports = {
	NAME: 'Warrior-SP',
	CMD: 'warrior',
	CLASS_LABEL: 'Warrior',
	JOB: 0,
	AUTHORS: 'Abdull',

	OMNI: {
		12: { dir: 'north' },
		16: { dir: 'north', targeted: true, dest: 495 },
		27: { dir: 'north' }
	},
	COLOR: '#56B4E9',
	DATA_DIR: 'warrior',
	GLOBAL_LOCK_DELAY: 250,
	RETRY_DELAYS: [],
	NOTIFY_REPEATS: [100],
	END_DESYNC_FIX: true,
	ASPD_BASE: 120,

	CHAIN_GROUPS: [4, 28, 29, 30, 31],
	DEFAULT_SKILLS,
	FAMILIES,
	LEGACY,

	MEASURED_UPDATES: [
		{ key: 'evasiveRoll', prop: 'duration', old: [833], value: 820 },
		{ key: 'torrentOfBlows', prop: 'duration', old: [1600], value: 1590 },
		{ key: 'rainOfBlows', prop: 'chainDuration', old: [2000], value: 1990 },
		{ key: 'deathFromAbove', prop: 'duration', old: [2033, 2010], value: 2020 },
		{ key: 'poisonBlade', prop: 'duration', old: [833], value: 935 },
		{ key: 'leapingStrike', prop: 'duration', old: [1533], value: 1520 },
		{ key: 'combativeStrike', prop: 'duration', old: [1083, 1088], value: 1095 },
		{ key: 'pounce', prop: 'duration', old: [1983, 2012], value: 2005 },
		{ key: 'traverseCut', prop: 'chainDuration', old: [2667], value: 2650 },
		{ key: 'bladeDraw', prop: 'chainDuration', old: [1333, 1322], value: 1315 },
		{ key: 'scythe', prop: 'chainDuration', old: [1388], value: 1375 },
		{ key: 'risingFury', prop: 'durations', old: [[733, 1400]], value: [725, 1393] },

		{ key: 'deadlyGamble', prop: 'duration', old: [1175, 310], value: 325 },

		{ key: 'bindingSword', prop: 'duration', old: [2283], value: 1890 },

		{ key: 'chargingSlashHit', prop: 'duration', old: [775], value: 800 }
	],
	EXTRA_CONFIG: {
		DISABLE_BACKSTAB: false,
		DISABLE_BACKSTAB_DESCRIPTION: 'Disables the Backstab prediction: Backstab then runs completely through the server (one ping later, but the camera always turns like without the mod) (!warrior backstab)',
		BD_LOCK: false,
		BD_LOCK_DESCRIPTION: 'Blade Draw cannot be cancelled within BD_LOCK_DURATION except by Evasive Roll / Death From Above (prevents accidental cancels) (!warrior bdlock)',
		BD_LOCK_DURATION: 600,
		BD_LOCK_DURATION_DESCRIPTION: 'Blade Draw lock in ms (with BD_LOCK), shortened by attack speed like in the old script',
		BD_REPEAT_LOCK: true,
		BD_REPEAT_LOCK_DESCRIPTION: 'Blade Draw pressed again right after Blade Draw (e.g. key spam after a reset) is ignored for BD_REPEAT_LOCK_TIME or until you use another skill (!warrior bdrepeat)',
		BD_REPEAT_LOCK_TIME: 1000,
		BD_REPEAT_LOCK_TIME_DESCRIPTION: 'ms Blade Draw stays locked after Blade Draw (with BD_REPEAT_LOCK)',
	},
	COMMANDS: {
		backstab: { key: 'DISABLE_BACKSTAB', label: 'Backstab prediction', invert: true },
		bdlock: { key: 'BD_LOCK', label: 'Blade Draw lock' },
		bdrepeat: { key: 'BD_REPEAT_LOCK', label: 'Blade Draw repeat lock' },
	},
	setup
};
// DTmaik
