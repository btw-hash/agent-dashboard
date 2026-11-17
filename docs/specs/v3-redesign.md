# Agent Office v3 — redesign brief

Status: built on 2026-11-17 on `feat/office-v3` (client under `src/office/`); the owner has
not reviewed the build yet. Everything here was chosen by the owner in the interview and
design rounds; the prototypes it refers to live in [`prototypes/`](../../prototypes/).

The conversation itself, round by round, is kept outside this repository, in the owner's
notes.

## What the product is

A colourful, living demo for a portfolio, not a work tool. A pixel-art office where each
running agent is a person: it sits down and types while it works and wanders off when it
rests. Functionality stays minimal. Anyone can plug in their own agents.

What is shown about an agent: that it works, plus a little fun colour (a made-up name,
mood, coffees drunk, a one-liner). Never a project name, a path, a file name or message
text. The server already enforces this (see "Server" below).

## Decisions

| Topic            | Decision                                                                                                                                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main look        | True 2D pixel art, top-down, the **Cozy** style from `prototypes/pixel-variants.html`                                                                                                                                                                    |
| People           | The **Office worker** design from `prototypes/people-and-visions.html`                                                                                                                                                                                   |
| Rejected         | Pixel art rendered from a 3D scene; the dark "night office" 3D look                                                                                                                                                                                      |
| Shell            | **Stage**: office fills the screen with floating panels; a **TV mode** hides them and auto-pans                                                                                                                                                          |
| Camera           | Soft: position and scale ease as one move and land on a whole-number scale; TV mode glides between shots; no wheel zoom, plus and minus buttons only                                                                                                     |
| Floor plan       | Re-planned wide: the four fun rooms sit beside the main hall so the building fits one screen                                                                                                                                                             |
| Phones           | Open zoomed in on the busiest desks, drag to look around; whole-number zoom only                                                                                                                                                                         |
| Mini-games       | All 18 (15 modules plus Ping Pong, Snake and Darts written inside v2 app.js), opened from their objects in one cabinet frame: tinted by the room, on-screen d-pad and A button, one score table, one exit (round 12, approved as shown)                  |
| Kept features    | Sims mode (round 13, approved: direct people on a break, busy agents refuse, without orders the free ones live their own day, no needs); guests and events (round 11, approved with edits: pizza, mail, cleaners, party, fire drill, blackout, holidays) |
| Dropped features | Layout editor (`EDIT`), PNG and GIF export                                                                                                                                                                                                               |
| Language         | English everywhere in the UI                                                                                                                                                                                                                             |
| Small details    | All 47 from `prototypes/` round 1, built in waves (list below)                                                                                                                                                                                           |
| Connecting       | Public demo with simulated agents + `npx agent-office` locally + `POST /api/event` for any bot                                                                                                                                                           |
| Old office       | Replaced. Tag the last pixel v2 commit as `v2-classic` before removing `src/app.js`                                                                                                                                                                      |
| three.js         | `npm install three` is approved (it touches `package-lock.json`) but only needed for the bonus 3D                                                                                                                                                        |

## Bonus views

One product, one main mode. The other ideas become small read-only extras entered from
inside the office, built after the pixel office is complete:

1. **Terminal** — the office in plain characters. Enter with the backtick key or by
   clicking the server rack. Also worth shipping as `npx agent-office --tui`.
2. **Windows at night** — a building where each agent is a window. Enter through the
   telescope; doubles as a screensaver when the page is idle.
3. **3D miniature** — the bright "Miniature" look, cameras Corner / Front cut-away /
   Walk-in. Enter through the 3D printer. Lazy-load three.js on first open.

Deferred, not planned: the side-view **Tower** (a second full layout) and the **Shelf**
(a desktop widget, needs its own packaging).

## How the pixel art is made

Lessons from the prototypes that the build should keep:

- One logical pixel grid, drawn to an offscreen canvas and blitted with whole-number
  zoom. The v2 blur came from a 1.25 stretch and anti-aliased ellipses.
- Sprites are assembled from rectangles in code, then an automatic pass adds a one-pixel
  ink outline. `slab()` gives every block a lit top edge and a shaded right and bottom.
- People are parts on a grid (head, hair, torso, arms, legs) with per-frame offsets from
  small tables. A walk is six frames per direction and advances with distance covered,
  so feet do not slide. Sprites are cached by look, pose, direction and frame.
- Furniture has a front face and a ground shadow; everything is depth-sorted by its base.
- Lighting is a low-resolution light map multiplied over the scene: ambient colour from
  the hour, soft pools from lamps and screens at night. Screens, neon and window panes
  are redrawn after it so they glow.

