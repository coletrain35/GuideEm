import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';
import { parseGuideInput, parseGuideMarkdown } from '../utils/markdownImporter';
import { AGENT_BLOCK_CATALOG } from '../utils/agentSchema';

export interface DiskGuideRecord {
  id: string;
  slug: string;
  fileName: string;
  title: string;
  tags?: string[];
  theme?: any;
  content: any;
  htmlContent: string;
  markdown?: string;
  lastEdited: number;
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'untitled-guide'
  );
}

function readBody(req: any, maxBytes = 10 * 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let settled = false;
    req.on('data', (c: Buffer) => {
      if (settled) return;
      const buf = Buffer.isBuffer(c) ? c : Buffer.from(c);
      totalBytes += buf.length;
      if (totalBytes > maxBytes) {
        settled = true;
        req.pause?.();
        reject(Object.assign(new Error('Payload Too Large'), { statusCode: 413 }));
        return;
      }
      chunks.push(buf);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', (err: any) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
  });
}

const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

function isLocalRequest(req: any): boolean {
  const rawAddr = req.socket?.remoteAddress || req.connection?.remoteAddress || '';
  return rawAddr === '127.0.0.1' || rawAddr === '::1' || rawAddr === '::ffff:127.0.0.1';
}

function getAllowedCorsOrigin(req: any): string | null {
  const origin = req.headers?.origin;
  if (typeof origin !== 'string' || !origin) return null;
  return LOCAL_ORIGIN_RE.test(origin) ? origin : null;
}

function sendJson(res: any, status: number, data: any, origin?: string | null) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  res.end(JSON.stringify(data, null, 2));
}

export function loadGuidesFromDir(guidesDir: string): DiskGuideRecord[] {
  if (!fs.existsSync(guidesDir)) return [];
  const entries = fs.readdirSync(guidesDir, { withFileTypes: true });
  const records: DiskGuideRecord[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (ext !== '.md' && ext !== '.json') continue;

    const fullPath = path.join(guidesDir, entry.name);
    const stat = fs.statSync(fullPath);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const baseSlug = entry.name.replace(/\.(guide\.json|json|md)$/i, '');

    try {
      if (ext === '.md') {
        const parsed = parseGuideMarkdown(raw);
        records.push({
          id: `file:${baseSlug}`,
          slug: baseSlug,
          fileName: entry.name,
          title: parsed.title || baseSlug.replace(/-/g, ' '),
          tags: parsed.tags,
          theme: parsed.theme,
          content: parsed.html,
          htmlContent: parsed.html,
          markdown: raw,
          lastEdited: Math.floor(stat.mtimeMs),
        });
      } else {
        const jsonObj = JSON.parse(raw);
        const parsed = parseGuideInput(jsonObj);
        records.push({
          id: parsed.id || `file:${baseSlug}`,
          slug: baseSlug,
          fileName: entry.name,
          title: parsed.title || baseSlug.replace(/-/g, ' '),
          tags: parsed.tags,
          theme: parsed.theme,
          content: parsed.content,
          htmlContent: parsed.htmlContent,
          markdown: jsonObj.markdown,
          lastEdited: jsonObj.lastEdited || Math.floor(stat.mtimeMs),
        });
      }
    } catch (err) {
      console.warn(`[guideEmAgentPlugin] Failed to parse ${entry.name}:`, err);
    }
  }

  return records.sort((a, b) => b.lastEdited - a.lastEdited);
}

