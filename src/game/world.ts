import type { CityId } from "./world-types";

export type { CityId };
export type DungeonId = "vault" | "ember" | "spire1" | "spire2";

export type CellEvent = {
  kind: "door" | "key" | "fight" | "brazier" | "gen" | "stairs" | "exit" | "story" | "note";
  flag: string;
  group?: string;
  then?: string;
  need?: string;
  lock?: "key" | "puzzle";
  to?: DungeonId;
  tx?: number;
  ty?: number;
  tdir?: number;
  map?: "docks" | "undercity" | "plaza";
  mx?: number;
  my?: number;
  intro?: string;
  talk?: string;
};

export const DUNGEON_META: Record<DungeonId, { name: string; theme: "vault" | "ember" | "spire" }> = {
  vault: { name: "Hollow Sleep", theme: "vault" },
  ember: { name: "Ember Station", theme: "ember" },
  spire1: { name: "Archive Vault", theme: "spire" },
  spire2: { name: "Ossuary", theme: "spire" },
};

const ROWS: Record<DungeonId, string[]> = {
  vault: [
    "#############",
    "#S.k........#",
    "#.#########.#",
    "#..........e#",
    "#.#########.#",
    "#...........#",
    "#.#########.#",
    "#D..........#",
    "#.#########.#",
    "#..........b#",
    "###########X#",
    "#############",
  ],
  ember: [
    "###############",
    "#S..B#.....B..#",
    "#.##.#.###.#..#",
    "#.#.e#...#.#..#",
    "#.#.##.#.#.#..#",
    "#.#....#.#....#",
    "#B#....#.#....#",
    "#.#.####.#.##.#",
    "#...e....#...D#",
    "#############b#",
    "#############X#",
    "###############",
  ],
  spire1: [
    "#############",
    "#S..#......G#",
    "#.#.#.####..#",
    "#.#...e..#..#",
    "#.###.##.#..#",
    "#.....#..#G.#",
    "#####.#.##..#",
    "#.....#.....#",
    "#.#########>#",
    "#############",
  ],
  spire2: [
    "#############",
    "#S.e#########",
    "#.#.#########",
    "#.#..N.######",
    "#####..######",
    "#####..e..###",
    "#######.#####",
    "#######....b#",
    "###########.#",
    "###########X#",
    "#############",
  ],
};

const EVENTS: Record<DungeonId, Record<string, CellEvent>> = {
  vault: {
    "3,1": { kind: "key", flag: "key:vault" },
    "11,3": { kind: "fight", flag: "fight:vault-drone", group: "vault-drone" },
    "1,7": { kind: "door", flag: "door:vault", lock: "key", need: "key:vault" },
    "11,9": { kind: "fight", flag: "fight:vault-boss", group: "vault-boss" },
    "11,10": { kind: "exit", flag: "left:vault", map: "docks", mx: 3, my: 6, talk: "vault_out" },
  },
  ember: {
    "4,1": { kind: "brazier", flag: "brazier:e1" },
    "11,1": { kind: "brazier", flag: "brazier:e2" },
    "1,6": { kind: "brazier", flag: "brazier:e3" },
    "4,3": { kind: "fight", flag: "fight:ember-a", group: "ember-spirit" },
    "4,8": { kind: "fight", flag: "fight:ember-b", group: "ember-mix" },
    "13,8": { kind: "door", flag: "door:ember", lock: "puzzle", need: "gate:ember" },
    "13,9": { kind: "fight", flag: "fight:ember-boss", group: "ember-boss" },
    "13,10": { kind: "exit", flag: "left:ember", map: "undercity", mx: 8, my: 6, talk: "cinder_join" },
  },
  spire1: {
    "11,1": { kind: "gen", flag: "gen:a" },
    "6,3": { kind: "fight", flag: "fight:spire-a", group: "spire-razor" },
    "10,5": { kind: "gen", flag: "gen:b" },
    "11,8": { kind: "stairs", flag: "stair:spire", to: "spire2", tx: 1, ty: 1, tdir: 1, need: "gate:spire" },
  },
  spire2: {
    "3,1": { kind: "fight", flag: "fight:spire-b", group: "spire-duo" },
    "5,3": { kind: "story", flag: "met:sable", talk: "sable_cell" },
    "7,5": { kind: "fight", flag: "fight:spire-c", group: "spire-razor" },
    "11,7": { kind: "fight", flag: "fight:helix", group: "spire-boss", intro: "helix_intro" },
    "11,9": { kind: "note", flag: "note:latch", talk: "latch_choice", need: "fight:helix" },
  },
};

export function dungeonRows(id: DungeonId) {
  return ROWS[id];
}

