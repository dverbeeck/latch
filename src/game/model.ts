export type Metatype = "human" | "ael" | "knurl" | "husk" | "titan";
export type Archetype =
  | "razor"
  | "jack"
  | "dronehand"
  | "spellwright"
  | "caller"
  | "channel";
export type SkillId =
  | "firearms"
  | "blades"
  | "unarmed"
  | "athletics"
  | "hack"
  | "sorcery"
  | "conjuring"
  | "pilot"
  | "influence"
  | "hardware";
export type WeaponId = "katana" | "pistol" | "heavy" | "knife" | "staff" | "hands";
export type AbilityId =
  | "burst"
  | "cut"
  | "suppress"
  | "spike"
  | "lag"
  | "sponge"
  | "rotor"
  | "crawler"
  | "medspider"
  | "manabolt"
  | "barrier"
  | "mend"
  | "moth"
  | "soothe"
  | "hex"
  | "nerve"
  | "blur"
  | "editor";
export type ItemId = "medkit" | "stim" | "trauma";
export type Attrs = {
  body: number;
  quick: number;
  str: number;
  will: number;
  logic: number;
  charm: number;
  edge: number;
};

export type Member = {
  id: string;
  name: string;
  role: string;
  metatype: Metatype;
  archetype: Archetype;
  player: boolean;
  attrs: Attrs;
  skills: Partial<Record<SkillId, number>>;
  hp: number;
  maxHp: number;
  focus: number;
  maxFocus: number;
  integrity: number;
  reflex: number;
  armor: number;
  smart: number;
  hackMod: number;
  droneDisc: number;
  weapon: WeaponId;
  cyber: string[];
  front: boolean;
  abilities: AbilityId[];
};

export type Draft = { name: string; metatype: Metatype; archetype: Archetype };

export const METATYPES: {
  id: Metatype;
  name: string;
  line: string;
  mods: Partial<Attrs>;
}[] = [
  {
    id: "human",
    name: "Human",
    line: "Unchanged. Edge +1. The city still builds doors for your height.",
    mods: { edge: 1 },
  },
  {
    id: "ael",
    name: "Ael",
    line: "Bloom-stretched. Quick +1, Charm +1, Body −1. Long memory, thin ribs.",
    mods: { quick: 1, charm: 1, body: -1 },
  },
  {
    id: "knurl",
    name: "Knurl",
    line: "Dense bone. Body +1, Will +1, Quick −1. Toxins bounce. Ceilings don't.",
    mods: { body: 1, will: 1, quick: -1 },
  },
  {
    id: "husk",
    name: "Husk",
    line: "Tusks and a temper. Body +2, Strength +1, Logic −1, Charm −1.",
    mods: { body: 2, str: 1, logic: -1, charm: -1 },
  },
  {
    id: "titan",
    name: "Titan",
    line: "A walking lintel. Body +3, Strength +2, Quick −1, Logic −1, Charm −1. Hide like armor.",
    mods: { body: 3, str: 2, quick: -1, logic: -1, charm: -1 },
  },
];

export const ARCHETYPES: {
  id: Archetype;
  name: string;
  aka: string;
  line: string;
  street: string;
  vault: string;
}[] = [
  {
    id: "razor",
    name: "Razor",
    aka: "chrome and a promise",
    line: "Wired reflexes, plating, a sword that remembers being a logo.",
    street: "Close fast. Burst when they run.",
    vault: "Front rank. Cut, then shoot.",
  },
  {
    id: "jack",
    name: "Jack",
    aka: "grid, not guns",
    line: "A datajack and a cranial deck. You hurt machines from the inside.",
    street: "Spike chrome. Lag the room.",
    vault: "Ignore armor on anything with a wireless.",
  },
  {
    id: "dronehand",
    name: "Dronehand",
    aka: "a rig and three mouths",
    line: "You don't enter the room first. Your rotor does.",
    street: "Orbit strikes, a crawler brace, a medspider.",
    vault: "Ranged dice from Logic. Heals on a budget.",
  },
  {
    id: "spellwright",
    name: "Spellwright",
    aka: "hermetic, ink still wet",
    line: "Formulae, not vibes. Mana bolts. Barriers. A bill called drain.",
    street: "Bolt, wall, mend. Mind your focus.",
    vault: "Mana ignores plating. Drain does not ignore you.",
  },
  {
    id: "caller",
    name: "Caller",
    aka: "the moth answers",
    line: "A street rite with a patron. You don't cast alone.",
    street: "Summon, soothe, hex.",
    vault: "The moth takes a turn. You keep people upright.",
  },
  {
    id: "channel",
    name: "Channel",
    aka: "the art, in the meat",
    line: "No formulae. The body is the circle. Killing hands, blurred step.",
    street: "Melee that armor doesn't understand.",
    vault: "Front rank. Magic fists. Pain is a resource.",
  },
];

