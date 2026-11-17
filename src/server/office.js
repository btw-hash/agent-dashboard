const crypto = require('crypto');

const GAP_MS = 20_000;
const SESSION_DEAD_MS = 15 * 60_000;
const REPORTED_IDLE_MS = 15 * 60_000;
const MAX_SESSIONS = 20;
const STATES = new Set(['working', 'thinking', 'idle', 'done', 'error']);

const TOOL_LABELS = {
  Bash: 'Runs a command',
  PowerShell: 'Runs a command',
  Read: 'Reads a file',
  Write: 'Writes a file',
  Edit: 'Edits a file',
  NotebookEdit: 'Edits a notebook',
  Grep: 'Searches the code',
  Glob: 'Looks for files',
  WebFetch: 'Opens a page',
  WebSearch: 'Searches the web',
  Agent: 'Briefs a sub-agent',
  Task: 'Briefs a sub-agent',
  TodoWrite: 'Updates the plan',
  Skill: 'Uses a skill',
};

const FILLER_TYPES = [
  'developer',
  'qa-engineer',
  'debugger',
  'architect',
  'reviewer',
  'devops-automator',
  'security-engineer',
  'performance-engineer',
  'technical-writer',
  'ux-designer',
];

// Custom and MCP tool names can name private integrations, so only the built-in ones pass through.
function publicTool(name) {
  if (!name) return null;
  return TOOL_LABELS[name] ? name : 'Tool';
}

function toolLabel(tool) {
  if (!tool) return null;
  return TOOL_LABELS[tool] || 'Uses a tool';
}

function opaqueId(key) {
  return 'a' + crypto.createHash('sha1').update(String(key)).digest('hex').slice(0, 12);
}

function cleanText(value, max) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001f\u007f<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function createOffice({ fillers = 10, now = () => Date.now(), onChange = () => {} } = {}) {
  const agents = new Map();
  const iso = (ms) => new Date(ms).toISOString();

  function changed(agent) {
    onChange({ type: 'agent_update', agent: { ...agent } });
  }

  function remove(id) {
    if (!agents.delete(id)) return false;
    onChange({ type: 'agent_remove', id });
    return true;
  }

  function blank(id, slug, source, at) {
    return {
      id,
      slug,
      source,
      version: source,
      status: 'idle',
      currentTool: null,
      currentToolLabel: null,
      note: null,
      lastEvent: null,
      lastActivity: iso(at),
      startedAt: iso(at),
      messageCount: 0,
      toolHistory: [],
      isSubagent: false,
      agentType: null,
      parent: null,
    };
  }

  function setTool(agent, tool, at) {
    agent.status = 'working';
    agent.currentTool = tool;
    agent.currentToolLabel = toolLabel(tool);
    agent.toolHistory.unshift({ tool, time: iso(at) });
    if (agent.toolHistory.length > 5) agent.toolHistory.pop();
  }

  function clearTool(agent, status) {
    agent.status = status;
    agent.currentTool = null;
    agent.currentToolLabel = null;
  }

  // One line of a Claude Code transcript. `key` identifies the session and never leaves this module.
  function session({
    key,
    parentKey = null,
    isSubagent = false,
    agentType = null,
    at,
    event,
    tool,
  }) {
    const when = Number.isFinite(at) ? at : now();
    const id = opaqueId(key);
    let agent = agents.get(id);
    if (!agent) {
      const type = cleanText(agentType || '', 40) || null;
      agent = blank(id, type || 'agent', 'claude', when);
      agent.isSubagent = !!isSubagent;
      agent.agentType = type;
      agent.parent = isSubagent && parentKey ? opaqueId(parentKey) : null;
      agents.set(id, agent);
    }
    agent.lastActivity = iso(when);
    if (event === 'tool') {
      agent.messageCount++;
      setTool(agent, publicTool(tool), when);
    } else if (event === 'text') {
      agent.messageCount++;
      clearTool(agent, 'thinking');
    } else if (event === 'user') {
      clearTool(agent, 'thinking');
    } else if (event === 'done' || event === 'error') {
      // the end of a reply and a failed tool call: one-off moments the office can react to
      if (event === 'done') agent.messageCount++;
      clearTool(agent, 'thinking');
      agent.lastEvent = { type: event, at: iso(when) };
    }
    changed(agent);
    return agent;
  }

  // Anything that is not Claude Code: a bot, a script, a cron job.
  function report({ id, agent: name, state, note, tool } = {}) {
    const slug = cleanText(name, 40);
    if (!slug) return { ok: false, error: 'agent: a name of 1 to 40 characters is required' };
    if (!STATES.has(state)) {
      return { ok: false, error: `state: one of ${[...STATES].join(', ')}` };
    }
    const key = cleanText(id, 60) || slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const at = now();
    let agent = agents.get(key);
    if (!agent) {
      agent = blank(key, slug, 'reported', at);
      agents.set(key, agent);
    }
    agent.slug = slug;
    agent.lastActivity = iso(at);
    agent.note = cleanText(note, 60) || null;
    if (state === 'working') {
      setTool(agent, publicTool(cleanText(tool, 40)) || 'Tool', at);
      if (agent.note) agent.currentToolLabel = agent.note;
    } else if (state === 'thinking') {
      clearTool(agent, 'thinking');
    } else {
      clearTool(agent, 'idle');
      if (state !== 'idle') agent.lastEvent = { type: state, at: iso(at) };
    }
    changed(agent);
    return { ok: true, agent };
  }

  function fillerId(i) {
    return `filler-${String(i + 1).padStart(2, '0')}`;
  }

  function topUpFillers() {
    const at = now();
    const real = [...agents.values()].filter((a) => a.source !== 'filler').length;
    const needed = Math.max(0, fillers - real);
    for (let i = 0; i < needed; i++) {
      const id = fillerId(i);
      const existing = agents.get(id);
      if (existing) {
        existing.lastActivity = iso(at);
        continue;
      }
      const type = FILLER_TYPES[i % FILLER_TYPES.length];
      const agent = blank(id, type, 'filler', at);
      agent.agentType = type;
      agents.set(id, agent);
      changed(agent);
    }
    const present = [...agents.keys()].filter((id) => agents.get(id).source === 'filler').sort();
    for (const id of present.slice(needed)) remove(id);
  }

  function prune() {
    const at = now();
    for (const agent of [...agents.values()]) {
      if (agent.source === 'filler') continue;
      const age = at - new Date(agent.lastActivity).getTime();
      if (agent.source === 'reported') {
        if (age > REPORTED_IDLE_MS) remove(agent.id);
        continue;
      }
      // Claude Code writes nothing while it reasons between tool calls, so a quiet
      // transcript means "thinking" until the session has been silent for a long time.
      if (age >= SESSION_DEAD_MS) {
        remove(agent.id);
      } else if (age > GAP_MS && agent.status === 'idle') {
        clearTool(agent, 'thinking');
        changed(agent);
      }
    }
    const sessions = [...agents.values()]
      .filter((a) => a.source === 'claude')
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    for (const stale of sessions.slice(MAX_SESSIONS)) remove(stale.id);
    topUpFillers();
  }

  return {
    session,
    report,
    remove,
    prune,
    list: () => [...agents.values()].map((a) => ({ ...a })),
    size: () => agents.size,
  };
}

module.exports = { createOffice, publicTool, toolLabel, opaqueId, cleanText, STATES };
