#!/usr/bin/env node
const { exec } = require('child_process');

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Agent Office: your running agents as people in a pixel office.

  npx agent-office [--port 3737] [--host 127.0.0.1] [--no-open]

Reads Claude Code session logs on this machine and listens for
POST /api/event {"agent":"my-bot","state":"working"} from anything else.
Nothing about the work leaves the server: no paths, no project names, no text.
Set OFFICE_TOKEN to accept events from other machines.`);
  process.exit(0);
}

if (flag('--port')) process.env.PORT = flag('--port');
if (flag('--host')) process.env.HOST = flag('--host');
const port = Number(process.env.PORT) || 3737;

require('../server.js');

if (!args.includes('--no-open')) {
  const url = `http://localhost:${port}`;
  const open =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  setTimeout(() => exec(open, () => {}), 600);
}