export const WEAPONS: Record<
  WeaponId,
  { name: string; skill: SkillId; dv: number; melee: boolean; mana: boolean }
> = {
  katana: { name: "Echo Katana", skill: "blades", dv: 6, melee: true, mana: false },
  pistol: { name: "Holdout", skill: "firearms", dv: 4, melee: false, mana: false },
  heavy: { name: "Ambassador", skill: "firearms", dv: 5, melee: false, mana: false },
  knife: { name: "Rite Knife", skill: "blades", dv: 3, melee: true, mana: false },
  staff: { name: "Moth Staff", skill: "blades", dv: 4, melee: true, mana: false },
  hands: { name: "Killing Hands", skill: "unarmed", dv: 5, melee: true, mana: true },
};

export type Ability = {
  id: AbilityId;
  name: string;
  short: string;
  blurb: string;
  cost: number;
  drain: boolean;
  target: "enemy" | "ally" | "all-enemies" | "all-allies" | "self";
  rt: "melee" | "shot" | "nova" | "heal" | "buff" | "slow" | "summon" | "dash";
};

export const ABILITIES: Record<AbilityId, Ability> = {
  burst: {
    id: "burst",
    name: "Burst",
    short: "Burst",
    blurb: "Holdout burst. Firearms dice, DV 5, one target.",
    cost: 1,
    drain: false,
    target: "enemy",
    rt: "shot",
  },
  cut: {
    id: "cut",
    name: "Spine Cut",
    short: "Cut",
    blurb: "Katana, +2 DV. You have to be in the front.",
    cost: 1,
    drain: false,
    target: "enemy",
    rt: "melee",
  },
  suppress: {
    id: "suppress",
    name: "Suppress",
    short: "Supp",
    blurb: "All foes defend at −2 until next round.",
    cost: 2,
    drain: false,
    target: "all-enemies",
    rt: "slow",
  },
  spike: {
    id: "spike",
    name: "Spike",
    short: "Spike",
    blurb: "Hack vs Will. Ignores armor. Chrome defends worse. Drain 3.",
    cost: 3,
    drain: true,
    target: "enemy",
    rt: "shot",
  },
  lag: {
    id: "lag",
    name: "Lag",
    short: "Lag",
    blurb: "All foes −2 defense. Drain 3.",
    cost: 3,
    drain: true,
    target: "all-enemies",
    rt: "slow",
  },
  sponge: {
    id: "sponge",
    name: "Sponge",
    short: "Sponge",
    blurb: "Steal focus on a hit. Drain 2.",
    cost: 2,
    drain: true,
    target: "enemy",
    rt: "shot",
  },
  rotor: {
    id: "rotor",
    name: "Rotor Strike",
    short: "Rotor",
    blurb: "Drone gunnery. Pilot + Logic, DV 5.",
    cost: 2,
    drain: false,
    target: "enemy",
    rt: "shot",
  },
  crawler: {
    id: "crawler",
    name: "Crawler Brace",
    short: "Brace",
    blurb: "An ally soaks with +3 armor dice until next round.",
    cost: 2,
    drain: false,
    target: "ally",
    rt: "buff",
  },
  medspider: {
    id: "medspider",
    name: "Medspider",
    short: "Spider",
    blurb: "Heal an ally for 8 + Logic.",
    cost: 2,
    drain: false,
    target: "ally",
    rt: "heal",
  },
  manabolt: {
    id: "manabolt",
    name: "Mana Bolt",
    short: "Bolt",
    blurb: "Sorcery vs Will. DV 6 + net, soaked with Will, not armor. Drain 4.",
    cost: 4,
    drain: true,
    target: "enemy",
    rt: "shot",
  },
  barrier: {
    id: "barrier",
    name: "Barrier",
    short: "Wall",
    blurb: "All allies +3 armor dice until next round. Drain 3.",
    cost: 3,
    drain: true,
    target: "all-allies",
    rt: "buff",
  },
  mend: {
    id: "mend",
    name: "Mend",
    short: "Mend",
    blurb: "Heal 8 + sorcery hits. Drain 3.",
    cost: 3,
    drain: true,
    target: "ally",
    rt: "heal",
  },
  moth: {
    id: "moth",
    name: "Ember Moth",
    short: "Moth",
    blurb: "A spirit takes turns for 3 rounds. Drain 4.",
    cost: 4,
    drain: true,
    target: "self",
    rt: "summon",
  },
  soothe: {
    id: "soothe",
    name: "Soothe",
    short: "Soothe",
    blurb: "Heal 8 + conjuring hits. Drain 2.",
    cost: 2,
    drain: true,
    target: "ally",
    rt: "heal",
  },
  hex: {
    id: "hex",
    name: "Hex",
    short: "Hex",
    blurb: "All foes −2 attack and defense this round. Drain 3.",
    cost: 3,
    drain: true,
    target: "all-enemies",
    rt: "slow",
  },
  nerve: {
    id: "nerve",
    name: "Nerve Strike",
    short: "Nerve",
    blurb: "Mana unarmed, DV 7, soaked with Will.",
    cost: 2,
    drain: false,
    target: "enemy",
    rt: "melee",
  },
  blur: {
    id: "blur",
    name: "Blur Step",
    short: "Blur",
    blurb: "+4 defense until next round.",
    cost: 1,
    drain: false,
    target: "self",
    rt: "dash",
  },
  editor: {
    id: "editor",
    name: "Pain Editor",
    short: "Editor",
    blurb: "Heal yourself 10.",
    cost: 2,
    drain: false,
    target: "self",
    rt: "heal",
  },
};

