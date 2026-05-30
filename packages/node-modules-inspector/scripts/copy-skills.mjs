// Copies the repo-root `skills/` folder into this package so it ships in the
// published tarball at `<pkg>/skills/`. The root location is the source of
// truth (it's where humans and most agent-skills tooling look directly); this
// copy is what `skills-npm` and `npm install` consumers see.

import { existsSync } from 'node:fs'
import { cp, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = resolve(here, '../../../skills')
const dest = resolve(here, '../skills')

if (!existsSync(src)) {
  console.error(`[copy-skills] source not found: ${src}`)
  process.exit(1)
}

if (existsSync(dest))
  await rm(dest, { recursive: true })
await cp(src, dest, { recursive: true })

console.log(`[copy-skills] ${src} → ${dest}`)
