// Sounds for the games: short synthesised blips, no files. Nothing plays until the cabinet
// unlocks the audio from a press (browsers start audio only then), and nothing plays while
// the player has the sound switched off. The switch is remembered.
const KEY = 'agent_office_games_mute';
let ac = null,
  out = null,
  muted = false,
  lastBad = -1;
const last = {};
try {
  muted = localStorage.getItem(KEY) === '1';
} catch {
  // a private window: the switch lives for this visit only
}

function tone(f, at, dur, type, vol, to) {
  const t = ac.currentTime + at,
    o = ac.createOscillator(),
    g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.02);
}
let grain = null;
function hiss(dur, vol, freq) {
  if (!grain) {
    grain = ac.createBuffer(1, ac.sampleRate / 4, ac.sampleRate);
    const d = grain.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ac.currentTime,
    s = ac.createBufferSource(),
    f = ac.createBiquadFilter(),
    g = ac.createGain();
  s.buffer = grain;
  f.type = 'bandpass';
  f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(out);
  s.start(t, Math.random() * 0.1, dur + 0.02);
}
const run = (notes, type, vol, step, len) =>
  notes.forEach((f, i) => tone(f, i * step, i === notes.length - 1 ? len * 2 : len, type, vol));
const SOUNDS = {
  click: () => tone(520, 0, 0.03, 'square', 0.1),
  start: () => run([392, 523, 784], 'square', 0.3, 0.07, 0.08),
  good: () => run([660, 990], 'triangle', 0.5, 0.06, 0.07),
  bad: () => tone(160, 0, 0.18, 'sawtooth', 0.3, 70),
  over: () => run([392, 330, 262], 'square', 0.3, 0.14, 0.12),
  record: () => run([523, 659, 784, 1047], 'square', 0.3, 0.09, 0.1),
  kick: () => tone(120, 0, 0.09, 'sine', 0.7, 45),
  hat: () => hiss(0.03, 0.1, 7000),
  scratch: () => hiss(0.16, 0.45, 1200),
  note(f, vol = 0.45) {
    tone(f, 0, 0.24, 'triangle', vol);
    tone(f * 2, 0, 0.1, 'square', vol * 0.2);
  },
};

export const sound = {
  get on() {
    return !muted;
  },
  set(on) {
    muted = !on;
    try {
      localStorage.setItem(KEY, muted ? '1' : '0');
    } catch {
      // see above
    }
  },
  unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ac) {
      ac = new AC();
      out = ac.createGain();
      out.gain.value = 0.25;
      out.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
  },
  // a failure drowns the cheer that a game may fire in the same moment, and one sound does
  // not stack on itself within a frame or two
  play(name, ...args) {
    if (muted || !ac) return;
    const now = ac.currentTime;
    if (name === 'good' && now - lastBad < 0.12) return;
    if (name !== 'note' && now - (last[name] ?? -1) < 0.04) return;
    last[name] = now;
    if (name === 'bad') lastBad = now;
    SOUNDS[name](...args);
  },
};
