import {
  ABILITIES,
  ENEMIES,
  GROUPS,
  ITEMS,
  WEAPONS,
  abilityCost,
  canCast,
  defensePool,
  magicOf,
  poolFor,
  rollDrain,
  rollPool,
  soakPool,
  strike,
  type AbilityId,
  type ItemId,
  type Member,
  type PoolRoll,
} from "./model";

export type Foe = {
  uid: string;
  tpl: string;
  name: string;
  tag: "chrome" | "flesh" | "spirit" | "grid";
  hp: number;
  maxHp: number;
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
  sprite: string;
  intent: string;
};

export type SpiritAdd = {
  uid: string;
  name: string;
  hp: number;
  maxHp: number;
  turns: number;
  fresh: boolean;
};

export type Slot = { side: "party" | "add" | "foe"; id: string; init: number };

export type LogLine = { t: string; kind: "info" | "hit" | "miss" | "bad" };

export type RollView = {
  title: string;
  attack: number[];
  defense: number[];
  soak: number[] | null;
  note: string;
};

export type Fight = {
  groupId: string;
  name: string;
  foes: Foe[];
  adds: SpiritAdd[];
  order: Slot[];
  cursor: number;
  round: number;
  guard: Record<string, boolean>;
  armorUp: Record<string, number>;
  defUp: Record<string, number>;
  defDown: Record<string, number>;
  atkDown: Record<string, number>;
  edge: Record<string, boolean>;
  log: LogLine[];
  last: RollView | null;
  phase: "pick" | "win" | "lose";
  creds: number;
  rep: number;
  boss: boolean;
  flag?: string;
  then?: string;
  summoned: boolean;
  snap: { x: number; y: number } | null;
};

export type Act =
  | { type: "attack"; target: number; push?: boolean }
  | { type: "ability"; id: AbilityId; target: number; push?: boolean }
  | { type: "item"; id: ItemId; target: number }
  | { type: "guard" };

function log(f: Fight, t: string, kind: LogLine["kind"] = "info") {
  f.log.unshift({ t, kind });
  f.log = f.log.slice(0, 24);
}

function livingParty(party: Member[]) {
  return party.map((m, i) => ({ m, i })).filter((x) => x.m.hp > 0);
}

function livingFoes(f: Fight) {
  return f.foes.map((foe, i) => ({ foe, i })).filter((x) => x.foe.hp > 0);
}

export function currentSlot(f: Fight): Slot | null {
  return f.order[f.cursor] ?? null;
}

function foeById(f: Fight, id: string) {
  return f.foes.find((foe) => foe.uid === id);
}

function memberById(party: Member[], id: string) {
  return party.find((m) => m.id === id);
}

export function startFight(
  party: Member[],
  groupId: string,
  extra: { flag?: string; then?: string; snap?: { x: number; y: number } | null },
): Fight {
  const g = GROUPS[groupId] ?? GROUPS["vault-drone"]!;
  const fight: Fight = {
    groupId,
    name: g.name,
    foes: g.enemies.map((id, i) => {
      const t = ENEMIES[id]!;
      return {
        uid: `${id}-${i}`,
        tpl: id,
        name: t.name,
        tag: t.tag,
        hp: t.hp,
        maxHp: t.hp,
        body: t.body,
        quick: t.quick,
        will: t.will,
        atk: t.atk,
        def: t.def,
        armor: t.armor,
        dv: t.dv,
        melee: t.melee,
        mana: t.mana,
        init: t.init,
        special: t.special,
        sprite: t.sprite,
        intent: t.melee ? "Cut" : "Shoot",
      };
    }),
    adds: [],
    order: [],
    cursor: 0,
    round: 0,
    guard: {},
    armorUp: {},
    defUp: {},
    defDown: {},
    atkDown: {},
    edge: Object.fromEntries(party.map((m) => [m.id, true])),
    log: [],
    last: null,
    phase: "pick",
    creds: g.creds,
    rep: g.rep,
    boss: Boolean(g.boss),
    flag: extra.flag,
    then: extra.then,
    summoned: false,
    snap: extra.snap ?? null,
  };
  log(fight, `${g.name}. Five-and-sixes hit.`, "info");
  beginRound(fight, party);
  return fight;
}

