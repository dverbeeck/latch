import { create } from "zustand";
import { blip } from "./audio";
import {
  CYBER,
  GROUPS,
  ITEMS,
  applyCyber,
  companion,
  createPlayer,
  magicOf,
  recalc,
  type Draft,
  type ItemId,
  type Member,
  type SkillId,
} from "./model";
import { TALKS, type Effect } from "./talks";
import { foeAct, perform, startFight, type Act, type Fight } from "./turn";
import {
  ENTITIES,
  TILE,
  dungeonEvent,
  dungeonStart,
  forward,
  isBlocked,
  turn,
  visibleEnt,
  type DungeonId,
} from "./world";

const KEY = "latch-subject04-v1";

export type Phase = "title" | "create" | "talk" | "city" | "street" | "dungeon" | "turn" | "ending";

type Save = {
  v: 1;
  phase: Phase;
  resume: "city" | "dungeon";
  party: Member[];
  creds: number;
  rep: number;
  items: Record<string, number>;
  flags: Record<string, true>;
  chapter: 1 | 2 | 3;
  mapId: string;
  x: number;
  y: number;
  dungeonId: DungeonId | null;
  dx: number;
  dy: number;
  ddir: number;
  seen: Record<string, true>;
  talkId: string | null;
  talkI: number;
  fight: Fight | null;
  ending: "sealed" | "cracked" | null;
  banner: string;
};

export type GameState = Save & {
  hasSave: boolean;
  overlay: null | "party" | "legwork" | "help" | "shop";
  shop: "clinic" | "market" | null;
  streetGroup: string | null;
  streetThen: string | null;
  streetFlag: string | null;
  lastStep: { x: number; y: number };
  boot: () => void;
  newGame: (d: Draft) => void;
  continueGame: () => void;
  advanceTalk: () => void;
  choose: (i: number) => void;
  setOverlay: (o: GameState["overlay"], shop?: "clinic" | "market" | null) => void;
  setPos: (x: number, y: number) => void;
  interactAt: (x: number, y: number) => void;
  finishStreet: (party: Member[], result: "win" | "lose") => void;
  moveDungeon: (way: "f" | "b" | "l" | "r") => void;
  interactDungeon: () => void;
  turnAct: (a: Act) => void;
  tickFoe: () => void;
  buy: (kind: "item" | "cyber", id: string, memberId?: string) => void;
  sell: (id: ItemId) => void;
  stitch: () => void;
  train: (memberId: string, kind: "skill" | "attr", key: string) => void;
  toggleFront: (id: string) => void;
  debugSkip: (to: "docks" | "under" | "plaza") => void;
};

function blank(): Save {
  return {
    v: 1,
    phase: "title",
    resume: "city",
    party: [],
    creds: 50,
    rep: 2,
    items: { medkit: 3, stim: 1, trauma: 1 },
    flags: {},
    chapter: 1,
    mapId: "docks",
    x: 3.5 * TILE,
    y: 6.5 * TILE,
    dungeonId: null,
    dx: 1,
    dy: 1,
    ddir: 1,
    seen: {},
    talkId: null,
    talkI: 0,
    fight: null,
    ending: null,
    banner: "",
  };
}

function persist(s: GameState) {
  if (typeof window === "undefined") return;
  if (s.phase === "street" || s.phase === "title" || s.phase === "create") return;
  const data: Save = {
    v: 1,
    phase: s.phase,
    resume: s.resume,
    party: s.party,
    creds: s.creds,
    rep: s.rep,
    items: s.items,
    flags: s.flags,
    chapter: s.chapter,
    mapId: s.mapId,
    x: s.x,
    y: s.y,
    dungeonId: s.dungeonId,
    dx: s.dx,
    dy: s.dy,
    ddir: s.ddir,
    seen: s.seen,
    talkId: s.talkId,
    talkI: s.talkI,
    fight: s.phase === "turn" ? s.fight : null,
    ending: s.ending,
    banner: s.banner,
  };
  localStorage.setItem(KEY, JSON.stringify(data));
}

