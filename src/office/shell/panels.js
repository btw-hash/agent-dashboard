// The panels a button in the bar opens (Team, Games, Sims, Events) share three manners:
// one is open at a time, Escape closes it, and each carries a close button of its own.
export const CLOSE = '<button class="pclose" aria-label="Close">&times;</button>';

// close() must leave the panel shut and may be called when it already is. The function
// returned is for the panel to call when it opens: every other panel then closes.
export function panel(office, name, el, close) {
  office.on('panel', (who) => {
    if (who !== name) close();
  });
  el.addEventListener('click', (e) => {
    if (e.target.closest('.pclose')) close();
  });
  return () => office.emit('panel', name);
}