function beginRound(f: Fight, party: Member[]) {
  f.round += 1;
  f.guard = {};
  f.armorUp = {};
  f.defUp = {};
  f.defDown = {};
  f.atkDown = {};
  for (const m of party) {
    if (m.hp > 0) m.focus = Math.min(m.maxFocus, m.focus + 2);
  }
  for (const a of f.adds) {
    if (a.fresh) {
      a.fresh = false;
      continue;
    }
    a.turns -= 1;
    if (a.turns <= 0) a.hp = 0;
  }
  f.adds = f.adds.filter((a) => a.hp > 0 && a.turns > 0);
  const order: Slot[] = [];
  for (const m of party) {
    if (m.hp <= 0) continue;
    const die = 1 + Math.floor(Math.random() * 6);
    order.push({ side: "party", id: m.id, init: m.attrs.quick * 2 + m.reflex + die });
  }
  for (const foe of f.foes) {
    if (foe.hp <= 0) continue;
    const die = 1 + Math.floor(Math.random() * 6);
    order.push({ side: "foe", id: foe.uid, init: foe.init + die });
    if (foe.special === "helix" && foe.hp < foe.maxHp * 0.55 && !f.summoned) foe.intent = "Compile";
    else if (foe.special === "bolt" && f.round % 2 === 0) foe.intent = "Bolt";
    else foe.intent = foe.melee ? "Cut" : "Shoot";
  }
  for (const a of f.adds) {
    const die = 1 + Math.floor(Math.random() * 6);
    order.push({ side: "add", id: a.uid, init: 8 + die });
  }
  order.sort((a, b) => b.init - a.init);
  f.order = order;
  f.cursor = 0;
  if (!order.length) {
    finish(f, party);
    return;
  }
  if (!slotAlive(f, party, order[0]!)) skipToAlive(f, party);
}

function slotAlive(f: Fight, party: Member[], slot: Slot) {
  if (slot.side === "party") return (memberById(party, slot.id)?.hp ?? 0) > 0;
  if (slot.side === "foe") return (foeById(f, slot.id)?.hp ?? 0) > 0;
  return f.adds.some((a) => a.uid === slot.id && a.hp > 0 && a.turns > 0);
}

function finish(f: Fight, party: Member[]) {
  const foesUp = livingFoes(f).length > 0;
  const partyUp = livingParty(party).length > 0;
  if (!foesUp && partyUp) f.phase = "win";
  else if (!partyUp) f.phase = "lose";
  else if (!foesUp) f.phase = "win";
}

function skipToAlive(f: Fight, party: Member[]) {
  let hops = 0;
  while (f.phase === "pick" && hops++ < 40) {
    const slot = f.order[f.cursor];
    if (slot && slotAlive(f, party, slot)) return;
    f.cursor += 1;
    if (f.cursor >= f.order.length) {
      finish(f, party);
      if (f.phase !== "pick") return;
      beginRound(f, party);
      return;
    }
  }
}

export function advance(f: Fight, party: Member[]) {
  finish(f, party);
  if (f.phase !== "pick") return;
  f.cursor += 1;
  if (f.cursor >= f.order.length) {
    beginRound(f, party);
    return;
  }
  skipToAlive(f, party);
}

function healAmt(m: Member, n: number) {
  if (m.hp <= 0) return 0;
  const bonus = m.metatype === "knurl" ? 2 : 0;
  const before = m.hp;
  m.hp = Math.min(m.maxHp, m.hp + n + bonus);
  return m.hp - before;
}

function show(f: Fight, title: string, atk: PoolRoll, def: PoolRoll | null, soak: PoolRoll | null, note: string) {
  f.last = {
    title,
    attack: atk.dice,
    defense: def?.dice ?? [],
    soak: soak?.dice ?? null,
    note,
  };
}

function hurtFoe(f: Fight, index: number, dmg: number) {
  const foe = f.foes[index];
  if (!foe || dmg <= 0) return;
  foe.hp = Math.max(0, foe.hp - dmg);
}

