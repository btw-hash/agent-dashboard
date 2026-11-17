# Agent Office (repo: agent-dashboard)

Pixel-art office that shows running AI agents as people. Node HTTP + WebSocket server,
Canvas 2D client bundled by Vite. The client is v3 (built 2026-11-17); the look and every
behaviour were approved by the owner as sample pages first: read
[docs/specs/v3-redesign.md](docs/specs/v3-redesign.md) for the decisions. The journal of the
design rounds (what was shown, what the owner said, what is still open) is kept outside
this repository, in the owner's notes.

## Run

```bash
npm run build        # client -> dist/ (the server serves only dist/)
npm start            # server on http://localhost:3737
npm run dev          # server + Vite dev server
npm test             # vitest (server: office state, transcripts, HTTP API)
npm run test:e2e     # playwright smoke test of the built page on :3737 (set OFFICE_CHROME to an
                     # installed chrome.exe if this Playwright version has no browser of its own)
node demo.js         # scripted demo agents
```

`autostart.ps1` (Claude Code SessionStart hook) starts `server.js` if :3737 is down. After
editing server code, stop the process on :3737 and start it again; it does not reload.

## Server (current)

- [server.js](server.js) — wiring only.
- [src/server/office.js](src/server/office.js) — state. Nothing about the watched work
  leaves it: opaque ids, no cwd, no project names, no message text.
- [src/server/transcripts.js](src/server/transcripts.js) — tails `~/.claude/projects`.
- [src/server/http.js](src/server/http.js) — `GET /api/state`, `GET /api/health`,
  `POST /api/event {agent, state, note}`, `POST /api/demo` (legacy local bots).
- Env: `PORT`, `HOST` (default `127.0.0.1`), `OFFICE_TOKEN` (required for writes that do
  not come from this machine), `OFFICE_FILLERS`, `LOG_LEVEL`.

Nox and its sibling bots post to `/api/demo` from localhost. Keep that payload working.

## Client (`src/office/`)

- [main.js](src/office/main.js) wires everything; [office.js](src/office/office.js) is the
  scene: render loop, light map, pointer, and the hooks features draw through (`extra`,
  `glow`, `onLight`, `onFrame`, `on(type, fn)`).
- `engine/` pixel helpers and the camera (whole-number scale, soft moves, no wheel zoom).
- `art/` people, furniture, pets: rectangles assembled in code, then an ink outline pass.
- `world/plan.js` floor plan, lanes, spots; `world/crowd.js` turns server agents into people
  (seats, breaks, the lift, visitors); `world/furnish.js` places the furniture.
- `shell/` Stage panels, agent card, TV mode, connect sheet. `net.js` talks to the server
  over `/ws`; with no server, or with `?sim`, `sim.js` makes agents up (the public demo).
- `games/cabinet.js` is the one frame for the 18 games in `games/play/` (contract in its
  header). `sims.js`, `events.js`, `bonus/`, `details/` are features on top of the hooks.
- `?debug` exposes `window.__office`. Headless checks: `prototypes/v3/checks/product-*.mjs`.

Traps: a person's look is cached by `id`, so a changed look needs its own id (`p.wear`);
agents come and go at any moment, so features never keep indexes into `office.P`; click
handlers registered with `on('pick', fn, true)` go to the front, so install order in
`main.js` decides who sees a click first. The v2 single-file client is the tag `v2-classic`.

## Conventions

- Branch `feat/...`, `fix/...`; Conventional Commits; land through a PR, never push to master.
- No deploy exists. The Fly machine and the Railway setup are gone.
- [prototypes/](prototypes/) holds the design-round pages the look was approved on and the
  headless checks; they are not part of the build.

## Links

- Repo: github.com/btw-hash/agent-dashboard
- Vault: `c:/AI/vault/projects/Agent Dashboard.md`
