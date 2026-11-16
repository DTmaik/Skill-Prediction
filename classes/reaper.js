'use strict';
// Abdull

const DEFAULT_SKILLS = {
	spiralBarrage: { name: 'Spiral Barrage', durations: [990, 980, 1200, 855, 1400, 1900] },
	doubleShear: { name: 'Double Shear', duration: 2035, chainDuration: 2035 },
	sunderingStrike: { name: 'Sundering Strike', stages: [1152, 1749, 1051], chainStages: [1750, 1050] },
	grimStrike: { name: 'Grim Strike', stages: [2400, 965], chainStages: [1432, 975] },

	deathSpiral: { name: 'Death Spiral', duration: 1233, chainDuration: 1233 },
	whipsaw: { name: 'Whipsaw', duration: 2500, chainDuration: 2500 },
	smite: { name: 'Smite', duration: 1730, distance: 100 },
	pendulumStrike: { name: 'Pendulum Strike', duration: 1025, chainDuration: 1025, distance: -200 },

	shadowLash: { name: 'Shadow Lash', durations: [2135, 1240, 1240, 1218], windows: [795, 45, 45] },
	shadowBurst: { name: 'Shadow Burst (hit 1)', duration: 3225, chainDuration: 3225 },
	shadowBurst2: { name: 'Shadow Burst (hit 2)', duration: 2025 },
	soulReversal: { name: 'Soul Reversal', duration: 600 },
	retaliate: { name: 'Retaliate' },
	retribution: { name: 'Retribution', duration: 526 },
	shadowReaping: { name: 'Shadow Reaping', duration: 780 },
	shroudedEscape: { name: 'Shrouded Escape', duration: 829, distance: 145 },
	cableStep: { name: 'Cable Step', duration: 1266 },
	shadowStep: { name: 'Shadow Step', duration: 685, distance: 178 }
};

const CHAIN = (from) => [{ from, sub: 30 }];
const COMBO_A = ['1:0', '1:1', '1:2'];
const COMBO_KEEP_A = [16, 1, 40, 15, 6, 10];
const COMBO_KEEP_B = COMBO_KEEP_A.concat([3, 5]);

const FAMILIES = {
	1: { key: 'spiralBarrage', mode: 'combo', subs: [0, 1, 2, 3, 4, 5], selfLock: 0, retry: false, animSeq: true,
		bySub: { 0: { cancelOnlyBy: COMBO_KEEP_A }, 1: { cancelOnlyBy: COMBO_KEEP_A }, 2: { cancelOnlyBy: COMBO_KEEP_A },
			3: { cancelOnlyBy: COMBO_KEEP_B }, 4: { cancelOnlyBy: COMBO_KEEP_B }, 5: { cancelOnlyBy: COMBO_KEEP_B } } },
	3: { key: 'doubleShear', mode: 'simple', selfLock: 750, chains: CHAIN([1, 11, 15, 9, 6, 5, 8, 10]) },

	4: { key: 'sunderingStrike', mode: 'custom', subs: [0], serverSubs: [30], selfLock: 1000, animSeq: true,
		cancelOnlyBy: [20, 16, 6, 15, 18, 10, 13, 40, 14] },
	5: { key: 'grimStrike', mode: 'custom', subs: [0], serverSubs: [30], selfLock: 0, animSeq: true },

	6: { key: 'deathSpiral', mode: 'simple', serverSubs: [31], chains: CHAIN([1, 3, 5, 4, 8, 10, 12, 11]) },
	8: { key: 'whipsaw', mode: 'simple', chains: CHAIN([10]) },
	9: { key: 'smite', mode: 'simple', selfLock: 750 },
	10: { key: 'pendulumStrike', mode: 'simple', selfLock: 750, chains: CHAIN([1, 11, 4, 5, 3, 6, 8, 9, 12]) },

	11: { key: 'shadowLash', mode: 'custom', subs: [0], serverSubs: [1, 2, 3], selfLock: 0, retry: false },

	12: { key: 'shadowBurst', keys: { 1: 'shadowBurst2' }, mode: 'simple', subs: [0], serverSubs: [1], selfLock: 500, chains: CHAIN([20]) },
	13: { key: 'soulReversal', mode: 'simple' },
	14: { key: 'retaliate', mode: 'passthrough' },
	15: { key: 'retribution', mode: 'simple', subs: [0, 80], fixedSpeed: true },

	16: { key: 'shadowReaping', mode: 'simple', fixedSpeed: true, cancelOnlyBy: [] },
	18: { key: 'shroudedEscape', mode: 'simple' },

	20: { key: 'cableStep', mode: 'simple', subs: [], serverSubs: [0], retry: false },

	40: { key: 'shadowStep', mode: 'simple', serverSubs: [30] }
};

