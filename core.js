'use strict';
// Abdull

const fs = require('fs');
const path = require('path');
const omni = require('./omni');

const DEFAULT_LOCK_DELAY = 250;
const DEFAULT_RETRY_DELAYS = [25, 50, 75, 100, 150, 200];
const RETRY_ECHO_WINDOW = 1500;
const FAKE_FAMILY_WINDOW = 2000;
const CHAIN_WINDOW = 250;

const ATKID_KEY = '__skillPredictionActionId';
// one action ID counter for all classes and reloads: the client ignores an ID it has seen before
function nextActionId() {
	const cur = global[ATKID_KEY];
	if (!Number.isFinite(cur) || cur < 0xF0000000 || cur > 0xFEFEFFEE) global[ATKID_KEY] = 0xFEFEFFEE - (Date.now() % 0x00F00000);
	return --global[ATKID_KEY];
}

// gate protection (hidden !<class> gate): moving skills stop where the server stops them; on until the Toolbox restarts
let gateFix = true;

const BLACKLIST = new Set([
	110100, 111110, 111111, 111112, 111113, 111114, 111115, 111116, 111117, 111118, 111119, 111120, 111121, 111122, 111124, 111125,
	111126, 111127, 111128, 111129, 111130, 111131, 111134, 111135, 111139, 111140, 111143, 111144, 111145, 111190, 111191, 111193,
	111194, 111195, 111197, 111199, 111202, 111203, 116001, 116002, 116003, 116004, 117002, 117003, 140100, 460100, 480100, 900001,
	111136, 111137, 111138, 111141, 111142, 111147, 111149, 111150, 111151, 111152, 111153, 111154, 111155, 111156, 111157, 111158,
	211141, 211150, 111123, 111132, 111133, 111146, 111148, 111192, 111196, 111198, 211145, 111159, 111160, 111161, 111162, 111163,
	111164, 111165, 111166, 111168, 111169, 111170, 111171, 111172, 111173, 111174, 111175, 111176, 111177, 111178, 111179, 111180,
	111204, 111205, 111206, 111207, 111208, 111209, 111210, 111211, 111212, 111214, 111215, 111216, 111217, 111218, 111219, 111220,
	111221, 111222, 111223, 111224, 111225, 111226, 111227, 111228, 111229, 111230, 111231, 111232, 111233, 111234, 111235, 111236,
	111237, 111238, 111239, 111241, 111242, 111243, 111244, 111245, 111246, 111247, 111248, 111249, 111250, 111251, 111252, 111253,
	111254, 111255, 111256, 111257, 111258, 111259, 111260, 111261, 111262, 111263, 111264, 111265, 111266, 111267, 111268, 111269,
	111270, 111271, 111272, 111273, 111274, 111275, 111276, 111277, 111278, 111279, 111280, 111281, 111282, 111283, 111284, 111285,
	111286, 111287, 111288, 111289, 111290, 111291, 111292, 111293, 111294, 111295, 111296, 111297, 111298, 111299, 111301, 111302
]);

const getSkillId = (skill) => (skill && typeof skill === 'object') ? Number(skill.id) : Number(skill);
const groupOf = (id) => Math.floor(id / 10000);
const subOf = (id) => id % 100;
const baseOf = (id) => Math.floor(id / 100) * 100;
const isPlayerSkill = (skill) => {
	const id = getSkillId(skill);
	const typeOk = (skill && typeof skill === 'object' && skill.type !== undefined) ? skill.type === 1 : true;
	return typeOk && id > 0 && id < 1000000;
};