export const CYBER: {
  id: string;
  name: string;
  cost: number;
  essence: number;
  blurb: string;
}[] = [
  { id: "wired", name: "Wired Reflexes", cost: 480, essence: 1.2, blurb: "+3 initiative. Street swings come out faster." },
  { id: "dermal", name: "Dermal Plating", cost: 360, essence: 0.8, blurb: "+2 armor dice." },
  { id: "smart", name: "Smartlink", cost: 220, essence: 0.2, blurb: "+2 firearms dice." },
  { id: "muscle", name: "Muscle Augment", cost: 400, essence: 1.0, blurb: "+1 Body, +1 Strength." },
  { id: "datajack", name: "Datajack", cost: 180, essence: 0.2, blurb: "A port. Spikes require one." },
  { id: "deck", name: "Cranial Deck", cost: 520, essence: 0.6, blurb: "+2 hack dice." },
  { id: "rig", name: "Control Rig", cost: 500, essence: 1.0, blurb: "Drone commands cost 1 less focus." },
];

export const ITEMS: Record<ItemId, { name: string; cost: number; blurb: string }> = {
  medkit: { name: "Medkit", cost: 35, blurb: "Heal 14 HP." },
  stim: { name: "Stim", cost: 25, blurb: "Heal 6 HP and 8 focus." },
  trauma: { name: "Trauma Patch", cost: 70, blurb: "Wake a downed runner with 12 HP." },
};

const PACK: Record<
  Archetype,
  {
    attrs: Partial<Attrs>;
    skills: Partial<Record<SkillId, number>>;
    cyber: string[];
    weapon: WeaponId;
    front: boolean;
    abilities: AbilityId[];
    role: string;
  }
