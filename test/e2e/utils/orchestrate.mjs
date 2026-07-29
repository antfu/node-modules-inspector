#!/usr/bin/env node
// Orchestrates the three "modes" the e2e suite tests against. Run by Playwright
// as a single `webServer` entry — declaring multiple webServers doesn't help
// here because Playwright starts them before `globalSetup` runs, so we can't
// build the static fixtures in time. Bundling build + serve into one process
// avoids that ordering trap and keeps the build steps serialized (they share
// `packages/node-modules-inspector/dist/public`).

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname)
const ROOT = path.resolve(SCRIPT_DIR, '../../..')
const INSPECTOR_PKG = path.join(ROOT, 'packages/node-modules-inspector')
const TOOLS_PKG = path.join(ROOT, 'packages/node-modules-tools')
const DIST_PUBLIC = path.join(INSPECTOR_PKG, 'dist/public')
const TOOLS_DIST = path.join(TOOLS_PKG, 'dist/index.mjs')
const FIXTURES = path.join(SCRIPT_DIR, '..', '.fixtures')
const FIXTURE_BUILD = path.join(FIXTURES, 'build')
const FIXTURE_WC = path.join(FIXTURES, 'wc')
// The e2e-only inspector config disables fetchNpmMeta + publint so the
// static export doesn't depend on the live npm registry — a cold-cache
// CI runner otherwise blows past Playwright's 10-minute webServer timeout
// fetching meta for ~2000 transitive deps.
const E2E_INSPECTOR_CONFIG = 'test/e2e/inspector.config'
// Sub-base fixture: parent dir served as root; inspector built into a
// `__node-modules-inspector/` subdir with `--base /__node-modules-inspector/`
// so the rewritten /_nuxt/* asset paths resolve under the sub-path.
const FIXTURE_BUILD_SUBBASE = path.join(FIXTURES, 'build-subbase')
const FIXTURE_BUILD_SUBBASE_OUT = path.join(FIXTURE_BUILD_SUBBASE, '__node-modules-inspector')

const PORT_DEV = Number(process.env.E2E_PORT_DEV || 13001)
const PORT_BUILD = Number(process.env.E2E_PORT_BUILD || 13002)
const PORT_WC = Number(process.env.E2E_PORT_WC || 13003)
const PORT_BUILD_SUBBASE = Number(process.env.E2E_PORT_BUILD_SUBBASE || 13004)
const FORCE = !!process.env.E2E_REBUILD

function run(cmd) {
  console.log(`[e2e:orchestrate] $ ${cmd}`)
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' })
}

async function copyDir(src, dest) {
  await fs.rm(dest, { recursive: true, force: true })
  await fs.mkdir(dest, { recursive: true })
  await fs.cp(src, dest, { recursive: true })
}

async function readMarker() {
  return fs.readFile(path.join(DIST_PUBLIC, '.e2e-mode'), 'utf-8').catch(() => '')
}

async function writeMarker(mode) {
  await fs.writeFile(path.join(DIST_PUBLIC, '.e2e-mode'), mode, 'utf-8')
}

async function ensureWebcontainerFixture() {
  if (!FORCE && existsSync(path.join(FIXTURE_WC, 'index.html'))) {
    console.log('[e2e:orchestrate] webcontainer fixture exists — skipping (set E2E_REBUILD=1 to force).')
    return
  }
  console.log('[e2e:orchestrate] Building webcontainer-mode bundle...')
  run('pnpm -C packages/node-modules-inspector run wc:build')
  await copyDir(DIST_PUBLIC, FIXTURE_WC)
  await writeMarker('webcontainer')
}

