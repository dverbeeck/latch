import type { Archetype, Metatype } from "./model";
import type { Sim } from "./street";
import { AH, AW } from "./street";
import type { CityEnt, DungeonId } from "./world";
import { DUNGEON_META, TILE, cityChar, cityTheme, dungeonChar, dungeonEvent, forward, isBlocked } from "./world";

export const INK = "#07110e";
export const PANEL = "#121c18";
export const BONE = "#e7f0e4";
export const MIST = "#93a89a";
export const SODIUM = "#f0a202";
export const RUST = "#d4532b";

export function fitCanvas(canvas: HTMLCanvasElement, cssW: number, cssH: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(2, Math.floor(cssW));
  const h = Math.max(2, Math.floor(cssH));
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  return { ctx, w, h };
}

function hash(x: number, y: number) {
  return ((x * 374761393) ^ (y * 668265263)) >>> 0;
}

function shade(theme: "vault" | "ember" | "spire", dist: number) {
  const lit = Math.max(0.42, 1.2 - dist * 0.14);
  if (theme === "ember") {
    return {
      face: `rgb(${Math.round(196 * lit)},${Math.round(86 * lit)},${Math.round(38 * lit)})`,
      inset: `rgb(${Math.round(92 * lit)},${Math.round(32 * lit)},${Math.round(16 * lit)})`,
      floor: `rgb(${Math.round(78 * lit)},${Math.round(32 * lit)},${Math.round(18 * lit)})`,
      ceil: "#160e0c",
      edge: "rgba(240,162,2,0.9)",
    };
  }
  if (theme === "spire") {
    return {
      face: `rgb(${Math.round(118 * lit)},${Math.round(114 * lit)},${Math.round(142 * lit)})`,
      inset: `rgb(${Math.round(52 * lit)},${Math.round(48 * lit)},${Math.round(70 * lit)})`,
      floor: `rgb(${Math.round(36 * lit)},${Math.round(34 * lit)},${Math.round(52 * lit)})`,
      ceil: "#100e16",
      edge: "rgba(240,162,2,0.75)",
    };
  }
  return {
    face: `rgb(${Math.round(78 * lit)},${Math.round(168 * lit)},${Math.round(132 * lit)})`,
    inset: `rgb(${Math.round(24 * lit)},${Math.round(72 * lit)},${Math.round(56 * lit)})`,
    floor: `rgb(${Math.round(28 * lit)},${Math.round(78 * lit)},${Math.round(60 * lit)})`,
    ceil: "#071410",
    edge: "rgba(240,162,2,0.8)",
  };
}

