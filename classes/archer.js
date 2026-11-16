'use strict';
// Abdull

const DEFAULT_SKILLS = {
	arrow: { name: 'Arrow', duration: 396 },

	arrowVolleyAim: { name: 'Arrow Volley (aiming)', duration: 60000 },
	arrowVolley: { name: 'Arrow Volley', duration: 1228 },

	radiantArrow: { name: 'Radiant Arrow', chargeStages: [595, 595, 595], releaseDuration: 1745, distance: -100 },
	penetratingArrow: { name: 'Penetrating Arrow', chargeStages: [795, 795, 795], releaseDuration: 1320, distance: -50 },
	arrowRain: { name: 'Rain of Arrows', duration: 3140 },
	backstep: { name: 'Backstep', duration: 645, distance: -200 },
	feignDeath: { name: 'Feign Death' },

	rapidFire: { name: 'Rapid Fire', durations: [423, 600, 697, 801, 703, 795, 1236] },
	slowTrap: { name: 'Slow Trap', duration: 1130 },
	stunTrap: { name: 'Stunning Trap', duration: 1145 },
	veliksMark: { name: "Velik's Mark", duration: 990 },
	retaliate: { name: 'Retaliate' },
	incendiaryTrap: { name: 'Incendiary Trap', duration: 1140 },
	breakawayBolt: { name: 'Breakaway Bolt', duration: 1335, distance: -250 },
	webArrow: { name: 'Web Arrow', duration: 536 },

	closeQuarters: { name: 'Close Quarters (kick 1)', duration: 293, distance: 90 },
	closeQuarters2: { name: 'Close Quarters (kick 2)', duration: 1200, distance: 0 },
	poisonArrow: { name: 'Poison Arrow', duration: 1957 },
	restraintArrow: { name: 'Restraining Arrow', duration: 528 },
	stance: { name: "Sniper's / Eagle's Eye", duration: 628 },
	finalSalvo: { name: 'Final Salvo', duration: 425 },
	finalSalvoLast: { name: 'Final Salvo (hit 5)', duration: 1230 },
	concussionTrap: { name: 'Concussion Trap Arrow', duration: 1424 },
	snareTrap: { name: 'Snare Trap Arrow', duration: 1415 },
	explosionTrap: { name: 'Explosion Trap Arrow', duration: 1183 },

	thunderbolt: { name: 'Thunderbolt', duration: 3740, distance: -100 },
	tenacity: { name: 'Tenacity', stages: [490, 700] },

	chase: { name: 'Chase', duration: 975, distance: 417, minDuration: 165, stopShort: 16 }
};

const CHARGE_SHOT_EFFECT_SCALE = 1.1612902879714966;
const CHARGE = {
	mode: 'charge', subs: [0], releaseSubs: [10, 11, 12, 13], releaseNoEnd: true, waitServerStage: true, anchorToServer: true,
	pressRetry: [50, 100, 150, 200, 300, 400], releaseRetry: [40, 80, 120, 160], retry: false, selfLock: 0,
	releaseEffectScale: CHARGE_SHOT_EFFECT_SCALE,
	bySub: { 10: { selfLock: 250 }, 11: { selfLock: 250 }, 12: { selfLock: 250 }, 13: { selfLock: 250 } }
};

