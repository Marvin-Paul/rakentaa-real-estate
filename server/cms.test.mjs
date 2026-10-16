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
  const imageBytes = await readFile(new URL('../public/rakentaa-logo-transparent.png', import.meta.url));
  const upload = (bytes, { mime = 'image/png', authenticated = true, origin = app.base } = {}) => fetch(app.base + '/api/admin/uploads', { method: 'POST', headers: { Origin: origin, 'Content-Type': mime, ...(authenticated ? { Cookie: cookie } : {}) }, body: bytes });
  assert.equal((await upload(imageBytes, { authenticated: false })).status, 401);
  assert.equal((await upload(imageBytes, { origin: 'https://example.com' })).status, 403);
  assert.equal((await upload(Buffer.from('<svg onload="alert(1)"/>'), { mime: 'image/svg+xml' })).status, 415);
  assert.equal((await upload(Buffer.from('not an image'))).status, 400);
  assert.equal((await upload(imageBytes, { mime: 'image/jpeg' })).status, 400);
  assert.equal((await upload(Buffer.alloc(10 * 1024 * 1024 + 1))).status, 413);
  const uploadedResponse = await upload(imageBytes);
  assert.equal(uploadedResponse.status, 201);
  const uploaded = await uploadedResponse.json();
  assert.match(uploaded.image, /^\/uploads\/[a-f0-9]{32}\.png$/);
  const photoResponse = await fetch(app.base + uploaded.image);
  assert.equal(photoResponse.headers.get('content-type'), 'image/png');
  assert.equal(photoResponse.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(Buffer.from(await photoResponse.arrayBuffer()), imageBytes);
  assert.equal((await fetch(app.base + '/uploads/admin.json')).status, 404);
  assert.equal((await fetch(app.base + '/uploads/' + 'a'.repeat(32) + '.png')).status, 404);
  assert.equal((await fetch(app.base + uploaded.image, { method: 'HEAD' })).status, 200);
  const edited = structuredClone(state.draft);
  edited.hero.image = uploaded.image;
  edited.hero.title = 'A published CMS headline';
  edited.properties = [{ title: 'Test home for sale', location: 'Kampala', price: 'UGX 250,000,000', type: 'House', size: '20 decimals', description: 'A property listing managed through the CMS.', image: '/images/residential-construction.jpeg', imageAlt: 'Test property exterior', status: 'Available' }];
  edited.contact.phone = '+256 700 123 456';
  edited.faqs.push(['Does publishing work?', 'Yes, content comes from the server.']);
  edited.inspirations[0].title = 'A new gallery title';
  edited.about.description = 'The company story was edited in the CMS.';
  edited.guides[0].title = 'A new planning guide title';
  edited.steps[0][0] = 'A new process step';
  edited.services[2].image = '/images/residential-construction.jpeg';
  edited.services[2].imageAlt = 'CMS service image';
  edited.services[2].imageFit = 'cover';
  edited.gallerySettings = { speed: 24, autoplay: false };
  edited.companyPages['/our-team'].people[0].name = 'CMS team member';
  edited.companyPages['/our-partners'].headline = 'CMS partnership headline';
  edited.companyPages['/our-clients'].intro = 'CMS client introduction';
  const saved = await request('/api/admin/content', { method: 'PUT', body: { revision: state.revision, content: edited } });
  assert.equal(saved.status, 200);
  assert.equal((await request('/api/content', { authenticated: false })).data.content.hero.title, defaults.hero.title);
  assert.deepEqual((await request('/api/content', { authenticated: false })).data.content.properties, []);
  assert.equal((await request('/api/admin/content', { method: 'PUT', authenticated: false, body: { revision: saved.data.revision, content: edited } })).status, 401);
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
    assert.deepEqual(Buffer.from(await (await fetch(restarted.base + uploaded.image)).arrayBuffer()), imageBytes);
    assert.equal((await fetch(restarted.base + '/api/admin/content')).status, 401);
  } finally { await restarted.close(); }

  // Render the actual public React tree against the content returned by the live API.
  const project = fileURLToPath(new URL('../', import.meta.url));
  const source = (await readFile(path.join(project, 'src/main.jsx'), 'utf8')).replace(/createRoot\(document\.getElementById\('root'\)\)\.render\([\s\S]*$/, 'export { App, ContentContext, CompanyPage, companyPages }; export { ContentEditor } from "./Admin.jsx";').replace('ContentProvider, useContent', 'ContentProvider, useContent, ContentContext');
  const bundle = path.join(project, 'node_modules', `.cms-render-test-${Date.now()}.mjs`);
  const output = await build({ stdin: { contents: source, loader: 'jsx', resolveDir: path.join(project, 'src') }, bundle: true, platform: 'node', format: 'esm', packages: 'external', loader: { '.css': 'empty' }, write: false });
  await writeFile(bundle, output.outputFiles[0].text);
  try {
    const { App, ContentContext, CompanyPage, companyPages, ContentEditor } = await import(pathToFileURL(bundle).href);
    const markup = renderToStaticMarkup(React.createElement(ContentContext.Provider, { value: publicContent }, React.createElement(App)));
    for (const [section, expected] of [['hero', 'Hero background image'], ['about', 'About image'], ['properties', 'Property photo'], ['services', 'Service header image'], ['inspirations', 'Choose from image library'], ['gallerySettings', 'Scrolling speed'], ['team', 'CMS team member'], ['partners', 'CMS partnership headline'], ['clients', 'CMS client introduction']]) {
      const adminMarkup = renderToStaticMarkup(React.createElement(ContentEditor, { section, draft: publicContent, setDraft: () => {} }));
      assert.ok(adminMarkup.includes(expected), `Admin section ${section} should display ${expected}`);
      assert.equal(adminMarkup.includes('Image unavailable.'), false);
      if (section !== 'gallerySettings') assert.ok(adminMarkup.includes('type="file"'), `${section} has an image uploader`);
    }
    assert.ok(markup.includes(edited.hero.title));
    assert.ok(markup.includes('Test home for sale'));
    assert.ok(markup.includes('UGX 250,000,000'));
    assert.ok(markup.includes('Enquire about this property'));
    const propertyEditor = renderToStaticMarkup(React.createElement(ContentEditor, { section: 'properties', draft: publicContent, setDraft: () => {} }));
    assert.ok(propertyEditor.includes('Test home for sale'));
    assert.ok(propertyEditor.includes('Add property'));
    const soldContent = structuredClone(publicContent);
    soldContent.properties[0].status = 'Sold';
    const soldMarkup = renderToStaticMarkup(React.createElement(ContentContext.Provider, { value: soldContent }, React.createElement(App)));
    assert.ok(soldMarkup.includes('status-sold'));
    assert.equal(soldMarkup.includes('Enquire about this property'), false);
    soldContent.properties = [];
    assert.equal(validateContent(soldContent), null);
    const emptyMarkup = renderToStaticMarkup(React.createElement(ContentContext.Provider, { value: soldContent }, React.createElement(App)));
    assert.ok(emptyMarkup.includes('New listings coming soon.'));
    assert.ok(markup.includes('tel:+256700123456'));
    assert.ok(markup.includes('https://wa.me/256700123456'));
    assert.ok(markup.includes('Does publishing work?'));
    assert.ok(markup.includes('A new gallery title'));
    assert.ok(markup.includes(edited.about.description));
    assert.ok(markup.includes(edited.guides[0].title));
    assert.ok(markup.includes(edited.steps[0][0]));
    assert.ok(markup.includes('href="/admin"'));
    assert.ok(markup.includes('Scrolling image gallery'));
    assert.ok(markup.includes('Play gallery'));
    assert.ok(markup.includes('alt="CMS service image"'));
    assert.ok(markup.includes('object-fit:cover'));
    assert.ok(markup.includes('Steady'));
    for (const [route, page] of Object.entries(companyPages)) {
      assert.ok(markup.includes(`href="${route}"`));
      const pageMarkup = renderToStaticMarkup(React.createElement(CompanyPage, { page }));
      assert.ok(pageMarkup.includes(page.title));
      const livePage = publicContent.companyPages[route];
      const livePageMarkup = renderToStaticMarkup(React.createElement(ContentContext.Provider, { value: publicContent }, React.createElement(CompanyPage, { page })));
      assert.ok(livePageMarkup.includes(livePage.intro));
      for (const person of livePage.people || []) assert.ok(livePageMarkup.includes(person.name));
      assert.ok(pageMarkup.includes('href="/#contact"'));
      for (const person of page.people || []) {
        assert.ok(pageMarkup.includes(person.name));
        assert.ok(pageMarkup.includes(person.role));
      }
    }
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

test('Gallery accepts bundled images while rejecting unsafe image paths', () => {
  assert.equal(validateContent(defaults), null);
  for (const image of ['/images/../data/admin.json', '//example.com/image.jpeg', '/images/test.svg', '/images/test.jpeg?x=1', 'javascript:alert(1)', 'http://example.com/image.jpeg']) {
    const content = structuredClone(defaults);
    content.inspirations[0].image = image;
    assert.ok(validateContent(content), `Should reject ${image}`);
  }
  const remote = structuredClone(defaults);
  remote.inspirations[0].image = 'https://example.com/image.jpeg';
  assert.equal(validateContent(remote), null);
});


test('Older saved records receive new admin controls without losing published edits', async t => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'rakentaa-legacy-'));
  const legacy = structuredClone(defaults);
  delete legacy.companyPages;
  delete legacy.gallerySettings;
  legacy.services.forEach(service => { delete service.image; delete service.imageAlt; delete service.imageFit; delete service.imagePosition; });
  legacy.hero.title = 'Retained published title';
  const record = { revision: 7, draft: legacy, published: legacy, savedAt: '2026-10-01T00:00:00Z', publishedAt: '2026-10-02T00:00:00Z' };
  await writeFile(path.join(dataDir, 'content.json'), JSON.stringify(record));
  const app = await serve({ dataDir });
  t.after(async () => { await app.close(); await rm(dataDir, { recursive: true, force: true }); });
  const live = await (await fetch(app.base + '/api/content')).json();
  assert.equal(live.revision, 7);
  assert.equal(live.publishedAt, record.publishedAt);
  assert.equal(live.content.hero.title, legacy.hero.title);
  assert.equal(live.content.services[0].image, defaults.services[0].image);
  assert.equal(live.content.companyPages['/our-team'].people[0].name, 'Kiggundu Isaac');
  assert.equal(validateContent(live.content), null);
  assert.deepEqual(JSON.parse(await readFile(path.join(dataDir, 'content.json'), 'utf8')), record);
});

test('New admin fields reject unsafe images, invalid playback and incomplete page content', () => {
  for (const change of [
    content => { content.services[0].image = 'javascript:alert(1)'; },
    content => { content.services[0].imagePosition = 'url(https://example.com)'; },
    content => { content.gallerySettings.speed = 0; },
    content => { content.companyPages['/our-team'].people[0].image = '//example.com/portrait.png'; },
    content => { content.companyPages['/our-clients'].intro = ''; },
    content => { content.companyPages['/our-partners'].cards[0][2] = 'InvalidIcon'; },
    content => { content.inspirations[0].width = -100; },
  ]) {
    const content = structuredClone(defaults); change(content); assert.ok(validateContent(content));
  }
});
