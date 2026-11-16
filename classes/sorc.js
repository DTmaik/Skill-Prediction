'use strict';
// Abdull

const DEFAULT_SKILLS = {
	fireball: { name: 'Fireball', duration: 719 },
	iceNeedle: { name: 'Ice Needle', duration: 903 },
	lightningTrap: { name: 'Lightning Trap', duration: 1983 },
	arcanePulse: { name: 'Arcane Pulse', chargeStages: [1000, 990, 1000], releaseDuration: 982 },
	manaInfusion: { name: 'Mana Infusion', duration: 4590 },
	fireblast: { name: 'Fireblast', duration: 4825 },
	backstep: { name: 'Backstep', duration: 680, distance: -200 },
	flamePillar: { name: 'Flame Pillar', duration: 1190 },
	overchannel: { name: 'Overchannel', duration: 625 },
	manaBarrier: { name: 'Mana Barrier', duration: 608 },
	magmaBomb: { name: 'Magma Bomb', duration: 925 },
	voidPulse: { name: 'Void Pulse', duration: 930 },
	mindblast: { name: 'Mindblast', duration: 3505 },
	retaliate: { name: 'Retaliate' },
	painblast: { name: 'Painblast', duration: 1600 },
	painfulTrap: { name: 'Painful Trap', duration: 1700 },
	glacialRetreat: { name: 'Glacial Retreat', duration: 1315, distance: -188 },
	manaSiphon: { name: 'Mana Siphon', chargeStages: [988, 998], releaseDuration: 905 },

	flamingBarrage: { name: 'Flaming Barrage', duration: 1480 },
	nerveExhaust: { name: 'Nerve Exhaust', stages: [285, 1201] },
	burningBreath: { name: 'Burning Breath', stages: [287, 1219] },
	manaVolley: { name: 'Mana Volley', stages: [294, 908] },
	burstOfCelerity: { name: 'Burst of Celerity', stages: [298, 400] },
	timeGyre: { name: 'Time Gyre', duration: 677 },

	teleportJaunt: { name: 'Teleport Jaunt', stages: [206, 274], moveDelay: 15 },
	hailstorm: { name: 'Hailstorm', duration: 928 },
	stoneSkin: { name: 'Stone Skin', duration: 312 },
	stoneSkinCancel: { name: 'Stone Skin (cancel)', duration: 344 },

	manaBurst: { name: 'Mana Burst', duration: 3594 },
	distortionField: { name: 'Distortion Field', duration: 489 }
};

const IFRAMES = [7, 18, 26, 14, '28:50', 31];
const TRAP = { cancelOnlyBy: [7, 18, 26, 14, 28, 31], selfLock: 'duration' };
const LOCK_FIREBLAST = { skill: '6:0', ms: 'duration' };
const RELEASE_LOCKS = (subs) => Object.fromEntries(subs.map(s => [s, { selfLock: 250, locks: [LOCK_FIREBLAST] }]));
const CHARGE = {
	mode: 'charge', subs: [0], releaseNoEnd: true, waitServerStage: true,
	pressRetry: [50, 100, 150, 200, 300, 400], releaseRetry: [40, 80, 120, 160], retry: false, selfLock: 0
};

