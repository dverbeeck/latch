export type Effect =
  | { op: "flag"; id: string }
  | { op: "join"; who: "nyx" | "cinder" | "sable" }
  | { op: "dungeon"; id: "vault" | "ember" | "spire1" | "spire2" }
  | { op: "city"; map: "docks" | "undercity" | "plaza"; x: number; y: number }
  | { op: "chapter"; n: 1 | 2 | 3 }
  | { op: "creds"; n: number }
  | { op: "item"; id: "medkit" | "stim" | "trauma"; n: number }
  | { op: "street"; group: string; then: string }
  | { op: "turn"; group: string; then?: string; flag?: string }
  | { op: "ending"; id: "sealed" | "cracked" }
  | { op: "heal" }
  | { op: "banner"; text: string };

export type Talk = {
  id: string;
  lines: { who: string; bust: string; text: string }[];
  choices?: { label: string; goto?: string; effects?: Effect[] }[];
  effects?: Effect[];
};

export const TALKS: Record<string, Talk> = {
  ch1_open: {
    id: "ch1_open",
    lines: [
      { who: "CHAPTER", bust: "chapter", text: "I — Thaw" },
      {
        who: "Vesper",
        bust: "chapter",
        text: "November 2084. You come up coughing antifreeze. The last ceiling you trust was a drop tile in 1998, and a woman saying hold still.",
      },
      {
        who: "Vesper",
        bust: "chapter",
        text: "The pod is cracked. The room hums like a server rack having a bad dream. Somewhere a voice with too many teeth calls this year normal.",
      },
      {
        who: "Vesper",
        bust: "chapter",
        text: "Your legs are a rumor. The corridor is not. Five-and-sixes hit. Everything else is the city.",
      },
    ],
    effects: [{ op: "dungeon", id: "vault" }],
  },
  vault_note: {
    id: "vault_note",
    lines: [
      {
        who: "Terminal",
        bust: "chapter",
        text: "HOLLOW SLEEP / SUBJECT 04 / DO NOT THAW / LATCH KEY — NEURAL LATTICE INTACT. Stamp: 1998.",
      },
      {
        who: "Terminal",
        bust: "chapter",
        text: "You were not stored. You were shelved. The latch they mean is not on the door.",
      },
    ],
  },
  vault_out: {
    id: "vault_out",
    lines: [
      {
        who: "Vesper",
        bust: "chapter",
        text: "The warden folds. Rain comes in through a freight door that still thinks the year is a rumor. The docks smell like hot salt and money.",
      },
      {
        who: "Vesper",
        bust: "chapter",
        text: "A clinic sign buzzes a sodium MOTH. Street docs don't advertise unless they expect bodies.",
      },
    ],
    effects: [
      { op: "flag", id: "vault_clear" },
      { op: "city", map: "docks", x: 3, y: 6 },
      { op: "banner", text: "Find the street doc." },
    ],
  },
  imani: {
    id: "imani",
    lines: [
      {
        who: "Imani Quill",
        bust: "imani",
        text: "Don't sit up fast. Vitals are ugly, but they're yours. The year is 2084. If you ask for a phone with a cord I will sedate you again.",
      },
      {
        who: "Imani Quill",
        bust: "imani",
        text: "You're clean. No jack, no plating. That's why you're expensive. Freeze-tag in the cortex is older than the Bloom. Somebody wanted a mind that still remembers a world without spirits.",
      },
      {
        who: "Imani Quill",
        bust: "imani",
        text: "A jack named Nyx came through my clinic grid the minute your pod cracked. Your head answered her. She's still in there, and Amberline sent a recovery team into my alley to finish both of you.",
      },
    ],
    choices: [
      { label: "Who froze me?", goto: "imani_who" },
      {
        label: "Open the alley.",
        effects: [
          { op: "flag", id: "talked_imani" },
          { op: "flag", id: "alley_open" },
          { op: "banner", text: "The alley team is south of the clinic." },
        ],
      },
    ],
  },
  imani_who: {
    id: "imani_who",
    lines: [
      {
        who: "Imani Quill",
        bust: "imani",
        text: "Kage Circuit, if the watermark is honest. A division that doesn't use its real name. Hollow Sleep. They shelved keys before magic came back, so they'd have a way to open whatever arrived with it.",
      },
      {
        who: "Imani Quill",
        bust: "imani",
        text: "I sell stitches, not theology. Clear my alley. Then ask the jack who was stupid enough to touch your dream.",
      },
    ],
    effects: [
      { op: "flag", id: "talked_imani" },
      { op: "flag", id: "alley_open" },
      { op: "banner", text: "South of the clinic. Two rifles, one alley." },
    ],
  },
  nyx_join: {
    id: "nyx_join",
    lines: [
      {
        who: "Nyx Vale",
        bust: "nyx",
        text: "Don't — you already touched the jack. Rude. Effective. Your lattice sang back in a dialect I had to look up. Pre-Bloom code. Post-Bloom teeth.",
      },
      {
        who: "Nyx Vale",
        bust: "nyx",
        text: "I'm Nyx Vale. I jack grids and I lose coats. Kage Circuit doesn't get you, and you don't walk into 2084 alone. You still think wireless is a kind of mouse.",
      },
      {
        who: "Nyx Vale",
        bust: "nyx",
        text: "The undercity is singing the same note as your headache. There's a priest down there who thinks moths are a valid news source. We should ruin his evening.",
      },
    ],
    effects: [
      { op: "join", who: "nyx" },
      { op: "flag", id: "nyx_joined" },
      { op: "item", id: "medkit", n: 1 },
      { op: "banner", text: "Nyx Vale joins. The freight stair to the undercity is open." },
    ],
  },
  ch2_open: {
    id: "ch2_open",
    lines: [
      { who: "CHAPTER", bust: "chapter", text: "II — Ember Mass" },
      {
        who: "Vesper",
        bust: "chapter",
        text: "The undercity smells like hot dust and cheap incense. Graffiti says the Red Receipts are buying cryo rumors by the ounce.",
      },
      {
        who: "Nyx Vale",
        bust: "nyx",
        text: "Station's ahead. If a moth knows your name, do not give it your real one. Too late for me. I already jacked you.",
      },
    ],
    effects: [{ op: "chapter", n: 2 }],
  },
  cinder_door: {
    id: "cinder_door",
    lines: [
      {
        who: "Brother Cinder",
        bust: "cinder",
        text: "The moth has been drawing your face in soot all week. I would prefer you step inside before Amberline's harvesters do. Bring the woman who argues with electricity.",
      },
      {
        who: "Brother Cinder",
        bust: "cinder",
        text: "Three braziers. Light them and the old gate remembers it is a door. Don't negotiate with anything that offers you a promotion.",
      },
    ],
    effects: [{ op: "flag", id: "cinder_met" }, { op: "dungeon", id: "ember" }],
  },
  cinder_join: {
    id: "cinder_join",
    lines: [
      {
        who: "Brother Cinder",
        bust: "cinder",
        text: "The harvest warden wanted your lattice as a wick. The Ember Moth wants it as a doorstop. I trust the moth slightly more, which is not a high compliment.",
      },
      {
        who: "Brother Cinder",
        bust: "cinder",
        text: "I am Brother Cinder. I will walk with you until the Latch is either shut or honest. There is a spire up top that pretends to be an archive. It is a mouth.",
      },
    ],
    effects: [
      { op: "join", who: "cinder" },
      { op: "flag", id: "cinder_joined" },
      { op: "heal" },
      { op: "city", map: "undercity", x: 8, y: 6 },
      { op: "banner", text: "Brother Cinder joins. The spire stair is open." },
    ],
  },
  ch3_open: {
    id: "ch3_open",
    lines: [
      { who: "CHAPTER", bust: "chapter", text: "III — The Latch" },
      {
        who: "Vesper",
        bust: "chapter",
        text: "Kage Circuit's plaza is clean the way a scalpel is clean. Under the boardroom is a church basement they call Archive.",
      },
      {
        who: "Sable?",
        bust: "sable",
        text: "A security ghost in your ear, 1999 vintage: I'm still on the escort. If you can hear this, they thawed me first. Don't trust the marble.",
      },
    ],
    effects: [{ op: "chapter", n: 3 }],
  },
  sable_cell: {
    id: "sable_cell",
    lines: [
      {
        who: "Sable Orth",
        bust: "sable",
        text: "You're shorter than the file. Or they made me taller. I walked you into Hollow Sleep. I thought it was protection for a prodigy. I was a key too.",
      },
      {
        who: "Sable Orth",
        bust: "sable",
        text: "They plated me while I was still counting the ceiling tiles from 1999. Cut the tether and I put this new spine between you and Helix Marr. That is not forgiveness. That is aim.",
      },
    ],
    effects: [
      { op: "join", who: "sable" },
      { op: "flag", id: "sable_joined" },
      { op: "item", id: "trauma", n: 1 },
      { op: "banner", text: "Sable Orth joins the front rank." },
    ],
  },
  helix_intro: {
    id: "helix_intro",
    lines: [
      {
        who: "Helix Marr",
        bust: "helix",
        text: "Subject 04. You cost more than the spire's marble and you still walk like a person. The Latch does not need you conscious. It needs you open.",
      },
      {
        who: "Helix Marr",
        bust: "helix",
        text: "Magic arrived late. We prepared. A lattice frozen before the Bloom can sign for both worlds. You are a signature. Try not to smudge.",
      },
    ],
    effects: [{ op: "turn", group: "spire-boss", flag: "fight:helix", then: "latch_choice" }],
  },
  latch_choice: {
    id: "latch_choice",
    lines: [
      {
        who: "Vesper",
        bust: "chapter",
        text: "The chamber is cable and bone. In the center, a lock that is also an ear. It knows your name in a voice from a room with a corded phone.",
      },
      {
        who: "Brother Cinder",
        bust: "cinder",
        text: "Shut it. Your memory of a world without spirits is the bolt. The city keeps its magic. It does not get to compile it.",
      },
      {
        who: "Nyx Vale",
        bust: "nyx",
        text: "Or crack it. One inch. We aim the draft instead of pretending it isn't pushing. You will feel it behind the eyes for the rest of your life. So will the next corp that tries this.",
      },
    ],
    choices: [
      {
        label: "Seal the Latch.",
        effects: [
          { op: "flag", id: "choice_seal" },
          { op: "turn", group: "latch-boss", flag: "fight:latch", then: "ending_sealed" },
        ],
      },
      {
        label: "Crack it one inch.",
        effects: [
          { op: "flag", id: "choice_crack" },
          { op: "turn", group: "latch-boss", flag: "fight:latch", then: "ending_cracked" },
        ],
      },
    ],
  },
  ending_sealed: {
    id: "ending_sealed",
    lines: [
      {
        who: "Vesper",
        bust: "chapter",
        text: "Cinder sings a note that would embarrass a cathedral. You hold the lock shut with a memory of dial-up and a winter that had no spirits in it. The Latch clicks like a seatbelt.",
      },
      {
        who: "Nyx Vale",
        bust: "nyx",
        text: "I had a whole speech about owning the future. Fine. The future can wait in the hall. I'm getting a coat that isn't on fire.",
      },
      {
        who: "Sable Orth",
        bust: "sable",
        text: "You were shelved to open a door. You woke up and closed it. That is a good first day in a bad century. Imani says come in before the bleeding becomes a personality.",
      },
    ],
    effects: [{ op: "ending", id: "sealed" }],
  },
  ending_cracked: {
    id: "ending_cracked",
    lines: [
      {
        who: "Vesper",
        bust: "chapter",
        text: "Nyx drives the spike. The Latch opens a fraction. Something like a saint made of packet loss looks at you and waits for orders. You tell it no. It listens. That is worse.",
      },
      {
        who: "Brother Cinder",
        bust: "cinder",
        text: "The moth is furious, which I respect. The city will feel this draft for years. So will you, whenever a spirit and a server try to be the same animal.",
      },
      {
        who: "Sable Orth",
        bust: "sable",
        text: "You were a key. You are a person who owns a key. Try to be careful. The century is not.",
      },
    ],
    effects: [{ op: "ending", id: "cracked" }],
  },
  pawn: {
    id: "pawn",
    lines: [
      {
        who: "Pawn Ost",
        bust: "pawn",
        text: "Ost. I buy rumors and sell directions. You look like a rumor that learned to bleed. Legwork's free if I already know it. Creds if I don't.",
      },
    ],
  },
  help_city: {
    id: "help_city",
    lines: [
      {
        who: "Field note",
        bust: "chapter",
        text: "Streets are live. Move, shoot, dodge. Dungeons wait their turn: five-and-sixes are hits, armor soaks with dice, mana laughs at plating. Chrome spends Integrity. Magic is Integrity, rounded down.",
      },
    ],
  },
};