const NO_MOVE = (ms, xy) => [{ duration: ms, xyRate: xy, zRate: 1, distance: 0.01 }];
const ANIM_SEQ = {
	'5:0:0': NO_MOVE(2416, 2.4),
	'5:0:1': NO_MOVE(1066, 0.5), '5:30:0': NO_MOVE(1450, 2.4), '5:30:1': NO_MOVE(1066, 0.5),
	'4:0:1': NO_MOVE(1757, 2), '4:30:0': NO_MOVE(1757, 2),
	'1:0:0': [{ duration: 766, xyRate: 1, zRate: 1, distance: 0 }, { duration: 346, xyRate: 1, zRate: 1, distance: 0 }],
	'1:1:0': [{ duration: 766, xyRate: 1, zRate: 1, distance: 0 }, { duration: 346, xyRate: 1, zRate: 1, distance: 0 }],
	'1:2:0': [{ duration: 950, xyRate: 1, zRate: 1, distance: 0 }, { duration: 346, xyRate: 1, zRate: 1, distance: 0 }],
	'1:3:0': [{ duration: 616, xyRate: 1, zRate: 1, distance: 0 }, { duration: 346, xyRate: 1, zRate: 1, distance: 0 }],
	'1:4:0': [{ duration: 1150, xyRate: 1, zRate: 1, distance: 0 }, { duration: 346, xyRate: 1, zRate: 1, distance: 0 }],
	'1:5:0': [{ duration: 2016, xyRate: 1, zRate: 1, distance: 0 }]
};

const GLYPHS = {
	29026: { name: 'Shadow Burst speed', exclusive: 'burst', groups: [12], speed: 1.25 },

	29526: { name: 'Swift Shadow Burst', exclusive: 'burst', groups: [12], speed: 1.25 },
	29050: { name: 'Keen Grim Strike (reset)' },
	29010: { name: 'Grim Strike -> Double Shear speed' },
	29036: { name: 'Cable Step -> Shadow Burst attack speed' }
};

const COMBO_ABN = [10151020, 10151021, 10151022, 10151023];
const LASH_ABN = [10151040, 10151041, 10151042];
const FAKE_ABN = COMBO_ABN.concat(LASH_ABN);
const ABN_STEP_SECOND = 10151000;
const ABN_ESCAPE_GRIM = 10151171;
const ABN_SOUL_SECOND = 10151031;
const ABN_SPIRAL_SECOND = 10151131;
const SPIRAL_SECOND_MS = 6000;
const ABN_SUNDER_CHAIN = 29111;
const ABN_CABLE_SPEED = 29090;
const SHEAR_GLYPH_MS = 5000;
const CABLE_BONUS = 0.525;
const ESCAPE_GRIM_MS = 8000;
const STEP_SECOND_MS = 4000;
const COMBO_WINDOW_MS = 1800;
const LASH_RESET_MS = 2000;
const LASH_STEPS = [0, 1, 2, 3];
const LASH_HOLD_MS = 10;
const LASH_DONE_MS = 3000;

// skills the server does not let these skills interrupt
const NO_INTERRUPT = {
	8: [4, 6, 5, 9],
	9: [20, 11, 12, 4, 6, 3, 5, 8, 10],
	3: [12, 20],
	5: [12, 20],
	12: [11, 9, 4, 6, 8, 5, 3, 10],
	11: [8, 10, 12],
	10: [10]
};