module.exports = function createPrediction(dispatch, DEF, opts) {
	const modDir = opts.modDir;
	const dataDir = opts.dataDir;
	try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) {}
	const GLOBAL_LOCK_DELAY = DEF.GLOBAL_LOCK_DELAY || DEFAULT_LOCK_DELAY;
	const RETRY_DELAYS = DEF.RETRY_DELAYS !== undefined ? DEF.RETRY_DELAYS : DEFAULT_RETRY_DELAYS;
	const FAMILIES = DEF.FAMILIES;
	const famList = Object.values(FAMILIES);
	const HAS_LOCKON = famList.some(f => f.mode === 'lockon');
	const HAS_CHARGE = famList.some(f => f.mode === 'charge');

	const hooks = [];
	const hook = (...args) => {
		const h = dispatch.hook(...args);
		hooks.push(h);
		return h;
	};

	const CLS = {};

	let destroyed = false;
	const timers = new Set();
	const setTimeout = (fn, ms) => {
		const h = global.setTimeout(() => {
			timers.delete(h);
			if (!destroyed) fn();
		}, ms);
		timers.add(h);
		return h;
	};
	const clearTimeout = (h) => {
		if (h === undefined || h === null) return;
		timers.delete(h);
		global.clearTimeout(h);
	};

	const NAME = DEF.NAME;
	const CMD = DEF.CMD;
	const JOB = DEF.JOB;
	const CONFIG_PATH = path.join(dataDir, 'config.json');
	const SHARED_PATH = path.join(modDir, 'data', 'shared.json');
	function sharedPing() {
		try { const v = Number(JSON.parse(fs.readFileSync(SHARED_PATH, 'utf8')).GLOBAL_LATENCY); return Number.isFinite(v) && v >= 0 ? v : null; } catch (e) { return null; }
	}
	const SKILL_DATA_PATH = path.join(dataDir, 'skill_data.json');

	// per skill switch: name -> skill groups (placeholder names and shared entries use the short data key)
	const switchName = (s) => String(s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '');
	const SKILL_SWITCHES = {};
	const SWITCH_OF_GROUP = {};
	const SWITCH_LABEL = {};
	for (const [g, fam] of Object.entries(DEF.FAMILIES || {})) {
		if (!fam || fam.mode === 'passthrough') continue;
		const d = (DEF.DEFAULT_SKILLS || {})[fam.key];
		const full = d && d.name && !/^Skill \d/.test(d.name) && !d.name.includes('/') ? d.name : null;
		const name = switchName(full || fam.key);
		if (!name) continue;
		(SKILL_SWITCHES[name] = SKILL_SWITCHES[name] || []).push(Number(g));
		SWITCH_OF_GROUP[g] = name;
		if (!SWITCH_LABEL[name]) SWITCH_LABEL[name] = full ? full.replace(/\s*\(.*?\)/g, '') : name;
	}

	const DEFAULT_CONFIG = Object.assign({
		GLOBAL_LATENCY: 0,
		GLOBAL_LATENCY_DESCRIPTION: 'Your lowest usual ping in ms (shortens cooldowns by this value). Set it for all classes at once with !sp ping <ms>'
	}, HAS_LOCKON ? {
		INSTANT_LOCKON: true,
		INSTANT_LOCKON_DESCRIPTION: `Lock-on targets are confirmed instantly instead of waiting for the server. Party-only skills: only party members. Pets/summons and targets the server refused before (e.g. dungeon objects) are never confirmed (!${CMD} lockon)`,
		PREDICT_LOCKON: true,
		PREDICT_LOCKON_DESCRIPTION: `Predicts the cast after a lock-on. The targeting itself always runs through the server (!${CMD} lockcast)`
	} : {}, {
		AUTO_GLYPH_SYNC: true,
		AUTO_GLYPH_SYNC_DESCRIPTION: `Applies known glyphs (speed, movement distance) and automatically adapts to glyphs/buffs that make a skill faster (!${CMD} glyphsync)`
	}, HAS_LOCKON ? {
		LOCKON_TIMEOUT_CANCEL: true,
		LOCKON_TIMEOUT_CANCEL_DESCRIPTION: 'A lock-on that is held until its time limit goes on cooldown. The mod cancels it shortly before the limit instead, so there is no cooldown',
		LOCKON_TIMEOUT_MARGIN: 1000,
		LOCKON_TIMEOUT_MARGIN_DESCRIPTION: 'How many ms before the lock-on time limit the targeting is cancelled'
	} : {}, {
		GHOST_FIX: true,
		GHOST_FIX_DESCRIPTION: `Ends a predicted animation if the server rejects the skill or has not confirmed it after GHOST_TIMEOUT ms (!${CMD} ghost)`,
		GHOST_TIMEOUT: 1000,
		GHOST_TIMEOUT_DESCRIPTION: 'Waiting time in ms for GHOST_FIX (should be well above your ping)',
		LOG_SKILLS: false,
		LOG_SKILLS_DESCRIPTION: 'Shows measured server durations in game/console (developer option, only in this file)',
		LEARN_MODE: false,
		LEARN_MODE_DESCRIPTION: `Automatically writes measured server durations & distances to skill_data.json (developer option, only in this file, then !${CMD} reload). Prediction is OFF while learning!`
	}, DEF.OMNI ? {
		OMNI: false,
		OMNI_DESCRIPTION: `Omnidirectional skills: with W / A / S / D held, backsteps, Teleport Jaunt, dashes ... go in that direction (like the mod "omnidirectional" - remove that mod when you use this). Other keys (e.g. AZERTY) for all classes: !sp omnikeys zqsd. Off by default (!${CMD} omni)`
	} : {}, DEF.EXTRA_CONFIG || {}, {
		SKILL_PREDICTION: Object.fromEntries(Object.keys(SKILL_SWITCHES).map(k => [k, true])),
		SKILL_PREDICTION_DESCRIPTION: `Prediction per skill: false = this skill goes to the server without prediction (like without the mod), all other skills stay predicted. Change with !${CMD} disable <skill> / !${CMD} enable <skill>`
	});

	let config = Object.assign({}, DEFAULT_CONFIG);
	let skills = JSON.parse(JSON.stringify(DEF.DEFAULT_SKILLS));

	function saveConfig() {
		try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, '\t'), 'utf8'); } catch (e) { console.error(`[${NAME}] Error while saving config.json:`, e); }
	}
	function saveSkillData() {
		try { fs.writeFileSync(SKILL_DATA_PATH, JSON.stringify(skills, null, '\t'), 'utf8'); } catch (e) { console.error(`[${NAME}] Error while saving skill_data.json:`, e); }
	}

	function readLegacy(file) {
		for (const dir of ((DEF.LEGACY || {}).dirs || [])) {
			const p = path.join(modDir, '..', dir, file);
			try { if (fs.existsSync(p)) return { data: JSON.parse(fs.readFileSync(p, 'utf8')), dir }; } catch (e) {}
		}
		return null;
	}
	function migrateLegacyConfig() {
		const old = readLegacy('config.json');
		if (!old) return null;
		const map = (DEF.LEGACY || {}).config || {};
		const out = {};
		for (const [k, v] of Object.entries(old.data)) {
			if (k.endsWith('_DESCRIPTION')) continue;
			const to = map[k] !== undefined ? map[k] : k;
			if (to && DEFAULT_CONFIG[to] !== undefined && !to.endsWith('_DESCRIPTION')) out[to] = v;
		}
		console.log(`[${NAME}] Settings taken over from ${old.dir}/config.json`);
		return out;
	}
	// Soaria
	function migrateLegacySkillData() {
		const old = readLegacy('skill_data.json');
		if (!old) return null;
		let out = old.data;
		if (typeof (DEF.LEGACY || {}).skillData === 'function') {
			try { out = DEF.LEGACY.skillData(old.data); } catch (e) { console.error(`[${NAME}] Old skill_data.json could not be converted:`, e); return null; }
		}
		console.log(`[${NAME}] Skill durations taken over from ${old.dir}/skill_data.json`);
		return out;
	}

	function loadFiles() {
		try {
			let legacy = null;
			const fresh = !fs.existsSync(CONFIG_PATH);
			if (fresh) legacy = migrateLegacyConfig();
			if (legacy || fs.existsSync(CONFIG_PATH)) {
				const loaded = legacy || JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
				config = Object.assign({}, DEFAULT_CONFIG, loaded);
				for (const key of Object.keys(DEFAULT_CONFIG)) {
					if (key.endsWith('_DESCRIPTION')) config[key] = DEFAULT_CONFIG[key];
				}

				const sw = (loaded.SKILL_PREDICTION && typeof loaded.SKILL_PREDICTION === 'object') ? loaded.SKILL_PREDICTION : {};
				config.SKILL_PREDICTION = Object.fromEntries(Object.keys(SKILL_SWITCHES).map(k => [k, sw[k] !== false]));
				for (const key of Object.keys(config)) {
					if (DEFAULT_CONFIG[key] === undefined) delete config[key];
				}

				for (const cmd of Object.values(DEF.COMMANDS || {})) {
					const keys = cmd.keys || [];
					if (keys.length > 1 && keys.some(k => Boolean(config[k]) !== Boolean(config[keys[0]]))) {
						for (const k of keys) config[k] = Boolean(DEFAULT_CONFIG[keys[0]]);
					}
				}
			}
			if (fresh && sharedPing() !== null) config.GLOBAL_LATENCY = sharedPing();
			saveConfig();
		} catch (e) {
			console.error(`[${NAME}] Error while loading config.json:`, e);
		}

		try {
			skills = JSON.parse(JSON.stringify(DEF.DEFAULT_SKILLS));
			const loaded = fs.existsSync(SKILL_DATA_PATH) ? JSON.parse(fs.readFileSync(SKILL_DATA_PATH, 'utf8')) : migrateLegacySkillData();
			if (loaded) {
				for (const key of Object.keys(loaded)) {
					if (!skills[key] || !loaded[key] || typeof loaded[key] !== 'object') continue;

					for (const [prop, val] of Object.entries(loaded[key])) {
						if (prop === 'name' || skills[key][prop] === undefined) continue;
						if (Array.isArray(skills[key][prop]) ? (Array.isArray(val) && val.length === skills[key][prop].length && val.every(Number.isFinite))
							: (typeof val === typeof skills[key][prop])) skills[key][prop] = val;
					}
				}
			}

			for (const u of (DEF.MEASURED_UPDATES || [])) {
				const entry = skills[u.key];
				const same = (o) => JSON.stringify(o) === JSON.stringify(entry[u.prop]);
				if (entry && (u.old || []).some(same)) entry[u.prop] = Array.isArray(u.value) ? u.value.slice() : u.value;
			}
			saveSkillData();
		} catch (e) {
			console.error(`[${NAME}] Error while loading skill_data.json:`, e);
		}
	}
	loadFiles();
	if (DEF.OMNI && config.OMNI) omni.start();

	let cid = null;
	let job = -1;
	let model = 0;
	let enabled = false;
	let showDebug = false;
	let mounted = false;
	let aspd = 1;

	let atkidBase = 0;
	let currentClientActionId = null;
	let action = null;
	let lastSkill = 0;
	let lastEvent = null;
	const disabSkill = {};
	const lastFakeFamilyAt = {};
	const serverAckAt = {};
	const passthroughIds = new Set();
	let lockonPrep = null;
	const reactionIds = new Set();

	let reaction = null;
	const REACTION_MAX_MS = 5000;
	const inReaction = () => Boolean(reaction && Date.now() < reaction.until);
	const serverStageAt = new Map();
	const retryEchoes = {};
	const activeAbnormals = new Set();
	let glyphState = {};

	let charge = null;
	let hold = null;
	let lastSpoofedGrant = 0;
	let blockGrant = false;
	let blockGrantTimer = null;
	let lastReleaseRequest = null;
	let jauntMoveBlockUntil = 0;
	let jauntDest = null;
	let jauntFrom = null;

	// Teleport Jaunt: the server lands this much short of the full distance (learned)
	let jauntShort = 16;
	let realClientLoc = null;
	const GATE_JAUNT_TOLERANCE = 60;
	const GATE_SNAP_TOLERANCE = 30;
	const JAUNT_HEIGHT_TOLERANCE = 8;

	let xloc, yloc, zloc, wloc;
	let actionLocUpdated = false;

	let realLoc = null;
	let lastMoveAt = 0;
	const MAX_XY_DEVIATION = 1200;
	const MAX_Z_DEVIATION = 200;
	const isValidLoc = (loc) => Boolean(loc) && Number.isFinite(loc.x) && Number.isFinite(loc.y) && Number.isFinite(loc.z) &&
		!(loc.x === 0 && loc.y === 0 && loc.z === 0);
	const noteRealLoc = (loc) => { if (isValidLoc(loc)) realLoc = { x: loc.x, y: loc.y, z: loc.z }; };
	const isClientMoving = () => Date.now() - lastMoveAt < 350;
	function sanitizeLoc(loc, context) {
		if (!realLoc) return isValidLoc(loc) ? { x: loc.x, y: loc.y, z: loc.z } : loc;
		if (!isValidLoc(loc) || Math.hypot(loc.x - realLoc.x, loc.y - realLoc.y) > MAX_XY_DEVIATION) {
			recordPacket('MOD', 'POSITION GUARD (XY replaced)', { context, bad: loc ? `${Math.round(loc.x)},${Math.round(loc.y)},${Math.round(loc.z)}` : 'null' });
			return { x: realLoc.x, y: realLoc.y, z: realLoc.z };
		}
		if (Math.abs(loc.z - realLoc.z) > MAX_Z_DEVIATION) {
			recordPacket('MOD', 'POSITION GUARD (Z replaced)', { context, badZ: Math.round(loc.z), realZ: Math.round(realLoc.z) });
			return { x: loc.x, y: loc.y, z: realLoc.z };
		}
		return { x: loc.x, y: loc.y, z: loc.z };
	}

	const predicting = () => enabled && !mounted && !config.LEARN_MODE && job === JOB;
	const familyDef = (id) => FAMILIES[groupOf(id)] || null;

	const lockKey = (id) => (typeof id === 'string' ? id : `${groupOf(id)}:${subOf(id)}`);
	const lockTimers = {};
	const isLocked = (id) => Boolean(disabSkill[lockKey(id)]);
	const lock = (id, ms) => {
		const k = lockKey(id);
		disabSkill[k] = true;
		clearTimeout(lockTimers[k]);
		lockTimers[k] = setTimeout(() => { disabSkill[k] = false; delete lockTimers[k]; }, Math.max(0, ms));
	};
	const unlock = (id) => {
		const k = lockKey(id);
		disabSkill[k] = false;
		clearTimeout(lockTimers[k]);
		delete lockTimers[k];
	};
	const unlockAll = () => { for (const k of Object.keys(disabSkill)) unlock(k); };

	const matchesSkill = (id, entry) => {
		if (typeof entry === 'number') return groupOf(id) === entry;
		const [g, s] = String(entry).split(':').map(Number);
		return groupOf(id) === g && (s === undefined || Number.isNaN(s) || subOf(id) === s);
	};
	const matchesAny = (id, list) => Array.isArray(list) && list.some(e => matchesSkill(id, e));
	const copyEvent = (event) => Object.assign({}, event, {
		loc: event.loc ? Object.assign({}, event.loc) : event.loc,
		dest: event.dest ? Object.assign({}, event.dest) : event.dest,
		skill: (event.skill && typeof event.skill === 'object') ? Object.assign({}, event.skill) : event.skill,
		targets: Array.isArray(event.targets) ? event.targets.map(t => Object.assign({}, t)) : event.targets
	});
	const withSkillId = (event, id) => {
		const copy = copyEvent(event);
		if (copy.skill && typeof copy.skill === 'object') copy.skill.id = id; else copy.skill = id;
		return copy;
	};

	function speedMult() {
		let m = 1;
		for (const [abn, mult] of Object.entries(DEF.SPEED_ABNORMALS || {})) {
			if (activeAbnormals.has(Number(abn))) m *= mult;
		}
		return m;
	}

	const isGlyph = (id) => glyphState[id] === true || glyphState[id] === 1;
	const glyphKey = (id) => `${groupOf(id)}:${subOf(id)}`;
	const learnedSpeed = {};
	const speedCandidates = {};
	const glyphFactors = {};
	const glyphCandidates = {};
	let chargeCorrection = 1;

	function knownGlyphSpeed(skillId) {
		if (!config.AUTO_GLYPH_SYNC) return 1;
		let m = 1;
		const g = groupOf(skillId);
		const used = new Set();
		for (const [crest, eff] of Object.entries(DEF.GLYPHS || {})) {
			if (!eff.speed || !(eff.groups || []).includes(g) || (eff.subs && !eff.subs.includes(subOf(skillId))) || !isGlyph(Number(crest))) continue;
			if (eff.exclusive) { if (used.has(eff.exclusive)) continue; used.add(eff.exclusive); }
			m *= eff.speed;
		}
		return m;
	}
	// glyphs that change how far a skill moves the character (e.g. less recoil)
	function knownGlyphDistance(skillId) {
		if (!config.AUTO_GLYPH_SYNC) return 1;
		let m = 1;
		const g = groupOf(skillId);
		for (const [crest, eff] of Object.entries(DEF.GLYPHS || {})) {
			if (!eff.distance || !(eff.groups || []).includes(g) || (eff.subs && !eff.subs.includes(subOf(skillId))) || !isGlyph(Number(crest))) continue;
			m *= eff.distance;
		}
		return m;
	}
	function knownChargeGlyph() {
		if (!config.AUTO_GLYPH_SYNC) return 1;
		let m = 1;
		const used = new Set();
		for (const [crest, eff] of Object.entries(DEF.GLYPHS || {})) {
			if (!eff.charge || !isGlyph(Number(crest))) continue;
			if (eff.exclusive) { if (used.has(eff.exclusive)) continue; used.add(eff.exclusive); }
			m *= eff.charge;
		}
		return m;
	}
	// DTmaik
	function learnedSpeedFor(skillId) {
		return config.AUTO_GLYPH_SYNC ? (learnedSpeed[glyphKey(skillId)] || 1) : 1;
	}
	function glyphFactor(id) {
		return config.AUTO_GLYPH_SYNC ? (glyphFactors[glyphKey(id)] || 1) : 1;
	}
	function resetGlyphFactors(reason) {
		const had = Object.keys(glyphFactors).length + Object.keys(learnedSpeed).length > 0 || chargeCorrection !== 1;
		for (const k of Object.keys(glyphFactors)) delete glyphFactors[k];
		for (const k of Object.keys(glyphCandidates)) delete glyphCandidates[k];
		for (const k of Object.keys(learnedSpeed)) delete learnedSpeed[k];
		for (const k of Object.keys(speedCandidates)) delete speedCandidates[k];
		chargeCorrection = 1;
		if (had) recordPacket('MOD', 'Learned glyph factors reset', { reason });
	}

	function debugChat(msg) {
		if (showDebug) sendChat(`<font color="#AAAAAA">[Debug]</font> ${msg}`);
	}

	function sendChat(msg, toConsole = false) {
		if (toConsole) console.log(`[${NAME}] ${String(msg).replace(/<[^>]*>/g, '')}`);

		msg = String(msg);
		const last = msg.lastIndexOf('</font>');
		if (last >= 0 && msg.slice(last + 7).trim()) msg = `${msg.slice(0, last + 7)}<font color="#FFFFFF">${msg.slice(last + 7)}</font>`;
		const text = `<font color="${DEF.COLOR || '#56B4E9'}">[${NAME}]</font> <font color="#FFFFFF">${msg}</font>`;
		try {
			if (dispatch.command && typeof dispatch.command.message === 'function') return dispatch.command.message(text);
		} catch (e) {}
		try {
			dispatch.toClient('S_CHAT', 2, { channel: 24, authorID: 0n, unk1: 0, gm: 0, unk2: 0, authorName: NAME, message: text });
		} catch (e) {}
	}
	const formatState = (s) => (s ? '<font color="#00FF88">ON</font>' : '<font color="#FF5555">OFF</font>');

	function tryHookMain(name, version, cb) {
		try { hook(name, version, cb); } catch (e) {  }
	}

	function skillLabel(id) {
		if (!id) return String(id);
		const fam = familyDef(id);
		if (!fam) return String(id);
		const data = dataOf(fam, subOf(id));
		return `${id} (${data ? data.name : (fam.label || fam.key || 'group ' + groupOf(id))}${subOf(id) ? ' #' + subOf(id) : ''})`;
	}

	const animSeqLearned = {};
	const animKey = (id, stage) => `${groupOf(id)}:${subOf(id)}:${stage}`;

	let animMoving = { skillId: 0, moving: false };
	function animSeqFor(skillId, stage) {
		// a glyph that changes the movement: the client animates the distance from animSeq, without it the full normal distance
		if (config.AUTO_GLYPH_SYNC && stage === 0) {
			for (const [crest, eff] of Object.entries(DEF.GLYPHS || {})) {
				if (!eff.animSeq || !(eff.groups || []).includes(groupOf(skillId)) || (eff.subs && !eff.subs.includes(subOf(skillId))) || !isGlyph(Number(crest))) continue;
				return eff.animSeq.map(x => Object.assign({}, x));
			}
		}
		const fam = familyDef(skillId);
		if (!fam || !fam.animSeq) return [];
		if (animMoving.moving && animMoving.skillId === skillId) return [];
		const seq = animSeqLearned[animKey(skillId, stage)] || (DEF.ANIM_SEQ || {})[animKey(skillId, stage)] || [];
		return seq.map(x => Object.assign({}, x));
	}
	function sendStage(skillId, stage, speed, loc, w, newId = true, moving = false, effectScale = 1.0) {
		if (newId || !action) atkidBase = nextActionId();
		const id = newId || !action ? atkidBase : action.id;
		currentClientActionId = id;
		lastFakeFamilyAt[groupOf(skillId)] = Date.now();
		loc = sanitizeLoc(loc, `stage ${skillId}`);
		dispatch.toClient('S_ACTION_STAGE', 9, {
			gameId: cid, loc: { x: loc.x, y: loc.y, z: loc.z }, w, templateId: model, skill: skillId,
			stage, speed, id, effectScale: Number(effectScale) || 1.0, moving: Boolean(moving), animSeq: animSeqFor(skillId, stage)
		});
		recordPacket('MOD->C', 'S_ACTION_STAGE', { skill: skillLabel(skillId), stage, speed: Number(speed).toFixed(3), id });
		return id;
	}

	// DTmaik
	function sendEnd(skillId, type, loc, w, id) {
		if (id === undefined || id !== currentClientActionId) {
			recordPacket('MOD->C', 'S_ACTION_END [DISCARDED: stale ID]', { skill: skillLabel(skillId), type, id, current: currentClientActionId });
			return false;
		}
		currentClientActionId = null;
		loc = sanitizeLoc(loc, `end ${skillId}`);
		predictedEnd[skillId] = { loc: { x: loc.x, y: loc.y, z: loc.z }, at: Date.now(), seq: atkidBase };
		dispatch.toClient('S_ACTION_END', 5, {
			gameId: cid, loc: { x: loc.x, y: loc.y, z: loc.z }, w, templateId: model, skill: skillId, type, id
		});
		recordPacket('MOD->C', 'S_ACTION_END', { skill: skillLabel(skillId), type, id, loc: fmtLoc(loc) });
		return true;
	}
	const predictedEnd = {};

	// copy of a request in case the first one gets lost; the server's refusals of copies are hidden
	function sendRetry(name, version, data) {
		const sid = getSkillId(data.skill);
		(retryEchoes[sid] = retryEchoes[sid] || []).push(Date.now());
		dispatch.toServer(name, version, data);
	}
	function consumeRetryEcho(sid) {
		const list = retryEchoes[sid];
		if (!list) return false;
		const now = Date.now();
		while (list.length && now - list[0] > RETRY_ECHO_WINDOW) list.shift();
		if (!list.length) return false;
		list.shift();
		return true;
	}

	function serverStartedSince(sid, t) {
		const fam = familyDef(sid);
		if (fam && fam.ackExact) return (serverSkillAckAt[sid] || 0) >= t;
		return (serverAckAt[groupOf(sid)] || 0) >= t;
	}
	const pendingCopies = {};
	let refuseTrack = null;
	function scheduleRetries(name, version, event, delays = RETRY_DELAYS) {
		const copy = copyEvent(event);
		const sid = getSkillId(copy.skill);
		const sentAt = Date.now();
		const rt = refuseTrack = { sid, at: sentAt, sent: 1, refused: 0 };
		for (const delay of delays) {
			pendingCopies[sid] = (pendingCopies[sid] || 0) + 1;
			setTimeout(() => {
				pendingCopies[sid] = Math.max(0, (pendingCopies[sid] || 1) - 1);
				if (lastSkill !== sid) return;
				if (serverStartedSince(sid, sentAt)) return;
				rt.sent++;
				sendRetry(name, version, copy);
			}, delay);
		}
	}

	function currentLoc(fallback) {
		return { x: xloc !== undefined ? xloc : fallback.x, y: yloc !== undefined ? yloc : fallback.y, z: zloc !== undefined ? zloc : fallback.z };
	}

	// Soaria
	// the server stopped a moving skill earlier (gate, wall): put the character back to that point
	function snapToLimit(a) {
		if (!a || !a.limitEnd) return null;
		const end = a.limitEnd;
		const now = realClientLoc || currentLoc(a.start);
		if (Math.hypot(now.x - end.x, now.y - end.y) > GATE_SNAP_TOLERANCE) {
			recordPacket('MOD->C', 'S_INSTANT_MOVE [GATE: back to the point the server allows]', { skill: skillLabel(a.skillId), off: Math.round(Math.hypot(now.x - end.x, now.y - end.y)) });
			debugChat(`Gate: ${skillLabel(a.skillId)} stopped by the server - moved back ${Math.round(Math.hypot(now.x - end.x, now.y - end.y))} units`);
			dispatch.toClient('S_INSTANT_MOVE', 3, { gameId: cid, loc: { x: end.x, y: end.y, z: end.z }, w: a.w });
		}
		xloc = end.x; yloc = end.y; zloc = end.z;
		realClientLoc = { x: end.x, y: end.y, z: end.z };
		return { x: end.x, y: end.y, z: end.z };
	}
	const endLocOf = (a) => snapToLimit(a) || currentLoc(a.start);

	// ends our running animation when the next skill starts; the client's own position is the end point
	function finishPrevious(nextSkillId, type, nextLoc) {
		if (!action || action.finished) return;
		clearActionTimers(action);
		action.finished = true;
		action.endAt = Date.now();
		if (type === null) return;
		const sameFamily = groupOf(action.skillId) === groupOf(nextSkillId);
		const loc = (!action.limitEnd && isValidLoc(nextLoc)) ? { x: nextLoc.x, y: nextLoc.y, z: nextLoc.z } : endLocOf(action);
		sendEnd(action.skillId, type !== undefined ? type : (sameFamily ? 6 : 4), loc, action.w, action.id);
	}

	function clearActionTimers(a) {
		if (!a) return;
		(a.timers || []).forEach(clearTimeout);
		a.timers = [];
		clearTimeout(a.endTimer);
		a.endTimer = null;
	}

	// shows a skill at once: stage 0 now, later stages and the end on timers at the predicted speed
	function startAction(event, skillId, opts) {
		if (subOf(skillId) >= 30 && !skillExists(skillId) && skillExists(skillId - 30)) {
			recordPacket('MOD', 'Chain ID not in the game data: shown as the normal skill', { skill: skillLabel(skillId) });
			skillId -= 30;
		}
		finishPrevious(skillId, opts.prevEndType, event.loc);

		const clsSpeed = (!opts.fixedSpeed && CLS.skillSpeed) ? (Number(CLS.skillSpeed(skillId)) || 1) : 1;
		const baseSpeed = (opts.fixedSpeed ? 1 : aspd * speedMult() * clsSpeed) * knownGlyphSpeed(skillId);
		const speed = baseSpeed * learnedSpeedFor(skillId);

		const factor = glyphFactor(skillId) * (CLS.durationFactor ? (Number(CLS.durationFactor(skillId)) || 1) : 1);
		const start = sanitizeLoc({ x: event.loc.x, y: event.loc.y, z: event.loc.z }, `start ${skillId}`);
		const w = event.w;
		xloc = start.x; yloc = start.y; zloc = start.z; wloc = w;
		actionLocUpdated = false;
		realClientLoc = null;

		animMoving = { skillId, moving: Boolean(event.moving) };
		const id = sendStage(skillId, 0, speed, start, w, true, opts.moving, opts.effectScale);
		const a = {
			skillId, id, start, w, speed, baseSpeed, finished: false, timers: [], endTimer: null,
			requestedAt: Date.now(), startedAt: Date.now(), dest: null, requestId: opts.requestId || skillId,
			normDuration: opts.duration * factor, endType: opts.endType || 0, onEnd: opts.onEnd, endLoc: opts.endLoc
		};
		action = a;

		const dist = (opts.distance || 0) * knownGlyphDistance(skillId);
		if (opts.dest) a.dest = { x: opts.dest.x, y: opts.dest.y, z: opts.dest.z };
		else if (dist) a.dest = { x: start.x + Math.cos(w) * dist, y: start.y + Math.sin(w) * dist, z: start.z };

		for (const st of (opts.stages || [])) {
			a.timers.push(setTimeout(() => {
				if (action !== a || a.finished) return;
				sendStage(skillId, st.stage, a.speed, opts.stageLoc ? opts.stageLoc(st.stage, start, w) : currentLoc(start), w, false, opts.moving, opts.effectScale);
				currentClientActionId = a.id;
				if (opts.onStage) opts.onStage(st.stage, a);
			}, st.at * factor / speed));
		}

		const ms = Math.max(50, a.normDuration / speed);
		scheduleActionEnd(a, ms);

		// no confirmation from the server in time: end the animation instead of leaving a ghost
		if (config.GHOST_FIX) {
			const timeout = Math.max(300, Number(config.GHOST_TIMEOUT) || 1000);
			if (timeout < ms) {
				a.timers.push(setTimeout(() => {
					if (action !== a || a.finished) return;
					if (serverStartedSince(skillId, a.requestedAt)) return;
					a.finished = true;
					clearActionTimers(a);
					unlock(skillId);
					recordPacket('MOD', 'GHOST PROTECTION: server did not confirm', { skill: skillLabel(skillId) });
					sendEnd(skillId, 2, currentLoc(start), w, a.id);
					if (lastSkill === skillId) lastSkill = 0;
				}, timeout));
			}
		}
		return a;
	}

	function scheduleActionEnd(a, ms) {
		clearTimeout(a.endTimer);
		a.endAt = a.startedAt + ms;
		a.endTimer = setTimeout(() => {
			if (action !== a || a.finished || lastSkill === 1) return;
			a.finished = true;
			clearActionTimers(a);
			const end = a.limitEnd ? snapToLimit(a) : ((a.endLoc && a.endLoc()) || ((actionLocUpdated || !a.dest) ? currentLoc(a.start) : a.dest));
			xloc = end.x; yloc = end.y; zloc = end.z;
			sendEnd(a.skillId, a.endType, end, a.w, a.id);
			if (a.onEnd) a.onEnd();
		}, Math.max(0, a.endAt - Date.now()));
	}

	function predictedSubs(fam) {
		const extra = Object.keys(fam.extraSubs || {}).map(Number).concat(fam.serverSubs || []);
		const chainSubs = (fam.chains || []).map(c => c.sub);
		switch (fam.mode) {
			case 'simple': return (fam.subs || [0]).concat(chainSubs, extra);
			case 'combo': return (fam.subs || [0, 1, 2, 3]).concat(chainSubs, extra);
			case 'stages': return (fam.subs || [0]).concat(extra);
			case 'jaunt': return fam.subs || [0];
			case 'charge': return (fam.subs || [0]).concat(fam.releaseSubs || [10, 11, 12], extra);
			case 'hold': return (fam.subs || [0]).concat(fam.releaseSub === null ? [] : [fam.releaseSub || 11], extra);
			case 'chain': return [fam.chainSub || 30];
			case 'lockon': return (config.PREDICT_LOCKON && fam.predictCast !== false) ? [fam.castSub || 10] : [];
			case 'custom': return (fam.subs || [0]).concat(extra);
			default: return [];
		}
	}
	// Abdull
	function isPredictedServerSkill(id) {
		const fam = familyDef(id);
		return Boolean(fam && predictedSubs(fam).includes(subOf(id)));
	}

	function dataOf(fam, sub) {
		if (!fam) return null;
		if (fam.keys && fam.keys[sub] !== undefined) return skills[fam.keys[sub]] || null;
		return skills[fam.key] || null;
	}
	function durationOf(fam, sub, data = dataOf(fam, sub)) {
		if (!data) return 0;
		if (Array.isArray(data.durations)) return data.durations[Math.min(sub, data.durations.length - 1)];
		if (Array.isArray(data.stages)) return data.stages.reduce((s, x) => s + x, 0);
		return data.duration;
	}

	let serverActive = null;
	const serverSkillAckAt = {};

	let prevSkill = 0;
	function lastStillRunning(id = lastSkill) {
		if (!id || id === 1) return false;
		if (action && !action.finished && action.requestId === id) return true;
		return Boolean(serverActive && groupOf(serverActive.id) === groupOf(id) && Date.now() - serverActive.at < 4000);
	}

	function chainSource(fam) {
		for (const ch of (fam.chains || [])) {
			if (matchesAny(prevSkill, ch.from) && sourceStillRunning(prevSkill)) return ch;
		}
		return null;
	}
	function sourceStillRunning(id) {
		if (!id || id === 1) return false;
		const a = action;
		if (!a || a.requestId !== id) return false;
		if (!a.finished) return true;
		if (!serverActive || groupOf(serverActive.id) !== groupOf(id) || !a.speed) return false;
		const seen = serverStageAt.get(serverActive.actionId) || serverActive.at;

		return Date.now() < seen + a.normDuration / a.speed - estimateRtt() - 50;
	}

	const rttSamples = [];
	// Soaria
	function noteRtt(ms) {
		if (!(ms > 0 && ms < 2000)) return;
		rttSamples.push(ms);
		if (rttSamples.length > 10) rttSamples.shift();
	}
	function estimateRtt() {
		return rttSamples.length ? Math.min(...rttSamples) : (Number(config.GLOBAL_LATENCY) || 100);
	}

	function resolveTarget(sid, offset) {
		if (CLS.resolveId) return CLS.resolveId(sid, offset);
		return sid + offset;
	}

	function applyLocks(fam, sid, a) {
		const actionMs = a ? a.normDuration / a.speed : 0;
		const msOf = (v, l) => {
			if (v === 'duration') return actionMs + (l.extra || 0) / (l.fixed ? 1 : aspd);
			if (typeof v === 'string' && skillDataValue(sid, v) !== undefined) return (skillDataValue(sid, v) + (l.extra || 0)) / (l.fixed ? 1 : aspd);
			return Number(v) || 0;
		};
		if (fam.unlockAll) unlockAll();
		for (const k of (fam.unlocks || [])) unlock(k);
		for (const l of (fam.locks || [])) lock(l.skill, msOf(l.ms, l));
		const self = fam.selfLock !== undefined ? fam.selfLock : GLOBAL_LOCK_DELAY;
		if (self) lock(sid, self === 'duration' ? actionMs : self);
	}
	function skillDataValue(sid, prop) {
		const data = dataOf(familyDef(sid), subOf(sid));
		return data && typeof data[prop] === 'number' ? data[prop] : undefined;
	}

	function shouldDrop(sid) {
		const g = groupOf(sid);
		const hf = familyDef(sid);
		const isHold = Boolean(hf && hf.mode === 'hold');
		if (action && !action.finished && !action.isCharge) {
			const af = familyDef(action.skillId);
			const ao = famOpts(af, action.skillId);
			if (ao && ao.cancelOnlyBy && g !== groupOf(action.skillId) && !matchesAny(sid, ao.cancelOnlyBy)) return 'cannot interrupt ' + skillLabel(action.skillId);
		}
		if (charge && !charge.released && !isHold && g !== groupOf(charge.skillId)) {
			const cf = familyDef(charge.skillId);
			if (cf && cf.dropWhileCharging) return 'charging ' + skillLabel(charge.skillId);
		}
		return null;
	}

	// DTmaik
	function stageOffsets(data) {
		const out = [];
		let acc = 0;
		(data.stages || []).forEach((d, i) => {
			if (i > 0) out.push({ at: acc, stage: i });
			acc += d;
		});
		return out;
	}

	function predictChargeRelease(event, fam, extra) {
		const sid = getSkillId(event.skill);
		const data = dataOf(fam, subOf(sid)) || {};
		if (charge) { charge.timers.forEach(clearTimeout); charge = null; }
		lastReleaseRequest = Object.assign(copyEvent(event), { at: Date.now() });
		const replace = fam.releaseNoEnd && action && !action.finished && action.isCharge && groupOf(action.skillId) === groupOf(sid);
		return startAction(event, sid, Object.assign({
			duration: data.releaseDuration, distance: data.distance || 0, fixedSpeed: Boolean(fam.releaseFixedSpeed),
			prevEndType: replace ? null : 4, requestId: sid, effectScale: fam.releaseEffectScale
		}, extra || {}));
	}

	function famOpts(fam, sid) {
		if (!fam || !fam.bySub || !fam.bySub[subOf(sid)]) return fam;
		return Object.assign({}, fam, fam.bySub[subOf(sid)]);
	}

	// decides whether a skill request is shown at once and how (chain, variant, locks)
	function predictStart(event) {
		const sid = getSkillId(event.skill);
		const fam = familyDef(sid);
		if (!fam) return false;
		const sub = subOf(sid);
		const data = dataOf(fam, sub);
		if (!data) return false;

		switch (fam.mode) {
			case 'simple':
			case 'combo': {
				if (!(fam.subs || (fam.mode === 'combo' ? [0, 1, 2, 3] : [0])).includes(sub)) return false;

				let ch = (sub === 0 || fam.mode === 'combo' || (fam.chainOnSubs || []).includes(sub)) ? chainSource(fam) : null;
				if (ch && !skillExists(ch.base ? baseOf(sid) + ch.sub : resolveTarget(sid, ch.sub))) {
					recordPacket('MOD', 'Chain ID not in the game data: normal skill predicted', { skill: skillLabel(sid) });
					ch = null;
				}

				const target = ch && ch.base ? baseOf(sid) + ch.sub : resolveTarget(sid, ch ? ch.sub : 0);
				const sameCombo = fam.mode === 'combo' && action && !action.finished && groupOf(action.skillId) === groupOf(sid);
				const a = startAction(event, target, {
					duration: ch ? (data[ch.durationKey || 'chainDuration'] || durationOf(fam, sub, data)) : durationOf(fam, sub, data),
					distance: (ch && ch.distanceKey !== undefined ? data[ch.distanceKey] : (ch && ch.distance !== undefined ? ch.distance : data.distance)) || 0,
					fixedSpeed: Boolean(famOpts(fam, sid).fixedSpeed),
					prevEndType: sameCombo ? 6 : (famOpts(fam, sid).prevEndType !== undefined ? famOpts(fam, sid).prevEndType : DEF.PREV_END_TYPE),
					endType: famOpts(fam, sid).endType,
					requestId: sid
				});
				if (ch) recordPacket('MOD', 'Chain predicted', { skill: skillLabel(target), after: skillLabel(prevSkill) });
				armCancelGuard(fam, a);
				return true;
			}
			case 'stages': {
				if (!(fam.subs || [0]).includes(sub)) return false;
				startAction(event, resolveTarget(sid, 0), {
					duration: durationOf(fam, sub, data),
					distance: data.distance || 0,
					fixedSpeed: Boolean(famOpts(fam, sid).fixedSpeed),
					stages: stageOffsets(data),
					requestId: sid
				});
				return true;
			}
			case 'jaunt': {
				if (sub !== 0 || !event.dest) return false;
				if (omniTurned && omniTurned.sid === sid && Date.now() - omniTurned.at < 100) {
					omniTurned = null;
					recordPacket('MOD', 'OMNI: turned Teleport Jaunt goes through the server (height of the target unknown)', { skill: skillLabel(sid) });
					return false;
				}
				const [s0, s1] = data.stages;

				const full = Math.hypot(event.dest.x - event.loc.x, event.dest.y - event.loc.y);
				const k = full > jauntShort + 50 ? (full - jauntShort) / full : 1;
				const dest = { x: event.loc.x + (event.dest.x - event.loc.x) * k, y: event.loc.y + (event.dest.y - event.loc.y) * k, z: event.dest.z };
				jauntFrom = { x: event.loc.x, y: event.loc.y, full };
				const a = startAction(event, sid, { duration: s0 + s1, stages: [{ at: s0, stage: 1 }], dest });
				const speed = a.speed;
				jauntMoveBlockUntil = Date.now() + (s0 + s1) / speed + 1500;
				jauntDest = { x: dest.x, y: dest.y, z: dest.z };
				a.timers.push(setTimeout(() => {
					if (action !== a || a.finished) return;
					dispatch.toClient('S_INSTANT_MOVE', 3, { gameId: cid, loc: dest, w: event.w });
					xloc = dest.x; yloc = dest.y; zloc = dest.z;
					actionLocUpdated = true;
					recordPacket('MOD->C', 'S_INSTANT_MOVE', { loc: `${Math.round(dest.x)},${Math.round(dest.y)}` });
				}, s0 / speed + (data.moveDelay || 0)));
				return true;
			}
			case 'charge': {
				const releaseSubs = fam.releaseSubs || [10, 11, 12];
				if (!releaseSubs.includes(sub)) return false;
				predictChargeRelease(event, fam, {});
				return true;
			}
			case 'chain': {
				if (sub !== 0) return false;
				const src = action && (fam.chainFrom || []).includes(groupOf(action.skillId));
				const inWindow = src && (!action.finished || Date.now() - (action.endAt || 0) < CHAIN_WINDOW);
				if (!inWindow) return false;
				const target = baseOf(sid) + (fam.chainSub || 30);
				startAction(event, target, { duration: data.duration, distance: data.distance || 0, prevEndType: 4 });
				lastFakeFamilyAt[groupOf(sid)] = Date.now();
				return true;
			}
			case 'lockon': {
				if (!config.PREDICT_LOCKON || fam.predictCast === false || sub !== (fam.castSub || 10)) return false;
				if (!lockonPrep || lockonPrep.group !== groupOf(sid) || currentClientActionId !== lockonPrep.id) return false;
				const prep = lockonPrep;
				lockonPrep = null;
				sendEnd(prep.skillId, 35, currentLoc(prep.loc), prep.w, prep.id);
				startAction(event, sid, {
					duration: durationOf(fam, sub),
					fixedSpeed: Boolean(fam.fixedSpeed),
					moving: Boolean(fam.moving),
					stages: stageOffsets(data)
				});
				return true;
			}
			default:
				return false;
		}
	}

	function cancelChargeAndHold(sid) {
		if (charge && groupOf(sid) !== groupOf(charge.skillId)) {
			recordPacket('MOD', 'Charging cancelled by another skill', { skill: skillLabel(charge.skillId), by: skillLabel(sid) });
			resetCharge();
		}
		if (hold && groupOf(sid) !== groupOf(hold.skillId)) {
			recordPacket('MOD', 'Holding cancelled by another skill', { skill: skillLabel(hold.skillId), by: skillLabel(sid) });
			hold = null;
		}
	}

	const unpredictedAt = {};
	// exact: this skill passes through even while a predicted skill of its group runs (a class sent it without prediction)
	const unpredictedExactAt = {};
	function markUnpredicted(sid, exact) {
		unpredictedAt[groupOf(sid)] = Date.now();
		if (exact) unpredictedExactAt[sid] = Date.now();
	}
	const skillOff = (sid) => { const n = SWITCH_OF_GROUP[groupOf(sid)]; return Boolean(n) && (config.SKILL_PREDICTION || {})[n] === false; };
	// a switched off skill goes to the server like without the mod (the class may delay it behind a held request)
	function passOff(name, version, event, sid) {
		recordPacket('MOD', 'Sent without prediction (skill switched off)', { skill: skillLabel(sid) });
		cancelChargeAndHold(sid);
		lastSkill = sid; lastEvent = event;
		markUnpredicted(sid);
		if (CLS.passOff && CLS.passOff(name, version, event) === true) return false;
		return undefined;
	}
	// Abdull
	function handleStart(name, version, event, allowRetry) {
		if (!predicting()) return;
		const t0 = Date.now();
		const res = handleStartInner(name, version, event, allowRetry);
		const sid = getSkillId(event.skill);
		const predicted = Boolean(action && action.requestedAt >= t0 && action.requestId === sid);
		if ((res !== false || skillOff(sid)) && !predicted && isPlayerSkill(event.skill)) markUnpredicted(sid);
		else delete unpredictedAt[groupOf(sid)];
		return res;
	}
	function handleStartInner(name, version, event, allowRetry) {
		if (grantFix && !grantFix.sent && getSkillId(event.skill) === grantFix.from && Date.now() < grantFix.until) {
			grantFix.sent = true;
			recordPacket('MOD->S', 'Release rewritten to the charge level the server granted', { from: skillLabel(grantFix.from), to: skillLabel(grantFix.to) });
			event = withSkillId(event, grantFix.to);
			const verdict = handleStart(name, version, event, allowRetry);
			if (verdict !== false) dispatch.toServer(name, version, event);
			return false;
		}
		const sid = getSkillId(event.skill);
		const fam = familyDef(sid);
		if (isPlayerSkill(event.skill) && skillOff(sid)) return passOff(name, version, event, sid);
		if (isPlayerSkill(event.skill) && !BLACKLIST.has(sid)) {
			const dropReason = shouldDrop(sid);
			if (dropReason) {
				recordPacket('MOD', 'Skill dropped', { skill: skillLabel(sid), reason: dropReason });
				return false;
			}
		}
		if (inReaction() && isPlayerSkill(event.skill)) {
			recordPacket('MOD', 'Sent without prediction (reaction running)', { skill: skillLabel(sid) });
			return;
		}

		if (CLS.start) {
			const verdict = CLS.start(event, { sid, fam, name, version, allowRetry });
			if (verdict === 'drop') return false;
			if (verdict === 'pass' || verdict === 'done') {
				cancelChargeAndHold(sid);
				lastSkill = sid; lastEvent = event;
				return;
			}
		}
		cancelChargeAndHold(sid);

		if (fam && fam.mode === 'passthrough') {
			lastSkill = sid; lastEvent = event;
			return;
		}
		if (fam && fam.mode === 'lockon') {
			const isCast = subOf(sid) === (fam.castSub || 10);
			lastSkill = sid; lastEvent = event;
			if (isCast && releaseWithoutTarget(sid)) return false;

			const castWhilePending = isCast && lockTrack && lockTrack.group === groupOf(sid) && lockTrack.pending.size && !lockTrack.confirmed.size;
			if (!isCast) { startLockTrack(sid); armLockTimeout(fam, sid); }
			else { if (castWhilePending) lockTrack.castId = sid; else lockTrack = null; clearLockTimeout(); }
			if (isLocked(sid) || !isPlayerSkill(event.skill)) return;

			if (predictStart(event)) lock(sid, GLOBAL_LOCK_DELAY);
			return;
		}
		clearLockTimeout();
		if (isLocked(sid)) return;

		const player = isPlayerSkill(event.skill) && !BLACKLIST.has(sid);
		const fo = famOpts(fam, sid);

		const running = lastRunningHere() ? lastSkill : realActionRunning();
		if (player && fo && fo.interruptOnly && running && !matchesAny(running, fo.interruptOnly)) {
			recordPacket('MOD', 'Not predicted (cannot interrupt the running skill)', { skill: skillLabel(sid), running: skillLabel(running) });
			return;
		}

		if (player && fam && running && refusedPairs.has(pairKey(running, sid))) {
			recordPacket('MOD', 'Not predicted (server refused it during this skill before)', { skill: skillLabel(sid), running: skillLabel(running) });
			return;
		}

		if (player && fam && fam.mode !== 'lockon') {
			const cdLeft = (cooldownUntil[sid] || 0) - Date.now() - estimateRtt() / 2;
			if (cdLeft > 50) {
				recordPacket('MOD', 'Not predicted (still on cooldown on the server)', { skill: skillLabel(sid), left: Math.round(cdLeft) });
				return;
			}
		}

		let holdMs = 0;
		if (player && CLS.requestDelay) holdMs = Number(CLS.requestDelay(sid, running, event)) || 0;
		if (player && heldRequests.length) holdMs = Math.max(holdMs, 1);
		const holding = holdMs > 0;
		const isRelease = fam && fam.mode === 'charge' && (fam.releaseSubs || [10, 11, 12]).includes(subOf(sid));
		const retryMode = isRelease ? (fam && fam.releaseRetry) : (fo && fo.retry !== undefined ? fo.retry : RETRY_DELAYS);
		if (player && fam && fam.mode !== 'passthrough' && (retryMode === 'confirm' || retryMode === 'track')) trackRequest(name, version, event, allowRetry && retryMode === 'confirm', holding ? holdMs : 0);
		const retry = fo && fo.retry !== undefined ? fo.retry : RETRY_DELAYS;
		if (!holding && allowRetry && player && fam && !isRelease && Array.isArray(retry) && retry.length) scheduleRetries(name, version, event, retry);
		if (!holding && allowRetry && player && isRelease && Array.isArray(fam.releaseRetry)) scheduleReleaseRetries(name, version, event, fam);

		prevSkill = lastSkill;
		lastSkill = sid;
		lastEvent = event;
		if (!player) return;
		lastStartReq = { name, version, event: copyEvent(event), at: Date.now() };

		if (predictStart(event)) {
			action.during = running || 0;
			applyLocks(fo, sid, action);
			if (CLS.predicted) CLS.predicted(sid, action, fam);
		}
		if (holding) { holdRequest(name, version, event, holdMs); return false; }
	}

	const refusedPairs = new Set();
	const pairKey = (runningId, sid) => `${groupOf(runningId)}>${groupOf(sid)}`;
	let lastServerEnd = null;
	function noteRefusedDuring(a) {
		if (!a || !a.during || groupOf(a.during) === groupOf(a.requestId || a.skillId)) return;
		const key = pairKey(a.during, a.requestId || a.skillId);
		if (refusedPairs.has(key)) return;
		refusedPairs.add(key);
		recordPacket('MOD', 'LEARNED: server refuses this skill during the running one', { skill: skillLabel(a.requestId || a.skillId), running: skillLabel(a.during) });
		debugChat(`Learned: ${skillLabel(a.requestId || a.skillId)} is refused by the server during ${skillLabel(a.during)} - not predicted there any more`);
	}

	function lastRunningHere() {
		return Boolean(lastSkill && lastSkill !== 1 && action && !action.finished && action.requestId === lastSkill);
	}

	function realActionRunning() {
		if (!serverActive || currentClientActionId === null || currentClientActionId !== serverActive.actionId) return 0;
		return serverActive.id;
	}

	let req = null;
	// delay: the request is held back that long first, the resend counts from when it really goes out
	function trackRequest(name, version, event, resend, delay = 0) {
		const sid = getSkillId(event.skill);
		const r = { group: groupOf(sid), sid, at: Date.now() + delay, copy: resend ? { name, version, event: copyEvent(event) } : null, retries: 0, copies: 0, rejects: 0, confirmed: false };
		req = r;
		if (resend) setTimeout(() => { if (r.retries === 0) resendRequest(r); }, delay + estimateRtt() + 80);
		return r;
	}
	// Soaria
	function resendRequest(r) {
		if (req !== r || r.confirmed || !r.copy) return;
		r.retries++;
		r.copies++;
		sendRetry(r.copy.name, r.copy.version, r.copy.event);
	}

	function confirmRequest(sid) {
		const r = req;
		if (!r || r.confirmed || groupOf(sid) !== r.group) return;
		r.confirmed = true;
		const list = retryEchoes[r.sid];
		if (!list) return;
		const outstanding = Math.max(0, r.copies - r.rejects);
		while (list.length > outstanding) list.shift();
	}

	function requestRejected(sid) {
		const r = req;
		if (!r || r.confirmed || groupOf(sid) !== r.group) return false;
		if (r.copy && (r.retries === 0 || (r.retries === 1 && Date.now() - r.at > 250))) {
			setTimeout(() => resendRequest(r), 50);
			setTimeout(() => resendRequest(r), 110);
		}
		const a = action;
		setTimeout(() => {
			if (req !== r || r.confirmed || !a || action !== a || a.finished || groupOf(a.skillId) !== r.group) return;
			a.finished = true;
			clearActionTimers(a);
			recordPacket('MOD', 'GHOST PROTECTION: server refused the request', { skill: skillLabel(a.skillId) });
			noteRefusedDuring(a);
			sendEnd(a.skillId, 6, realLoc || currentLoc(a.start), a.w, a.id);
			if (CLS.rejected) CLS.rejected(a);
		}, 260);
		return true;
	}

	function scheduleReleaseRetries(name, version, event, fam) {
		const copy = copyEvent(event);
		const sid = getSkillId(copy.skill);
		const base = baseOf(sid);
		const sentAt = Date.now();
		const press = lastPresses[base];
		for (const delay of fam.releaseRetry) {
			setTimeout(() => {
				if (lastSkill !== sid || (serverSkillAckAt[sid] || 0) >= sentAt) return;
				if (press && press.down && press.up && (serverSkillAckAt[base] || 0) < press.at) {
					recordPacket('MOD->S', 'C_PRESS_SKILL [release retry: charge press repeated]', { skill: skillLabel(base), delay });
					sendRetry('C_PRESS_SKILL', 4, press.down);
					sendRetry('C_PRESS_SKILL', 4, press.up);
				}
				sendRetry(name, version, copy);
			}, delay);
		}
	}
	const lastPresses = {};
	let lastStartReq = null;

	let omniTurned = null;
	// omnidirectional: turns the skill to the held W/A/S/D direction before the server sees it
	function omniTurn(event, targeted) {
		if (!DEF.OMNI || !config.OMNI || job !== JOB || !event.loc || !omni.anyKey()) return false;
		const id = getSkillId(event.skill);
		const o = DEF.OMNI[`${groupOf(id)}:${subOf(id)}`] || DEF.OMNI[groupOf(id)];
		if (!o || Boolean(o.targeted) !== targeted) return false;
		if (targeted && !o.dest) return false;
		const w = omni.angle(event.w, o.dir === 'south');
		if (o.dest) {
			event.dest = { x: event.loc.x + Math.cos(w) * o.dest, y: event.loc.y + Math.sin(w) * o.dest, z: event.loc.z };
			omniTurned = { sid: id, at: Date.now() };
		}
		event.w = w;
		recordPacket('MOD', 'OMNI: skill turned', { skill: skillLabel(id), w: Math.round(w * 100) / 100, dest: o.dest ? `${Math.round(event.dest.x)},${Math.round(event.dest.y)}` : '-' });
		return true;
	}
	hook('C_START_SKILL', 7, { order: -900 }, (event) => (omniTurn(event, false) ? true : undefined));
	hook('C_START_TARGETED_SKILL', 6, { order: -900 }, (event) => (omniTurn(event, true) ? true : undefined));

	hook('C_START_SKILL', 7, { order: -10 }, (event) => {
		if (!enabled || job !== JOB || !event.dest || !event.loc) return;
		const fam = familyDef(getSkillId(event.skill));
		if (!fam || !fam.flatAimConfig || !config[fam.flatAimConfig]) return;

		let dx = event.dest.x - event.loc.x;
		let dy = event.dest.y - event.loc.y;
		let side = Math.hypot(dx, dy);
		if (side < 50) { dx = Math.cos(event.w); dy = Math.sin(event.w); side = 1; }
		const range = fam.flatAimRange || 1000;
		const height = fam.flatAimHeight !== undefined ? fam.flatAimHeight : 25;
		event.dest = { x: event.loc.x + (dx / side) * range, y: event.loc.y + (dy / side) * range, z: event.loc.z + height };
		recordPacket('MOD', 'Aim flattened', { skill: skillLabel(getSkillId(event.skill)) });
		return true;
	});

	hook('C_START_SKILL', 7, (event) => handleStart('C_START_SKILL', 7, event, true));
	hook('C_START_COMBO_INSTANT_SKILL', 4, (event) => handleStart('C_START_COMBO_INSTANT_SKILL', 4, event, true));
	hook('C_START_INSTANCE_SKILL', 5, (event) => handleStart('C_START_INSTANCE_SKILL', 5, event, true));

	hook('C_START_TARGETED_SKILL', 6, (event) => {
		if (!predicting() || inReaction()) return;
		const sid = getSkillId(event.skill);
		if (skillOff(sid)) return passOff('C_START_TARGETED_SKILL', 6, event, sid);
		if (CLS.targeted) {
			const verdict = CLS.targeted(event, { sid, fam: familyDef(sid) });
			if (verdict === 'drop') return false;
		}
		cancelChargeAndHold(sid);
		lastSkill = sid;
		lastEvent = event;
	});

	function grantSkill(skillId) {
		clearTimeout(blockGrantTimer);
		blockGrant = true;
		blockGrantTimer = setTimeout(() => { blockGrant = false; }, 500);
		lastSpoofedGrant = skillId;
		dispatch.toClient('S_GRANT_SKILL', 3, { skill: skillId });
		recordPacket('MOD->C', 'S_GRANT_SKILL', { skill: skillLabel(skillId) });
	}

	// Abdull
	function resetCharge() {
		if (charge) charge.timers.forEach(clearTimeout);
		charge = null;
	}

	let pressCopy = null;
	let pressCopyAt = 0;
	let pressRetryCount = 0;
	function pressRetries(event, fam) {
		pressCopy = copyEvent(event);
		pressCopyAt = Date.now();
		pressRetryCount = 0;
		if (!fam || !fam.pressRetry) return;
		const sid = getSkillId(event.skill);
		const copy = pressCopy;
		const pressAt = Date.now();
		for (const delay of fam.pressRetry) {
			setTimeout(() => {
				if (!pressStillHeld(sid) || pressCopy !== copy || (serverSkillAckAt[sid] || 0) >= pressAt) return;
				recordPacket('MOD->S', 'C_PRESS_SKILL [press retry]', { skill: skillLabel(sid), delay });
				sendRetry('C_PRESS_SKILL', 4, copy);
			}, delay);
		}
	}
	function pressStillHeld(sid) {
		return (charge && charge.skillId === sid && !charge.released) || (hold && hold.skillId === sid);
	}

	function chargeSpeedFor(sid) {
		if (CLS.chargeSpeed) {
			const v = CLS.chargeSpeed(sid);
			if (v > 0) return v;
		}
		return aspd * knownChargeGlyph();
	}

	function chargeStageTime(nominal, c) {
		return nominal * chargeCorrection / (c ? c.speed : chargeSpeedFor(0)) + (c ? (c.margin || 0) : 0);
	}

	function showChargeLevel(c, level, waited = 0) {
		if (charge !== c || c.released || !action || action.skillId !== c.skillId || level <= c.level) return;
		if (c.waitServer && c.serverLevel < level - 1) {
			const grace = (Number(config.GLOBAL_LATENCY) || 100) + 250;
			if (waited < grace) {
				c.timers.push(setTimeout(() => showChargeLevel(c, level, waited + 30), 30));
				return;
			}
			recordPacket('MOD', 'Charge display paused (server not charging yet / stopped)', { skill: skillLabel(c.skillId), shown: c.level, server: c.serverLevel });
			c.waitStopped = true;
			return;
		}
		c.level = level;
		c.shownAt[level] = Date.now();
		const stW = (lastPlayerLocAt > c.startedAt && wloc !== undefined) ? wloc : c.w;
		sendStage(c.skillId, level, c.stageSpeed, currentLoc(c.start), stW, false);
		currentClientActionId = action.id;
		if (level >= c.stages.length && CLS.chargeFull) CLS.chargeFull(c.skillId);
		if (level < c.stages.length) {
			c.timers.push(setTimeout(() => showChargeLevel(c, level + 1), Math.max(0, chargeStageTime(c.stages[level], c))));
		}
	}

	// Soaria
	function scheduleChargeStages(c, fromLevel, at) {
		c.timers.forEach(clearTimeout);
		c.timers = [];
		if (fromLevel >= c.stages.length) return;
		c.nextAt = at || Date.now() + chargeStageTime(c.stages[fromLevel], c);
		c.timers.push(setTimeout(() => showChargeLevel(c, fromLevel + 1), Math.max(0, c.nextAt - Date.now())));
	}

	function releaseCharge(fam, c) {
		const releaseSubs = fam.releaseSubs || [10, 11, 12];
		let level = c.level;
		const late = (Number(config.GLOBAL_LATENCY) || 100) + 150;
		if (c.serverLevel >= 0 && c.serverLevel < level && Date.now() - (c.shownAt[level] || 0) > late) {
			recordPacket('MOD', 'Release level taken from the server', { skill: skillLabel(c.skillId), ours: level, server: c.serverLevel });
			level = c.serverLevel;
		}
		const grantId = baseOf(c.skillId) + releaseSubs[Math.min(level, releaseSubs.length - 1)];
		c.timers.forEach(clearTimeout);
		c.released = true;
		if (config.SPOOF_GRANT) grantSkill(grantId);

		const wd = DEF.CHARGE_WATCHDOG || Math.max(300, Number(config.GHOST_TIMEOUT) || 1000);
		const a = action;
		c.watchdog = setTimeout(() => {
			if (action !== a || !a || a.finished || !a.isCharge || a.skillId !== c.skillId) return;
			recordPacket('MOD', 'CHARGE WATCHDOG: no release came, charge ended', { skill: skillLabel(c.skillId) });
			a.finished = true;
			clearActionTimers(a);
			if (charge === c) charge = null;
			sendEnd(c.skillId, 0, realLoc || currentLoc(c.start), c.w, a.id);
		}, wd);
	}

	function chargeServerStage(event) {
		const c = charge;
		const now = Date.now();
		c.serverLevel = Math.max(c.serverLevel, event.stage);
		if (event.stage === 0) {
			c.serverStart = now; c.serverLast = now;

			if (c.anchor && !c.waitStopped && c.level < c.stages.length) {
				const at = now - estimateRtt() + chargeStageTime(c.stages[c.level], c);
				if (at > c.nextAt + 5) {
					recordPacket('MOD', 'Charge stage moved later (server started charging late)', { skill: skillLabel(c.skillId), by: Math.round(at - c.nextAt) });
					scheduleChargeStages(c, c.level, at);
				}
			}

			if (c.waitStopped && c.level < c.stages.length) {
				c.waitStopped = false;
				c.timers.forEach(clearTimeout);
				c.timers = [];
				recordPacket('MOD', 'Charge display resumed (server started charging)', { skill: skillLabel(c.skillId) });
				c.timers.push(setTimeout(() => showChargeLevel(c, c.level + 1), Math.max(0, chargeStageTime(c.stages[c.level], c))));
			}
			return;
		}
		c.waitStopped = false;
		if (!c.serverStart) return;
		const stageIdx = event.stage - 1;
		const measured = now - (c.serverLast || c.serverStart);
		c.serverLast = now;
		// compare without the safety margin, else the learned factor ends up too fast and eats the margin
		const expected = (chargeStageTime(c.stages[stageIdx] || 0, c) - (c.margin || 0)) / chargeCorrection;
		if (expected > 50 && measured > 50) {
			const corr = Math.round((measured / expected) * 100) / 100;
			if (corr > 0.5 && corr < 1.6 && Math.abs(corr - chargeCorrection) > 0.05) {
				chargeCorrection = corr;
				recordPacket('MOD', 'Charge speed corrected', { factor: corr });
			}
		}

		if (c.level < event.stage) {
			c.timers.forEach(clearTimeout);
			c.timers = [];
			const wasWaiting = c.waitServer;
			c.waitServer = false;
			showChargeLevel(c, event.stage);
			c.waitServer = wasWaiting;
		}
	}

	function startCharge(fam, event, opts = {}) {
		const sid = getSkillId(event.skill);
		const data = dataOf(fam, subOf(sid)) || {};
		finishPrevious(sid, 4, event.loc);
		resetCharge();
		lastSkill = sid; lastEvent = event;
		const start = sanitizeLoc({ x: event.loc.x, y: event.loc.y, z: event.loc.z }, `charge ${sid}`);
		xloc = start.x; yloc = start.y; zloc = start.z; wloc = event.w;
		actionLocUpdated = false;
		const speed = chargeSpeedFor(sid);
		const stageSpeed = fam.chargeStageSpeed === 'charge' ? speed : 1;
		const level = opts.level || 0;
		const id = sendStage(sid, level, stageSpeed, start, event.w, true);
		action = { skillId: sid, requestId: sid, id, start, w: event.w, speed: 1, normDuration: 0, finished: false, timers: [], requestedAt: Date.now(), startedAt: Date.now(), isCharge: true };
		charge = {
			skillId: sid, level, timers: [], event, start, w: event.w, stages: data.chargeStages || [], serverStart: 0,
			serverLevel: -1, shownAt: { [level]: Date.now() }, speed, stageSpeed, waitServer: Boolean(fam.waitServerStage), startedAt: Date.now(),
			margin: Number(fam.chargeMargin) || 0, anchor: Boolean(fam.anchorToServer), nextAt: 0
		};
		scheduleChargeStages(charge, level);
		pressRetries(event, fam);
		if (CLS.chargeStarted) CLS.chargeStarted(sid, charge);
		return charge;
	}

	function startHold(fam, event) {
		const sid = getSkillId(event.skill);
		const prev = action && !action.finished ? action : null;
		const prevType = (prev && matchesAny(prev.skillId, fam.noPrevEndFor)) ? null : (fam.prevEndType !== undefined ? fam.prevEndType : 4);
		finishPrevious(sid, prevType, event.loc);
		lastSkill = sid; lastEvent = event;
		if (fam.unlockAll) unlockAll();
		for (const k of (fam.unlocks || [])) unlock(k);
		const a = startAction(event, sid, { duration: 600000, fixedSpeed: Boolean(famOpts(fam, sid).fixedSpeed), requestId: sid });
		a.isHold = true;
		hold = { skillId: sid, event, action: a, pressAt: Date.now() };
		pressRetries(event, fam);
		return a;
	}

	// DTmaik
	function scheduleTapResend(sid, h, upEvent) {
		const wait = (Number(config.GLOBAL_LATENCY) || 100) + 60;
		const down = copyEvent(h.event);
		const up = copyEvent(upEvent);
		setTimeout(() => {
			if ((serverSkillAckAt[sid] || 0) >= h.pressAt || lastSkill !== sid) return;
			recordPacket('MOD->S', 'C_PRESS_SKILL [tap resend: press was not confirmed]', { skill: skillLabel(sid) });
			sendRetry('C_PRESS_SKILL', 4, down);
			setTimeout(() => sendRetry('C_PRESS_SKILL', 4, up), 30);
		}, Math.max(0, wait - (Date.now() - h.pressAt)));
	}

	const forwardedPress = {};
	hook('C_PRESS_SKILL', 4, (event) => {
		const sid = getSkillId(event.skill);
		const wasForwarded = forwardedPress[sid] === true;
		const res = handlePress(event);
		if (event.press) {
			forwardedPress[sid] = res !== false;
			return res;
		}
		forwardedPress[sid] = false;
		if (res === false && wasForwarded) {
			recordPacket('C->S', 'C_PRESS_SKILL release forwarded (its press reached the server)', { skill: skillLabel(sid) });
			return;
		}
		return res;
	});

	function handlePress(event) {
		if (!predicting() || (event.press && inReaction() && isPlayerSkill(event.skill))) return;
		const sid = getSkillId(event.skill);
		const fam = familyDef(sid);
		noteRealLoc(event.loc);
		if (event.press) {
			const base = baseOf(sid);
			lastPresses[base] = { down: copyEvent(event), up: null, at: Date.now() };
		} else if (lastPresses[baseOf(sid)]) {
			lastPresses[baseOf(sid)].up = copyEvent(event);
		}
		if (isPlayerSkill(event.skill) && skillOff(sid)) {
			if (event.press) {
				recordPacket('MOD', 'Key press sent without prediction (skill switched off)', { skill: skillLabel(sid) });
				cancelChargeAndHold(sid);
				lastSkill = sid; lastEvent = event;
				markUnpredicted(sid);
			}
			return;
		}
		if (event.press && isPlayerSkill(event.skill) && !BLACKLIST.has(sid)) {
			const dropReason = shouldDrop(sid);
			if (dropReason) {
				recordPacket('MOD', 'Key press dropped', { skill: skillLabel(sid), reason: dropReason });
				return false;
			}
		}
		if (CLS.press) {
			const verdict = CLS.press(event, { sid, fam });
			if (verdict === 'drop') return false;
			if (verdict === 'pass' || verdict === 'done') return;
		}
		if (!fam || (fam.mode !== 'charge' && fam.mode !== 'hold') || !(fam.subs || [0]).includes(subOf(sid))) return;

		if (fam.mode === 'charge') {
			if (event.press) {
				if (config.DISABLE_CHARGE || isLocked(sid)) { cancelChargeAndHold(sid); lastSkill = sid; lastEvent = event; return; }
				if (charge && charge.skillId === sid && !charge.released) return;
				cancelChargeAndHold(sid);
				startCharge(fam, event);
			} else {
				if (!charge || charge.skillId !== sid || charge.released) return;
				releaseCharge(fam, charge);
			}
			return;
		}

		if (event.press) {
			if (hold && hold.skillId === sid) return;
			if (isLocked(sid)) return;
			cancelChargeAndHold(sid);
			startHold(fam, event);
		} else {
			if (!hold || hold.skillId !== sid) return;
			const h = hold;
			hold = null;
			if (fam.tapResend) scheduleTapResend(sid, h, event);
			if (action !== h.action || h.action.finished) return;
			clearActionTimers(h.action);
			h.action.finished = true;
			sendEnd(sid, fam.releaseEndType || 11, currentLoc(h.action.start), h.action.w, h.action.id);
			if (fam.releaseSub === null) return;
			const data = dataOf(fam, 0);
			const releaseId = baseOf(sid) + (fam.releaseSub || 11);
			lastSkill = releaseId;
			startAction(Object.assign(copyEvent(event), { w: h.action.w }), releaseId, { duration: data.releaseDuration });
		}
	}

	const heldRequests = [];
	// Soaria
	// shows the skill now but sends the request later (the server would ignore it this early)
	function holdRequest(name, version, event, delay) {
		const prev = heldRequests.length ? heldRequests[heldRequests.length - 1].sendAt + 10 : 0;
		const h = { name, version, event: copyEvent(event), sendAt: Math.max(Date.now() + delay, prev) };
		heldRequests.push(h);
		recordPacket('MOD', 'Request held back (the server would ignore it this early)', { skill: skillLabel(getSkillId(event.skill)), delay: Math.round(h.sendAt - Date.now()) });
		setTimeout(() => {
			const i = heldRequests.indexOf(h);
			if (i >= 0) heldRequests.splice(i, 1);
			dispatch.toServer(h.name, h.version, h.event);
		}, Math.max(0, h.sendAt - Date.now()));
	}
	let grantFix = null;
	hook('S_GRANT_SKILL', 3, (event) => {
		if (!predicting()) return;
		const granted = getSkillId(event.skill);
		const fam = familyDef(granted);
		if (!fam || fam.mode !== 'charge') return;
		if (blockGrant) {
			if (lastSpoofedGrant !== granted && groupOf(lastSpoofedGrant) === groupOf(granted)) {
				grantFix = { from: lastSpoofedGrant, to: granted, until: Date.now() + 1000, sent: false };
				// the release came before the server reached that charge level: the learned charge speed is too fast
				if (subOf(granted) < subOf(lastSpoofedGrant) && chargeCorrection < 1) {
					chargeCorrection = 1;
					recordPacket('MOD', 'Charge speed correction reset (release came before the server charge level)', { skill: skillLabel(granted) });
				}
				if (lastReleaseRequest && getSkillId(lastReleaseRequest.skill) === lastSpoofedGrant && Date.now() - (lastReleaseRequest.at || 0) < 1000) {
					grantFix.sent = true;
					const pk = (lastStartReq && getSkillId(lastStartReq.event.skill) === lastSpoofedGrant) ? lastStartReq : { name: 'C_START_SKILL', version: 7 };
					sendRetry(pk.name, pk.version, withSkillId(lastReleaseRequest, granted));
					recordPacket('MOD->S', `${pk.name} [charge level fix]`, { from: skillLabel(lastSpoofedGrant), to: skillLabel(granted) });
				}
			}
			return false;
		}
	});

	const serverActions = {};

	const dataKeyOf = (fam, sub) => (fam.keys && fam.keys[sub] !== undefined ? fam.keys[sub] : fam.key);
	function learnTarget(id) {
		const fam = familyDef(id);
		if (!fam) return null;
		if (CLS.learnTarget) {
			const t = CLS.learnTarget(id, fam);
			if (t !== undefined) return t;
		}
		const sub = subOf(id);
		const key = dataKeyOf(fam, sub);
		const data = skills[key];
		if (!data) return null;
		if (fam.extraSubs && fam.extraSubs[sub]) return fam.extraSubs[sub].prop ? { key: dataKeyOf(fam, fam.extraSubs[sub].keySub || 0), prop: fam.extraSubs[sub].prop } : null;
		switch (fam.mode) {
			case 'simple': {
				const ch = (fam.chains || []).find(c => sub === c.sub || sub === c.sub + 1);
				if (ch && !(fam.subs || [0]).includes(sub)) return { key: dataKeyOf(fam, 0), prop: ch.durationKey || 'chainDuration' };
				return predictedSubs(fam).includes(sub) ? { key, prop: 'duration', dist: data.distance !== undefined } : null;
			}
			case 'combo': return predictedSubs(fam).includes(sub) && Array.isArray(data.durations) ? { key, prop: 'durations', index: Math.min(sub, data.durations.length - 1) } : null;
			case 'stages': return (fam.subs || [0]).includes(sub) ? { key, prop: 'stages', stageList: true } : null;
			case 'jaunt': return sub === 0 ? { key, prop: 'stages', stageList: true } : null;
			case 'charge': return (fam.releaseSubs || [10, 11, 12]).includes(sub) ? { key, prop: 'releaseDuration' } : null;
			case 'hold': return sub === (fam.releaseSub || 11) ? { key, prop: 'releaseDuration' } : null;
			case 'chain': return sub === (fam.chainSub || 30) ? { key, prop: 'duration' } : null;
			case 'lockon':
				if (sub !== (fam.castSub || 10)) return null;
				return Array.isArray(data.stages) ? { key, prop: 'stages', stageList: true } : { key, prop: 'duration' };
			default: return null;
		}
	}

	function baseDurationFor(id) {
		const t = learnTarget(id);
		if (!t || t.stageList) {
			const fam = familyDef(id);
			return fam && t ? durationOf(fam, subOf(id)) : 0;
		}
		const data = skills[t.key];
		if (!data) return 0;
		const v = t.index !== undefined ? (data[t.prop] || [])[t.index] : data[t.prop];
		return Number(v) || 0;
	}

	function autoGlyphSync(id, measured) {
		if (!config.AUTO_GLYPH_SYNC || !isPredictedServerSkill(id)) return;
		const base = baseDurationFor(id);
		if (!base || base < 300) return;
		const ratio = measured / base;
		const key = glyphKey(id);
		if (Math.abs(ratio - 1) <= 0.03) {
			if (glyphFactors[key]) delete glyphFactors[key];
			delete glyphCandidates[key];
			return;
		}
		if (Math.abs(ratio - 1) < 0.06 || ratio < 0.4 || ratio > 1.6) return;
		const prev = glyphCandidates[key];
		glyphCandidates[key] = ratio;
		if (prev === undefined || Math.abs(prev - ratio) > 0.04) return;
		const f = Math.round(((prev + ratio) / 2) * 1000) / 1000;
		if (glyphFactors[key] && Math.abs(glyphFactors[key] - f) < 0.02) return;
		glyphFactors[key] = f;
		debugChat(`Detected: ${skillLabel(id)} runs with factor ${f} (${f < 1 ? Math.round((1 / f - 1) * 100) + ' % faster' : 'slower'}) - now taken into account`);
	}

	function serverSpeedCheck(event, sid) {
		const a = action;
		if (!config.AUTO_GLYPH_SYNC || !a || a.finished || a.isCharge || a.skillId !== sid || event.stage !== 0) return;
		const sv = Number(event.speed) || 0;
		if (sv <= 0 || !a.baseSpeed) return;
		const key = glyphKey(sid);
		const ratio = Math.round((sv / a.baseSpeed) * 1000) / 1000;
		if (ratio < 0.5 || ratio > 2) return;
		if (DEF.NO_SPEED_LEARN) {
		} else if (Math.abs(ratio - 1) <= 0.02) {
			delete learnedSpeed[key];
			delete speedCandidates[key];
		} else {
			const prev = speedCandidates[key];
			speedCandidates[key] = ratio;
			if (prev !== undefined && Math.abs(prev - ratio) <= 0.02) learnedSpeed[key] = ratio;
		}

		if (Math.abs(sv / a.speed - 1) > 0.02) {
			recordPacket('MOD', 'Speed corrected by server', { skill: skillLabel(sid), ours: a.speed.toFixed(3), server: sv.toFixed(3) });
			a.speed = sv;
			scheduleActionEnd(a, Math.max(50, a.normDuration / sv));
		}
	}

	// Abdull
	function measureServerEnd(event) {
		const rec = serverActions[event.id];
		delete serverActions[event.id];
		if (!rec || rec.id !== getSkillId(event.skill)) return;
		const elapsed = Date.now() - rec.start;
		const measured = Math.round(elapsed * rec.speed);
		const dx = event.loc.x - rec.loc.x;
		const dy = event.loc.y - rec.loc.y;
		const along = Math.round(dx * Math.cos(rec.w) + dy * Math.sin(rec.w));
		const target = learnTarget(rec.id);
		const data = target ? skills[target.key] : null;

		if (config.LOG_SKILLS) {
			const tag = event.type === 0 ? '<font color="#00FF88">[FULL]</font>' : `<font color="#FFAA00">[END type=${event.type}]</font>`;
			sendChat(`${tag} ${skillLabel(rec.id)}: ${measured} ms at speed 1.0 | distance ${along}${rec.stages.length > 1 ? ' | stages ' + rec.stages.map(t => Math.round(t * rec.speed)).join('/') : ''}`);
		}
		if (event.type === 0 && !config.LEARN_MODE && measured >= 100 && measured <= 15000) autoGlyphSync(rec.id, measured);
		if (!config.LEARN_MODE || !target || event.type !== 0 || measured < 100 || measured > 15000) return;

		const smooth = (oldVal, val) => (oldVal > 0 ? Math.round(oldVal * 0.4 + val * 0.6) : val);
		if (target.stageList) {
			const offs = rec.stages.map(t => Math.round(t * rec.speed));
			if (offs.length !== data.stages.length) return;
			const lens = offs.map((o, i) => (i + 1 < offs.length ? offs[i + 1] : measured) - o);
			data.stages = data.stages.map((old, i) => smooth(old, lens[i]));
		} else if (target.index !== undefined) {
			data[target.prop][target.index] = smooth(data[target.prop][target.index], measured);
		} else {
			data[target.prop] = smooth(data[target.prop], measured);
		}
		if (target.dist && Math.abs(along) > 30) data.distance = smooth(Math.abs(data.distance || 0), Math.round(Math.abs(along) / knownGlyphDistance(rec.id))) * Math.sign(along);
		saveSkillData();
		sendChat(`<font color="#00FF88">[Learn]</font> ${data.name} updated in skill_data.json`);
	}

	hook('S_ACTION_STAGE', 9, (event) => {
		if (!enabled || event.gameId !== cid) return;
		const sid = getSkillId(event.skill);
		serverAckAt[groupOf(sid)] = Date.now();
		serverSkillAckAt[sid] = Date.now();
		confirmRequest(sid);
		if (event.stage === 0 && lastServerEnd && Date.now() - lastServerEnd.at < 50 && (lastServerEnd.type === 4 || lastServerEnd.type === 6) &&
			lastServerEnd.group !== groupOf(sid) && refusedPairs.delete(`${lastServerEnd.group}>${groupOf(sid)}`)) {
			recordPacket('MOD', 'LEARNED: the server lets this skill interrupt again', { skill: skillLabel(sid) });
		}
		if (isPlayerSkill(event.skill)) { serverActive = { id: sid, actionId: event.id, at: Date.now() }; reaction = null; }
		if (Array.isArray(event.animSeq) && event.animSeq.length && (familyDef(sid) || {}).animSeq) {
			animSeqLearned[animKey(sid, event.stage)] = event.animSeq.map(x => ({ duration: x.duration, xyRate: x.xyRate, zRate: x.zRate, distance: x.distance }));
		}
		if (!serverStageAt.has(event.id)) {
			serverStageAt.set(event.id, Date.now());
			if (serverStageAt.size > 100) serverStageAt.delete(serverStageAt.keys().next().value);
		}

		if (event.stage === 0 || !serverActions[event.id]) {
			serverActions[event.id] = { id: sid, start: Date.now(), speed: Number(event.speed) || 1, loc: Object.assign({}, event.loc), w: event.w, stages: [0] };
			const ids = Object.keys(serverActions);
			if (ids.length > 50) delete serverActions[ids[0]];
		} else {
			serverActions[event.id].stages.push(Date.now() - serverActions[event.id].start);
		}
		if (!predicting()) return;
		if (CLS.serverStage) {
			const verdict = CLS.serverStage(event, sid);
			if (verdict === false) return false;
		}

		if (charge && charge.skillId === sid && !charge.released) {
			chargeServerStage(event);
			return false;
		}

		if (!isPlayerSkill(event.skill)) {
			lastSkill = 1;
			if (action) { clearActionTimers(action); action.finished = true; }
			resetCharge();
			hold = null;
			currentClientActionId = event.id;
			return;
		}

		if (passthroughIds.has(event.id)) {
			currentClientActionId = event.id;
			return useClientLocForPassthrough(event) ? true : undefined;
		}
		if (isPredictedServerSkill(sid)) {
			const ua = unpredictedAt[groupOf(sid)] || 0;
			const sentUnpredicted = Date.now() - ua < 1500 && (lastFakeFamilyAt[groupOf(sid)] || 0) < ua &&
				(!(action && !action.finished && groupOf(action.skillId) === groupOf(sid)) || Date.now() - (unpredictedExactAt[sid] || 0) < 1500);
			if (sentUnpredicted && event.stage === 0) delete unpredictedExactAt[sid];
			if (sentUnpredicted && event.stage === 0) delete unpredictedAt[groupOf(sid)];
			if (sentUnpredicted || Date.now() - (lastFakeFamilyAt[groupOf(sid)] || 0) > FAKE_FAMILY_WINDOW) {
				passthroughIds.add(event.id);
				if (action && !action.finished) { clearActionTimers(action); action.finished = true; }
				currentClientActionId = event.id;
				recordPacket('S->C', 'S_ACTION_STAGE [PASSED THROUGH: not predicted]', { skill: skillLabel(sid) });
				return useClientLocForPassthrough(event) ? true : undefined;
			}
			if ((serverStageAt.get(event.id) || 0) >= (action ? action.requestedAt : Infinity)) serverSpeedCheck(event, sid);
			if (event.stage === 0 && action && action.skillId === sid && !action.rttNoted) { action.rttNoted = true; noteRtt(Date.now() - action.requestedAt); }
			checkServerDistance(event, sid);
			return false;
		}

		if (action && !action.finished) { clearActionTimers(action); action.finished = true; }
		currentClientActionId = event.id;

		const fam = familyDef(sid);
		if (fam && fam.mode === 'lockon' && subOf(sid) !== (fam.castSub || 10) && event.stage === 0) {
			lockonPrep = { group: groupOf(sid), id: event.id, skillId: sid, loc: Object.assign({}, event.loc), w: event.w };
			if (lockTimeout && lockTimeout.group === groupOf(sid) && lockTimeout.serverId === null) lockTimeout.serverId = event.id;
		}
		if (useClientLocForPassthrough(event)) return true;
	});

	function useClientLocForPassthrough(event) {
		if (!realLoc || !isClientMoving() || !isPlayerSkill(event.skill)) return false;
		const d = Math.hypot(event.loc.x - realLoc.x, event.loc.y - realLoc.y);
		if (d > 300 || Math.abs(event.loc.z - realLoc.z) > 100) return false;
		event.loc = { x: realLoc.x, y: realLoc.y, z: realLoc.z };
		return true;
	}

	const DESYNC_Z_LIMIT = DEF.DESYNC_Z_LIMIT || 100;
	const DESYNC_XY_LIMIT = 220;
	function checkEndDesync(event, sid) {
		if (!DEF.END_DESYNC_FIX) return;
		const p = predictedEnd[sid];
		if (!p || Date.now() - p.at > 2000 || !isValidLoc(event.loc)) return;
		delete predictedEnd[sid];
		const dz = Math.abs(event.loc.z - p.loc.z);
		const dxy = Math.hypot(event.loc.x - p.loc.x, event.loc.y - p.loc.y);
		const idle = atkidBase === p.seq && !(action && !action.finished);
		const fam = familyDef(sid);
		const data = dataOf(fam, subOf(sid));
		const moving = Boolean(data && data.distance);
		if (dz > DESYNC_Z_LIMIT || (idle && moving && !isClientMoving() && dxy > DESYNC_XY_LIMIT)) {
			recordPacket('MOD->C', 'S_INSTANT_MOVE (end position corrected)', { skill: skillLabel(sid), dxy: Math.round(dxy), dz: Math.round(dz) });
			dispatch.toClient('S_INSTANT_MOVE', 3, { gameId: cid, loc: { x: event.loc.x, y: event.loc.y, z: event.loc.z }, w: event.w });
			noteRealLoc(event.loc);
			xloc = event.loc.x; yloc = event.loc.y; zloc = event.loc.z;
		}
	}

	hook('S_ACTION_END', 5, (event) => {
		if (!enabled || event.gameId !== cid) return;
		measureServerEnd(event);
		if (lockTimeout && event.id === lockTimeout.serverId) clearLockTimeout();
		if (serverActive && serverActive.actionId === event.id) serverActive = null;
		if (isPlayerSkill(event.skill)) lastServerEnd = { group: groupOf(getSkillId(event.skill)), type: event.type, at: Date.now() };
		if (reaction && (event.id === reaction.id || !isPlayerSkill(event.skill))) reaction = null;
		if (!predicting()) return;
		const sid = getSkillId(event.skill);
		if (CLS.serverEnd) {
			const verdict = CLS.serverEnd(event, sid);
			if (verdict === false) return false;
		}

		if (hold && hold.skillId === sid && event.type !== (familyDef(sid) || {}).releaseEndType && event.type !== 11) {
			const h = hold;
			hold = null;
			if (action === h.action && !h.action.finished) {
				clearActionTimers(h.action);
				h.action.finished = true;
				sendEnd(sid, event.type, event.loc, event.w, h.action.id);
			}
			return false;
		}

		if (passthroughIds.has(event.id)) passthroughIds.delete(event.id);
		if (event.id === currentClientActionId) {
			currentClientActionId = null;
			return useClientLocForPassthrough(event) ? true : undefined;
		}

		const serverStart = serverStageAt.get(event.id) || 0;
		serverStageAt.delete(event.id);

		const restartedLockon = event.type === 35 && (familyDef(sid) || {}).mode === 'lockon';
		const stillCharging = Boolean(action && action.isCharge && charge && charge.skillId === sid && !charge.released);
		if (action && !action.finished && action.skillId === sid && !restartedLockon && !stillCharging && serverStart >= action.requestedAt) {
			const a = action;
			a.finished = true;
			clearActionTimers(a);
			if (a.isCharge && charge && charge.skillId === sid) resetCharge();
			recordPacket('S->C', 'S_ACTION_END [MIRRORED: server ended earlier]', { skill: skillLabel(sid), type: event.type });

			if (event.type !== 0) unlock(a.requestId || a.skillId);

			const endLoc = a.isCharge ? (realLoc || currentLoc(a.start))
				: (a.dest && !actionLocUpdated && !a.limitEnd && isValidLoc(event.loc)) ? { x: event.loc.x, y: event.loc.y, z: event.loc.z } : endLocOf(a);
			if (endLoc === event.loc || (a.dest && !actionLocUpdated && !a.limitEnd)) { xloc = endLoc.x; yloc = endLoc.y; zloc = endLoc.z; }
			sendEnd(sid, event.type, endLoc, a.w, a.id);
			return false;
		}
		if (isPredictedServerSkill(sid)) checkEndDesync(event, sid);

		if (!isPlayerSkill(event.skill) && !(action && !action.finished)) {
			if (currentClientActionId === null || reactionIds.has(event.id)) {
				reactionIds.delete(event.id);
				return;
			}
		}

		recordPacket('S->C', 'S_ACTION_END [BLOCKED: client plays another action]', { skill: skillLabel(sid), type: event.type });
		return false;
	});

	hook('S_CANNOT_START_SKILL', 4, { order: -999 }, (event) => {
		if (!predicting()) return;
		const sid = getSkillId(event.skill);
		if (req && !req.confirmed && groupOf(sid) === req.group) req.rejects++;

		if (grantFix && grantFix.from === sid && Date.now() < grantFix.until) {
			consumeRetryEcho(sid);
			recordPacket('S->C', 'S_CANNOT_START_SKILL [BLOCKED: other charge level requested]', { skill: skillLabel(sid) });
			return false;
		}
		const heldPress = Boolean(pressCopy && getSkillId(pressCopy.skill) === sid && pressStillHeld(sid));

		if (heldPress && (serverSkillAckAt[sid] || 0) >= pressCopyAt) {
			consumeRetryEcho(sid);
			recordPacket('S->C', 'S_CANNOT_START_SKILL [BLOCKED: duplicate press, server already holds it]', { skill: skillLabel(sid) });
			return false;
		}
		if (refuseTrack && refuseTrack.sid === sid) refuseTrack.refused++;
		if (checkAllRefused(sid)) {
			consumeRetryEcho(sid);
			recordPacket('S->C', 'S_CANNOT_START_SKILL [BLOCKED: every request refused, prediction ended]', { skill: skillLabel(sid) });
			return false;
		}
		if (consumeRetryEcho(sid)) {
			recordPacket('S->C', 'S_CANNOT_START_SKILL [BLOCKED: retry echo]', { skill: skillLabel(sid) });
			return false;
		}
		if (requestRejected(sid)) {
			recordPacket('S->C', 'S_CANNOT_START_SKILL [request refused: repeated, ended if not started]', { skill: skillLabel(sid) });
			return;
		}

		if (heldPress && pressRetryCount < 6) {
			pressRetryCount++;
			const copy = pressCopy;
			setTimeout(() => {
				if (pressStillHeld(sid) && pressCopy === copy && (serverSkillAckAt[sid] || 0) < pressCopyAt) sendRetry('C_PRESS_SKILL', 4, copy);
			}, 30);
			recordPacket('S->C', 'S_CANNOT_START_SKILL [BLOCKED: pressing again]', { skill: skillLabel(sid), attempt: pressRetryCount });
			return false;
		}

		if (config.GHOST_FIX && action && !action.finished && action.skillId !== undefined &&
			(action.skillId === sid || baseOf(action.skillId) === baseOf(sid) || action.requestId === sid) &&
			!serverStartedSince(sid, action.requestedAt)) {
			const a = action;
			if (a.rejectPending) return false;
			a.rejectPending = true;
			const rejectAt = Date.now();
			const req = lastStartReq;
			const serverStarted = () => serverStartedSince(sid, a.requestedAt);
			recordPacket('S->C', 'S_CANNOT_START_SKILL [HELD: late retry]', { skill: skillLabel(sid) });
			if (req && getSkillId(req.event.skill) === sid && rejectAt - req.at < 1500 && !a.isCharge && !a.isHold) {
				a.timers.push(setTimeout(() => {
					if (action !== a || a.finished || serverStarted()) return;
					recordPacket('MOD->S', `${req.name} [late retry]`, { skill: skillLabel(sid) });
					sendRetry(req.name, req.version, req.event);
				}, 120));
			}
			a.timers.push(setTimeout(() => {
				if (action !== a || a.finished || serverStarted()) return;
				a.finished = true;
				clearActionTimers(a);
				unlock(a.requestId || a.skillId);
				if (charge && charge.skillId === a.skillId) resetCharge();
				if (hold && hold.action === a) hold = null;
				recordPacket('MOD', 'GHOST PROTECTION: server rejected', { skill: skillLabel(a.skillId) });
				noteRefusedDuring(a);
				sendEnd(a.skillId, 2, realLoc || currentLoc(a.start), a.w, a.id);
				if (lastSkill === sid) lastSkill = 0;
			}, 380));
			return false;
		}
	});

	function checkAllRefused(sid) {
		const a = action;
		const rt = refuseTrack;
		if (!config.GHOST_FIX || !a || a.finished || a.isCharge || a.isHold || !rt || rt.sid !== sid) return false;
		if (a.requestId !== sid && a.skillId !== sid) return false;
		if (rt.refused < rt.sent || (pendingCopies[sid] || 0) > 0 || rt.at < a.requestedAt - 5) return false;
		if (serverStartedSince(sid, a.requestedAt)) return false;
		a.finished = true;
		clearActionTimers(a);
		unlock(a.requestId || a.skillId);
		recordPacket('MOD', 'GHOST PROTECTION: every request was refused', { skill: skillLabel(a.skillId), requests: rt.sent });
		noteRefusedDuring(a);
		sendEnd(a.skillId, 2, realLoc || currentLoc(a.start), a.w, a.id);
		if (lastSkill === sid) lastSkill = 0;
		if (CLS.rejected) CLS.rejected(a);
		return true;
	}

	// compares where the server puts us with our prediction (gate protection, jaunt height)
	function checkServerDistance(event, sid) {
		const a = action;
		if (!gateFix) return;
		if (!a || a.skillId !== sid || !a.dest || event.stage !== 0 || !Array.isArray(event.animSeq) || !event.animSeq.length) return;
		const full = Math.hypot(a.dest.x - a.start.x, a.dest.y - a.start.y);
		if (full < 50) return;
		const allowed = event.animSeq.reduce((sum, st) => sum + (Number(st.distance) || 0), 0);
		if (!(allowed >= 0) || allowed > full * 0.75 - 10) return;
		const k = allowed / full;
		a.limitEnd = { x: a.start.x + (a.dest.x - a.start.x) * k, y: a.start.y + (a.dest.y - a.start.y) * k, z: a.start.z };
		recordPacket('S->C', 'GATE: server allows a shorter distance', { skill: skillLabel(sid), allowed: Math.round(allowed), normal: Math.round(full) });
		if (a.finished && Date.now() - (a.endAt || 0) < 1500) snapToLimit(a);
	}

	hook('S_INSTANT_MOVE', 3, (event) => {
		if (enabled && event.gameId === cid) noteRealLoc(event.loc);
		if (!predicting() || event.gameId !== cid) return;
		if (Date.now() < jauntMoveBlockUntil) {
			jauntMoveBlockUntil = 0;

			const d = jauntDest;
			jauntDest = null;

			if (jauntFrom && d) {
				const diff = jauntFrom.full - Math.hypot(event.loc.x - jauntFrom.x, event.loc.y - jauntFrom.y);
				if (diff >= 0 && diff <= 40 && Math.abs(diff - jauntShort) > 1) {
					recordPacket('MOD', 'LEARNED: Teleport Jaunt distance of the server', { shorter: Math.round(diff), was: jauntShort });
					jauntShort = Math.round(diff);
				}
			}
			jauntFrom = null;
			if (gateFix && d && (Math.hypot(event.loc.x - d.x, event.loc.y - d.y) > GATE_JAUNT_TOLERANCE || Math.abs(event.loc.z - d.z) > 100)) {
				recordPacket('S->C', 'S_INSTANT_MOVE [GATE: teleport stopped by the server, passed through]', { off: Math.round(Math.hypot(event.loc.x - d.x, event.loc.y - d.y)) });
				debugChat(`Gate: teleport stopped by the server - following it (${Math.round(Math.hypot(event.loc.x - d.x, event.loc.y - d.y))} units from the target)`);
				xloc = event.loc.x; yloc = event.loc.y; zloc = event.loc.z;
				realClientLoc = { x: event.loc.x, y: event.loc.y, z: event.loc.z };
				actionLocUpdated = true;

				if (action && !action.finished) action.limitEnd = { x: event.loc.x, y: event.loc.y, z: event.loc.z };
				return;
			}

			const cz = (realClientLoc && Math.hypot(realClientLoc.x - (d ? d.x : 0), realClientLoc.y - (d ? d.y : 0)) < 30) ? realClientLoc.z : (d ? d.z : 0);
			if (d && Math.hypot(event.loc.x - d.x, event.loc.y - d.y) <= GATE_JAUNT_TOLERANCE && Math.abs(event.loc.z - cz) > JAUNT_HEIGHT_TOLERANCE) {
				recordPacket('S->C', 'S_INSTANT_MOVE [teleport height corrected by the server]', { dz: Math.round(event.loc.z - cz) });
				xloc = event.loc.x; yloc = event.loc.y; zloc = event.loc.z;
				realClientLoc = { x: event.loc.x, y: event.loc.y, z: event.loc.z };
				actionLocUpdated = true;
				return;
			}
			return false;
		}
	});

	hook('S_EACH_SKILL_RESULT', 13, (event) => {
		if (enabled && event.source === cid) skillFired(groupOf(getSkillId(event.skill)), 'skill result');
		if (!enabled || event.target !== cid) return;
		if (event.reaction && event.reaction.enable) {
			lastSkill = 1;
			resetCharge();
			hold = null;
			if (action && !action.finished) { clearActionTimers(action); action.finished = true; }
			const rid = event.reaction.id;
			if (rid !== undefined && rid !== null && rid !== 0) {
				currentClientActionId = rid;
				reactionIds.add(rid);
				if (reactionIds.size > 50) reactionIds.delete(reactionIds.values().next().value);
			} else {
				currentClientActionId = null;
			}
			reaction = { id: rid, until: Date.now() + REACTION_MAX_MS };
			recordPacket('S->C', 'REACTION (prediction stopped)', { skill: getSkillId(event.reaction.skill), id: rid });
		}
	});

	function sendMoveCancel(a, cancelEvent, sendNow) {
		const copy = copyEvent(cancelEvent);
		if (sendNow) dispatch.toServer('C_CANCEL_SKILL', 3, copy);

		if (a.cancelRepeats) return;
		a.cancelRepeats = true;
		(DEF.CANCEL_RETRY_DELAYS || [40, 90, 150, 220]).forEach(delay => setTimeout(() => {
			if (action !== a || a.finished) return;
			dispatch.toServer('C_CANCEL_SKILL', 3, copy);
		}, delay));
	}

	hook('C_CANCEL_SKILL', 3, (event) => {
		if (!predicting() || event.type !== 2 || !action || action.finished) return;
		const sid = getSkillId(event.skill);
		if (sid !== action.skillId) return;
		const a = action;

		if (cancelGuard && cancelGuard.action === a && !cancelGuard.fired) {
			if (!cancelGuard.pending) recordPacket('MOD', 'Move cancel held back until the skill fired', { skill: skillLabel(sid) });
			cancelGuard.pending = copyEvent(event);
			return false;
		}
		sendMoveCancel(a, event, false);
	});

	// DTmaik
	let cancelGuard = null;
	function armCancelGuard(fam, a) {
		cancelGuard = (fam && fam.cancelGuardConfig && config[fam.cancelGuardConfig] && a) ? { action: a, group: groupOf(a.skillId), fired: false, pending: null } : null;
	}
	function skillFired(group, via) {
		const g = cancelGuard;
		if (!g || g.fired || g.group !== group) return;
		g.fired = true;
		if (!g.pending) return;
		const a = g.action;
		if (action !== a || a.finished) return;

		recordPacket('MOD', 'Skill fired - held move cancel sent now', { skill: skillLabel(a.skillId), via });
		sendMoveCancel(a, g.pending, true);
	}
	tryHookMain('S_START_USER_PROJECTILE', 9, (event) => {
		if (enabled && event.gameId === cid) skillFired(groupOf(getSkillId(event.skill)), 'projectile');
	});

	let lockTrack = null;
	function startLockTrack(sid) {
		lockTrack = { group: groupOf(sid), pending: new Set(), confirmed: new Set(), answered: 0 };
	}
	function releaseWithoutTarget(castId) {
		const lt = lockTrack;
		if (!lt || lt.group !== groupOf(castId) || !lt.answered || lt.pending.size || lt.confirmed.size) return false;
		lockTrack = null;
		clearLockTimeout();
		recordPacket('MOD->S', 'C_CANCEL_SKILL [RELEASE WITHOUT VALID TARGET: cancelled like vanilla]', { skill: skillLabel(castId) });
		dispatch.toServer('C_CANCEL_SKILL', 3, { skill: castId, type: 1 });
		return true;
	}

	const LEARNED_TARGETS_PATH = path.join(dataDir, 'learned_targets.json');
	let learnedTypes = {};
	try { if (fs.existsSync(LEARNED_TARGETS_PATH)) learnedTypes = JSON.parse(fs.readFileSync(LEARNED_TARGETS_PATH, 'utf8')) || {}; } catch (e) { learnedTypes = {}; }

	if (!fs.existsSync(LEARNED_TARGETS_PATH)) {
		const old = readLegacy('learned_targets.json');
		if (old && old.data && typeof old.data === 'object') {
			learnedTypes = old.data;
			try { fs.writeFileSync(LEARNED_TARGETS_PATH, JSON.stringify(learnedTypes, null, '	'), 'utf8'); } catch (e) {}
			console.log(`[${NAME}] Learned lock-on targets taken over from ${old.dir}/learned_targets.json`);
		}
	}
	let learnedSaveTimer = null;
	function saveLearnedTypes() {
		if (learnedSaveTimer) return;
		learnedSaveTimer = global.setTimeout(() => {
			learnedSaveTimer = null;
			const keys = Object.keys(learnedTypes);
			if (keys.length > 5000) for (const k of keys.slice(0, keys.length - 5000)) delete learnedTypes[k];
			try { fs.writeFileSync(LEARNED_TARGETS_PATH, JSON.stringify(learnedTypes, null, '\t'), 'utf8'); } catch (e) {}
		}, 2000);
	}
	let npcInfo = new Map();
	let playerIds = new Set();
	let unknownRefused = new Map();
	const isPlayerTarget = (key) => playerIds.has(key) || partyIds.has(key) || (cid !== null && key === String(cid));
	// Abdull
	function noteLockVerdict(target, success) {
		const key = String(target);
		if (petIds.has(key) || isPlayerTarget(key)) return;
		const npc = npcInfo.get(key);
		if (!npc) {
			if (success) unknownRefused.set(key, true);
			else if (unknownRefused.get(key) !== true) unknownRefused.set(key, false);
			return;
		}
		const was = learnedTypes[npc.type];
		if (success) {
			if (was !== 'ok') { learnedTypes[npc.type] = 'ok'; saveLearnedTypes(); }
			return;
		}
		if (was !== undefined) return;
		learnedTypes[npc.type] = 'refused';
		saveLearnedTypes();
		recordPacket('S->C', 'LOCK-ON: NPC type refused by the server - no instant lock-on for it any more', npc);
		debugChat(`Lock-on: NPC type ${npc.type}${npc.name ? ' (' + npc.name + ')' : ''} refused by the server - waits for the server from now on`);
	}
	function lockRefused(target) {
		const key = String(target);
		const npc = npcInfo.get(key);
		if (npc) return learnedTypes[npc.type] === 'refused';
		return unknownRefused.get(key) === false;
	}
	tryHookMain('S_SPAWN_USER', 14, (event) => { playerIds.add(String(event.gameId)); if (playerIds.size > 3000) playerIds.delete(playerIds.values().next().value); });
	tryHookMain('S_DESPAWN_USER', 3, (event) => { playerIds.delete(String(event.gameId)); });

	hook('S_CAN_LOCKON_TARGET', 3, (event) => {
		if (enabled) noteLockVerdict(event.target, event.success);
		const lt = lockTrack;
		if (!lt || groupOf(getSkillId(event.skill)) !== lt.group) return;
		const key = String(event.target);
		lt.pending.delete(key);
		lt.answered++;
		if (event.success) lt.confirmed.add(key); else lt.confirmed.delete(key);

		if (lt.castId && !lt.pending.size) {
			const castId = lt.castId;
			lockTrack = null;
			if (lt.confirmed.size) return;
			recordPacket('MOD->S', 'C_CANCEL_SKILL [ALL TARGETS REJECTED AFTER RELEASE]', { skill: skillLabel(castId) });
			dispatch.toServer('C_CANCEL_SKILL', 3, { skill: castId, type: 1 });
			if (action && !action.finished && action.skillId === castId) {
				const a = action;
				a.finished = true;
				clearActionTimers(a);
				sendEnd(castId, 2, currentLoc(a.start), a.w, a.id);
			}
		}
	});

	let partyIds = new Set();
	let partyByPlayer = new Map();
	tryHookMain('S_PARTY_MEMBER_LIST', 7, (event) => {
		partyIds = new Set();
		partyByPlayer = new Map();
		for (const m of (event.members || [])) {
			if (m.gameId === undefined || m.gameId === null) continue;
			partyIds.add(String(m.gameId));
			partyByPlayer.set(String(m.playerId), String(m.gameId));
		}
	});
	tryHookMain('S_LEAVE_PARTY', 1, () => { partyIds = new Set(); partyByPlayer = new Map(); });
	const partyMemberGone = (event) => {
		const id = partyByPlayer.get(String(event.playerId));
		if (id) partyIds.delete(id);
		partyByPlayer.delete(String(event.playerId));
	};
	tryHookMain('S_LEAVE_PARTY_MEMBER', 2, partyMemberGone);
	tryHookMain('S_BAN_PARTY_MEMBER', 1, partyMemberGone);

	let petIds = new Set();
	const addPet = (id) => { petIds.add(String(id)); if (petIds.size > 2000) petIds.delete(petIds.values().next().value); };
	tryHookMain('S_SPAWN_SERVANT', 2, (event) => addPet(event.gameId));
	tryHookMain('S_DESPAWN_SERVANT', 2, (event) => { petIds.delete(String(event.gameId)); });
	tryHookMain('S_SPAWN_NPC', 11, (event) => {
		if (event.owner && BigInt(event.owner) !== 0n) addPet(event.gameId);
		const zone = Number(event.huntingZoneId) || 0, templateId = Number(event.templateId) || 0;
		if (!templateId) return;
		if (npcInfo.size > 5000) npcInfo.delete(npcInfo.keys().next().value);
		npcInfo.set(String(event.gameId), {
			type: `${zone}_${templateId}`, templateId, zone, relation: event.relation, villager: Boolean(event.villager),
			aggressive: Boolean(event.aggressive), name: event.npcName ? String(event.npcName).slice(0, 40) : ''
		});
	});
	tryHookMain('S_DESPAWN_NPC', 3, (event) => { petIds.delete(String(event.gameId)); npcInfo.delete(String(event.gameId)); unknownRefused.delete(String(event.gameId)); });

	hook('C_CAN_LOCKON_TARGET', 3, (event) => {
		const sid = getSkillId(event.skill);
		if (lockTrack && groupOf(sid) === lockTrack.group) lockTrack.pending.add(String(event.target));
		if (!predicting() || !config.INSTANT_LOCKON) return;
		if (skillOff(sid)) return;
		if (petIds.has(String(event.target))) return;
		if (lockRefused(event.target)) return;
		if ((DEF.PARTY_LOCK_GROUPS || []).includes(groupOf(sid))) {
			const key = String(event.target);
			if (!partyIds.has(key) || (cid !== null && key === String(cid))) return;
		}
		dispatch.toClient('S_CAN_LOCKON_TARGET', 3, Object.assign({ success: true }, event));
	});

	let lockTimeout = null;
	function clearLockTimeout() {
		if (lockTimeout) clearTimeout(lockTimeout.timer);
		lockTimeout = null;
	}
	function armLockTimeout(fam, sid) {
		clearLockTimeout();
		if (!config.LOCKON_TIMEOUT_CANCEL || !fam.lockTimeout) return;
		const lt = { group: groupOf(sid), castId: baseOf(sid) + (fam.castSub || 10), serverId: null, timer: null };
		const at = Math.max(500, fam.lockTimeout - (Number(config.LOCKON_TIMEOUT_MARGIN) || 0));
		lt.timer = setTimeout(() => {
			if (lockTimeout !== lt) return;
			lockTimeout = null;
			if (lt.serverId === null || !enabled) return;
			recordPacket('MOD->S', 'C_CANCEL_SKILL [LOCK-ON TIME LIMIT, no cooldown]', { skill: skillLabel(lt.castId), after: at });
			dispatch.toServer('C_CANCEL_SKILL', 3, { skill: lt.castId, type: 1 });
		}, at);
		lockTimeout = lt;
	}

	const cooldownUntil = {};
	function lockTargetDropped(target) {
		if (lockTrack && target !== undefined && target !== null) {
			lockTrack.confirmed.delete(String(target));
			lockTrack.pending.delete(String(target));
		}
	}
	try {
		hook('C_CANCEL_LOCKON_TARGET', 1, (event) => {
			lockTargetDropped(event.TargetId !== undefined ? event.TargetId : event.targetId);
		});
	} catch (e) {
		try {
			hook('C_CANCEL_LOCKON_TARGET', 'raw', (code, data) => {
				if (data && data.length >= 12) lockTargetDropped(data.readBigUInt64LE(4));
			});
		} catch (e2) {
		}
	}

	tryHookMain('S_CREST_MESSAGE', 2, (event) => {
		if (!enabled || event.type !== 6) return;
		const g = groupOf(Number(getSkillId(event.skill)));
		for (const k of Object.keys(cooldownUntil)) if (groupOf(Number(k)) === g) delete cooldownUntil[k];
		for (const k of Object.keys(disabSkill)) if (k.split(':')[0] === String(g)) unlock(k);
		recordPacket('S->C', 'S_CREST_MESSAGE (skill reset)', { skill: skillLabel(Number(getSkillId(event.skill))) });
	});
	hook('S_START_COOLTIME_SKILL', 3, (event) => {
		cooldownUntil[getSkillId(event.skill)] = Date.now() + Math.max(0, event.cooldown);
		if (enabled && event.cooldown > 0) skillFired(groupOf(getSkillId(event.skill)), 'cooldown');
		if (!enabled || !config.GLOBAL_LATENCY) return;
		event.cooldown = Math.max(0, event.cooldown - config.GLOBAL_LATENCY);
		return true;
	});

	hook('S_ABNORMALITY_BEGIN', 3, (event) => {
		if (!enabled || event.target !== cid) return;
		activeAbnormals.add(Number(event.id));
		if (abnLog) showAbnormal(event, true);
	});
	hook('S_ABNORMALITY_END', 1, (event) => {
		if (!enabled || event.target !== cid) return;
		activeAbnormals.delete(Number(event.id));
		if (abnLog) showAbnormal(event, false);
	});

	let abnLog = false;
	const abnNames = {};
	async function abnormalName(id) {
		if (abnNames[id] !== undefined) return abnNames[id];
		let name = '';
		try {
			if (typeof dispatch.queryData === 'function') {
				const node = await dispatch.queryData('/StrSheet_Abnormality/String@id=?/', [Number(id)], false, false, ['id', 'name']);
				if (node && node.attributes && node.attributes.name) name = String(node.attributes.name);
			}
		} catch (e) {  }
		abnNames[id] = name;
		return name;
	}
	function showAbnormal(event, begin) {
		const id = Number(event.id);
		const after = lastSkill && lastSkill !== 1 ? skillLabel(lastSkill) : '-';
		const dur = begin ? Number(event.duration) : 0;
		abnormalName(id).then((name) => {
			sendChat(begin
				? `Buff <font color="#FFD700">${id}</font> ${name || '(name unknown)'}: <font color="#00FF88">ON</font> ${dur > 0 && dur < 2000000000 ? (dur / 1000).toFixed(1) + ' s' : 'permanent'} | last skill ${after}`
				: `Buff <font color="#FFD700">${id}</font> ${name || '(name unknown)'}: <font color="#FF5555">OFF</font> | last skill ${after}`);
		});
	}
	const crestEnabled = (c) => Boolean(c.enable !== undefined ? c.enable : c.enabled);
	hook('S_CREST_INFO', 2, (event) => {
		glyphState = {};
		for (const c of (event.crests || event.glyphs || [])) glyphState[c.id] = crestEnabled(c);
		resetGlyphFactors('glyph list received');
		if (glyphLog) listActiveGlyphs('Glyph list received');
	});
	hook('S_CREST_APPLY', 2, (event) => {
		const before = Boolean(glyphState[event.id]);
		glyphState[event.id] = crestEnabled(event);
		resetGlyphFactors('glyph changed');
		if (glyphLog && before !== glyphState[event.id]) showGlyph(event.id, glyphState[event.id]);
	});

	let glyphLog = false;
	const glyphNames = {};
	async function glyphName(id) {
		if (glyphNames[id] !== undefined) return glyphNames[id];
		let name = '';
		try {
			if (typeof dispatch.queryData === 'function') {
				const node = await dispatch.queryData('/StrSheet_Crest/String@id=?/', [Number(id)], false, false, ['id', 'name']);
				if (node && node.attributes && node.attributes.name) name = String(node.attributes.name);
			}
		} catch (e) {  }
		if (!name) {
			const known = (DEF.GLYPHS || {})[id];
			name = known && known.name ? known.name : '';
		}
		glyphNames[id] = name;
		return name;
	}
	function showGlyph(id, on) {
		glyphName(id).then((name) => {
			const known = (DEF.GLYPHS || {})[id];
			sendChat(`Glyph <font color="#FFD700">${id}</font> ${name || '(name unknown)'}: ${formatState(on)}${known ? ' <font color="#AAAAAA">(known to the mod)</font>' : ''}`);
		});
	}
	function listActiveGlyphs(title) {
		const ids = Object.keys(glyphState).filter(k => glyphState[k]).map(Number).sort((a, b) => a - b);
		if (!ids.length) return sendChat(`${title}: no active glyphs known yet (they are sent at login / when you change one)`);
		Promise.all(ids.map(id => glyphName(id).then(name => `${id} ${name || '?'}`))).then((list) => {
			sendChat(`${title} - ${ids.length} active:`);
			for (let i = 0; i < list.length; i += 4) sendChat(list.slice(i, i + 4).join(' | '));
		});
	}
	hook('C_CREST_APPLY', 2, (event) => {
		glyphState[event.id] = crestEnabled(event);
	});

	try {
		hook('C_CREST_DISAPPLY_ALL', 1, (event) => {
			if (event.accept === false) return;
			glyphState = {};
			resetGlyphFactors('all glyphs removed');
		});
	} catch (e) {
		try { hook('C_CREST_DISAPPLY_ALL', 'event', () => { glyphState = {}; resetGlyphFactors('all glyphs removed'); }); } catch (e2) {}
	}
	hook('S_PLAYER_STAT_UPDATE', 11, (event) => {
		if (!enabled || !event.attackSpeed) return;

		aspd = (event.attackSpeedBonus + event.attackSpeed) / (DEF.ASPD_BASE || event.attackSpeed);
	});
	let lastPlayerLocAt = 0;
	hook('C_PLAYER_LOCATION', 5, (event) => {
		if (!enabled) return;
		noteRealLoc(event.loc);
		if (event.type === 0 || event.type === 1) lastMoveAt = Date.now();
		lastPlayerLocAt = Date.now();
		wloc = event.w;
		if (isValidLoc(event.loc)) {
			xloc = event.loc.x; yloc = event.loc.y; zloc = event.loc.z;

			if ((event.type === 0 || event.type === 1) && action && !action.finished && !action.isHold && Date.now() - action.startedAt > 30) actionLocUpdated = true;
		}
	});
	// client position reports are sent again after 100 ms (lost packets); NOTIFY_REPEAT_LATEST: only the newest one
	let notifySeq = 0;
	hook('C_NOTIFY_LOCATION_IN_ACTION', 4, (event) => {
		if (!enabled) return;
		noteRealLoc(event.loc);
		realClientLoc = { x: event.loc.x, y: event.loc.y, z: event.loc.z };
		let clamped = false;
		const la = action;
		if (la && la.limitEnd && Math.hypot(event.loc.x - la.start.x, event.loc.y - la.start.y) > Math.hypot(la.limitEnd.x - la.start.x, la.limitEnd.y - la.start.y) + 5) {
			event.loc = { x: la.limitEnd.x, y: la.limitEnd.y, z: event.loc.z };
			clamped = true;
		}
		xloc = event.loc.x; yloc = event.loc.y; zloc = event.loc.z; wloc = event.w;
		actionLocUpdated = true;
		if (!predicting()) return;

		const actionAtNotify = lastEvent;
		const copy = { skill: getSkillId(event.skill), stage: event.stage, loc: { x: event.loc.x, y: event.loc.y, z: event.loc.z }, w: event.w };
		if (CLS.notify) CLS.notify(copy);
		const seq = ++notifySeq;
		for (const d of (DEF.NOTIFY_REPEATS || [100])) {
			setTimeout(() => {
				if (lastEvent !== actionAtNotify) return;
				if (DEF.NOTIFY_REPEAT_LATEST && seq !== notifySeq) return;
				dispatch.toServer('C_NOTIFY_LOCATION_IN_ACTION', 4, copy);
			}, d);
		}
		if (clamped) return true;
	});

	const DUPLICATE_MESSAGES = DEF.DUPLICATE_MESSAGES || ['@2059', '@36'];
	let lastSystemMessage = '';

	// Abdull
	function retryEchoPending() {
		const now = Date.now();
		return Object.values(retryEchoes).some(list => list.some(t => now - t <= 600));
	}
	tryHookMain('S_SYSTEM_MESSAGE', 1, (event) => {
		if (!predicting()) return;
		if (retryEchoPending()) {
			recordPacket('S->C', 'S_SYSTEM_MESSAGE [BLOCKED: answer to a retry copy]', { message: event.message });
			return false;
		}
		if (DUPLICATE_MESSAGES.includes(event.message) && lastSystemMessage === event.message) return false;
		lastSystemMessage = event.message;
	});
	hook('C_START_SKILL', 7, { order: -1000 }, () => { lastSystemMessage = ''; });

	function resetState() {
		currentClientActionId = null;
		passthroughIds.clear();
		if (action) clearActionTimers(action);
		action = null;
		resetCharge();
		hold = null;
		lockonPrep = null;
		lockTrack = null;
		clearLockTimeout();
		mounted = false;
		lastSkill = 0;
		serverActive = null;
		activeAbnormals.clear();
		if (CLS.reset) CLS.reset();
	}

	hook('S_LOGIN', 12, (event) => {
		cid = event.gameId;
		model = event.templateId;
		job = (model - 10101) % 100;
		enabled = job === JOB;
		glyphState = {};
		resetState();
		resetGlyphFactors('login');
		loadKnownSkills();
	});
	hook('S_LOAD_TOPO', 3, (event) => {
		petIds = new Set();
		npcInfo = new Map();
		playerIds = new Set();
		unknownRefused = new Map();
		enabled = event.zone === 118 ? false : job === JOB;
		resetState();
		realLoc = null;
		noteRealLoc(event.loc);
	});
	tryHookMain('S_SPAWN_ME', 3, () => { mounted = false; });

	const knownSkills = new Set();
	let knownSkillsModel = 0;
	async function loadKnownSkills() {
		if (!model || knownSkillsModel === model || typeof dispatch.queryData !== 'function') return;
		knownSkillsModel = model;
		try {
			const nodes = await dispatch.queryData('/SkillData/Skill@templateId=?/', [model], true, false, ['id']);
			knownSkills.clear();
			for (const n of (nodes || [])) if (n.attributes && n.attributes.id) knownSkills.add(Number(n.attributes.id));
		} catch (e) { knownSkillsModel = 0; }
	}

	const skillExists = (id) => (knownSkills.size ? knownSkills.has(Number(id))
		: (subOf(Number(id)) < 30 || !DEF.CHAIN_GROUPS || DEF.CHAIN_GROUPS.includes(groupOf(Number(id)))));

	if (opts.initialState && opts.initialState.cid !== undefined && opts.initialState.cid !== null) {
		cid = opts.initialState.cid;
		model = opts.initialState.model;
		job = (model - 10101) % 100;
		enabled = job === JOB && opts.initialState.enabled !== false;
		if (opts.initialState.aspd) aspd = opts.initialState.aspd;
		if (opts.initialState.glyphState) glyphState = Object.assign({}, opts.initialState.glyphState);
	}

	try {
		const me = dispatch.game && dispatch.game.me;
		if (me && me.gameId && me.templateId && cid === null) {
			cid = me.gameId;
			model = me.templateId;
			job = (model - 10101) % 100;
			enabled = job === JOB;
		}
	} catch (e) {}
	loadKnownSkills();

	const setMounted = (state, via) => {
		if (mounted === state) return;
		mounted = state;
		recordPacket('S->C', state ? 'MOUNT (prediction paused)' : 'UNMOUNT (prediction active)', { via });
	};
	[['S_MOUNT_VEHICLE', 2, e => e.gameId, true], ['S_UNMOUNT_VEHICLE', 2, e => e.gameId, false],
		['S_MOUNT_VEHICLE_EX', 1, e => e.target, true], ['S_UNMOUNT_VEHICLE_EX', 1, e => e.target, false]].forEach(([name, ver, who, state]) => {
		try { hook(name, ver, (event) => { if (who(event) === cid) setMounted(state, name); }); } catch (e) {}
	});

	function glyphInfo() {
		const list = [];
		for (const [crest, eff] of Object.entries(DEF.GLYPHS || {})) {
			if (isGlyph(Number(crest))) list.push(`${eff.name || crest} (${crest})`);
		}
		const learned = Object.entries(learnedSpeed).map(([k, f]) => `${k} speed x${f}`)
			.concat(Object.entries(glyphFactors).map(([k, f]) => `${k} duration x${f}`));
		if (chargeCorrection !== 1) learned.push(`charge x${chargeCorrection}`);
		const active = Object.keys(glyphState).filter(k => glyphState[k]);
		return `Glyph handling: ${formatState(config.AUTO_GLYPH_SYNC)} | known glyphs active: ${list.length ? list.join(', ') : 'none'} | ` +
			`learned: ${learned.length ? learned.join(', ') : 'nothing'} | active glyph IDs: ${active.length ? active.join(', ') : 'none known'}`;
	}

	function skillSwitchCommand(on, words) {
		const names = Object.keys(SKILL_SWITCHES);
		// green = predicted, red = switched off
		const colored = (n) => `<font color="${(config.SKILL_PREDICTION || {})[n] === false ? '#FF5555' : '#00FF88'}">${n}</font>`;
		const listNames = () => { for (let i = 0; i < names.length; i += 10) sendChat(`Skills: ${names.slice(i, i + 10).map(colored).join(', ')}`); };
		const want = switchName(words.join(''));
		if (!want) { sendChat(`Usage: !${CMD} ${on ? 'enable' : 'disable'} <skill>`); return listNames(); }
		const hits = SKILL_SWITCHES[want] ? [want] : names.filter(n => n.includes(want));
		if (hits.length !== 1) {
			sendChat(hits.length ? `"${words.join(' ')}" fits more than one skill: ${hits.join(', ')}` : `Unknown skill "${words.join(' ')}"`);
			return hits.length ? undefined : listNames();
		}
		const name = hits[0];
		config.SKILL_PREDICTION = Object.assign({}, config.SKILL_PREDICTION, { [name]: on });
		saveConfig();
		sendChat(`${SWITCH_LABEL[name]} prediction: ${formatState(on)}`);
	}

	const commandKeys = (cmd) => cmd.keys || [cmd.key];
	const commandState = (cmd) => commandKeys(cmd).every(k => (cmd.invert ? !config[k] : Boolean(config[k])));

	function handleCommand(args) {
		const sub = (args[0] || '').toLowerCase();
		const toggle = (key, label, invert = false) => {
			config[key] = !config[key]; saveConfig();
			sendChat(`${label}: ${formatState(invert ? !config[key] : config[key])}`);
		};
		if (sub === 'on' || sub === 'off') {
			enabled = sub === 'on' && job === JOB;
			if (!enabled) resetState();
			return sendChat(`${DEF.CLASS_LABEL} skill prediction: ${formatState(enabled)}`, true);
		}
		if (sub === 'bug') return dumpBugReport(args.slice(1));
		if (HAS_LOCKON && sub === 'lockon') return toggle('INSTANT_LOCKON', 'Instant lock-on');
		if (sub === 'ghost') return toggle('GHOST_FIX', 'Ghost protection');
		if (DEF.OMNI && sub === 'omni') {
			if (!config.OMNI && !omni.start()) {
				const err = omni.lastError();
				return sendChat(`Omnidirectional skills: the keyboard hook (iohook) could not be loaded - ${err && err.message ? err.message : 'unknown error'}`);
			}
			config.OMNI = !config.OMNI; saveConfig();
			if (!config.OMNI) omni.stop();
			return sendChat(`Omnidirectional skills: ${formatState(config.OMNI)}${config.OMNI ? ` - hold ${omni.keyLabel()} to send backsteps, Teleport Jaunt, dashes ... that way` : ''}`);
		}
		if (sub === 'gate') {
			gateFix = !gateFix;
			if (!gateFix && action) action.limitEnd = null;
			return sendChat(`Gate protection: ${formatState(gateFix)}${gateFix ? ' - gates / barriers stop moving skills and teleports like without the mod' : ' - moving skills and teleports go through gates / barriers again (all classes, until the Toolbox restarts)'}`);
		}
		if (HAS_LOCKON && sub === 'lockcast') return toggle('PREDICT_LOCKON', 'Lock-on cast prediction');
		if (sub === 'log') return toggle('LOG_SKILLS', 'Live skill log (server durations)');
		if (sub === 'learn') {
			config.LEARN_MODE = !config.LEARN_MODE;
			if (config.LEARN_MODE) { config.LOG_SKILLS = true; resetState(); }
			saveConfig();
			return sendChat(`Learn mode: ${formatState(config.LEARN_MODE)}${config.LEARN_MODE ? ' - server durations are written to skill_data.json, the prediction is OFF until you switch it off again' : ''}`);
		}
		if (sub === 'disable' || sub === 'enable') return skillSwitchCommand(sub === 'enable', args.slice(1));
		if (CLS.command && CLS.command(sub, args) === true) return;
		if (sub === 'glyphsync') return toggle('AUTO_GLYPH_SYNC', 'Glyph handling');
		if (sub === 'glyph') return sendChat(glyphInfo());
		if (sub === 'glyphs') {
			glyphLog = !glyphLog;
			sendChat(`Glyph log: ${formatState(glyphLog)}${glyphLog ? ' - every glyph change is shown with its ID and name' : ''}`);
			if (glyphLog) listActiveGlyphs('Active glyphs');
			return;
		}
		if (sub === 'abnormals') {
			abnLog = !abnLog;
			return sendChat(`Buff log: ${formatState(abnLog)}${abnLog ? ' - every buff on your character is shown with ID, name, duration and your last skill' : ''}`);
		}
		if (sub === 'debug') { showDebug = !showDebug; return sendChat(`Debug messages: ${formatState(showDebug)}`); }
		if (DEF.COMMANDS && DEF.COMMANDS[sub]) {
			const cmd = DEF.COMMANDS[sub];
			const next = !commandState(cmd);
			for (const k of commandKeys(cmd)) config[k] = cmd.invert ? !next : next;
			saveConfig();
			return sendChat(`${cmd.label}: ${formatState(next)}`);
		}
		if (sub === 'reload') { loadFiles(); if (DEF.OMNI && config.OMNI) omni.start(); return sendChat('config.json & skill_data.json reloaded!'); }
		if (HAS_LOCKON && sub === 'lockreset') {
			learnedTypes = {};
			unknownRefused = new Map();
			try { fs.writeFileSync(LEARNED_TARGETS_PATH, '{}', 'utf8'); } catch (e) {}
			return sendChat('Learned lock-on targets cleared (learned_targets.json)');
		}
		if (sub === 'reset') {
			skills = JSON.parse(JSON.stringify(DEF.DEFAULT_SKILLS));
			saveSkillData();
			return sendChat('skill_data.json was reset to the measured default values!');
		}

		const st = (s) => (s ? '<font color="#00FF88">[ON]</font>' : '<font color="#FF5555">[OFF]</font>');
		const c = (cmd, label, state) => `<font color="#FFD700">!${CMD} ${cmd}</font> ${label}${state === undefined ? '' : ' ' + st(state)}`;
		const offSkills = Object.keys(SKILL_SWITCHES).filter(n => (config.SKILL_PREDICTION || {})[n] === false);
		sendChat(`Commands: ${c('on/off', 'prediction', enabled)} | ${c('disable/enable [skill]', 'prediction of one skill')}${offSkills.length ? ' (off: ' + offSkills.join(', ') + ')' : ''}${DEF.OMNI ? ' | ' + c('omni', `${omni.keyNames().toUpperCase()} direction for movement skills`, config.OMNI) : ''} | ${c('bug [count] [note]', 'save bug report')}`);
		if (HAS_LOCKON) {
			sendChat(`Lock-on: ${c('lockon', 'instant lock-on', config.INSTANT_LOCKON)} | ${c('lockcast', 'cast prediction', config.PREDICT_LOCKON)}`);
		}
		const extra = Object.keys(DEF.COMMANDS || {}).filter(k => !DEF.COMMANDS[k].hidden).map(k => c(k, DEF.COMMANDS[k].label, commandState(DEF.COMMANDS[k])));
		if (CLS.help) for (const h of CLS.help()) extra.push(c(h[0], h[1], h[2]));
		for (let i = 0; i < extra.length; i += 3) sendChat(`${DEF.CLASS_LABEL}: ${extra.slice(i, i + 3).join(' | ')}`);
	}

	const MAX_BUG_LOG_ENTRIES = 300;
	const BUG_DIR_PATH = path.join(modDir, 'bug_reports');
	const BUG_LATEST_PATH = path.join(modDir, 'bug_report_latest.log');
	const packetRingBuffer = [];
	let lastRecordTime = 0;

	// Soaria
	function recordPacket(dir, packetName, details) {
		if (!enabled) return;
		const now = Date.now();
		const d = new Date(now);
		const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`;
		let clsState = '';
		try { clsState = CLS.bugState ? ' ' + CLS.bugState() : ''; } catch (e) {}
		packetRingBuffer.push({
			time, deltaMs: lastRecordTime ? now - lastRecordTime : 0, dir, packetName, details: details || {},
			state: `last=${lastSkill} action=${action ? action.skillId + (action.finished ? '(done)' : '(running)') : '-'} client=${currentClientActionId} charge=${charge ? charge.level : '-'} hold=${hold ? 1 : 0}${clsState}`
		});
		lastRecordTime = now;
		if (packetRingBuffer.length > MAX_BUG_LOG_ENTRIES) packetRingBuffer.shift();
	}
	const fmtLoc = (loc) => (loc ? `${Math.round(loc.x)},${Math.round(loc.y)},${Math.round(loc.z)}` : '-');

	function dumpBugReport(args) {
		let count = MAX_BUG_LOG_ENTRIES;
		const noteParts = [];
		for (const a of args) {
			if (/^\d+$/.test(a) && noteParts.length === 0) count = Math.max(1, Math.min(MAX_BUG_LOG_ENTRIES, parseInt(a, 10)));
			else noteParts.push(a);
		}
		const slice = packetRingBuffer.slice(-count);
		const header = [
			'='.repeat(80),
			`${NAME.toUpperCase()} FLIGHT RECORDER BUG REPORT (${new Date().toISOString()})`,
			`Mod:        Skill-Prediction by Soaria`,
			`Note:       ${noteParts.join(' ').trim() || 'No note given'}`,
			`Entries:    last ${slice.length} of ${packetRingBuffer.length} buffered packets`,
			`State:      lastSkill=${lastSkill} | action=${action ? skillLabel(action.skillId) + (action.finished ? ' done' : ' running') : '-'} | client ID=${currentClientActionId}`,
			`            aspd=${aspd.toFixed(3)} x${speedMult().toFixed(2)} | mounted=${mounted} | locked: ${Object.keys(disabSkill).filter(k => disabSkill[k]).join(', ') || '-'}`,
			`            ${glyphInfo().replace(/<[^>]*>/g, '')}`,
			(CLS.bugState ? `Class:      ${CLS.bugState()}` : ''),
			(refusedPairs.size ? `Learned:    refused during (group>group): ${[...refusedPairs].join(', ')}` : ''),
			'='.repeat(80),
			''
		].filter(Boolean);
		const body = slice.map((e, i) => {
			const details = Object.entries(e.details).map(([k, v]) => `${k}=${v}`).join(' | ');
			return `[#${String(i + 1).padStart(3, '0')}] [${e.time}] (+${String(e.deltaMs).padStart(4, ' ')}ms) [${e.dir.padEnd(7, ' ')}] ${e.packetName.padEnd(34, ' ')} | ${details} || ${e.state}`;
		});
		const text = header.concat(body).join('\n') + '\n';
		try {
			if (!fs.existsSync(BUG_DIR_PATH)) fs.mkdirSync(BUG_DIR_PATH, { recursive: true });
			const stamp = new Date().toISOString().replace(/[:.]/g, '-');
			const slug = noteParts.join(' ').trim().toLowerCase()
				.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
				.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
			fs.writeFileSync(path.join(BUG_DIR_PATH, `${CMD}_bug_report_${stamp}${slug ? '_' + slug : ''}.log`), text, 'utf8');
			fs.writeFileSync(BUG_LATEST_PATH, text, 'utf8');
			sendChat(`Last ${slice.length} packets saved to <font color="#FFD700">bug_report_latest.log</font> and the bug_reports folder.`);
		} catch (e) {
			console.error(`[${NAME}] Error while writing the bug report:`, e);
		}

		if (action && !action.finished) {
			const a = action;
			a.finished = true;
			clearActionTimers(a);
			sendEnd(a.skillId, 0, realLoc || currentLoc(a.start), a.w, a.id);
		}
		resetCharge();
		hold = null;
		if (CLS.reset) CLS.reset();
	}

	function tryHook(name, version, opts, cb) {
		try { hook(name, version, opts, cb); } catch (e) {  }
	}
	const skillDetails = (event) => {
		const details = { skill: skillLabel(getSkillId(event.skill)) };
		if (event.press !== undefined) details.press = event.press;
		if (event.type !== undefined) details.type = event.type;
		if (event.loc) details.loc = fmtLoc(event.loc);
		return details;
	};
	[['C_START_SKILL', 7], ['C_START_TARGETED_SKILL', 6], ['C_START_COMBO_INSTANT_SKILL', 4], ['C_START_INSTANCE_SKILL', 5],
		['C_PRESS_SKILL', 4], ['C_CANCEL_SKILL', 3]].forEach(([name, ver]) => {
		tryHook(name, ver, { order: -1000000, filter: { fake: false } }, (event) => {
			if (enabled) recordPacket('C->S', name, skillDetails(event));
		});
		tryHook(name, ver, { order: 1000000, filter: { fake: false, silenced: true } }, (event) => {
			if (enabled) recordPacket('C->S', `${name} [BLOCKED]`, { skill: skillLabel(getSkillId(event.skill)) });
		});
		tryHook(name, ver, { order: 1000000, filter: { fake: true, silenced: null } }, (event) => {
			if (enabled) recordPacket('MOD->S', name, skillDetails(event));
		});
	});
	[[false, ''], [true, ' [BLOCKED]']].forEach(([silenced, tag]) => {
		tryHook('S_ACTION_STAGE', 9, { order: 1000000, filter: { fake: false, silenced } }, (event) => {
			if (enabled && event.gameId === cid) recordPacket('S->C', `S_ACTION_STAGE${tag}`, { skill: skillLabel(getSkillId(event.skill)), stage: event.stage, speed: Number(event.speed).toFixed(3), id: event.id, loc: fmtLoc(event.loc) });
		});
		tryHook('S_ACTION_END', 5, { order: 1000000, filter: { fake: false, silenced } }, (event) => {
			if (enabled && event.gameId === cid) recordPacket('S->C', `S_ACTION_END${tag}`, { skill: skillLabel(getSkillId(event.skill)), type: event.type, id: event.id, loc: fmtLoc(event.loc) });
		});
	});
	[['S_CANNOT_START_SKILL', 4], ['S_GRANT_SKILL', 3], ['S_START_COOLTIME_SKILL', 3]].forEach(([name, ver]) => {
		tryHook(name, ver, { order: 1000000, filter: { fake: false, silenced: null } }, (event) => {
			if (enabled) recordPacket('S->C', name, { skill: skillLabel(getSkillId(event.skill)), cooldown: event.cooldown });
		});
	});
	tryHook('S_EACH_SKILL_RESULT', 13, { order: 1000000, filter: { fake: false, silenced: null } }, (event) => {
		if (enabled && event.target === cid && event.reaction && event.reaction.enable) {
			recordPacket('S->C', 'S_EACH_SKILL_RESULT (CC/reaction)', { skill: getSkillId(event.reaction.skill) });
		}
	});
	tryHook('S_CREST_APPLY', 2, { order: 1000000, filter: { fake: null, silenced: null } }, (event) => {
		if (enabled) recordPacket('S->C', 'S_CREST_APPLY', { id: event.id, enable: crestEnabled(event) });
	});

	const api = {
		hook, tryHook: tryHookMain, setTimeout, clearTimeout,
		get config() { return config; },
		get skills() { return skills; },
		saveConfig, sendChat, debugChat, recordPacket, skillLabel, formatState,
		predicting, inReaction, holdRequest, markUnpredicted, skillExists, enabled: () => enabled, cid: () => cid, model: () => model, aspd: () => aspd,
		action: () => action, lastSkill: () => lastSkill, lastEvent: () => lastEvent,
		setLastSkill: (id, ev) => { lastSkill = id; if (ev) lastEvent = ev; },
		charge: () => charge, hold: () => hold,
		isGlyph, hasAbnormal: (id) => activeAbnormals.has(Number(id)),
		startAction, finishPrevious, scheduleActionEnd, clearActionTimers, sendStage, sendEnd, applyLocks,

		releaseHold: () => {
			if (!hold) return;
			const h = hold;
			hold = null;
			if (action !== h.action || h.action.finished) return;
			clearActionTimers(h.action);
			h.action.finished = true;
			sendEnd(h.skillId, (familyDef(h.skillId) || {}).releaseEndType || 11, currentLoc(h.action.start), h.action.w, h.action.id);
		},
		lock, unlock, unlockAll, isLocked, sendRetry, scheduleRetries, copyEvent, withSkillId,
		currentLoc, realLoc: () => realLoc, startCharge, startHold, resetCharge, cancelChargeAndHold,
		predictChargeRelease, scheduleReleaseRetries, dispatch, trackRequest, estimateRtt,

		holdRetries: (group) => { if (req && req.group === group) req.retries = Math.max(req.retries, 1); },

		startSkill: (name, version, event) => { if (handleStart(name, version, event, true) !== false) dispatch.toServer(name, version, event); },
		startPress: (event) => {
			const sid = getSkillId(event.skill);
			const res = handlePress(event);
			if (event.press) forwardedPress[sid] = res !== false;
			if (res !== false) dispatch.toServer('C_PRESS_SKILL', 4, event);
		},
		familyDef, dataOf, durationOf, matchesAny, lastStillRunning, lastRunningHere, chainSource, resolveTarget,
		serverSkillAckAt: (id) => serverSkillAckAt[id] || 0, serverAckAt: (group) => serverAckAt[group] || 0,
		serverActive: () => serverActive,

		cooldownLeft: (id) => Math.max(0, (cooldownUntil[id] || 0) - Date.now() - estimateRtt() / 2),
		setClientAction: (id) => { currentClientActionId = id; }, clientAction: () => currentClientActionId,
		isPlayerSkill, groupOf, subOf, baseOf, getSkillId, GLOBAL_LOCK_DELAY
	};
	if (typeof DEF.setup === 'function') Object.assign(CLS, DEF.setup(api) || {});

	return {
		handleCommand,
		reloadConfig() { loadFiles(); return config.GLOBAL_LATENCY; },

		_state: () => ({ action, lastSkill, currentClientActionId, charge, hold, aspd, enabled, skills, config, timers: timers.size, learnedSpeed, glyphFactors, chargeCorrection, locks: Object.keys(disabSkill).filter(k => disabSkill[k]) }),

		saveState() {
			return { cid, model, job, aspd, enabled, showDebug, glyphLog, abnLog, glyphState, partyIds: [...partyIds], partyByPlayer: [...partyByPlayer], petIds: [...petIds] };
		},
		loadState(state) {
			if (!state || state.cid === null || state.cid === undefined) return;
			cid = state.cid;
			model = state.model;
			job = state.job;
			aspd = state.aspd || 1;
			glyphState = state.glyphState || {};
			partyIds = new Set(state.partyIds || []);
			partyByPlayer = new Map(state.partyByPlayer || []);
			petIds = new Set(state.petIds || []);
			enabled = Boolean(state.enabled) && job === JOB;
			showDebug = Boolean(state.showDebug);
			glyphLog = Boolean(state.glyphLog);
			abnLog = Boolean(state.abnLog);
			if (enabled) sendChat(`reloaded - ${formatState(true)} (config.json & skill_data.json read)`, true);
		},

		destructor() {
			destroyed = true;
			if (learnedSaveTimer) {
				global.clearTimeout(learnedSaveTimer);
				try { fs.writeFileSync(LEARNED_TARGETS_PATH, JSON.stringify(learnedTypes, null, '\t'), 'utf8'); } catch (e) {}
			}
			timers.forEach(h => global.clearTimeout(h));
			timers.clear();
			if (CLS.destroy) { try { CLS.destroy(); } catch (e) {} }
			for (const h of hooks) { try { dispatch.unhook(h); } catch (e) {} }
			hooks.length = 0;
		}
	};
};
// DTmaik
