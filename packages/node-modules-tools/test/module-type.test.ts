import fs from 'node:fs/promises'
import { resolvePath } from 'mlly'
import { resolvePackageJSON } from 'pkg-types'
import { expect, it } from 'vitest'
import { analyzePackageModuleType } from '../src/analyze-esm'

async function getPackageJsonPath(pkg: string) {
  // Resolve from this file so the lookup is deterministic (not hoist-order dependent).
  const url = import.meta.url
  return JSON.parse(await fs.readFile(
    await resolvePath(`${pkg}/package.json`, { url })
      .catch(async () => {
        return await resolvePackageJSON(await resolvePath(pkg, { url }))
      }),
    'utf-8',
  ))
}

it('types only', async () => {
  expect(analyzePackageModuleType(await getPackageJsonPath('type-fest')))
    .toEqual('dts')

  expect(analyzePackageModuleType(await getPackageJsonPath('@types/node')))
    .toEqual('dts')
})

it('dual', async () => {
  // h3 became ESM-only starting at v2 (all `exports` entries are `.mjs`, no
  // `require` condition) — vue still ships both conditions.
  expect(analyzePackageModuleType(await getPackageJsonPath('vue')))
    .toEqual('dual')

  expect(analyzePackageModuleType(await getPackageJsonPath('rollup-plugin-esbuild')))
    .toEqual('dual')
})

it('cjs', async () => {
  expect(analyzePackageModuleType(await getPackageJsonPath('debug')))
    .toEqual('cjs')
})

it('esm', async () => {
  expect(analyzePackageModuleType(await getPackageJsonPath('p-limit')))
    .toEqual('esm')
})
