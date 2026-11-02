import { ENEMIES, GROUPS, WEAPONS, abilityCost, defensePool, poolFor, soakPool, strike, type AbilityId, type Member } from "./model";

export const AW = 480;
export const AH = 270;

export type RT = {
  id: string;
  name: string;
  side: "party" | "foe";
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  focus: number;
  maxFocus: number;
  speed: number;
  cd: number;
  wind: number;
  dodge: number;
  dodgeCd: number;
  hurt: number;
  slow: number;
  buff: number;
  alive: boolean;
  melee: boolean;
  range: number;
  sprite: string;
  control: boolean;
  abcd: number;
  vx: number;
  vy: number;
  mana: boolean;
  dv: number;
  atk: number;
  def: number;
  soak: number;
};

type Shot = { x: number; y: number; vx: number; vy: number; r: number; from: string; life: number; mana: boolean; dv: number; atk: number };
type Floater = { x: number; y: number; text: string; life: number; bad: boolean };

export type Sim = {
  actors: RT[];
  shots: Shot[];
  texts: Floater[];
  t: number;
  over: null | "win" | "lose";
  ticker: string;
  shake: number;
  obstacles: { x: number; y: number; w: number; h: number }[];
};

export type Stick = { x: number; y: number; attack: boolean; dodge: boolean; ability: AbilityId | null; switchTo: string | null };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function makeSim(party: Member[], groupId: string): Sim {
  const g = GROUPS[groupId] ?? GROUPS["dock-patrol"]!;
  const actors: RT[] = party.map((m, i) => {
    const w = WEAPONS[m.weapon];
    return {
      id: m.id,
      name: m.name,
      side: "party",
      x: 70,
      y: 70 + i * 48,
      r: m.metatype === "titan" ? 16 : 11,
      hp: m.hp,
      maxHp: m.maxHp,
      focus: m.focus,
      maxFocus: m.maxFocus,
      speed: 86 + m.attrs.quick * 6,
      cd: 0.2 * i,
      wind: 0,
      dodge: 0,
      dodgeCd: 0,
      hurt: 0,
      slow: 0,
      buff: 0,
      alive: m.hp > 0,
      melee: w.melee,
      range: w.melee ? 28 : 150,
      sprite: m.id === "pc" ? m.metatype : m.id,
      control: i === 0,
      abcd: 0,
      vx: 0,
      vy: 0,
      mana: w.mana,
      dv: w.dv,
      atk: Math.max(2, poolFor(m, w.skill)),
      def: defensePool(m),
      soak: soakPool(m, w.mana),
    };
  });
  g.enemies.forEach((id, i) => {
    const t = ENEMIES[id]!;
    actors.push({
      id: `f${i}`,
      name: t.name,
      side: "foe",
      x: 390,
      y: 60 + i * 56,
      r: 12,
      hp: t.hp,
      maxHp: t.hp,
      focus: 0,
      maxFocus: 0,
      speed: 62 + t.quick * 4,
      cd: 0.4 + i * 0.15,
      wind: 0,
      dodge: 0,
      dodgeCd: 0,
      hurt: 0,
      slow: 0,
      buff: 0,
      alive: true,
      melee: t.melee,
      range: t.melee ? 26 : 160,
      sprite: t.sprite,
      control: false,
      abcd: 0,
      vx: 0,
      vy: 0,
      mana: t.mana,
      dv: t.dv,
      atk: t.atk,
      def: t.def,
      soak: t.mana ? t.will : t.body + t.armor,
    });
  });
  return {
    actors,
    shots: [],
    texts: [],
    t: 0,
    over: null,
    ticker: g.name,
    shake: 0,
    obstacles: [
      { x: 220, y: 40, w: 36, h: 28 },
      { x: 200, y: 180, w: 46, h: 24 },
    ],
  };
}

