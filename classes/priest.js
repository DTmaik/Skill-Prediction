'use strict';
// DTmaik

const DEFAULT_SKILLS = {
	divineRadiance: { name: 'Divine Radiance', durations: [868, 954, 973, 1036] },
	regenerationCircle: { name: 'Regeneration Circle', duration: 3176 },
	healingCircle: { name: 'Healing Circle', duration: 1758 },
	blessings: { name: 'Blessings (Shakan/Zenobia/Seren/Arachne/Balder)', duration: 1286 },
	arise: { name: 'Arise', duration: 830 },
	manaInfusion: { name: 'Mana Infusion', duration: 4589 },
	purifyingCircle: { name: 'Purifying Circle', duration: 1281 },
	metamorphicBlast: { name: 'Metamorphic Blast', duration: 824 },
	shockingImplosion: { name: 'Shocking Implosion', duration: 1721 },
	prayerOfPeace: { name: 'Prayer of Peace', stages: [929, 941, 826] },
	healThyself: { name: 'Heal Thyself', duration: 1262 },
	kaiasShield: { name: "Kaia's Shield", duration: 659 },
	fieryEscape: { name: 'Fiery Escape', duration: 1104, distance: -229 },
	finalReprisal: { name: 'Final Reprisal (chain)', duration: 1035 },
	manaCharge: { name: 'Mana Charge', chargeStages: [800, 1600], releaseDuration: 794 },
	tripleNemesis: { name: 'Triple Nemesis', durations: [1140, 1200, 1687] },
	restorativeBurst: { name: 'Restorative Burst', duration: 1421 },
	backstep: { name: 'Backstep', duration: 648, distance: -196 },
	graceOfResurrection: { name: 'Grace of Resurrection', duration: 5903 },
	resurrect: { name: 'Resurrect', duration: 5890 },
	zenobiasVortex: { name: "Zenobia's Vortex", duration: 1068 },

	focusHeal: { name: 'Focus Heal (cast)', duration: 1945 },
	plagueOfExhaustion: { name: 'Plague of Exhaustion (cast)', duration: 1424 },
	isharasLullaby: { name: "Ishara's Lullaby (cast)", stages: [289, 1437] },
	energyStars: { name: 'Energy Stars (cast)', duration: 1422 },
	healingImmersion: { name: 'Healing Immersion (cast)', duration: 1433 },
	divineIntervention: { name: 'Divine Intervention (cast)', duration: 924 }
};

const FAMILIES = {
	1: { key: 'divineRadiance', mode: 'combo', subs: [0, 1, 2, 3] },
	2: { key: 'regenerationCircle', mode: 'simple' },
	3: { key: 'healingCircle', mode: 'simple' },
	5: { key: 'blessings', mode: 'simple' },
	6: { key: 'arise', mode: 'simple' },
	8: { key: 'manaInfusion', mode: 'simple' },
	10: { key: 'purifyingCircle', mode: 'simple' },
	11: { key: 'metamorphicBlast', mode: 'simple' },
	12: { key: 'resurrect', mode: 'simple' },
	15: { key: 'blessings', mode: 'simple' },
	16: { key: 'shockingImplosion', mode: 'simple' },
	17: { key: 'prayerOfPeace', mode: 'stages' },
	18: { key: 'healThyself', mode: 'simple' },
	19: { key: 'focusHeal', mode: 'lockon', castSub: 10, lockTimeout: 60000 },
	20: { key: 'blessings', mode: 'simple' },
	21: { key: 'blessings', mode: 'simple' },
	22: { key: 'kaiasShield', mode: 'simple' },
	23: { key: 'blessings', mode: 'simple' },
	25: { key: 'retaliate', mode: 'passthrough' },
	26: { key: 'fieryEscape', mode: 'simple' },
	27: { key: 'finalReprisal', mode: 'chain', chainSub: 30, chainFrom: [11, 16, 29, 40] },
	28: { key: 'manaCharge', mode: 'charge', releaseSubs: [10, 11, 12] },
	29: { key: 'tripleNemesis', mode: 'combo', subs: [0, 1, 2] },
	30: { key: 'plagueOfExhaustion', mode: 'lockon', castSub: 10, fixedSpeed: true, moving: true, lockTimeout: 5000 },
	33: { key: 'isharasLullaby', mode: 'lockon', castSub: 10, fixedSpeed: true, moving: true, lockTimeout: 5000 },
	34: { key: 'restorativeBurst', mode: 'simple' },
	35: { key: 'energyStars', mode: 'lockon', castSub: 10, fixedSpeed: true, moving: true, lockTimeout: 5000 },
	37: { key: 'healingImmersion', mode: 'lockon', castSub: 10, fixedSpeed: true, lockTimeout: 5000 },
	38: { key: 'backstep', mode: 'simple' },
	39: { key: 'graceOfResurrection', mode: 'simple' },
	40: { key: 'zenobiasVortex', mode: 'simple' },
	41: { key: 'divineIntervention', mode: 'lockon', castSub: 10, lockTimeout: 60000 }
};

const PARTY_LOCK_GROUPS = [37, 41];

const GLYPHS = {
	28031: { name: 'Hastened Mana Charge', charge: 1.25 },
	28045: { name: 'Hastened Resurrect', groups: [12], speed: 1.30 },
	28044: { name: 'Hastened Mana Infusion (uncommon)', groups: [8], speed: 1.25 },
	28077: { name: 'Hastened Mana Infusion (common)', groups: [8], speed: 1.25 }
};

module.exports = {
	LEGACY: { dirs: ['neuesPriestSP'] },
	DATA_DIR: 'priest',
	NAME: 'Priest-SP',
	CMD: 'priest',
	CLASS_LABEL: 'Priest',
	JOB: 6,
	AUTHORS: 'Soaria',

	OMNI: {
		26: { dir: 'south' },
		38: { dir: 'south' }
	},
	COLOR: '#F0E68C',
	DEFAULT_SKILLS,
	FAMILIES,
	GLYPHS,
	PARTY_LOCK_GROUPS,

	SPEED_ABNORMALS: { 801802: 1.1 },
	EXTRA_CONFIG: {
		SPOOF_GRANT: true,
		SPOOF_GRANT_DESCRIPTION: 'When you let go of the Mana Charge key, the release starts right away instead of waiting for the server to allow it (one ping). Does not release on its own (!priest grant)',
		DISABLE_CHARGE: false,
		DISABLE_CHARGE_DESCRIPTION: 'Disables the charge display of Mana Charge (for unstable connections) (!priest charge)',
	},
	COMMANDS: {
		grant: { key: 'SPOOF_GRANT', label: 'No ping delay on Mana Charge release' },
		charge: { key: 'DISABLE_CHARGE', label: 'Mana Charge display', invert: true },
	}
};
// Soaria