export function paintDungeon(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  id: DungeonId,
  px: number,
  py: number,
  dir: number,
  flags: Record<string, true>,
  seen: Record<string, true>,
) {
  const theme = DUNGEON_META[id].theme;
  const base = shade(theme, 2);
  ctx.fillStyle = base.ceil;
  ctx.fillRect(0, 0, w, h);

  const f = forward(dir);
  const lx = f.y;
  const ly = -f.x;
  const CEIL = -0.46;
  const FLOOR = 0.64;
  const focalX = w * 0.48;
  const focalY = h * 0.52;
  const eyeY = h * 0.4;

  const project = (x: number, y: number, z: number) => ({
    x: w / 2 + (x / z) * focalX,
    y: eyeY + (y / z) * focalY,
  });

  const quad = (
    pts: { x: number; y: number }[],
    fill: string,
    stroke?: string,
  ) => {
    ctx.beginPath();
    ctx.moveTo(pts[0]!.x, pts[0]!.y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const kindAt = (x: number, y: number): "open" | "wall" | "door" | "gate" => {
    if (dungeonChar(id, x, y) === "#") return "wall";
    const ev = dungeonEvent(id, x, y);
    if (!ev || !isBlocked(id, x, y, flags)) return "open";
    if (ev.kind === "door") return "door";
    return "gate";
  };

  let maxS = 5;
  for (let s = 1; s <= 5; s++) {
    if (kindAt(px + f.x * s, py + f.y * s) !== "open") {
      maxS = s;
      break;
    }
  }

  for (let s = maxS; s >= 0; s--) {
    const z0 = s === 0 ? 0.15 : s - 0.5;
    const z1 = s === 0 ? 0.5 : s + 0.5;
    const cx = px + f.x * s;
    const cy = py + f.y * s;
    const block = s === 0 ? "open" : kindAt(cx, cy);
    const tone = shade(theme, s);

    if (block !== "open") {
      quad(
        [
          project(-0.5, CEIL, z0),
          project(0.5, CEIL, z0),
          project(0.5, FLOOR, z0),
          project(-0.5, FLOOR, z0),
        ],
        block === "door" ? "#1a120c" : tone.face,
        block === "door" ? SODIUM : tone.edge,
      );
      quad(
        [
          project(-0.32, CEIL + 0.1, z0),
          project(0.32, CEIL + 0.1, z0),
          project(0.32, FLOOR - 0.12, z0),
          project(-0.32, FLOOR - 0.12, z0),
        ],
        block === "door" ? "#070908" : tone.inset,
      );
      if (block === "door") {
        const latch = project(0, 0.05, z0);
        ctx.fillStyle = SODIUM;
        ctx.beginPath();
        ctx.moveTo(latch.x, latch.y - 10);
        ctx.lineTo(latch.x + 8, latch.y);
        ctx.lineTo(latch.x, latch.y + 10);
        ctx.lineTo(latch.x - 8, latch.y);
        ctx.fill();
      }
      continue;
    }

    quad(
      [
        project(-0.5, FLOOR, z1),
        project(0.5, FLOOR, z1),
        project(0.5, FLOOR, z0),
        project(-0.5, FLOOR, z0),
      ],
      tone.floor,
    );
    quad(
      [
        project(-0.5, CEIL, z1),
        project(0.5, CEIL, z1),
        project(0.5, CEIL, z0),
        project(-0.5, CEIL, z0),
      ],
      s % 2 === 0 ? base.ceil : "#0c1814",
    );
    ctx.strokeStyle = "rgba(240,162,2,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const c0 = project(0, FLOOR, z0);
    const c1 = project(0, FLOOR, z1);
    ctx.moveTo(c0.x, c0.y);
    ctx.lineTo(c1.x, c1.y);
    ctx.stroke();

    for (const side of [-1, 1] as const) {
      const nx = cx + lx * side;
      const ny = cy + ly * side;
      const xIn = side === -1 ? -0.5 : 0.5;
      const xOut = side === -1 ? -1.5 : 1.5;
      const sideKind = kindAt(nx, ny);
      if (sideKind !== "open") {
        quad(
          [
            project(xIn, CEIL, z1),
            project(xIn, CEIL, z0),
            project(xIn, FLOOR, z0),
            project(xIn, FLOOR, z1),
          ],
          sideKind === "door" ? "#1a120c" : tone.face,
          sideKind === "door" ? SODIUM : tone.edge,
        );
        const midZ = (z0 + z1) / 2;
        ctx.strokeStyle = "rgba(7,17,14,0.45)";
        ctx.beginPath();
        const m0 = project(xIn, CEIL + 0.16, midZ);
        const m1 = project(xIn, FLOOR - 0.1, midZ);
        ctx.moveTo(m0.x, m0.y);
        ctx.lineTo(m1.x, m1.y);
        ctx.stroke();
      } else {
        const alcove = shade(theme, s + 1);
        quad(
          [
            project(xOut, FLOOR, z1),
            project(xIn, FLOOR, z1),
            project(xIn, FLOOR, z0),
            project(xOut, FLOOR, z0),
          ],
          alcove.floor,
        );
        quad(
          [
            project(xOut, CEIL, z1),
            project(xIn, CEIL, z1),
            project(xIn, CEIL, z0),
            project(xOut, CEIL, z0),
          ],
          base.ceil,
        );
        const jamb = (zz: number, solid: boolean) => {
          if (!solid) return;
          quad(
            [
              project(xIn, CEIL, zz),
              project(xOut, CEIL, zz),
              project(xOut, FLOOR, zz),
              project(xIn, FLOOR, zz),
            ],
            tone.face,
            tone.edge,
          );
        };
        jamb(z1, kindAt(nx + f.x, ny + f.y) !== "open");
        jamb(z0, kindAt(nx - f.x, ny - f.y) !== "open");
        const beyond = kindAt(cx + lx * side * 2, cy + ly * side * 2);
        if (beyond !== "open") {
          quad(
            [
              project(xOut, CEIL, z1),
              project(xOut, CEIL, z0),
              project(xOut, FLOOR, z0),
              project(xOut, FLOOR, z1),
            ],
            alcove.inset,
            alcove.edge,
          );
        } else {
          const xFar = side === -1 ? -2.4 : 2.4;
          quad(
            [
              project(xFar, FLOOR, z1),
              project(xOut, FLOOR, z1),
              project(xOut, FLOOR, z0),
              project(xFar, FLOOR, z0),
            ],
            shade(theme, s + 2).floor,
          );
        }
      }
    }

    if (s >= 1) {
      const ev = dungeonEvent(id, cx, cy);
      if (ev && !flags[ev.flag] && ev.kind !== "door") {
        const z = (z0 + z1) / 2;
        const feet = project(0, 0.22, z);
        const scale = Math.max(0.6, (0.7 * focalY) / z / 30);
        const spr =
          ev.kind === "fight"
            ? dungeonChar(id, cx, cy) === "b"
              ? "spirit"
              : "drone"
            : ev.kind === "brazier" || ev.kind === "gen"
              ? "spirit"
              : ev.kind === "story"
                ? "sable"
                : ev.kind === "key"
                  ? "key"
                  : "latch";
        if (spr === "key") {
          ctx.save();
          ctx.translate(feet.x, feet.y);
          ctx.scale(scale, scale);
          ctx.fillStyle = SODIUM;
          ctx.fillRect(-10, -18, 20, 12);
          ctx.fillStyle = INK;
          ctx.fillRect(-4, -14, 8, 4);
          ctx.restore();
        } else {
          actor(ctx, feet.x, feet.y, spr, 0, false, scale);
        }
      }
    }
  }

  ctx.fillStyle = SODIUM;
  ctx.font = "700 22px 'Big Shoulders Display', Impact, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(["N", "E", "S", "W"][dir] ?? "", 14, 28);
  ctx.font = "11px Sora, sans-serif";
  ctx.fillStyle = MIST;
  ctx.fillText("FACING", 14, 42);

  const rows = dungeonRowsSafe(id);
  const width = id === "ember" ? 15 : 13;
  const cell = 8;
  const mw = width * cell;
  const ox = w - mw - 14;
  const oy = 14;
  ctx.fillStyle = "rgba(7,17,14,0.82)";
  ctx.fillRect(ox - 6, oy - 6, mw + 12, rows * cell + 12);
  ctx.strokeStyle = "rgba(240,162,2,0.45)";
  ctx.strokeRect(ox - 6, oy - 6, mw + 12, rows * cell + 12);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < width; x++) {
      if (dungeonChar(id, x, y) === "#") continue;
      if (!seen[`${id}:${x},${y}`] && !(x === px && y === py)) continue;
      ctx.fillStyle = x === px && y === py ? SODIUM : "#3d8f72";
      ctx.fillRect(ox + x * cell, oy + y * cell, cell - 1, cell - 1);
    }
  }
  const tip = forward(dir);
  ctx.fillStyle = INK;
  ctx.fillRect(ox + px * cell + 2, oy + py * cell + 2, 3, 3);
  ctx.fillStyle = SODIUM;
  ctx.fillRect(ox + px * cell + 2 + tip.x * 2, oy + py * cell + 2 + tip.y * 2, 2, 2);
}

