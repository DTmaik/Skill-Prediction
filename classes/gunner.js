'use strict';
// Abdull

const DEFAULT_SKILLS = {
	blast: { name: 'Blast', duration: 1200 },
	bombardmentChannel: { name: 'Bombardment (channel)' },

	bombardment: { name: 'Bombardment (cast)', duration: 2970 },
	scattershot: { name: 'Scattershot', duration: 1730, distance: -108 },
	pointBlank: { name: 'Point Blank (hit 1)', duration: 1525, distance: 138 },

	pointBlankHit2: { name: 'Point Blank (hit 2)', duration: 1180, distance: -199 },

	burstFire: { name: 'Burst Fire (prime)', duration: 1065 },
	timeBomb: { name: 'Time Bomb', duration: 1000 },
	arcaneBarrage: { name: 'Arcane Barrage', duration: 1500 },
	arcaneBarrageDetonate: { name: 'Arcane Barrage (detonation)', duration: 1200 },

	manaMissiles: { name: 'Mana Missiles', chargeStages: [1200], releaseDuration: 1270, distance: -100 },

	manaMissilesWeak: { name: 'Mana Missiles (stage 0 shot)', releaseDuration: 1255, distance: -50 },
	arcBomb: { name: 'Arc Bomb', duration: 1315 },

	rocketJump: { name: 'Rocket Jump', duration: 1400, distance: 415, chainDistance: 415, superDuration: 1690, superDistance: 506 },
	baldersVengeance: { name: "Balder's Vengeance", duration: 5800, distance: -165 },
	replenishment: { name: 'Replenishment', duration: 1305 },
	dispenser: { name: 'Summon Bot: Dispenser', duration: 1430, distance: -45 },
	sentryTower: { name: 'Summon Bot: Sentry Tower', duration: 1305 },
	retaliate: { name: 'Retaliate' },
	rollingReload: { name: 'Rolling Reload', duration: 940, distance: 164, chainDistance: 152 }
};

const ALL_GROUPS = [2, 3, 4, 5, 6, 7, 9, 10, 11, 13, 15, 18, 19, 20, 22, 40];

const chainFrom = (self) => ALL_GROUPS.filter(g => g !== self);
const CHAIN = (self) => [{ from: chainFrom(self), sub: 30, base: true }];
const BASE = { prevEndType: undefined, retry: 'confirm' };

const FAMILIES = {
	1: Object.assign({ key: 'blast', mode: 'simple', subs: [1, 2], fixedSpeed: true }, BASE),

	2: Object.assign({ key: 'bombardment', keys: { 0: 'bombardmentChannel' }, mode: 'simple', subs: [1], serverSubs: [0] }, BASE),
	3: Object.assign({ key: 'scattershot', mode: 'simple', subs: [1, 2, 30], chains: CHAIN(3), chainOnSubs: [1, 2], selfLock: 600 }, BASE),

	4: Object.assign({ key: 'pointBlank', keys: { 3: 'pointBlankHit2', 4: 'pointBlankHit2' }, mode: 'simple', subs: [1, 2, 3, 30], serverSubs: [4],
		chains: CHAIN(4), chainOnSubs: [1, 2] }, BASE),

	5: { key: 'burstFire', mode: 'simple', subs: [0], serverSubs: [1], retry: 'track' },
	6: Object.assign({ key: 'timeBomb', mode: 'simple', subs: [1, 2], fixedSpeed: true }, BASE),

	7: Object.assign({ key: 'arcaneBarrage', keys: { 3: 'arcaneBarrageDetonate', 4: 'arcaneBarrageDetonate', 33: 'arcaneBarrageDetonate' }, mode: 'simple',
		subs: [1, 2, 31, 32, 3, 4, 33], bySub: { 1: { fixedSpeed: true }, 2: { fixedSpeed: true }, 31: { fixedSpeed: true }, 32: { fixedSpeed: true } } }, BASE),

	9: { key: 'manaMissiles', keys: { 10: 'manaMissilesWeak' }, mode: 'charge', subs: [0], releaseSubs: [10, 11], chargeMargin: 40, anchorToServer: true,
		pressRetry: [200, 400, 600, 800, 1000, 1200, 1400], releaseRetry: 'confirm', retry: false, selfLock: 300 },
	10: Object.assign({ key: 'arcBomb', mode: 'simple', subs: [1, 2, 30], chains: CHAIN(10), chainOnSubs: [1, 2], selfLock: 600 }, BASE),

	11: Object.assign({ key: 'rocketJump', mode: 'simple', subs: [1, 2], serverSubs: [30, 31], chainOnSubs: [1, 2],
		chains: [{ from: [40], sub: 31, base: true, durationKey: 'superDuration', distanceKey: 'superDistance' },
			{ from: chainFrom(11).filter(g => g !== 40), sub: 30, base: true, durationKey: 'duration', distanceKey: 'chainDistance' }] }, BASE),
	13: Object.assign({ key: 'baldersVengeance', mode: 'simple', subs: [1, 2, 30], chains: CHAIN(13), chainOnSubs: [1, 2], fixedSpeed: true }, BASE),
	// not out of Time Bomb (6): the server runs the plain 150901/150902 there (vanilla sniff 2026-11-26: 3 of 3, plus 4 with the mod)
	15: Object.assign({ key: 'replenishment', mode: 'simple', subs: [1, 2, 30], chains: [{ from: chainFrom(15).filter(g => g !== 6), sub: 30, base: true }],
		chainOnSubs: [1, 2], fixedSpeed: true }, BASE),
	18: Object.assign({ key: 'dispenser', mode: 'simple', subs: [1, 2], fixedSpeed: true }, BASE),
	19: Object.assign({ key: 'sentryTower', mode: 'simple', subs: [1, 2, 30], chains: CHAIN(19), chainOnSubs: [1, 2] }, BASE),
	20: { key: 'retaliate', mode: 'passthrough' },

	40: Object.assign({ key: 'rollingReload', mode: 'custom', subs: [0], serverSubs: [30], fixedSpeed: true }, BASE)
};