export const useGame = create<GameState>((set, get) => ({
  ...blank(),
  hasSave: false,
  overlay: null,
  shop: null,
  streetGroup: null,
  streetThen: null,
  streetFlag: null,
  lastStep: { x: 1, y: 1 },
  boot: () => {
    if (typeof window === "undefined") return;
    set({ hasSave: Boolean(localStorage.getItem(KEY)) });
  },
  newGame: (d) => {
    const pc = createPlayer(d);
    const base = blank();
    const next: Save = {
      ...base,
      phase: "talk",
      resume: "dungeon",
      party: [pc],
      talkId: "ch1_open",
      talkI: 0,
      banner: "You are awake. That is the whole good news.",
    };
    set({ ...next, overlay: null, streetGroup: null });
    persist(get());
    blip("ui");
  },
  continueGame: () => {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as Save;
      if (data.phase === "street") data.phase = "city";
      set({ ...data, hasSave: true, overlay: null, streetGroup: null });
    } catch {
      set({ banner: "That save is unreadable." });
    }
  },
  advanceTalk: () => {
    const s = get();
    const talk = s.talkId ? TALKS[s.talkId] : null;
    if (!talk) return;
    if (s.talkI < talk.lines.length - 1) {
      set({ talkI: s.talkI + 1 });
      blip("ui");
      return;
    }
    if (talk.choices?.length) return;
    runEffects(talk.effects ?? []);
  },
  choose: (i) => {
    const s = get();
    const talk = s.talkId ? TALKS[s.talkId] : null;
    const choice = talk?.choices?.[i];
    if (!choice) return;
    blip("ui");
    if (choice.goto) {
      set({ talkId: choice.goto, talkI: 0 });
      if (choice.effects) runEffects(choice.effects);
      persist(get());
      return;
    }
    runEffects(choice.effects ?? []);
  },
  setOverlay: (o, shop = null) => set({ overlay: o, shop: o === "shop" ? shop : null }),
  setPos: (x, y) => {
    set({ x, y });
    persist(get());
  },
  interactAt: (x, y) => {
    const s = get();
    if (s.phase !== "city" || s.overlay) return;
    let best: (typeof ENTITIES)[number] | null = null;
    let bestD = 1.25;
    for (const e of ENTITIES) {
      if (e.map !== s.mapId || !visibleEnt(e, s.flags)) continue;
      const d = Math.hypot(e.x + 0.5 - x / TILE, e.y + 0.5 - y / TILE);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    if (!best) {
      set({ banner: "Nothing here but rain." });
      return;
    }
    const a = best.action;
    if (a.type === "talk") {
      if (a.id === "imani" && s.flags.talked_imani) {
        set({ banner: "Imani jerks her chin at the counter. Buy stitches, not speeches." });
        return;
      }
      if (a.id === "cinder_door" && s.flags.cinder_met) {
        enterDungeon("ember");
        return;
      }
      openTalk(a.id);
      return;
    }
    if (a.type === "shop") {
      set({ overlay: "shop", shop: a.shop, banner: "" });
      return;
    }
    if (a.type === "dungeon") {
      if (a.need && !s.flags[a.need]) {
        set({ banner: a.deny });
        return;
      }
      enterDungeon(a.id);
      return;
    }
    if (a.type === "go") {
      if (a.need && !s.flags[a.need]) {
        set({ banner: a.deny });
        return;
      }
      const flags = { ...s.flags };
      const talkId = a.talk;
      set({
        mapId: a.map,
        x: (a.x + 0.5) * TILE,
        y: (a.y + 0.5) * TILE,
        flags,
        banner: "",
      });
      if (talkId && !flags[`talk:${talkId}`]) {
        flags[`talk:${talkId}`] = true;
        set({ flags: { ...flags } });
        openTalk(talkId);
      }
      persist(get());
      blip("step");
      return;
    }
    if (a.type === "fight") {
      if (s.flags[a.flag]) {
        set({ banner: "Already handled." });
        return;
      }
      set({
        x,
        y,
        phase: "street",
        streetGroup: a.group,
        streetThen: a.then ?? null,
        streetFlag: a.flag,
        overlay: null,
        banner: "",
      });
      blip("hit");
    }
  },
  finishStreet: (party, result) => {
    const s = get();
    if (result === "win") {
      const flags = { ...s.flags };
      if (s.streetFlag) flags[s.streetFlag] = true;
      const g = GROUPS[s.streetGroup ?? ""] ?? { creds: 30, rep: 1 };
      const synced = party.map((m) => {
        const prev = s.party.find((p) => p.id === m.id) ?? m;
        return { ...prev, hp: m.hp, focus: m.focus };
      });
      set({
        party: synced,
        creds: s.creds + g.creds,
        rep: s.rep + g.rep,
        flags,
        phase: "city",
        streetGroup: null,
        banner: `Street's clear. +${g.creds} creds, +${g.rep} rep.`,
      });
      blip("win");
      if (s.streetThen) openTalk(s.streetThen);
      else persist(get());
      return;
    }
    const woken = s.party.map((m) => ({
      ...m,
      hp: Math.max(1, Math.round(m.maxHp * 0.5)),
      focus: Math.round(m.maxFocus * 0.5),
    }));
    set({
      party: woken,
      creds: Math.max(0, s.creds - 15),
      phase: "city",
      mapId: s.chapter >= 3 ? "plaza" : s.chapter === 2 ? "undercity" : "docks",
      x: 5.5 * TILE,
      y: 6.5 * TILE,
      banner: "You flatline. Someone expensive drags you back. −15 creds.",
    });
    blip("hurt");
    persist(get());
  },
  moveDungeon: (way) => {
    const s = get();
    if (s.phase !== "dungeon" || !s.dungeonId || s.overlay) return;
    if (way === "l" || way === "r") {
      const ddir = turn(s.ddir, way === "l" ? -1 : 1);
      const seen = { ...s.seen, [`${s.dungeonId}:${s.dx},${s.dy}`]: true as const };
      set({ ddir, seen });
      blip("step");
      return;
    }
    const f = forward(s.ddir);
    const sign = way === "f" ? 1 : -1;
    const nx = s.dx + f.x * sign;
    const ny = s.dy + f.y * sign;
    if (isBlocked(s.dungeonId, nx, ny, s.flags)) {
      const ev = dungeonEvent(s.dungeonId, nx, ny);
      if (ev?.kind === "door") {
        set({
          banner: ev.need === "key:vault" ? "The door wants a keycard older than the Bloom." : "The gate is shut. Light what it remembers.",
        });
      } else if (ev?.kind === "stairs") set({ banner: "The stair is dead until both generators fold." });
      else set({ banner: "Wall." });
      blip("miss");
      return;
    }
    const id = s.dungeonId;
    const flags = { ...s.flags };
    const seen = { ...s.seen, [`${id}:${nx},${ny}`]: true as const };
    const ev = dungeonEvent(id, nx, ny);
    set({
      lastStep: { x: s.dx, y: s.dy },
      dx: nx,
      dy: ny,
      seen,
      flags,
    });
    blip("step");
    if (!ev) {
      persist(get());
      return;
    }
    if (ev.kind === "key" && !flags[ev.flag]) {
      flags[ev.flag] = true;
      set({ flags: { ...flags }, banner: "Keycard. The logo is a latch drawn by someone who hated curves." });
    }
    if (ev.kind === "fight" && !flags[ev.flag]) {
      if (ev.intro && !flags[`heard:${ev.flag}`]) {
        flags[`heard:${ev.flag}`] = true;
        set({ flags: { ...flags } });
        openTalk(ev.intro);
        return;
      }
      beginTurn(ev.group ?? "vault-drone", ev.flag, ev.then, { x: s.dx, y: s.dy });
      return;
    }
    if ((ev.kind === "story" || ev.kind === "note") && ev.talk && !flags[ev.flag]) {
      if (ev.need && !flags[ev.need]) {
        set({ banner: "It will not listen yet." });
        return;
      }
      if (ev.kind === "story") {
        flags[ev.flag] = true;
        set({ flags: { ...flags } });
      }
      openTalk(ev.talk);
      return;
    }
    if (ev.kind === "exit") {
      if (ev.talk && !flags[ev.flag]) {
        flags[ev.flag] = true;
        set({ flags: { ...flags } });
        openTalk(ev.talk);
        return;
      }
      if (ev.map != null && ev.mx != null && ev.my != null) {
        set({
          phase: "city",
          resume: "city",
          mapId: ev.map,
          x: (ev.mx + 0.5) * TILE,
          y: (ev.my + 0.5) * TILE,
          banner: "Rain again.",
        });
      }
    }
    if (ev.kind === "stairs" && ev.to != null && ev.tx != null && ev.ty != null) {
      const seen2 = { ...get().seen, [`${ev.to}:${ev.tx},${ev.ty}`]: true as const };
      set({
        dungeonId: ev.to,
        dx: ev.tx,
        dy: ev.ty,
        ddir: ev.tdir ?? 1,
        seen: seen2,
        banner: "Down. The air gets expensive.",
      });
    }
    persist(get());
  },
  interactDungeon: () => {
    const s = get();
    if (!s.dungeonId || s.phase !== "dungeon") return;
    const f = forward(s.ddir);
    const spots = [
      [s.dx, s.dy],
      [s.dx + f.x, s.dy + f.y],
    ];
    const flags = { ...s.flags };
    for (const [x, y] of spots) {
      const ev = dungeonEvent(s.dungeonId, x!, y!);
      if (!ev) continue;
      if ((ev.kind === "brazier" || ev.kind === "gen") && !flags[ev.flag]) {
        flags[ev.flag] = true;
        if (["brazier:e1", "brazier:e2", "brazier:e3"].every((k) => flags[k])) {
          flags["gate:ember"] = true;
          set({ flags, banner: "Three flames. The gate remembers it is a door." });
        } else if (flags["gen:a"] && flags["gen:b"]) {
          flags["gate:spire"] = true;
          set({ flags, banner: "Both generators fold. A stair coughs open." });
        } else {
          set({
            flags,
            banner: ev.kind === "brazier" ? "The brazier takes. The moth notices." : "Generator down. One less lie in the walls.",
          });
        }
        blip("magic");
        persist(get());
        return;
      }
      if ((ev.kind === "story" || ev.kind === "note") && ev.talk && !flags[ev.flag]) {
        if (!ev.need || flags[ev.need]) {
          if (ev.kind === "story") flags[ev.flag] = true;
          set({ flags });
          openTalk(ev.talk);
          return;
        }
      }
    }
    set({ banner: "You look. The century does not explain itself." });
  },
  turnAct: (a) => {
    const s = get();
    if (!s.fight || s.phase !== "turn") return;
    const fight = structuredClone(s.fight);
    const party = structuredClone(s.party);
    const items = { ...s.items };
    const res = perform(fight, party, items, a);
    if (res.error) {
      set({ banner: res.error });
      blip("miss");
      return;
    }
    blip("hit");
    settleTurn(fight, party, items);
  },
  tickFoe: () => {
    const s = get();
    if (!s.fight || s.phase !== "turn") return;
    const slot = s.fight.order[s.fight.cursor];
    if (!slot || slot.side === "party" || s.fight.phase !== "pick") return;
    const fight = structuredClone(s.fight);
    const party = structuredClone(s.party);
    foeAct(fight, party);
    blip("hurt");
    settleTurn(fight, party, s.items);
  },
  buy: (kind, id, memberId) => {
    const s = get();
    if (kind === "item") {
      const spec = ITEMS[id as ItemId];
      if (!spec || s.creds < spec.cost) {
        set({ banner: "Not enough creds." });
        return;
      }
      set({
        creds: s.creds - spec.cost,
        items: { ...s.items, [id]: (s.items[id] ?? 0) + 1 },
        banner: `${spec.name} packed.`,
      });
    } else {
      const spec = CYBER.find((c) => c.id === id);
      const idx = Math.max(0, s.party.findIndex((p) => p.id === (memberId ?? s.party[0]?.id)));
      const m = s.party[idx];
      if (!spec || !m) return;
      if (m.cyber.includes(id) || m.cyber.includes("titan-hide") && id === "titan-hide") {
        set({ banner: "Already bolted on." });
        return;
      }
      if (m.cyber.includes(id)) {
        set({ banner: "Already bolted on." });
        return;
      }
      if (s.creds < spec.cost) {
        set({ banner: "Not enough creds." });
        return;
      }
      if (m.integrity - spec.essence < 0.05) {
        set({ banner: "Not enough Integrity. The meat says no." });
        return;
      }
      const next = structuredClone(m);
      const before = magicOf(next);
      if (!applyCyber(next, id)) {
        set({ banner: "The meat says no." });
        return;
      }
      const party = s.party.slice();
      party[idx] = next;
      const after = magicOf(next);
      set({
        party,
        creds: s.creds - spec.cost,
        banner: after < before ? `${spec.name} on ${next.name}. Magic is now ${after}.` : `${spec.name} on ${next.name}.`,
      });
    }
    blip("ui");
    persist(get());
  },
  sell: (id) => {
    const s = get();
    if ((s.items[id] ?? 0) <= 0) return;
    const pay = Math.floor(ITEMS[id].cost / 2);
    set({
      items: { ...s.items, [id]: (s.items[id] ?? 1) - 1 },
      creds: s.creds + pay,
      banner: `Sold. +${pay}.`,
    });
    persist(get());
  },
  stitch: () => {
    const s = get();
    if (s.creds < 20) {
      set({ banner: "Stitching costs 20 creds." });
      return;
    }
    set({
      creds: s.creds - 20,
      party: s.party.map((m) => ({ ...m, hp: m.maxHp, focus: m.maxFocus })),
      banner: "Everybody's leaking slower.",
    });
    blip("magic");
    persist(get());
  },
  train: (memberId, kind, key) => {
    const s = get();
    if (s.phase === "turn" || s.phase === "street") return;
    const cost = kind === "attr" ? 5 : 2;
    if (s.rep < cost) {
      set({ banner: "Not enough rep." });
      return;
    }
    const party = structuredClone(s.party);
    const m = party.find((p) => p.id === memberId);
    if (!m) return;
    if (kind === "attr") {
      const k = key as keyof Member["attrs"];
      if (m.attrs[k] >= 6) return;
      m.attrs[k] += 1;
    } else {
      const k = key as SkillId;
      const cur = m.skills[k] ?? 0;
      if (cur >= 6) return;
      m.skills[k] = cur + 1;
    }
    recalc(m);
    set({ party, rep: s.rep - cost, banner: `${m.name} keeps the lesson.` });
    blip("ui");
    persist(get());
  },
  toggleFront: (id) => {
    const s = get();
    if (s.phase === "turn") return;
    set({
      party: s.party.map((m) => (m.id === id ? { ...m, front: !m.front } : m)),
    });
    persist(get());
  },
  debugSkip: (to) => {
    const s = get();
    if (!s.party.length) {
      get().newGame({ name: "Subject 04", metatype: "human", archetype: "razor" });
    }
    const flags: Record<string, true> = { ...get().flags, vault_clear: true, talked_imani: true, alley_open: true };
    let mapId = "docks";
    let x = 5.5 * TILE;
    let y = 6.5 * TILE;
    let chapter: 1 | 2 | 3 = 1;
    if (to !== "docks") {
      flags.nyx_joined = true;
      flags["talk:ch2_open"] = true;
      chapter = 2;
      mapId = "undercity";
      x = 4.5 * TILE;
      y = 7.5 * TILE;
    }
    if (to === "plaza") {
      flags.cinder_joined = true;
      flags.cinder_met = true;
      flags["talk:ch3_open"] = true;
      flags["gate:ember"] = true;
      chapter = 3;
      mapId = "plaza";
      x = 8.5 * TILE;
      y = 5.5 * TILE;
    }
    let party = get().party;
    if (flags.nyx_joined && !party.some((p) => p.id === "nyx")) party = [...party, companion("nyx")];
    if (flags.cinder_joined && !party.some((p) => p.id === "cinder")) party = [...party, companion("cinder")];
    set({
      phase: "city",
      resume: "city",
      party,
      flags,
      mapId,
      x,
      y,
      chapter,
      overlay: null,
      fight: null,
      talkId: null,
      banner: "Skipped ahead.",
    });
    persist(get());
  },
}));

