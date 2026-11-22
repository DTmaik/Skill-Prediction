'use strict';
// Abdull

const DEFAULT_SKILLS = {
	sharanBolt: { name: 'Sharan Bolt', durations: [820, 823, 823, 823] },
	corruptionRing: { name: 'Corruption Ring (release)', releaseDuration: 830 },
	ancientBinding: { name: 'Ancient Binding', duration: 1283 },
	sharasLash: { name: "Shara's Lash", duration: 1288 },
	manaInfusion: { name: 'Mana Infusion', duration: 4605 },
	resurrect: { name: 'Resurrect', duration: 8054 },
	metamorphicBlast: { name: 'Metamorphic Blast', duration: 836 },
	auras: { name: 'Auras (on/off)', duration: 1286 },
	teleportJaunt: { name: 'Teleport Jaunt', stages: [214, 248], moveDelay: 0 },
	arunsVitae: { name: "Arun's Vitae", duration: 821 },
	arunsTears: { name: "Arun's Tears", duration: 823 },
	metamorphicSmite: { name: 'Metamorphic Smite', duration: 1441 },
	thrallOfProtection: { name: 'Thrall of Protection', duration: 2993 },
	thrallOfLife: { name: 'Thrall of Life', duration: 1418 },
	thrallOfVengeance: { name: 'Thrall of Vengeance', duration: 1415 },
	thrallOfWrath: { name: 'Thrall of Wrath', duration: 2994 },
	wardingTotem: { name: 'Warding Totem', duration: 1900 },
	totems: { name: 'Numbing/Speed/Assailing Totem', duration: 1900 },
	boomerangPulse: { name: 'Boomerang Pulse', duration: 545 },

	sonorousDreams: { name: 'Sonorous Dreams (cast)', duration: 1431 },
	curseOfExhaustion: { name: 'Curse of Exhaustion (cast)', duration: 680 },
	mire: { name: 'Mire (cast)', duration: 981 }
};

const FAMILIES = {
	1: { key: 'sharanBolt', mode: 'combo', subs: [0, 1, 2, 3] },
	2: { key: 'corruptionRing', mode: 'hold', releaseSub: 11, releaseEndType: 11 },
	4: { key: 'ancientBinding', mode: 'simple' },
	5: { key: 'titanicFavor', mode: 'lockon', castSub: 10, predictCast: false, lockTimeout: 60000 },

	6: { key: 'sharasLash', mode: 'simple', cancelGuardConfig: 'NO_LASH_CANCEL' },
	7: { key: 'manaInfusion', mode: 'simple' },
	8: { key: 'metamorphicBlast', mode: 'simple' },
	9: { key: 'arunsCleansing', mode: 'lockon', castSub: 10, predictCast: false, lockTimeout: 60000 },
	10: { key: 'resurrect', mode: 'simple' },
	12: { key: 'vowOfRebirth', mode: 'passthrough' },
	13: { key: 'auras', mode: 'simple', subs: [0, 50] },
	14: { key: 'auras', mode: 'simple', subs: [0, 50] },
	15: { key: 'auras', mode: 'simple', subs: [0, 50] },
	16: { key: 'auras', mode: 'simple', subs: [0, 50] },
	17: { key: 'teleportJaunt', mode: 'jaunt' },
	18: { key: 'arunsVitae', mode: 'simple', cancelGuardConfig: 'NO_MOTE_CANCEL' },
	21: { key: 'retaliate', mode: 'passthrough' },
	22: { key: 'arunsTears', mode: 'simple', cancelGuardConfig: 'NO_MOTE_CANCEL' },
	23: { key: 'metamorphicSmite', mode: 'simple' },
	24: { key: 'volleyOfCurses', mode: 'lockon', castSub: 10, predictCast: false, lockTimeout: 5000 },
	25: { key: 'thrallOfProtection', mode: 'simple' },
	27: { key: 'thrallOfLife', mode: 'simple' },
	28: { key: 'sonorousDreams', mode: 'lockon', castSub: 10, fixedSpeed: true, moving: true, lockTimeout: 5000 },
	30: { key: 'curseOfExhaustion', mode: 'lockon', castSub: 10, fixedSpeed: true, moving: true, lockTimeout: 5000 },
	31: { key: 'curseOfConfusion', mode: 'lockon', castSub: 10, predictCast: false, lockTimeout: 5000 },
	32: { key: 'mire', mode: 'lockon', castSub: 10, fixedSpeed: true, moving: true, lockTimeout: 5000 },
	33: { key: 'thrallOfVengeance', mode: 'simple' },
	34: { key: 'thrallOfWrath', mode: 'simple' },

	37: { key: 'wardingTotem', mode: 'simple' },
	38: { key: 'totems', mode: 'simple' },
	39: { key: 'totems', mode: 'simple' },
	40: { key: 'totems', mode: 'simple' },
	41: { key: 'contagion', mode: 'lockon', castSub: 10, predictCast: false, lockTimeout: 5000 },
	42: { key: 'boomerangPulse', mode: 'simple', flatAimConfig: 'BOOMERANG_FLAT_AIM', flatAimRange: 1000 }
};