const FAMILIES = {
	1: { key: 'fireball', mode: 'simple', selfLock: 'duration' },
	2: { key: 'iceNeedle', mode: 'simple', selfLock: 'duration' },
	3: Object.assign({ key: 'lightningTrap', mode: 'simple' }, TRAP),

	4: Object.assign({ key: 'arcanePulse', releaseSubs: [10, 11, 12, 13], bySub: RELEASE_LOCKS([10, 11, 12, 13]) }, CHARGE),
	5: { key: 'manaInfusion', mode: 'simple' },
	6: { key: 'fireblast', mode: 'simple', selfLock: 500 },
	7: { key: 'backstep', mode: 'simple', unlocks: ['1:0', '8:0'] },
	8: { key: 'flamePillar', mode: 'simple', selfLock: 'duration' },
	9: { key: 'overchannel', mode: 'simple', selfLock: 1500 },
	10: { key: 'manaBarrier', mode: 'simple', selfLock: 'duration' },
	11: { key: 'magmaBomb', mode: 'simple', selfLock: 'duration' },
	12: { key: 'voidPulse', mode: 'simple', selfLock: 'duration' },
	13: { key: 'mindblast', mode: 'simple' },
	14: { key: 'retaliate', mode: 'passthrough' },
	16: { key: 'painblast', mode: 'simple', selfLock: 'duration' },
	17: Object.assign({ key: 'painfulTrap', mode: 'simple' }, TRAP),
	18: { key: 'glacialRetreat', mode: 'simple', unlocks: ['1:0', '8:0'] },

	19: Object.assign({}, CHARGE, { key: 'manaSiphon', releaseSubs: [10, 11, 12], releaseNoEnd: false, bySub: RELEASE_LOCKS([10, 11, 12]) }),
	20: { key: 'flamingBarrage', mode: 'lockon', castSub: 10 },
	21: { key: 'nerveExhaust', mode: 'lockon', castSub: 10, fixedSpeed: true },
	22: { key: 'burningBreath', mode: 'lockon', castSub: 10, fixedSpeed: true, moving: true },
	23: { key: 'manaVolley', mode: 'lockon', castSub: 10, fixedSpeed: true },
	24: { key: 'burstOfCelerity', mode: 'stages', fixedSpeed: true, selfLock: 2000 },
	25: { key: 'timeGyre', mode: 'lockon', castSub: 10, fixedSpeed: true },
	26: { key: 'teleportJaunt', mode: 'jaunt' },
	27: { key: 'hailstorm', mode: 'simple', selfLock: 'duration' },

	28: { key: 'stoneSkin', keys: { 50: 'stoneSkinCancel' }, mode: 'simple', subs: [0, 50], bySub: { 0: { endType: 9, selfLock: 'duration' } } },
	30: { key: 'manaBurst', mode: 'simple', selfLock: 'duration' },
	31: { key: 'distortionField', mode: 'simple', unlocks: ['1:0', '8:0'] }
};

const GLYPHS = {
	25069: { name: 'Fireblast speed', exclusive: 'fireblast', groups: [6], speed: 1.25 },
	25003: { name: 'Fireblast speed', exclusive: 'fireblast', groups: [6], speed: 1.17 },
	25096: { name: 'Flaming Barrage speed', exclusive: 'barrage', groups: [20], subs: [10], speed: 1.4 },
	25001: { name: 'Flaming Barrage speed', exclusive: 'barrage', groups: [20], subs: [10], speed: 1.3 },
	25048: { name: 'Mindblast speed', exclusive: 'mindblast', groups: [13], speed: 1.3 },

	25569: { name: 'Hastened Fireblast', exclusive: 'fireblast', groups: [6], speed: 1.25 },
	25548: { name: 'Hastened Mindblast', exclusive: 'mindblast', groups: [13], speed: 1.3 },
	25592: { name: 'Swift Nova (Mana Burst)', groups: [30], speed: 1.3 },
	25102: { name: 'Glacial Retreat -> Arcane Pulse charge speed' },
	25045: { name: 'Blazing Glacial Retreat (Arcane Pulse charge speed)' },

	25042: { name: 'Blazing Mana Siphon' },
	25043: { name: 'Blazing Lightning Trap' },
	25547: { name: 'Blazing Time Gyre' },
	25552: { name: 'Blazing Ice Needle' },
	25559: { name: 'Blazing Flame Pillar' }
};

const ABN_CELERITY = 501200;
const ABN_TRAP_SPEED = 25090;
const ABN_MIND_SPEED = 25110;

const ABN_FIREBLAST_SPEED = 25100;
const ABN_PILLAR_SPEED = 25070;
const ABN_BARRAGE_SPEED = 25060;
const HAIL_SPEED_FAST = [920, 921, 922, 929];
const HAIL_SPEED_SLOW = [902, 910, 911, 912, 913, 916, 917, 5010009, 999010000];
const AP_GLACIAL_BONUS = 0.33;
const AP_GLACIAL_MS = 6000;

