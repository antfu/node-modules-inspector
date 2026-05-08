#!/usr/bin/env node
// Minimal static file server used by the e2e webServer entries.
// Usage: node serve.mjs <dir> <port> [--coop-coep] [--spa-base <path>]
//
// --spa-base <path> changes the SPA fallback target so HTML navigation
// requests under <path> resolve to <path>/index.html instead of /index.html.
// Required when the inspector is mounted at a sub-base and the deploy root
// (the dir served here) sits one level above it.

import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, resolve } from 'node:path'
import process from 'node:process'

const args = process.argv.slice(2)
const dir = resolve(args[0] || '.')
const port = Number(args[1] || 0)
const coopCoep = args.includes('--coop-coep')
const spaBaseIdx = args.indexOf('--spa-base')
const spaBaseRaw = spaBaseIdx >= 0 ? args[spaBaseIdx + 1] : '/'
const spaBase = spaBaseRaw.endsWith('/') ? spaBaseRaw : `${spaBaseRaw}/`

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

async function resolveFile(urlPath) {
  // Strip query string
  const clean = urlPath.split('?')[0].split('#')[0]
  // Decode + prevent escape
  let decoded
  try {
    decoded = decodeURIComponent(clean)
  }
  catch {
    return null
  }
  if (decoded.includes('\0'))
    return null

  const candidates = []
  const target = join(dir, decoded)
  if (!target.startsWith(dir))
    return null
  candidates.push(target)
  if (decoded.endsWith('/'))
    candidates.push(join(target, 'index.html'))

  for (const candidate of candidates) {
    try {
      const s = await stat(candidate)
      if (s.isFile())
        return candidate
      if (s.isDirectory()) {
        const idx = join(candidate, 'index.html')
        const si = await stat(idx).catch(() => null)
        if (si?.isFile())
          return idx
      }
    }
    catch {}
  }
  return null
}

const server = createServer(async (req, res) => {
  if (coopCoep) {
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  }
  res.setHeader('Cache-Control', 'no-store')

  const urlPath = req.url || '/'
  let file = await resolveFile(urlPath)

  // SPA fallback for HTML navigation requests. When --spa-base is set,
  // requests under that path fall back to <spa-base>index.html so client
  // routes under a sub-base hydrate the right SPA shell.
  if (!file) {
    const accept = req.headers.accept || ''
    if (req.method === 'GET' && accept.includes('text/html')) {
      const cleanPath = (urlPath.split('?')[0].split('#')[0]) || '/'
      const target = spaBase !== '/' && cleanPath.startsWith(spaBase)
        ? `${spaBase}index.html`
        : '/index.html'
      file = await resolveFile(target)
    }
  }

  if (!file) {
    res.statusCode = 404
    res.end('Not Found')
    return
  }

  res.setHeader('Content-Type', MIME[extname(file)] || 'application/octet-stream')
  res.statusCode = 200
  createReadStream(file).pipe(res)
})

server.listen(port, '127.0.0.1', () => {
  const flags = [coopCoep ? 'COOP/COEP' : null, spaBase !== '/' ? `spa-base=${spaBase}` : null]
    .filter(Boolean)
    .join(', ')
  console.log(`[e2e:serve] ${dir} -> http://127.0.0.1:${port}${flags ? ` (${flags})` : ''}`)
})
