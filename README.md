# Skill-Prediction

Skill prediction for TERA Patch 31. Your skills play the moment you press them.
One mod for all supported classes, it picks the right one when you log in.

Made mainly for the [OSTO](https://oldschool.to/) server. It should also work on other
Patch 31 servers, but it was not tested there.

Supported: Berserker, Gunner, Archer, Sorcerer, Reaper, Slayer, Lancer, Warrior,
Priest, Mystic.

## Install

1. Download this repository (Code > Download ZIP) and extract it.
2. Put the folder in your Toolbox `mods` folder and name it `Skill-Prediction`.
3. Remove/Disable other Skill-Prediction modules in your Toolbox, also Remove/Disable the mod `omnidirectional` as it's already build into this mod.

Do not run it together with another skill prediction mod.

## Commands

Every class has its own command: `!zerk`, `!gunner`, `!archer`, `!sorc`,
`!reaper`, `!slayer`, `!lancer`, `!warrior`, `!priest`, `!mystic`. On its own
it shows all options of that class and whether they are on.

| Command | What it does |
| --- | --- |
| `!<class>` | List of options with their state |
| `!<class> on` / `off` | Turn it on or off |
| `!<class> omni` | Omnidirectional skills: hold W, A, S or D with Backstep, Teleport Jaunt, Fiery Escape, a charging dash and similar, and the skill goes that way (off by default, not for Berserker and Reaper) |
| `!<class> bug [note]` | Save a log for bug reports |
| `!<class> reload` | Read the config again after editing it by hand |
| `!sp ping <ms>` | Set your ping once for all classes (`!sp ping` shows it) |

Some class options:

| Class | Options |
| --- | --- |
| Berserker | `grant`, `charge` (charge release without ping, charge display) |
| Gunner | `burst [ms]` Burst Fire speed, `grant`, `charge`, `abproj` |
| Archer | `rf [ms]` Rapid Fire speed, `grant`, `charge`, `rfstop` |
| Sorcerer | `grant`, `charge`, `lockon`, `lockcast` |
| Reaper | `slowgrim` |
| Slayer | `backstab` |
| Lancer | none |
| Warrior | `bdrepeat`, `bdlock`, `backstab` |
| Priest | `lockon`, `lockcast`, `grant`, `charge` |
| Mystic | `lockon`, `lockcast`, `motes`, `stun`, `boomerang` |

Settings are saved per class in `data/<class>/config.json`. Every option has a
short description there.

## Reporting problems

Right after something goes wrong, type `!<class> bug` (for example
`!priest bug no animations`) and send the newest file from the `bug_reports`
folder with a short description.