const FAMILIES = {
	1: { key: 'arrow', mode: 'simple' },

	2: { key: 'arrowVolley', keys: { 0: 'arrowVolleyAim' }, mode: 'simple', subs: [0, 10], bySub: { 0: { fixedSpeed: true, retry: false, selfLock: 0 }, 10: { prevEndType: 35 } } },
	3: Object.assign({ key: 'radiantArrow' }, CHARGE),
	4: Object.assign({ key: 'penetratingArrow' }, CHARGE),
	5: { key: 'arrowRain', mode: 'simple', subs: [0, 50], selfLock: 2500 },
	6: { key: 'backstep', mode: 'simple' },
	7: { key: 'feignDeath', mode: 'passthrough' },

	8: { key: 'rapidFire', mode: 'combo', subs: [0, 1, 2, 3, 4, 5], retry: [35, 75], ackExact: true },
	9: { key: 'slowTrap', mode: 'simple' },
	10: { key: 'stunTrap', mode: 'simple' },
	12: { key: 'veliksMark', mode: 'simple' },
	14: { key: 'retaliate', mode: 'passthrough' },
	15: { key: 'incendiaryTrap', mode: 'simple' },
	16: { key: 'breakawayBolt', mode: 'simple' },
	17: { key: 'webArrow', mode: 'simple', selfLock: 750 },
	18: { key: 'closeQuarters', keys: { 1: 'closeQuarters2' }, mode: 'simple', subs: [0, 1], bySub: { 1: { selfLock: 'duration' } } },
	19: { key: 'poisonArrow', mode: 'simple', selfLock: 500 },
	20: { key: 'restraintArrow', mode: 'simple', selfLock: 1250 },
	21: { key: 'stance', mode: 'simple' },

	22: { key: 'finalSalvo', keys: { 4: 'finalSalvoLast' }, mode: 'simple', subs: [0, 1, 2, 3, 4], retry: [35, 75], ackExact: true },
	23: { key: 'concussionTrap', mode: 'simple' },
	24: { key: 'snareTrap', mode: 'simple', subs: [0, 1] },
	25: { key: 'explosionTrap', mode: 'simple' },
	28: { key: 'stance', mode: 'simple' },
	29: { key: 'thunderbolt', mode: 'simple', selfLock: 500 },
	31: { key: 'tenacity', mode: 'stages', fixedSpeed: true },

	33: { key: 'chase', mode: 'simple', subs: [], serverSubs: [0], retry: false }
};

const GLYPHS = {
	26577: { name: 'Swift Rain of Arrows', exclusive: 'rain', groups: [5], speed: 1.4 },
	26077: { name: 'Swift Rain of Arrows', exclusive: 'rain', groups: [5], speed: 1.4 },
	26089: { name: 'Swift Thunderbolt', exclusive: 'thunder', groups: [29], speed: 1.3 },
	26102: { name: 'Swift Thunderbolt', exclusive: 'thunder', groups: [29], speed: 1.3 },

	26059: { name: 'Blazing Arrow Volley' },
	26048: { name: 'Blazing Stunning Trap' },
	26051: { name: 'Blazing Final Salvo' },
	26050: { name: 'Blazing Poison Arrow' },
	26037: { name: "Blazing Velik's Mark" }
};

const BLAZING = [
	{ glyph: 26059, from: [2], to: 4, bonus: 0.4, abn: [26171] },
	{ glyph: 26048, from: [10], to: 4, bonus: 0.3, abn: [26160, 26190] },
	{ glyph: 26051, from: [22], to: 4, bonus: 0.3, abn: [26160, 26190] },
	{ glyph: 26050, from: [19], to: 3, bonus: 0.3, abn: [26180] },
	{ glyph: 26037, from: [12], to: 19, bonus: 0.25, abn: [26100] }
];
const BLAZING_GUESS_MS = 1000;

const ABN_FOCUS = 601450;
const ABN_FINAL_SALVO = 600200;
const FINAL_SALVO_WINDOW = 7000;
const ABN_STUN_TRAP = [26170, 26111];
const RAIN_SPEED_FAST = [920, 921, 922, 929];
const RAIN_SPEED_SLOW = [902, 910, 911, 912, 913, 916, 917, 5010009, 999010000];
const RACE_KICK_FACTOR = 1.0825;
const RF_RESET_FALLBACK = 2340;

const RF_GAP_DEFAULT = 165, RF_GAP_MIN = 140, RF_GAP_MAX = 250, RF_GAP_SAFE = 160;
const RF_GAP_MARGIN = 8;

const FAST_KICK_RACES = [[2, 0], [5, 0], [3, 1], [0, 1], [4, 0]];