function dungeonRowsSafe(id: DungeonId) {
  if (id === "ember") return 12;
  if (id === "spire1") return 10;
  return 12;
}

function paintCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ch: string,
  theme: "docks" | "undercity" | "plaza",
  tx: number,
  ty: number,
  time: number,
  reduce: boolean,
) {
  if (ch === "~") {
    ctx.fillStyle = "#0c1c22";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = "rgba(240,162,2,0.25)";
    ctx.beginPath();
    const o = reduce ? 0 : (time * 20 + tx * 4) % 12;
    ctx.moveTo(x, y + 10 + o / 4);
    ctx.lineTo(x + TILE, y + 8 + o / 4);
    ctx.stroke();
    return;
  }
  if (ch === "#") {
    ctx.fillStyle = theme === "plaza" ? "#1a1714" : "#10241c";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = "#31483d";
    ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    const hsh = hash(tx, ty);
    if (hsh % 3 !== 0) {
      ctx.fillStyle = hsh % 2 === 0 ? SODIUM : "#c9d4b4";
      ctx.globalAlpha = 0.8;
      ctx.fillRect(x + 6, y + 8, 6, 8);
      ctx.globalAlpha = hsh % 5 === 0 ? 0.85 : 0.25;
      ctx.fillRect(x + 18, y + 8, 6, 8);
      ctx.globalAlpha = 1;
    }
    return;
  }
  ctx.fillStyle = theme === "undercity" ? "#14110e" : theme === "plaza" ? "#121614" : "#0e1914";
  ctx.fillRect(x, y, TILE, TILE);
  if (ch === "=") {
    ctx.fillStyle = "#3a2a16";
    ctx.fillRect(x, y + 4, TILE, 4);
    ctx.fillRect(x, y + 14, TILE, 4);
    ctx.fillRect(x, y + 24, TILE, 3);
    return;
  }
  if (ch === "+") {
    ctx.strokeStyle = "rgba(240,162,2,0.35)";
    ctx.strokeRect(x + 8, y + 8, 16, 16);
    return;
  }
  const hsh = hash(tx, ty);
  if (hsh % 7 === 0) {
    ctx.fillStyle = "rgba(231,240,228,0.05)";
    ctx.fillRect(x + 2, y + (hsh % 20), 10, 2);
  }
  if (theme === "docks" && ty % 4 === 2) {
    ctx.fillStyle = "rgba(240,162,2,0.18)";
    ctx.fillRect(x, y + 14, TILE, 2);
  }
}

