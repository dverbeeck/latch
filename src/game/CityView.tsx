import { useEffect, useRef } from "react";
import { paintCity } from "./draw";
import { useGame } from "./store";
import { ENTITIES, TILE, cityChar, citySolid, visibleEnt } from "./world";

type Probe = {
  getX: () => number;
  getY: () => number;
  getSpeed: () => number;
  getYaw: () => number;
  setKeys: (codes: string[]) => void;
  setSteer?: (v: number) => void;
};

declare global {
  interface Window {
    __controlsTest?: Probe;
    __latch?: { skip: (to: "docks" | "under" | "plaza") => void };
  }
}

export function CityView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const keys = useRef(new Set<string>());
  const stick = useRef({ x: 0, y: 0 });
  const speed = useRef(0);
  const mapId = useGame((s) => s.mapId);

  useEffect(() => {
    const s = useGame.getState();
    pos.current = { x: s.x, y: s.y };
  }, [mapId]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
      if ((e.code === "KeyE" || e.code === "Enter") && !e.repeat) {
        useGame.getState().interactAt(pos.current.x, pos.current.y);
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    if (import.meta.env.DEV) {
      window.__controlsTest = {
        getX: () => pos.current.x,
        getY: () => pos.current.y,
        getSpeed: () => speed.current,
        getYaw: () => 0,
        setKeys: (codes) => {
          keys.current = new Set(codes);
        },
        setSteer: () => {},
      };
      window.__latch = { skip: (to) => useGame.getState().debugSkip(to) };
    }
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = keys.current;
      let ax = stick.current.x;
      let ay = stick.current.y;
      if (k.has("KeyA") || k.has("ArrowLeft")) ax -= 1;
      if (k.has("KeyD") || k.has("ArrowRight")) ax += 1;
      if (k.has("KeyW") || k.has("ArrowUp")) ay -= 1;
      if (k.has("KeyS") || k.has("ArrowDown")) ay += 1;
      const len = Math.hypot(ax, ay);
      const sp = 150;
      if (len > 0.1) {
        ax /= len;
        ay /= len;
        const nx = pos.current.x + ax * sp * dt;
        const ny = pos.current.y + ay * sp * dt;
        const map = useGame.getState().mapId;
        const rad = 10;
        const free = (x: number, y: number) => {
          const corners: [number, number][] = [
            [x - rad, y - rad],
            [x + rad, y - rad],
            [x - rad, y + rad],
            [x + rad, y + rad],
          ];
          return corners.every(([cx, cy]) => !citySolid(cityChar(map, Math.floor(cx / TILE), Math.floor(cy / TILE))));
        };
        if (free(nx, pos.current.y)) pos.current.x = nx;
        if (free(pos.current.x, ny)) pos.current.y = ny;
        speed.current = sp;
      } else speed.current = 0;
      const st = useGame.getState();
      if (st.phase === "city" && !st.overlay) {
        for (const e of ENTITIES) {
          if (e.map !== st.mapId || !e.wander || !visibleEnt(e, st.flags)) continue;
          if (e.action.type !== "fight") continue;
          const d = Math.hypot(e.x + 0.5 - pos.current.x / TILE, e.y + 0.5 - pos.current.y / TILE);
          if (d < 0.95) {
            st.setPos(pos.current.x, pos.current.y);
            st.interactAt(pos.current.x, pos.current.y);
            break;
          }
        }
      }
      acc += dt;
      if (acc > 0.45) {
        acc = 0;
        useGame.getState().setPos(pos.current.x, pos.current.y);
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const view = fit(canvas, rect.width, rect.height);
        if (view) {
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          const live = ENTITIES.filter((e) => e.map === st.mapId && visibleEnt(e, st.flags));
          paintCity(
            view.ctx,
            view.w,
            view.h,
            st.mapId,
            pos.current.x,
            pos.current.y,
            live,
            st.flags,
            now / 1000,
            speed.current > 0,
            reduce,
          );
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      useGame.getState().setPos(pos.current.x, pos.current.y);
      if (import.meta.env.DEV) delete window.__controlsTest;
    };
  }, [mapId]);

  return (
    <div className="relative min-h-0 flex-1">
      <canvas ref={canvasRef} className="h-full w-full touch-none" />
      <Stick
        onChange={(x, y) => {
          stick.current = { x, y };
        }}
      />
      <button
        className="btn btn-primary absolute right-3 bottom-3"
        onClick={() => useGame.getState().interactAt(pos.current.x, pos.current.y)}
      >
        Look
      </button>
    </div>
  );
}

function fit(canvas: HTMLCanvasElement, cssW: number, cssH: number) {
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

export function Stick({ onChange }: { onChange: (x: number, y: number) => void }) {
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);
  return (
    <div
      className="absolute bottom-3 left-3 h-28 w-28 touch-none rounded-sm border border-line bg-panel/80"
      onPointerDown={(e) => {
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        origin.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
      }}
      onPointerMove={(e) => {
        if (!origin.current || origin.current.id !== e.pointerId) return;
        const dx = e.clientX - origin.current.x;
        const dy = e.clientY - origin.current.y;
        const len = Math.hypot(dx, dy) || 1;
        const cap = Math.min(1, len / 36);
        onChange((dx / len) * cap, (dy / len) * cap);
      }}
      onPointerUp={(e) => {
        if (origin.current?.id === e.pointerId) origin.current = null;
        onChange(0, 0);
      }}
      onPointerCancel={() => onChange(0, 0)}
    >
      <span className="pointer-events-none absolute inset-0 grid place-items-center text-xs tracking-widest text-mist">
        MOVE
      </span>
    </div>
  );
}