export function perform(
  f: Fight,
  party: Member[],
  items: Record<string, number>,
  action: Act,
): { error?: string } {
  if (f.phase !== "pick") return { error: "The round is over." };
  const slot = currentSlot(f);
  if (!slot || slot.side !== "party") return { error: "Not your turn." };
  const m = memberById(party, slot.id);
  if (!m || m.hp <= 0) return { error: "Down." };

  if (action.type === "guard") {
    f.guard[m.id] = true;
    f.defUp[m.id] = (f.defUp[m.id] ?? 0) + 3;
    f.armorUp[m.id] = (f.armorUp[m.id] ?? 0) + 2;
    m.focus = Math.min(m.maxFocus, m.focus + 2);
    log(f, `${m.name} guards.`, "info");
    advance(f, party);
    return {};
  }

  if (action.type === "item") {
    const spec = ITEMS[action.id];
    if ((items[action.id] ?? 0) <= 0) return { error: `No ${spec.name}.` };
    const ally = party[action.target];
    if (!ally) return { error: "No one there." };
    if (action.id === "trauma") {
      if (ally.hp > 0) return { error: "They're still up." };
      ally.hp = Math.min(ally.maxHp, 12);
      log(f, `${spec.name} pulls ${ally.name} back.`, "hit");
    } else if (ally.hp <= 0) {
      return { error: "That won't wake them. Use a trauma patch." };
    } else if (action.id === "medkit") {
      const n = healAmt(ally, 14);
      log(f, `${m.name} uses a medkit on ${ally.name} (+${n}).`, "hit");
    } else {
      const n = healAmt(ally, 6);
      ally.focus = Math.min(ally.maxFocus, ally.focus + 8);
      log(f, `Stim on ${ally.name} (+${n} hp).`, "hit");
    }
    items[action.id] = (items[action.id] ?? 1) - 1;
    advance(f, party);
    return {};
  }

  const foe = f.foes[action.target];
  const push = Boolean(action.push && f.edge[m.id]);
  const pushDice = push ? m.attrs.edge : 0;

  if (action.type === "attack") {
    if (!foe || foe.hp <= 0) return { error: "Pick a target still standing." };
    const w = WEAPONS[m.weapon];
    let dice = poolFor(m, w.skill) + pushDice;
    if (w.melee && !m.front) dice = Math.max(1, dice - 2);
    const def = Math.max(0, (w.mana ? foe.will : foe.def) - (f.defDown[foe.uid] ?? 0));
    const soak = w.mana ? foe.will : foe.body + foe.armor;
    const hit = strike({ atkDice: dice, defDice: def, dv: w.dv + Math.floor(m.attrs.str / 3), soakDice: soak });
    if (push) f.edge[m.id] = false;
    if (hit.self) m.hp = Math.max(0, m.hp - hit.self);
    hurtFoe(f, action.target, hit.dmg);
    show(f, `${m.name} · ${w.name}`, hit.atk, hit.def, hit.soak, hit.note);
    log(f, `${m.name} → ${foe.name}: ${hit.note}`, hit.miss ? "miss" : "hit");
    advance(f, party);
    return {};
  }

  const ab = ABILITIES[action.id];
  const why = canCast(m, action.id);
  if (why) return { error: why };
  const cost = abilityCost(m, action.id);
  const needsFoe = ab.target === "enemy";
  if (needsFoe && (!foe || foe.hp <= 0)) return { error: "Pick a target still standing." };
  if (!ab.drain && m.focus < cost) return { error: "Not enough focus." };
  if (!ab.drain) m.focus -= cost;

  const noteDrain = () => {
    if (!ab.drain) return;
    const d = rollDrain(m, cost);
    m.focus = Math.max(0, m.focus - d.focus);
    m.hp = Math.max(0, m.hp - d.hp);
    log(
      f,
      `Drain ${cost}: resisted ${d.roll.hits}. ${d.hp ? `${d.hp} to flesh.` : `${d.focus} focus.`}`,
      d.hp ? "bad" : "info",
    );
  };

  if (action.id === "suppress" || action.id === "lag" || action.id === "hex") {
    for (const foe of f.foes) {
      if (foe.hp <= 0) continue;
      f.defDown[foe.uid] = (f.defDown[foe.uid] ?? 0) + 2;
      if (action.id === "hex") f.atkDown[foe.uid] = (f.atkDown[foe.uid] ?? 0) + 2;
    }
    if (push) f.edge[m.id] = false;
    noteDrain();
    log(f, `${m.name} uses ${ab.name}.`, "info");
    advance(f, party);
    return {};
  }

  if (action.id === "barrier" || action.id === "crawler" || action.id === "blur") {
    const allies =
      ab.target === "all-allies" ? party.filter((p) => p.hp > 0) : ab.target === "self" ? [m] : [party[action.target]!];
    if (ab.target === "ally" && (!party[action.target] || party[action.target]!.hp <= 0)) {
      if (!ab.drain) m.focus += cost;
      return { error: "Pick someone still up." };
    }
    for (const ally of allies) {
      if (!ally) continue;
      if (action.id === "blur") f.defUp[ally.id] = (f.defUp[ally.id] ?? 0) + 4;
      else f.armorUp[ally.id] = (f.armorUp[ally.id] ?? 0) + 3;
    }
    if (push) f.edge[m.id] = false;
    noteDrain();
    log(f, `${m.name} uses ${ab.name}.`, "info");
    advance(f, party);
    return {};
  }

  if (action.id === "mend" || action.id === "soothe" || action.id === "medspider" || action.id === "editor") {
    const ally = action.id === "editor" ? m : party[action.target];
    if (!ally || ally.hp <= 0) {
      if (!ab.drain) m.focus += cost;
      return { error: "Pick someone still up." };
    }
    const skill = action.id === "mend" ? "sorcery" : action.id === "soothe" ? "conjuring" : "hardware";
    const rolled = rollPool(poolFor(m, skill) + pushDice);
    if (push) f.edge[m.id] = false;
    const base = action.id === "medspider" ? 8 + m.attrs.logic : action.id === "editor" ? 10 : 8 + rolled.hits;
    const n = healAmt(ally, base);
    show(f, `${m.name} · ${ab.name}`, rolled, null, null, `+${n} hp`);
    noteDrain();
    log(f, `${ab.name} on ${ally.name} (+${n}).`, "hit");
    advance(f, party);
    return {};
  }

  if (action.id === "moth") {
    if (push) f.edge[m.id] = false;
    const existing = f.adds[0];
    if (existing && existing.hp > 0) {
      existing.hp = Math.min(existing.maxHp, existing.hp + 8);
      existing.turns = Math.max(existing.turns, 2);
      log(f, "The moth steadies.", "info");
    } else {
      f.adds = [
        {
          uid: "moth",
          name: "Ember Moth",
          hp: 16,
          maxHp: 16,
          turns: 3,
          fresh: true,
        },
      ];
      log(f, "An ember moth pulls itself out of the soot.", "hit");
    }
    noteDrain();
    advance(f, party);
    return {};
  }

  if (!foe) return { error: "No target." };
  let atkDice = 0;
  let dv = 4;
  let mana = false;
  let defDice = Math.max(0, foe.def - (f.defDown[foe.uid] ?? 0));
  let soakDice = foe.body + foe.armor;

  if (action.id === "burst") {
    atkDice = poolFor(m, "firearms");
    dv = 5;
  } else if (action.id === "cut") {
    atkDice = poolFor(m, "blades") + (m.front ? 0 : -2);
    dv = WEAPONS.katana.dv + 2;
  } else if (action.id === "spike" || action.id === "sponge") {
    atkDice = poolFor(m, "hack");
    if (!m.cyber.includes("datajack")) return { error: "No jack." };
    defDice = foe.will - (f.defDown[foe.uid] ?? 0);
    if (foe.tag === "chrome" || foe.tag === "grid") defDice -= 2;
    if (foe.tag === "spirit") defDice += 3;
    mana = true;
    soakDice = foe.will;
    dv = action.id === "sponge" ? 3 : 6;
  } else if (action.id === "rotor") {
    atkDice = poolFor(m, "pilot");
    dv = 5;
  } else if (action.id === "manabolt") {
    atkDice = poolFor(m, "sorcery");
    if (magicOf(m) <= 0) return { error: "No magic left." };
    defDice = foe.will;
    soakDice = foe.will;
    mana = true;
    dv = 6;
  } else if (action.id === "nerve") {
    atkDice = poolFor(m, "unarmed");
    defDice = foe.def;
    soakDice = foe.will;
    mana = true;
    dv = 7;
  }
  atkDice = Math.max(0, atkDice + pushDice);
  const hit = strike({
    atkDice,
    defDice: Math.max(0, defDice),
    dv,
    soakDice: Math.max(0, soakDice),
  });
  if (push) f.edge[m.id] = false;
  if (hit.self) m.hp = Math.max(0, m.hp - hit.self);
  hurtFoe(f, action.target, hit.dmg);
  if (action.id === "sponge" && !hit.miss) m.focus = Math.min(m.maxFocus, m.focus + 4);
  show(f, `${m.name} · ${ab.name}`, hit.atk, hit.def, hit.soak, hit.note + (mana ? " · mana" : ""));
  log(f, `${ab.name} → ${foe.name}: ${hit.note}`, hit.miss ? "miss" : "hit");
  noteDrain();
  advance(f, party);
  return {};
}

