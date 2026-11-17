const TOOLS = [
  ['Bash', 'Runs a command'],
  ['Read', 'Reads a file'],
  ['Edit', 'Edits a file'],
  ['Write', 'Writes a file'],
  ['Grep', 'Searches the code'],
  ['WebSearch', 'Searches the web'],
];

// Stands in for the server: makes up agents and moves them through the same states.
export function createSim(office) {
  const { crowd } = office;
  const agents = new Map();
  const iso = () => new Date().toISOString();
  const rnd = (a, b) => a + Math.random() * (b - a);

  function make(id, extra) {
    const a = {
      id,
      slug: 'agent',
      source: 'sim',
      status: 'idle',
      currentTool: null,
      currentToolLabel: null,
      note: null,
      lastEvent: null,
      lastActivity: iso(),
      isSubagent: false,
      ...extra,
    };
    agents.set(id, a);
    return a;
  }
  function set(a, state) {
    a.lastActivity = iso();
    a.lastEvent = null;
    if (state === 'working') {
      const t = TOOLS[(Math.random() * TOOLS.length) | 0];
      a.status = 'working';
      a.currentTool = t[0];
      a.currentToolLabel = t[1];
    } else {
      a.currentTool = null;
      a.currentToolLabel = null;
      a.status = state === 'thinking' ? 'thinking' : 'idle';
      if (state === 'done' || state === 'error') a.lastEvent = { type: state, at: iso() };
    }
    crowd.update({ ...a });
  }
  function live(a) {
    const next = () => {
      if (!agents.has(a.id)) return;
      const r = Math.random();
      if (a.status === 'working')
        set(a, r < 0.22 ? 'done' : r < 0.25 ? 'error' : r < 0.6 ? 'thinking' : 'working');
      else if (a.status === 'thinking') set(a, r < 0.8 ? 'working' : 'idle');
      else set(a, r < 0.45 ? 'working' : 'idle');
      // a finished or failed task goes straight back to work, as a real session does
      if (a.lastEvent) setTimeout(() => agents.has(a.id) && set(a, 'working'), 3200);
      setTimeout(next, a.status === 'idle' ? rnd(25000, 70000) : rnd(7000, 22000));
    };
    setTimeout(next, rnd(4000, 20000));
  }
  return {
    start() {
      for (let i = 0; i < 17; i++) {
        const a = make('sim-' + i, { status: i < 9 ? 'working' : i < 11 ? 'thinking' : 'idle' });
        if (a.status === 'working') {
          a.currentTool = TOOLS[i % TOOLS.length][0];
          a.currentToolLabel = TOOLS[i % TOOLS.length][1];
        }
        crowd.add({ ...a }, true);
        live(a);
      }
    },
    async report(name, state) {
      const id = 'me-' + name.toLowerCase();
      let a = agents.get(id);
      if (!a) {
        a = make(id, { slug: name, source: 'reported' });
        crowd.add({ ...a }, false);
      }
      set(a, state);
      return true;
    },
  };
}