const rep3 = (v) => (Number.isFinite(v) ? [v, v, v] : undefined);
const LEGACY = {
	dirs: ['neuesArcherSP'],
	config: { RACE_CARRIED: null },
	skillData(o) {
		const g = (k) => o[k] || {};
		const dur = (k) => ({ duration: g(k).duration });
		const cq = g('closeQuarters');
		return {
			arrow: dur('arrow'),
			arrowVolley: dur('arrowVolley'),
			radiantArrow: { chargeStages: rep3(g('radiantArrow').stageDuration), releaseDuration: g('radiantArrow').shotDuration, distance: g('radiantArrow').distance },
			penetratingArrow: { chargeStages: rep3(g('penetratingArrow').stageDuration), releaseDuration: g('penetratingArrow').shotDuration, distance: g('penetratingArrow').distance },
			arrowRain: dur('arrowRain'),
			backstep: { duration: g('backstep').duration, distance: g('backstep').distance },
			rapidFire: { durations: g('rapidFire').durations },
			slowTrap: dur('slowTrap'),
			stunTrap: dur('stunTrap'),
			veliksMark: dur('veliksMark'),
			incendiaryTrap: dur('incendiaryTrap'),
			breakawayBolt: { duration: g('breakawayBolt').duration, distance: g('breakawayBolt').distance },
			webArrow: dur('webArrow'),
			closeQuarters: { duration: (cq.durations || [])[0], distance: (cq.distances || [])[0] },
			closeQuarters2: { duration: (cq.durations || [])[1], distance: (cq.distances || [])[1] },
			poisonArrow: dur('poisonArrow'),
			restraintArrow: dur('restraintArrow'),
			stance: dur('stance'),
			finalSalvo: dur('finalSalvo'),
			concussionTrap: dur('concussionTrap'),
			snareTrap: dur('snareTrap'),
			explosionTrap: dur('explosionTrap'),
			thunderbolt: dur('thunderbolt'),
			tenacity: { stages: g('tenacity').stages },
			chase: Object.assign({}, g('chase'))
		};
	}
};

