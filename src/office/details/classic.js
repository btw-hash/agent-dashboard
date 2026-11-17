// A flashback: a flash, the v2 office for a couple of seconds, a flash back.
// The clip is a recording of the real v2 client (tag v2-classic): its whole page, office and
// panels, in a window tall enough to need no scrolling, so it is shown whole, never cropped.
const SHOW_MS = 2400,
  FLASH_MS = 160;

export function installClassic(office) {
  const app = document.querySelector('#app');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const view = document.createElement('div');
  view.className = 'classic';
  view.hidden = true;
  view.innerHTML =
    '<video muted playsinline preload="none" poster="/classic-poster.jpg"><source src="/classic.webm" type="video/webm"></video>' +
    '<b>CLASSIC &middot; V2</b>';
  const flash = document.createElement('div');
  flash.className = 'flash';
  app.append(view, flash);
  const video = view.querySelector('video');

  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.id = 'classicBtn';
  btn.textContent = 'Classic';
  btn.title = 'A look at the old office';
  btn.setAttribute('aria-pressed', 'false');
  document.querySelector('#tools').insertBefore(btn, document.querySelector('#tvBtn'));

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function pop() {
    if (still) return;
    flash.classList.add('on');
    await wait(FLASH_MS);
  }
  let busy = false;
  async function run() {
    if (busy) return false;
    busy = true;
    btn.setAttribute('aria-pressed', 'true');
    await pop();
    view.hidden = false;
    video.currentTime = 0;
    // a browser that cannot play the clip still shows the poster frame of it
    video.play().catch(() => {});
    flash.classList.remove('on');
    await wait(SHOW_MS);
    await pop();
    video.pause();
    view.hidden = true;
    flash.classList.remove('on');
    btn.setAttribute('aria-pressed', 'false');
    busy = false;
    return true;
  }
  btn.onclick = run;
  office.on('tv', (on) => on && !view.hidden && (view.hidden = true));
  return { run, busy: () => busy };
}