function openTalk(id: string) {
  const s = useGame.getState();
  const resume: "city" | "dungeon" =
    s.phase === "dungeon" ? "dungeon" : s.phase === "city" || s.phase === "street" ? "city" : s.resume;
  useGame.setState({
    phase: "talk",
    talkId: id,
    talkI: 0,
    resume,
    overlay: null,
  });
}

function setSafe(partial: Partial<GameState>) {
  useGame.setState(partial);
}

function runEffects(effects: Effect[]) {
  for (const e of effects) {
    const s = useGame.getState();
    if (e.op === "flag") useGame.setState({ flags: { ...s.flags, [e.id]: true } });
    else if (e.op === "banner") useGame.setState({ banner: e.text });
    else if (e.op === "creds") useGame.setState({ creds: s.creds + e.n });
    else if (e.op === "chapter") useGame.setState({ chapter: e.n });
    else if (e.op === "item") useGame.setState({ items: { ...s.items, [e.id]: (s.items[e.id] ?? 0) + e.n } });
    else if (e.op === "heal") {
      useGame.setState({
        party: s.party.map((m) => ({ ...m, hp: m.maxHp, focus: m.maxFocus })),
      });
    } else if (e.op === "join") {
      if (!s.party.some((p) => p.id === e.who)) {
        useGame.setState({ party: [...s.party, companion(e.who)] });
      }
    } else if (e.op === "city") {
      useGame.setState({
        phase: "city",
        resume: "city",
        mapId: e.map,
        x: (e.x + 0.5) * TILE,
        y: (e.y + 0.5) * TILE,
        talkId: null,
      });
    } else if (e.op === "dungeon") enterDungeon(e.id);
    else if (e.op === "street") {
      useGame.setState({
        phase: "street",
        streetGroup: e.group,
        streetThen: e.then,
        streetFlag: null,
        talkId: null,
      });
    } else if (e.op === "turn") {
      beginTurn(e.group, e.flag, e.then, { ...useGame.getState().lastStep });
    } else if (e.op === "ending") {
      useGame.setState({ phase: "ending", ending: e.id, talkId: null });
      blip("win");
    }
  }
  const s = useGame.getState();
  if (s.phase === "talk") {
    const talk = s.talkId ? TALKS[s.talkId] : null;
    const done = talk && s.talkI >= talk.lines.length - 1 && !talk.choices?.length;
    if (!effects.some((e) => e.op === "dungeon" || e.op === "city" || e.op === "turn" || e.op === "street" || e.op === "ending")) {
      if (done || true) {
        // leave talk if effects didn't replace phase and this was the closing advance
      }
    }
  }
  // If we finished a talk and nothing changed phase, return to resume.
  const after = useGame.getState();
  if (after.phase === "talk") {
    const talk = after.talkId ? TALKS[after.talkId] : null;
    const staying = talk && after.talkI === 0 && effects.some((e) => false);
    void staying;
    const replaced = effects.some((e) =>
      ["dungeon", "city", "turn", "street", "ending"].includes(e.op),
    );
    const goto = effects.some((e) => false);
    void goto;
    if (!replaced && talk && after.talkI >= talk.lines.length - 1) {
      useGame.setState({ phase: after.resume, talkId: null });
    }
  }
  persist(useGame.getState());
}