export function actor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: string,
  time: number,
  moving: boolean,
  scale: number,
) {
  const bob = moving ? Math.sin(time * 10) * 1.5 : 0;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y + bob));
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 10, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  if (kind === "shop") {
    ctx.fillStyle = "#16302c";
    ctx.fillRect(-10, -16, 20, 18);
    ctx.fillStyle = SODIUM;
    ctx.fillRect(-2, -14, 4, 14);
    ctx.fillRect(-7, -9, 14, 3);
    ctx.restore();
    return;
  }
  if (kind === "door") {
    ctx.strokeStyle = SODIUM;
    ctx.lineWidth = 2;
    ctx.strokeRect(-8, -18, 16, 24);
    ctx.fillStyle = SODIUM;
    ctx.fillRect(-2, -6, 3, 3);
    ctx.restore();
    return;
  }
  const skin = kind === "husk" ? "#8a9a62" : kind === "titan" ? "#6d7a68" : kind === "ael" || kind === "nyx" ? "#d7c4a8" : "#e2c7a4";
  const coat =
    kind === "nyx"
      ? "#24362c"
      : kind === "cinder"
        ? "#3a2418"
        : kind === "sable" || kind === "corp"
          ? "#1c2430"
          : kind === "ganger"
            ? "#4a2218"
            : kind === "imani"
              ? "#1e3330"
              : kind === "spirit" || kind === "latch"
                ? SODIUM
                : kind === "drone"
                  ? "#22302a"
                  : kind === "pawn"
                    ? "#3a3420"
                    : "#15241c";
  const tall = kind === "titan" ? 4 : kind === "knurl" || kind === "pawn" ? -3 : 0;
  ctx.fillStyle = coat;
  ctx.fillRect(-6, -8 - tall, 12, 16 + tall);
  ctx.fillStyle = skin;
  ctx.fillRect(-4, -18 - tall, 8, 8);
  if (kind === "ael" || kind === "nyx") {
    ctx.fillStyle = skin;
    ctx.fillRect(-8, -16 - tall, 3, 5);
    ctx.fillRect(5, -16 - tall, 3, 5);
  }
  if (kind === "husk" || kind === "titan") {
    ctx.fillStyle = BONE;
    ctx.fillRect(-5, -12 - tall, 2, 3);
    ctx.fillRect(3, -12 - tall, 2, 3);
  }
  if (kind === "drone") {
    ctx.fillStyle = "#1a2822";
    ctx.fillRect(-7, -12, 14, 12);
    ctx.fillStyle = SODIUM;
    ctx.fillRect(-2, -8, 4, 3);
  }
  if (kind === "spirit" || kind === "latch") {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = SODIUM;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(8, -4);
    ctx.lineTo(0, 8);
    ctx.lineTo(-8, -4);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (kind === "nyx") {
    ctx.fillStyle = SODIUM;
    ctx.fillRect(3, -16, 2, 2);
  }
  if (kind === "cinder") {
    ctx.strokeStyle = SODIUM;
    ctx.strokeRect(-3, -4, 6, 6);
  }
  if (kind === "sable" || kind === "corp") {
    ctx.fillStyle = MIST;
    ctx.fillRect(-7, -2, 3, 8);
  }
  ctx.restore();
}

