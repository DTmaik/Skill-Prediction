'use strict';
// DTmaik

const DEFAULT_SKILLS = {
	combo: { name: 'Combo Attack', durations: [825, 1025, 750, 1620] },
	knockdownStrike: { name: 'Knockdown Strike', duration: 3110, chainDuration: 2380, distance: 175 },
	whirlwind: { name: 'Whirlwind', duration: 3140, distance: 128 },
	evasiveRoll: { name: 'Evasive Roll', duration: 905, durationRace8: 1190, distance: 150 },
	dash: { name: 'Dash', duration: 700 },
	backstab: { name: 'Backstab', duration: 1360 },
	shout: { name: 'Skill 7 (S_Shout)', duration: 695 },
	overhandStrike: { name: 'Overhand Strike', duration: 3360, chainDuration: 1315, distance: 170, chainDistance: 116 },

	ultimateOverhand: { name: 'Ultimate Overhand Strike', duration: 3360, chainDuration: 1320, distance: 170, chainDistance: 116 },
	leapingStrike: { name: 'Leaping Strike', duration: 2180, distance: 100 },
	retaliate: { name: 'Retaliate' },
	heartThrust: { name: 'Heart Thrust', duration: 2320, distance: 180 },
	stunningBackhand: { name: 'Skill 13 (S_SB)', duration: 2140, distance: 65 },
	distantBlade: { name: 'Distant Blade', durations: [590, 585, 1495] },
	startlingKick: { name: 'Startling Kick', duration: 1500, distance: -175 },
	furyStrike: { name: 'Fury Strike', duration: 995 },
	chargingSlash: { name: 'Charging Slash', duration: 970, distance: 434, minDuration: 165, stopShort: 85 },
	overpower: { name: 'Overpower', duration: 695 },
	tenacity: { name: 'Tenacity', stages: [490, 710] },
	inColdBlood: { name: 'In Cold Blood', duration: 1195 },
	elbow: { name: 'Skill 21 (S_ELBOW)', duration: 1190 },
	measuredSlice: { name: 'Measured Slice', duration: 3690, chainDuration: 1670, distance: 189, chainDistance: 0 },
	eviscerate: { name: 'Eviscerate', duration: 1910, chainDuration: 1535, distance: 100, chainDistance: 0 }
};

const RETRY = [35, 75];
const LOCK_MS = { skill: '23:0', ms: 'duration' };
const NO_CHAIN = [{ from: [], sub: 30 }];

const FAMILIES = {
	1: { key: 'combo', mode: 'combo', subs: [0, 1, 2, 3], selfLock: 0, retry: false },

	2: { key: 'knockdownStrike', mode: 'simple', chains: NO_CHAIN, retry: false, locks: [LOCK_MS] },

	3: { key: 'whirlwind', mode: 'simple', subs: [0, 1, 2], serverSubs: [30], retry: RETRY, locks: [LOCK_MS], selfRunning: true },

	4: { key: 'evasiveRoll', mode: 'simple', serverSubs: [30], retry: false, selfLock: 0,
		locks: [{ skill: '8:0', ms: 'duration' }, { skill: '23:0', ms: 'duration' }, { skill: '24:0', ms: 'duration' }, { skill: '12:0', ms: 'duration' }] },
	5: { key: 'dash', mode: 'simple', fixedSpeed: true, retry: RETRY },

	7: { key: 'shout', mode: 'simple', fixedSpeed: true, retry: RETRY },

	8: { key: 'overhandStrike', mode: 'simple', chains: NO_CHAIN, retry: false, selfLock: 0, selfRunning: true },
	9: { key: 'leapingStrike', mode: 'simple', retry: RETRY, locks: [LOCK_MS] },
	10: { key: 'retaliate', mode: 'passthrough' },
	12: { key: 'heartThrust', mode: 'simple', subs: [0, 1, 2], serverSubs: [30], retry: RETRY, locks: [LOCK_MS], selfRunning: true },
	13: { key: 'stunningBackhand', mode: 'simple', retry: RETRY, locks: [LOCK_MS] },

	14: { key: 'distantBlade', mode: 'combo', subs: [0, 1, 2], retry: false, selfLock: 500,
		bySub: { 2: { locks: [{ skill: '23:0', ms: 'duration' }, { skill: '24:0', ms: 'duration' }] } } },
	15: { key: 'startlingKick', mode: 'simple', retry: RETRY, locks: [LOCK_MS] },
	16: { key: 'furyStrike', mode: 'simple', retry: RETRY, locks: [{ skill: '23:0', ms: 'duration' }, { skill: '24:0', ms: 'duration' }] },

	17: { key: 'chargingSlash', mode: 'simple', subs: [], serverSubs: [0], retry: false },
	18: { key: 'overpower', mode: 'simple', fixedSpeed: true, retry: [35] },

	19: { key: 'tenacity', mode: 'stages', fixedSpeed: true, retry: RETRY },
	20: { key: 'inColdBlood', mode: 'simple', fixedSpeed: true, retry: [35] },
	21: { key: 'elbow', mode: 'simple', retry: RETRY },

	23: { key: 'measuredSlice', mode: 'simple', chains: NO_CHAIN, retry: false, selfLock: 0, selfRunning: true, locks: [{ skill: '8:0', ms: 'duration' }] },
	24: { key: 'eviscerate', mode: 'simple', chains: NO_CHAIN, retry: false, selfLock: 0, selfRunning: true },

	25: { key: 'ultimateOverhand', mode: 'simple', subs: [], serverSubs: [0], chains: NO_CHAIN, retry: false, selfLock: 0, selfRunning: true }
};

