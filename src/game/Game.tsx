import { useEffect, useRef, useState } from "react";
import { BookOpen, Users, Volume2, VolumeX } from "lucide-react";
import { isMuted, setMuted, unlockAudio } from "./audio";
import { CityView } from "./CityView";
import { DungeonView } from "./DungeonView";
import { paintBust, actor, fitCanvas, type BustWho } from "./draw";
import {
  ABILITIES,
  ARCHETYPES,
  CYBER,
  ITEMS,
  METATYPES,
  WEAPONS,
  abilityCost,
  canCast,
  createPlayer,
  defensePool,
  magicOf,
  weaponPool,
  type AbilityId,
  type Archetype,
  type Draft,
  type ItemId,
  type Metatype,
  type SkillId,
} from "./model";
import { StreetView } from "./StreetView";
import { closeFight, useGame } from "./store";
import { LEGWORK, TALKS } from "./talks";
import { DUNGEON_META, objective } from "./world";

export function Game() {
  const phase = useGame((s) => s.phase);
  useEffect(() => {
    useGame.getState().boot();
    if (import.meta.env.DEV) {
      window.__latch = { skip: (to) => useGame.getState().debugSkip(to) };
    }
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  return (
    <div className="app-shell">
      {phase === "title" && <Title />}
      {phase === "create" && <Create />}
      {phase === "ending" && <Ending />}
      {phase === "talk" && <Talk />}
      {(phase === "city" || phase === "dungeon" || phase === "street" || phase === "turn") && <Play />}
    </div>
  );
}

function Title() {
  const hasSave = useGame((s) => s.hasSave);
  return (
    <div className="relative flex min-h-0 flex-1 flex-col justify-end p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(240,162,2,0.16),transparent_42%),linear-gradient(#10241c,#07110e)]" />
      <div className="scan pointer-events-none absolute inset-0" />
      <div className="relative z-10 mx-auto w-full max-w-lg">
        <p className="kicker">Vesper City · 2084</p>
        <h1 className="display mt-2 text-7xl text-bone sm:text-8xl">Latch</h1>
        <p className="mt-3 max-w-md text-mist">
          You went into a freezer in 1998. You came out after magic did. A chrome-and-rite CRPG — live streets, turn-based vaults, dice that only care about fives and sixes.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => useGame.setState({ phase: "create" })}>
            Wake up
          </button>
          {hasSave && (
            <button className="btn" onClick={() => useGame.getState().continueGame()}>
              Continue
            </button>
          )}
        </div>
        <p className="mt-4 text-sm text-mist">Streets: stick or WASD, Hit, Dodge. Vaults: arrows step and turn. Look interacts.</p>
      </div>
    </div>
  );
}

function Create() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Subject 04");
  const [metatype, setMetatype] = useState<Metatype>("human");
  const [archetype, setArchetype] = useState<Archetype>("razor");
  const draft: Draft = { name, metatype, archetype };
  return (
    <div className="scroll-y flex-1 p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <p className="kicker">Subject file</p>
        <h2 className="display text-5xl">{step === 0 ? "Body" : step === 1 ? "Trade" : "Confirm"}</h2>
        {step === 0 && (
          <>
            <label className="text-sm text-mist">
              Name
              <input
                value={name}
                maxLength={18}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full border border-line bg-panel px-3 py-3 text-bone"
              />
            </label>
            <div className="grid gap-2">
              {METATYPES.map((m) => (
                <button
                  key={m.id}
                  className={`panel p-3 text-left ${metatype === m.id ? "border-sodium" : ""}`}
                  onClick={() => setMetatype(m.id)}
                >
                  <span className="display text-2xl">{m.name}</span>
                  <span className="mt-1 block text-sm text-mist">{m.line}</span>
                </button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => setStep(1)}>
              Next
            </button>
          </>
        )}
        {step === 1 && (
          <>
            <div className="grid gap-2">
              {ARCHETYPES.map((a) => (
                <button
                  key={a.id}
                  className={`panel p-3 text-left ${archetype === a.id ? "border-sodium" : ""}`}
                  onClick={() => setArchetype(a.id)}
                >
                  <span className="display text-2xl">{a.name}</span>
                  <span className="mt-1 block text-sm text-bone">{a.line}</span>
                  <span className="mt-1 block text-sm text-mist">
                    Street: {a.street} Vault: {a.vault}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={() => setStep(0)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Sheet
              </button>
            </div>
          </>
        )}
        {step === 2 && <Confirm draft={draft} onBack={() => setStep(1)} />}
      </div>
    </div>
  );
}

function Confirm({ draft, onBack }: { draft: Draft; onBack: () => void }) {
  const m = createPlayer(draft);
  return (
    <>
      <div className="panel p-4">
        <p className="display text-3xl">{m.name}</p>
        <p className="text-mist">
          {METATYPES.find((t) => t.id === m.metatype)?.name} {m.role} · Integrity {m.integrity.toFixed(1)} · Magic {magicOf(m)}
        </p>
        <p className="mt-2 text-sm">
          HP {m.maxHp} · Focus {m.maxFocus} · {WEAPONS[m.weapon].name} pool {weaponPool(m)} · Defense {defensePool(m)}
        </p>
        <p className="mt-2 text-sm text-mist">Fives and sixes are hits. Armor soaks with dice. Mana ignores plating and hates Will. Chrome spends Integrity, and magic is whatever Integrity you have left, rounded down.</p>
      </div>
      <div className="flex gap-2">
        <button className="btn" onClick={onBack}>
          Back
        </button>
        <button className="btn btn-primary" onClick={() => useGame.getState().newGame(draft)}>
          Crack the pod
        </button>
      </div>
    </>
  );
}

function Talk() {
  const talkId = useGame((s) => s.talkId);
  const talkI = useGame((s) => s.talkI);
  const party = useGame((s) => s.party);
  const talk = talkId ? TALKS[talkId] : null;
  if (!talk) return null;
  const line = talk.lines[talkI] ?? talk.lines[0]!;
  const spec = bustOf(line.bust, party[0]);
  const last = talkI >= talk.lines.length - 1;
  return (
    <div className="flex min-h-0 flex-1 flex-col p-4">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-end gap-3">
        {line.who === "CHAPTER" ? (
          <h2 className="display text-6xl text-sodium">{line.text}</h2>
        ) : (
          <div className="panel flex gap-3 p-3">
            <Bust spec={spec} />
            <div>
              <p className="kicker">{line.who}</p>
              <p className="mt-2 text-base leading-relaxed">{line.text}</p>
            </div>
          </div>
        )}
        {last && talk.choices ? (
          <div className="flex flex-col gap-2">
            {talk.choices.map((c, i) => (
              <button key={c.label} className="btn" onClick={() => useGame.getState().choose(i)}>
                {c.label}
              </button>
            ))}
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => useGame.getState().advanceTalk()}>
            {last ? "Continue" : "Next"}
          </button>
        )}
      </div>
    </div>
  );
}

function bustOf(bust: string, pc: { metatype: Metatype; archetype: Archetype } | undefined): BustWho {
  const map: Record<string, BustWho> = {
    nyx: { who: "nyx", metatype: "ael", archetype: "jack" },
    cinder: { who: "cinder", metatype: "human", archetype: "caller" },
    sable: { who: "sable", metatype: "human", archetype: "razor" },
    imani: { who: "imani", metatype: "human", archetype: "channel" },
    pawn: { who: "pawn", metatype: "knurl", archetype: "dronehand" },
    helix: { who: "helix", metatype: "human", archetype: "spellwright" },
    chapter: { who: "chapter", metatype: "human", archetype: "razor" },
  };
  return (
    map[bust] ?? {
      who: "pc",
      metatype: pc?.metatype ?? "human",
      archetype: pc?.archetype ?? "razor",
    }
  );
}

function Bust({ spec }: { spec: BustWho }) {
  const ref = (node: HTMLCanvasElement | null) => {
    if (!node) return;
    const ctx = node.getContext("2d");
    if (!ctx) return;
    node.width = 160;
    node.height = 200;
    paintBust(ctx, 160, 200, spec);
  };
  return <canvas ref={ref} className="h-28 w-24 shrink-0 bg-ink" />;
}

function Play() {
  const phase = useGame((s) => s.phase);
  const banner = useGame((s) => s.banner);
  const creds = useGame((s) => s.creds);
  const rep = useGame((s) => s.rep);
  const chapter = useGame((s) => s.chapter);
  const flags = useGame((s) => s.flags);
  const mapId = useGame((s) => s.mapId);
  const dungeonId = useGame((s) => s.dungeonId);
  const overlay = useGame((s) => s.overlay);
  const [mute, setMuteState] = useState(isMuted());
  const place =
    phase === "dungeon" || phase === "turn"
      ? dungeonId
        ? DUNGEON_META[dungeonId].name
        : "Vault"
      : mapId === "undercity"
        ? "Undercity"
        : mapId === "plaza"
          ? "Kage Plaza"
          : "Salt Docks";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-line px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="kicker">
            Ch {chapter} · {place}
          </p>
          <p className="truncate text-sm text-mist">{objective(flags, mapId)}</p>
        </div>
        <span className="text-sm text-sodium">{creds}¢</span>
        <span className="text-sm text-mist">{rep} rep</span>
        <button className="btn btn-ghost px-2" aria-label="Party" onClick={() => useGame.getState().setOverlay(overlay === "party" ? null : "party")}>
          <Users className="size-5" />
        </button>
        <button className="btn btn-ghost px-2" aria-label="Legwork" onClick={() => useGame.getState().setOverlay(overlay === "legwork" ? null : "legwork")}>
          <BookOpen className="size-5" />
        </button>
        <button
          className="btn btn-ghost px-2"
          aria-label={mute ? "Unmute" : "Mute"}
          onClick={() => {
            setMuted(!mute);
            setMuteState(!mute);
          }}
        >
          {mute ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </header>
      {banner && <p className="border-b border-line bg-panel px-3 py-2 text-sm text-sodium">{banner}</p>}
      <div className="relative flex min-h-0 flex-1 flex-col">
        {phase === "city" && <CityView />}
        {phase === "dungeon" && <DungeonView />}
        {phase === "street" && <StreetView />}
        {phase === "turn" && <TurnFight />}
        {overlay === "party" && <PartySheet />}
        {overlay === "legwork" && <Legwork />}
        {overlay === "shop" && <Shop />}
      </div>
    </div>
  );
}

function TurnFight() {
  const fight = useGame((s) => s.fight);
  const party = useGame((s) => s.party);
  const items = useGame((s) => s.items);
  const [target, setTarget] = useState(0);
  const [ally, setAlly] = useState(0);
  const [push, setPush] = useState(false);
  useEffect(() => {
    if (!fight || fight.phase !== "pick") return;
    const slot = fight.order[fight.cursor];
    if (!slot || slot.side === "party") return;
    const t = window.setTimeout(() => useGame.getState().tickFoe(), 700);
    return () => window.clearTimeout(t);
  }, [fight]);
  if (!fight) return null;
  const slot = fight.order[fight.cursor];
  const actor = slot?.side === "party" ? party.find((p) => p.id === slot.id) : null;
  const foes = fight.foes.filter((f) => f.hp > 0);
  return (
    <div className="scroll-y flex min-h-0 flex-1 flex-col gap-2 p-3">
      <BattleStage />
      <div className="flex flex-wrap gap-2">
        {fight.foes.map((f, i) => (
          <button
            key={f.uid}
            disabled={f.hp <= 0}
            onClick={() => setTarget(i)}
            className={`panel min-w-28 p-2 text-left ${target === i ? "border-sodium" : ""}`}
          >
            <span className="text-sm">{f.name}</span>
            <span className="block text-xs text-sodium">{f.intent}</span>
            <Bar value={f.hp} max={f.maxHp} rust />
          </button>
        ))}
        {fight.adds.filter((a) => a.hp > 0).map((a) => (
          <div key={a.uid} className="panel p-2 text-sm">
            {a.name} · {a.turns}r
            <Bar value={a.hp} max={a.maxHp} />
          </div>
        ))}
      </div>
      {fight.last && (
        <div className="panel p-2 text-sm">
          <p className="kicker">{fight.last.title}</p>
          <p className="mt-1">
            <Dice dice={fight.last.attack} /> vs <Dice dice={fight.last.defense} />
            {fight.last.soak && (
              <>
                {" "}
                soak <Dice dice={fight.last.soak} />
              </>
            )}
          </p>
          <p>{fight.last.note}</p>
        </div>
      )}
      <div className="flex flex-col gap-1">
        {party.map((m, i) => (
          <button key={m.id} className="panel flex items-center gap-2 p-2 text-left" onClick={() => setAlly(i)}>
            <span className={`w-24 truncate text-sm ${actor?.id === m.id ? "text-sodium" : ""}`}>
              {m.front ? "F " : "B "}
              {m.name}
            </span>
            <span className="flex-1">
              <Bar value={m.hp} max={m.maxHp} rust={m.hp < m.maxHp * 0.35} />
            </span>
            <span className="w-10 text-right text-xs text-mist">{m.focus}</span>
          </button>
        ))}
      </div>
      <div className="panel max-h-24 overflow-y-auto p-2 text-xs text-mist">
        {fight.log.slice(0, 6).map((l, i) => (
          <p key={i} className={l.kind === "bad" ? "text-rust" : l.kind === "hit" ? "text-bone" : ""}>
            {l.t}
          </p>
        ))}
      </div>
      {fight.phase !== "pick" ? (
        <button className="btn btn-primary" onClick={() => closeFight()}>
          {fight.phase === "win" ? "Take it" : "Get up"}
        </button>
      ) : actor ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            className="btn"
            onClick={() => useGame.getState().turnAct({ type: "attack", target, push })}
          >
            Attack
          </button>
          <button className="btn" onClick={() => useGame.getState().turnAct({ type: "guard" })}>
            Guard
          </button>
          {actor.abilities.map((id) => {
            const why = canCast(actor, id);
            return (
              <button
                key={id}
                className="btn"
                disabled={Boolean(why)}
                onClick={() =>
                  useGame.getState().turnAct({
                    type: "ability",
                    id,
                    target: ABILITIES[id].target === "ally" || ABILITIES[id].target === "self" ? ally : target,
                    push,
                  })
                }
              >
                {ABILITIES[id].short} {abilityCost(actor, id)}
                {why ? "" : ""}
              </button>
            );
          })}
          {(["medkit", "stim", "trauma"] as ItemId[]).map((id) => (
            <button
              key={id}
              className="btn"
              disabled={(items[id] ?? 0) <= 0}
              onClick={() => useGame.getState().turnAct({ type: "item", id, target: ally })}
            >
              {ITEMS[id].name} {items[id] ?? 0}
            </button>
          ))}
          <button className={`btn ${push ? "btn-primary" : ""}`} disabled={!fight.edge[actor.id]} onClick={() => setPush((v) => !v)}>
            Edge {push ? "on" : "off"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-mist">{foes.length ? "They move." : ""}</p>
      )}
    </div>
  );
}

function BattleStage() {
  const fight = useGame((s) => s.fight);
  const party = useGame((s) => s.party);
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !fight) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const fit = fitCanvas(canvas, rect.width, rect.height);
      if (!fit) return;
      const { ctx, w, h } = fit;
      ctx.fillStyle = "#07110e";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#10241c";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.62);
      ctx.lineTo(w, h * 0.62);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();
      ctx.strokeStyle = "rgba(240,162,2,0.35)";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.62);
      ctx.lineTo(w, h * 0.62);
      ctx.stroke();
      party.forEach((m, i) => {
        const x = w * 0.22 + i * 54;
        actor(ctx, x, h * 0.78, m.id === "nyx" ? "nyx" : m.id === "cinder" ? "cinder" : m.id === "sable" ? "sable" : m.metatype, 0, false, 2.4);
        ctx.fillStyle = "#e7f0e4";
        ctx.font = "12px Sora, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(m.name, x, h * 0.28);
      });
      fight.foes.forEach((f, i) => {
        if (f.hp <= 0) return;
        const x = w * 0.68 + i * 70;
        actor(ctx, x, h * 0.74, f.sprite, 0, false, 2.6);
        ctx.fillStyle = "#d4532b";
        ctx.font = "12px Sora, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(f.name, x, h * 0.22);
      });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [fight, party]);
  return <canvas ref={ref} className="h-36 w-full shrink-0 border border-line bg-ink" />;
}

function Bar({ value, max, rust }: { value: number; max: number; rust?: boolean }) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <span className="bar mt-1 block">
      <span className={rust ? "bg-rust" : "bg-sodium"} style={{ width: `${pct}%` }} />
    </span>
  );
}

