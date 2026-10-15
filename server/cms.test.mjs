import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { once } from 'node:events';
import { createCms } from './cms.mjs';
import defaults from '../src/default-content.json' with { type: 'json' };
import { validateContent } from '../src/content-schema.js';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

async function serve(options) {
  const server = createServer(createCms(options));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, close: () => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }) };
}

test('CMS authentication, draft isolation, publish, persistence, and public rendering', async t => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'rakentaa-cms-'));
  const app = await serve({ dataDir });
  t.after(async () => { await app.close(); await rm(dataDir, { recursive: true, force: true }); });
  let cookie = '';
  async function request(url, { method = 'GET', body, authenticated = true, origin = app.base } = {}) {
    const result = await fetch(app.base + url, { method, headers: { ...(body ? { 'Content-Type': 'application/json', Origin: origin } : {}), ...(authenticated ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: result.status, headers: result.headers, data: await result.json() };
  }
  assert.equal(validateContent(defaults), null);
  assert.equal((await request('/api/admin/content')).status, 401);
  assert.equal((await request('/api/admin/session')).data.setupRequired, true);
  assert.equal((await request('/api/admin/setup', { method: 'POST', origin: 'https://example.com', body: { username: 'owner', password: 'a-long-test-password' } })).status, 403);
  const setup = await request('/api/admin/setup', { method: 'POST', body: { username: 'owner', password: 'a-long-test-password' } });
  assert.equal(setup.status, 201);
  cookie = setup.headers.get('set-cookie').split(';')[0];
  assert.match(setup.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  const account = JSON.parse(await readFile(path.join(dataDir, 'admin.json'), 'utf8'));
  assert.ok(account.hash && account.salt);
  assert.equal(JSON.stringify(account).includes('a-long-test-password'), false);
  assert.equal((await request('/api/admin/setup', { method: 'POST', body: { username: 'other', password: 'another-long-password' } })).status, 409);
  const state = (await request('/api/admin/content')).data;
  const edited = structuredClone(state.draft);
  edited.hero.title = 'A published CMS headline';
  edited.contact.phone = '+256 700 123 456';
  edited.faqs.push(['Does publishing work?', 'Yes, content comes from the server.']);
  edited.inspirations[0].title = 'A new gallery title';
  edited.about.description = 'The company story was edited in the CMS.';
  edited.guides[0].title = 'A new planning guide title';
  edited.steps[0][0] = 'A new process step';
  const saved = await request('/api/admin/content', { method: 'PUT', body: { revision: state.revision, content: edited } });
  assert.equal(saved.status, 200);
  assert.equal((await request('/api/content', { authenticated: false })).data.content.hero.title, defaults.hero.title);
  assert.equal((await request('/api/admin/content')).data.draft.hero.title, edited.hero.title);
  assert.equal((await request('/api/admin/content', { method: 'PUT', body: { revision: state.revision, content: edited } })).status, 409);
  const invalid = structuredClone(edited); invalid.inspirations[0].image = 'javascript:alert(1)';
  assert.equal((await request('/api/admin/content', { method: 'PUT', body: { revision: saved.data.revision, content: invalid } })).status, 400);
  const published = await request('/api/admin/publish', { method: 'POST', body: { revision: saved.data.revision } });
  assert.equal(published.status, 200);
  const publicContent = (await request('/api/content', { authenticated: false })).data.content;
  assert.deepEqual(publicContent, edited);
  assert.ok(published.data.publishedAt);
  const restarted = await serve({ dataDir });
  try {
    assert.deepEqual((await (await fetch(restarted.base + '/api/content')).json()).content, edited);
    assert.equal((await fetch(restarted.base + '/api/admin/content')).status, 401);
  } finally { await restarted.close(); }

  // Render the actual public React tree against the content returned by the live API.
  const project = fileURLToPath(new URL('../', import.meta.url));
  const source = (await readFile(path.join(project, 'src/main.jsx'), 'utf8')).replace(/createRoot\(document\.getElementById\('root'\)\)\.render\([\s\S]*$/, 'export { App, ContentContext };').replace('ContentProvider, useContent', 'ContentProvider, useContent, ContentContext');
  const bundle = path.join(project, 'node_modules', `.cms-render-test-${Date.now()}.mjs`);
  const output = await build({ stdin: { contents: source, loader: 'jsx', resolveDir: path.join(project, 'src') }, bundle: true, platform: 'node', format: 'esm', packages: 'external', loader: { '.css': 'empty' }, write: false });
  await writeFile(bundle, output.outputFiles[0].text);
  try {
    const { App, ContentContext } = await import(pathToFileURL(bundle).href);
    const markup = renderToStaticMarkup(React.createElement(ContentContext.Provider, { value: publicContent }, React.createElement(App)));
    assert.ok(markup.includes(edited.hero.title));
    assert.ok(markup.includes('tel:+256700123456'));
    assert.ok(markup.includes('https://wa.me/256700123456'));
    assert.ok(markup.includes('Does publishing work?'));
    assert.ok(markup.includes('A new gallery title'));
    assert.ok(markup.includes(edited.about.description));
    assert.ok(markup.includes(edited.guides[0].title));
    assert.ok(markup.includes(edited.steps[0][0]));
    assert.ok(markup.includes('href="/admin"'));
  } finally { await rm(bundle, { force: true }); }
  assert.equal((await request('/api/admin/logout', { method: 'POST', body: {} })).status, 200);
  assert.equal((await request('/api/admin/content')).status, 401);
  assert.equal((await request('/api/admin/login', { method: 'POST', body: { username: 'owner', password: 'wrong' } })).status, 401);
  const login = await request('/api/admin/login', { method: 'POST', body: { username: 'owner', password: 'a-long-test-password' } });
  assert.equal(login.status, 200);
});

test('Setup token protection and login throttling', async t => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'rakentaa-token-'));
  const app = await serve({ dataDir, setupToken: 'server-only-setup-token', secureCookie: true });
  t.after(async () => { await app.close(); await rm(dataDir, { recursive: true, force: true }); });
  async function post(endpoint, data) { return fetch(app.base + '/api/admin/' + endpoint, { method: 'POST', headers: { Origin: app.base, 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); }
  assert.equal((await post('setup', { username: 'owner', password: 'a-long-test-password' })).status, 403);
  const setup = await post('setup', { username: 'owner', password: 'a-long-test-password', setupToken: 'server-only-setup-token' });
  assert.equal(setup.status, 201);
  assert.match(setup.headers.get('set-cookie'), /; Secure/);
  for (let i = 0; i < 3; i++) assert.equal((await post('login', { username: 'owner', password: 'incorrect' })).status, 401);
  assert.equal((await post('login', { username: 'owner', password: 'incorrect' })).status, 429);
});
