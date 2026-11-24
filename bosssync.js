'use strict';
// Boss sync (same idea as the mod "no-more-boss-desyncs" by Kasea - remove that mod when you use this):
// after every action of a boss / mob the client gets the position and direction the server ended it at. Without it the client
// sometimes keeps the boss where its own animation left it (terrain, skipped stages, lag) - attacks then come from a spot the boss
// is not at, and the client aims dashes / lock-ons (Overwhelm, ...) at the wrong place. Only the client view changes, nothing goes
// to the server.

// same choice as the library mod: aggressive NPCs, special NPCs (relation 12) and training dummies (relation 10 + spawnType 1)
const isMob = (e) => !e.villager && !(e.owner && BigInt(e.owner) !== 0n)
	&& Boolean(e.aggressive || e.relation === 12 || (e.relation === 10 && e.spawnType === 1));

module.exports = function startBossSync(dispatch, isOn) {
	const mobs = new Set();
	const hooks = [];
	const tryHook = (...args) => { try { hooks.push(dispatch.hook(...args)); } catch (e) {} };

	tryHook('S_LOAD_TOPO', 3, () => { mobs.clear(); });
	tryHook('S_SPAWN_NPC', 11, (e) => { if (isMob(e)) mobs.add(String(e.gameId)); else mobs.delete(String(e.gameId)); });
	tryHook('S_DESPAWN_NPC', 3, (e) => { mobs.delete(String(e.gameId)); });
	// a boss that spawned before the mod was (re)loaded is only known by its HP bar (log ttb-1795519479802: no spawn, 16 action ends)
	tryHook('S_BOSS_GAGE_INFO', 3, (e) => { if (e.id) mobs.add(String(e.id)); });
	tryHook('S_ACTION_END', 5, (e) => {
		if (!e.loc || !mobs.has(String(e.gameId)) || !isOn()) return;
		try { dispatch.toClient('S_INSTANT_MOVE', 3, { gameId: e.gameId, loc: { x: e.loc.x, y: e.loc.y, z: e.loc.z }, w: e.w }); } catch (err) {}
	});

	return {
		stop() {
			for (const h of hooks) { try { dispatch.unhook(h); } catch (e) {} }
			hooks.length = 0;
			mobs.clear();
		}
	};
};