export function guideEmAgentPlugin(guidesFolder = 'guides'): Plugin {
  return {
    name: 'guideem-agent-bridge',
    configureServer(server) {
      const guidesDir = path.resolve(server.config.root, guidesFolder);
      const recentWriteTimestamps = new Map<string, number>();
      const sseClients = new Set<any>();
      let watchTimer: ReturnType<typeof setTimeout> | null = null;

      try {
        if (!fs.existsSync(guidesDir)) {
          fs.mkdirSync(guidesDir, { recursive: true });
        }
        const watcher = fs.watch(guidesDir, (_eventType, rawName) => {
          const fileName = rawName ? String(rawName) : '';
          if (!fileName || (!fileName.endsWith('.md') && !fileName.endsWith('.json'))) return;
          const lastWrite = recentWriteTimestamps.get(fileName) || 0;
          if (Date.now() - lastWrite < 1500) return;
          if (watchTimer) clearTimeout(watchTimer);
          watchTimer = setTimeout(() => {
            const payload = JSON.stringify({ type: 'guides-updated', fileName, timestamp: Date.now() });
            sseClients.forEach((client) => {
              try {
                client.write(`data: ${payload}\n\n`);
              } catch {
                sseClients.delete(client);
              }
            });
          }, 250);
        });
        server.httpServer?.once('close', () => {
          if (watchTimer) clearTimeout(watchTimer);
          watcher.close();
        });
      } catch {
        // Ignore fs.watch errors on unsupported filesystems
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (!url.startsWith('/api/agent')) {
          return next();
        }

        if (!isLocalRequest(req)) {
          return sendJson(res, 403, { error: 'Forbidden: local requests only' });
        }

        const hasOrigin = typeof req.headers?.origin === 'string' && req.headers.origin.length > 0;
        const allowedOrigin = getAllowedCorsOrigin(req);
        if (hasOrigin && !allowedOrigin) {
          return sendJson(res, 403, { error: 'Forbidden: cross-origin request rejected' });
        }

        if (req.method === 'OPTIONS') {
          return sendJson(res, 200, { ok: true }, allowedOrigin);
        }

        if (url === '/api/agent/events' && req.method === 'GET') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache, no-transform');
          res.setHeader('Connection', 'keep-alive');
          if (allowedOrigin) {
            res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
            res.setHeader('Vary', 'Origin');
          }
          res.write(': connected\n\n');
          sseClients.add(res);
          req.on('close', () => { sseClients.delete(res); });
          return;
        }

        try {
          if (url === '/api/agent/schema' && req.method === 'GET') {
            return sendJson(res, 200, {
              name: 'GuideEm Agent Authoring Schema',
              guidesDirectory: guidesDir,
              blocks: AGENT_BLOCK_CATALOG,
            }, allowedOrigin);
          }

          if (url === '/api/agent/docs' && req.method === 'GET') {
            const docs = loadGuidesFromDir(guidesDir);
            return sendJson(res, 200, { docs }, allowedOrigin);
          }

          if (url.startsWith('/api/agent/docs/') && req.method === 'GET') {
            const target = decodeURIComponent(url.slice('/api/agent/docs/'.length));
            const docs = loadGuidesFromDir(guidesDir);
            const doc = docs.find(d => d.id === target || d.slug === target || d.fileName === target);
            if (!doc) return sendJson(res, 404, { error: 'Document not found' }, allowedOrigin);
            return sendJson(res, 200, { doc }, allowedOrigin);
          }

          if (url === '/api/agent/docs' && (req.method === 'POST' || req.method === 'PUT')) {
            const bodyStr = await readBody(req);
            const payload = JSON.parse(bodyStr || '{}');
            const parsed = parseGuideInput(payload);
            const slug = slugify(payload.slug || parsed.title || 'untitled-guide');

            if (!fs.existsSync(guidesDir)) {
              fs.mkdirSync(guidesDir, { recursive: true });
            }

            const format = payload.format === 'md' || (typeof payload.markdown === 'string' && !payload.blocks && !payload.content)
              ? 'md'
              : 'json';

            let fileName: string;
            if (format === 'md' && typeof payload.markdown === 'string') {
              fileName = `${slug}.md`;
              recentWriteTimestamps.set(fileName, Date.now());
              fs.writeFileSync(path.join(guidesDir, fileName), payload.markdown, 'utf8');
            } else {
              fileName = `${slug}.guide.json`;
              const toSave = {
                id: parsed.id || `file:${slug}`,
                title: parsed.title,
                tags: parsed.tags,
                theme: parsed.theme,
                blocks: payload.blocks,
                markdown: payload.markdown,
                content: parsed.content,
                htmlContent: parsed.htmlContent,
                lastEdited: Date.now(),
              };
              recentWriteTimestamps.set(fileName, Date.now());
              fs.writeFileSync(path.join(guidesDir, fileName), JSON.stringify(toSave, null, 2), 'utf8');
            }

            const docs = loadGuidesFromDir(guidesDir);
            const saved = docs.find(d => d.slug === slug) || docs[0];
            return sendJson(res, 200, { ok: true, doc: saved }, allowedOrigin);
          }

          if (url.startsWith('/api/agent/docs/') && req.method === 'DELETE') {
            const target = decodeURIComponent(url.slice('/api/agent/docs/'.length));
            const docs = loadGuidesFromDir(guidesDir);
            const doc = docs.find(d => d.id === target || d.slug === target || d.fileName === target);
            if (!doc) return sendJson(res, 404, { error: 'Document not found' }, allowedOrigin);
            const fullPath = path.join(guidesDir, doc.fileName);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
            return sendJson(res, 200, { ok: true, deleted: doc.id }, allowedOrigin);
          }

          return sendJson(res, 404, { error: `Unknown endpoint: ${req.method} ${url}` }, allowedOrigin);
        } catch (err: any) {
          if (err?.statusCode === 413) {
            return sendJson(res, 413, { error: 'Payload too large' }, allowedOrigin);
          }
          console.error('[guideEmAgentPlugin] Error:', err);
          return sendJson(res, 500, {
            error: err instanceof Error ? err.message : 'Internal server error',
          }, allowedOrigin);
        }
      });
    },
  };
}
