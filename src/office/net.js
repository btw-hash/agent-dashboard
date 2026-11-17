import { createSim } from './sim.js';

// Live when a server answers on this origin; otherwise the office runs on simulated agents,
// which is what the public demo is.
export async function connect(office) {
  const { crowd } = office;
  let live = false;
  const forced = new URLSearchParams(location.search).has('sim');
  try {
    if (forced) throw new Error('simulated on request');
    const r = await fetch('/api/health', { cache: 'no-store' });
    live = r.ok && (await r.json()).status === 'ok';
  } catch {
    live = false;
  }
  if (!live) {
    const sim = createSim(office);
    sim.start();
    office.emit('net', 'sim');
    return { mode: 'sim', report: sim.report };
  }

  let retry = 0,
    up = false;
  function open() {
    const ws = new WebSocket(
      (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws'
    );
    ws.onopen = () => {
      retry = 0;
      if (!up) office.emit('net', 'up');
      up = true;
    };
    ws.onmessage = (e) => {
      let m;
      try {
        m = JSON.parse(e.data);
      } catch {
        return;
      }
      if (m.type === 'init') {
        crowd.clear();
        m.agents.forEach((a) => crowd.add(a, true));
        office.emit('net', 'init');
      } else if (m.type === 'agent_update') crowd.update(m.agent);
      else if (m.type === 'agent_remove') crowd.remove(m.id);
    };
    ws.onclose = () => {
      if (up) office.emit('net', 'down');
      up = false;
      setTimeout(open, Math.min(15000, 1000 * 2 ** retry++));
    };
  }
  open();
  return {
    mode: 'live',
    async report(agent, state) {
      const r = await fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent, state }),
      });
      return r.ok;
    },
  };
}
