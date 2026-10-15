import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createCms } from './cms.mjs';

const root = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4173);
if (!['127.0.0.1', 'localhost', '::1'].includes(host) && !process.env.CMS_SETUP_TOKEN) throw new Error('Set CMS_SETUP_TOKEN before binding to a public interface. Complete setup over HTTPS.');
await stat(path.join(root, 'index.html')).catch(() => { throw new Error('Run npm run build before npm start.'); });
const cms = createCms();
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' };
const server = createServer((req, res) => cms(req, res, async () => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const relative = pathname === '/' || pathname === '/admin' || pathname === '/admin/' ? 'index.html' : pathname.slice(1);
    const target = path.resolve(root, relative);
    if (!target.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    const data = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': relative === 'index.html' ? 'no-cache' : 'public, max-age=3600', 'X-Frame-Options': 'DENY' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404); res.end('Not found'); }
}));
server.listen(port, host, () => console.log(`Rakentaa: http://${host}:${port}\nCMS: http://${host}:${port}/admin`));
