// Bundles the product's game modules into self-contained sample pages.
//   games-rework.html  round 14: three reworked games in a stand-alone copy of the cabinet
//   games-all.html     round 15: all 18 games in the product's own cabinet
// Run: node prototypes/v3/rework/build.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const here = new URL('.', import.meta.url);
const read = (f) => fs.readFileSync(new URL(f, here), 'utf8');
const css = read('../../../src/office/games/cabinet.css');
const PAGES = [
  // the product's cabinet styles, minus the full-screen veil the page does not use
  ['entry.js', 'page.tpl', 'games-rework.html', css.split('.cabkeys')[0]],
  ['all.entry.js', 'all.tpl', 'games-all.html', css],
];
for (const [entry, tpl, out, cab] of PAGES) {
  const res = await build({
    configFile: false,
    logLevel: 'warn',
    build: {
      write: false,
      minify: true,
      lib: { entry: fileURLToPath(new URL(entry, here)), formats: ['iife'], name: 'Rework' },
    },
  });
  const js = (Array.isArray(res) ? res[0] : res).output.find((o) => o.type === 'chunk').code;
  const page = read(tpl)
    .replace('/*CABINET*/', () => cab)
    .replace('/*JS*/', () => js.replace(/<\/script/g, '<\\/script'));
  fs.writeFileSync(new URL('../../' + out, here), page);
  console.log(out, (page.length / 1024).toFixed(0), 'KB');
}