> = {
  razor: {
    attrs: { body: 1, quick: 1, str: 1 },
    skills: { blades: 3, firearms: 2, athletics: 2 },
    cyber: ["wired", "dermal", "smart"],
    weapon: "katana",
    front: true,
    abilities: ["burst", "cut", "suppress"],
    role: "Razor",
  },
  jack: {
    attrs: { logic: 2, quick: 1 },
    skills: { hack: 4, firearms: 2, hardware: 2 },
    cyber: ["datajack", "deck"],
    weapon: "pistol",
    front: false,
    abilities: ["spike", "lag", "sponge"],
    role: "Jack",
  },
  dronehand: {
    attrs: { logic: 1, quick: 1 },
    skills: { pilot: 4, firearms: 2, hardware: 2 },
    cyber: ["rig", "datajack"],
    weapon: "heavy",
    front: false,
    abilities: ["rotor", "crawler", "medspider"],
    role: "Dronehand",
  },
  spellwright: {
    attrs: { will: 2, logic: 1 },
    skills: { sorcery: 4, athletics: 1 },
    cyber: [],
    weapon: "knife",
    front: false,
    abilities: ["manabolt", "barrier", "mend"],
    role: "Spellwright",
  },
  caller: {
    attrs: { will: 1, charm: 2 },
    skills: { conjuring: 4, sorcery: 2, influence: 2 },
    cyber: [],
    weapon: "staff",
    front: false,
    abilities: ["moth", "soothe", "hex"],
    role: "Caller",
  },
  channel: {
    attrs: { body: 1, quick: 1, will: 1 },
    skills: { unarmed: 4, athletics: 3 },
    cyber: [],
    weapon: "hands",
    front: true,
    abilities: ["nerve", "blur", "editor"],
    role: "Channel",
  },
};

function blankAttrs(): Attrs {
  return { body: 3, quick: 3, str: 3, will: 3, logic: 3, charm: 3, edge: 2 };
}

function clampAttr(n: number) {
  return Math.max(1, Math.min(6, n));
}

export function magicOf(m: Member) {
  return Math.max(0, Math.floor(m.integrity + 1e-6));
}

export function isMystic(m: Member) {
  return m.archetype === "spellwright" || m.archetype === "caller" || m.archetype === "channel";
}

export function applyCyber(m: Member, id: string) {
  if (m.cyber.includes(id)) return false;
  const spec = CYBER.find((c) => c.id === id);
  if (!spec) return false;
  if (m.integrity - spec.essence < 0.05) return false;
  m.integrity = Math.round((m.integrity - spec.essence) * 10) / 10;
  m.cyber.push(id);
  if (id === "wired") m.reflex += 3;
  if (id === "dermal") m.armor += 2;
  if (id === "smart") m.smart += 2;
  if (id === "muscle") {
    m.attrs.body = clampAttr(m.attrs.body + 1);
    m.attrs.str = clampAttr(m.attrs.str + 1);
  }
  if (id === "deck") m.hackMod += 2;
  if (id === "rig") m.droneDisc = 1;
  recalc(m);
  return true;
}

export function recalc(m: Member) {
  const maxHp = 10 + m.attrs.body * 8 + (m.metatype === "titan" ? 6 : 0);
  const hpRatio = m.maxHp > 0 ? m.hp / m.maxHp : 1;
  m.maxHp = maxHp;
  m.hp = Math.max(0, Math.min(maxHp, Math.round(maxHp * (m.maxHp === maxHp ? hpRatio : hpRatio))));
  if (m.maxHp !== maxHp) {
    /* ratio already applied */
  }
  const mystic = isMystic(m);
  const maxFocus = 6 + m.attrs.will * 2 + (mystic ? 4 : 0);
  const fRatio = m.maxFocus > 0 ? m.focus / m.maxFocus : 1;
  m.maxFocus = maxFocus;
  m.focus = Math.max(0, Math.min(maxFocus, Math.round(maxFocus * fRatio)));
  if (m.metatype === "titan" && !m.cyber.includes("titan-hide")) {
    m.armor += 2;
    m.cyber.push("titan-hide");
  }
}