function nearest(sim: Sim, a: RT, side: "party" | "foe") {
  let best: RT | null = null;
  let bestD = 1e9;
  for (const o of sim.actors) {
    if (!o.alive || o.side !== side) continue;
    const d = (o.x - a.x) ** 2 + (o.y - a.y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best;
}

function blocked(sim: Sim, x: number, y: number, r: number) {
  if (x < r || y < r || x > AW - r || y > AH - r) return true;
  return sim.obstacles.some((o) => x > o.x - r && x < o.x + o.w + r && y > o.y - r && y < o.y + o.h + r);
}

function move(sim: Sim, a: RT, dx: number, dy: number, dt: number) {
  const len = Math.hypot(dx, dy) || 1;
  const sp = a.speed * (a.slow > 0 ? 0.55 : 1) * (a.dodge > 0 ? 2.4 : 1);
  const vx = (dx / len) * sp * dt;
  const vy = (dy / len) * sp * dt;
  if (!blocked(sim, a.x + vx, a.y, a.r)) a.x += vx;
  if (!blocked(sim, a.x, a.y + vy, a.r)) a.y += vy;
  a.vx = dx;
  a.vy = dy;
}

function smack(sim: Sim, atk: RT, def: RT) {
  if (def.dodge > 0) {
    sim.texts.push({ x: def.x, y: def.y - 16, text: "slip", life: 0.5, bad: false });
    return;
  }
  const hit = strike({
    atkDice: atk.atk + (atk.buff > 0 ? 2 : 0),
    defDice: def.def + (def.buff > 0 ? 2 : 0),
    dv: atk.dv,
    soakDice: def.soak,
  });
  if (hit.self) {
    atk.hp = Math.max(0, atk.hp - hit.self);
    if (atk.hp <= 0) atk.alive = false;
  }
  def.hp = Math.max(0, def.hp - hit.dmg);
  if (hit.dmg > 0) {
    def.hurt = 0.15;
    sim.shake = Math.min(6, sim.shake + 2);
  }
  if (def.hp <= 0) def.alive = false;
  sim.texts.push({
    x: def.x,
    y: def.y - 18,
    text: hit.miss ? "miss" : String(hit.dmg),
    life: 0.7,
    bad: def.side === "party" && !hit.miss,
  });
  if (atk.control || def.control) sim.ticker = `${atk.name}: ${hit.note}`;
}

function fire(sim: Sim, a: RT, target: RT) {
  const dx = target.x - a.x;
  const dy = target.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  sim.shots.push({
    x: a.x,
    y: a.y,
    vx: (dx / len) * 220,
    vy: (dy / len) * 220,
    r: 4,
    from: a.id,
    life: 1.2,
    mana: a.mana,
    dv: a.dv,
    atk: a.atk,
  });
}

export function stepSim(sim: Sim, dt: number, input: Stick, party: Member[]) {
  if (sim.over) return;
  sim.t += dt;
  sim.shake = Math.max(0, sim.shake - dt * 10);
  const player = sim.actors.find((a) => a.control && a.alive) ?? sim.actors.find((a) => a.side === "party" && a.alive);
  if (input.switchTo) {
    const next = sim.actors.find((a) => a.id === input.switchTo && a.alive && a.side === "party");
    if (next) {
      for (const a of sim.actors) if (a.side === "party") a.control = a.id === next.id;
    }
  }
  for (const a of sim.actors) {
    if (!a.alive) continue;
    a.cd = Math.max(0, a.cd - dt);
    a.wind = Math.max(0, a.wind - dt);
    a.dodge = Math.max(0, a.dodge - dt);
    a.dodgeCd = Math.max(0, a.dodgeCd - dt);
    a.hurt = Math.max(0, a.hurt - dt);
    a.slow = Math.max(0, a.slow - dt);
    a.buff = Math.max(0, a.buff - dt);
    a.abcd = Math.max(0, a.abcd - dt);
    if (a.side === "party") {
      const src = party.find((p) => p.id === a.id);
      if (src) src.focus = a.focus;
    }
  }
  if (player) {
    if (input.dodge && player.dodgeCd <= 0) {
      player.dodge = 0.2;
      player.dodgeCd = 1.1;
    }
    const moving = Math.hypot(input.x, input.y) > 0.2;
    if (moving) move(sim, player, input.x, input.y, dt);
    const foe = nearest(sim, player, "foe");
    if (input.attack && player.cd <= 0 && foe) {
      const d = Math.hypot(foe.x - player.x, foe.y - player.y);
      if (d <= player.range) {
        player.cd = player.melee ? 0.48 : 0.62;
        if (player.melee) smack(sim, player, foe);
        else fire(sim, player, foe);
      }
    }
    if (input.ability && player.abcd <= 0) {
      const src = party.find((p) => p.id === player.id);
      if (src && src.abilities.includes(input.ability)) {
        const cost = abilityCost(src, input.ability);
        if (player.focus >= Math.min(cost, 2)) {
          player.focus = Math.max(0, player.focus - Math.min(cost, 2));
          player.abcd = 3.2;
          cast(sim, player, input.ability, foe);
        }
      }
    }
  }
  for (const a of sim.actors) {
    if (!a.alive || a.control) continue;
    const enemySide = a.side === "party" ? "foe" : "party";
    const tgt = nearest(sim, a, enemySide);
    if (!tgt) continue;
    const dx = tgt.x - a.x;
    const dy = tgt.y - a.y;
    const d = Math.hypot(dx, dy);
    if (d > a.range * 0.85) move(sim, a, dx, dy, dt);
    else if (a.cd <= 0) {
      a.cd = a.melee ? 0.7 : 0.95;
      if (a.melee) smack(sim, a, tgt);
      else fire(sim, a, tgt);
    }
    if (a.side === "party" && a.abcd <= 0 && a.focus >= 2 && Math.random() < dt * 0.35) {
      const src = party.find((p) => p.id === a.id);
      const ab = src?.abilities[0];
      if (ab) {
        a.focus -= 2;
        a.abcd = 4;
        cast(sim, a, ab, tgt);
      }
    }
  }
  for (const s of sim.shots) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    const owner = sim.actors.find((a) => a.id === s.from);
    for (const a of sim.actors) {
      if (!a.alive || (owner && a.side === owner.side)) continue;
      if (Math.hypot(a.x - s.x, a.y - s.y) < a.r + s.r) {
        if (owner) smack(sim, { ...owner, dv: s.dv, atk: s.atk, mana: s.mana, name: owner.name, control: owner.control }, a);
        s.life = 0;
        break;
      }
    }
  }
  sim.shots = sim.shots.filter((s) => s.life > 0 && s.x > -20 && s.x < AW + 20 && s.y > -20 && s.y < AH + 20);
  sim.texts.forEach((t) => (t.life -= dt));
  sim.texts = sim.texts.filter((t) => t.life > 0);
  // separate
  for (let i = 0; i < sim.actors.length; i++) {
    for (let j = i + 1; j < sim.actors.length; j++) {
      const a = sim.actors[i]!;
      const b = sim.actors[j]!;
      if (!a.alive || !b.alive) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.001;
      const min = a.r + b.r;
      if (d < min) {
        const push = (min - d) / 2;
        const ux = dx / d;
        const uy = dy / d;
        if (!blocked(sim, a.x - ux * push, a.y - uy * push, a.r)) {
          a.x -= ux * push;
          a.y -= uy * push;
        }
        if (!blocked(sim, b.x + ux * push, b.y + uy * push, b.r)) {
          b.x += ux * push;
          b.y += uy * push;
        }
      }
    }
  }
  const partyUp = sim.actors.some((a) => a.side === "party" && a.alive);
  const foeUp = sim.actors.some((a) => a.side === "foe" && a.alive);
  if (!foeUp) sim.over = "win";
  else if (!partyUp) sim.over = "lose";
  for (const a of sim.actors) {
    a.x = clamp(a.x, a.r, AW - a.r);
    a.y = clamp(a.y, a.r, AH - a.r);
  }
}

function cast(sim: Sim, a: RT, id: AbilityId, foe: RT | null) {
  sim.ticker = `${a.name}: ${id}`;
  if (id === "mend" || id === "soothe" || id === "medspider" || id === "editor") {
    const allies = sim.actors.filter((p) => p.side === "party" && p.alive);
    const low = allies.sort((p, q) => p.hp / p.maxHp - q.hp / q.maxHp)[0];
    if (low) {
      const n = id === "editor" || id === "medspider" ? 10 : 12;
      low.hp = Math.min(low.maxHp, low.hp + n);
      sim.texts.push({ x: low.x, y: low.y - 16, text: `+${n}`, life: 0.7, bad: false });
    }
    return;
  }
  if (id === "barrier" || id === "crawler" || id === "blur") {
    for (const p of sim.actors) if (p.side === a.side && p.alive) p.buff = 4;
    if (id === "blur") a.dodge = 0.28;
    return;
  }
  if (id === "suppress" || id === "lag" || id === "hex") {
    for (const p of sim.actors) if (p.side !== a.side && p.alive) p.slow = 3;
    return;
  }
  if (id === "moth") {
    sim.actors.push({
      ...a,
      id: `moth-${sim.t.toFixed(2)}`,
      name: "Moth",
      sprite: "spirit",
      control: false,
      hp: 14,
      maxHp: 14,
      r: 8,
      cd: 0.2,
      abcd: 99,
      melee: false,
      range: 140,
      speed: 90,
      atk: 6,
      dv: 4,
      mana: true,
      x: a.x + 16,
      y: a.y,
      focus: 0,
    });
    return;
  }
  if (!foe) return;
  if (id === "cut" || id === "nerve") {
    if (Math.hypot(foe.x - a.x, foe.y - a.y) < 46) smack(sim, { ...a, dv: a.dv + 2, atk: a.atk + 1 }, foe);
    else move(sim, a, foe.x - a.x, foe.y - a.y, 0.18);
    return;
  }
  fire(sim, { ...a, dv: id === "spike" || id === "manabolt" ? a.dv + 1 : a.dv }, foe);
}
