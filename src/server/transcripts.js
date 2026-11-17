const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const log = require('./logger');

const SCAN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Turns one transcript line into what the office needs to know, or null.
// The Agent SDK also writes meta-only records (ai-title, queue-operation, ...);
// treating those as activity fills the office with ghosts.
function readEntry(line) {
  let entry;
  try {
    entry = JSON.parse(line);
  } catch {
    return null;
  }
  const { type, message, sessionId, timestamp } = entry;
  if (type !== 'assistant' && type !== 'user' && type !== 'summary') return null;
  const at = timestamp ? Date.parse(timestamp) : NaN;
  const base = { sessionId: sessionId || null, at: Number.isFinite(at) ? at : null };
  if (type === 'assistant' && message) {
    const content = Array.isArray(message.content) ? message.content : [];
    const toolUse = content.find((c) => c && c.type === 'tool_use');
    if (toolUse) return { ...base, event: 'tool', tool: toolUse.name };
    if (content.some((c) => c && c.type === 'text'))
      return { ...base, event: message.stop_reason === 'end_turn' ? 'done' : 'text' };
    return { ...base, event: 'seen' };
  }
  if (type === 'user' && message) {
    const content = Array.isArray(message.content) ? message.content : [];
    const failed = content.some((c) => c && c.type === 'tool_result' && c.is_error === true);
    return { ...base, event: failed ? 'error' : 'user' };
  }
  return { ...base, event: 'seen' };
}

function isSubagentFile(filePath) {
  return filePath.includes('subagents') && path.basename(filePath).startsWith('agent-');
}

function subagentType(filePath) {
  try {
    const meta = JSON.parse(fs.readFileSync(filePath.replace(/\.jsonl$/, '.meta.json'), 'utf8'));
    return typeof meta.agentType === 'string' ? meta.agentType : null;
  } catch {
    return null;
  }
}

function collect(dir, results = [], depth = 0) {
  if (depth > 4) return results;
  const cutoff = Date.now() - SCAN_MAX_AGE_MS;
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    try {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) collect(full, results, depth + 1);
      else if (entry.endsWith('.jsonl') && stat.mtimeMs >= cutoff)
        results.push({ full, mtime: stat.mtimeMs });
    } catch (e) {
      log.debug('stat error', e.message);
    }
  }
  return results;
}

function watchTranscripts(dir, office) {
  const positions = new Map();

  function readNew(filePath) {
    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch {
      return;
    }
    const from = positions.get(filePath) || 0;
    if (stat.size <= from) return;
    const buf = Buffer.alloc(stat.size - from);
    const fd = fs.openSync(filePath, 'r');
    try {
      fs.readSync(fd, buf, 0, buf.length, from);
    } finally {
      fs.closeSync(fd);
    }
    const isSubagent = isSubagentFile(filePath);
    const fileKey = path.basename(filePath, '.jsonl');
    const agentType = isSubagent ? subagentType(filePath) : null;
    for (const line of buf.toString('utf8').split('\n')) {
      if (!line) continue;
      const seen = readEntry(line);
      if (!seen) continue;
      office.session({
        key: isSubagent ? fileKey : seen.sessionId || fileKey,
        parentKey: isSubagent ? seen.sessionId : null,
        isSubagent,
        agentType,
        at: seen.at,
        event: seen.event,
        tool: seen.tool,
      });
    }
    positions.set(filePath, stat.size);
  }

  if (!fs.existsSync(dir)) {
    log.info('No Claude Code transcripts found; the office shows reported agents only');
    return { files: 0, close: async () => {} };
  }

  const existing = collect(dir).sort((a, b) => a.mtime - b.mtime);
  for (const file of existing) readNew(file.full);

  const watcher = chokidar
    .watch(path.join(dir, '**', '*.jsonl'), {
      ignoreInitial: true,
      usePolling: true,
      interval: 500,
      awaitWriteFinish: { stabilityThreshold: 100 },
    })
    .on('change', readNew)
    .on('add', readNew)
    .on('unlink', (filePath) => positions.delete(filePath));

  return { files: existing.length, close: () => watcher.close() };
}

module.exports = { readEntry, isSubagentFile, watchTranscripts };
