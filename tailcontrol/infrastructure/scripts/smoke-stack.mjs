#!/usr/bin/env node
/**
 * Smoke test TailControl stack (API directe ou via proxy nginx du portail).
 * Usage:
 *   node tailcontrol/infrastructure/scripts/smoke-stack.mjs
 *   API_BASE=http://localhost:5173 node ...   # via portail Docker
 */
const API_BASE = (process.env.API_BASE ?? 'http://localhost:3000').replace(/\/$/, '');

async function request(path, options = {}, token) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers ?? {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} → ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

function step(name, fn) {
  process.stdout.write(`• ${name}... `);
  return fn()
    .then((result) => {
      console.log('OK');
      return result;
    })
    .catch((error) => {
      console.log('ÉCHEC');
      throw error;
    });
}

async function main() {
  console.log(`Smoke TailControl — ${API_BASE}\n`);

  await step('health', () =>
    request('/api/v1/health').then((body) => {
      if (body.status !== 'ok') throw new Error('health invalid');
    }),
  );

  await step('version', () =>
    request('/api/v1/app/version').then((body) => {
      if (!body.latestVersion) throw new Error('missing latestVersion');
    }),
  );

  const email = `smoke-${Date.now()}@tailcontrol.test`;
  await step('register', () =>
    request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'SmokePass123!', displayName: 'Smoke' }),
    }),
  );

  const login = await step('login', () =>
    request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'SmokePass123!' }),
    }),
  );

  const portalToken = login.accessToken;

  const tailnet = await step('create tailnet', () =>
    request(
      '/api/v1/tailnets',
      {
        method: 'POST',
        body: JSON.stringify({
          name: `smoke-${Date.now()}`,
          displayName: 'Smoke Tailnet',
        }),
      },
      portalToken,
    ),
  );

  const pairing = await step('pairing TV', () =>
    request('/api/v1/pairing', {
      method: 'POST',
      body: JSON.stringify({ installationId: `smoke-${Date.now()}`, deviceName: 'Smoke TV' }),
    }),
  );

  await step('authorize pairing', () =>
    request(
      `/api/v1/pairing/${encodeURIComponent(pairing.code)}/authorize`,
      {
        method: 'POST',
        body: JSON.stringify({ tailnetId: tailnet.id, profile: 'ADMIN' }),
      },
      portalToken,
    ),
  );

  const status = await step('pairing status + tokens', () =>
    request(`/api/v1/pairing/${pairing.pairingId}`),
  );

  if (status.status !== 'completed' || !status.tokens?.accessToken) {
    throw new Error('tokens TV manquants');
  }

  await step('TV alerts', () =>
    request('/api/v1/alerts', {}, status.tokens.accessToken).then((body) => {
      if (!Array.isArray(body.alerts)) throw new Error('alerts invalid');
    }),
  );

  await step('TV monitoring', () =>
    request('/api/v1/monitoring', {}, status.tokens.accessToken).then((body) => {
      if (!Array.isArray(body.monitors)) throw new Error('monitors invalid');
    }),
  );

  await step('TV agents', () =>
    request('/api/v1/agents/for-tv', {}, status.tokens.accessToken).then((body) => {
      if (!Array.isArray(body.agents)) throw new Error('agents invalid');
    }),
  );

  await step('TV audit', () =>
    request('/api/v1/audit', {}, status.tokens.accessToken).then((body) => {
      if (!Array.isArray(body.entries)) throw new Error('audit invalid');
    }),
  );

  await step('TV activity', () =>
    request('/api/v1/activity', {}, status.tokens.accessToken).then((body) => {
      if (!Array.isArray(body.items)) throw new Error('activity invalid');
    }),
  );

  console.log('\nSmoke test réussi.');
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