export const LEGWORK: { id: string; need: string; who: string; q: string; a: string }[] = [
  {
    id: "lw-bloom",
    need: "talked_imani",
    who: "Imani Quill",
    q: "What is the Bloom?",
    a: "2012. People changed in their sleep and the rules grew a second set. Spirits, rites, the Changed — Ael, Knurl, Husk, Titan. Corps wrote policies before the hospitals did.",
  },
  {
    id: "lw-kage",
    need: "talked_imani",
    who: "Imani Quill",
    q: "Kage Circuit?",
    a: "Matrix, medicine, and a basement they don't print. Hollow Sleep was their insurance: freeze a few rare lattices in the nineties, thaw them when the world grew a lock.",
  },
  {
    id: "lw-nyx",
    need: "nyx_joined",
    who: "Nyx Vale",
    q: "Why did you jack a clinic?",
    a: "Because the cryo grid pinged a handshake I hadn't seen outside a museum. I answered. Your head answered back. Now Amberline has my face and I have your problem. Fair trade. Terrible trade.",
  },
  {
    id: "lw-moth",
    need: "cinder_joined",
    who: "Brother Cinder",
    q: "What does the moth want?",
    a: "Doors that stay doors. The Latch would let a corp compile a spirit the way they compile a daemon. The moth finds that personally offensive. So do I, more quietly.",
  },
  {
    id: "lw-sable",
    need: "sable_joined",
    who: "Sable Orth",
    q: "What were we, in 1999?",
    a: "You were a prodigy with a lattice that scored wrong on every test that wasn't a lock. I was the escort who believed the briefing. We were keys. They just didn't say for what.",
  },
  {
    id: "lw-pawn",
    need: "nyx_joined",
    who: "Pawn Ost",
    q: "Where's the spire weak?",
    a: "Not the lobby. The archive stair eats badges and pride. Generators on the first vault, a cell block under that, Helix Marr at the bottom pretending to be a director. Bring a healer or a lot of patches.",
  },
];