function setup(api) {
	const { groupOf, subOf, baseOf, getSkillId } = api;
	const at = (id, g, ...subs) => groupOf(id) === g && (subs.length === 0 || subs.includes(subOf(id)));
	const running = () => { const a = api.action(); return a && !a.finished ? a : null; };
	const runningIs = (g, ...subs) => { const a = running(); return Boolean(a && at(a.skillId, g, ...subs)); };

	let stunTrapBuff = false;
	const guessed = new Map();
	// Blazing glyph buffs make the next skill of a group faster
	function blazingBonus(group) {
		let best = 0;
		for (const b of BLAZING) {
			if (b.to !== group) continue;
			const real = b.abn.some(id => api.hasAbnormal(id));
			if (real || (guessed.get(b) || 0) > Date.now()) best = Math.max(best, b.bonus);
		}
		return best;
	}
	function guessBlazing(sid) {
		const g = groupOf(sid);
		for (const b of BLAZING) {
			if (b.from.includes(g) && api.isGlyph(b.glyph)) guessed.set(b, Date.now() + BLAZING_GUESS_MS);
		}
	}

	let salvoWindowUntil = 0;
	let lastSalvo = null;
	const SALVO_CHAIN_MS = 5000;
	const salvoNext = (sub) => Boolean(lastSalvo && lastSalvo.sub === sub - 1 && Date.now() - lastSalvo.at < SALVO_CHAIN_MS);
	const openSalvoWindow = () => { salvoWindowUntil = Date.now() + FINAL_SALVO_WINDOW; };
	const salvoReady = () => api.hasAbnormal(ABN_FINAL_SALVO) || Date.now() < salvoWindowUntil;

	function fastKickRace() {
		const m = Number(api.model()) - 10101;
		if (!(m >= 0)) return false;
		const race = Math.floor(m / 200);
		const gender = Math.floor(m / 100) % 2;
		return FAST_KICK_RACES.some(([r, gd]) => r === race && gd === gender);
	}

	let rfLast = null;
	const rfGapSetting = () => {
		const v = Number(api.config.RF_HIT_GAP);
		return Number.isFinite(v) ? Math.min(RF_GAP_MAX, Math.max(RF_GAP_MIN, Math.round(v))) : RF_GAP_DEFAULT;
	};
	function rfCommand(arg) {
		let value = rfGapSetting();
		if (arg === '+' || arg === '-') value += arg === '+' ? 5 : -5;
		else if (arg !== undefined && /^\d+$/.test(arg)) value = parseInt(arg, 10);
		else if (arg !== undefined) return api.sendChat('Usage: <font color="#FFD700">!archer rf</font> (show), <font color="#FFD700">!archer rf 165</font> (set ms), <font color="#FFD700">!archer rf +</font> or <font color="#FFD700">-</font> (5 ms slower or faster)');
		if (arg !== undefined) { api.config.RF_HIT_GAP = Math.min(RF_GAP_MAX, Math.max(RF_GAP_MIN, value)); api.saveConfig(); }
		const v = rfGapSetting();
		const aspd = api.aspd() > 0 ? api.aspd() : 1;
		const note = v < RF_GAP_SAFE ? ' <font color="#FF5555">- faster than the server reliably takes: some hits may be refused</font>' : '';
		api.sendChat(`Rapid Fire: <font color="#FFD700">${v} ms</font> between hits at attack speed 1.0 (${Math.round(v / aspd)} ms at your speed ${aspd.toFixed(2)})${note}`);
	}
	let rfHeld = null, rfTimer = null;
	// earliest time the server takes the next Rapid Fire hit (RF_HIT_GAP after the previous one)
	function rfEarliest(sid) {
		const prev = rfLast;
		if (!prev || !at(prev.sid, 8, subOf(sid) - 1)) return 0;
		const gap = rfGapSetting() / (api.aspd() > 0 ? api.aspd() : 1) + RF_GAP_MARGIN;
		const ack = api.serverSkillAckAt(prev.sid);
		if (ack >= prev.at) return ack - api.estimateRtt() + gap;

		return Date.now() < prev.at + gap + api.estimateRtt() + 120 ? Math.max(prev.at + gap, Date.now() + 10) : 0;
	}
	// Soaria
	function clearRfHold() { api.clearTimeout(rfTimer); rfHeld = null; }
	// shows nothing yet and sends the Rapid Fire hit when the server can take it
	function holdRf(info, event, when) {
		clearRfHold();
		const held = rfHeld = { name: info.name, version: info.version, event: api.copyEvent(event), sid: info.sid };
		const fire = () => {
			if (rfHeld !== held || !api.predicting()) return;
			const t = rfEarliest(held.sid);
			if (Date.now() < t) { rfTimer = api.setTimeout(fire, Math.max(1, t - Date.now())); return; }
			rfHeld = null;
			api.recordPacket('MOD->S', 'Rapid Fire hit sent (held for the server)', { skill: api.skillLabel(held.sid) });
			api.startSkill(held.name, held.version, held.event);
		};
		rfTimer = api.setTimeout(fire, Math.max(1, when - Date.now()));
		api.recordPacket('MOD', 'Rapid Fire hit held (server not ready for it yet)', { skill: api.skillLabel(info.sid), ms: Math.round(when - Date.now()) });
	}

	let chasePredicted = null;
	const chaseMs = (dist) => {
		const d = api.skills.chase;
		return Math.max(d.minDuration || 0, (dist / (d.distance || 417)) * (d.duration || 975));
	};
	function predictChase(event, info) {
		const sid = info.sid;
		const d = api.skills.chase;
		if (!event.dest || !event.loc) return undefined;
		let targetId = 0n;
		if (event.targets && event.targets.length) targetId = event.targets[0].gameId || event.targets[0].id || 0n;
		const hasTarget = Boolean(targetId) && String(targetId) !== '0';

		const full = Math.hypot(event.loc.x - event.dest.x, event.loc.y - event.dest.y);
		const ms = chaseMs(Math.max(0, full - (d.stopShort || 0)));
		const a = api.startAction(event, sid, { duration: ms, fixedSpeed: true, endType: hasTarget ? 0 : 38, prevEndType: 4, requestId: sid });
		chasePredicted = { at: Date.now(), action: a };
		api.recordPacket('MOD', 'Chase predicted', { target: hasTarget ? 'yes' : 'no', ms: Math.round(ms) });
		api.lock(sid, api.GLOBAL_LOCK_DELAY);
		api.scheduleRetries('C_START_TARGETED_SKILL', 6, event, [25, 50, 75, 100]);
		api.setLastSkill(sid, event);
		return 'done';
	}

	api.hook('S_INSTANT_DASH', 3, (event) => {
		if (!api.predicting() || event.gameId !== api.cid() || !chasePredicted) return;
		const p = chasePredicted;
		chasePredicted = null;
		const a = p.action;
		if (Date.now() - p.at > 1500 || !a || a.finished || api.action() !== a) return;
		let target = 0n;
		try { target = event.target ? BigInt(event.target) : 0n; } catch (e) {}
		a.dest = { x: event.loc.x, y: event.loc.y, z: event.loc.z };
		a.endType = target ? 0 : 38;
		const ms = chaseMs(Math.hypot(event.loc.x - a.start.x, event.loc.y - a.start.y));
		api.scheduleActionEnd(a, ms);
		api.recordPacket('S->C', 'Chase: server dash', { target: target ? 'yes' : 'no', ms: Math.round(ms) });
	});

	api.hook('C_CANCEL_SKILL', 3, { order: -10 }, (event) => {
		if (!api.predicting() || event.type !== 1 || !at(getSkillId(event.skill), 2)) return;
		if (runningIs(2, 0)) api.finishPrevious(0, 1, api.realLoc() || undefined);
	});

	api.tryHook('S_CREST_MESSAGE', 2, (event) => {
		if (!api.predicting() || !api.config.RF_RESET_STOP) return;
		const sid = Number(getSkillId(event.skill));
		if (groupOf(sid) !== 8) return;
		const aspd = api.aspd() > 0 ? api.aspd() : 1;
		let ms = RF_RESET_FALLBACK / aspd;
		const a = running();
		if (a && at(a.skillId, 8)) {
			const spd = a.speed || aspd;
			const last = (api.skills.rapidFire.durations || [])[5] || 805;
			const k = subOf(a.skillId);
			ms = k >= 5 ? Math.max(0, (a.endAt || Date.now()) - Date.now()) : (5 - k) * (rfGapSetting() / spd + RF_GAP_MARGIN) + last / spd;
		}
		const cooldown = Math.round(20 + ms);
		api.dispatch.toClient('S_START_COOLTIME_SKILL', 3, { skill: baseOf(sid), cooldown });
		api.recordPacket('MOD->C', 'Rapid Fire reset stop (short cooldown)', { ms: cooldown });
	});

	api.hook('S_ABNORMALITY_BEGIN', 3, { order: -10 }, (event) => {
		if (!api.enabled() || event.target !== api.cid()) return;
		const id = Number(event.id);
		if (id === 26170) stunTrapBuff = true;
		for (const b of BLAZING) if (b.abn.includes(id)) guessed.delete(b);
	});
	api.hook('S_ABNORMALITY_END', 1, { order: -10 }, (event) => {
		if (!api.enabled() || event.target !== api.cid()) return;
		const id = Number(event.id);
		if (ABN_STUN_TRAP.includes(id)) stunTrapBuff = false;
		if (id === ABN_FINAL_SALVO) salvoWindowUntil = 0;
	});

	return {
		chargeSpeed(sid) {
			const focus = api.hasAbnormal(ABN_FOCUS) ? 0.5 : 0;
			const g = groupOf(sid);
			if (g === 3 || g === 4) return api.aspd() * (1 + focus + blazingBonus(g));
			return 0;
		},
		skillSpeed(sid) {
			const g = groupOf(sid);
			let m = 1;
			if (g === 5) {
				if (RAIN_SPEED_FAST.some(id => api.hasAbnormal(id))) m *= 1.225;
				if (RAIN_SPEED_SLOW.some(id => api.hasAbnormal(id))) m *= 1.15;
			}
			if (g === 23 && stunTrapBuff) m *= 1.5;
			if (g === 19) m *= 1 + blazingBonus(19);
			return m;
		},
		durationFactor(sid) {
			return at(sid, 18, 0) && fastKickRace() ? 1 / RACE_KICK_FACTOR : 1;
		},

		start(event, info) {
			const sid = info.sid;
			const g = groupOf(sid);
			if (rfHeld && g !== 8) clearRfHold();

			if (g === 22) {
				const sub = subOf(sid);
				if (sub === 0 ? !salvoReady() : !salvoNext(sub)) return 'pass';
			}
			if (at(sid, 8, 6)) return 'drop';
			if (g === 8 && subOf(sid) >= 1) {
				const when = rfEarliest(sid);
				if (Date.now() < when) { holdRf(info, event, when); return 'drop'; }
			}
			return undefined;
		},
		targeted(event, info) {
			if (at(info.sid, 33, 0) && !api.isLocked(info.sid)) return predictChase(event, info);
			return undefined;
		},
		press(event, info) {
			if (event.press && (at(info.sid, 3, 0) || at(info.sid, 4, 0))) openSalvoWindow();
			return undefined;
		},
		predicted(sid, a) {
			const g = groupOf(sid);
			if (g === 8) rfLast = { sid, at: a ? a.startedAt : Date.now() };
			guessBlazing(sid);
			if (g === 3 || g === 4 || g === 19) for (const b of BLAZING) if (b.to === g) guessed.delete(b);
			if ((g === 3 || g === 4) && subOf(sid) >= 10) openSalvoWindow();
			if (g === 29) openSalvoWindow();
			if (at(sid, 22, 4)) salvoWindowUntil = 0;
			if (g === 22) lastSalvo = { sub: subOf(sid), at: Date.now() };
		},

		serverStage(event, sid) {
			if (groupOf(sid) === 22 && event.stage === 0) lastSalvo = { sub: subOf(sid), at: Date.now() };
			return undefined;
		},
		learnTarget(id) {
			if (at(id, 2, 0)) return null;
			if (at(id, 33)) return null;
			if (at(id, 18, 0) && fastKickRace()) return null;
			return undefined;
		},
		command(sub, args) {
			if (sub === 'rf') { rfCommand(args[1]); return true; }
			return false;
		},
		help() {
			return [['rf [ms]', `Rapid Fire ${rfGapSetting()} ms between hits`]];
		},
		reset() {
			salvoWindowUntil = 0;
			chasePredicted = null;
			lastSalvo = null;
			guessed.clear();
			clearRfHold();
			rfLast = null;
		},
		bugState() {
			return `salvo=${salvoReady() ? 'ready' : '-'} focus=${api.hasAbnormal(ABN_FOCUS) ? 1 : 0} blazing=R${blazingBonus(3)}/P${blazingBonus(4)}/Poison${blazingBonus(19)} stunTrap=${stunTrapBuff ? 1 : 0} fastKick=${fastKickRace() ? 1 : 0}`;
		}
	};
}