export function paintCity(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  map: string,
  px: number,
  py: number,
  ents: CityEnt[],
  _flags: Record<string, true>,
  time: number,
  moving: boolean,
  reduce: boolean,
) {
  const theme = cityTheme(map);
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);
  const camX = px - w / 2;
  const camY = py - h / 2;
  const x0 = Math.floor(camX / TILE) - 1;
  const y0 = Math.floor(camY / TILE) - 1;
  const x1 = Math.ceil((camX + w) / TILE) + 1;
  const y1 = Math.ceil((camY + h) / TILE) + 1;
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      paintCell(ctx, tx * TILE - camX, ty * TILE - camY, cityChar(map, tx, ty), theme, tx, ty, time, reduce);
    }
  }
  for (const e of ents) {
    const ex = (e.x + 0.5) * TILE - camX;
    const ey = (e.y + 0.5) * TILE - camY;
    actor(ctx, ex, ey, e.sprite, time, Boolean(e.wander) && !reduce, e.sprite === "door" || e.sprite === "shop" ? 1.15 : 1.25);
    ctx.font = "11px Sora, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = INK;
    ctx.fillText(e.name, ex + 1, ey - 25);
    ctx.fillStyle = SODIUM;
    ctx.fillText(e.name, ex, ey - 26);
  }
  actor(ctx, w / 2, h / 2, "human", time, moving, 1.45);
  ctx.strokeStyle = SODIUM;
  ctx.lineWidth = 1;
  ctx.strokeRect(w / 2 - 10, h / 2 - 22, 20, 26);
}

export function paintStreet(ctx: CanvasRenderingContext2D, w: number, h: number, sim: Sim) {
  ctx.save();
  const focus = sim.actors.find((a) => a.control && a.alive) ?? sim.actors[0];
  const viewW = 280;
  const viewH = 180;
  const camX = Math.max(0, Math.min(AW - viewW, (focus?.x ?? AW / 2) - viewW / 2));
  const camY = Math.max(0, Math.min(AH - viewH, (focus?.y ?? AH / 2) - viewH / 2));
  ctx.scale(w / viewW, h / viewH);
  ctx.translate(-camX, -camY);
  if (sim.shake > 0) {
    ctx.translate((Math.random() - 0.5) * sim.shake, (Math.random() - 0.5) * sim.shake);
  }
  ctx.fillStyle = "#101816";
  ctx.fillRect(0, 0, AW, AH);
  ctx.strokeStyle = "rgba(240,162,2,0.15)";
  for (let x = 0; x < AW; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, AH);
    ctx.stroke();
  }
  for (const o of sim.obstacles) {
    ctx.fillStyle = "#24362c";
    ctx.fillRect(o.x, o.y, o.w, o.h);
  }
  for (const a of sim.actors) {
    ctx.globalAlpha = a.alive ? 1 : 0.35;
    if (a.hurt > 0) ctx.fillStyle = RUST;
    actor(ctx, a.x, a.y, a.sprite === "pc" ? "human" : a.sprite, sim.t, a.alive, a.control ? 1.3 : 1);
    ctx.globalAlpha = 1;
    if (a.alive) {
      ctx.fillStyle = INK;
      ctx.fillRect(a.x - 12, a.y - 26, 24, 4);
      ctx.fillStyle = a.side === "foe" ? RUST : SODIUM;
      ctx.fillRect(a.x - 12, a.y - 26, 24 * (a.hp / a.maxHp), 4);
      if (a.control) {
        ctx.strokeStyle = SODIUM;
        ctx.strokeRect(a.x - 14, a.y - 20, 28, 28);
      }
    }
  }
  ctx.fillStyle = SODIUM;
  for (const s of sim.shots) ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
  ctx.font = "12px Sora, sans-serif";
  ctx.textAlign = "center";
  for (const t of sim.texts) {
    ctx.fillStyle = t.bad ? RUST : BONE;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.restore();
}

