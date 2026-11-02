let ctx: AudioContext | null = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function setMuted(v: boolean) {
  muted = v;
}

export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
}

export function blip(kind: "ui" | "hit" | "miss" | "hurt" | "win" | "step" | "magic") {
  if (!ctx || muted || ctx.state !== "running") return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g);
  g.connect(ctx.destination);
  const now = ctx.currentTime;
  const map = {
    ui: { f: 520, t: "square" as OscillatorType, d: 0.05, v: 0.03 },
    hit: { f: 180, t: "sawtooth" as OscillatorType, d: 0.08, v: 0.04 },
    miss: { f: 90, t: "triangle" as OscillatorType, d: 0.06, v: 0.03 },
    hurt: { f: 110, t: "square" as OscillatorType, d: 0.12, v: 0.05 },
    win: { f: 440, t: "square" as OscillatorType, d: 0.18, v: 0.04 },
    step: { f: 140, t: "triangle" as OscillatorType, d: 0.04, v: 0.02 },
    magic: { f: 660, t: "square" as OscillatorType, d: 0.1, v: 0.035 },
  }[kind];
  o.type = map.t;
  o.frequency.setValueAtTime(map.f, now);
  if (kind === "win") o.frequency.exponentialRampToValueAtTime(880, now + map.d);
  if (kind === "hurt") o.frequency.exponentialRampToValueAtTime(60, now + map.d);
  g.gain.setValueAtTime(map.v, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + map.d);
  o.start(now);
  o.stop(now + map.d + 0.02);
}