async function ensureMainBuildAndStaticFixture() {
  const hasFixture = existsSync(path.join(FIXTURE_BUILD, 'index.html'))
  const hasDist = existsSync(path.join(DIST_PUBLIC, 'index.html'))
  const distMode = await readMarker()
  if (!FORCE && hasFixture && hasDist && distMode === 'main') {
    console.log('[e2e:orchestrate] main build + static fixture present — skipping (set E2E_REBUILD=1 to force).')
    return
  }
  console.log('[e2e:orchestrate] Building main inspector bundle...')
  run('pnpm -C packages/node-modules-inspector run build')
  await writeMarker('main')

  console.log('[e2e:orchestrate] Generating static export via inspector CLI...')
  await fs.rm(FIXTURE_BUILD, { recursive: true, force: true })
  run(`node packages/node-modules-inspector/bin.mjs build --outDir ${path.relative(ROOT, FIXTURE_BUILD)} --config ${E2E_INSPECTOR_CONFIG}`)
}

async function ensureBuildSubbaseFixture() {
  if (!FORCE && existsSync(path.join(FIXTURE_BUILD_SUBBASE_OUT, 'index.html'))) {
    console.log('[e2e:orchestrate] sub-base build fixture present — skipping (set E2E_REBUILD=1 to force).')
    return
  }
  console.log('[e2e:orchestrate] Generating sub-base static export with --base /__node-modules-inspector/ ...')
  await fs.rm(FIXTURE_BUILD_SUBBASE, { recursive: true, force: true })
  await fs.mkdir(FIXTURE_BUILD_SUBBASE, { recursive: true })
  run(`node packages/node-modules-inspector/bin.mjs build --outDir ${path.relative(ROOT, FIXTURE_BUILD_SUBBASE_OUT)} --base /__node-modules-inspector/ --config ${E2E_INSPECTOR_CONFIG}`)
}

async function ensureToolsBuilt() {
  if (!FORCE && existsSync(TOOLS_DIST))
    return
  // The inspector CLI runs from `dist/cli.mjs` and resolves `node-modules-tools`
  // through node_modules — which symlinks back to this package's dist via the
  // workspace. Without this build, the CLI exits with ERR_MODULE_NOT_FOUND.
  console.log('[e2e:orchestrate] Building node-modules-tools...')
  run('pnpm -C packages/node-modules-tools run build')
}

async function buildFixtures() {
  await fs.mkdir(FIXTURES, { recursive: true })
  // node-modules-tools is a runtime dep of the inspector CLI; build it first.
  // Then webcontainer (it leaves dist/public in wc mode), then main (so the
  // dev CLI serves the right entry from dist/public). Each step is a no-op
  // when artifacts are already present.
  await ensureToolsBuilt()
  await ensureWebcontainerFixture()
  await ensureMainBuildAndStaticFixture()
  await ensureBuildSubbaseFixture()
}

async function startServers() {
  // Importing in-process keeps everything under one PID, so Playwright's
  // process tree teardown reaps all three servers cleanly.
  const { spawn } = await import('node:child_process')
  const children = []

  function start(label, cmd, args, env) {
    const child = spawn(cmd, args, {
      cwd: ROOT,
      env: { ...process.env, ...env },
      stdio: 'inherit',
    })
    child.on('exit', (code) => {
      console.error(`[e2e:orchestrate] ${label} exited (${code}) — shutting down`)
      for (const c of children) {
        if (c !== child)
          c.kill('SIGTERM')
      }
      process.exit(code ?? 1)
    })
    children.push(child)
  }

  start(
    'dev',
    'node',
    ['packages/node-modules-inspector/bin.mjs', '--port', String(PORT_DEV), '--host', '127.0.0.1', '--no-open'],
  )
  start(
    'build',
    'node',
    [path.join(SCRIPT_DIR, 'serve.mjs'), path.relative(ROOT, FIXTURE_BUILD), String(PORT_BUILD)],
  )
  start(
    'wc',
    'node',
    [path.join(SCRIPT_DIR, 'serve.mjs'), path.relative(ROOT, FIXTURE_WC), String(PORT_WC), '--coop-coep'],
  )
  start(
    'build-subbase',
    'node',
    [path.join(SCRIPT_DIR, 'serve.mjs'), path.relative(ROOT, FIXTURE_BUILD_SUBBASE), String(PORT_BUILD_SUBBASE), '--spa-base', '/__node-modules-inspector/'],
  )

  const shutdown = (signal) => {
    for (const c of children)
      c.kill(signal)
    process.exit(0)
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

await buildFixtures()
await startServers()
