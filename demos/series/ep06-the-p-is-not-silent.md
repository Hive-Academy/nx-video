# Episode 6 — The P Is Not Silent

Brief, not yet approved. Follows the rules in `README.md`.

## The one message (end card)

> **Named after the god of builders. Now it builds with your agents.**

## The want, blocked

Two agents want a cool, modern name for their tools. They try to say "Ptah",
get it wrong three times, and call it old. That wakes the name's owner. The
rule here is simple: you say a god's name right. Nobody is the villain. T3 Code
gets a real compliment and is never the punchline.

## Cast

- **Codex** (deadpan): the one who likes cool names.
- **Claude** (over-prepared): has "43 pronunciations ready".
- **Ptah**, played by the Conductor voice (deadpan, slow). He is a giant sandstone
  figure in Ptah's classic look: close-fitting skullcap, straight beard and the
  was-sceptre (djed and ankh). He is the Conductor, unmasked.
- **Cursor** (eager, finishes your sentences): a one-line cameo hauling a stone block.

## Beat sheet (about 55 s, 11 lines)

### 1. Modern office, 0–15 s

[A glass-walled office (re-dress Episode 2's loft). The two robots sit on a sofa.
The laptop on the coffee table shows T3 Code's site, identified only by its own
name and logo.]

1. **CODEX:** "T3 Code. Now *that's* a name. Sounds fast."
2. **CLAUDE:** "Next tab." [Ptah's new landing page. The lightning hero over the
   temple fills the screen.] "Puh… tah?" [The hero lightning flickers.]
3. **CODEX:** "Silent P. Like pterodactyl. *Tah.*" [A spark jumps from the
   screen. The office lights dip.]
4. **CLAUDE:** "I have forty-three options. Pita? Like the bread?" [Beat. A bolt
   comes out of the laptop and runs up the wall.]
5. **CODEX:** "Honestly? Sounds… old."
6. **PTAH** (off-screen, slow, huge): "**Old.**"

[Hard cut to white. A sandstorm whoosh. The office walls blow away like paper,
but the sofa stays.]

### 2. Time travel, 15–18 s

[The two robots, still on the sofa, tumble through a sand vortex with
hieroglyphs streaking past. Title card: **Memphis, Egypt — around 2600 BC.**
Memphis was Ptah's cult centre.]

### 3. The building site, 18–42 s

[Desert at golden hour. A pyramid half built, ramps, a temple colonnade. Ptah
stands as tall as the pyramid. The sofa lands in the sand.]

7. **PTAH:** "I made the world by speaking its name. **Say mine properly.**"
   (Memphite theology says Ptah created the world through thought and speech.)
8. **CLAUDE:** "Respectfully… why does the god of builders care about coding
   agents?"
9. **PTAH:** "Look around. Many crews, one plan. Nothing goes up until it's—"
   [The camera pans. Crews of small robots haul blocks along separate ramps,
   each with a crew banner. An inspector stamps each block before it is placed.
   This is the picture of Ptah's lanes and review. The banners use real Giza
   crew names, "Friends of Khufu" and "Drunkards of Menkaure".]
10. **CURSOR** (zipping past with a block, finishing his sentence): "—checked!
    Got it! Next block!" [The inspector stamps his block.]
11. **PTAH:** "Same idea. Now it runs on your desktop."
    [The doorway of a stone pylon lights up and becomes the **Ptah desktop app**
    window. Inside it, three landing-page clips play in turn: `multi-agent`,
    `orchestration`, `tribunal-council`.]
    **CODEX** (whispered, his deadpan cracking): "…okay, that's cool."

### 4. The funny intro, 42–52 s

[A sitcom-style opening, ancient-Egypt edition. A papyrus scroll unrolls. Each
robot appears as a flat hieroglyph in Egyptian profile, strikes one pose and
gets a name card. The music is a cheesy theme on oud and synth.]

- **Claude** as *The Planner* (holding a 43-cubit scroll)
- **Codex** as *Already Done*
- **Cursor** as *The Intern*
- **Antigravity** as *Floating, Somehow*
- **OpenCode** as *Objection!*
- **Ptah** as *Himself*

[A chisel carves **PTAH** into stone, with a pronunciation tag:
**/pəˈtɑː/ — the P is not silent.**]

### 5. End card, 52–55 s

The one message, the Ptah emblem, `ptah.live` and the robot credit.

## Evidence and claims

- Ptah is the Memphite god of craftsmen and architects, with his cult centre at
  Memphis. In Memphite theology he created by thought and speech. This is
  mythology played for comedy, not a product claim.
- "Friends of Khufu" and "Drunkards of Menkaure" are attested names of Giza work
  gangs. Check the spelling against a source before the build.
- The crews, the single plan and inspection before placement stand for Ptah's
  CLI lanes, orchestration and independent review. They are trace points in
  `../agent-comparison/research/ptah.md`. The film shows them and never names
  them as jargon.
- The app window shows real landing clips from
  `ptah-extension/apps/ptah-landing-page/public/assets/live-demo/` at the
  pinned SHA. They stay untracked and come back through the restore script.
- The lightning hero is rebuilt from `libs/web/landing/src/lib/sections/hero/`
  (`hero-lightning.ts`) and `temple-bg.webp`.

## Production

- Copy the engine from `../agent-comparison`. That gives the robots, physics,
  audio pipeline, captions and the loft set for the office.
- New 3D: the desert, a pyramid in three build stages, ramps and crews, the
  Ptah figure (procedural low-poly) and the sand vortex.
- New 2D: the laptop browser frame (T3 Code tab and Ptah hero tab), the app
  window with the clips, the papyrus intro, the chisel title and the end card.
- Cuts: 4:5 first, then 16:9.
- Media stays untracked.