export function makeMember(
  id: string,
  name: string,
  metatype: Metatype,
  archetype: Archetype,
  player: boolean,
): Member {
  const pack = PACK[archetype];
  const meta = METATYPES.find((t) => t.id === metatype)!;
  const attrs = blankAttrs();
  (Object.keys(meta.mods) as (keyof Attrs)[]).forEach((k) => {
    attrs[k] = clampAttr(attrs[k] + (meta.mods[k] ?? 0));
  });
  (Object.keys(pack.attrs) as (keyof Attrs)[]).forEach((k) => {
    attrs[k] = clampAttr(attrs[k] + (pack.attrs[k] ?? 0));
  });
  const m: Member = {
    id,
    name,
    role: pack.role,
    metatype,
    archetype,
    player,
    attrs,
    skills: { ...pack.skills },
    hp: 1,
    maxHp: 1,
    focus: 1,
    maxFocus: 1,
    integrity: 6,
    reflex: 0,
    armor: 0,
    smart: 0,
    hackMod: 0,
    droneDisc: 0,
    weapon: pack.weapon,
    cyber: [],
    front: pack.front,
    abilities: [...pack.abilities],
  };
  recalc(m);
  for (const c of pack.cyber) applyCyber(m, c);
  m.hp = m.maxHp;
  m.focus = m.maxFocus;
  return m;
}

export function createPlayer(d: Draft): Member {
  const name = d.name.trim().slice(0, 18) || "Subject 04";
  return makeMember("pc", name, d.metatype, d.archetype, true);
}

export function companion(id: "nyx" | "cinder" | "sable"): Member {
  if (id === "nyx") {
    const m = makeMember("nyx", "Nyx Vale", "ael", "jack", false);
    m.role = "Jack";
    return m;
  }
  if (id === "cinder") {
    const m = makeMember("cinder", "Brother Cinder", "human", "caller", false);
    return m;
  }
  const m = makeMember("sable", "Sable Orth", "human", "razor", false);
  m.hp = Math.round(m.maxHp * 0.7);
  return m;
}

export function skillAttr(m: Member, skill: SkillId): number {
  if (skill === "hack" || skill === "hardware" || skill === "pilot") return m.attrs.logic;
  if (skill === "sorcery" || skill === "conjuring") return m.attrs.will;
  if (skill === "influence") return m.attrs.charm;
  return m.attrs.quick;
}

export function poolFor(m: Member, skill: SkillId): number {
  let pool = (m.skills[skill] ?? 0) + skillAttr(m, skill);
  if (skill === "firearms") pool += m.smart;
  if (skill === "hack") pool += m.hackMod;
  if (skill === "sorcery" || skill === "conjuring" || (skill === "unarmed" && m.weapon === "hands")) {
    const mag = magicOf(m);
    if (mag <= 0 && skill !== "unarmed") return 0;
    if (skill === "unarmed" && mag <= 0) return Math.max(1, (m.skills.unarmed ?? 0) + m.attrs.quick - 2);
    pool = Math.min(pool, mag + skillAttr(m, skill));
  }
  return Math.max(0, pool);
}

export function weaponPool(m: Member): number {
  return poolFor(m, WEAPONS[m.weapon].skill);
}

export function defensePool(m: Member): number {
  return m.attrs.quick + (m.skills.athletics ?? 0);
}

export function soakPool(m: Member, mana: boolean): number {
  if (mana) return m.attrs.will + (m.metatype === "knurl" ? 1 : 0);
  return m.attrs.body + m.armor + (m.metatype === "knurl" ? 1 : 0);
}

export function abilityCost(m: Member, id: AbilityId): number {
  const a = ABILITIES[id];
  return Math.max(0, a.cost - (m.droneDisc && (id === "rotor" || id === "crawler" || id === "medspider") ? 1 : 0));
}

export function canCast(m: Member, id: AbilityId): string | null {
  if ((id === "spike" || id === "lag" || id === "sponge") && !m.cyber.includes("datajack")) {
    return "Needs a datajack.";
  }
  if (
    (id === "manabolt" || id === "barrier" || id === "mend" || id === "moth" || id === "soothe" || id === "hex") &&
    magicOf(m) <= 0
  ) {
    return "Magic is gone. Too much chrome.";
  }
  if ((id === "nerve" || id === "blur") && magicOf(m) <= 0 && m.archetype === "channel") {
    return "The art slipped. Integrity is too low.";
  }
  return null;
}

export type PoolRoll = { dice: number[]; hits: number; ones: number; glitch: boolean };