const GLYPHS = {
	23060: { name: 'Swift Startling Kick', groups: [15], speed: 1.25 },

	23050: { name: 'Swift Combo Attack' },

	23043: { name: 'Blazing Startling Kick' },
	23044: { name: 'Blazing Startling Kick' },
	23031: { name: 'Blazing Backstab' },
	23054: { name: 'Blazing Backstab' },
	23037: { name: 'Blazing In Cold Blood' }
};

const CAST_BUFFS = {
	23060: { group: 12, speed: 1.25 },
	23061: { group: 12, speed: 1.35 },
	23070: { group: 2, speed: 1.25 },
	301150: { group: -1, speed: 1 }
};
const GLYPH_FURY_TO_WW = [23032];
const FURY_WW_MS = 5000;

// a held request should reach the server this long after its previous skill ended
const HOLD_ARRIVE_AFTER = 20;
const DB_CHAIN_EXTRA = 350;

const OHS_CHAIN_FROM = ['14:2', 16, '12:0', '12:1', '12:2', '2:0', '3:0', '3:1', '3:2', 24, 13, 15, 9, '1:3', 4];
const EVI_CHAIN_FROM = [8, 25, '12:0', '12:1', '12:2', '2:0', '3:0', '3:1', '3:2', 13, 15, 9, '1:3', 4];
const MS_CHAIN_FROM = [8, 25, 24, 4];
const ABN_ULTIMATE = 300802;

const KDS_CHAIN_FROM = ['14:0', '14:1', '14:2'];

const KDS_ALLOWED_DURING = [18, 19, 5, 20, 14];
const ABN_SECOND_ROLL = 301200;
const CHARGE_END_FALLBACK = 500;
const CHARGE_END_P115 = 40;

const LEGACY = {
	dirs: ['neuesSlayerSP'],
	config: { OPALERT: null },
	skillData(o) {
		const out = {};
		for (const key of Object.keys(DEFAULT_SKILLS)) {
			if (!o[key]) continue;
			const v = Object.assign({}, o[key]);
			delete v.name;
			delete v.fixedSpeed;
			out[key] = v;
		}
		return out;
	}
};

