import fs from 'node:fs/promises'
import { resolvePath } from 'mlly'
import { expect, it } from 'vitest'
import { analyzePackageModuleType } from '../src/analyze-esm'

async function getPackageJsonPath(pkg: string) {
  return JSON.parse(await fs.readFile(
    await resolvePath(`${pkg}/package.json`),
    'utf-8',
  ))
}

it('types only', async () => {
  expect(analyzePackageModuleType(await getPackageJsonPath('type-fest')))
    .toEqual('none')

  expect(analyzePackageModuleType(await getPackageJsonPath('@types/node')))
    .toEqual('none')
})

it('dual', async () => {
  expect(analyzePackageModuleType(await getPackageJsonPath('h3')))
    .toEqual('dual')
})

it('cjs', async () => {
  expect(analyzePackageModuleType(await getPackageJsonPath('picocolors')))
    .toEqual('cjs')
})

it('esm', async () => {
  expect(analyzePackageModuleType(await getPackageJsonPath('shiki')))
    .toEqual('esm')
})