const GLYPHS = {
	30004: { name: 'Bombardment cast speed', groups: [2], subs: [1], speed: 1.25 },
	// Slick Scattershot: less recoil, the server moves the character 64.8 instead of 108 back
	30007: { name: 'Slick Scattershot recoil', groups: [3], distance: 0.6, animSeq: [
		{ duration: 394, xyRate: 1, zRate: 1, distance: 0 }, { duration: 111, xyRate: 1, zRate: 1, distance: 0 }, { duration: 1333, xyRate: 1.8, zRate: 1, distance: 64.8 }] }
};

const ABN_BLAST_BUFF = 10152011;
const ABN_BLAST_READY = 10152010;
const ABN_PB_HIT2_WINDOW = 10152000;
const ABN_RELOAD_SECOND = 910152073;
const RELOAD_BUFF_MS = 4000;

const RELOAD_CANCELLERS = [3, 11, 1, 40, 4, 2];
// a request must not reach the server before its Rolling Reload ended (it would be refused)
const ROLL_END_MARGIN = 30;
const AB_PROJ_OFFSET = { forward: 14, side: 5, z: 30 };
const BURST_MIN = 80, BURST_MAX = 300, BURST_SERVER_MS = 121;

const LEGACY = {
	dirs: ['neuesGunnerSP'],
	config: {
	},
	skillData(o) {
		const g = (k) => o[k] || {};
		const stage = g('manaMissiles').stageDuration === 1210 ? 1200 : g('manaMissiles').stageDuration;
		return {
			blast: { duration: g('blast').duration },
			bombardment: { duration: g('bombardment').duration },
			scattershot: { duration: g('scattershot').duration, distance: g('scattershot').distance },
			pointBlank: { duration: g('pointBlank').duration, distance: g('pointBlank').distance },
			pointBlankHit2: { duration: g('pointBlank').hit2Duration, distance: g('pointBlank').hit2Distance },
			burstFire: { duration: g('burstFire').primeDuration },
			timeBomb: { duration: g('timeBomb').duration },
			arcaneBarrage: { duration: g('arcaneBarrage').duration },
			arcaneBarrageDetonate: { duration: g('arcaneBarrage').detonateDuration },
			manaMissiles: { chargeStages: Number.isFinite(stage) ? [stage] : undefined, releaseDuration: g('manaMissiles').shotDuration, distance: g('manaMissiles').shotDistance },
			arcBomb: { duration: g('arcBomb').duration },
			rocketJump: Object.assign({}, g('rocketJump')),
			baldersVengeance: { duration: g('baldersVengeance').duration, distance: g('baldersVengeance').distance },
			replenishment: { duration: g('replenishment').duration },
			dispenser: { duration: g('dispenser').duration, distance: g('dispenser').distance },
			sentryTower: { duration: g('sentryTower').duration },
			rollingReload: Object.assign({}, g('rollingReload'))
		};
	}
};

