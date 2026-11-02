import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Game } from "@/game/Game";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(true), []);
  if (!on) {
    return (
      <main className="grid min-h-dvh place-items-center bg-ink">
        <p className="display text-6xl text-sodium">Latch</p>
      </main>
    );
  }
  return <Game />;
}
