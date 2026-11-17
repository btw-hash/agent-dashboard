# Headless checks for the sample pages

Scripts that drive the built pages in `prototypes/` with Playwright and print a JSON
report. They are how rounds 11 to 13 were checked on 2026-11-17. They are not part of
`npm test`.

```bash
node prototypes/v3/build.mjs
node prototypes/v3/checks/sims.mjs <repo> <outDir> <chrome.exe>
```

`<repo>` is this repository, `<outDir>` a folder for screenshots, `<chrome.exe>` a
Chromium that Playwright already downloaded (the repo's own Playwright version may have
none; look in `%LOCALAPPDATA%\ms-playwright`).

| Script                | What it does                                                               |
| --------------------- | -------------------------------------------------------------------------- |
| `events-all.mjs`      | Runs all six events to their end and switches the holidays                 |
| `events-closeups.mjs` | Close-ups of what guests carry, the dance, the fire drill phase by phase   |
| `pizza.mjs`           | Follows the boxes on the cafe tables slice by slice                        |
| `games.mjs`           | Plays the three games in the cabinet to "game over", desktop and phone     |
| `sims.mjs`            | Sims mode: pick, order, queue, a busy agent; then two frames of the events |

A page is served from a made-up origin so that `localStorage` works. Scripts that read
the scene hang the engine's own objects on `window.__t` in the copy they load; the
published pages do not expose anything.
