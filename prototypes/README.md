# Design prototypes

Standalone pages from the v3 redesign rounds, in the order they were shown. Each one is
a single HTML file with everything inline, written to be published as a preview, so it
has no `<html>` or `<body>` wrapper of its own. Open it in a browser as is.

What the owner said about each one is kept outside this repository, in the owner's notes.

| Round | File                      | What it shows                                                     | Verdict                           |
| ----- | ------------------------- | ----------------------------------------------------------------- | --------------------------------- |
| 1     | `shell-mock.html`         | New shell, lighting and camera over a real frame of the v2 office | Stage + TV mode kept              |
| 2     | `3d-diorama.html`         | First 3D room built in code                                       | "Not bad", pixel may matter more  |
| 3     | `3d-styles.html`          | Pixel render of the 3D scene, dark 3D, bright miniature           | Pixel render and dark 3D rejected |
| 4     | `pixel-rework.html`       | The office as true 2D pixel art                                   | "Not bad, needs edits"            |
| 4     | `3d-lab.html`             | 3D with jointed people, six cameras, shape sliders                | Three cameras kept                |
| 5     | `pixel-variants.html`     | Three pixel styles: Cozy, Daylight, Late shift                    | **Cozy chosen**                   |
| 5     | `3d-variants.html`        | Three 3D looks: Miniature, Clay, Cartoon                          | Wanted different ideas instead    |
| 6     | `people-and-visions.html` | Three character designs; Tower, Windows at night, Terminal, Shelf | **Office worker chosen**          |
| 7     | `office-workers.html`     | Office workers in the Cozy office, poses, status dots             | People approved                   |
| 8     | `floor-plan.html`         | The wide floor: hall on top, four rooms below, 18 game markers    | Approved, lounge is a casino      |
| 9     | `office-shell.html`       | Stage shell, TV mode, connect sheet, soft camera without a wheel  | Approved, soft camera             |
| 10    | `bonus-views.html`        | Terminal, Windows at night, 3D miniature                          | Approved                          |
| 11    | `office-events.html`      | Guests through the lift and office-wide events                    | Edits made, last look pending     |
| 12    | `arcade-frame.html`       | One cabinet for the 18 games, three of them playable              | **Approved as shown**             |
| 13    | `sims-mode.html`          | Sims mode: pick someone on a break and send them somewhere        | **Approved**, free people roam    |

Rounds 8 to 13 are built from `v3/` (`node prototypes/v3/build.mjs`); edit the templates
there, not the generated pages.

The 3D pages load three.js r147 from jsDelivr and need a network connection.
