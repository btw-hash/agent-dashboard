import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRequire } from 'node:module';
import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { readEntry, isSubagentFile } = require('../../src/server/transcripts.js');
const { createHandler, isLocal, mayWrite, sameOrigin } = require('../../src/server/http.js');
const { createOffice } = require('../../src/server/office.js');

const fakeReq = (remoteAddress, headers = {}) => ({ socket: { remoteAddress }, headers });

describe('readEntry', () => {
  it('reads a tool call', () => {
    const line = JSON.stringify({
      type: 'assistant',
      sessionId: 's1',
      timestamp: '2026-11-17T10:00:00Z',
      message: {
        content: [
          { type: 'text', text: 'private' },
          { type: 'tool_use', name: 'Edit', input: { file_path: 'C:/secret' } },
        ],
      },
    });
    expect(readEntry(line)).toEqual({
      sessionId: 's1',
      at: Date.parse('2026-11-17T10:00:00Z'),
      event: 'tool',
      tool: 'Edit',
    });
  });

  it('reads text and user turns without keeping their content', () => {
    const text = readEntry(
      JSON.stringify({
        type: 'assistant',
        sessionId: 's1',
        message: { content: [{ type: 'text', text: 'private' }] },
      })
    );
    expect(text).toEqual({ sessionId: 's1', at: null, event: 'text' });
    const user = readEntry(
      JSON.stringify({ type: 'user', sessionId: 's1', message: { content: 'private prompt' } })
    );
    expect(user.event).toBe('user');
    expect(JSON.stringify([text, user])).not.toContain('private');
  });

  it('tells the end of a reply and a failed tool call apart from ordinary turns', () => {
    const done = readEntry(
      JSON.stringify({
        type: 'assistant',
        sessionId: 's1',
        message: { stop_reason: 'end_turn', content: [{ type: 'text', text: 'private' }] },
      })
    );
    expect(done.event).toBe('done');
    const failed = readEntry(
      JSON.stringify({
        type: 'user',
        sessionId: 's1',
        message: { content: [{ type: 'tool_result', is_error: true, content: 'private path' }] },
      })
    );
    expect(failed.event).toBe('error');
    const fine = readEntry(
      JSON.stringify({
        type: 'user',
        sessionId: 's1',
        message: { content: [{ type: 'tool_result', content: 'ok' }] },
      })
    );
    expect(fine.event).toBe('user');
    expect(JSON.stringify([done, failed])).not.toContain('private');
  });

  it('ignores meta records and broken lines', () => {
    expect(
      readEntry(JSON.stringify({ type: 'ai-title', aiTitle: 'x', sessionId: 's1' }))
    ).toBeNull();
    expect(readEntry(JSON.stringify({ type: 'queue-operation' }))).toBeNull();
    expect(readEntry('{not json')).toBeNull();
  });

  it('recognises sub-agent transcripts by their path', () => {
    expect(isSubagentFile('/p/proj/sid/subagents/agent-abc.jsonl')).toBe(true);
    expect(isSubagentFile('/p/proj/sid.jsonl')).toBe(false);
  });
});

describe('who may write', () => {
  it('lets this machine in without a token', () => {
    expect(mayWrite(fakeReq('127.0.0.1'), '')).toBe(true);
    expect(mayWrite(fakeReq('::1'), 'secret')).toBe(true);
  });

  it('treats a proxied request as remote', () => {
    const viaTunnel = fakeReq('127.0.0.1', { 'cf-connecting-ip': '203.0.113.9' });
    expect(isLocal(viaTunnel)).toBe(false);
    expect(mayWrite(viaTunnel, '')).toBe(false);
    expect(mayWrite(viaTunnel, 'secret')).toBe(false);
  });

  it('asks everyone else for the token', () => {
    expect(mayWrite(fakeReq('192.168.1.20'), '')).toBe(false);
    expect(mayWrite(fakeReq('192.168.1.20', { authorization: 'Bearer wrong' }), 'secret')).toBe(
      false
    );
    expect(mayWrite(fakeReq('192.168.1.20', { authorization: 'Bearer secret' }), 'secret')).toBe(
      true
    );
    expect(mayWrite(fakeReq('192.168.1.20', { 'x-admin-token': 'secret' }), 'secret')).toBe(true);
  });

  it('only lets the page itself open the live feed', () => {
    expect(sameOrigin({ headers: { host: 'localhost:3737' } })).toBe(true);
    expect(
      sameOrigin({ headers: { host: 'localhost:3737', origin: 'http://localhost:3737' } })
    ).toBe(true);
    expect(
      sameOrigin({ headers: { host: 'localhost:3737', origin: 'https://evil.example' } })
    ).toBe(false);
  });
});

describe('http api', () => {
  let server;
  let base;
  let office;
  const staticDir = fs.mkdtempSync(path.join(os.tmpdir(), 'office-'));

  beforeAll(async () => {
    fs.writeFileSync(path.join(staticDir, 'index.html'), '<h1>office</h1>');
    office = createOffice({ fillers: 0 });
    server = http.createServer(
      createHandler({
        office,
        staticDir,
        token: 'secret',
        version: 'test',
      })
    );
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  afterAll(async () => {
    await new Promise((r) => server.close(r));
    fs.rmSync(staticDir, { recursive: true, force: true });
  });

  const post = (url, body, headers = {}) =>
    fetch(base + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });

  it('takes an event and shows it in the state', async () => {
    const res = await post('/api/event', { agent: 'my-bot', state: 'working', note: 'crunching' });
    expect(res.status).toBe(200);
    const state = await (await fetch(base + '/api/state')).json();
    expect(state.agents).toHaveLength(1);
    expect(state.agents[0]).toMatchObject({ slug: 'my-bot', status: 'working' });
    expect(state.tasks).toBeUndefined();
  });

  it('explains a bad event', async () => {
    const res = await post('/api/event', { agent: 'my-bot', state: 'flying' });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/state/);
  });

  it('still accepts the payload older local bots send', async () => {
    const res = await post('/api/demo', {
      id: 'flabber',
      slug: 'flabber',
      status: 'working',
      currentTool: 'Bash',
      currentToolLabel: 'Flabber: Bash',
    });
    expect(res.status).toBe(200);
    expect(office.list().find((a) => a.id === 'flabber')).toMatchObject({
      status: 'working',
      currentToolLabel: 'Flabber: Bash',
    });
    const del = await fetch(base + '/api/demo/flabber', { method: 'DELETE' });
    expect(del.status).toBe(200);
    expect(office.list().find((a) => a.id === 'flabber')).toBeUndefined();
  });

  it('refuses a write that came through a proxy without the token', async () => {
    const res = await post(
      '/api/event',
      { agent: 'intruder', state: 'working' },
      { 'X-Forwarded-For': '203.0.113.9' }
    );
    expect(res.status).toBe(401);
    const ok = await post(
      '/api/event',
      { agent: 'guest', state: 'idle' },
      { 'X-Forwarded-For': '203.0.113.9', Authorization: 'Bearer secret' }
    );
    expect(ok.status).toBe(200);
  });

  it('serves the page and blocks path traversal', async () => {
    expect(await (await fetch(base + '/')).text()).toContain('office');
    const res = await fetch(base + '/..%2f..%2fpackage.json');
    expect([403, 404]).toContain(res.status);
  });

  it('answers the health check without CORS headers', async () => {
    const res = await fetch(base + '/api/health');
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
    expect(await res.json()).toMatchObject({ status: 'ok', version: 'test' });
  });
});