export type BustWho = {
  metatype: Metatype;
  archetype: Archetype;
  who: string;
};

export function paintBust(ctx: CanvasRenderingContext2D, w: number, h: number, spec: BustWho) {
  ctx.fillStyle = PANEL;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#0c1914";
  ctx.fillRect(6, 6, w - 12, h - 12);
  if (spec.who === "chapter") {
    ctx.strokeStyle = SODIUM;
    ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.28, h * 0.22, w * 0.44, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.3);
    ctx.lineTo(w * 0.62, h * 0.48);
    ctx.lineTo(w * 0.5, h * 0.66);
    ctx.lineTo(w * 0.38, h * 0.48);
    ctx.closePath();
    ctx.stroke();
    return;
  }
  const skin =
    spec.metatype === "husk" ? "#8a9a62" : spec.metatype === "titan" ? "#6e7c68" : spec.who === "helix" ? "#c8b8a4" : "#e4c8a6";
  const coat =
    spec.who === "nyx"
      ? "#1d3330"
      : spec.who === "cinder"
        ? "#3d2618"
        : spec.who === "sable"
          ? "#1a2433"
          : spec.who === "imani"
            ? "#16302c"
            : spec.who === "pawn"
              ? "#2a2618"
              : spec.who === "helix"
                ? "#2a1218"
                : spec.archetype === "spellwright"
                  ? "#241c33"
                  : "#15241c";
  ctx.fillStyle = coat;
  ctx.fillRect(w * 0.22, h * 0.48, w * 0.56, h * 0.42);
  ctx.fillStyle = skin;
  const hw = spec.metatype === "titan" || spec.metatype === "husk" ? w * 0.28 : w * 0.22;
  ctx.fillRect(w / 2 - hw / 2, h * 0.18, hw, h * 0.28);
  if (spec.metatype === "ael" || spec.who === "nyx") {
    ctx.fillRect(w * 0.22, h * 0.24, w * 0.08, h * 0.12);
    ctx.fillRect(w * 0.7, h * 0.24, w * 0.08, h * 0.12);
  }
  if (spec.metatype === "husk" || spec.metatype === "titan") {
    ctx.fillStyle = BONE;
    ctx.fillRect(w * 0.4, h * 0.4, 4, 8);
    ctx.fillRect(w * 0.56, h * 0.4, 4, 8);
  }
  ctx.fillStyle = INK;
  ctx.fillRect(w * 0.4, h * 0.3, 6, 3);
  ctx.fillRect(w * 0.54, h * 0.3, 6, 3);
  if (spec.archetype === "razor" || spec.who === "sable") {
    ctx.fillStyle = RUST;
    ctx.fillRect(w * 0.54, h * 0.3, 6, 3);
  }
  if (spec.archetype === "jack" || spec.who === "nyx") {
    ctx.strokeStyle = SODIUM;
    ctx.beginPath();
    ctx.moveTo(w * 0.68, h * 0.28);
    ctx.lineTo(w * 0.84, h * 0.36);
    ctx.stroke();
  }
  if (spec.archetype === "caller" || spec.who === "cinder") {
    ctx.strokeStyle = SODIUM;
    ctx.strokeRect(w * 0.38, h * 0.58, w * 0.24, h * 0.12);
  }
  if (spec.archetype === "spellwright" || spec.who === "helix") {
    ctx.strokeStyle = SODIUM;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.16, 16, 0, Math.PI * 2);
    ctx.stroke();
  }
}

