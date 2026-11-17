require('dotenv').config({ quiet: true });
const http = require('http');
const path = require('path');
const os = require('os');
const { WebSocketServer } = require('ws');

const log = require('./src/server/logger');
const { createOffice } = require('./src/server/office');
const { watchTranscripts } = require('./src/server/transcripts');
const { createHandler, sameOrigin } = require('./src/server/http');
const { version } = require('./package.json');

const PORT = Number(process.env.PORT) || 3737;
// Local by default: the office shows what your agents are doing, so sharing it is a choice.
const HOST = process.env.HOST || '127.0.0.1';
const TOKEN = process.env.OFFICE_TOKEN || process.env.ADMIN_TOKEN || '';
const TRANSCRIPTS =
  process.env.CLAUDE_PROJECTS_DIR || path.join(os.homedir(), '.claude', 'projects');
const FILLERS =
  process.env.OFFICE_FILLERS === undefined ? 10 : Number(process.env.OFFICE_FILLERS) || 0;

const clients = new Set();
function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

const office = createOffice({ fillers: FILLERS, onChange: broadcast });

const server = http.createServer(
  createHandler({
    office,
    staticDir: path.join(__dirname, 'dist'),
    token: TOKEN,
    version,
  })
);
server.on('error', (err) => {
  log.error('HTTP server error:', err.message);
  if (err.code === 'EADDRINUSE') process.exit(1);
});

const wss = new WebSocketServer({ server, verifyClient: ({ req }) => sameOrigin(req) });
wss.on('error', (err) => log.error('WebSocket server error:', err.message));
wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'init', agents: office.list() }));
  ws.on('close', () => clients.delete(ws));
});

const watcher = watchTranscripts(TRANSCRIPTS, office);
office.prune();
setInterval(office.prune, 3000);

server.listen(PORT, HOST, () => {
  log.info(`Agent Office ${version}: http://localhost:${PORT}`);
  log.info(`Transcripts read on start: ${watcher.files}; in the office now: ${office.size()}`);
  if (HOST !== '127.0.0.1' && !TOKEN) {
    log.warn('Listening beyond this machine without OFFICE_TOKEN: outside writes are refused');
  }
});

function shutdown() {
  watcher.close();
  server.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
