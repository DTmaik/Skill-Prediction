'use strict';
// Abdull

const DEFAULT_SKILLS = {
	combo: { name: 'Combo Attack', durations: [1101, 925, 1105, 1825], distance: 0 },
	block: { name: 'Axe Block' },
	thunderStrike: { name: 'Thunder Strike', chargeStages: [650, 650, 650], releaseDuration: 1720, distance: 70, vampWindowStart: 450, vampWindowExtra: 200 },
	flatten: { name: 'Flatten', duration: 3100, chainDuration: 2330, distance: 75 },
	dash: { name: 'Dash', duration: 700 },
	staggeringStrike: { name: 'Staggering Strike', duration: 1266, distance: 80 },
	mockingShout: { name: 'Mocking Shout', stages: [300, 1050] },
	fieryRage: { name: 'Fiery Rage', duration: 1415 },
	triumphantShout: { name: 'Triumphant Shout', duration: 815 },
	cyclone: { name: 'Cyclone', chargeStages: [650, 650, 650], spinDuration: 370, endDuration: 780, flattenLockExtra: 880, distance: 35 },
	leapingStrike: { name: 'Leaping Strike', duration: 2250, distance: 100 },
	unchainedAnger: { name: 'Unchained Anger', stages: [1012, 532] },
	retaliate: { name: 'Retaliate' },
	vampiricBlow: { name: 'Vampiric Blow', chargeStages: [780, 780, 780], releaseDuration: 1950, distance: 70 },
	fearsomeShout: { name: 'Fearsome Shout', stages: [720, 1400] },
	lethalStrike: { name: 'Lethal Strike', chargeStages: [770, 770, 770], releaseDuration: 1550, distance: 170, chainDuration: 550, unchainDuration: 680, vampWindowStart: 500 },
	tenacity: { name: 'Tenacity', stages: [500, 690] },
	bloodlust: { name: 'Bloodlust', duration: 700 },
	evasiveSmashRoll: { name: 'Evasive Smash (roll)', duration: 995, distance: 150 },
	evasiveSmashHit: { name: 'Evasive Smash (hit)', duration: 1810, distance: 152 },
	raze: { name: 'Raze', duration: 1200, chainDuration: 960, distance: 96 },
	tackle: { name: 'Tackle', duration: 990, distance: 80 },
	unbreakable: { name: 'Unbreakable', duration: 2060 },
	intimidation: { name: 'Intimidation' },
	evasiveRoll: { name: 'Evasive Roll', duration: 1005, distance: 150 },
	axeCounter: { name: 'Axe Counter', duration: 1250, distance: 0 },
	overwhelm: { name: 'Overwhelm (dash)', dashDuration: 1110, dashDistance: 494, stopShort: 16 },
	overwhelmHit: { name: 'Overwhelm (hit)', duration: 1355 },
	punishingStrike: { name: 'Punishing Strike (hit 1)', duration: 770, distance: 32 },
	punishingStrike2: { name: 'Punishing Strike (hit 2)', duration: 785 }
};

const LOCK_TS = { skill: '3:0', ms: 'duration' };
const RELEASES = (g) => [10, 11, 12, 13].map(s => `${g}:${s}`);
const CHARGE = { mode: 'charge', subs: [0], releaseSubs: [10, 11, 12, 13], releaseNoEnd: true, chargeStageSpeed: 'charge', waitServerStage: true,
	pressRetry: [50, 100, 150, 200], releaseRetry: [40, 80, 120, 160], retry: false, selfLock: 0 };

const RAZE_AFTER_VAMP_MIN = 700;

const FAMILIES = {
	1: { key: 'combo', mode: 'combo', subs: [0, 1, 2, 3], retry: [35, 75], selfLock: 100, cancelOnlyBy: [1, 2, 25], locks: [LOCK_TS] },

	2: { key: 'block', mode: 'hold', subs: [0, 1, 30, 31], releaseSub: null, releaseEndType: 10, prevEndType: 6, noPrevEndFor: [29, '24:0', '31:0'],
		retry: false, selfLock: 0, pressRetry: [35, 70, 105, 140, 180], tapResend: true, unlocks: ['10:0', '3:0', '6:0', '4:0', '25:0'],

		bySub: { 1: { fixedSpeed: true }, 31: { fixedSpeed: true } } },
	3: Object.assign({ key: 'thunderStrike', locks: [LOCK_TS] }, CHARGE),

	4: { key: 'flatten', mode: 'simple', subs: [0], serverSubs: [1, 31], chains: [{ from: ['32:1', 25, 6, 31], sub: 30 }], retry: [35, 75, 115], selfLock: 'duration',
		interruptOnly: [5, 31, 19, 16, 20, '32:1', 7, 25, 6], locks: [LOCK_TS] },
	5: { key: 'dash', mode: 'simple', fixedSpeed: true, retry: [35, 75], locks: [LOCK_TS] },
	6: { key: 'staggeringStrike', mode: 'simple', subs: [0], serverSubs: [30], retry: false, locks: [LOCK_TS] },
	7: { key: 'mockingShout', mode: 'stages', fixedSpeed: true, retry: [35, 75], selfLock: 0 },
	8: { key: 'fieryRage', mode: 'simple', retry: [35, 75] },
	9: { key: 'triumphantShout', mode: 'simple', fixedSpeed: true, retry: [35, 75] },
	10: Object.assign({ key: 'cyclone' }, CHARGE),
	11: { key: 'leapingStrike', mode: 'simple', retry: false, locks: [LOCK_TS] },
	12: { key: 'unchainedAnger', mode: 'stages', retry: [35, 75], selfLock: 0, locks: [{ skill: '19:0', ms: 'duration' }] },
	13: { key: 'retaliate', mode: 'passthrough' },
	15: Object.assign({ key: 'vampiricBlow', dropWhileCharging: true, extraSubs: { 14: { prop: 'releaseDuration' } }, locks: [LOCK_TS] }, CHARGE),
	16: { key: 'fearsomeShout', mode: 'stages', fixedSpeed: true, retry: [35, 75], selfLock: 0 },

	18: Object.assign({ key: 'lethalStrike', extraSubs: { 30: { prop: 'chainDuration' } }, locks: [LOCK_TS] }, CHARGE),
	19: { key: 'tenacity', mode: 'stages', fixedSpeed: true, retry: [35, 75], selfLock: 0, locks: [LOCK_TS] },
	21: { key: 'bloodlust', mode: 'simple', fixedSpeed: true, retry: [35, 75], locks: [LOCK_TS] },
	24: { key: 'evasiveSmashRoll', keys: { 10: 'evasiveSmashHit', 11: 'evasiveSmashHit', 12: 'evasiveSmashHit', 13: 'evasiveSmashHit' }, mode: 'simple', subs: [0, 10, 11, 12, 13],
		retry: false, selfLock: 200, locks: [LOCK_TS],
		bySub: { 10: { retry: [35, 75], selfLock: 0, locks: [] }, 11: { retry: [35, 75], selfLock: 0, locks: [] }, 12: { retry: [35, 75], selfLock: 0, locks: [] }, 13: { retry: [35, 75], selfLock: 0, locks: [] } } },
	25: { key: 'raze', mode: 'simple', subs: [0], serverSubs: [1, 31], retry: false, unlocks: ['4:0'], locks: [LOCK_TS],
		chains: [{ from: RELEASES(3).concat(RELEASES(10), RELEASES(15), ['15:14', 1, 30, '32:1']), sub: 30 }],
		interruptOnly: [21, 5, 19, '31:1', 15, 16, 20, 3, 10, '32:1', 30, 7, 1, 18] },
	26: { key: 'tackle', mode: 'simple', retry: [35, 75, 115],
		locks: [LOCK_TS, { skill: '4:0', ms: 'duration' }, { skill: '6:0', ms: 'duration', extra: 100 }] },
	27: { key: 'unbreakable', mode: 'simple', serverSubs: [30] },
	28: { key: 'intimidation', mode: 'passthrough' },
	29: { key: 'evasiveRoll', mode: 'simple', locks: [LOCK_TS] },
	30: { key: 'axeCounter', mode: 'simple', retry: [35, 75] },

	31: { key: 'overwhelm', keys: { 1: 'overwhelmHit' }, mode: 'simple', subs: [1], serverSubs: [0], retry: [35, 75] },
	32: { key: 'punishingStrike', keys: { 1: 'punishingStrike2' }, mode: 'simple', subs: [0, 1], retry: [35, 75],
		bySub: {
			0: { selfLock: 'duration', locks: [LOCK_TS, { skill: '25:0', ms: 'duration' }, { skill: '4:0', ms: 'duration' }] },
			1: { selfLock: 'duration', unlocks: ['25:0', '4:0'] }
		} }
};