function enterDungeon(id: DungeonId) {
  const s = useGame.getState();
  const start = dungeonStart(id);
  const seen = { ...s.seen, [`${id}:${start.x},${start.y}`]: true as const };
  // keep position if re-entering same dungeon and we have a saved spot? always use start on fresh enter from city.
  useGame.setState({
    phase: "dungeon",
    resume: "dungeon",
    dungeonId: id,
    dx: start.x,
    dy: start.y,
    ddir: start.dir,
    seen,
    talkId: null,
    overlay: null,
    banner: id === "vault" ? "The corridor hums." : "You step inside.",
  });
  persist(useGame.getState());
}

function beginTurn(group: string, flag: string | undefined, then: string | undefined, snap: { x: number; y: number }) {
  const s = useGame.getState();
  const fight = startFight(structuredClone(s.party), group, { flag, then, snap });
  useGame.setState({ phase: "turn", fight, talkId: null, overlay: null, resume: "dungeon" });
  persist(useGame.getState());
}

function settleTurn(fight: Fight, party: Member[], items: Record<string, number>) {
  const s = useGame.getState();
  if (fight.phase === "win") {
    const flags = { ...s.flags };
    if (fight.flag) flags[fight.flag] = true;
    useGame.setState({
      fight,
      party,
      items,
      flags,
      creds: s.creds + fight.creds,
      rep: s.rep + fight.rep,
      banner: `Done. +${fight.creds} creds, +${fight.rep} rep.`,
    });
    blip("win");
    return;
  }
  if (fight.phase === "lose") {
    const woken = party.map((m) => ({
      ...m,
      hp: Math.max(1, Math.round(m.maxHp * (fight.boss ? 0.6 : 0.45))),
      focus: Math.round(m.maxFocus * 0.5),
    }));
    useGame.setState({
      party: woken,
      items,
      fight,
      creds: Math.max(0, s.creds - (fight.boss ? 0 : 10)),
      dx: fight.snap?.x ?? s.dx,
      dy: fight.snap?.y ?? s.dy,
      banner: fight.boss ? "Not like that. Breathe. Try a different angle." : "Down. The room keeps you anyway. −10 creds.",
    });
    blip("hurt");
    return;
  }
  useGame.setState({ fight, party, items, banner: "" });
  persist(useGame.getState());
}

// Close a won/lost fight from the UI via advance? We'll add a method by piggyback:
export function closeFight() {
  const s = useGame.getState();
  if (!s.fight) return;
  if (s.fight.phase === "win") {
    const then = s.fight.then;
    useGame.setState({ phase: "dungeon", fight: null, resume: "dungeon" });
    if (then) openTalk(then);
    else persist(useGame.getState());
    return;
  }
  if (s.fight.phase === "lose") {
    const retryChoice = s.fight.groupId === "latch-boss";
    useGame.setState({ phase: retryChoice ? "talk" : "dungeon", fight: null, talkId: retryChoice ? "latch_choice" : null, talkI: 0 });
    persist(useGame.getState());
  }
}
