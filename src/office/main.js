import './office.css';
import { createOffice } from './office.js';
import { connect } from './net.js';
import { createShell } from './shell/shell.js';
import { installGames } from './games/cabinet.js';
import { createStats } from './details/stats.js';
import { installScene } from './details/scene.js';
import { installUi } from './details/ui.js';
import { installClassic } from './details/classic.js';
import { installSims } from './sims.js';
import { installBonus } from './bonus/index.js';
import { installEvents } from './events.js';

const $ = (s) => document.querySelector(s);
const office = createOffice({ stage: $('#stage'), cv: $('#cv'), tagsEl: $('#tags') });
office.start();

// the shell is up before the network answers, so the first agents already land in the list
const net = { mode: 'pending', report: async () => false };
const shell = createShell(office, net);
// click handlers go to the front of the line as they register, so the order matters:
// Sims mode sees a click first, then the cabinet, then the doors to the bonus views
const features = { bonus: installBonus(office, shell) };
features.games = installGames(office);
features.sims = installSims(office, shell);
features.events = installEvents(office, shell);
features.classic = installClassic(office);
const stats = createStats(office);
installScene(office, shell, stats);
installUi(office, shell, stats, features);
connect(office).then((link) => Object.assign(net, link));

if (new URLSearchParams(location.search).has('debug'))
  window.__office = { office, shell, net, stats, ...features };