export function foeAct(f: Fight, party: Member[]) {
  if (f.phase !== "pick") return;
  const slot = currentSlot(f);
  if (!slot || slot.side === "party") return;
  if (slot.side === "add") {
    const add = f.adds.find((a) => a.uid === slot.id);
    const options = livingFoes(f);
    if (add && options.length) {
      const pick = options[Math.floor(Math.random() * options.length)]!;
      const hit = strike({
        atkDice: 6,
        defDice: Math.max(0, pick.foe.will - (f.defDown[pick.foe.uid] ?? 0)),
        dv: 4,
        soakDice: pick.foe.will,
      });
      hurtFoe(f, pick.i, hit.dmg);
      show(f, "Ember Moth", hit.atk, hit.def, hit.soak, hit.note);
      log(f, `Moth → ${pick.foe.name}: ${hit.note}`, hit.miss ? "miss" : "hit");
    }
    advance(f, party);
    return;
  }
  const foe = foeById(f, slot.id);
  if (!foe || foe.hp <= 0) {
    advance(f, party);
    return;
  }
  if (foe.special === "helix" && foe.hp < foe.maxHp * 0.55 && !f.summoned) {
    f.summoned = true;
    f.foes.push({
      uid: "hound-s",
      tpl: "hound",
      name: "Compiled Hound",
      tag: "grid",
      hp: 16,
      maxHp: 16,
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
      intent: "Shoot",
    });
    log(f, "Helix compiles a hound out of the lock.", "bad");
    advance(f, party);
    return;
  }
  const ups = livingParty(party);
  if (!ups.length) {
    f.phase = "lose";
    return;
  }
  const fronts = ups.filter((x) => x.m.front);
  const pool = foe.melee && fronts.length ? fronts : ups;
  const pick = pool[Math.floor(Math.random() * pool.length)]!;
  const bolt = foe.intent === "Bolt" || (foe.mana && foe.special === "bolt");
  const mana = bolt || foe.mana;
  const atkDice = Math.max(1, foe.atk - (f.atkDown[foe.uid] ?? 0));
  const defDice = mana
    ? pick.m.attrs.will + (f.defUp[pick.m.id] ?? 0)
    : defensePool(pick.m) + (f.defUp[pick.m.id] ?? 0);
  const soakDice =
    (mana ? pick.m.attrs.will : soakPool(pick.m, false)) + (f.armorUp[pick.m.id] ?? 0);
  const hit = strike({ atkDice, defDice, dv: foe.dv, soakDice });
  if (hit.self) foe.hp = Math.max(0, foe.hp - hit.self);
  pick.m.hp = Math.max(0, pick.m.hp - hit.dmg);
  show(f, `${foe.name} · ${foe.intent}`, hit.atk, hit.def, hit.soak, hit.note);
  log(f, `${foe.name} → ${pick.m.name}: ${hit.note}`, hit.miss ? "miss" : "bad");
  advance(f, party);
}
