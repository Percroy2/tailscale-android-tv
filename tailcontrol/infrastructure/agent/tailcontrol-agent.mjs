#!/usr/bin/env node
/**
 * TailControl Supervision Agent v1.0
 * Enregistre un agent, envoie des heartbeats et exécute des checks locaux.
 *
 * Usage:
 *   node tailcontrol-agent.mjs --api http://localhost:3000 --tailnet <id> --token <portal-jwt> --name "Agent LAN"
 */
import { createConnection } from 'node:net';
import { createSocket } from 'node:dgram';
import { hostname } from 'node:os';

const args = parseArgs(process.argv.slice(2));
const apiBase = (args.api ?? 'http://localhost:3000').replace(/\/$/, '');
const tailnetId = args.tailnet;
const token = args.token;
const agentName = args.name ?? `Agent ${hostname()}`;

if (!tailnetId || !token) {
  console.error(
    'Usage: node tailcontrol-agent.mjs --api URL --tailnet ID --token JWT [--name NAME] [--interval 30]',
  );
  process.exit(1);
}

const intervalSec = Number(args.interval ?? 30);

async function register() {
  const response = await fetch(
    `${apiBase}/api/v1/agents/register?tailnetId=${encodeURIComponent(tailnetId)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: agentName,
        hostname: hostname(),
        capabilities: ['ping', 'port', 'http', 'wol'],
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`Enregistrement échoué: ${response.status}`);
  }
  return response.json();
}

async function heartbeat(agentId) {
  const response = await fetch(
    `${apiBase}/api/v1/agents/${encodeURIComponent(agentId)}/heartbeat?tailnetId=${encodeURIComponent(tailnetId)}`,
    { method: 'POST' },
  );
  if (!response.ok) {
    throw new Error(`Heartbeat échoué: ${response.status}`);
  }
}

async function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port, timeout: 3000 }, () => {
      socket.end();
      resolve({ status: 'up', host, port });
    });
    socket.on('error', () => resolve({ status: 'down', host, port }));
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ status: 'down', host, port });
    });
  });
}

async function checkHttp(url) {
  try {
    const started = Date.now();
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return { status: response.ok ? 'up' : 'down', url, ms: Date.now() - started };
  } catch {
    return { status: 'down', url };
  }
}

function sendWoL(macAddress) {
  return new Promise((resolve) => {
    const normalized = macAddress.replace(/[^a-fA-F0-9]/g, '');
    const buffer = Buffer.alloc(102);
    buffer.fill(0xff, 0, 6);
    for (let index = 6; index < buffer.length; index += 6) {
      Buffer.from(normalized, 'hex').copy(buffer, index);
    }
    const socket = createSocket('udp4');
    socket.send(buffer, 9, '255.255.255.255', () => {
      socket.close();
      resolve({ status: 'sent', macAddress });
    });
  });
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[index + 1];
      if (next && !next.startsWith('--')) {
        result[key] = next;
        index += 1;
      } else {
        result[key] = true;
      }
    }
  }
  return result;
}

const agent = await register();
console.log(`Agent enregistré: ${agent.id} (${agent.name})`);

setInterval(() => {
  void heartbeat(agent.id).catch((error) => {
    console.error(error.message);
  });
}, intervalSec * 1000);

export { checkPort, checkHttp, sendWoL };