## The 47 small details

Wave 1 (light and desks): clock-driven lighting; glowing screens, neon and lamps; sun
shafts with dust; director camera; minimap; cat purrs hearts on click; agent card with
mood, energy, coffees and a one-liner; news ticker; mugs pile up with time worked; a
sticky note per finished task; monitor shows terminal, diff, browser or search by tool;
a personal desk buddy; printer on file writes; desk lamps go off as agents leave; a
trophy after a five-task streak; do-not-disturb sign and headphones in flow.

Wave 2 (agents): sub-agents as interns trailing their lead; facepalm and red "!" on a
tool error; fist pump and confetti on a finished task; burnout look on long sessions;
pacing or rubber-duck talk while thinking; waves and high-fives; a goodbye wave when a
session ends; blanket and tea after midnight; idle chatter.

Wave 3 (office and creatures): plants grow over days and droop unwatered; whiteboard
fills up and is wiped at midnight; "days without incident" board; cat naps on the
warmest keyboard; cat brings a "bug" after an error; goose steals sticky notes and honks
at the pizza guy; a night mouse the cat chases; fish crowd the glass; rain and wet
footprints; trash fills until the cleaners come; wall clock with a cuckoo; Friday pizza,
Monday coffee, holiday decor.

Wave 4 (interface): favicon cat sleeps or types; tab title counts working agents; boot
screen lights the rooms one by one; tooltip jokes on hover; achievement toasts; a secret
key combo for a disco; lo-fi ambience and typing that scales with activity, off by
default; one arcade-cabinet frame for all 18 games; a daily "office newspaper"; TV mode.

## Server

Already rebuilt on `feat/office-v3` and covered by 27 unit tests:

- `src/server/office.js` — in-memory state. Agents are keyed by an opaque hash; custom
  and MCP tool names collapse to `Tool`; fillers keep the office populated.
- `src/server/transcripts.js` — tails `~/.claude/projects/**/*.jsonl`, keeps only
  `assistant`, `user` and `summary` entries.
- `src/server/http.js` — `GET /api/state`, `GET /api/health`, `POST /api/event`,
  `POST /api/demo` (payload that existing local bots send), static files from `dist/`.
- Writes are allowed from this machine, or with `OFFICE_TOKEN` from anywhere else. A
  forwarding header counts as "anywhere else". Default bind is `127.0.0.1`.

`/api/layout` and the `layout_update` message exist only for the v2 layout editor and go
away with it.

## Suggested build order

1. Tag `v2-classic`. New client under `src/office/` beside the old one; switch the entry
   when it reaches parity.
2. Engine: grid, sprite factory with outline pass, depth sort, camera with whole-number
   zoom and drag, light map.
3. Wide floor plan with walls, doors and pathfinding; furniture for every room.
4. People: the Office worker design with all current poses redrawn; cat and goose.
5. Shell: Stage panels, agent card, TV mode with director camera, "Connect yours" sheet.
6. Mini-games wired to their objects inside one cabinet frame; Sims mode; events.
7. Details, wave by wave. Then the bonus views.
8. `npx agent-office` (a `bin` entry), README with a hero GIF, public demo deployment.

Open questions for that session: the npm package name, and where the public demo is
hosted.

## What the build takes from the sample pages

Rounds 8 to 13 run on one sample engine, `prototypes/v3/` (`core.js`, `scene.js`, the
people code cut out of `prototypes/office-workers.html`, one `*.tpl` per page). It is
the reference for behaviour and look, not code to ship: everything lives in one function
scope and the pages reach into engine internals. What each page settles:

- Camera (round 9): `Office.cam`, soft mode. Scale and position ease together and land
  on a whole-number scale; no wheel zoom.
- Guests and events (round 11, `events.tpl`): guests come and go through the lift and
  hold what they carry at the waist (`carry` in the people code); `Office.send` and
  `Office.back` walk an agent away from a desk and home; the drill gathers at a window,
  leaves through it and returns by lift in about 25 s; the party is a dance; the pizza
  goes on the three cafe tables and is eaten slice by slice. Triggers: the real signals
  named on the page (three tool errors in a minute, a lost connection, the hundredth
  task, Friday 13:00, 19:00), plus a rare timer in the public demo.
- Games (round 12, `games.tpl`): the cabinet and the `start(api)` contract. The 15 v2
  modules and the three games inside v2 `app.js` each build their own overlay today and
  have to be moved onto that contract.
- Sims mode (round 13, `sims.tpl`): select, order, queue; busy agents refuse; no needs.