const LATE_COOLDOWN = [11];
const LATE_CD_MAX = 1500;
const STONE_WAIT_MS = 1500;

const HOLD_CELERITY_MS = 25;
const HOLD_RELEASE_MS = 60;
const HOLD_BARRAGE_MS = 100;

const HOLD_BASE_MS = 30;

const HOLD_GROUPS = [1, 2, 3, 4, 8, 9, 10, 11, 12, 16, 17, 19, 20, 21, 22, 23, 24, 25, 27, 28, 30];

const LEGACY = {
	dirs: ['neuesSorcSP'],
	config: { PACKET_BUFFER_SIZE: null, FLAME_BARRAGE_SYNC: null, SYNC_MARGIN: null, BOC_BUFFER: null },
	skillData(o) {
		const out = {};
		for (const [k, v] of Object.entries(o || {})) out[k] = Object.assign({}, v);
		const neg = (k) => { if (out[k] && Number.isFinite(out[k].distance)) out[k].distance = -Math.abs(out[k].distance); };
		neg('backstep');
		neg('glacialRetreat');
		for (const k of ['nerveExhaust', 'burningBreath', 'manaVolley']) {
			const e = out[k];
			if (e && Number.isFinite(e.stage0Duration) && Number.isFinite(e.duration)) out[k] = { stages: [e.stage0Duration, e.duration - e.stage0Duration] };
		}
		if (out.stoneSkin && Number.isFinite(out.stoneSkin.cancelDuration)) out.stoneSkinCancel = { duration: out.stoneSkin.cancelDuration };
		return out;
	}
};