const GLYPHS = {
	24049: { name: 'Flatten speed', exclusive: 'flatten', groups: [4], speed: 1.25 },
	24050: { name: 'Flatten speed', exclusive: 'flatten', groups: [4], speed: 1.25 },
	24077: { name: 'Raze speed', exclusive: 'raze', groups: [25], speed: 1.25 },
	24078: { name: 'Raze speed', exclusive: 'raze', groups: [25], speed: 1.25 }
};

const TS_CHARGE_GLYPHS = [24067, 24066, 24002, 24003];
const CYCLONE_CHARGE_GLYPHS = [24052, 24051, 24009, 24094, 24095, 24096];
const STAGGER_GLYPHS = [24047, 24046];
const RAZE_GLYPHS = [24072, 24071, 24101, 24100];
const MOCK_GLYPHS = [24055, 24054];
const FLURRY_ABNORMALS = [400711, 400500, 400501, 400502, 400508, 22060];

const rep3 = (v) => (Number.isFinite(v) ? [v, v, v] : undefined);
const LEGACY = {
	dirs: ['neuesZerkSP'],

	config: { DISABLE_VAMP_CHECK: null, CYCLONE_DASH: null, USE_SERVER_ANIMSEQ: null },
	skillData(o) {
		const g = (k) => o[k] || {};
		return {
			combo: { durations: g('combo').durations, distance: g('combo').distance },
			thunderStrike: { chargeStages: rep3(g('thunderstrike').chargeDuration), releaseDuration: g('thunderstrike').castDuration, distance: g('thunderstrike').distance,
				vampWindowStart: g('thunderstrike').vampWindowStart, vampWindowExtra: g('thunderstrike').vampWindowExtra },
			flatten: { duration: g('flatten').duration, chainDuration: g('flatten').chainDuration, distance: g('flatten').distance },
			dash: { duration: g('dash').duration },
			staggeringStrike: { duration: g('staggeringStrike').duration, distance: g('staggeringStrike').distance },
			mockingShout: { stages: g('mockingShout').stages },
			fieryRage: { duration: g('fieryRage').duration },
			triumphantShout: { duration: g('triumphantShout').duration },
			cyclone: { chargeStages: rep3(g('cyclone').chargeDuration), spinDuration: g('cyclone').spinDuration, endDuration: g('cyclone').endDuration,
				flattenLockExtra: g('cyclone').flattenLockExtra, distance: g('cyclone').distance },
			leapingStrike: { duration: g('leapingStrike').duration, distance: g('leapingStrike').distance },
			unchainedAnger: { stages: g('unchainedAnger').stages },
			vampiricBlow: { chargeStages: rep3(g('vampiricBlow').chargeDuration), releaseDuration: g('vampiricBlow').castDuration, distance: g('vampiricBlow').distance },
			fearsomeShout: { stages: g('fearsomeShout').stages },
			lethalStrike: { chargeStages: rep3(g('lethalStrike').chargeDuration), releaseDuration: g('lethalStrike').castDuration, distance: g('lethalStrike').distance,
				chainDuration: g('lethalStrike').chainDuration, unchainDuration: g('lethalStrike').unchainDuration, vampWindowStart: g('lethalStrike').vampWindowStart },
			tenacity: { stages: g('tenacity').stages },
			bloodlust: { duration: g('bloodlust').duration },
			evasiveSmashRoll: { duration: g('evasiveSmash').rollDuration, distance: g('evasiveSmash').rollDistance },
			evasiveSmashHit: { duration: g('evasiveSmash').hitDuration,
				distance: Number.isFinite(g('evasiveSmash').hitDistance) ? Math.round(g('evasiveSmash').hitDistance / 2) : undefined },
			raze: { duration: g('raze').duration, chainDuration: g('raze').chainDuration, distance: g('raze').distance },
			tackle: { duration: g('tackle').duration, distance: g('tackle').distance },
			unbreakable: { duration: g('unbreakable').duration },
			evasiveRoll: { duration: g('evasiveRoll').duration, distance: g('evasiveRoll').distance },
			axeCounter: { duration: g('axeCounter').duration, distance: g('axeCounter').distance },
			overwhelm: { dashDuration: g('overwhelm').dashDuration, dashDistance: g('overwhelm').dashDistance },
			overwhelmHit: { duration: g('overwhelm').hitDuration },
			punishingStrike: { duration: g('punishingStrike').hit1Duration, distance: g('punishingStrike').hit1Distance },
			punishingStrike2: { duration: g('punishingStrike').hit2Duration }
		};
	}
};

