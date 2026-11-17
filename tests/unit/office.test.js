import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createOffice, publicTool, opaqueId, cleanText } = require('../../src/server/office.js');

function makeOffice(opts = {}) {
  const clock = { t: Date.parse('2026-11-17T10:00:00Z') };
  const events = [];
  const office = createOffice({
    fillers: 0,
    now: () => clock.t,
    onChange: (e) => events.push(e),
    ...opts,
  });
  return { office, clock, events };
}

describe('transcript sessions', () => {
  it('never exposes the session id, a path or a project name', () => {
    const { office, clock } = makeOffice();
    const key = 'C:/AI/secret-client-project/1b2c3d4e-session';
    office.session({ key, at: clock.t, event: 'tool', tool: 'Edit' });
    const text = JSON.stringify(office.list());
    expect(text).not.toContain('secret-client-project');
    expect(text).not.toContain('1b2c3d4e');
    expect(office.list()[0].id).toBe(opaqueId(key));
    expect(office.list()[0].slug).toBe('agent');
  });

  it('shows a tool call as working and plain text as thinking', () => {
    const { office, clock } = makeOffice();
    office.session({ key: 's1', at: clock.t, event: 'tool', tool: 'Bash' });
    expect(office.list()[0]).toMatchObject({
      status: 'working',
      currentTool: 'Bash',
      currentToolLabel: 'Runs a command',
    });
    office.session({ key: 's1', at: clock.t + 1000, event: 'text' });
    expect(office.list()[0]).toMatchObject({
      status: 'thinking',
      currentTool: null,
      messageCount: 2,
    });
  });

  it('hides custom and MCP tool names', () => {
    expect(publicTool('mcp__bank__transfer')).toBe('Tool');
    expect(publicTool('Read')).toBe('Read');
    const { office, clock } = makeOffice();
    office.session({ key: 's1', at: clock.t, event: 'tool', tool: 'mcp__bank__transfer' });
    expect(JSON.stringify(office.list())).not.toContain('bank');
  });

  it('keeps a quiet session seated, then lets it leave after 15 minutes', () => {
    const { office, clock, events } = makeOffice();
    office.session({ key: 's1', at: clock.t, event: 'tool', tool: 'Read' });
    clock.t += 5 * 60_000;
    office.prune();
    expect(office.list()[0].status).toBe('working');
    clock.t += 10 * 60_000;
    office.prune();
    expect(office.size()).toBe(0);
    expect(events.at(-1)).toEqual({ type: 'agent_remove', id: opaqueId('s1') });
  });

  it('labels a sub-agent with its type only', () => {
    const { office, clock } = makeOffice();
    office.session({
      key: 'agent-77',
      isSubagent: true,
      agentType: 'reviewer',
      at: clock.t,
      event: 'user',
    });
    expect(office.list()[0]).toMatchObject({
      slug: 'reviewer',
      agentType: 'reviewer',
      isSubagent: true,
    });
  });

  it('points a sub-agent at its lead without exposing the session id', () => {
    const { office, clock } = makeOffice();
    office.session({ key: 'session-secret', at: clock.t, event: 'user' });
    office.session({
      key: 'agent-77',
      parentKey: 'session-secret',
      isSubagent: true,
      at: clock.t,
      event: 'user',
    });
    const [lead, sub] = office.list();
    expect(sub.parent).toBe(lead.id);
    expect(JSON.stringify(office.list())).not.toContain('session-secret');
  });

  it('marks the end of a reply and a failed tool call as one-off events', () => {
    const { office, clock } = makeOffice();
    office.session({ key: 's1', at: clock.t, event: 'tool', tool: 'Bash' });
    const failed = office.session({ key: 's1', at: clock.t + 1000, event: 'error' });
    expect(failed).toMatchObject({ status: 'thinking', currentTool: null });
    expect(failed.lastEvent.type).toBe('error');
    const done = office.session({ key: 's1', at: clock.t + 2000, event: 'done' });
    expect(done.lastEvent).toEqual({ type: 'done', at: new Date(clock.t + 2000).toISOString() });
  });

  it('keeps only the 20 most recent sessions', () => {
    const { office, clock } = makeOffice();
    for (let i = 0; i < 25; i++) office.session({ key: `s${i}`, at: clock.t + i, event: 'text' });
    clock.t += 100;
    office.prune();
    expect(office.size()).toBe(20);
    expect(office.list().some((a) => a.id === opaqueId('s0'))).toBe(false);
  });
});

describe('reported agents', () => {
  it('accepts a bot that says it works and remembers its note', () => {
    const { office } = makeOffice();
    const result = office.report({ agent: 'my-bot', state: 'working', note: 'crunching numbers' });
    expect(result.ok).toBe(true);
    expect(office.list()[0]).toMatchObject({
      id: 'my-bot',
      slug: 'my-bot',
      source: 'reported',
      status: 'working',
      currentToolLabel: 'crunching numbers',
    });
  });

  it('turns done and error into an idle agent with a one-off event', () => {
    const { office } = makeOffice();
    office.report({ agent: 'bot', state: 'working' });
    office.report({ agent: 'bot', state: 'done' });
    expect(office.list()[0]).toMatchObject({ status: 'idle', lastEvent: { type: 'done' } });
    office.report({ agent: 'bot', state: 'error' });
    expect(office.list()[0].lastEvent.type).toBe('error');
  });

  it('rejects a missing name and an unknown state', () => {
    const { office } = makeOffice();
    expect(office.report({ state: 'working' }).ok).toBe(false);
    expect(office.report({ agent: 'bot', state: 'dancing' }).ok).toBe(false);
    expect(office.report().ok).toBe(false);
    expect(office.size()).toBe(0);
  });

  it('strips markup and control characters and caps the length', () => {
    expect(cleanText('<img src=x onerror=1>\u0007hi', 40)).toBe('img src=x onerror=1 hi');
    const { office } = makeOffice();
    office.report({ agent: 'x'.repeat(200), state: 'idle', note: 'n'.repeat(200) });
    expect(office.list()[0].slug).toHaveLength(40);
    expect(office.list()[0].note).toHaveLength(60);
  });

  it('removes a bot that has been silent for 15 minutes', () => {
    const { office, clock } = makeOffice();
    office.report({ agent: 'bot', state: 'idle' });
    clock.t += 15 * 60_000 + 1;
    office.prune();
    expect(office.size()).toBe(0);
  });

  it('keeps the id a legacy local bot sends', () => {
    const { office } = makeOffice();
    office.report({ id: 'flabber', agent: 'flabber', state: 'working', tool: 'Bash' });
    expect(office.list()[0]).toMatchObject({ id: 'flabber', currentTool: 'Bash' });
    expect(office.remove('flabber')).toBe(true);
  });
});

describe('fillers', () => {
  it('tops the office up and makes room when real agents arrive', () => {
    const { office, clock } = makeOffice({ fillers: 3 });
    office.prune();
    expect(office.list().map((a) => a.source)).toEqual(['filler', 'filler', 'filler']);
    office.session({ key: 's1', at: clock.t, event: 'text' });
    office.report({ agent: 'bot', state: 'idle' });
    office.prune();
    const sources = office
      .list()
      .map((a) => a.source)
      .sort();
    expect(sources).toEqual(['claude', 'filler', 'reported']);
  });
});