export function dungeonChar(id: DungeonId, x: number, y: number) {
  const rows = ROWS[id];
  if (y < 0 || x < 0 || y >= rows.length || x >= rows[0]!.length) return "#";
  return rows[y]![x]!;
}

export function dungeonEvent(id: DungeonId, x: number, y: number): CellEvent | null {
  return EVENTS[id][`${x},${y}`] ?? null;
}

export function dungeonStart(id: DungeonId) {
  const rows = ROWS[id];
  for (let y = 0; y < rows.length; y++) {
    const x = rows[y]!.indexOf("S");
    if (x >= 0) return { x, y, dir: 1 };
  }
  return { x: 1, y: 1, dir: 1 };
}

export function isBlocked(
  id: DungeonId,
  x: number,
  y: number,
  flags: Record<string, true>,
): boolean {
  const ch = dungeonChar(id, x, y);
  if (ch === "#") return true;
  const ev = dungeonEvent(id, x, y);
  if (!ev) return false;
  if (ev.kind === "door") return ev.need ? !flags[ev.need] : !flags[ev.flag];
  if (
    ev.need &&
    !flags[ev.need] &&
    (ev.kind === "stairs" || ev.kind === "note" || ev.kind === "exit" || ev.kind === "story")
  ) {
    return true;
  }
  return false;
}

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];
export const DIRS = ["N", "E", "S", "W"] as const;
export function forward(dir: number) {
  return { x: DX[dir]!, y: DY[dir]! };
}
export function turn(dir: number, way: -1 | 1) {
  return (dir + way + 4) % 4;
}

export type CityIdLocal = "docks" | "undercity" | "plaza";

const CITY: Record<CityIdLocal, string[]> = {
  docks: [
    "~~~~~~~~~~~~~~~~",
    "~...............",
    "~..####.........",
    "~..#..#..####...",
    "~..#..#..#..#...",
    "~..####..####...",
    "~...............",
    "~...............",
    "~........==.....",
    "~...........####",
    "~...........#..#",
    "~~~~~~~~~~~~~~~~",
  ],
  undercity: [
    "################",
    "#++++++++++++++#",
    "#+##++++++++##+#",
    "#+#..++++++..#+#",
    "#+#..+####+..#+#",
    "#+++++#..#+++++#",
    "#+####+..+####+#",
    "#+....+..+....+#",
    "#++++++..++++++#",
    "#+############+#",
    "#++++++++++++++#",
    "################",
  ],
  plaza: [
    "################",
    "#..............#",
    "#..###....###..#",
    "#..#.#....#.#..#",
    "#..###....###..#",
    "#..............#",
    "#......##......#",
    "#......##......#",
    "#..............#",
    "#..###....###..#",
    "#..#......#....#",
    "################",
  ],
};

export type CityAction =
  | { type: "talk"; id: string }
  | { type: "shop"; shop: "clinic" | "market" }
  | { type: "dungeon"; id: DungeonId; need?: string; deny: string }
  | { type: "go"; map: CityIdLocal; x: number; y: number; need?: string; deny: string; talk?: string }
  | { type: "fight"; group: string; then?: string; flag: string };

export type CityEnt = {
  id: string;
  map: CityIdLocal;
  x: number;
  y: number;
  name: string;
  sprite: string;
  require?: string;
  hideWhen?: string;
  action: CityAction;
  wander?: boolean;
};