function setup(api) {
	const { groupOf, subOf, baseOf, getSkillId } = api;
	const at = (id, g, ...subs) => groupOf(id) === g && (subs.length === 0 || subs.includes(subOf(id)));
	const running = () => { const a = api.action(); return a && !a.finished ? a : null; };
	const runningIs = (g, ...subs) => { const a = running(); return Boolean(a && at(a.skillId, g, ...subs)); };

	let manaHeld = false;
	let stamina;
	let blastBuffShown = false;
	let blastReadyBuff = false;
	let lastTarget = 0n, lastTargetAt = 0;
	const knownSkills = new Set();

	function showBlastBuff() {
		if (!api.config.ABNORMALITY_TOGGLE) return;
		blastBuffShown = true;
		api.dispatch.toClient('S_ABNORMALITY_BEGIN', 3, { target: api.cid(), source: api.cid(), id: ABN_BLAST_BUFF, duration: 3100, unk: 0, stacks: 1 });
	}
	function hideBlastBuff() {
		if (!blastBuffShown) return;
		blastBuffShown = false;
		api.dispatch.toClient('S_ABNORMALITY_END', 1, { target: api.cid(), id: ABN_BLAST_BUFF });
	}

	// time per Burst Fire shot (!gunner burst); below ~121 ms the server refuses shots
	const burstDelay = () => {
		const v = Number(api.config.BURST_FIRE_DELAY);
		return Number.isFinite(v) ? Math.min(BURST_MAX, Math.max(BURST_MIN, Math.round(v))) : 130;
	};

	const isRocket = (id) => (knownSkills.size ? knownSkills.has(id) : Math.floor(id / 100) % 100 >= 50);
	(async function loadKnownSkills() {
		try {
			if (typeof api.dispatch.queryData !== 'function' || !api.model()) return;
			const nodes = await api.dispatch.queryData('/SkillData/Skill@templateId=?/', [api.model()], true, false, ['id']);
			for (const n of (nodes || [])) if (n.attributes && n.attributes.id) knownSkills.add(Number(n.attributes.id));
		} catch (e) {  }
	})();

	let lastReloadAt = 0, lastReloadId = 0, reloadBuffUntil = 0, reloadBuffSeenAt = 0, reloadEndsAt = 0, rollRanOutAt = 0;
	let reloadQueue = null, reloadQueueTimer = null;
	// a held request goes out with the position the character has when it is sent, not the one from the key press (pressed mid roll,
	// sent at the roll end = up to ~100 units behind the server position -> start position mismatch on the server):
	// previous animation over -> its end point, still running -> the newest client position report after the press, else the press position
	let lastNotify = null;
	function freshEvent(ev, pressedAt) {
		const e = api.copyEvent(ev);
		const a = api.action();
		if (!a || a.finished) { const l = api.currentLoc(e.loc); e.loc = { x: l.x, y: l.y, z: l.z }; }
		else if (lastNotify && lastNotify.at > pressedAt) e.loc = { x: lastNotify.loc.x, y: lastNotify.loc.y, z: lastNotify.loc.z };
		return e;
	}
	// An arrow chain (02 -> S_CONNECT_SKILL_ARROW -> client asks for +30) starts on the server ~2 RTT after our animation instead of 1 RTT,
	// so the next skill would reach the server too early (refused). The next skill is shown AND sent that much later, once: after it our
	// animation and the server are in step again. (Holding only the requests and measuring again at every skill made the hold grow with the
	// ping jitter - the RTT estimate is the minimum - and shifted Blast against Point Blank, which broke PB -> Blast -> PB.)
	let arrowChainReqAt = 0, lagAct = null, lagQueue = null, lagTimer = null;
	const ARROW_LAG_MIN = 20, ARROW_LAG_MAX = 250;
	function measureLag(a, serverId) {
		const extra = Date.now() - a.startedAt - api.estimateRtt();
		lagAct = extra > ARROW_LAG_MIN ? { a, serverId, extra: Math.min(ARROW_LAG_MAX, Math.round(extra)) } : null;
		if (lagAct) api.recordPacket('MOD', 'Server runs behind our animation (arrow chain)', { skill: api.skillLabel(a.skillId), extra: lagAct.extra });
	}
	function clearLag() { api.clearTimeout(lagTimer); lagQueue = null; lagAct = null; }
	// true: the request is taken over (shown + sent later)
	function delayAfterArrow(info, event) {
		const g = groupOf(info.sid);
		if (lagQueue) {
			if (g === lagQueue.chainGroup || g === 40) return false;
			lagQueue.name = info.name; lagQueue.version = info.version; lagQueue.event = api.copyEvent(event); lagQueue.at = Date.now();
			return true;
		}
		const a = api.action();
		if (!lagAct || a !== lagAct.a || g === groupOf(a.skillId) || g === 40) return false;
		const wait = lagAct.extra;
		lagAct = null;
		queueStart(info, event, wait, groupOf(a.skillId), 'Next skill after the arrow chain shown + sent later (server behind)');
		return true;
	}
	// the request a queueStart sent: the client asks for it again right when our previous animation ends (its own key press, queued
	// during that animation), 1 ms after we sent it. That copy reached the server and started the skill a second time - Burst Fire after
	// the Replenishment chain (115 client bug report 2026-11-26): the server ended its windup and started it again, our windup was ended
	// with it, the client fired at once and every shot was refused for ~870 ms (ghost shots).
	let queuedSent = null;
	const QUEUED_ECHO_MS = 100;
	// shown AND sent after wait ms; a newer request of another group replaces it meanwhile (spam), the timer stays
	function queueStart(info, event, wait, chainGroup, note) {
		lagQueue = { chainGroup, name: info.name, version: info.version, event: api.copyEvent(event), at: Date.now() };
		api.recordPacket('MOD', note, { skill: api.skillLabel(info.sid), ms: wait });
		api.clearTimeout(lagTimer);
		lagTimer = api.setTimeout(() => {
			const q = lagQueue;
			lagQueue = null;
			if (!q || !api.predicting()) return;
			const ev = freshEvent(q.event, q.at);
			api.startSkill(q.name, q.version, ev);
			queuedSent = { sid: getSkillId(ev.skill), name: q.name, at: Date.now() };
		}, wait);
	}
	// Blast during the Mana Missiles shot (96010/96011): the client allows it ~512 ms into its animation, the server refused it there and
	// took it from ~610 ms on (sniff logs: refused at 512, accepted at 609/611/677). Without the mod the client animation starts 1 RTT late,
	// which hides this; with the mod Blast reached the server too early (refused, retried ~165 ms later). Blast is shown + sent at that point.
	const MANA_SHOT_BLAST_FROM = 605;
	const NEXT_CAST_EARLY = 150;
	function delayBlastInManaShot(info, event) {
		if (groupOf(info.sid) !== 1 || info.name !== 'C_START_SKILL') return false;
		const a = api.action();
		if (!a || a.finished || !at(a.skillId, 9, 10, 11)) return false;
		const wait = Math.round(MANA_SHOT_BLAST_FROM / (a.speed || 1) - (Date.now() - a.startedAt));
		if (wait <= 0) return false;
		queueStart(info, event, wait, 9, 'Blast during the Mana Missiles shot shown + sent later (server allows it later than the client)');
		return true;
	}
	// 115 client log (gunner.log): Blast right after the Scattershot chain (36130) reached the server at ~1115 (attack speed 1.0) - the
	// point the client allows it - and the server took it there only half of the time (refused at 1096 / 1114 / 1114 / 1115, accepted at
	// 1115 / 1116): refused, retried ~155 ms later, our Blast shown 150 ms early. Now shown + sent so it arrives from 1130 on.
	const P115 = Boolean(api.dispatch && api.dispatch.isP115);
	// we show the chain (+30), but the server runs the plain skill of that group: nothing to wait for (bug report 2026-11-26: Time Bomb ->
	// Replenishment shown as the chain 150930, the server ran 150902 both times and took Burst Fire at once - held 263 ms for nothing,
	// Burst Fire no longer cancelled the Replenishment animation)
	const serverRunsPlain = (g) => { const sv = api.serverActive(); return Boolean(sv && groupOf(sv.id) === g && subOf(sv.id) !== 30); };
	const SCATTER_CHAIN_BLAST_FROM = 1130;
	function delayBlastAfterScatterChain(info, event) {
		if (!P115 || groupOf(info.sid) !== 1 || info.name !== 'C_START_SKILL') return false;
		const a = api.action();
		if (!a || a.finished || !at(a.skillId, 3, 30) || serverRunsPlain(3)) return false;
		const rtt = api.estimateRtt();
		const ack = api.serverSkillAckAt(a.skillId);
		const svAt = ack >= a.startedAt ? ack : a.startedAt + rtt;
		const wait = Math.round(svAt - rtt + SCATTER_CHAIN_BLAST_FROM / (a.speed || 1) - Date.now());
		if (wait <= 0) return false;
		queueStart(info, event, wait, 3, 'Blast after the Scattershot chain shown + sent later (server takes it later than the client)');
		return true;
	}
	// same log: a skill right after the Replenishment chain (150930, fixed speed) was refused at 687 / 697 ms and taken at 700 / 717
	// (twice shown ~150 ms early). Shown + sent so it arrives from 710 ms on.
	const REPLENISH_CHAIN_NEXT_FROM = 710;
	function delayAfterReplenishChain(info, event) {
		if (!P115 || groupOf(info.sid) === 15 || groupOf(info.sid) === 40 || !/^C_START_(SKILL|COMBO_INSTANT_SKILL)$/.test(info.name)) return false;
		const a = api.action();
		if (!a || a.finished || !at(a.skillId, 15, 30) || serverRunsPlain(15)) return false;
		const rtt = api.estimateRtt();
		const ack = api.serverSkillAckAt(a.skillId);
		const svAt = ack >= a.startedAt ? ack : a.startedAt + rtt;
		const wait = Math.round(svAt - rtt + REPLENISH_CHAIN_NEXT_FROM / (a.speed || 1) - Date.now());
		if (wait <= 0) return false;
		queueStart(info, event, wait, 15, 'Skill after the Replenishment chain shown + sent later (server takes it later than the client)');
		return true;
	}
	function rollRequestDelay(sid) {
		if (groupOf(sid) === 40 || !rollRanOutAt || rollRanOutAt < lastReloadAt) return 0;
		return Math.max(0, reloadEndsAt + ROLL_END_MARGIN - Date.now());
	}
	function clearReloadQueue() { api.clearTimeout(reloadQueueTimer); reloadQueue = null; }
	function holdUntilReloadEnds(name, version, event) {
		const wait = Math.max(0, reloadEndsAt + ROLL_END_MARGIN - Date.now());
		reloadQueue = { name, version, event: api.copyEvent(event), at: Date.now() };
		api.clearTimeout(reloadQueueTimer);
		reloadQueueTimer = api.setTimeout(() => {
			const q = reloadQueue;
			reloadQueue = null;
			if (!q || !api.predicting()) return;
			api.recordPacket('MOD->S', 'Held request sent (Rolling Reload ended)', { skill: api.skillLabel(getSkillId(q.event.skill)) });
			api.startSkill(q.name, q.version, freshEvent(q.event, q.at));
		}, wait);
		api.recordPacket('MOD', 'HELD until Rolling Reload ends', { skill: api.skillLabel(getSkillId(event.skill)), ms: wait });
	}
	// Blast 01, Time Bomb 01, Arc Bomb 01 and Arcane Barrage 01 cannot cancel the roll, their 02 versions can once the server opened the window (buff 10152010):
	// the client queues a press from early in the roll (or a held key) as 01 and sends 02 only after a refusal, so the mod sends 02 right away
	let sent02 = null;
	function send02(name, version, event) {
		const ev = api.withSkillId(event, baseOf(getSkillId(event.skill)) + 2);
		sent02 = { id: getSkillId(ev.skill), at: Date.now() };
		api.recordPacket('MOD', '01 during the roll sent as 02 (window open)', { skill: api.skillLabel(getSkillId(ev.skill)) });
		api.setTimeout(() => { if (api.predicting()) api.startSkill(name, version, ev); }, 0);
	}
	function sendSoon(name, version, ev, note) {
		api.recordPacket('MOD', note, { skill: api.skillLabel(getSkillId(ev.skill)) });
		api.setTimeout(() => { if (api.predicting()) api.startSkill(name, version, ev); }, 0);
	}
	// Point Blank during the roll: only hit 1 cancels it (as chain +30) and only once the window is open (buff 10152010).
	// While the hit 2 buff runs the client asks for hit 2, which the server ignores during the roll: the mod sends hit 1 instead.
	// The chain uses up the hit 2 buff on the server, so hit 2 after it goes to the server without prediction.
	let lastPbHit1Sub = 1, pbHit2Consumed = false;
	// Soaria
	function predictReload(event, info) {
		const sid = info.sid;
		const base = baseOf(sid);
		const now = Date.now();
		const buffPending = lastReloadAt > reloadBuffSeenAt && now - lastReloadAt < RELOAD_BUFF_MS;
		const second = lastReloadId === base && (now < reloadBuffUntil || buffPending);
		const d = api.skills.rollingReload;
		const target = second ? base + 30 : base;
		api.trackRequest(info.name, info.version, event, info.allowRetry);
		hideBlastBuff();
		const a = api.startAction(event, target, { duration: d.duration, distance: second ? d.chainDistance : d.distance, fixedSpeed: true, prevEndType: 4, requestId: sid,
			onEnd: () => { rollRanOutAt = Date.now(); } });
		rollRanOutAt = 0;
		api.applyLocks({ selfLock: api.GLOBAL_LOCK_DELAY }, sid, a);
		lastReloadAt = now;
		lastReloadId = target;
		reloadEndsAt = now + d.duration;
		manaHeld = false;
		return 'done';
	}

	// the client sends Bombardment itself right when its roll ran out, the server roll ends ~1 RTT later and refuses it (ghost cast,
	// spamming then cast it a second time): the request waits until the server roll ended, like requestDelay does for the others
	function predictBombChannel(event, info) {
		const wait = rollRequestDelay(info.sid);
		hideBlastBuff();
		api.startAction(event, info.sid, { duration: 600000, fixedSpeed: true, prevEndType: 4, requestId: info.sid });
		if (wait > 0) {
			const ev = api.copyEvent(event);
			api.holdRequest(info.name, info.version, ev, wait);
			api.setTimeout(() => { if (api.predicting()) api.trackRequest(info.name, info.version, ev, info.allowRetry); }, wait);
			return 'drop';
		}
		api.trackRequest(info.name, info.version, event, info.allowRetry);
		return 'done';
	}

	function predictBurstShot(event, info) {
		api.trackRequest(info.name, info.version, event, false);
		hideBlastBuff();
		api.startAction(event, info.sid, { duration: burstDelay(), fixedSpeed: true, prevEndType: 4, requestId: info.sid });
		return 'done';
	}

	function predictRocketVariant(event, info) {
		const d = api.skills.rocketJump;
		const sup = subOf(info.sid) === 31;
		api.trackRequest(info.name, info.version, event, info.allowRetry);
		hideBlastBuff();
		const a = api.startAction(event, info.sid, { duration: sup ? d.superDuration : d.duration, distance: sup ? d.superDistance : d.chainDistance, prevEndType: 4, requestId: info.sid });
		api.applyLocks({ selfLock: api.GLOBAL_LOCK_DELAY }, info.sid, a);
		return 'done';
	}

	let projectileIdBase = 0xFEFEFFEE;
	let realProjectileId = 0;
	let abProjectilePredicted = false;
	let storedProjectileHits = [];
	let pendingDetonation = null;
	// predicted ball id -> { real, endedAt, closed }: the client only knows the predicted id, the server only the real one
	const balls = new Map();
	const fakeOfReal = new Map();
	// the server removes a ball that reached its end shortly after the hit report: a later detonation is ignored by the server
	const DETONATE_AFTER_END_MS = 25;
	function spawnPredictedBall(event) {
		if (!api.config.AB_PROJ_SPOOF || !event || !event.dest) return;
		const power = subOf(getSkillId(event.skill)) > 30;
		projectileIdBase--;
		balls.set(projectileIdBase, { real: 0, endedAt: 0, closed: false });
		if (balls.size > 20) balls.delete(balls.keys().next().value);
		realProjectileId = 0;
		abProjectilePredicted = true;
		pendingDetonation = null;
		storedProjectileHits = [];
		const w = Number(event.w), O = AB_PROJ_OFFSET;

		api.dispatch.toClient('S_START_USER_PROJECTILE', 9, {
			gameId: api.cid(), templateId: api.model(), unk1: 0, id: projectileIdBase,
			skill: { reserved: 0, npc: false, type: 0, huntingZoneId: 0, id: baseOf(getSkillId(event.skill)) + (power ? 50 : 20) },
			loc: { x: event.loc.x + O.forward * Math.cos(w) - O.side * Math.sin(w), y: event.loc.y + O.forward * Math.sin(w) + O.side * Math.cos(w), z: event.loc.z + O.z },
			dest: { x: event.dest.x, y: event.dest.y, z: event.dest.z },
			speed: power ? 390 : 300, distance: 550, curve: false
		});
	}
	function endPredictedBall() {
		const b = balls.get(projectileIdBase);
		if (b) b.closed = true;
		abProjectilePredicted = false;
		storedProjectileHits = [];
		pendingDetonation = null;
		api.dispatch.toClient('S_END_USER_PROJECTILE', 4, { id: projectileIdBase, unk1: false, unk2: false, target: 0 });
	}
	api.tryHook('C_HIT_USER_PROJECTILE', 4, (event) => {
		if (!api.predicting() || !api.config.AB_PROJ_SPOOF) return;
		const ball = balls.get(Number(event.id));
		if (!ball) return;

		if (Array.isArray(event.targets)) {
			event.targets = event.targets.filter(t => t.gameId !== api.cid());
			if (!event.targets.length && !event.end) return false;
		}
		if (event.end) ball.endedAt = Date.now();
		if (ball.real) { event.id = ball.real; return true; }
		if (Number(event.id) === projectileIdBase) storedProjectileHits.push(event);
		return false;
	});
	api.tryHook('S_START_USER_PROJECTILE', 9, (event) => {
		if (!api.predicting() || !api.config.AB_PROJ_SPOOF || event.gameId !== api.cid()) return;
		const pid = getSkillId(event.skill);
		if (groupOf(pid) !== 7 || !(subOf(pid) === 20 || subOf(pid) === 50) || !abProjectilePredicted) return;
		abProjectilePredicted = false;
		realProjectileId = event.id;
		const b = balls.get(projectileIdBase);
		if (b) b.real = event.id;
		fakeOfReal.set(String(event.id), projectileIdBase);
		if (fakeOfReal.size > 20) fakeOfReal.delete(fakeOfReal.keys().next().value);
		for (const hit of storedProjectileHits) { hit.id = realProjectileId; api.dispatch.toServer('C_HIT_USER_PROJECTILE', 4, hit); }
		storedProjectileHits = [];
		if (pendingDetonation) {
			const p = pendingDetonation;
			pendingDetonation = null;
			p.projectile = realProjectileId;
			api.dispatch.toServer('C_START_INSTANCE_SKILL_EX', 5, p);
			api.trackRequest('C_START_INSTANCE_SKILL_EX', 5, p, true);
		}
		return false;
	});

	// the server ended the real ball: end the predicted one for the client too, else the client keeps it and detonates it later (ghost)
	api.tryHook('S_END_USER_PROJECTILE', 4, (event) => {
		if (!api.predicting() || !api.config.AB_PROJ_SPOOF) return;
		const fake = fakeOfReal.get(String(event.id));
		if (fake === undefined) return;
		fakeOfReal.delete(String(event.id));
		const b = balls.get(fake);
		balls.delete(fake);
		if (b && b.closed) return false;
		event.id = fake;
		return true;
	});

	api.tryHook('C_START_INSTANCE_SKILL_EX', 5, (event) => {
		if (!api.predicting()) return;
		const pid = Number(event.projectile);
		const ball = api.config.AB_PROJ_SPOOF ? balls.get(pid) : undefined;
		if (api.inReaction()) {
			if (ball) {
				if (!ball.real) return false;
				event.projectile = ball.real;
				return true;
			}
			return;
		}
		const sid = getSkillId(event.skill);
		if (!at(sid, 7, 3, 4, 33) || api.isLocked(sid)) return;
		if (ball && (ball.closed || (ball.endedAt && Date.now() - ball.endedAt > DETONATE_AFTER_END_MS))) {
			api.recordPacket('MOD', 'Detonation not predicted (the ball already ended)', { skill: api.skillLabel(sid) });
			api.markUnpredicted(sid, true);
			if (!ball.real) return false;
			event.projectile = ball.real;
			return true;
		}
		api.lock(sid, api.GLOBAL_LOCK_DELAY);
		hideBlastBuff();
		api.startAction(event, sid, { duration: api.skills.arcaneBarrageDetonate.duration, prevEndType: 4, requestId: sid });
		api.setLastSkill(sid, event);
		if (!ball) { api.trackRequest('C_START_INSTANCE_SKILL_EX', 5, event, true); return; }
		ball.closed = true;
		api.dispatch.toClient('S_END_USER_PROJECTILE', 4, { id: pid, unk1: false, unk2: false, target: 0 });
		if (ball.real) {
			event.projectile = ball.real;
			api.trackRequest('C_START_INSTANCE_SKILL_EX', 5, event, true);
			return true;
		}
		if (pid !== projectileIdBase) return false;
		pendingDetonation = api.copyEvent(event);
		return false;
	});

	function burstCommand(arg) {
		let value = burstDelay();
		if (arg === '+' || arg === '-') value += arg === '+' ? 5 : -5;
		else if (arg !== undefined && /^\d+$/.test(arg)) value = parseInt(arg, 10);
		else if (arg !== undefined) return api.sendChat('Usage: <font color="#FFD700">!gunner burst</font> (show) | <font color="#FFD700">!gunner burst 125</font> (set ms) | <font color="#FFD700">!gunner burst +</font> / <font color="#FFD700">-</font> (5 ms faster/slower)');
		if (arg !== undefined) { api.config.BURST_FIRE_DELAY = Math.min(BURST_MAX, Math.max(BURST_MIN, value)); api.saveConfig(); }
		const v = burstDelay();
		const note = v < BURST_SERVER_MS ? ' <font color="#FF5555">- faster than the server (~121 ms): some shots will be refused and do no damage</font>' : '';
		api.sendChat(`Burst Fire: <font color="#FFD700">${v} ms</font> per shot (about ${(1000 / v).toFixed(1)} shots/s on your screen)${note}`);
	}

	api.hook('S_ABNORMALITY_BEGIN', 3, { order: -10 }, (event) => {
		if (!api.enabled() || event.target !== api.cid()) return;
		const id = Number(event.id);
		if (id === ABN_RELOAD_SECOND) {
			reloadBuffSeenAt = Date.now();
			reloadBuffUntil = reloadBuffSeenAt + Number(event.duration) - api.estimateRtt();
		}
		if (id === ABN_BLAST_READY) {
			blastReadyBuff = true;
			const q = reloadQueue;
			const a = running();
			if (q && api.predicting() && a && groupOf(a.skillId) === 40 && (at(getSkillId(q.event.skill), 7, 1) || at(getSkillId(q.event.skill), 1, 1) || at(getSkillId(q.event.skill), 6, 1, 2) || at(getSkillId(q.event.skill), 10, 1, 2))) {
				clearReloadQueue();
				send02(q.name, q.version, freshEvent(q.event, q.at));
			} else if (q && api.predicting() && a && groupOf(a.skillId) === 40 && at(getSkillId(q.event.skill), 4)) {
				clearReloadQueue();
				pbHit2Consumed = true;
				sendSoon(q.name, q.version, freshEvent(q.event, q.at), 'Point Blank held in the roll sent (window open)');
			}
		}
		if (api.predicting() && id === ABN_BLAST_BUFF && api.config.ABNORMALITY_TOGGLE) return false;
	});
	api.hook('S_ABNORMALITY_END', 1, { order: -10 }, (event) => {
		if (!api.enabled() || event.target !== api.cid()) return;
		const id = Number(event.id);
		if (id === ABN_RELOAD_SECOND) reloadBuffUntil = 0;
		if (id === ABN_BLAST_READY) blastReadyBuff = false;
		if (api.predicting() && id === ABN_BLAST_BUFF && api.config.ABNORMALITY_TOGGLE) return false;
	});
	// a new or ended hit 2 buff: hit 2 is predicted normally again
	for (const [name, ver] of [['S_ABNORMALITY_BEGIN', 3], ['S_ABNORMALITY_END', 1]]) {
		api.hook(name, ver, { order: -9 }, (event) => {
			if (event.target === api.cid() && Number(event.id) === ABN_PB_HIT2_WINDOW) pbHit2Consumed = false;
		});
	}
	api.tryHook('S_PLAYER_CHANGE_STAMINA', 1, (event) => { if (api.enabled()) stamina = event.current; });

	api.tryHook('C_NOTIMELINE_SKILL', 3, (event) => {
		if (!api.predicting()) return;
		const sid = getSkillId(event.skill);
		const a = running();
		if (a && groupOf(a.skillId) !== 22) api.finishPrevious(sid, 4, event.loc);
		api.setLastSkill(sid, event);
		manaHeld = false;
	});

	api.hook('C_CANCEL_SKILL', 3, { order: -10 }, (event) => {
		if (!api.predicting() || event.type !== 1 || !at(getSkillId(event.skill), 2)) return;
		if (runningIs(2, 0)) api.finishPrevious(0, 1, api.realLoc() || undefined);
	});
	api.hook('C_START_SKILL', 7, { order: -20 }, (event) => {
		if (typeof event.target === 'bigint' && event.target !== 0n) { lastTarget = event.target; lastTargetAt = Date.now(); }
		const sid = getSkillId(event.skill);
	});

	return {
		resolveId(sid, offset) {
			if (offset === 0 && at(sid, 4, 3)) return sid + 1;
			return sid + offset;
		},

		start(event, info) {
			const sid = info.sid;
			const g = groupOf(sid);
			const sub = subOf(sid);
			const a = running();
			const runningG = a ? groupOf(a.skillId) : -1;
			if (g === 11 && !isRocket(sid)) return 'pass';
			if (!info.fam) return undefined;
			if (queuedSent && queuedSent.sid === sid && queuedSent.name === info.name && Date.now() - queuedSent.at < QUEUED_ECHO_MS && a && (a.requestId || a.skillId) === sid) {
				api.recordPacket('MOD', 'Client request dropped (copy of the request the mod just sent for it)', { skill: api.skillLabel(sid) });
				return 'drop';
			}
			if (delayAfterArrow(info, event)) return 'drop';
			if (delayBlastInManaShot(info, event)) return 'drop';
			if (delayBlastAfterScatterChain(info, event)) return 'drop';
			if (delayAfterReplenishChain(info, event)) return 'drop';

			if (a && runningG === g && [1, 3, 15].includes(g)) {
				// the same skill again right before our animation ends is the next cast, not spam: the client times it from its own request,
				// which is earlier than our animation when that was shown later (arrow chain / Mana shot) - shown + sent when it ends
				const left = (a.endAt || 0) - Date.now();
				if (info.name === 'C_START_SKILL' && left > 0 && left <= NEXT_CAST_EARLY) {
					queueStart(info, event, left + 1, g, 'Same skill right before the end: shown + sent when it ends');
				}
				return 'drop';
			}
			if (a && runningG === 7 && g === 7 && sub <= 2 && subOf(a.skillId) <= 2) return 'drop';

			// the client's own 02 after the mod already sent 02 for its 01 (Time Bomb / Arc Bomb in the roll): one is enough
			if (a && (g === 6 || g === 10) && runningG === g && sent02 && sent02.id === sid && Date.now() - sent02.at < 600) return 'drop';
			if (a && runningG === g && [6, 10, 11, 13, 18, 19].includes(g) && sub !== 30 && sub !== 31) return 'pass';
			if ([1, 3, 11].includes(g) && manaHeld) return 'drop';

			// chain request of the client after S_CONNECT_SKILL_ARROW (e.g. Arc Bomb 106130 after 106102): sent unchanged, but the last skill
			// stays the 01/02 request of the running animation, so a chain out of it is still recognized (Scattershot 36130 after Arc Bomb)
			if (sub === 30 && a && runningG === g && g !== 11) {
				api.holdRetries(g);
				arrowChainReqAt = Date.now();
				api.dispatch.toServer(info.name, info.version, event);
				return 'drop';
			}
			if (sub === 30 && a && runningG === g) { api.holdRetries(g); return 'pass'; }

			if (g === 4 && sub <= 2 && a && runningG === 4) return 'pass';

			// Time Bomb and Arc Bomb work like Blast: 01 is refused during the roll, 02 cancels it once the window is open
			// (Arc Bomb 02 in the window: the server answers with S_CONNECT_SKILL_ARROW and runs the chain 106130)
			if ((g === 1 || g === 6 || g === 10) && sub === 1 && a && runningG === 40) {
				if (info.name !== 'C_START_SKILL' || reloadEndsAt <= Date.now()) return 'pass';
				if (!blastReadyBuff) { holdUntilReloadEnds(info.name, info.version, event); return 'drop'; }
				clearReloadQueue();
				send02(info.name, info.version, event);
				return 'drop';
			}
			// Arcane Barrage 02 cancels the roll once the server opened the window (buff 10152010), Barrage 01 is refused
			if (g === 4 && (sub === 1 || sub === 2)) lastPbHit1Sub = sub;
			if (g === 4 && sub === 3 && pbHit2Consumed) return 'pass';
			if (g === 4 && sub <= 3 && a && runningG === 40 && info.name === 'C_START_SKILL' && reloadEndsAt > Date.now()) {
				const ev = sub === 3 ? api.withSkillId(event, baseOf(sid) + lastPbHit1Sub) : event;
				if (!blastReadyBuff) { holdUntilReloadEnds(info.name, info.version, ev); return 'drop'; }
				pbHit2Consumed = true;
				if (sub === 3) { clearReloadQueue(); sendSoon(info.name, info.version, ev, 'Point Blank hit 2 during the roll sent as hit 1 (chain)'); return 'drop'; }
			}
			const barrageCancel = (g === 7 || g === 6 || g === 10) && sub === 2 && blastReadyBuff;
			if (g === 7 && sub === 1 && a && runningG === 40 && info.name === 'C_START_SKILL' && blastReadyBuff) {
				clearReloadQueue();
				send02(info.name, info.version, event);
				return 'drop';
			}
			if (a && runningG === 40 && info.name === 'C_START_SKILL' && !RELOAD_CANCELLERS.includes(g) && !barrageCancel && reloadEndsAt > Date.now()) {
				holdUntilReloadEnds(info.name, info.version, event);
				return 'drop';
			}
			if (api.isLocked(sid)) return undefined;
			if (g === 5 && stamina !== undefined && stamina <= 69) return 'drop';
			if (g === 40) return predictReload(event, info);
			if (g === 2 && sub === 0) return predictBombChannel(event, info);
			if (g === 5 && sub === 1) return predictBurstShot(event, info);
			if (g === 11 && (sub === 30 || sub === 31)) return predictRocketVariant(event, info);
			return undefined;
		},

		predicted(sid, a) {
			const g = groupOf(sid);
			if (reloadQueue && g !== 40) clearReloadQueue();
			if (g === 1) showBlastBuff(); else hideBlastBuff();
			if (g === 7 && [1, 2, 31, 32].includes(subOf(sid))) spawnPredictedBall(api.lastEvent());
		},
		rejected(a) {
			if (groupOf(a.skillId) === 7 && abProjectilePredicted) endPredictedBall();
			if (groupOf(a.skillId) === 1) hideBlastBuff();
		},

		press(event, info) {
			const sid = info.sid;
			if (!at(sid, 9, 0)) return undefined;
			if (event.press && runningIs(1)) return 'drop';
			manaHeld = Boolean(event.press);
			if (event.press) hideBlastBuff();
			return undefined;
		},

		// the predicted roll ran out: the next skill shows at once, its request waits until the server roll ended
		requestDelay: rollRequestDelay,

		serverStage(event, sid) {
			if (event.stage === 0) {
				const a = api.action();
				if (subOf(sid) === 30 && a && a.skillId === sid && arrowChainReqAt >= a.startedAt) measureLag(a, event.id);
				else if (lagAct && event.id !== lagAct.serverId) lagAct = null;
			}
			if (groupOf(sid) === 40 && event.stage === 0) {
				lastReloadId = sid;
				// the server started the roll late: its end moves later too
				const end = Date.now() - api.estimateRtt() + api.skills.rollingReload.duration;
				if (end > reloadEndsAt) reloadEndsAt = end;
			}
			return undefined;
		},

		notify(copy) { lastNotify = { loc: copy.loc, at: Date.now() }; },

		serverEnd(event) {
			if (lagAct && event.id === lagAct.serverId) lagAct = null;
			return undefined;
		},

		command(sub, args) {
			if (sub === 'burst') { burstCommand(args[1]); return true; }
			return false;
		},
		help() {
			return [['burst [ms]', `Burst Fire ${burstDelay()} ms per shot`]];
		},
		learnTarget(id) {
			if (at(id, 5, 1)) return null;
			if (at(id, 2, 0)) return null;
			if (at(id, 40)) return { key: 'rollingReload', prop: 'duration' };
			return undefined;
		},
		reset() {
			hideBlastBuff();
			clearReloadQueue();
			blastReadyBuff = false;
			pbHit2Consumed = false;
			clearLag();
			manaHeld = false;
			lastTarget = 0n;
			storedProjectileHits = [];
			pendingDetonation = null;
			balls.clear();
			fakeOfReal.clear();
		},
		destroy() { hideBlastBuff(); },
		bugState() {
			return `mana=${manaHeld ? 'held' : '-'} stamina=${stamina} blastBuff=${blastBuffShown ? 1 : 0} ball=${abProjectilePredicted ? 'predicted' : realProjectileId || '-'} reload=${lastReloadId}${reloadQueue ? '(held req)' : ''}`;
		}
	};
}

