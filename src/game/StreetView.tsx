import { useEffect, useRef } from "react";
import { fitCanvas, paintStreet } from "./draw";
import type { AbilityId, Member } from "./model";
import { ABILITIES } from "./model";
import { makeSim, stepSim, type Sim, type Stick } from "./street";
import { useGame } from "./store";
import { Stick as MoveStick } from "./CityView";

export function StreetView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sim = useRef<Sim | null>(null);
  const party = useRef<Member[]>([]);
  const input = useRef<Stick>({ x: 0, y: 0, attack: false, dodge: false, ability: null, switchTo: null });
  const keys = useRef(new Set<string>());
  const attackHold = useRef(false);
  const attackTap = useRef(false);
  const group = useGame((s) => s.streetGroup);
  const done = useRef(false);

  useEffect(() => {
    const s = useGame.getState();
    party.current = structuredClone(s.party);
    sim.current = makeSim(party.current, group ?? "dock-patrol");
    done.current = false;
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (e.code === "KeyJ" || e.code === "Space") input.current.attack = true;
      if (e.code === "KeyK") input.current.dodge = true;
      if (e.code === "Digit1") pulse(0);
      if (e.code === "Digit2") pulse(1);
      if (e.code === "Digit3") pulse(2);
    };
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
      if (e.code === "KeyJ" || e.code === "Space") input.current.attack = false;
      if (e.code === "KeyK") input.current.dodge = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const world = sim.current;
      if (world && !done.current) {
        let x = input.current.x;
        let y = input.current.y;
        if (keys.current.has("KeyA") || keys.current.has("ArrowLeft")) x -= 1;
        if (keys.current.has("KeyD") || keys.current.has("ArrowRight")) x += 1;
        if (keys.current.has("KeyW") || keys.current.has("ArrowUp")) y -= 1;
        if (keys.current.has("KeyS") || keys.current.has("ArrowDown")) y += 1;
        const attack = input.current.attack || attackHold.current || attackTap.current;
        attackTap.current = false;
        stepSim(world, dt, { ...input.current, x, y, attack }, party.current);
        input.current.ability = null;
        input.current.switchTo = null;
        input.current.dodge = false;
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const fit = fitCanvas(canvas, rect.width, rect.height);
          if (fit) paintStreet(fit.ctx, fit.w, fit.h, world);
        }
        if (world.over) {
          done.current = true;
          for (const a of world.actors) {
            const m = party.current.find((p) => p.id === a.id);
            if (m && a.side === "party") {
              m.hp = a.hp;
              m.focus = a.focus;
            }
          }
          useGame.getState().finishStreet(party.current, world.over);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [group]);

  const pc = useGame((s) => s.party.find((p) => p.id === (sim.current?.actors.find((a) => a.control)?.id ?? "pc")) ?? s.party[0]);
  const abilities = pc?.abilities ?? [];

  function pulse(i: number) {
    const id = abilities[i];
    if (id) input.current.ability = id;
  }

  return (
    <div className="relative min-h-0 flex-1">
      <canvas ref={canvasRef} className="h-full w-full touch-none" />
      <MoveStick
        onChange={(x, y) => {
          input.current.x = x;
          input.current.y = y;
        }}
      />
      <div className="absolute right-2 bottom-2 grid grid-cols-2 gap-2">
        <button className="btn" onClick={() => (input.current.dodge = true)}>
          Dodge
        </button>
        <button
          className="btn btn-primary"
          onPointerDown={(e) => {
            e.preventDefault();
            attackHold.current = true;
            attackTap.current = true;
          }}
          onPointerUp={() => (attackHold.current = false)}
          onPointerCancel={() => (attackHold.current = false)}
        >
          Hit
        </button>
        {abilities.map((id) => (
          <button key={id} className="btn" onClick={() => (input.current.ability = id as AbilityId)}>
            {ABILITIES[id].short}
          </button>
        ))}
      </div>
      <div className="absolute top-2 left-2 flex gap-1">
        {useGame.getState().party.map((m) => (
          <button
            key={m.id}
            className="btn btn-ghost px-2"
            onClick={() => (input.current.switchTo = m.id)}
          >
            {m.name.slice(0, 1)}
          </button>
        ))}
      </div>
    </div>
  );
}