export const ENTITIES: CityEnt[] = [
  {
    id: "imani",
    map: "docks",
    x: 3,
    y: 6,
    name: "Imani Quill",
    sprite: "imani",
    hideWhen: "never",
    action: { type: "talk", id: "imani" },
  },
  {
    id: "clinic",
    map: "docks",
    x: 4,
    y: 6,
    name: "Mothlight Clinic",
    sprite: "shop",
    action: { type: "shop", shop: "clinic" },
  },
  {
    id: "alley",
    map: "docks",
    x: 3,
    y: 8,
    name: "Clinic Alley",
    sprite: "corp",
    require: "alley_open",
    hideWhen: "nyx_joined",
    action: { type: "fight", group: "recovery", then: "nyx_join", flag: "fight:recovery" },
  },
  {
    id: "pawn",
    map: "docks",
    x: 8,
    y: 7,
    name: "Pawn Ost",
    sprite: "pawn",
    require: "nyx_joined",
    action: { type: "talk", id: "pawn" },
  },
  {
    id: "dock-patrol",
    map: "docks",
    x: 10,
    y: 6,
    name: "Dock Patrol",
    sprite: "corp",
    wander: true,
    hideWhen: "fight:dock-patrol",
    action: { type: "fight", group: "dock-patrol", flag: "fight:dock-patrol" },
  },
  {
    id: "subway",
    map: "docks",
    x: 12,
    y: 8,
    name: "Freight Stair",
    sprite: "door",
    action: {
      type: "go",
      map: "undercity",
      x: 2,
      y: 2,
      need: "nyx_joined",
      deny: "Nyx won't let you go down without her. Clear the alley.",
      talk: "ch2_open",
    },
  },
  {
    id: "hollow-door",
    map: "docks",
    x: 2,
    y: 6,
    name: "Hollow Sleep",
    sprite: "door",
    require: "vault_clear",
    action: { type: "dungeon", id: "vault", deny: "" },
  },
  {
    id: "station",
    map: "undercity",
    x: 8,
    y: 5,
    name: "Ember Station",
    sprite: "cinder",
    action: { type: "talk", id: "cinder_door" },
  },
  {
    id: "under-market",
    map: "undercity",
    x: 4,
    y: 7,
    name: "Wire & Bone",
    sprite: "shop",
    require: "nyx_joined",
    action: { type: "shop", shop: "market" },
  },
  {
    id: "under-gang",
    map: "undercity",
    x: 11,
    y: 4,
    name: "Red Receipts",
    sprite: "ganger",
    wander: true,
    hideWhen: "fight:under-gang",
    action: { type: "fight", group: "under-gang", flag: "fight:under-gang" },
  },
  {
    id: "to-plaza",
    map: "undercity",
    x: 13,
    y: 8,
    name: "Spire Stair",
    sprite: "door",
    action: {
      type: "go",
      map: "plaza",
      x: 8,
      y: 5,
      need: "cinder_joined",
      deny: "The stair is warded. Finish the mass in the station.",
      talk: "ch3_open",
    },
  },
  {
    id: "to-docks",
    map: "undercity",
    x: 3,
    y: 3,
    name: "Back to the Docks",
    sprite: "door",
    action: { type: "go", map: "docks", x: 12, y: 7, deny: "" },
  },
  {
    id: "plaza-market",
    map: "plaza",
    x: 4,
    y: 5,
    name: "Black Window",
    sprite: "shop",
    action: { type: "shop", shop: "market" },
  },
  {
    id: "plaza-patrol",
    map: "plaza",
    x: 11,
    y: 5,
    name: "Plaza Team",
    sprite: "corp",
    wander: true,
    hideWhen: "fight:plaza",
    action: { type: "fight", group: "plaza-team", flag: "fight:plaza" },
  },
  {
    id: "spire-door",
    map: "plaza",
    x: 8,
    y: 8,
    name: "Archive Mouth",
    sprite: "door",
    action: { type: "dungeon", id: "spire1", deny: "" },
  },
  {
    id: "to-under",
    map: "plaza",
    x: 8,
    y: 2,
    name: "Down to the Station",
    sprite: "door",
    action: { type: "go", map: "undercity", x: 12, y: 8, deny: "" },
  },
];

export function cityRows(id: string) {
  return CITY[id as CityIdLocal];
}

export function cityChar(id: string, x: number, y: number) {
  const rows = CITY[id as CityIdLocal];
  if (!rows || y < 0 || x < 0 || y >= rows.length || x >= rows[0]!.length) return "#";
  return rows[y]![x]!;
}

export function citySolid(ch: string) {
  return ch === "#" || ch === "~";
}

export function cityTheme(id: string): "docks" | "undercity" | "plaza" {
  if (id === "undercity") return "undercity";
  if (id === "plaza") return "plaza";
  return "docks";
}

export function objective(flags: Record<string, true>, map: string): string {
  if (!flags.vault_clear) return "Leave Hollow Sleep. The warden is between you and the rain.";
  if (!flags.alley_open && !flags.talked_imani && !flags.nyx_joined) return "Find Imani Quill. Sodium sign, moth logo.";
  if (!flags.nyx_joined) return "Clear the clinic alley and pull Nyx out of the grid.";
  if (map === "docks") return "Take the freight stair into the undercity.";
  if (!flags.cinder_joined && map === "undercity") return "Enter Ember Station. Light what the moth asks.";
  if (!flags.cinder_joined) return "Finish the station.";
  if (map !== "plaza" && !flags["met:helix"]) return "Climb to Kage Circuit's plaza.";
  if (!flags.sable_joined) return "The archive. Find the cell before you find the director.";
  if (!flags["fight:helix"]) return "Helix Marr is at the bottom of the ossuary.";
  if (!flags["fight:latch"]) return "The Latch is open to a decision. Make it and survive it.";
  return "The city is still there. So are you.";
}