export function rollPool(n: number, rng: () => number = Math.random): PoolRoll {
  const count = Math.max(0, Math.floor(n));
  const dice: number[] = [];
  for (let i = 0; i < count; i++) dice.push(1 + Math.floor(rng() * 6));
  const hits = dice.filter((d) => d >= 5).length;
  const ones = dice.filter((d) => d === 1).length;
  return { dice, hits, ones, glitch: count > 0 && ones > count / 2 };
}

export type Strike = {
  dmg: number;
  self: number;
  miss: boolean;
  atk: PoolRoll;
  def: PoolRoll;
  soak: PoolRoll | null;
  note: string;
};

export function strike(opts: {
  atkDice: number;
  defDice: number;
  dv: number;
  soakDice: number;
  noSoak?: boolean;
}): Strike {
  const atk = rollPool(opts.atkDice);
  const def = rollPool(opts.defDice);
  if (atk.glitch) {
    return {
      dmg: 0,
      self: 2,
      miss: true,
      atk,
      def,
      soak: null,
      note: "Glitch. The action bites you for 2.",
    };
  }
  if (atk.hits <= 0 || atk.hits < def.hits) {
    return { dmg: 0, self: 0, miss: true, atk, def, soak: null, note: "Miss." };
  }
  const net = atk.hits - def.hits;
  const raw = opts.dv + net;
  if (opts.noSoak) {
    return { dmg: Math.max(1, raw), self: 0, miss: false, atk, def, soak: null, note: `${raw} damage.` };
  }
  const soak = rollPool(opts.soakDice);
  const dmg = Math.max(net === 0 ? 0 : 1, raw - soak.hits);
  const dealt = soak.glitch ? raw : dmg;
  return {
    dmg: Math.max(0, dealt),
    self: 0,
    miss: dealt <= 0,
    atk,
    def,
    soak,
    note: dealt <= 0 ? "Soaked." : `${dealt} damage.`,
  };
}

export function rollDrain(m: Member, dv: number): { roll: PoolRoll; focus: number; hp: number } {
  const roll = rollPool(m.attrs.will + magicOf(m));
  let left = Math.max(0, dv - roll.hits);
  if (roll.glitch) left += 2;
  const focus = Math.min(m.focus, left);
  const hp = left - focus;
  return { roll, focus, hp };
}

export type EnemyTpl = {
  id: string;
  name: string;
  tag: "chrome" | "flesh" | "spirit" | "grid";
  hp: number;
  body: number;
  quick: number;
  will: number;
  atk: number;
  def: number;
  armor: number;
  dv: number;
  melee: boolean;
  mana: boolean;
  init: number;
  special: "none" | "bolt" | "helix";
  boss?: boolean;
  sprite: string;
};