const PARTY_LOCK_GROUPS = [12];

const GLYPHS = {
	27044: { name: 'Hastened Mana Infusion', groups: [7], speed: 1.25 },
	27049: { name: 'Hastened Resurrect (uncommon)', groups: [10], speed: 1.40 },
	27079: { name: 'Hastened Resurrect (common)', groups: [10], speed: 1.40 },
	27057: { name: 'Hastened Thrall of Wrath', groups: [34], speed: 1.30 },
	27042: { name: 'Hastened Metamorphic Smite', groups: [23], speed: 1.25 }
};

module.exports = {
	LEGACY: { dirs: ['neuesMysticSP'] },
	DATA_DIR: 'mystic',
	NAME: 'Mystic-SP',
	CMD: 'mystic',
	CLASS_LABEL: 'Mystic',
	JOB: 7,
	AUTHORS: 'DTmaik',

	OMNI: {
		17: { dir: 'north', dest: 350 }
	},
	COLOR: '#9370DB',
	DEFAULT_SKILLS,
	FAMILIES,
	GLYPHS,
	PARTY_LOCK_GROUPS,
	// blind copies of a start request (the server ignores one that arrives a few ms before its previous skill ends): 3 instead of the
	// core default of 6 - with 6 every press reached the server 3-6 times, which server anti-cheat tools read as packet spam
	RETRY_DELAYS: [35, 75, 115],
	SPEED_ABNORMALS: {},
	EXTRA_CONFIG: {
		NO_MOTE_CANCEL: true,
		NO_MOTE_CANCEL_DESCRIPTION: "Moving can no longer cancel Arun's Vitae / Arun's Tears before the mote was thrown. A move cancel is held back and sent right after the throw (!mystic motes)",
		NO_LASH_CANCEL: true,
		NO_LASH_CANCEL_DESCRIPTION: "Moving can no longer cancel Shara's Lash before the projectile was fired. A move cancel is held back and sent right after it (!mystic stun, switched together with LASH_QUICK_CANCEL)",
		BOOMERANG_FLAT_AIM: false,
		BOOMERANG_FLAT_AIM_DESCRIPTION: 'Boomerang Pulse is always shot straight forward (in the aimed direction) instead of into the ground or the sky (!mystic boomerang)'
	},
	COMMANDS: {
		motes: { key: 'NO_MOTE_CANCEL', label: 'No mote cancel' },
		stun: { key: 'NO_LASH_CANCEL', label: "No Shara's Lash cancel" },
		boomerang: { key: 'BOOMERANG_FLAT_AIM', label: 'Boomerang always straight' }
	}
};
// Soaria