function Dice({ dice }: { dice: number[] }) {
  return (
    <span className="inline-flex gap-1 font-display">
      {dice.map((d, i) => (
        <span key={i} className={d >= 5 ? "text-sodium" : d === 1 ? "text-rust" : "text-mist"}>
          {d}
        </span>
      ))}
    </span>
  );
}

function PartySheet() {
  const party = useGame((s) => s.party);
  const rep = useGame((s) => s.rep);
  const [id, setId] = useState(party[0]?.id ?? "pc");
  const m = party.find((p) => p.id === id) ?? party[0];
  if (!m) return null;
  const skills: SkillId[] = ["firearms", "blades", "unarmed", "athletics", "hack", "sorcery", "conjuring", "pilot", "influence"];
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-ink/95 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="display text-3xl">Party</p>
        <button className="btn" onClick={() => useGame.getState().setOverlay(null)}>
          Close
        </button>
      </div>
      <div className="mb-2 flex gap-2 overflow-x-auto">
        {party.map((p) => (
          <button key={p.id} className={`btn ${p.id === m.id ? "btn-primary" : ""}`} onClick={() => setId(p.id)}>
            {p.name}
          </button>
        ))}
      </div>
      <div className="scroll-y panel flex-1 p-3 text-sm">
        <p>
          {m.role} · {m.metatype} · Integrity {m.integrity.toFixed(1)} · Magic {magicOf(m)} · {m.front ? "Front" : "Back"}
        </p>
        <p className="mt-1 text-mist">
          HP {m.hp}/{m.maxHp} · Focus {m.focus}/{m.maxFocus} · {WEAPONS[m.weapon].name}
        </p>
        <button className="btn mt-2" onClick={() => useGame.getState().toggleFront(m.id)}>
          Toggle rank
        </button>
        <p className="kicker mt-3">Attributes · 5 rep</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {(Object.keys(m.attrs) as (keyof typeof m.attrs)[]).map((k) => (
            <button key={k} className="btn" disabled={rep < 5 || m.attrs[k] >= 6} onClick={() => useGame.getState().train(m.id, "attr", k)}>
              {k} {m.attrs[k]}
            </button>
          ))}
        </div>
        <p className="kicker mt-3">Skills · 2 rep</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {skills.map((k) => (
            <button key={k} className="btn" disabled={rep < 2 || (m.skills[k] ?? 0) >= 6} onClick={() => useGame.getState().train(m.id, "skill", k)}>
              {k} {m.skills[k] ?? 0}
            </button>
          ))}
        </div>
        <p className="mt-3 text-mist">Chrome: {m.cyber.filter((c) => c !== "titan-hide").join(", ") || "none"}</p>
      </div>
    </div>
  );
}

