const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const log = require('./logger');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const FORWARDED = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip', 'forwarded'];

// A tunnel or reverse proxy makes every visitor look local, so a forwarding header counts as remote.
function isLocal(req) {
  if (!LOOPBACK.has(req.socket.remoteAddress)) return false;
  return !FORWARDED.some((h) => req.headers[h]);
}

function sameToken(given, expected) {
  if (!given || !expected) return false;
  const a = Buffer.from(String(given));
  const b = Buffer.from(String(expected));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function mayWrite(req, token) {
  if (isLocal(req)) return true;
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  return sameToken(bearer || req.headers['x-admin-token'], token);
}

// Browsers let any site open a WebSocket to localhost; only this page itself may listen in.
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readJson(req, res, done) {
  let body = '';
  let size = 0;
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > 16 * 1024) {
      send(res, 413, { error: 'Payload too large' });
      req.destroy();
      return;
    }
    body += chunk;
  });
  req.on('end', () => {
    if (res.writableEnded) return;
    try {
      done(JSON.parse(body));
    } catch (e) {
      log.debug('bad json', e.message);
      send(res, 400, { error: 'Body must be JSON' });
    }
  });
}

function createHandler({ office, staticDir, token, version }) {
  return function handle(req, res) {
    const { method } = req;
    const url = req.url.split('?')[0];

    if (method === 'GET' && url === '/api/health') {
      return send(res, 200, {
        status: 'ok',
        version,
        uptime: process.uptime(),
        agents: office.size(),
      });
    }
    if (method === 'GET' && url === '/api/state') return send(res, 200, { agents: office.list() });

    const isWrite = method === 'POST' || method === 'DELETE';
    if (isWrite && url.startsWith('/api/')) {
      if (!mayWrite(req, token))
        return send(res, 401, { error: 'A token is required from outside this machine' });

      if (method === 'POST' && url === '/api/event') {
        return readJson(req, res, (data) => {
          const result = office.report(data);
          send(
            res,
            result.ok ? 200 : 400,
            result.ok ? { ok: true, id: result.agent.id } : { error: result.error }
          );
        });
      }
      // Local bots written against the first version of the office still report here.
      if (method === 'POST' && url === '/api/demo') {
        return readJson(req, res, (data) => {
          const result = office.report({
            id: data.id,
            agent: data.slug || data.id,
            state: data.status,
            tool: data.currentTool,
            note: data.currentToolLabel,
          });
          send(res, result.ok ? 200 : 400, result.ok ? { ok: true } : { error: result.error });
        });
      }
      if (method === 'DELETE' && (url.startsWith('/api/event/') || url.startsWith('/api/demo/'))) {
        office.remove(decodeURIComponent(url.split('/').pop()));
        return send(res, 200, { ok: true });
      }
      return send(res, 404, { error: 'Not found' });
    }

    if (method !== 'GET' && method !== 'HEAD')
      return send(res, 405, { error: 'Method not allowed' });

    let decoded;
    try {
      decoded = decodeURIComponent(url);
    } catch {
      res.writeHead(400);
      return res.end('Bad Request');
    }
    const filePath =
      decoded === '/' ? path.join(staticDir, 'index.html') : path.resolve(staticDir, '.' + decoded);
    if (!filePath.startsWith(staticDir + path.sep)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end(decoded === '/' ? 'Run "npm run build" first.' : 'Not found');
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
      });
      res.end(data);
    });
  };
}

module.exports = { createHandler, isLocal, mayWrite, sameOrigin };
