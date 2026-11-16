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
	15: Object.assign({ key: 'replenishment', mode: 'simple', subs: [1, 2, 30], chains: CHAIN(15), chainOnSubs: [1, 2], fixedSpeed: true }, BASE),
	18: Object.assign({ key: 'dispenser', mode: 'simple', subs: [1, 2], fixedSpeed: true }, BASE),
	19: Object.assign({ key: 'sentryTower', mode: 'simple', subs: [1, 2, 30], chains: CHAIN(19), chainOnSubs: [1, 2] }, BASE),
	20: { key: 'retaliate', mode: 'passthrough' },

	40: Object.assign({ key: 'rollingReload', mode: 'custom', subs: [0], serverSubs: [30], fixedSpeed: true }, BASE)
};

const GLYPHS = {
	30004: { name: 'Bombardment cast speed', groups: [2], subs: [1], speed: 1.25 }
};

const ABN_BLAST_BUFF = 10152011;
const ABN_BLAST_READY = 10152010;
const ABN_RELOAD_SECOND = 910152073;
const RELOAD_BUFF_MS = 4000;

const RELOAD_CANCELLERS = [3, 11, 1, 40, 4, 2];
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

	let lastReloadAt = 0, lastReloadId = 0, reloadBuffUntil = 0, reloadBuffSeenAt = 0, reloadEndsAt = 0;
	let reloadQueue = null, reloadQueueTimer = null;
	function clearReloadQueue() { api.clearTimeout(reloadQueueTimer); reloadQueue = null; }
	function holdUntilReloadEnds(name, version, event) {
		const wait = Math.max(0, reloadEndsAt - Date.now());
		reloadQueue = { name, version, event: api.copyEvent(event) };
		api.clearTimeout(reloadQueueTimer);
		reloadQueueTimer = api.setTimeout(() => {
			const q = reloadQueue;
			reloadQueue = null;
			if (!q || !api.predicting()) return;
			api.recordPacket('MOD->S', 'Held request sent (Rolling Reload ended)', { skill: api.skillLabel(getSkillId(q.event.skill)) });
			api.startSkill(q.name, q.version, q.event);
		}, wait);
		api.recordPacket('MOD', 'HELD until Rolling Reload ends', { skill: api.skillLabel(getSkillId(event.skill)), ms: wait });
	}
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
		const a = api.startAction(event, target, { duration: d.duration, distance: second ? d.chainDistance : d.distance, fixedSpeed: true, prevEndType: 4, requestId: sid });
		api.applyLocks({ selfLock: api.GLOBAL_LOCK_DELAY }, sid, a);
		lastReloadAt = now;
		lastReloadId = target;
		reloadEndsAt = now + d.duration;
		manaHeld = false;
		return 'done';
	}

	function predictBombChannel(event, info) {
		api.trackRequest(info.name, info.version, event, info.allowRetry);
		hideBlastBuff();
		api.startAction(event, info.sid, { duration: 600000, fixedSpeed: true, prevEndType: 4, requestId: info.sid });
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
	function spawnPredictedBall(event) {
		if (!api.config.AB_PROJ_SPOOF || !event || !event.dest) return;
		const power = subOf(getSkillId(event.skill)) > 30;
		projectileIdBase--;
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
		abProjectilePredicted = false;
		storedProjectileHits = [];
		pendingDetonation = null;
		api.dispatch.toClient('S_END_USER_PROJECTILE', 4, { id: projectileIdBase, unk1: false, unk2: false, target: 0 });
	}
	api.tryHook('C_HIT_USER_PROJECTILE', 4, (event) => {
		if (!api.predicting() || !api.config.AB_PROJ_SPOOF || Number(event.id) !== projectileIdBase) return;

		if (Array.isArray(event.targets)) {
			event.targets = event.targets.filter(t => t.gameId !== api.cid());
			if (!event.targets.length && !event.end) return false;
		}
		if (realProjectileId !== 0) { event.id = realProjectileId; return true; }
		storedProjectileHits.push(event);
		return false;
	});
	api.tryHook('S_START_USER_PROJECTILE', 9, (event) => {
		if (!api.predicting() || !api.config.AB_PROJ_SPOOF || event.gameId !== api.cid()) return;
		const pid = getSkillId(event.skill);
		if (groupOf(pid) !== 7 || !(subOf(pid) === 20 || subOf(pid) === 50) || !abProjectilePredicted) return;
		abProjectilePredicted = false;
		realProjectileId = event.id;
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

	api.tryHook('C_START_INSTANCE_SKILL_EX', 5, (event) => {
		if (!api.predicting()) return;
		if (api.inReaction()) {
			if (api.config.AB_PROJ_SPOOF && Number(event.projectile) === projectileIdBase) {
				if (realProjectileId === 0) return false;
				event.projectile = realProjectileId;
				return true;
			}
			return;
		}
		const sid = getSkillId(event.skill);
		if (!at(sid, 7, 3, 4, 33) || api.isLocked(sid)) return;
		api.lock(sid, api.GLOBAL_LOCK_DELAY);
		hideBlastBuff();
		api.startAction(event, sid, { duration: api.skills.arcaneBarrageDetonate.duration, prevEndType: 4, requestId: sid });
		api.setLastSkill(sid, event);
		const spoofed = api.config.AB_PROJ_SPOOF && Number(event.projectile) === projectileIdBase;
		if (spoofed) api.dispatch.toClient('S_END_USER_PROJECTILE', 4, { id: projectileIdBase, unk1: false, unk2: false, target: 0 });
		if (!spoofed) { api.trackRequest('C_START_INSTANCE_SKILL_EX', 5, event, true); return; }
		if (realProjectileId !== 0) {
			event.projectile = realProjectileId;
			api.trackRequest('C_START_INSTANCE_SKILL_EX', 5, event, true);
			return true;
		}
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
		if (id === ABN_BLAST_READY) blastReadyBuff = true;
		if (api.predicting() && id === ABN_BLAST_BUFF && api.config.ABNORMALITY_TOGGLE) return false;
	});
	api.hook('S_ABNORMALITY_END', 1, { order: -10 }, (event) => {
		if (!api.enabled() || event.target !== api.cid()) return;
		const id = Number(event.id);
		if (id === ABN_RELOAD_SECOND) reloadBuffUntil = 0;
		if (id === ABN_BLAST_READY) blastReadyBuff = false;
		if (api.predicting() && id === ABN_BLAST_BUFF && api.config.ABNORMALITY_TOGGLE) return false;
	});
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

			if (a && runningG === g && [1, 3, 15].includes(g)) return 'drop';
			if (a && runningG === 7 && g === 7 && sub <= 2 && subOf(a.skillId) <= 2) return 'drop';

			if (a && runningG === g && [6, 10, 11, 13, 18, 19].includes(g) && sub !== 30 && sub !== 31) return 'pass';
			if ([1, 3, 11].includes(g) && manaHeld) return 'drop';

			if (sub === 30 && a && runningG === g) { api.holdRetries(g); return 'pass'; }

			if (g === 4 && sub <= 2 && a && runningG === 4) return 'pass';

			if (g === 1 && sub === 1 && a && runningG === 40) return 'pass';
			if (a && runningG === 40 && info.name === 'C_START_SKILL' && !RELOAD_CANCELLERS.includes(g) && reloadEndsAt > Date.now()) {
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

		serverStage(event, sid) {
			if (groupOf(sid) === 40 && event.stage === 0) lastReloadId = sid;
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
			manaHeld = false;
			lastTarget = 0n;
			storedProjectileHits = [];
			pendingDetonation = null;
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