const LEGACY = {
	dirs: ['neuesReaperSP'],
	config: { UNSPOOF_CABLE_STEP: null, CABLE_FIX: null },
	skillData(o) {
		const g = (k) => o[k] || {};
		const dur = (k) => ({ duration: g(k).duration });
		const sb = g('spiralBarrage').durations;
		const lash = g('shadowLash');
		const out = {
			spiralBarrage: { durations: Array.isArray(sb) && sb.length === 5 ? [sb[0], sb[0]].concat(sb.slice(1)) : undefined },
			doubleShear: { duration: g('doubleShear').duration, chainDuration: g('doubleShear').chainDuration },
			sunderingStrike: { stages: g('sunderingStrike').stages, chainStages: g('sunderingStrike').chainStages },
			grimStrike: { stages: g('grimStrike').stages, chainStages: g('grimStrike').chainStages },
			deathSpiral: { duration: g('deathSpiral').duration, chainDuration: g('deathSpiral').chainDuration },
			whipsaw: { duration: g('whipsaw').duration, chainDuration: g('whipsaw').chainDuration },
			smite: { duration: g('smite').duration, distance: g('smite').distance },
			pendulumStrike: { duration: g('pendulumStrike').duration, chainDuration: g('pendulumStrike').chainDuration, distance: g('pendulumStrike').distance },
			shadowLash: { durations: Number.isFinite(lash.firstDuration) && Number.isFinite(lash.subsequentDuration)
				? [lash.firstDuration, lash.subsequentDuration, lash.subsequentDuration, lash.subsequentDuration] : undefined },
			shadowBurst: { duration: g('shadowBurst').hit1Duration },
			shadowBurst2: { duration: g('shadowBurst').hit2Duration },
			soulReversal: dur('soulReversal'),
			retribution: dur('retribution'),
			shadowReaping: dur('shadowReaping'),
			shroudedEscape: { duration: g('shroudedEscape').duration, distance: g('shroudedEscape').distance },
			cableStep: dur('cableStep'),
			shadowStep: { duration: g('shadowStep').duration, distance: g('shadowStep').distance }
		};
		return out;
	}
};