function setup(api) {
	const { groupOf, subOf, getSkillId } = api;
	const at = (id, g, ...subs) => groupOf(id) === g && (subs.length === 0 || subs.includes(subOf(id)));
	const running = () => { const a = api.action(); return a && !a.finished ? a : null; };

	let glacialUntil = 0;
	const lateCd = {};
	api.hook('S_START_COOLTIME_SKILL', 3, { order: -10 }, (event) => {
		const g = groupOf(getSkillId(event.skill));
		if (lateCd[g] && event.cooldown > 0) delete lateCd[g];
	});
	api.tryHook('S_CREST_MESSAGE', 2, (event) => {
		if (event.type === 6) delete lateCd[groupOf(Number(getSkillId(event.skill)))];
	});

	let held = null, heldTimer = null;
	const isIframe = (sid) => api.matchesAny(sid, IFRAMES);
	const isRelease = (sid) => (at(sid, 4) || at(sid, 19)) && subOf(sid) >= 10;
	function holdsOthers(a) {
		if (!a || a.isCharge || a.isHold || !a.endAt) return false;

		return HOLD_GROUPS.includes(groupOf(a.skillId)) && !at(a.skillId, 28, 50);
	}
	function freeAt(a) {
		const aspd = api.aspd() > 0 ? api.aspd() : 1;
		let extra = HOLD_BASE_MS + ((api.hasAbnormal(ABN_CELERITY) || aspd > 1.5) ? HOLD_CELERITY_MS : 0);
		if (isRelease(a.skillId)) extra += HOLD_RELEASE_MS;
		if (at(a.skillId, 20, 10)) extra += HOLD_BARRAGE_MS / aspd;
		return a.endAt + extra;
	}
	function clearHold() { api.clearTimeout(heldTimer); held = null; }
	function hold(kind, info, event, when) {
		clearHold();
		const h = held = { kind, name: info.name, version: info.version, event: api.copyEvent(event), sid: info.sid };
		const fire = () => {
			if (held !== h || !api.predicting()) return;
			const a = api.action();
			if (a && holdsOthers(a) && !(a.finished && a.endAt > Date.now()) && Date.now() < freeAt(a)) { heldTimer = api.setTimeout(fire, Math.max(1, freeAt(a) - Date.now())); return; }
			held = null;
			api.recordPacket('MOD->S', 'Held skill sent (cast ended)', { skill: api.skillLabel(h.sid) });
			if (h.kind === 'press') api.startPress(h.event);
			else api.startSkill(h.name, h.version, h.event);
		};
		heldTimer = api.setTimeout(fire, Math.max(1, when - Date.now()));
		api.recordPacket('MOD', 'Skill held until the cast ends', { skill: api.skillLabel(info.sid), ms: Math.round(when - Date.now()) });
	}

	// Soaria
	function holdUntil(sid) {
		if (isIframe(sid) || isRelease(sid)) return 0;
		const a = api.action();
		if (!holdsOthers(a)) return 0;

		if (a.finished && !(a.endAt <= Date.now())) return 0;
		const t = freeAt(a);
		return Date.now() < t ? t : 0;
	}

	return {
		chargeSpeed(sid) {
			if (groupOf(sid) === 4) return api.aspd() + (Date.now() < glacialUntil ? AP_GLACIAL_BONUS : 0);
			return api.aspd();
		},
		skillSpeed(sid) {
			const g = groupOf(sid);
			let m = 1;
			if (g === 3 && api.hasAbnormal(ABN_TRAP_SPEED)) m *= 1.4;
			if (g === 13 && api.hasAbnormal(ABN_MIND_SPEED)) m *= 1.4;
			if (g === 6 && api.hasAbnormal(ABN_FIREBLAST_SPEED)) m *= 1.25;
			if (g === 8 && api.hasAbnormal(ABN_PILLAR_SPEED)) m *= 1.25;
			if (g === 20 && subOf(sid) === 10 && api.hasAbnormal(ABN_BARRAGE_SPEED)) m *= 1.25;
			if (g === 27) {
				if (HAIL_SPEED_FAST.some(id => api.hasAbnormal(id))) m *= 1.225;
				else if (HAIL_SPEED_SLOW.some(id => api.hasAbnormal(id))) m *= 1.15;
			}
			return m;
		},

		start(event, info) {
			const sid = info.sid;
			if (!api.isPlayerSkill(event.skill)) return undefined;
			if (isIframe(sid)) { clearHold(); return undefined; }

			const a = running();
			if (a && groupOf(a.skillId) === groupOf(sid) && !isRelease(sid) && !(groupOf(sid) >= 20 && subOf(sid) === 10)) {
				if (held && held.sid === sid) clearHold();
				return 'pass';
			}
			if (lateCd[groupOf(sid)] && Date.now() < lateCd[groupOf(sid)]) {
				api.recordPacket('MOD', 'Not predicted (cooldown of the last cast not known yet)', { skill: api.skillLabel(sid) });
				if (held && held.sid === sid) clearHold();
				return 'pass';
			}
			const until = holdUntil(sid);
			if (until) { hold('start', info, event, until); return 'drop'; }
			if (held && held.sid !== sid) clearHold();
			return undefined;
		},
		press(event, info) {
			const sid = info.sid;
			if (!event.press) {
				if (held && held.kind === 'press' && held.sid === sid) { clearHold(); return 'drop'; }
				return undefined;
			}
			const until = holdUntil(sid);
			if (until) { hold('press', info, event, until); return 'drop'; }
			return undefined;
		},
		predicted(sid, a) {
			if (at(sid, 28, 0) && a) api.scheduleActionEnd(a, a.normDuration / a.speed + STONE_WAIT_MS);
			if (LATE_COOLDOWN.includes(groupOf(sid))) lateCd[groupOf(sid)] = ((a && a.endAt) || Date.now()) + LATE_CD_MAX;
			if (groupOf(sid) === 18 && (api.isGlyph(25102) || api.isGlyph(25045))) glacialUntil = Date.now() + AP_GLACIAL_MS;
		},

		learnTarget(id) {
			if (at(id, 28, 0)) return { key: 'stoneSkin', prop: 'duration' };
			return undefined;
		},
		reset() {
			clearHold();
			glacialUntil = 0;
			for (const k of Object.keys(lateCd)) delete lateCd[k];
		},
		bugState() {
			return `held=${held ? api.skillLabel(held.sid) : '-'} celerity=${api.hasAbnormal(ABN_CELERITY) ? 1 : 0} glacialAP=${Date.now() < glacialUntil ? 1 : 0}`;
		}
	};
}