export function visibleEnt(e: CityEnt, flags: Record<string, true>) {
  if (e.require && !flags[e.require]) return false;
  if (e.hideWhen && flags[e.hideWhen]) return false;
  return true;
}

function bfs(
  id: DungeonId,
  walls: (x: number, y: number) => boolean,
): Set<string> {
  const start = dungeonStart(id);
  const rows = ROWS[id];
  const seen = new Set<string>();
  const q = [[start.x, start.y]];
  seen.add(`${start.x},${start.y}`);
  while (q.length) {
    const [x, y] = q.pop()!;
    for (let d = 0; d < 4; d++) {
      const nx = x! + DX[d]!;
      const ny = y! + DY[d]!;
      const k = `${nx},${ny}`;
      if (seen.has(k)) continue;
      if (ny < 0 || nx < 0 || ny >= rows.length || nx >= rows[0]!.length) continue;
      if (walls(nx, ny)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return seen;
}

export function auditMaps(): string[] {
  const errors: string[] = [];
  (Object.keys(ROWS) as DungeonId[]).forEach((id) => {
    const rows = ROWS[id];
    const w = rows[0]!.length;
    rows.forEach((r, i) => {
      if (r.length !== w) errors.push(`${id} row ${i} width ${r.length} != ${w}`);
    });
    if (!rows.some((r) => r.includes("S"))) errors.push(`${id} missing S`);
    Object.entries(EVENTS[id]).forEach(([k, ev]) => {
      const [xs, ys] = k.split(",");
      const x = Number(xs);
      const y = Number(ys);
      const ch = dungeonChar(id, x, y);
      const expect: Record<CellEvent["kind"], string> = {
        door: "D",
        key: "k",
        fight: "eb",
        brazier: "B",
        gen: "G",
        stairs: ">",
        exit: "X",
        story: "N",
        note: "X",
      };
      if (!expect[ev.kind].includes(ch) && !(ev.kind === "fight" && (ch === "e" || ch === "b"))) {
        errors.push(`${id} ${k} kind ${ev.kind} on '${ch}'`);
      }
    });
    const flags: Record<string, true> = {};
    const reachKey = bfs(id, (x, y) => {
      const ch = dungeonChar(id, x, y);
      if (ch === "#") return true;
      const ev = dungeonEvent(id, x, y);
      if (ev?.kind === "door") return true;
      if (ev?.kind === "stairs" && ev.need) return true;
      return false;
    });
    Object.entries(EVENTS[id]).forEach(([k, ev]) => {
      if ((ev.kind === "key" || ev.kind === "brazier" || ev.kind === "gen") && !reachKey.has(k)) {
        errors.push(`${id} puzzle/key ${k} unreachable before locks`);
      }
      if (ev.kind === "key" || ev.kind === "brazier" || ev.kind === "gen") flags[ev.flag] = true;
    });
    const braz = Object.values(EVENTS[id]).filter((e) => e.kind === "brazier");
    if (braz.length && braz.every((b) => flags[b.flag])) flags["gate:ember"] = true;
    const gens = Object.values(EVENTS[id]).filter((e) => e.kind === "gen");
    if (gens.length && gens.every((g) => flags[g.flag])) flags["gate:spire"] = true;
    const reachAll = bfs(id, (x, y) => isBlocked(id, x, y, flags));
    Object.entries(EVENTS[id]).forEach(([k, ev]) => {
      if (ev.kind === "fight" && reachAll.has(k)) flags[ev.flag] = true;
    });
    const reachEnd = bfs(id, (x, y) => isBlocked(id, x, y, flags));
    Object.entries(EVENTS[id]).forEach(([k, ev]) => {
      if (
        (ev.kind === "exit" ||
          ev.kind === "fight" ||
          ev.kind === "story" ||
          ev.kind === "note" ||
          ev.kind === "stairs" ||
          ev.kind === "door") &&
        !reachEnd.has(k)
      ) {
        errors.push(`${id} ${ev.kind} ${k} unreachable after locks`);
      }
    });
  });
  (Object.keys(CITY) as CityIdLocal[]).forEach((id) => {
    const rows = CITY[id];
    const w = rows[0]!.length;
    rows.forEach((r, i) => {
      if (r.length !== w) errors.push(`city ${id} row ${i} width ${r.length} != ${w}`);
    });
  });
  ENTITIES.forEach((e) => {
    const ch = cityChar(e.map, e.x, e.y);
    if (citySolid(ch)) errors.push(`entity ${e.id} on solid '${ch}' at ${e.map} ${e.x},${e.y}`);
  });
  return errors;
}

export const TILE = 32;