function setup(api) {
	const { groupOf, subOf, baseOf, getSkillId } = api;
	const at = (id, g, ...subs) => groupOf(id) === g && (subs.length === 0 || subs.includes(subOf(id)));
	const running = () => { const a = api.action(); return a && !a.finished ? a : null; };
	const runningGroup = () => { const a = running(); return a ? groupOf(a.skillId) : -1; };

	function sourceGroup() {
		const a = api.action();
		if (a && !a.finished) return groupOf(a.skillId);
		const sv = api.serverActive();
		if (!a || !sv || groupOf(sv.id) !== groupOf(a.skillId) || !a.speed) return -1;
		return Date.now() < sv.at + a.normDuration / a.speed - api.estimateRtt() - 50 ? groupOf(sv.id) : -1;
	}

	let comboStep = 0, comboReset = null;
	let lashStep = 0, lashReset = null, lashHeld = null, lashHeldTimer = null, lashDoneUntil = 0;
	let lashWindowAt = 0, lashFakeTimer = null;
	let stepSecondUntil = 0;
	let spiralSecondUntil = 0;
	let stepCount = 0;
	let escapeUntil = 0;
	let shearUntil = 0;
	let cablePending = false;
	let soulLockUntil = 0;
	let slowGrimUntil = 0;
	let burstSpeed = 1;
	let fakeShown = new Set();

	function showFake(id) {
		fakeShown.add(id);
		api.dispatch.toClient('S_ABNORMALITY_BEGIN', 3, { target: api.cid(), source: api.cid(), id, duration: 2000, unk: 0, stacks: 1 });
	}
	function clearFakes() {
		for (const id of fakeShown) api.dispatch.toClient('S_ABNORMALITY_END', 1, { target: api.cid(), id });
		fakeShown = new Set();
	}

	function predictCombo(event, info, a) {
		const sid = info.sid;
		const step = comboStep % 5;
		let id = baseOf(sid) + [0, 2, 3, 4, 5][step];
		if (step === 0 && a && at(a.skillId, 1, 5)) id = baseOf(sid) + 1;
		const d = api.skills.spiralBarrage.durations[subOf(id)] || 1000;
		const b = api.startAction(event, id, { duration: d, prevEndType: a && groupOf(a.skillId) === 1 ? 6 : undefined, requestId: sid });
		api.applyLocks(api.familyDef(sid), sid, b);

		if (step < 4) showFake(COMBO_ABN[step]);
		comboStep = (step + 1) % 5;
		api.clearTimeout(comboReset);

		comboReset = api.setTimeout(() => { comboStep = 0; }, Math.max(b.endAt, b.startedAt + COMBO_WINDOW_MS) - Date.now());
		return 'done';
	}

	const GRIM_CHAIN_FROM = [1, 11, 15, 9, 6, 5, 3, 8, 10];
	const SUNDER_CHAIN_FROM = [5, 3];
	// DTmaik
	function predictStaged(event, info, key, chain) {
		const sid = info.sid;
		const d = api.skills[key];
		const list = chain ? d.chainStages : d.stages;
		const target = chain ? sid + 30 : sid;
		const stages = [];
		let acc = 0;
		list.forEach((ms, i) => { if (i > 0) stages.push({ at: acc, stage: i }); acc += ms; });
		const a = api.startAction(event, target, { duration: acc, stages, prevEndType: chain ? 4 : undefined, requestId: sid });
		api.applyLocks(api.familyDef(sid), sid, a);
		api.recordPacket('MOD', chain ? 'Chain predicted' : 'Predicted', { skill: api.skillLabel(target) });
		return a;
	}

	let cableAction = null;
	function predictCable(event, info) {
		const sid = info.sid;
		const d = api.skills.cableStep;
		const dest = event.dest && (event.dest.x || event.dest.y) ? { x: event.dest.x, y: event.dest.y, z: event.dest.z } : undefined;
		cableAction = api.startAction(event, sid, { duration: d.duration, dest, prevEndType: 4, requestId: sid });
		api.lock(sid, api.GLOBAL_LOCK_DELAY * 2);
		api.scheduleRetries('C_START_TARGETED_SKILL', 6, event, [25, 50, 75, 100]);
		api.setLastSkill(sid, event);
		cablePending = true;
		resetCounters();
		return 'done';
	}
	api.tryHook('S_START_INVERSE_CAPTURE', 4, (event) => {
		if (!api.predicting() || event.source !== api.cid()) return;
		const a = cableAction;
		if (a && !a.finished && api.action() === a) a.dest = { x: event.loc.x, y: event.loc.y, z: event.loc.z };
	});

	function clearLashHold() { api.clearTimeout(lashHeldTimer); lashHeld = null; }
	function predictLash(event, info) {
		const sid = info.sid;
		const step = lashStep % 4;
		const target = baseOf(sid) + LASH_STEPS[step];
		const data = api.skills.shadowLash;
		const d = data.durations;
		api.clearTimeout(lashFakeTimer);
		const a = api.startAction(event, target, { duration: d[step] || 1240, prevEndType: 4, requestId: sid });

		lashStep = (step + 1) % 4;
		if (lashStep === 0) { lashDoneUntil = Date.now() + LASH_DONE_MS; lashWindowAt = 0; }
		else {
			lashWindowAt = a.startedAt + ((data.windows || [])[step] || 45) / (a.speed || 1);
			lashFakeTimer = api.setTimeout(() => { if (api.action() === a && !a.finished) showFake(LASH_ABN[step]); }, Math.max(0, lashWindowAt - Date.now()));
		}
		api.clearTimeout(lashReset);
		lashReset = api.setTimeout(() => { lashStep = 0; }, Math.max(0, a.endAt - Date.now()) + LASH_RESET_MS);
		api.recordPacket('MOD', 'Shadow Lash predicted', { skill: api.skillLabel(target), step: step + 1 });
		return 'done';
	}
	function holdLash(info, event, until) {
		clearLashHold();
		const h = lashHeld = { name: info.name, version: info.version, event: api.copyEvent(event) };
		lashHeldTimer = api.setTimeout(() => {
			if (lashHeld !== h || !api.predicting()) return;
			lashHeld = null;
			api.recordPacket('MOD->S', 'Shadow Lash sent (previous lash ended)', {});
			api.startSkill(h.name, h.version, h.event);
		}, Math.max(1, until - Date.now()));
		api.recordPacket('MOD', 'Shadow Lash held until the running lash ends', { ms: Math.round(until - Date.now()) });
		return 'drop';
	}

	function resetCounters(except) {
		if (except !== 1) { comboStep = 0; api.clearTimeout(comboReset); }
		if (except !== 11) { lashStep = 0; api.clearTimeout(lashReset); clearLashHold(); api.clearTimeout(lashFakeTimer); }
	}

	api.hook('S_ABNORMALITY_BEGIN', 3, { order: -10 }, (event) => {
		if (!api.enabled() || event.target !== api.cid()) return;
		const id = Number(event.id);
		if (id === ABN_STEP_SECOND) stepSecondUntil = Date.now() + Number(event.duration || STEP_SECOND_MS);
		if (id === ABN_SPIRAL_SECOND) spiralSecondUntil = Date.now() + Number(event.duration || SPIRAL_SECOND_MS);
		if (id === ABN_ESCAPE_GRIM) escapeUntil = Date.now() + ESCAPE_GRIM_MS;
		if (id === ABN_CABLE_SPEED) cablePending = false;
		if (id > 89020200 && id < 89020211) burstSpeed = (id - 89020201) * 0.05 + 1.2;
		if (api.predicting() && FAKE_ABN.includes(id)) return false;
	});
	api.hook('S_ABNORMALITY_END', 1, { order: -10 }, (event) => {
		if (!api.enabled() || event.target !== api.cid()) return;
		const id = Number(event.id);
		if (id === ABN_STEP_SECOND) stepSecondUntil = 0;
		if (id === ABN_SPIRAL_SECOND) spiralSecondUntil = 0;
		if (id === ABN_ESCAPE_GRIM) escapeUntil = 0;
		if (id > 89020200 && id < 89020211) burstSpeed = 1;
		if (api.predicting() && FAKE_ABN.includes(id)) return false;
	});
	api.hook('S_START_COOLTIME_SKILL', 3, { order: -10 }, (event) => {
		const sid = getSkillId(event.skill);
		if (groupOf(sid) === 40) { stepSecondUntil = 0; stepCount = 0; }
		if (groupOf(sid) === 11) { lashStep = 0; api.clearTimeout(lashReset); if (event.cooldown > 0) lashDoneUntil = Date.now() + event.cooldown - 50; }
	});
	api.tryHook('C_USE_ITEM', 3, () => { cablePending = false; });

	api.hook('C_CANCEL_SKILL', 3, { order: -20 }, (event) => {
		if (!api.predicting()) return;
		const g = groupOf(getSkillId(event.skill));
		if (g === 20 || g === 12) return false;
	});

	return {
		resolveId(sid, offset) {
			const g = groupOf(sid);
			if (g === 6 && Date.now() < spiralSecondUntil) return sid - (sid % 100) + 31;
			if (g === 40 && offset === 0 && Date.now() < stepSecondUntil) return sid + 30;
			return sid + offset;
		},
		skillSpeed(sid) {
			const g = groupOf(sid);
			let m = 1;
			if (g === 3 && Date.now() < shearUntil) m *= 1.25;
			if (g === 12) {
				const glyph = api.isGlyph(29026) ? 1.25 : 1;
				if (burstSpeed !== 1) m *= (glyph + burstSpeed - 1) / glyph;
				if (cablePending && api.lastSkill() && groupOf(api.lastSkill()) === 20 && api.isGlyph(29036)) m *= (api.aspd() + CABLE_BONUS) / api.aspd();
			}
			return m;
		},

		start(event, info) {
			const sid = info.sid;
			const g = groupOf(sid);
			if (!info.fam) return undefined;
			clearFakes();
			const rg = runningGroup();
			const a = running();

			if (Date.now() < soulLockUntil && ![10, 6, 18, 15, 16, 40, 13].includes(g)) return 'drop';

			if (at(sid, 4, 30)) return 'drop';
			if (rg !== -1 && NO_INTERRUPT[g] && NO_INTERRUPT[g].includes(rg)) return 'drop';
			if (g === 1 && rg !== -1 && rg !== 1) return 'drop';
			if (g === 13 && a) return 'drop';
			if (g === 4 && a && rg !== 3 && rg !== 5) return 'drop';
			if (g === 11 && lashStep === 0 && a && [5, 3, 6, 9].includes(rg)) return 'drop';
			if (g === 20 && rg === 40) return 'drop';
			if (g === 5 && api.config.SLOW_GRIM && api.lastSkill() && groupOf(api.lastSkill()) === 5 && Date.now() < slowGrimUntil) return 'drop';

			if (g === 13 && api.hasAbnormal(ABN_SOUL_SECOND)) return 'pass';

			if (api.isLocked(sid)) return undefined;

			if (api.cooldownLeft(sid) > 50) return undefined;

			if (g !== 1) { comboStep = 0; api.clearTimeout(comboReset); }
			if (g !== 11) { lashStep = 0; api.clearTimeout(lashReset); clearLashHold(); api.clearTimeout(lashFakeTimer); }

			if (g === 1 && (subOf(sid) === 0 || subOf(sid) === 1)) return predictCombo(event, info, a);

			if (g === 11 && subOf(sid) === 0) {
				if (Date.now() < lashDoneUntil) return 'pass';
				if (a && groupOf(a.skillId) === 11 && Date.now() < lashWindowAt) return holdLash(info, event, lashWindowAt + LASH_HOLD_MS);
				return predictLash(event, info);
			}

			if (g === 12 && subOf(sid) === 0 && a && at(a.skillId, 12, 0, 30)) {
				const d = api.skills.shadowBurst2;
				const b = api.startAction(event, sid + 1, { duration: d.duration, prevEndType: 6, requestId: sid });
				api.applyLocks({ selfLock: 500 }, sid, b);
				return 'done';
			}

			if (g === 5 && subOf(sid) === 0) {
				const chain = GRIM_CHAIN_FROM.includes(sourceGroup()) || (api.lastSkill() && groupOf(api.lastSkill()) === 18 && Date.now() < escapeUntil);
				predictStaged(event, info, 'grimStrike', chain);
				if (api.isGlyph(29010)) shearUntil = Date.now() + SHEAR_GLYPH_MS;
				slowGrimUntil = Date.now() + (Number(api.config.SLOW_GRIM_AMOUNT) || 1000) / (api.aspd() || 1);
				return 'done';
			}

			if (g === 4 && subOf(sid) === 0) {
				const chain = SUNDER_CHAIN_FROM.includes(sourceGroup()) || api.hasAbnormal(ABN_SUNDER_CHAIN);
				predictStaged(event, info, 'sunderingStrike', chain);
				if (chain) {
					const req = api.copyEvent(event);
					[16, 66, 116].forEach(ms => api.setTimeout(() => api.sendRetry(info.name, info.version, Object.assign(api.withSkillId(req, sid + 30), { continue: true })), ms));
				}
				return 'done';
			}

			if (g === 40 && Date.now() < stepSecondUntil && stepCount >= 1) return 'pass';
			return undefined;
		},
		targeted(event, info) {
			if (at(info.sid, 20, 0) && !api.isLocked(info.sid)) {
				if (runningGroup() === 40 || (running() && groupOf(running().skillId) === 16)) return 'drop';
				clearFakes();
				return predictCable(event, info);
			}
			return undefined;
		},
		predicted(sid) {
			const g = groupOf(sid);
			if (g === 6) spiralSecondUntil = subOf(sid) === 31 || (Date.now() < spiralSecondUntil) ? 0 : Date.now() + SPIRAL_SECOND_MS;
			if (g === 40) {
				if (Date.now() < stepSecondUntil) stepCount++;
				else { stepSecondUntil = Date.now() + STEP_SECOND_MS; stepCount = 0; }
			}
			if (g === 18) escapeUntil = Date.now() + ESCAPE_GRIM_MS;
			if (g !== 20 && g !== 12) cablePending = false;
		},
		serverStage(event, sid) {
			if (at(sid, 13, 30)) soulLockUntil = Date.now() + 1000;
			if (at(sid, 13, 40)) soulLockUntil = Date.now() + 3000;
			return undefined;
		},
		learnTarget(id) {
			if (at(id, 20)) return null;
			if (at(id, 4) || at(id, 5)) return null;
			return undefined;
		},
		reset() {
			resetCounters();
			clearFakes();
			lashDoneUntil = 0;
			cablePending = false;
			soulLockUntil = 0;
		},
		destroy() { clearFakes(); },
		bugState() {
			return `combo=${comboStep} lash=${lashStep} step2=${Date.now() < stepSecondUntil ? 1 : 0} escape=${Date.now() < escapeUntil ? 1 : 0} shear=${Date.now() < shearUntil ? 1 : 0} cable=${cablePending ? 1 : 0} burst=${burstSpeed}`;
		}
	};
}

