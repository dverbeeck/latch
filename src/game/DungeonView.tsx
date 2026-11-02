import { useEffect, useRef } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Eye } from "lucide-react";
import { fitCanvas, paintDungeon } from "./draw";
import { useGame } from "./store";

export function DungeonView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const id = useGame((s) => s.dungeonId);
  const dx = useGame((s) => s.dx);
  const dy = useGame((s) => s.dy);
  const dir = useGame((s) => s.ddir);
  const flags = useGame((s) => s.flags);
  const seen = useGame((s) => s.seen);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !id) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const fit = fitCanvas(canvas, rect.width, rect.height);
      if (!fit) return;
      paintDungeon(fit.ctx, fit.w, fit.h, id, dx, dy, dir, flags, seen);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [id, dx, dy, dir, flags, seen]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const g = useGame.getState();
      if (g.phase !== "dungeon" || g.overlay) return;
      if (e.code === "ArrowUp" || e.code === "KeyW") g.moveDungeon("f");
      if (e.code === "ArrowDown" || e.code === "KeyS") g.moveDungeon("b");
      if (e.code === "ArrowLeft" || e.code === "KeyA") g.moveDungeon("l");
      if (e.code === "ArrowRight" || e.code === "KeyD") g.moveDungeon("r");
      if (e.code === "KeyE" || e.code === "Space") g.interactDungeon();
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  const go = (way: "f" | "b" | "l" | "r") => useGame.getState().moveDungeon(way);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <canvas ref={canvasRef} className="min-h-40 w-full flex-1 touch-none" />
      <div className="grid grid-cols-3 gap-2 p-3">
        <span />
        <button className="btn" aria-label="Step forward" onClick={() => go("f")}>
          <ArrowUp className="mx-auto size-5" />
        </button>
        <span />
        <button className="btn" aria-label="Turn left" onClick={() => go("l")}>
          <ArrowLeft className="mx-auto size-5" />
        </button>
        <button className="btn btn-primary" aria-label="Look" onClick={() => useGame.getState().interactDungeon()}>
          <Eye className="mx-auto size-5" />
        </button>
        <button className="btn" aria-label="Turn right" onClick={() => go("r")}>
          <ArrowRight className="mx-auto size-5" />
        </button>
        <span />
        <button className="btn" aria-label="Step back" onClick={() => go("b")}>
          <ArrowDown className="mx-auto size-5" />
        </button>
        <span />
      </div>
    </div>
  );
}
