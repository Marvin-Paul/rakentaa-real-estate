import { randomBytes, scrypt as deriveKey, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import defaults from '../src/default-content.json' with { type: 'json' };
import { validateContent, withContentDefaults } from '../src/content-schema.js';

const scrypt = promisify(deriveKey);
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const SESSION_AGE = 8 * 60 * 60 * 1000;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const uploadTypes = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
function imageExtension(bytes) {
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii', 12, 16) === 'IHDR') return 'png';
  if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217) return 'jpg';
  if (bytes.length >= 16 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function createCms({ dataDir = process.env.CMS_DATA_DIR || path.join(projectRoot, 'data'), setupToken = process.env.CMS_SETUP_TOKEN || '', secureCookie = process.env.CMS_SECURE_COOKIE === 'true' } = {}) {
  const sessions = new Map();
  const attempts = new Map();
  let queue = Promise.resolve();
  const exclusive = operation => {
    const result = queue.then(operation);
    queue = result.catch(() => {});
    return result;
  };
  async function read(name, fallback) {
    try { return JSON.parse(await readFile(path.join(dataDir, name), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
  }
  async function write(name, value) {
    await mkdir(dataDir, { recursive: true });
    const target = path.join(dataDir, name);
    const temp = `${target}.${randomBytes(8).toString('hex')}.tmp`;
    await writeFile(temp, JSON.stringify(value, null, 2), { mode: 0o600 });
    await rename(temp, target);
  }
  const initial = () => ({ revision: 0, draft: defaults, published: defaults, savedAt: null, publishedAt: null });
  const store = async () => { const record = await read('content.json', initial()); return { ...record, draft: withContentDefaults(record.draft), published: withContentDefaults(record.published) }; };
  const user = () => read('admin.json', null);
  const cookie = (token, expired = false) => `rakentaa_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${expired ? 0 : SESSION_AGE / 1000}${secureCookie ? '; Secure' : ''}`;
  const sessionFor = req => {
    const token = /(?:^|;\s*)rakentaa_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
    const session = token && sessions.get(token);
    if (session && session.expires > Date.now()) return { ...session, token };
    if (token) sessions.delete(token);
    return null;
  };
  const requireSession = req => {
    const session = sessionFor(req);
    if (!session) throw new HttpError(401, 'Please sign in to continue.');
    return session;
  };
  function issueSession(res, username) {
    for (const [token, session] of sessions) if (session.expires <= Date.now()) sessions.delete(token);
    const token = randomBytes(32).toString('hex');
    sessions.set(token, { username, expires: Date.now() + SESSION_AGE });
    res.setHeader('Set-Cookie', cookie(token));
  }
  async function body(req) {
    if (!req.headers['content-type']?.startsWith('application/json')) throw new HttpError(415, 'Send JSON content.');
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 1024 * 1024) throw new HttpError(413, 'Content is too large.');
      chunks.push(chunk);
    }
    try {
      const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
      return value;
    } catch { throw new HttpError(400, 'Invalid JSON request.'); }
  }
  function sameOrigin(req) {
    let origin;
    try { origin = new URL(req.headers.origin); } catch { throw new HttpError(403, 'A same-origin request is required.'); }
    if (origin.host !== req.headers.host || !['http:', 'https:'].includes(origin.protocol)) throw new HttpError(403, 'A same-origin request is required.');
    if (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin') throw new HttpError(403, 'A same-origin request is required.');
  }
  function credentials(input) {
    if (typeof input.username !== 'string' || !/^[a-zA-Z0-9._-]{3,60}$/.test(input.username)) throw new HttpError(400, 'Username must be 3–60 letters, numbers, dots, dashes or underscores.');
    if (typeof input.password !== 'string' || input.password.length < 12 || input.password.length > 256) throw new HttpError(400, 'Use a password between 12 and 256 characters.');
  }
  const throttle = req => {
    const key = req.socket.remoteAddress;
    const now = Date.now();
    for (const [address, item] of attempts) if (item.until < now) attempts.delete(address);
    const item = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
    if (item.count >= 5) throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.');
    item.count += 1;
    attempts.set(key, item);
  };
  function setupAllowed(req, input) {
    if (setupToken) {
      const supplied = Buffer.from(typeof input.setupToken === 'string' ? input.setupToken : '');
      const expected = Buffer.from(setupToken);
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new HttpError(403, 'The setup token is incorrect.');
    } else {
      const address = req.socket.remoteAddress;
      const host = new URL(`http://${req.headers.host}`).hostname;
      if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address) || !['127.0.0.1', 'localhost', '[::1]'].includes(host)) throw new HttpError(403, 'Initial setup must be completed on localhost, or with a server setup token.');
    }
  }
  function send(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(data));
  }
  return async function cms(req, res, next = () => send(res, 404, { error: 'Not found.' })) {
    let url;
    try { url = new URL(req.url, 'http://localhost'); } catch { return send(res, 400, { error: 'Invalid URL.' }); }
    try {
      if (url.pathname.startsWith('/uploads/')) {
        const match = /^\/uploads\/([a-f0-9]{32}\.(png|jpg|webp))$/.exec(url.pathname);
        if (!match) return send(res, 404, { error: 'Image not found.' });
        if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, { error: 'Method not allowed.' });
        let bytes;
        try { bytes = await readFile(path.join(dataDir, 'uploads', match[1])); }
        catch (error) { if (error.code === 'ENOENT') return send(res, 404, { error: 'Image not found.' }); throw error; }
        res.writeHead(200, { 'Content-Type': uploadTypes[match[2]], 'Content-Length': bytes.length, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" });
        return res.end(req.method === 'HEAD' ? undefined : bytes);
      }
      if (!url.pathname.startsWith('/api/')) return next();
      const route = `${req.method} ${url.pathname}`;
      if (req.method !== 'GET') sameOrigin(req);
      if (route === 'GET /api/content') {
        const data = await store();
        return send(res, 200, { content: data.published, publishedAt: data.publishedAt, revision: data.revision });
      }
      if (route === 'GET /api/admin/session') return send(res, 200, { setupRequired: !(await user()), setupTokenRequired: Boolean(setupToken), username: sessionFor(req)?.username || null });
      if (route === 'POST /api/admin/setup') {
        throttle(req);
        const input = await body(req);
        return await exclusive(async () => {
          if (await user()) throw new HttpError(409, 'The admin account is already configured. Please sign in.');
          setupAllowed(req, input);
          credentials(input);
          const salt = randomBytes(16).toString('hex');
          const hash = (await scrypt(input.password, salt, 64)).toString('hex');
          await write('admin.json', { username: input.username, salt, hash });
          issueSession(res, input.username);
          return send(res, 201, { username: input.username });
        });
      }
      if (route === 'POST /api/admin/login') {
        throttle(req);
        const input = await body(req);
        const admin = await user();
        const password = typeof input.password === 'string' && input.password.length <= 256 ? input.password : '';
        const hash = await scrypt(password, admin?.salt || 'dummy-salt', 64);
        if (!admin || input.username !== admin.username || !timingSafeEqual(hash, Buffer.from(admin.hash, 'hex'))) throw new HttpError(401, 'Incorrect username or password.');
        attempts.delete(req.socket.remoteAddress);
        issueSession(res, admin.username);
        return send(res, 200, { username: admin.username });
      }
      if (route === 'POST /api/admin/logout') {
        const session = requireSession(req);
        sessions.delete(session.token);
        res.setHeader('Set-Cookie', cookie('', true));
        return send(res, 200, { ok: true });
      }
      requireSession(req);
      if (route === 'POST /api/admin/uploads') {
        if (!Object.values(uploadTypes).includes(req.headers['content-type'])) throw new HttpError(415, 'Choose a JPEG, PNG or WebP image.');
        if (Number(req.headers['content-length']) > MAX_IMAGE_SIZE) throw new HttpError(413, 'Choose an image smaller than 10 MB.');
        let size = 0;
        const chunks = [];
        for await (const chunk of req) {
          size += chunk.length;
          if (size > MAX_IMAGE_SIZE) throw new HttpError(413, 'Choose an image smaller than 10 MB.');
          chunks.push(chunk);
        }
        const bytes = Buffer.concat(chunks);
        const extension = imageExtension(bytes);
        if (!extension || uploadTypes[extension] !== req.headers['content-type']) throw new HttpError(400, 'This file is not a supported image. Choose a JPEG, PNG or WebP image.');
        const filename = `${randomBytes(16).toString('hex')}.${extension}`;
        await mkdir(path.join(dataDir, 'uploads'), { recursive: true });
        await writeFile(path.join(dataDir, 'uploads', filename), bytes, { flag: 'wx', mode: 0o600 });
        return send(res, 201, { image: `/uploads/${filename}` });
      }
      if (route === 'GET /api/admin/content') return send(res, 200, await store());
      if (route === 'PUT /api/admin/content' || route === 'POST /api/admin/publish') {
        const input = await body(req);
        return await exclusive(async () => {
          const data = await store();
          if (input.revision !== data.revision) throw new HttpError(409, 'Content changed in another session. Reload the editor before saving again.');
          if (route === 'PUT /api/admin/content') {
            const error = validateContent(input.content);
            if (error) throw new HttpError(400, error);
            data.draft = input.content;
            data.savedAt = new Date().toISOString();
          } else {
            data.published = data.draft;
            data.publishedAt = new Date().toISOString();
          }
          data.revision += 1;
          await write('content.json', data);
          return send(res, 200, data);
        });
      }
      return send(res, 404, { error: 'Unknown API endpoint.' });
    } catch (error) {
      if (!error.status) console.error('CMS request failed:', error.message);
      if (!res.headersSent) send(res, error.status || 500, { error: error.status ? error.message : 'The CMS could not complete this request. Please try again.' });
    }
  };
}

export function cmsPlugin() {
  const middleware = createCms();
  return { name: 'rakentaa-cms', configureServer(server) { server.middlewares.use(middleware); }, configurePreviewServer(server) { server.middlewares.use(middleware); } };
}