const RETRY = [35, 75, 115];

module.exports = {
	NAME: 'Reaper-SP',
	CMD: 'reaper',
	CLASS_LABEL: 'Reaper',
	JOB: 8,
	AUTHORS: 'Abdull',
	COLOR: '#56B4E9',
	DATA_DIR: 'reaper',
	ASPD_BASE: 100,
	GLOBAL_LOCK_DELAY: 250,

	RETRY_DELAYS: [],
	NOTIFY_REPEATS: [100],
	END_DESYNC_FIX: true,
	DEFAULT_SKILLS,
	FAMILIES,
	GLYPHS,
	ANIM_SEQ,
	LEGACY,
	MEASURED_UPDATES: [
		{ key: 'deathSpiral', prop: 'duration', old: [1245, 1190], value: 1233 },
		{ key: 'deathSpiral', prop: 'chainDuration', old: [1245, 1190], value: 1233 },
		{ key: 'grimStrike', prop: 'chainStages', old: [[1450, 975]], value: [1432, 975] },
		{ key: 'sunderingStrike', prop: 'chainStages', old: [[1750, 1030]], value: [1750, 1050] },
		{ key: 'shadowReaping', prop: 'duration', old: [800], value: 780 },
		{ key: 'cableStep', prop: 'duration', old: [1300], value: 1266 },
		{ key: 'sunderingStrike', prop: 'stages', old: [[1175, 1750, 1025]], value: [1152, 1749, 1051] },
		{ key: 'grimStrike', prop: 'stages', old: [[2417, 975]], value: [2400, 965] },
		{ key: 'shroudedEscape', prop: 'duration', old: [850], value: 829 },
		{ key: 'shroudedEscape', prop: 'distance', old: [150], value: 145 },
		{ key: 'shadowStep', prop: 'duration', old: [700], value: 685 },
		{ key: 'shadowStep', prop: 'distance', old: [175], value: 178 },
		{ key: 'shadowLash', prop: 'durations', old: [[2150, 1250, 1250, 1250], [2135, 1240, 1240, 1240], [2135, 1240, 1240, 1235]], value: [2135, 1240, 1240, 1218] },
		{ key: 'spiralBarrage', prop: 'durations', old: [[990, 990, 1200, 880, 1400, 1905]], value: [990, 980, 1200, 855, 1400, 1900] }
	],
	EXTRA_CONFIG: {
		SLOW_GRIM: false,
		SLOW_GRIM_DESCRIPTION: 'Drops a second Grim Strike pressed right after Grim Strike, so hit 2 is not cancelled by accident (!reaper slowgrim)',
		SLOW_GRIM_AMOUNT: 1000,
		SLOW_GRIM_AMOUNT_DESCRIPTION: 'How long (ms at attack speed 1.0) a second Grim Strike is dropped for SLOW_GRIM'
	},
	COMMANDS: {
		slowgrim: { key: 'SLOW_GRIM', label: 'Slow Grim Strike (no accidental 2nd-hit cancel)' }
	},
	setup
};
// Soaria
