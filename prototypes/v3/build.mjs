// Joins the shared engine and inlines it into each sample page, so every page in
// prototypes/ stays one self-contained file. Run: node prototypes/v3/build.mjs
import fs from 'node:fs';

const here = new URL('.', import.meta.url);
const read = (f) => fs.readFileSync(new URL(f, here), 'utf8');

// People, furniture and pets are drawn once, in the round-7 page; cut them out by marker.
const src = read('../office-workers.html');
const cut = (from, to) => {
  const i = src.indexOf(from);
  const j = src.indexOf(to, i);
  if (i < 0 || j < 0) throw new Error(`marker not found: ${from}`);
  return src.slice(i, j);
};
const engine = [
  read('core.js'),
  cut('// ── people', '// ── furniture'),
  cut('function chairBack', 'const petCache'),
  cut('const petCache', '// ── cast and layout'),
  read('scene.js'),
].join('\n');

const pages = {
  'floor-plan.tpl': '../floor-plan.html',
  'shell.tpl': '../office-shell.html',
  'bonus.tpl': '../bonus-views.html',
  'events.tpl': '../office-events.html',
  'games.tpl': '../arcade-frame.html',
  'sims.tpl': '../sims-mode.html',
};
for (const [from, to] of Object.entries(pages)) {
  if (!fs.existsSync(new URL(from, here))) continue;
  const page = read(from);
  if (!page.includes('/*ENGINE*/')) throw new Error(`${from} has no /*ENGINE*/ slot`);
  fs.writeFileSync(
    new URL(to, here),
    page.replace('/*ENGINE*/', () => engine)
  );
  console.log(`${to.slice(3)}  ${(fs.statSync(new URL(to, here)).size / 1024).toFixed(0)} KB`);
}
