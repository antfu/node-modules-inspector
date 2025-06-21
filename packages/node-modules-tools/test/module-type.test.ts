import fs from 'node:fs/promises'
import { resolvePath } from 'mlly'
import { resolvePackageJSON } from 'pkg-types'
import { expect, it } from 'vitest'
import { analyzePackageModuleType } from '../src/analyze-esm'

async function getPackageJsonPath(pkg: string) {
  return JSON.parse(await fs.readFile(
    await resolvePath(`${pkg}/package.json`)
      .catch(async () => {
        return await resolvePackageJSON(await resolvePath(pkg))
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
  expect(analyzePackageModuleType(await getPackageJsonPath('h3')))
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