function setup(api) {
	const { groupOf, subOf, baseOf, getSkillId } = api;
	const at = (id, g, ...subs) => groupOf(id) === g && (subs.length === 0 || subs.includes(subOf(id)));

	let dstance = false;
	let staggerGlyph = 0, razeGlyph = 0, mockGlyph = 0;
	let staggerTimer = null, razeTimer = null, mockTimer = null;
	let vampWindow = null;
	let vampOpenTimer = null, vampCloseTimer = null;
	let queuedVamp = null;
	let vampReadyAt = 0;
	let cycloneCdUntil = 0;
	let fakeCycloneSlow = false;
	let lastStatPacket = null;
	let blockHeld = false;
	let vbHeld = false;
	const P115 = Boolean(api.dispatch && api.dispatch.isP115); // OSTO 115 hybrid client (see p115.js)
	let p115ChainAt = 0;
	const FLATTEN_BLOCK_FROM = 1770;
	const ROLL_BLOCK_EXTRA = 10;
	const ABN_TS_RAZE_GLYPH = 24170;
	let pendingBlock = null;
	let sendingHeldBlock = false;
	let vampPress = null;
	const knownSkills = new Set();

	const setDstance = (state, via) => {
		if (dstance !== state) api.recordPacket('MOD', state ? 'D-STANCE ON' : 'D-STANCE OFF', { via });
		dstance = state;
	};
	const flurry = () => (FLURRY_ABNORMALS.some(id => api.hasAbnormal(id)) ? 0.4 : 0);
	const anyGlyph = (list) => list.some(id => api.isGlyph(id));
	const running = () => { const a = api.action(); return a && !a.finished ? a : null; };
	const runningIs = (g, ...subs) => { const a = running(); return Boolean(a && at(a.skillId, g, ...subs)); };
	const vampChainRunning = () => runningIs(15, 14);
	const vampReady = () => Date.now() >= vampReadyAt;

	const lastRunningIs = (list) => api.lastRunningHere() && api.matchesAny(api.lastSkill(), list);

	function timedGlyph(set, ms) {
		if (set === 'stagger') { api.clearTimeout(staggerTimer); staggerGlyph = 1; staggerTimer = api.setTimeout(() => { staggerGlyph = 0; }, ms); }
		if (set === 'raze') { api.clearTimeout(razeTimer); razeGlyph = 1; razeTimer = api.setTimeout(() => { razeGlyph = 0; }, ms); }
		if (set === 'mock') { api.clearTimeout(mockTimer); mockGlyph = 1; mockTimer = api.setTimeout(() => { mockGlyph = 0; }, ms); }
	}
	function clearTsGlyphBuffs() {
		api.clearTimeout(staggerTimer); staggerGlyph = 0;
		api.clearTimeout(razeTimer); razeGlyph = 0;
	}

	function known(id, fallback) {
		return (knownSkills.size === 0 || knownSkills.has(id)) ? id : fallback;
	}
	function resolveId(sid, offset) {
		const g = groupOf(sid);
		if (dstance && (g === 4 || g === 25)) {
			if (offset === 30) return known(sid + 31, sid + 30);
			if (offset === 0) return known(sid + 1, sid);
		}
		if (dstance && g === 6 && offset === 0) return known(sid + 30, sid);
		return sid + offset;
	}

	// DTmaik
	function applyCycloneSlow() {
		if (api.config.DISABLE_CHARGE || fakeCycloneSlow) return;
		api.setTimeout(() => {
			const c = api.charge();
			if (!c || groupOf(c.skillId) !== 10 || c.released || fakeCycloneSlow) return;
			fakeCycloneSlow = true;
			api.dispatch.toClient('S_ABNORMALITY_BEGIN', 3, { target: api.cid(), source: 0n, id: 900300, duration: 2147483647, unk: 0, stacks: 1 });
			if (lastStatPacket) api.dispatch.toClient('S_PLAYER_STAT_UPDATE', 11, Object.assign({}, lastStatPacket, { runSpeedBonus: lastStatPacket.runSpeedBonus - 145 }));
		}, 45);
	}
	function removeCycloneSlow() {
		if (!fakeCycloneSlow) return;
		fakeCycloneSlow = false;
		api.dispatch.toClient('S_ABNORMALITY_END', 1, { target: api.cid(), id: 900300 });
		if (lastStatPacket) api.dispatch.toClient('S_PLAYER_STAT_UPDATE', 11, lastStatPacket);
	}

	function closeVampWindow() {
		api.clearTimeout(vampOpenTimer);
		api.clearTimeout(vampCloseTimer);
		vampWindow = null;
		queuedVamp = null;
	}
	function openVampWindow(source, openIn, openFor) {
		const keep = queuedVamp;
		closeVampWindow();
		queuedVamp = keep;
		vampOpenTimer = api.setTimeout(() => {
			vampWindow = { source };
			vampCloseTimer = api.setTimeout(() => { vampWindow = null; queuedVamp = null; }, Math.max(0, openFor));

			const q = queuedVamp;
			queuedVamp = null;
			if (q && api.lastSkill() === source && runningIs(groupOf(source), subOf(source)) && vampReady()) {
				api.recordPacket('MOD->S', 'C_PRESS_SKILL [queued Vampiric Blow sent]', { skill: api.skillLabel(getSkillId(q.skill)) });
				api.sendRetry('C_PRESS_SKILL', 4, q);
				startVampChain(q);

				if (!vbHeld) api.setTimeout(() => api.sendRetry('C_PRESS_SKILL', 4, Object.assign(api.copyEvent(q), { press: false })), 30);
			}
		}, Math.max(0, openIn));
	}
	function startVampChain(event) {
		const vampId = baseOf(getSkillId(event.skill)) + 14;
		const d = api.skills.vampiricBlow;
		closeVampWindow();
		api.resetCharge();
		removeCycloneSlow();
		const ev = api.withSkillId(event, vampId);
		const a = api.startAction(ev, vampId, { duration: d.releaseDuration, distance: d.distance, prevEndType: 4, requestId: vampId });
		api.applyLocks({ locks: [{ skill: '6:0', ms: 'duration' }, { skill: '4:0', ms: 'duration' }], unlocks: ['25:0'], selfLock: 0 }, vampId, a);
		api.setLastSkill(vampId, ev);
		api.recordPacket('MOD', 'Vampiric Blow chain predicted', { skill: api.skillLabel(vampId) });

		const copy = api.copyEvent(event);
		const sentAt = Date.now();
		vampPress = { id: vampId, copy, at: sentAt };
		[30, 60, 90, 120, 160, 200].forEach(delay => api.setTimeout(() => {
			if (!vbHeld || api.lastSkill() !== vampId || api.serverSkillAckAt(vampId) >= sentAt) return;
			api.sendRetry('C_PRESS_SKILL', 4, copy);
		}, delay));
	}

	function vampReleased(upEvent) {
		const p = vampPress;
		vampPress = null;
		if (!p || api.lastSkill() !== p.id || api.serverSkillAckAt(p.id) >= p.at) return;
		const wait = (Number(api.config.GLOBAL_LATENCY) || 100) + 60;
		const up = api.copyEvent(upEvent);
		api.setTimeout(() => {
			if (api.lastSkill() !== p.id || api.serverSkillAckAt(p.id) >= p.at || !vampChainRunning()) return;
			api.recordPacket('MOD->S', 'C_PRESS_SKILL [Vampiric Blow tap resend: press was not confirmed]', { skill: api.skillLabel(p.id) });
			api.sendRetry('C_PRESS_SKILL', 4, p.copy);
			api.setTimeout(() => api.sendRetry('C_PRESS_SKILL', 4, up), 30);
		}, Math.max(0, wait - (Date.now() - p.at)));
	}

	const SPINS = { 10: 1, 11: 3, 12: 5, 13: 5 };
	// Soaria
	function predictCycloneRelease(event, fam, info) {
		const sid = info.sid;
		const n = SPINS[subOf(sid)];
		const d = api.skills.cyclone;
		removeCycloneSlow();
		closeVampWindow();
		if (info.allowRetry && fam.releaseRetry) api.scheduleReleaseRetries(info.name, info.version, event, fam);
		const stages = [];
		for (let i = 1; i < n; i++) stages.push({ at: d.spinDuration * i, stage: i });
		const a = api.predictChargeRelease(event, fam, {
			duration: d.spinDuration * n + d.endDuration,
			distance: 0,
			stages,

			// no stageLoc: the spins do not move the character, the client reports the same spot for each spin and the server takes
			// that (C_NOTIFY_LOCATION_IN_ACTION). Marching 35 units per spin along the start direction was ignored by the client while
			// under about 165 units off; with a small sideways drift it reached 210 at the last spin and the client snapped to it,
			// into the boss (log ttb-1795309197604).
			onStage: (st) => {
				if (st === 1 && subOf(sid) === 13) openVampWindow(sid, 0, (d.spinDuration * 4 + d.endDuration) / api.aspd());
			}
		});
		const aspd = api.aspd();
		api.lock('3:0', a.normDuration / a.speed);
		api.lock('4:0', (d.spinDuration * n + d.flattenLockExtra) / aspd);
	}

	const LETHAL_CHAIN_FROM = RELEASES(15).concat(['15:14', 11], RELEASES(3), RELEASES(10));
	function predictLethalHit(event, info) {
		const sid = info.sid;
		const d = api.skills.lethalStrike;
		const last = api.lastSkill();
		let target, duration;
		if (lastRunningIs(LETHAL_CHAIN_FROM)) {
			target = sid + 30; duration = d.chainDuration;
		} else if (!api.lastRunningHere() || at(last, 31, 0) || at(last, 5)) {
			target = sid; duration = d.unchainDuration;
		} else {
			api.recordPacket('MOD', 'Lethal Strike dropped (cannot interrupt the running skill)', { running: api.skillLabel(last) });
			return 'drop';
		}
		api.startAction(event, target, { duration, requestId: sid });
		api.lock(sid, 100);
		api.unlock('3:0');
		return 'done';
	}

	const DASH_REACH = 494;
	const DASH_CORRECT = 100;
	const NPC_UNKNOWN_GRACE = 200;
	const SERVER_DASH_MS_PER_UNIT = 1.65; // logs: 341 units in 575 ms, 346 units in 550 ms
	const positions = new Map();
	let owPredicted = null;
	const keepPos = (id, loc, dest, speed) => {
		if (!loc) return;
		positions.set(String(id), { loc: { x: loc.x, y: loc.y, z: loc.z }, dest: dest ? { x: dest.x, y: dest.y, z: dest.z } : null, speed: Number(speed) || 0, at: Date.now() });
		if (positions.size > 3000) positions.delete(positions.keys().next().value);
	};
	function positionOf(id) {
		const p = positions.get(String(id));
		if (!p) return null;
		if (!p.dest || !p.speed) return p.loc;

		const total = Math.hypot(p.dest.x - p.loc.x, p.dest.y - p.loc.y);
		if (total < 1) return p.dest;
		const k = Math.min(1, (p.speed * (Date.now() - p.at) / 1000) / total);
		return { x: p.loc.x + (p.dest.x - p.loc.x) * k, y: p.loc.y + (p.dest.y - p.loc.y) * k, z: p.loc.z + (p.dest.z - p.loc.z) * k };
	}
	api.tryHook('S_SPAWN_NPC', 11, (e) => keepPos(e.gameId, e.loc));
	api.tryHook('S_NPC_LOCATION', 3, (e) => keepPos(e.gameId, e.loc, e.dest, e.speed));
	api.tryHook('S_SPAWN_USER', 14, (e) => keepPos(e.gameId, e.loc));
	api.tryHook('S_USER_LOCATION', 5, (e) => keepPos(e.gameId, e.loc, e.dest, e.speed));
	api.tryHook('S_DESPAWN_NPC', 3, (e) => { positions.delete(String(e.gameId)); npcActs.delete(String(e.gameId)); });
	api.tryHook('S_DESPAWN_USER', 3, (e) => positions.delete(String(e.gameId)));
	api.tryHook('S_LOAD_TOPO', 3, () => { positions.clear(); npcActs.clear(); });
	// bosses move mostly through their skills and rarely send S_NPC_LOCATION: the movement is in the S_ACTION_STAGE animSeq (distance
	// along w) or, when that is empty, only in the game data -> learned per skill stage from its S_ACTION_STAGE to the next stage / the
	// S_ACTION_END (logs ttb-1795291238947: boss skill 1108 walks 458 units in 3.4 s; ttb-1795291454813: skill 1104 walks 338 units in
	// its stage 1, along the new w of that stage - both with an empty animSeq). Not learned yet: position uncertain.
	const npcActs = new Map(), npcMoves = new Map();
	const npcSkillKey = (e) => { const sk = e.skill || {}; return String(e.templateId) + ':' + String(sk.huntingZoneId || 0) + ':' + String(sk.id !== undefined ? sk.id : sk); };
	function positionUncertain(id) {
		const act = npcActs.get(String(id));
		return Boolean(act && !act.known && Date.now() - act.at > NPC_UNKNOWN_GRACE);
	}
	function learnNpcSegment(act, loc) {
		if (!act.learn || npcMoves.has(act.seg)) return;
		const dx = loc.x - act.loc.x, dy = loc.y - act.loc.y, c = Math.cos(act.w), sn = Math.sin(act.w);
		npcMoves.set(act.seg, { fwd: dx * c + dy * sn, side: -dx * sn + dy * c, ms: Date.now() - act.at });
		if (npcMoves.size > 2000) npcMoves.delete(npcMoves.keys().next().value);
	}
	api.tryHook('S_ACTION_STAGE', 9, (e) => {
		if (e.gameId === api.cid() || !e.loc) return;
		const key = npcSkillKey(e), prev = npcActs.get(String(e.gameId));
		if (prev && prev.id === e.id) learnNpcSegment(prev, e.loc); // next stage of the same skill closes the previous one
		let dist = 0, ms = 0;
		for (const st of (e.animSeq || [])) { dist += Number(st.distance) || 0; ms += Number(st.duration) || 0; }
		ms /= Number(e.speed) || 1;
		const w = Number(e.w) || 0, c = Math.cos(w), sn = Math.sin(w);
		const act = { id: e.id, seg: key + ':' + String(e.stage || 0), loc: { x: e.loc.x, y: e.loc.y }, w, at: Date.now(), known: true, learn: false };
		if (dist >= 1 && ms > 0) keepPos(e.gameId, e.loc, { x: e.loc.x + c * dist, y: e.loc.y + sn * dist, z: e.loc.z }, dist / (ms / 1000));
		else {
			act.learn = true;
			const m = npcMoves.get(act.seg);
			if (!m) { act.known = false; keepPos(e.gameId, e.loc); }
			else if (Math.hypot(m.fwd, m.side) < 5 || m.ms <= 0) keepPos(e.gameId, e.loc);
			else keepPos(e.gameId, e.loc, { x: e.loc.x + c * m.fwd - sn * m.side, y: e.loc.y + sn * m.fwd + c * m.side, z: e.loc.z }, Math.hypot(m.fwd, m.side) / (m.ms / 1000));
		}
		npcActs.set(String(e.gameId), act);
		if (npcActs.size > 500) npcActs.delete(npcActs.keys().next().value);
	});
	api.tryHook('S_ACTION_END', 5, (e) => {
		if (e.gameId === api.cid() || !e.loc) return;
		const act = npcActs.get(String(e.gameId));
		if (act && act.id === e.id) { npcActs.delete(String(e.gameId)); learnNpcSegment(act, e.loc); }
		keepPos(e.gameId, e.loc);
	});
	api.tryHook('S_INSTANT_MOVE', 3, (e) => { if (e.gameId !== api.cid()) keepPos(e.gameId, e.loc); });

	function predictOverwhelm(event, info) {
		const sid = info.sid;
		const d = api.skills.overwhelm;
		if (!event.dest) return undefined;
		let targetId = 0n;
		if (event.targets && event.targets.length) targetId = event.targets[0].gameId || event.targets[0].id || 0n;
		const tpos = targetId ? positionOf(targetId) : null;
		const reach = tpos ? Math.hypot(tpos.x - event.loc.x, tpos.y - event.loc.y) : Infinity;
		let dest, travel, target = 0n;
		if (tpos && reach <= DASH_REACH) {
			dest = { x: tpos.x, y: tpos.y, z: tpos.z };
			travel = reach;
			target = targetId;
		} else {
			const aim = { x: event.dest.x, y: event.dest.y, z: event.dest.z };
			const full = Math.hypot(aim.x - event.loc.x, aim.y - event.loc.y);
			travel = Math.max(0, full - (d.stopShort || 0));
			const k = full > 1 ? travel / full : 0;
			dest = {
				x: event.loc.x + (aim.x - event.loc.x) * k,
				y: event.loc.y + (aim.y - event.loc.y) * k,
				z: Math.abs(aim.z - event.loc.z) < 30 ? event.loc.z : aim.z
			};
			travel = full;
		}
		if (target && positionUncertain(target)) {
			// the boss walks with a skill we have not seen yet: start the animation, the dash comes with the server (passed through)
			const here = { x: event.loc.x, y: event.loc.y, z: event.loc.z };
			owPredicted = { target, dest: null, wait: true };
			api.startAction(event, sid, { duration: Math.max((travel / d.dashDistance) * d.dashDuration, api.estimateRtt() * 2 + 300), fixedSpeed: true, dest: here, endType: 38, requestId: sid });
			api.recordPacket('MOD', 'Overwhelm predicted without dash: target moves with an unknown skill, waiting for the server dash', { reach: Math.round(reach) });
		} else {
			const duration = (travel / d.dashDistance) * d.dashDuration;
			owPredicted = { target, dest };
			api.startAction(event, sid, { duration, fixedSpeed: true, dest, endType: 38, requestId: sid });
			api.dispatch.toClient('S_INSTANT_DASH', 3, { gameId: api.cid(), target, unk: 0, loc: dest, w: event.w });
			api.recordPacket('MOD', 'Overwhelm predicted', { target: target ? 'yes (' + Math.round(reach) + ' units)' : (tpos ? 'out of reach (' + Math.round(reach) + ')' : 'position unknown') });
		}
		api.lock(sid, api.GLOBAL_LOCK_DELAY);
		api.scheduleRetries('C_START_TARGETED_SKILL', 6, event, [25, 50, 75, 100]);
		api.setLastSkill(sid, event);
		return 'done';
	}

	(async function loadKnownSkills() {
		try {
			if (typeof api.dispatch.queryData !== 'function' || !api.model()) return;
			const nodes = await api.dispatch.queryData('/SkillData/Skill@templateId=?/', [api.model()], true, false, ['id']);
			for (const n of (nodes || [])) if (n.attributes && n.attributes.id) knownSkills.add(Number(n.attributes.id));
		} catch (e) {  }
	})();

	api.hook('S_ABNORMALITY_BEGIN', 3, (event) => {
		if (!api.enabled() || event.target !== api.cid()) return;
		const id = Number(event.id);
		if (id >= 401400 && id <= 401499) setDstance(true, 'abnormality ' + id);
		if (id === 24130) timedGlyph('stagger', event.duration || 6000);
		if (id === 24170) timedGlyph('raze', event.duration || 5000);
		if (id === 900300) fakeCycloneSlow = false;
	});
	api.tryHook('S_ABNORMALITY_REFRESH', 1, (event) => {
		if (!api.enabled() || event.target !== api.cid()) return;
		const id = Number(event.id);
		if (id >= 401400 && id <= 401499) setDstance(true, 'abnormality ' + id);
		if (id === 24130) timedGlyph('stagger', event.duration || 6000);
		if (id === 24170) timedGlyph('raze', event.duration || 5000);
	});
	api.hook('S_ABNORMALITY_END', 1, (event) => {
		if (!api.enabled() || event.target !== api.cid()) return;
		const id = Number(event.id);
		if (id >= 401400 && id <= 401499) setDstance(false, 'abnormality end ' + id);
		if (id === 24130) { api.clearTimeout(staggerTimer); staggerGlyph = 0; }
		if (id === 24170) { api.clearTimeout(razeTimer); razeGlyph = 0; }
		if (id === 900300) fakeCycloneSlow = false;
	});
	api.hook('S_PLAYER_STAT_UPDATE', 11, { order: -10 }, (event) => {
		if (event.runSpeedBonus >= 0 && !fakeCycloneSlow) lastStatPacket = Object.assign({}, event);
	});

	api.hook('S_START_COOLTIME_SKILL', 3, { order: -10 }, (event) => {
		if (!api.enabled()) return;
		const sid = getSkillId(event.skill);
		const lat = Number(api.config.GLOBAL_LATENCY) || 0;
		if (at(sid, 15, 0, 14)) vampReadyAt = Date.now() + Math.max(0, event.cooldown - lat);
		if (at(sid, 10, 0) && event.cooldown > 0) cycloneCdUntil = Date.now() + event.cooldown - 1000;
		if (at(sid, 32, 0) && event.cooldown === 0) api.unlock('32:0');
	});

	api.hook('S_INSTANT_DASH', 3, (event) => {
		if (event.gameId !== api.cid()) { if (api.enabled()) keepPos(event.gameId, event.loc); return; }
		if (!api.predicting()) return;
		let target = 0n;
		try { target = event.target ? BigInt(event.target) : 0n; } catch (e) {}
		const ours = owPredicted ? BigInt(owPredicted.target || 0n) : 0n;
		const ourDest = owPredicted && owPredicted.dest;
		const waited = Boolean(owPredicted && owPredicted.wait);
		owPredicted = null;
		const a = running();
		const dashing = a && at(a.skillId, 31, 0);
		if (dashing) a.dest = { x: event.loc.x, y: event.loc.y, z: event.loc.z };
		const off = ourDest ? Math.hypot(event.loc.x - ourDest.x, event.loc.y - ourDest.y) : 0;
		if (target === ours && !waited && (off <= DASH_CORRECT || !dashing)) return false;
		if (dashing) {
			const travel = Math.hypot(event.loc.x - a.start.x, event.loc.y - a.start.y);
			const elapsed = Date.now() - a.startedAt;
			// a server dash with a target: the client dashes again from here at its own speed and sends the hit (311001) itself when it
			// is close, which ends this dash. Ending it at the server time cut the client dash short in front of the target, no hit
			// (log ttb-1795318248237: we had no target at 496 units, the server took the dummy, our end came 70 ms before the hit point).
			const d = api.skills.overwhelm;
			const ms = target ? elapsed + (travel / d.dashDistance) * d.dashDuration : travel * SERVER_DASH_MS_PER_UNIT;
			api.scheduleActionEnd(a, Math.max(elapsed + 50, ms));
		}
		if (target === ours) { api.recordPacket('S->C', 'S_INSTANT_DASH [PASSED: ' + (waited ? 'waited for the server dash' : 'server dash ends ' + Math.round(off) + ' units from ours') + ']', {}); return; }
		api.recordPacket('S->C', 'S_INSTANT_DASH [PASSED: server dash differs from ours]', { server: String(target), ours: String(ours) });
	});

	let pendingSmash = null, smashTimer = null;
	// 115 client logs: the server refuses a block in the Flatten chain (4:30) before ~1770 ms (attack speed 1.0) after its own start
	// (refused at 1504 / 1672 / 1731-1739, accepted from 1733-1769). SP used to show the block anyway, ended Flatten and predicted
	// the next skill while the server was still in Flatten = ghost (Tackle / Overwhelm). An early block is now held until the server
	// takes it; a skill pressed meanwhile is sent right after the block (same order as the player pressed them).
	function flattenBlockWait() {
		const a = running();
		if (!a || !at(a.skillId, 4, 30)) return 0;
		const sv = api.serverActive();
		const svAt = sv && at(sv.id, 4, 30) ? sv.at : a.startedAt + api.estimateRtt();
		const speed = a.speed || api.aspd();
		const arrive = (Date.now() - svAt + api.estimateRtt()) * speed;
		return Math.max(0, (FLATTEN_BLOCK_FROM - arrive) / speed);
	}
	// 115 client log (rotation.log 10.5 s): a block during the Evasive Smash roll (24:0) is refused by the server until the roll is over
	// (refused at ~776 / 835 of 995). SP showed the block ~170 ms early and only the tap resend got it through. The block is now held
	// until the server roll ends (timed to arrive then, or at the latest when the server roll end comes in).
	function rollBlockWait() {
		const a = running();
		const sv = api.serverActive();
		let svAt;
		if (sv && at(sv.id, 24, 0)) svAt = sv.at;
		else if (a && at(a.skillId, 24, 0)) svAt = a.startedAt + api.estimateRtt();
		else return 0;
		const speed = (a && at(a.skillId, 24, 0) && a.speed) || api.aspd();
		const arrive = (Date.now() - svAt + api.estimateRtt()) * speed;
		const roll = Number(api.skills.evasiveSmashRoll && api.skills.evasiveSmashRoll.duration) || 995;
		return Math.max(0, (roll + ROLL_BLOCK_EXTRA - arrive) / speed);
	}
	function holdFlattenBlock(event, wait, roll) {
		pendingBlock = { press: api.copyEvent(event), release: null, next: [], roll: Boolean(roll), timer: api.setTimeout(sendPendingBlock, wait) };
		api.recordPacket('MOD', roll ? 'Block held back (server still in the Evasive Smash roll)' : 'Block held back (Flatten chain cannot be cancelled yet)', { wait: Math.round(wait) });
	}
	function sendPendingBlock() {
		const p = pendingBlock;
		if (!p) return;
		pendingBlock = null;
		api.clearTimeout(p.timer);
		api.recordPacket('MOD->S', p.roll ? 'Held block sent (server roll is over)' : 'Held block sent (Flatten chain can be cancelled now)', { tap: Boolean(p.release), next: p.next.length });
		sendingHeldBlock = true;
		try {
			api.startPress(p.press);
			if (p.release) api.startPress(p.release);
		} finally {
			sendingHeldBlock = false;
		}
		for (const n of p.next) {
			if (n.press) api.startPress(n.event);
			else api.startSkill(n.name, n.version, n.event);
		}
	}

	function sendPendingSmash() {
		api.clearTimeout(smashTimer);
		if (!pendingSmash) return;
		const ev = pendingSmash;
		pendingSmash = null;
		// released mid roll, sent at the server roll end: with the position the character has now (our roll animation is over)
		const a = api.action();
		if (!a || a.finished) { const l = api.currentLoc(ev.loc); ev.loc = { x: l.x, y: l.y, z: l.z }; }
		api.dispatch.toServer('C_PRESS_SKILL', 4, ev);
	}

	return {
		resolveId,

		chargeSpeed(sid) {
			const base = api.aspd() + flurry();
			if (groupOf(sid) === 3) return base * (1 + (anyGlyph(TS_CHARGE_GLYPHS) ? 0.25 : 0) + staggerGlyph * 0.3 + razeGlyph * 0.25);
			if (groupOf(sid) === 10) return base * (1 + (anyGlyph(CYCLONE_CHARGE_GLYPHS) ? 0.25 : 0) + mockGlyph * 0.3);
			return base;
		},
		chargeStarted(sid) {
			if (groupOf(sid) === 10) applyCycloneSlow();
		},

		start(event, info) {
			const sid = info.sid;
			const g = groupOf(sid);
			if (pendingBlock && !sendingHeldBlock) {
				pendingBlock.next.push({ name: info.name, version: info.version, event: api.copyEvent(event) });
				api.recordPacket('MOD', 'Skill queued behind the held block', { skill: api.skillLabel(sid) });
				return 'drop';
			}
			if (g !== 10 && fakeCycloneSlow) removeCycloneSlow();
			if (g === 28) { setDstance(subOf(sid) !== 50, 'Intimidation'); return 'pass'; }

			if (g === 10 && subOf(sid) === 0 && dstance) return 'pass';
			if (api.isLocked(sid)) return undefined;

			if (g === 6 && runningIs(7)) return 'pass';

			if ((g === 3 || g === 18) && subOf(sid) >= 10 && subOf(sid) <= 13 && vampChainRunning()) return 'pass';
			if (at(sid, 32, 0) && !dstance) return 'pass';
			if (at(sid, 32, 1) && !at(api.lastSkill(), 32, 0)) return 'drop';
			if (at(sid, 18, 0)) return predictLethalHit(event, info);
			if (at(sid, 10, 10, 11, 12, 13)) { predictCycloneRelease(event, info.fam, info); return 'done'; }
			return undefined;
		},

		predicted(sid, a) {
			const g = groupOf(sid);
			const aspd = api.aspd();
			if (g === 3 && subOf(sid) === 13) {
				const d = api.skills.thunderStrike;
				openVampWindow(sid, d.vampWindowStart / aspd, (d.releaseDuration - d.vampWindowStart) / aspd + d.vampWindowExtra);
			} else if (g === 18 && subOf(sid) === 13) {
				const d = api.skills.lethalStrike;
				openVampWindow(sid, d.vampWindowStart / aspd, (d.releaseDuration - d.vampWindowStart) / aspd);
			} else if ([3, 10, 18].includes(g) && subOf(sid) >= 10 && subOf(sid) <= 12) {
				closeVampWindow();
			}
			if (g === 6 && anyGlyph(STAGGER_GLYPHS)) timedGlyph('stagger', 6000);
			if (g === 25 && anyGlyph(RAZE_GLYPHS)) timedGlyph('raze', 5000);
			if (g === 7 && anyGlyph(MOCK_GLYPHS)) timedGlyph('mock', 6000);
			void a;
		},

		// 115 client logs: the Thunder Strike release runs 25 % faster while abnormality 24170 (Raze glyph buff, consumed by the
		// release) is active - server speed 1.986 / 1.486 at attack speed 1.589 / 1.189, and 1.0x without it. Without this SP learned
		// the 1.25 after two releases and then also used it without the buff (release ended too early, block refused).
		skillSpeed(sid) {
			if (P115 && at(sid, 3, 10, 11, 12, 13) && api.hasAbnormal(ABN_TS_RAZE_GLYPH)) return 1.25;
			return 1;
		},

		requestDelay(sid) {
			if (groupOf(sid) !== 25) return 0;
			const a = api.action();
			if (!a || a.finished || !at(a.skillId, 15, 14)) return 0;
			const sv = api.serverActive();
			const svAt = sv && at(sv.id, 15, 14) ? sv.at : a.startedAt + api.estimateRtt();
			const speed = a.speed || api.aspd();
			const arrive = (Date.now() - svAt + api.estimateRtt()) * speed;
			return Math.max(0, (RAZE_AFTER_VAMP_MIN - arrive) / speed);
		},

		press(event, info) {
			const sid = info.sid;
			const g = groupOf(sid);

			if (at(sid, 24, 5) && !event.press) {
				const sv = api.serverActive();
				if (sv && at(sv.id, 24, 0)) {
					api.clearTimeout(smashTimer);
					pendingSmash = api.copyEvent(event);
					smashTimer = api.setTimeout(sendPendingSmash, 1200);
					api.recordPacket('MOD', 'Evasive Smash hit held back until the server ends the roll', {});
					return 'drop';
				}
				return undefined;
			}
			if (pendingBlock && !sendingHeldBlock) {
				if (g === 2 && !event.press && !pendingBlock.release) { pendingBlock.release = api.copyEvent(event); blockHeld = false; return 'drop'; }
				if (g === 2) return 'drop'; // repeated block press while the first one waits
				pendingBlock.next.push({ press: true, event: api.copyEvent(event) });
				return 'drop';
			}
			if (g === 2) {
				const sub = subOf(sid);
				if (sub === 1 || sub === 31) setDstance(true, 'tank block');
				else if (sub === 0 || sub === 30) setDstance(false, 'offensive block');
				if (P115 && event.press && !sendingHeldBlock) {
					const wait = flattenBlockWait();
					if (wait > 0) { blockHeld = true; holdFlattenBlock(event, wait); return 'drop'; }
					const rollWait = rollBlockWait();
					if (rollWait > 0) { blockHeld = true; holdFlattenBlock(event, rollWait, true); return 'drop'; }
				}
				if (!event.press) {
					blockHeld = false;
					if (runningIs(7)) return 'pass';
					return undefined;
				}
				blockHeld = true;
				removeCycloneSlow();

				if (runningIs(32, 0) && !api.isLocked(sid)) {
					api.setTimeout(() => {
						if (!blockHeld || runningIs(32, 1) || api.hold()) return;
						api.startHold(info.fam, event);
					}, 100);
					return 'done';
				}
				return undefined;
			}
			// 115 client: in the chain window after a Thunder Strike / Cyclone / Lethal Strike release the client asks for the
			// Vampiric Blow chain with press=false first (press=true follows ~80 ms later) and the server starts the chain on it.
			// The press=false goes to the server unchanged, the chain is predicted right away; the late press=true is passed on.
			if (P115 && at(sid, 15, 0)) {
				if (!event.press && !vbHeld && vampWindow && !vampChainRunning() && vampReady() && lastRunningIs(['3:13', '10:13', '18:13'])) {
					startVampChain(event);
					p115ChainAt = Date.now();
					api.recordPacket('MOD', 'Vampiric Blow chain predicted on press=false (115 client)', {});
					return 'done';
				}
				if (event.press && vampChainRunning() && Date.now() - p115ChainAt < 400) {
					vbHeld = true;
					return 'pass';
				}
			}
			if (at(sid, 15, 0)) vbHeld = Boolean(event.press);
			if (!event.press) {
				if (g === 10) removeCycloneSlow();
				if (at(sid, 15, 0)) vampReleased(event);
				return undefined;
			}

			if ((g === 10 || g === 18) && subOf(sid) === 0 && dstance) return 'pass';

			if (vampChainRunning() && g !== 10) return 'drop';
			if (at(sid, 24, 5)) {
				api.dispatch.toClient('S_ABNORMALITY_BEGIN', 3, { target: api.cid(), source: api.cid(), id: 400900, duration: 4000, unk: 0, stacks: 1 });
				return 'pass';
			}
			if (at(sid, 15, 0)) {
				const sources = ['3:13', '10:13', '18:13'];
				if (!vampReady()) return 'pass';
				if (vampWindow && lastRunningIs(sources)) {
					startVampChain(event);
					return 'done';
				}

				if (lastRunningIs(['3:13', '18:13'].concat(RELEASES(10)))) {
					if (lastRunningIs(sources)) queuedVamp = api.copyEvent(event);
					api.recordPacket('MOD', 'Vampiric Blow held back (chain window not open yet)', { queued: Boolean(queuedVamp) });
					return 'drop';
				}
				return undefined;
			}

			if (at(sid, 10, 0) && Date.now() < cycloneCdUntil && !api.config.DISABLE_CHARGE && !api.isLocked(sid)) {
				api.cancelChargeAndHold(sid);
				api.startCharge(info.fam, event, { level: 3 });
				return 'done';
			}
			return undefined;
		},

		targeted(event, info) {
			if (pendingBlock) sendPendingBlock(); // targeted skills are not queued: the block goes out first
			if (at(info.sid, 31, 0) && !api.isLocked(info.sid)) return predictOverwhelm(event, info);
			return undefined;
		},

		serverStage(event, sid) {
			const g = groupOf(sid);

			if (g === 25 || g === 4) {
				const sub = subOf(sid);
				if (sub === 1 || sub === 31) setDstance(true, 'server skill ' + sid);
				else if (sub === 0 || sub === 30) setDstance(false, 'server skill ' + sid);
			}
			if (at(sid, 28, 0)) setDstance(true, 'Intimidation');
			if (at(sid, 28, 50)) setDstance(false, 'Intimidation off');
			return undefined;
		},
		serverEnd(event, sid) {
			if (at(sid, 24, 0) && pendingBlock && pendingBlock.roll) sendPendingBlock(); // pressed first: goes out before the held smash hit
			if (at(sid, 24, 0) && pendingSmash) sendPendingSmash();
			if (at(sid, 3, 10, 11, 12, 13)) clearTsGlyphBuffs();
			if (at(sid, 10, 0)) removeCycloneSlow();
			return undefined;
		},

		notify(copy) {
			if (!dstance) return;
			const id = copy.skill;
			let mapped = null;
			if (at(id, 4, 0) || at(id, 25, 0)) mapped = resolveId(id, 0);
			else if (at(id, 4, 30) || at(id, 25, 30)) mapped = resolveId(id - 30, 30);
			else if (at(id, 6, 0)) mapped = resolveId(id, 0);
			if (mapped && mapped !== id) api.dispatch.toServer('C_NOTIFY_LOCATION_IN_ACTION', 4, Object.assign({}, copy, { skill: mapped, loc: Object.assign({}, copy.loc) }));
		},

		learnTarget(id) {
			if (at(id, 31, 0)) return null;
			if (at(id, 10, 10, 11, 12, 13)) return null;
			if (at(id, 18, 0)) return { key: 'lethalStrike', prop: 'unchainDuration' };
			return undefined;
		},

		reset() {
			closeVampWindow();
			removeCycloneSlow();
			if (pendingBlock) { api.clearTimeout(pendingBlock.timer); pendingBlock = null; }
			blockHeld = false;
			vbHeld = false;
			vampPress = null;
		},
		destroy() {
			removeCycloneSlow();
		},
		bugState() {
			return `dstance=${dstance ? 1 : 0} flurry=${flurry()} vamp=${vampWindow ? 'open' : '-'}${queuedVamp ? '(queued)' : ''} vampReady=${vampReady() ? 1 : 0} glyphs=S${staggerGlyph}R${razeGlyph}M${mockGlyph} slow=${fakeCycloneSlow ? 1 : 0}`;
		}
	};
}