function setup(api) {
	const { groupOf, subOf, baseOf, getSkillId } = api;
	const P115 = Boolean(api.dispatch && api.dispatch.isP115); // OSTO 115 hybrid client (see p115.js)
	const at = (id, g, ...subs) => groupOf(id) === g && (subs.length === 0 || subs.includes(subOf(id)));
	const running = () => { const a = api.action(); return a && !a.finished ? a : null; };
	const runningGroup = () => { const a = running(); return a ? groupOf(a.skillId) : -1; };
	const race = () => Math.floor((api.model() - 10101) / 100);

	const plain = (id) => (subOf(id) >= 30 ? id - 30 : id);

	const sameSkill = (x, y) => groupOf(x) === groupOf(y) || ([8, 25].includes(groupOf(x)) && [8, 25].includes(groupOf(y)));

	let comboStep = 0, comboReset = null;
	let castBuff = 0;
	let furyWWUntil = 0;
	let backstab = null;
	let teleport = null;
	let ultBase = 255100;
	let ultUntil = 0;
	let heldDB = null;
	let held = null;
	const mismatch = new Set();

	function realServerSkill() {
		const sv = api.serverActive();
		return sv && api.clientAction() === sv.actionId ? sv.id : 0;
	}
	function sourceSkill(extraAfterEnd = 0) {
		const a = api.action();
		if (a && !a.finished) return a.skillId;

		const real = realServerSkill();
		if (real) return real;
		if (!a) return 0;
		if (extraAfterEnd && a.endAt && Date.now() < a.endAt + extraAfterEnd) return a.skillId;

		return serverBusyLeft() > 15 ? a.skillId : 0;
	}

	// how long the server still plays its current skill
	function serverBusyLeft() {
		const a = api.action();
		const sv = api.serverActive();
		if (!a || !a.finished || !sv || !sameSkill(sv.id, a.skillId) || !a.speed) return -Infinity;
		return sv.at + a.normDuration / a.speed - api.estimateRtt() - Date.now();
	}
	const chainFrom = (list, extra) => { const s = sourceSkill(extra); return Boolean(s && api.matchesAny(plain(s), list)); };

	function predictCombo(event, info, a) {
		const sid = info.sid;

		const step = subOf(sid) > 0 ? Math.min(subOf(sid), 3) : Math.min(comboStep, 3);
		const id = baseOf(sid) + step;
		const d = api.skills.combo.durations[step] || 1000;
		const b = api.startAction(event, id, { duration: d, prevEndType: a && groupOf(a.skillId) === 1 ? 6 : undefined, requestId: sid });

		if (step < 3) api.lock('24:0', b.normDuration / b.speed);
		comboStep = step === 3 ? 0 : step + 1;
		api.clearTimeout(comboReset);

		comboReset = api.setTimeout(() => { comboStep = 0; }, d);
		return 'done';
	}

	// Abdull
	function predictChained(event, info, key, chain, extraLocks, targetBase) {
		const sid = info.sid;
		const d = api.skills[key];
		const target = (targetBase || sid) + (chain ? 30 : 0);
		const a = api.startAction(event, target, {
			duration: chain ? d.chainDuration : d.duration,
			distance: (chain && d.chainDistance !== undefined ? d.chainDistance : d.distance) || 0,
			fixedSpeed: Boolean((api.familyDef(sid) || {}).fixedSpeed),
			prevEndType: 4,
			requestId: sid
		});
		api.applyLocks(api.familyDef(sid), sid, a);
		for (const l of (extraLocks || [])) api.lock(l, a.normDuration / a.speed);
		if (chain) api.recordPacket('MOD', 'Chain predicted', { skill: api.skillLabel(target) });
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
		api.scheduleRetries('C_START_TARGETED_SKILL', 6, event, RETRY);
		api.setLastSkill(sid, event);
		return 'done';
	}

	function clearBackstab() {
		if (backstab) api.clearTimeout(backstab.timer);
		backstab = null;
	}
	// Backstab runs through the server (teleport): we only end its animation
	function backstabPressed() {
		clearBackstab();
		backstab = { at: Date.now(), timer: null, actionId: null };
		teleport = null;
		resetCombo();
	}
	function backstabStarted(event) {
		const b = backstab;
		if (!b || b.actionId !== null) return;
		b.actionId = event.id;
		const ms = api.skills.backstab.duration / (api.aspd() || 1);
		b.timer = api.setTimeout(() => {
			if (backstab !== b || api.clientAction() !== b.actionId) return;
			const loc = teleport || event.loc;
			api.recordPacket('MOD', 'Backstab ended on time', {});
			api.sendEnd(getSkillId(event.skill), 0, { x: loc.x, y: loc.y, z: loc.z }, teleport ? teleport.w : event.w, b.actionId);
			b.ended = true;
		}, Math.max(0, b.at + ms - Date.now()));
	}
	api.hook('S_ABNORMALITY_BEGIN', 3, (event) => {
		if (!api.enabled() || event.target !== api.cid()) return;
		if (CAST_BUFFS[Number(event.id)]) castBuff = Number(event.id);
		if (Number(event.id) === ABN_ULTIMATE) ultUntil = Date.now() + (Number(event.duration) || 20000);
	});
	api.tryHook('S_ABNORMALITY_REFRESH', 1, (event) => {
		if (!api.enabled() || event.target !== api.cid()) return;
		if (Number(event.id) === ABN_ULTIMATE) ultUntil = Date.now() + (Number(event.duration) || 20000);
	});
	api.hook('S_ABNORMALITY_END', 1, (event) => {
		if (!api.enabled() || event.target !== api.cid()) return;
		if (Number(event.id) === castBuff) castBuff = 0;
		if (Number(event.id) === ABN_ULTIMATE) ultUntil = 0;
	});

	const ultimateActive = () => api.hasAbnormal(ABN_ULTIMATE) && Date.now() + api.estimateRtt() / 2 + 20 < (ultUntil || Infinity);
	api.hook('S_INSTANT_MOVE', 3, (event) => {
		if (!api.enabled() || event.gameId !== api.cid()) return;
		teleport = { x: event.loc.x, y: event.loc.y, z: event.loc.z, w: event.w };
	});

	api.hook('S_INSTANT_DASH', 3, (event) => {
		if (!api.predicting() || event.gameId !== api.cid()) return;
		const a = running();
		if (!a || !at(a.skillId, 17)) return;
		const d = api.skills.chargingSlash;
		a.dest = { x: event.loc.x, y: event.loc.y, z: event.loc.z };
		const travel = Math.hypot(event.loc.x - a.start.x, event.loc.y - a.start.y);

		// 115 client log (slayer, 2026-11-22): the server dash runs ~travel/434*970 + 13-30 ms (travel 102-111: 250-272 ms). With the 500 ms
		// fallback our Charging Slash always ended only with the server end (a ping late, next skill ~96 ms later) - now just after it.
		a.normDuration = Math.max(d.minDuration || 0, (travel / d.distance) * d.duration) + (P115 ? CHARGE_END_P115 : CHARGE_END_FALLBACK);
		let ms = a.normDuration / (a.speed || 1);
		if (P115) {
			// the server started the dash late (skill before it ran longer there): our end follows its start, so the next skill is not early
			const ack = api.serverSkillAckAt(a.skillId);
			if (ack >= a.startedAt) ms = Math.max(ms, ack - api.estimateRtt() - a.startedAt + ms);
		}
		api.scheduleActionEnd(a, ms);
	});

	function sendHeldDB() {
		const h = heldDB;
		if (!h) return;
		heldDB = null;
		api.clearTimeout(h.timer);
		api.recordPacket('MOD->S', h.name + ' [held Distant Blade hit sent]', { skill: api.skillLabel(getSkillId(h.event.skill)) });
		api.dispatch.toServer(h.name, h.version, h.event);
	}
	// Soaria
	function predictHeldDB(event, info, sv) {
		const sid = info.sid;
		const fam = info.fam;
		const sub = subOf(sid);
		const durs = api.skills.distantBlade.durations;
		const prev = api.action();
		const prevSpeed = prev && prev.speed ? prev.speed : api.aspd();
		const serverEnd = sv.at + (durs[subOf(sv.id)] || 600) / prevSpeed;
		const b = api.startAction(event, sid, { duration: durs[sub] || 600, requestId: sid });
		api.applyLocks(Object.assign({}, fam, (fam.bySub || {})[sub] || {}), sid, b);
		if (heldDB) api.clearTimeout(heldDB.timer);
		heldDB = { name: info.name, version: info.version, event: api.copyEvent(event), timer: null };

		heldDB.timer = api.setTimeout(sendHeldDB, Math.max(0, serverEnd - api.estimateRtt() + HOLD_ARRIVE_AFTER - Date.now()));
		api.recordPacket('MOD', 'Distant Blade hit held back (server still plays the previous hit)', { skill: api.skillLabel(sid) });
		api.setLastSkill(sid, event);
		return 'drop';
	}

	// sends the request that was held until the server is free
	function sendHeld() {
		const h = held;
		if (!h) return;
		held = null;
		api.clearTimeout(h.timer);
		api.recordPacket('MOD->S', h.name + ' [held skill sent]', { skill: api.skillLabel(getSkillId(h.event.skill)) });
		api.dispatch.toServer(h.name, h.version, h.event);
	}
	function canInterrupt(g, sid, srcGroup) {
		if (g === 4 || g === 10) return true;
		if (g === 2) return KDS_ALLOWED_DURING.includes(srcGroup) || chainFrom(KDS_CHAIN_FROM, DB_CHAIN_EXTRA);
		if (g === 8) return chainFrom(OHS_CHAIN_FROM);
		if (g === 24) return chainFrom(EVI_CHAIN_FROM);
		if (g === 23) return chainFrom(MS_CHAIN_FROM);
		return false;
	}
	function predictHeld(event, info, busy) {
		const sid = info.sid;
		const g = groupOf(sid);
		const fam = info.fam;
		if (g === 1) predictCombo(event, info, null);
		else if (g === 8 && ultimateActive()) predictChained(event, info, 'ultimateOverhand', false, null, ultBase);
		else if (fam.mode === 'combo') {
			const sub = subOf(sid);
			const b = api.startAction(event, sid, { duration: api.durationOf(fam, sub) || 600, requestId: sid });
			api.applyLocks(Object.assign({}, fam, (fam.bySub || {})[sub] || {}), sid, b);
		} else predictChained(event, info, fam.key, false);
		afterPredicted(sid, api.action());
		if (held) api.clearTimeout(held.timer);
		held = { name: info.name, version: info.version, event: api.copyEvent(event), timer: null };
		held.timer = api.setTimeout(sendHeld, Math.max(0, busy + HOLD_ARRIVE_AFTER));
		api.recordPacket('MOD', 'Skill held back (server still plays the previous skill)', { skill: api.skillLabel(sid), busy: Math.round(busy) });
		api.setLastSkill(sid, event);
		return 'drop';
	}
	function afterPredicted(sid, a) {
		const g = groupOf(sid);

		if (g === 4 && a) api.lock(sid, Math.max(0, a.normDuration / a.speed - 100));
		if (g === 16 && GLYPH_FURY_TO_WW.some(api.isGlyph)) furyWWUntil = Date.now() + FURY_WW_MS;

		if (g === 3) furyWWUntil = 0;
	}

	function variantMismatch(event, sid) {
		const a = running();
		if (!a || event.stage !== 0 || a.skillId === sid || !sameSkill(a.skillId, sid) || [1, 14].includes(groupOf(sid))) return;
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

	// Abdull
	function resetCombo() {
		comboStep = 0;
		api.clearTimeout(comboReset);
	}

	return {
		resolveId(sid, offset) {
			if (groupOf(sid) === 4 && offset === 0 && api.hasAbnormal(ABN_SECOND_ROLL)) return sid + 30;
			return sid + offset;
		},
		skillSpeed(sid) {
			const g = groupOf(sid);
			const cb = CAST_BUFFS[castBuff];
			if (cb && cb.group === g && api.hasAbnormal(castBuff)) {
				castBuff = 0;
				return cb.speed;
			}
			let m = 1;
			if (g === 3 && Date.now() < furyWWUntil) m *= 1.25;

			return m;
		},

		durationFactor(sid) {
			if (groupOf(sid) === 4 && race() === 8) {
				const d = api.skills.evasiveRoll;
				return d.duration > 0 && d.durationRace8 > 0 ? d.durationRace8 / d.duration : 1;
			}
			return 1;
		},

		start(event, info) {
			const sid = info.sid;
			const g = groupOf(sid);
			if (!info.fam) return undefined;
			const rg = runningGroup();

			if (g === 2 && rg !== -1 && !KDS_ALLOWED_DURING.includes(rg)) return 'drop';
			if (rg === 23 && (g === 24 || g === 8)) return 'drop';
			if (g === 23 && backstab && !backstab.ended && api.clientAction() === backstab.actionId) return 'drop';

			if (rg === 17 && g !== 2 && g !== 4) return 'pass';

			if (info.fam.selfRunning && running() && sameSkill(running().skillId, sid)) return 'pass';
			if (info.fam.selfRunning && realServerSkill() && sameSkill(realServerSkill(), sid)) return 'pass';

			if (api.isLocked(sid)) return undefined;

			if (api.cooldownLeft(sid) > 50) return undefined;

			if (g !== 1) resetCombo();
			const a = running();

			if (!a && info.fam.mode !== 'passthrough' && info.fam.mode !== 'stages' && !(g === 14 && subOf(sid) > 0)) {
				const busy = serverBusyLeft();
				const src = api.action();
				if (busy + HOLD_ARRIVE_AFTER > 0 && !canInterrupt(g, sid, src ? groupOf(src.skillId) : -1)) return predictHeld(event, info, busy);
			}
			if (g === 1) return predictCombo(event, info, a);
			if (g === 2 && subOf(sid) === 0) return predictChained(event, info, 'knockdownStrike', chainFrom(KDS_CHAIN_FROM, DB_CHAIN_EXTRA));
			if (g === 14 && subOf(sid) > 0) {
				const sv = api.serverActive();
				if (sv && groupOf(sv.id) === 14 && subOf(sv.id) < subOf(sid)) return predictHeldDB(event, info, sv);
			}
			if (g === 8 && subOf(sid) === 0) {
				const chain = chainFrom(OHS_CHAIN_FROM);
				if (chain) api.unlock('23:0');

				if (ultimateActive()) return predictChained(event, info, 'ultimateOverhand', chain, null, ultBase);
				return predictChained(event, info, 'overhandStrike', chain);
			}
			if (g === 24 && subOf(sid) === 0) {
				const chain = chainFrom(EVI_CHAIN_FROM);
				if (chain) api.unlock('23:0');
				return predictChained(event, info, 'eviscerate', chain);
			}
			if (g === 23 && subOf(sid) === 0) return predictChained(event, info, 'measuredSlice', chainFrom(MS_CHAIN_FROM));
			return undefined;
		},
		targeted(event, info) {
			const sid = info.sid;
			const g = groupOf(sid);
			if (g === 6) {
				if (runningGroup() === 18) return 'drop';
				if (!api.config.DISABLE_BACKSTAB) backstabPressed();
				return undefined;
			}
			if (g === 17 && !api.isLocked(sid)) return predictCharging(event, info);
			resetCombo();
			return undefined;
		},
		predicted(sid, a) {
			afterPredicted(sid, a);
		},
		serverStage(event, sid) {
			if (at(sid, 6) && event.stage === 0 && !api.config.DISABLE_BACKSTAB) backstabStarted(event);
			if (groupOf(sid) === 25) ultBase = baseOf(sid);
			variantMismatch(event, sid);
			return undefined;
		},
		serverEnd(event, sid) {
			if (at(sid, 14) && heldDB) sendHeldDB();
			if (held) sendHeld();
			if (mismatch.has(event.id)) {
				mismatch.delete(event.id);
				const a = running();
				if (a && sameSkill(a.skillId, sid)) {
					a.finished = true;
					api.clearActionTimers(a);
					api.recordPacket('S->C', 'S_ACTION_END [MIRRORED: server variant ended]', { ours: api.skillLabel(a.skillId), server: api.skillLabel(sid) });
					api.sendEnd(a.skillId, event.type, { x: event.loc.x, y: event.loc.y, z: event.loc.z }, a.w, a.id);
					if (event.type !== 0) api.unlock(a.requestId || a.skillId);
					return false;
				}
			}
			if (at(sid, 6) && backstab && backstab.actionId === event.id) {
				const ended = backstab.ended;
				clearBackstab();
				if (ended) return false;
			}
			return undefined;
		},
		learnTarget(id) {
			if (at(id, 17)) return null;
			if (at(id, 25, 30)) return { key: 'ultimateOverhand', prop: 'chainDuration' };
			if (at(id, 25, 0)) return { key: 'ultimateOverhand', prop: 'duration' };
			if (at(id, 4, 0) && race() === 8) return { key: 'evasiveRoll', prop: 'durationRace8', dist: true };
			return undefined;
		},
		reset() {
			resetCombo();
			clearBackstab();
			castBuff = 0;
			ultUntil = 0;
			furyWWUntil = 0;
			if (heldDB) api.clearTimeout(heldDB.timer);
			heldDB = null;
			if (held) api.clearTimeout(held.timer);
			held = null;
			mismatch.clear();
		},
		bugState() {
			return `combo=${comboStep} castBuff=${castBuff || '-'} furyWW=${Date.now() < furyWWUntil ? 1 : 0} backstab=${backstab ? (backstab.ended ? 'ended' : 'running') : '-'}`;
		}
	};
}

module.exports = {
	NAME: 'Slayer-SP',
	CMD: 'slayer',
	CLASS_LABEL: 'Slayer',
	JOB: 2,
	AUTHORS: 'DTmaik',

	OMNI: {
		17: { dir: 'north', targeted: true, dest: 440 }
	},
	COLOR: '#56B4E9',
	DATA_DIR: 'slayer',
	GLOBAL_LOCK_DELAY: 250,
	RETRY_DELAYS: [],
	NOTIFY_REPEATS: [100],
	END_DESYNC_FIX: true,
	DEFAULT_SKILLS,
	FAMILIES,
	GLYPHS,
	LEGACY,

	MEASURED_UPDATES: [
		{ key: 'backstab', prop: 'duration', old: [1330, 1370], value: 1360 },

		{ key: 'knockdownStrike', prop: 'duration', old: [2835], value: 3110 },
		{ key: 'knockdownStrike', prop: 'distance', old: [100], value: 175 },
		{ key: 'heartThrust', prop: 'distance', old: [100], value: 180 },
		{ key: 'eviscerate', prop: 'chainDuration', old: [1500], value: 1525 },

		{ key: 'distantBlade', prop: 'durations', old: [[585, 590, 1495], [610, 595, 1480], [580, 605, 1495], [590, 590, 1500]], value: [590, 585, 1495] },

		{ key: 'combo', prop: 'durations', old: [[845, 1005, 750, 1620]], value: [825, 1025, 750, 1620] },
		{ key: 'overhandStrike', prop: 'chainDuration', old: [1390], value: 1315 },
		{ key: 'eviscerate', prop: 'chainDuration', old: [1500, 1525], value: 1535 },

		{ key: 'overpower', prop: 'duration', old: [685, 700], value: 695 },
		{ key: 'dash', prop: 'duration', old: [695], value: 700 },
		{ key: 'inColdBlood', prop: 'duration', old: [1190, 1200], value: 1195 },
		{ key: 'overhandStrike', prop: 'distance', old: [135], value: 170 },
		{ key: 'measuredSlice', prop: 'chainDistance', old: [189], value: 0 },
		{ key: 'eviscerate', prop: 'chainDistance', old: [100], value: 0 }
	],

	NO_SPEED_LEARN: true,
	EXTRA_CONFIG: {
		DISABLE_BACKSTAB: false,
		DISABLE_BACKSTAB_DESCRIPTION: 'Disables the Backstab prediction: Backstab then runs completely through the server (one ping later, but the camera always turns like without the mod) (!slayer backstab)'
	},
	COMMANDS: {
		backstab: { key: 'DISABLE_BACKSTAB', label: 'Backstab prediction', invert: true }
	},
	setup
};
// DTmaik