function Legwork() {
  const flags = useGame((s) => s.flags);
  const rows = LEGWORK.filter((l) => flags[l.need]);
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-ink/95 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="display text-3xl">Legwork</p>
        <button className="btn" onClick={() => useGame.getState().setOverlay(null)}>
          Close
        </button>
      </div>
      <div className="scroll-y flex flex-col gap-2">
        {rows.length === 0 && <p className="text-mist">You don't know anyone yet.</p>}
        {rows.map((l) => (
          <article key={l.id} className="panel p-3">
            <p className="kicker">
              {l.who} · {l.q}
            </p>
            <p className="mt-2 text-sm">{l.a}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function Shop() {
  const shop = useGame((s) => s.shop);
  const creds = useGame((s) => s.creds);
  const items = useGame((s) => s.items);
  const party = useGame((s) => s.party);
  const [who, setWho] = useState(party[0]?.id ?? "pc");
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-ink/95 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="display text-3xl">{shop === "market" ? "Wire & Bone" : "Mothlight"}</p>
        <button className="btn" onClick={() => useGame.getState().setOverlay(null)}>
          Leave
        </button>
      </div>
      <p className="mb-2 text-sm text-sodium">{creds} creds</p>
      <button className="btn mb-2" onClick={() => useGame.getState().stitch()}>
        Stitch the crew — 20
      </button>
      <div className="scroll-y flex flex-col gap-2">
        {(Object.keys(ITEMS) as ItemId[]).map((id) => (
          <div key={id} className="panel flex items-center justify-between gap-2 p-2">
            <div>
              <p>{ITEMS[id].name}</p>
              <p className="text-xs text-mist">
                {ITEMS[id].blurb} · held {items[id] ?? 0}
              </p>
            </div>
            <button className="btn" onClick={() => useGame.getState().buy("item", id)}>
              {ITEMS[id].cost}
            </button>
            <button className="btn" onClick={() => useGame.getState().sell(id)}>
              Sell
            </button>
          </div>
        ))}
        {shop === "market" && (
          <>
            <div className="flex gap-2 overflow-x-auto">
              {party.map((p) => (
                <button key={p.id} className={`btn ${who === p.id ? "btn-primary" : ""}`} onClick={() => setWho(p.id)}>
                  {p.name}
                </button>
              ))}
            </div>
            {CYBER.map((c) => (
              <div key={c.id} className="panel flex items-center justify-between gap-2 p-2">
                <div>
                  <p>{c.name}</p>
                  <p className="text-xs text-mist">
                    {c.blurb} · −{c.essence.toFixed(1)} Integrity
                  </p>
                </div>
                <button className="btn" onClick={() => useGame.getState().buy("cyber", c.id, who)}>
                  {c.cost}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function Ending() {
  const ending = useGame((s) => s.ending);
  return (
    <div className="flex flex-1 flex-col justify-end p-6">
      <p className="kicker">Subject 04</p>
      <h2 className="display text-6xl">{ending === "cracked" ? "Cracked" : "Sealed"}</h2>
      <p className="mt-3 max-w-lg text-mist">
        {ending === "cracked"
          ? "The Latch is open a finger's width. Vesper will feel the draft. So will you, behind the eyes, whenever a spirit and a server try to be the same animal."
          : "The Latch is shut. Vesper keeps its magic and does not get to compile it. You were shelved to open a door. You closed it."}
      </p>
      <button
        className="btn btn-primary mt-6 w-fit"
        onClick={() => {
          localStorage.removeItem("latch-subject04-v1");
          useGame.setState({ phase: "title", hasSave: false, party: [], fight: null, ending: null });
        }}
      >
        Another thaw
      </button>
    </div>
  );
}