module.exports = {
	NAME: 'Berserker-SP',
	CMD: 'zerk',
	CLASS_LABEL: 'Berserker',
	JOB: 3,
	AUTHORS: 'DTmaik',
	COLOR: '#56B4E9',
	DATA_DIR: 'zerk',
	GLOBAL_LOCK_DELAY: 1000,
	RETRY_DELAYS: [],
	CHARGE_WATCHDOG: 380,
	NOTIFY_REPEATS: [100, 200],
	END_DESYNC_FIX: true,
	DEFAULT_SKILLS,
	FAMILIES,
	GLYPHS,
	LEGACY,

	MEASURED_UPDATES: [
		{ key: 'evasiveSmashRoll', prop: 'duration', old: [970], value: 995 },
		{ key: 'evasiveRoll', prop: 'duration', old: [880], value: 1005 }
	],
	EXTRA_CONFIG: {
		SPOOF_GRANT: true,
		SPOOF_GRANT_DESCRIPTION: 'When you let go of a charge key, the release starts right away instead of waiting for the server to allow it (one ping). May desync with high jitter (!zerk grant)',
		DISABLE_CHARGE: false,
		DISABLE_CHARGE_DESCRIPTION: 'Disables the charge display of Thunder Strike, Cyclone, Vampiric Blow and Lethal Strike (for unstable connections) (!zerk charge)'
	},
	COMMANDS: {
		grant: { key: 'SPOOF_GRANT', label: 'No ping delay on charge release' },
		charge: { key: 'DISABLE_CHARGE', label: 'Charge display', invert: true }
	},
	setup
};
// DTmaik