module.exports = {
	NAME: 'Gunner-SP',
	CMD: 'gunner',
	CLASS_LABEL: 'Gunner',
	JOB: 9,
	AUTHORS: 'Soaria',

	OMNI: {
		'4:1': { dir: 'north' },
		'4:3': { dir: 'south' }
	},
	COLOR: '#56B4E9',
	DATA_DIR: 'gunner',
	ASPD_BASE: 100,
	GLOBAL_LOCK_DELAY: 300,
	RETRY_DELAYS: 'confirm',
	PREV_END_TYPE: 4,
	NOTIFY_REPEATS: [100],
	END_DESYNC_FIX: true,
	DESYNC_Z_LIMIT: 50,
	DEFAULT_SKILLS,
	FAMILIES,
	GLYPHS,
	LEGACY,

	MEASURED_UPDATES: [
		{ key: 'burstFire', prop: 'duration', old: [1035], value: 1065 },
		{ key: 'bombardment', prop: 'duration', old: [3280], value: 2970 },
		{ key: 'pointBlankHit2', prop: 'distance', old: [-180], value: -199 },
		{ key: 'pointBlankHit2', prop: 'duration', old: [1200], value: 1180 },
		{ key: 'rocketJump', prop: 'distance', old: [360], value: 415 },
		{ key: 'rocketJump', prop: 'superDistance', old: [496], value: 506 },
		{ key: 'rocketJump', prop: 'superDuration', old: [1695], value: 1690 },

		{ key: 'sentryTower', prop: 'duration', old: [1460], value: 1305 },
		{ key: 'replenishment', prop: 'duration', old: [1320], value: 1305 },
		{ key: 'rollingReload', prop: 'distance', old: [170], value: 164 }
	],
	EXTRA_CONFIG: {
		SPOOF_GRANT: true,
		SPOOF_GRANT_DESCRIPTION: 'When you let go of Mana Missiles, the shot starts right away instead of waiting for the server to allow it (one ping). May desync with high jitter (!gunner grant)',
		DISABLE_CHARGE: false,
		DISABLE_CHARGE_DESCRIPTION: 'Disables the charge display of Mana Missiles (for unstable connections; released early it is not ping taxed anyway) (!gunner charge)',
		ABNORMALITY_TOGGLE: true,
		ABNORMALITY_TOGGLE_DESCRIPTION: 'Shows the Blast buff instantly, so Blast can be cancelled into other skills without waiting for the server (!gunner buffs)',
		AB_PROJ_SPOOF: true,
		AB_PROJ_SPOOF_DESCRIPTION: 'Shows the Arcane Barrage ball right away (its hits and the detonation are sent for the real ball) (!gunner abproj)',
		BURST_FIRE_DELAY: 130,
		BURST_FIRE_DELAY_DESCRIPTION: 'Time per Burst Fire shot in ms. The server needs about 121 ms per shot: lower values fire faster on your screen, but the server refuses shots that come too early (they do no damage). Change in game with !gunner burst <ms>, !gunner burst + / -',
	},
	COMMANDS: {
		grant: { key: 'SPOOF_GRANT', label: 'No ping delay on Mana Missiles release' },
		charge: { key: 'DISABLE_CHARGE', label: 'Mana Missiles charge display', invert: true },
		buffs: { key: 'ABNORMALITY_TOGGLE', label: 'Instant Blast buff' },
		abproj: { key: 'AB_PROJ_SPOOF', label: 'Arcane Barrage ball shown right away' }
	},

	setup
};
// Abdull