module.exports = {
	NAME: 'Archer-SP',
	CMD: 'archer',
	CLASS_LABEL: 'Archer',
	JOB: 5,
	AUTHORS: 'DTmaik',

	OMNI: {
		6: { dir: 'south' },
		16: { dir: 'south' }
	},
	COLOR: '#56B4E9',
	DATA_DIR: 'archer',
	GLOBAL_LOCK_DELAY: 250,
	RETRY_DELAYS: [35, 75, 115],
	CHARGE_WATCHDOG: 380,
	NOTIFY_REPEATS: [100],
	END_DESYNC_FIX: true,
	DUPLICATE_MESSAGES: ['@2059', '@36', '@1677'],
	DEFAULT_SKILLS,
	FAMILIES,
	GLYPHS,
	LEGACY,

	MEASURED_UPDATES: [
		{ key: 'arrow', prop: 'duration', old: [420, 390], value: 396 },
		{ key: 'arrowVolley', prop: 'duration', old: [1200, 1215], value: 1228 },
		{ key: 'arrowRain', prop: 'duration', old: [3150], value: 3140 },
		{ key: 'rapidFire', prop: 'durations', old: [[368, 275, 275, 275, 275, 275, 1236], [700, 700, 680, 700, 705, 805, 1236]], value: [423, 600, 697, 801, 703, 795, 1236] },
		{ key: 'veliksMark', prop: 'duration', old: [200], value: 990 },
		{ key: 'breakawayBolt', prop: 'duration', old: [1310, 1320], value: 1335 },
		{ key: 'closeQuarters', prop: 'duration', old: [275, 300], value: 293 },
		{ key: 'closeQuarters2', prop: 'duration', old: [1190], value: 1200 },
		{ key: 'closeQuarters2', prop: 'distance', old: [87], value: 0 },
		{ key: 'poisonArrow', prop: 'duration', old: [1110, 1948], value: 1957 },
		{ key: 'restraintArrow', prop: 'duration', old: [510], value: 528 },
		{ key: 'stance', prop: 'duration', old: [800, 660], value: 628 },
		{ key: 'penetratingArrow', prop: 'releaseDuration', old: [1310], value: 1320 },
		{ key: 'incendiaryTrap', prop: 'duration', old: [1130], value: 1140 },
		{ key: 'webArrow', prop: 'duration', old: [515], value: 536 },
		{ key: 'concussionTrap', prop: 'duration', old: [1410], value: 1424 },
		{ key: 'explosionTrap', prop: 'duration', old: [1160, 1190], value: 1183 },
		{ key: 'snareTrap', prop: 'duration', old: [1470, 1405], value: 1415 },
		{ key: 'tenacity', prop: 'stages', old: [[500, 700]], value: [490, 700] },
		{ key: 'chase', prop: 'distance', old: [434], value: 417 },
		{ key: 'finalSalvo', prop: 'duration', old: [420], value: 425 }
	],
	EXTRA_CONFIG: {
		SPOOF_GRANT: true,
		SPOOF_GRANT_DESCRIPTION: 'When you let go of Radiant / Penetrating Arrow, the shot starts right away instead of waiting for the server to allow it (one ping). May desync with high jitter (!archer grant)',
		DISABLE_CHARGE: false,
		DISABLE_CHARGE_DESCRIPTION: 'Disables the charge display of Radiant / Penetrating Arrow (for unstable connections) (!archer charge)',
		RF_RESET_STOP: false,
		RF_RESET_STOP_DESCRIPTION: 'When Rapid Fire resets while you hold the key, a short cooldown is shown until the running Rapid Fire is over, so it does not start again by itself (!archer rfstop)',
		RF_HIT_GAP: RF_GAP_DEFAULT,
		RF_HIT_GAP_DESCRIPTION: `Time between two Rapid Fire hits in ms at attack speed 1.0 (${RF_GAP_MIN}-${RF_GAP_MAX}). Lower = faster. The server takes the next hit after about 165 ms; below ${RF_GAP_SAFE} some hits may be refused. Change in game with !archer rf <ms>, !archer rf + / -`
	},
	COMMANDS: {
		grant: { key: 'SPOOF_GRANT', label: 'No ping delay on charged shots' },
		charge: { key: 'DISABLE_CHARGE', label: 'Charge display', invert: true },
		rfstop: { key: 'RF_RESET_STOP', label: 'Rapid Fire reset stop' }
	},
	setup
};
// DTmaik