export const ENEMIES: Record<string, EnemyTpl> = {
  drone: {
    id: "drone",
    name: "Patrol Drone",
    tag: "chrome",
    hp: 18,
    body: 2,
    quick: 3,
    will: 2,
    atk: 6,
    def: 3,
    armor: 2,
    dv: 4,
    melee: false,
    mana: false,
    init: 6,
    special: "none",
    sprite: "drone",
  },
  warden: {
    id: "warden",
    name: "Warden Drone",
    tag: "chrome",
    hp: 32,
    body: 4,
    quick: 3,
    will: 2,
    atk: 7,
    def: 4,
    armor: 2,
    dv: 5,
    melee: false,
    mana: false,
    init: 8,
    special: "none",
    boss: true,
    sprite: "drone",
  },
  security: {
    id: "security",
    name: "Amberline Security",
    tag: "chrome",
    hp: 20,
    body: 3,
    quick: 3,
    will: 3,
    atk: 6,
    def: 4,
    armor: 2,
    dv: 4,
    melee: false,
    mana: false,
    init: 6,
    special: "none",
    sprite: "corp",
  },
  ganger: {
    id: "ganger",
    name: "Red Receipt",
    tag: "flesh",
    hp: 18,
    body: 4,
    quick: 3,
    will: 2,
    atk: 6,
    def: 3,
    armor: 0,
    dv: 5,
    melee: true,
    mana: false,
    init: 5,
    special: "none",
    sprite: "ganger",
  },
  spirit: {
    id: "spirit",
    name: "Ash Spirit",
    tag: "spirit",
    hp: 16,
    body: 2,
    quick: 4,
    will: 5,
    atk: 7,
    def: 4,
    armor: 0,
    dv: 5,
    melee: false,
    mana: true,
    init: 7,
    special: "bolt",
    sprite: "spirit",
  },
  harvest: {
    id: "harvest",
    name: "Harvest Warden",
    tag: "spirit",
    hp: 46,
    body: 3,
    quick: 4,
    will: 6,
    atk: 8,
    def: 5,
    armor: 1,
    dv: 5,
    melee: false,
    mana: true,
    init: 9,
    special: "bolt",
    boss: true,
    sprite: "spirit",
  },
  razor: {
    id: "razor",
    name: "Corp Razor",
    tag: "chrome",
    hp: 26,
    body: 4,
    quick: 4,
    will: 3,
    atk: 7,
    def: 4,
    armor: 3,
    dv: 5,
    melee: true,
    mana: false,
    init: 8,
    special: "none",
    sprite: "corp",
  },
  hound: {
    id: "hound",
    name: "Grid Hound",
    tag: "grid",
    hp: 16,
    body: 2,
    quick: 4,
    will: 2,
    atk: 6,
    def: 3,
    armor: 1,
    dv: 4,
    melee: false,
    mana: false,
    init: 7,
    special: "none",
    sprite: "drone",
  },
  helix: {
    id: "helix",
    name: "Helix Marr",
    tag: "flesh",
    hp: 62,
    body: 3,
    quick: 4,
    will: 7,
    atk: 9,
    def: 6,
    armor: 2,
    dv: 6,
    melee: false,
    mana: true,
    init: 11,
    special: "helix",
    boss: true,
    sprite: "helix",
  },
  latch: {
    id: "latch",
    name: "The Latch",
    tag: "spirit",
    hp: 50,
    body: 4,
    quick: 4,
    will: 6,
    atk: 8,
    def: 5,
    armor: 0,
    dv: 6,
    melee: false,
    mana: true,
    init: 10,
    special: "bolt",
    boss: true,
    sprite: "latch",
  },
};

export type Group = {
  id: string;
  name: string;
  enemies: string[];
  creds: number;
  rep: number;
  boss?: boolean;
};

export const GROUPS: Record<string, Group> = {
  "vault-drone": { id: "vault-drone", name: "Patrol", enemies: ["drone"], creds: 30, rep: 1 },
  "vault-boss": { id: "vault-boss", name: "Warden", enemies: ["warden"], creds: 90, rep: 3, boss: true },
  recovery: { id: "recovery", name: "Recovery Team", enemies: ["security", "security"], creds: 45, rep: 2 },
  "dock-patrol": { id: "dock-patrol", name: "Dock Patrol", enemies: ["security"], creds: 28, rep: 1 },
  "ember-spirit": { id: "ember-spirit", name: "Ash", enemies: ["spirit"], creds: 32, rep: 1 },
  "ember-mix": { id: "ember-mix", name: "Receipts", enemies: ["ganger", "spirit"], creds: 48, rep: 2 },
  "ember-boss": {
    id: "ember-boss",
    name: "Harvest",
    enemies: ["harvest", "spirit"],
    creds: 130,
    rep: 4,
    boss: true,
  },
  "under-gang": { id: "under-gang", name: "Red Receipts", enemies: ["ganger", "ganger"], creds: 36, rep: 1 },
  "spire-razor": { id: "spire-razor", name: "Spire Detail", enemies: ["razor", "hound"], creds: 55, rep: 2 },
  "spire-duo": { id: "spire-duo", name: "Archive Guard", enemies: ["security", "razor"], creds: 60, rep: 2 },
  "spire-boss": { id: "spire-boss", name: "Helix Marr", enemies: ["helix"], creds: 200, rep: 5, boss: true },
  "latch-boss": { id: "latch-boss", name: "The Latch", enemies: ["latch"], creds: 80, rep: 4, boss: true },
  "plaza-team": { id: "plaza-team", name: "Plaza Team", enemies: ["security", "hound"], creds: 50, rep: 2 },
};

export function diceLine(dice: number[]) {
  return dice.join(" ");
}