module.exports = {
	NAME: 'Sorcerer-SP',
	CMD: 'sorc',
	CLASS_LABEL: 'Sorcerer',
	JOB: 4,
	AUTHORS: 'Soaria',

	OMNI: {
		7: { dir: 'south' },
		18: { dir: 'south' },
		26: { dir: 'north', dest: 350 }
	},
	COLOR: '#56B4E9',
	DATA_DIR: 'sorc',
	GLOBAL_LOCK_DELAY: 250,
	RETRY_DELAYS: [35, 75, 115],
	CHARGE_WATCHDOG: 380,
	NOTIFY_REPEATS: [100],
	END_DESYNC_FIX: true,
	DEFAULT_SKILLS,
	FAMILIES,
	GLYPHS,
	LEGACY,

	MEASURED_UPDATES: [
		{ key: 'iceNeedle', prop: 'duration', old: [930], value: 903 },
		{ key: 'arcanePulse', prop: 'chargeStages', old: [[1010, 998, 998]], value: [1000, 990, 1000] },
		{ key: 'arcanePulse', prop: 'releaseDuration', old: [990], value: 982 },
		{ key: 'flamePillar', prop: 'duration', old: [1925], value: 1190 },
		{ key: 'manaBarrier', prop: 'duration', old: [680], value: 608 },
		{ key: 'magmaBomb', prop: 'duration', old: [945], value: 925 },
		{ key: 'voidPulse', prop: 'duration', old: [935], value: 930 },
		{ key: 'manaSiphon', prop: 'releaseDuration', old: [910, 897], value: 905 },
		{ key: 'fireball', prop: 'duration', old: [715], value: 719 },
		{ key: 'lightningTrap', prop: 'duration', old: [2975], value: 1983 },
		{ key: 'painfulTrap', prop: 'duration', old: [1715], value: 1700 },
		{ key: 'timeGyre', prop: 'duration', old: [694], value: 677 },
		{ key: 'teleportJaunt', prop: 'stages', old: [[223, 296]], value: [206, 274] },
		{ key: 'teleportJaunt', prop: 'moveDelay', old: [30], value: 15 },
		{ key: 'stoneSkinCancel', prop: 'duration', old: [370], value: 344 },
		{ key: 'flamingBarrage', prop: 'duration', old: [1415], value: 1480 },
		{ key: 'nerveExhaust', prop: 'stages', old: [[293, 1219]], value: [285, 1201] },
		{ key: 'burningBreath', prop: 'stages', old: [[293, 1204]], value: [287, 1219] },
		{ key: 'manaVolley', prop: 'stages', old: [[282, 936]], value: [294, 908] },
		{ key: 'burstOfCelerity', prop: 'stages', old: [[284, 440]], value: [298, 400] },
		{ key: 'hailstorm', prop: 'duration', old: [935], value: 928 }
	],
	EXTRA_CONFIG: {
		SPOOF_GRANT: true,
		SPOOF_GRANT_DESCRIPTION: 'When you let go of Arcane Pulse / Mana Siphon, the release starts right away instead of waiting for the server to allow it (one ping). May desync with high jitter (!sorc grant)',
		DISABLE_CHARGE: false,
		DISABLE_CHARGE_DESCRIPTION: 'Disables the charge display of Arcane Pulse and Mana Siphon (for unstable connections) (!sorc charge)'
	},
	COMMANDS: {
		grant: { key: 'SPOOF_GRANT', label: 'No ping delay on charge release' },
		charge: { key: 'DISABLE_CHARGE', label: 'Charge display', invert: true }
	},
	setup
};
// DTmaik
